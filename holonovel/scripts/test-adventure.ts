#!/usr/bin/env node
// Adventure/encounter generation conformance harness (§5.9 — REQ-090/091). [gate]
// Exercises Appendix F tests T75, T76, T367 against a live server: adventure
// scaffold generation (novel + codex targets), regeneration replacement, and
// encounter batch generation with a single undo target.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createHash, createHmac } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { resourceReader } from "./lib/jsonrpc.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-adventure-test-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}"`);
}

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";

function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: ChildProcess): void {
  buffer = "";
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
      } catch { /* non-JSON */ }
    }
  });
}
async function boot(env: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "adventure-test", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 250));
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}
const readResource = resourceReader(send);
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}

async function main() {
  console.log("=== Adventure / encounter generation (§5.9 REQ-090/091) ===\n");

  {
    const proc = await boot();
    await call(proc, "set_badge", { badge: "game_master" });

    await call(proc, "manage_novel", { action: "create",  name: "gen", description: "generation test" });

    await test("T75: generate_adventure produces a full scaffold (title, overview, hook, locations, npcs, seeds)", async () => {
      const out = await call(proc, "manage_adventure", { action: "generate",  premise: "The goblin king demands tribute" });
      assertContains(out, "goblin king demands tribute");
      assertContains(out, "Overview");
      assertContains(out, "Hook");
      assertContains(out, "Location");
      assertContains(out, "NPC suggestions");
      assertContains(out, "Encounter seed");
    });

    await test("T75: generated adventure is stored on the active Novel", async () => {
      const ex = JSON.parse(await call(proc, "manage_archive", { action: "export",  format: "json" }));
      if (!ex.novel.generated_adventure) throw new Error("generated_adventure not stored on Novel");
      assertContains(JSON.stringify(ex.novel.generated_adventure), "goblin king");
    });

    await test("T75: regenerate with same premise replaces (deterministic)", async () => {
      const a = await call(proc, "manage_adventure", { action: "generate",  premise: "The dragon hoard" });
      const b = await call(proc, "manage_adventure", { action: "generate",  premise: "The dragon hoard" });
      if (a !== b) throw new Error("identical premise should yield identical scaffold (regeneration replaces)");
    });

    await test("T367: generate_adventure target=codex with no Novel active", async () => {
      await call(proc, "manage_novel", { action: "end",  dispose: "yes" });
      const out = await call(proc, "manage_adventure", { action: "generate",  premise: "The dragon hoard", target: "codex" });
      assertContains(out, "Codex adventure");
      const list = JSON.parse(await call(proc, "manage_codex", { action: "list",  kind: "adventure" }));
      if (!Array.isArray(list) || !list.some((e: any) => e.kind === "adventure")) throw new Error(`expected codex adventure entry, got ${JSON.stringify(list)}`);
    });

    await test("T367: codex adventure persists across restart", async () => {
      await kill(proc);
      const proc2 = await boot();
      await call(proc2, "set_badge", { badge: "game_master" });
      const list = JSON.parse(await call(proc2, "manage_codex", { action: "list",  kind: "adventure" }));
      if (!Array.isArray(list) || !list.some((e: any) => e.kind === "adventure")) throw new Error("codex adventure did not survive restart");
      await kill(proc2);
    });
  }

  {
    const proc = await boot();
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_novel", { action: "create",  name: "enc", description: "encounter test" });

    await test("T76: generate_encounter produces scene + NPC + lore as a batch", async () => {
      const out = await call(proc, "manage_adventure", { action: "generate_encounter",  context: "dark alley" });
      assertContains(out, "Scene");
      assertContains(out, "NPC");
      assertContains(out, "Complication");
      assertContains(out, "Undo rolls back");
    });

    await test("T76: the batch created an NPC and a lore entry", async () => {
      const ex = JSON.parse(await call(proc, "manage_archive", { action: "export",  format: "json" }));
      const npcCount = Object.keys(ex.novel.npcs).length;
      const loreKeys = Object.keys(ex.novel.lore);
      if (npcCount < 1) throw new Error(`expected >=1 NPC, got ${npcCount}`);
      if (!loreKeys.some((k: string) => k.startsWith("complication_"))) throw new Error(`expected complication_* lore entry, got ${JSON.stringify(loreKeys)}`);
    });

    await test("T76: undo rolls back scene + NPC + lore as one target", async () => {
      const exBefore = JSON.parse(await call(proc, "manage_archive", { action: "export",  format: "json" }));
      const npcsBefore = Object.keys(exBefore.novel.npcs).length;
      const loreBefore = Object.keys(exBefore.novel.lore).length;
      await call(proc, "manage_adventure", { action: "generate_encounter",  context: "second alley" });
      await call(proc, "manage_history", {});
      const exAfter = JSON.parse(await call(proc, "manage_archive", { action: "export",  format: "json" }));
      if (Object.keys(exAfter.novel.npcs).length !== npcsBefore) throw new Error(`undo did not restore npc count (${npcsBefore} → ${Object.keys(exAfter.novel.npcs).length})`);
      if (Object.keys(exAfter.novel.lore).length !== loreBefore) throw new Error(`undo did not restore lore count (${loreBefore} → ${Object.keys(exAfter.novel.lore).length})`);
    });

    await test("T76: Player badge attempt returns [FORBIDDEN]", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const out = await call(proc, "manage_adventure", { action: "generate_encounter",  context: "lamp" });
      assertContains(out, "FORBIDDEN");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await kill(proc);
  }

  {
    // REQ-616/REQ-617 — provenance block, verification, and embed round-trip.
    const ADV_DIR = mkdtempSync(join(tmpdir(), "holonovel-adventure-modules-"));
    const PROV_DATA = mkdtempSync(join(tmpdir(), "holonovel-adventure-prov-"));
    const body = "# Provenance Quest\n\n## Adventure Hook\nA signed module.\n\n## World\nThe Hall is a room. \"A hall.\"\n";
    const hash = createHash("sha256").update(body).digest("hex");
    const key = "test-artifact-key";
    const sig = createHmac("sha256", key).update(hash).digest("hex");
    writeFileSync(join(ADV_DIR, "good.md"), `---\ncreator: Ada Example\nattribution: Table One\nlicense: CC BY 4.0\ncontent_hash: ${hash}\nsignature: ${sig}\n---\n${body}`);
    writeFileSync(join(ADV_DIR, "tampered.md"), `---\ncreator: Ada Example\nlicense: CC BY 4.0\ncontent_hash: ${"0".repeat(64)}\n---\n${body}`);
    writeFileSync(join(ADV_DIR, "badsig.md"), `---\ncreator: Ada Example\nlicense: CC BY 4.0\ncontent_hash: ${hash}\nsignature: ${"0".repeat(64)}\n---\n${body}`);
    writeFileSync(join(ADV_DIR, "unsigned.md"), `---\ncreator: Ada Example\nlicense: CC BY 4.0\ncontent_hash: ${hash}\n---\n${body}`);
    writeFileSync(join(ADV_DIR, "plain.md"), body);
    // Appendix K places no line cap on the block; a block longer than 40 lines
    // must still parse (regression guard for the fixed line scan).
    const longBlock = `---\ncreator: Ada Example\n${Array.from({ length: 45 }, (_, i) => `attribution: line ${i}`).join("\n")}\ncontent_hash: ${hash}\n---\n${body}`;
    writeFileSync(join(ADV_DIR, "longprov.md"), longBlock);

    const proc = await boot({ TTRPG_ADVENTURE_DIR: ADV_DIR, TTRPG_DATA_DIR: PROV_DATA, TTRPG_EXPORT_EMBED_ADVENTURES: "true", TTRPG_ARTIFACT_VERIFY_KEY: key });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_novel", { action: "create", name: "provenance" });

    await test("T734/REQ-616: adventure provenance surfaces and survives embed/import", async () => {
      const list = await call(proc, "manage_adventure", { action: "list" });
      assertContains(list, "Ada Example");
      assertContains(list, "CC BY 4.0");
      const catalog = await readResource(proc, "adventures://");
      assertContains(catalog, "Ada Example");
      const loaded = await call(proc, "manage_adventure", { action: "load", slug: "good" });
      assertContains(loaded, "Ada Example");
      const longLoaded = await call(proc, "manage_adventure", { action: "load", slug: "longprov" });
      assertContains(longLoaded, "Ada Example");
      assertNotContains(longLoaded, "[provenance-absent]");
      const exported = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json" }));
      if (exported.adventure?.provenance?.creator !== "Ada Example") {
        throw new Error(`export did not carry provenance: ${JSON.stringify(exported.adventure)}`);
      }
      await call(proc, "manage_novel", { action: "create", name: "provenance-import" });
      await call(proc, "manage_archive", { action: "import", data: JSON.stringify(exported), mode: "replace" });
      const reexport = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json" }));
      if (reexport.adventure?.provenance?.creator !== "Ada Example") throw new Error("import lost module provenance");
    });

    await test("T740/REQ-096m: a shared bundle materializes its adventure on a fresh installation", async () => {
      await call(proc, "manage_adventure", { action: "load", slug: "good" });
      const shared = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json", share: true }));
      if (!shared.adventure?.content_hash) throw new Error("share export did not embed adventure content");
      const freshData = mkdtempSync(join(tmpdir(), "holonovel-adventure-share-"));
      const proc2 = await boot({ TTRPG_DATA_DIR: freshData });
      try {
        await call(proc2, "set_badge", { badge: "game_master" });
        await call(proc2, "manage_novel", { action: "create", name: "shared-import" });
        const imported = await call(proc2, "manage_archive", { action: "import", data: JSON.stringify(shared), mode: "replace" });
        assertNotContains(imported, "STATE_CONFLICT");
        const loaded = await call(proc2, "manage_adventure", { action: "load", slug: "good" });
        assertContains(loaded, "Ada Example");
        assertNotContains(loaded, "NOT_FOUND");
      } finally {
        await kill(proc2);
        rmSync(freshData, { recursive: true, force: true });
      }
    });

    await test("T740/REQ-096m: a tampered embedded adventure blocks import", async () => {
      await call(proc, "manage_adventure", { action: "load", slug: "good" });
      const shared = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json", share: true }));
      shared.adventure.content = `${shared.adventure.content}\ntampered`;
      const importOut = await call(proc, "manage_archive", { action: "import", data: JSON.stringify(shared), mode: "replace" });
      assertContains(importOut, "STATE_CONFLICT");
      assertContains(importOut, "hash mismatch");
    });

    await test("T735/REQ-617: adventure hash and signature mismatches are refused", async () => {
      const tampered = await call(proc, "manage_adventure", { action: "load", slug: "tampered" });
      assertContains(tampered, "STATE_CONFLICT");
      assertContains(tampered, "content_hash");
      assertContains(tampered, "expected");
      const badsig = await call(proc, "manage_adventure", { action: "load", slug: "badsig" });
      assertContains(badsig, "STATE_CONFLICT");
      assertContains(badsig, "signature");
      const unsigned = await call(proc, "manage_adventure", { action: "load", slug: "unsigned" });
      assertContains(unsigned, "loaded");
      await kill(proc);
    });

    const proc2 = await boot({ TTRPG_ADVENTURE_DIR: ADV_DIR, TTRPG_DATA_DIR: PROV_DATA });
    await call(proc2, "set_badge", { badge: "game_master" });
    await call(proc2, "manage_novel", { action: "create", name: "no-key" });

    await test("T735/REQ-617: a declared signature without a configured key warns and loads", async () => {
      const signed = await call(proc2, "manage_adventure", { action: "load", slug: "good" });
      assertContains(signed, "[signature-unverified]");
      const plain = await call(proc2, "manage_adventure", { action: "load", slug: "plain" });
      assertContains(plain, "[WARNING] [provenance-absent]");
      await kill(proc2);
    });

    rmSync(ADV_DIR, { recursive: true, force: true });
    rmSync(PROV_DATA, { recursive: true, force: true });
  }

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
