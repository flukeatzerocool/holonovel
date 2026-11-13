#!/usr/bin/env node
// Adventure/encounter generation conformance harness (§5.9 — REQ-090/091). [gate]
// Exercises Appendix F tests T75, T76, T367 against a live server: adventure
// scaffold generation (novel + codex targets), regeneration replacement, and
// encounter batch generation with a single undo target.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { computeContentHash, PACKAGE_FORMAT } from "../src/rulesets.js";
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
let stderrBuf = "";
async function boot(env: Record<string, string> = {}): Promise<ChildProcess> {
  stderrBuf = "";
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  proc.stderr!.on("data", (d: Buffer) => { stderrBuf += d.toString(); });
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
async function promptText(proc: ChildProcess): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name: "badge_briefing" } });
  return (resp.result?.messages ?? []).map((m: any) => m?.content?.text ?? "").join("\n");
}
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
    writeFileSync(join(ADV_DIR, "sig-no-hash.md"), `---\ncreator: Ada Example\nlicense: CC BY 4.0\nsignature: ${sig}\n---\n${body}`);
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

    await test("T741/REQ-090: an empty World section preserves the existing world", async () => {
      writeFileSync(join(ADV_DIR, "flatworld.md"), "# Flat World\n\n## Premise\nA prose-only World section.\n\n## World\nNo room definitions here.\n");
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_novel", { action: "create", name: "f1-world" });
      const created = await call(proc, "manage_world", { action: "create_room", name: "Keep Hall", description: "A hall that must survive." });
      assertNotContains(created, "ERROR");
      const loaded = await call(proc, "manage_adventure", { action: "load", slug: "flatworld" });
      assertContains(loaded, "world-preserved");
      assertContains(loaded, "existing world model was kept");
      const persisted = JSON.parse(readFileSync(join(PROV_DATA, "novels", "f1-world.json"), "utf-8"));
      if (!persisted.world?.rooms?.["keep hall"]) throw new Error("existing room was lost");
    });

    await test("REQ-079a/REQ-622: adventure annotations materialize room hazards", async () => {
      writeFileSync(join(ADV_DIR, "hazard-module.md"), `# Hazard Module

## World
The Vault is a room. "A cold vault."
The Trap Hall is a room. "Stale air."

## Encounters
@encounter(The Vault) spill=2 resource="The Candle" — Two golems animate.

## Traps
@trap(Trap Hall) snuff="Dread" faces=6 resource="The Candle" — Darts.
@trap(The Vault) DC 13 Perception — prose-only annotation.
`);
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_novel", { action: "create", name: "h1-hazard" });
      const loaded = await call(proc, "manage_adventure", { action: "load", slug: "hazard-module" });
      assertContains(loaded, "loaded");
      assertContains(loaded, "encounters: 1");
      assertContains(loaded, "traps: 1");
      assertContains(loaded, "annotation not materialized");
      const persisted = JSON.parse(readFileSync(join(PROV_DATA, "novels", "h1-hazard.json"), "utf-8"));
      const vault = persisted.world?.rooms?.["the vault"];
      const trapHall = persisted.world?.rooms?.["the trap hall"];
      if (vault?.annotations?.encounter?.spill !== 2) throw new Error(`encounter not materialized: ${JSON.stringify(vault?.annotations)}`);
      if (vault.annotations.encounter.resource !== "The Candle") throw new Error("encounter resource lost");
      if (trapHall?.annotations?.trap?.faces !== 6) throw new Error(`trap not materialized: ${JSON.stringify(trapHall?.annotations)}`);
      if (trapHall.annotations.trap.snuff !== "Dread") throw new Error("trap snuff lost");
    });

    await test("T244/REQ-079a: adventure @npc and @lore annotations create Novel state", async () => {
      writeFileSync(join(ADV_DIR, "npc-lore-module.md"), `# NPC and Lore Module

## World
The Vault is a room. "A cold vault."
The Trap Hall is a room. "Stale air."

## NPCs
@npc(Ghost of the Vault, The Vault) AC 15, HP 45. Incorporeal.
@npc(Broken) no comma here.

## Lore
@lore(The Vault) The murals depict a serpent.
`);
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_novel", { action: "create", name: "a1-annotations" });
      const loaded = await call(proc, "manage_adventure", { action: "load", slug: "npc-lore-module" });
      assertContains(loaded, "NPCs: 1");
      assertContains(loaded, "lore: 1");
      assertContains(loaded, "expected '<Name>, <Room Name>'");
      const persisted = JSON.parse(readFileSync(join(PROV_DATA, "novels", "a1-annotations.json"), "utf-8"));
      const npcs = Object.values(persisted.npcs ?? {}) as any[];
      const ghost = npcs.find((npc) => npc.name === "Ghost of the Vault");
      if (!ghost) throw new Error(`@npc not materialized: ${JSON.stringify(npcs)}`);
      if (ghost.location !== "The Vault") throw new Error(`NPC location lost: ${ghost.location}`);
      if (ghost.room_id !== "the vault") throw new Error(`NPC room_id lost: ${ghost.room_id}`);
      if (!String(ghost.description ?? "").includes("AC 15")) throw new Error(`NPC description lost: ${ghost.description}`);
      if (ghost.provenance?.source !== "loaded:npc-lore-module") throw new Error(`NPC provenance lost: ${JSON.stringify(ghost.provenance)}`);
      const lore = persisted.lore?.["vault"];
      if (!lore) throw new Error(`@lore not materialized: ${JSON.stringify(persisted.lore)}`);
      if (lore.world_target !== "the vault") throw new Error(`lore world_target lost: ${lore.world_target}`);
      if (!lore.triggers?.includes("vault")) throw new Error(`lore triggers lost: ${JSON.stringify(lore.triggers)}`);
      if (lore.badge_scope !== "shared") throw new Error(`lore badge_scope: ${lore.badge_scope}`);
      if (!String(lore.content ?? "").includes("murals")) throw new Error(`lore content lost: ${lore.content}`);
    });

    await test("T244/REQ-079a/REQ-079d: a repeated load skips duplicate NPCs and lore", async () => {
      const reload = await call(proc, "manage_adventure", { action: "load", slug: "npc-lore-module" });
      assertContains(reload, "NPCs: 0");
      assertContains(reload, "lore: 0");
      assertContains(reload, "skipped (duplicate)");
      const persisted = JSON.parse(readFileSync(join(PROV_DATA, "novels", "a1-annotations.json"), "utf-8"));
      if (Object.keys(persisted.npcs ?? {}).length !== 1) throw new Error(`duplicate NPC created: ${JSON.stringify(persisted.npcs)}`);
      if (Object.keys(persisted.lore ?? {}).length !== 1) throw new Error(`duplicate lore created: ${JSON.stringify(persisted.lore)}`);
    });

    await test("T244/REQ-079a: unresolved annotation targets create state with free-text targets", async () => {
      writeFileSync(join(ADV_DIR, "unresolved-module.md"), `# Unresolved Module

@npc(Wanderer, Nowhere) A traveler with no room.
@lore(Nonesuch) Legends speak of it.
`);
      await call(proc, "manage_novel", { action: "create", name: "a1-unresolved" });
      const loaded = await call(proc, "manage_adventure", { action: "load", slug: "unresolved-module" });
      assertContains(loaded, "NPCs: 1");
      assertContains(loaded, "lore: 1");
      assertContains(loaded, "not in the world model");
      const persisted = JSON.parse(readFileSync(join(PROV_DATA, "novels", "a1-unresolved.json"), "utf-8"));
      const wanderer = (Object.values(persisted.npcs ?? {}) as any[]).find((npc) => npc.name === "Wanderer");
      if (!wanderer) throw new Error("@npc not materialized without a ## World section");
      if (wanderer.location !== "Nowhere") throw new Error(`free-text location lost: ${wanderer.location}`);
      if (wanderer.room_id !== undefined) throw new Error(`unresolved room got a room_id: ${wanderer.room_id}`);
      const lore = persisted.lore?.["nonesuch"];
      if (!lore) throw new Error("@lore not materialized without a ## World section");
      if (lore.world_target !== undefined) throw new Error(`unresolved lore got a world_target: ${lore.world_target}`);
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
      const sigNoHash = await call(proc, "manage_adventure", { action: "load", slug: "sig-no-hash" });
      assertContains(sigNoHash, "STATE_CONFLICT");
      assertContains(sigNoHash, "content_hash");
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

  // ── REQ-079/170/171/172/247 — adventure module surfaces ──
  {
    const ADV = mkdtempSync(join(tmpdir(), "holonovel-adv-blocks-"));
    const DATA = mkdtempSync(join(tmpdir(), "holonovel-adv-blocks-data-"));
    const TOOL = join(import.meta.dirname!, "generate-adventure-index.ts");
    const write = (slug: string, body: string) => writeFileSync(join(ADV, `${slug}.md`), body);
    write("serpent-hall", `# Serpent Hall\n\n## Overview — *Keeper only*\nA drowned hall.\n\n## Adventure Hook\nThe hall calls.\n\n## Scenes\n\n### Gate of Scales\nA gate of coiled stone.\n\n### Drowned Altar\nThe altar lies under black water.\n\n## NPCs\n\n**Bone Warden**\nAC 14. A skeletal guardian.\n\n## Keeper's Note — *Keeper only*\nThe warden answers to the drowned altar.\n`);
    write("moth-hollow", `# Moth Hollow\n\n## Overview — *Keeper only*\nA pale hollow.\n\n## Adventure Hook\nThe moths are waiting.\n\n## Scenes\n\n### Pale Door\nA door furred with wings.\n`);
    execFileSync("npx", ["tsx", TOOL, "--input", ADV, "--out", join(ADV, "index.json")], { encoding: "utf-8" });

    // T206 — not-found enumerates slugs; a valid slug loads.
    const p = await boot({ TTRPG_ADVENTURE_DIR: ADV, TTRPG_DATA_DIR: DATA });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_novel", { action: "create", name: "blocks" });
    await test("T206/REQ-079g: load not-found enumerates available slugs", async () => {
      const missing = await call(p, "manage_adventure", { action: "load", slug: "no-such-adventure" });
      assertContains(missing, "[NOT_FOUND]");
      assertContains(missing, "serpent-hall");
      assertContains(missing, "moth-hollow");
      if (missing.includes(ADV)) throw new Error("NOT_FOUND must not enumerate directories");
      const okLoad = await call(p, "manage_adventure", { action: "load", slug: "serpent-hall" });
      assertContains(okLoad, "Pre-populated: 1 NPCs");
      assertContains(okLoad, "2 lore entries");
    });

    // T287 — pre-population, skeletal combat, duplicate skip, monster suggestion.
    await test("T287/REQ-079c/d: pre-population, skeletal NPC combat, duplicate skip, suggestion", async () => {
      const reload = await call(p, "manage_adventure", { action: "load", slug: "serpent-hall" });
      assertContains(reload, "Skipped duplicate NPC 'Bone Warden'");
      const npcs = JSON.parse(await call(p, "manage_npc", { action: "list" }));
      const warden = Object.values(npcs as any).find((n: any) => n.name === "Bone Warden") as any;
      if (!warden) throw new Error(`pre-populated NPC missing: ${JSON.stringify(npcs)}`);
      await call(p, "manage_combat", { action: "init", participants: [warden.id] });
      const advance = await call(p, "manage_combat", { action: "advance" });
      assertContains(advance, "[auto]");
      await call(p, "manage_combat", { action: "end" });
    });

    // T59 — anchor resource, Keeper-only refusal, search confidence.
    await test("T59/REQ-079e: per-anchor resources, Keeper-only, and search confidence", async () => {
      const anchor = await readResource(p, "adventure://serpent-hall/drowned-altar");
      assertContains(anchor, "Drowned Altar");
      assertContains(anchor, "black water");
      const overviewAnchor = await readResource(p, "adventure://serpent-hall/overview");
      assertContains(overviewAnchor, "drowned hall");
      await call(p, "set_badge", { badge: "player" });
      const forbidden = await readResource(p, "adventure://serpent-hall/keepers-note");
      assertContains(forbidden, "[FORBIDDEN]");
      const bodyHit = await call(p, "manage_ruleset", { action: "search", query: "black water" });
      assertContains(bodyHit, "[MEDIUM]");
      const headingHit = await call(p, "manage_ruleset", { action: "search", query: "Drowned Altar" });
      assertContains(headingHit, "[HIGH]");
      await call(p, "set_badge", { badge: "game_master" });
    });

    // T60 — isolation: A's NPCs persist, A's prose leaves the briefing.
    await test("T60/REQ-079: loading B preserves A's entities and drops A's prose", async () => {
      await call(p, "manage_adventure", { action: "load", slug: "moth-hollow" });
      const npcs = JSON.parse(await call(p, "manage_npc", { action: "list" }));
      if (!Object.values(npcs as any).some((n: any) => n.name === "Bone Warden")) throw new Error("T60 NPCs must persist across a load");
      const brief = await promptText(p);
      if (brief.includes("The hall calls.")) throw new Error("T60 adventure A's prose leaked into the briefing");
      assertContains(brief, "The moths are waiting.");
    });

    // T61 — restart continuity.
    await test("T61/REQ-079: restart restores the active adventure, NPCs, and scene", async () => {
      await call(p, "manage_scene", { action: "set", description: "the pale door", adventure_scene: "Pale Door" });
      await kill(p);
      const p2 = await boot({ TTRPG_ADVENTURE_DIR: ADV, TTRPG_DATA_DIR: DATA });
      await call(p2, "manage_novel", { action: "resume", slug: "blocks" });
      const brief = await promptText(p2);
      assertContains(brief, "moth-hollow");
      assertContains(brief, "Adventure Scene (moth-hollow § Pale Door)");
      const npcs = JSON.parse(await call(p2, "manage_npc", { action: "list" }));
      if (!Object.values(npcs as any).some((n: any) => n.name === "Bone Warden")) throw new Error("T61 NPCs lost across restart");
      await kill(p2);
    });

    // T208/T209 — malformed/partial/skipped and drift, both from a temp index.
    await test("T208/REQ-171b + T209/REQ-172: malformed flags, partial serving, skipped omission, drift", async () => {
      const DIR = mkdtempSync(join(tmpdir(), "holonovel-adv-malformed-"));
      const D2 = mkdtempSync(join(tmpdir(), "holonovel-adv-malformed-data-"));
      writeFileSync(join(DIR, "partial.md"), `# Partial Module\n\n## Adventure Hook\nA partial hook.\n\n### Open Hall\nAn open hall.\n`);
      writeFileSync(join(DIR, "skipped.md"), `No title at all.\n`);
      const index = {
        modules: {
          partial: { title: "Partial Module", content_hash: createHash("sha256").update(readFileSync(join(DIR, "partial.md"))).digest("hex"), player_visible: true, source: "build", malformed: [{ flag: "[malformed-adventure]", convention: "## Overview", disposition: "partial" }] },
          skipped: { title: "skipped", content_hash: createHash("sha256").update(readFileSync(join(DIR, "skipped.md"))).digest("hex"), player_visible: false, source: "build", malformed: [{ flag: "[malformed-adventure]", convention: "H1 title", disposition: "skipped" }] },
        },
      };
      writeFileSync(join(DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
      const p3 = await boot({ TTRPG_ADVENTURE_DIR: DIR, TTRPG_DATA_DIR: D2 });
      await call(p3, "set_badge", { badge: "game_master" });
      await call(p3, "manage_novel", { action: "create", name: "malformed" });
      const health = JSON.parse(await call(p3, "manage_diagnostics", { action: "health" }));
      const partial = health.indexed_adventures?.partial;
      if (!partial || partial.malformed?.[0]?.flag !== "[malformed-adventure]") throw new Error(`T208 malformed flag missing: ${JSON.stringify(health.indexed_adventures)}`);
      if (partial.malformed[0].convention !== "## Overview") throw new Error("T208 convention missing");
      const cat = await call(p3, "manage_adventure", { action: "list" });
      if (cat.includes("skipped")) throw new Error("T208 a skipped adventure must be absent from the catalog");
      const skippedLoad = await call(p3, "manage_adventure", { action: "load", slug: "skipped" });
      assertContains(skippedLoad, "[NOT_FOUND]");
      await call(p3, "manage_adventure", { action: "load", slug: "partial" });
      const partialAnchor = await readResource(p3, "adventure://partial/open-hall");
      assertContains(partialAnchor, "open hall");
      await kill(p3);
      // Drift: change the module after the index was written, then restart.
      writeFileSync(join(DIR, "partial.md"), `# Partial Module\n\n## Adventure Hook\nChanged.\n\n### Open Hall\nAn open hall.\n`);
      const p4 = await boot({ TTRPG_ADVENTURE_DIR: DIR, TTRPG_DATA_DIR: D2 });
      const health2 = JSON.parse(await call(p4, "manage_diagnostics", { action: "health" }));
      const drift = (health2.adventure_drift ?? []).find((d: any) => d.slug === "partial");
      if (!drift || drift.flag !== "[adventure-drift]" || !drift.detected_at) throw new Error(`T209 drift entry missing: ${JSON.stringify(health2.adventure_drift)}`);
      if (!stderrBuf.includes("[adventure-drift]")) throw new Error("T209 stderr warning missing");
      await kill(p4);
    });

    // T283 — the build tool extracts a non-Appendix-K module and tolerates garbled input.
    await test("T283/REQ-247c: structural extraction and the empty-index path", async () => {
      const B = mkdtempSync(join(tmpdir(), "holonovel-adv-build-"));
      const O = mkdtempSync(join(tmpdir(), "holonovel-adv-build-out-"));
      writeFileSync(join(B, "raw-prose.md"), `# Raw Prose\n\n## Overview — *Keeper only*\nProse.\n\n## Adventure Hook\nA hook.\n\n### Hall of Bones\nBones line the hall.\n\n**Bone Warden**\nAC 14.\n\n## Factions\n\n**Bone Guild** — controls the hall.\n`);
      writeFileSync(join(B, "garbled.md"), "\uFFFD\uFFFD\uFFFD\nno structure\n");
      const json = JSON.parse(execFileSync("npx", ["tsx", TOOL, "--input", B, "--out", join(O, "index.json"), "--json"], { encoding: "utf-8" }));
      const prose = json.modules["raw-prose"];
      if (!prose || prose.locations < 1 || prose.npcs < 1 || prose.factions < 1) throw new Error(`T283 extraction incomplete: ${JSON.stringify(prose)}`);
      if (prose.malformed.length !== 0) throw new Error("T283 a required-heading module must not be flagged malformed");
      const garbled = json.modules["garbled"];
      if (!garbled || garbled.locations !== 0) throw new Error(`T283 garbled module must yield an empty structure: ${JSON.stringify(garbled)}`);
    });

    // T368 — codex load with no active Novel.
    await test("T368/REQ-079h/i: codex load stores the scaffold and survives restart", async () => {
      const D3 = mkdtempSync(join(tmpdir(), "holonovel-adv-codex-data-"));
      const p5 = await boot({ TTRPG_ADVENTURE_DIR: ADV, TTRPG_DATA_DIR: D3 });
      await call(p5, "set_badge", { badge: "game_master" });
      await call(p5, "manage_novel", { action: "create", name: "codex" });
      await call(p5, "manage_novel", { action: "end", dispose: "yes" });
      const loaded = await call(p5, "manage_adventure", { action: "load", slug: "serpent-hall", target: "codex" });
      assertContains(loaded, "Codex adventure");
      assertContains(loaded, "loaded:serpent-hall");
      const listed = await call(p5, "manage_codex", { action: "list", kind: "adventure" });
      assertContains(listed, "serpent-hall");
      const got = await call(p5, "manage_codex", { action: "get", id: "adventure_serpent_hall" });
      assertContains(got, "loaded:serpent-hall");
      assertContains(got, "Drowned Altar");
      await kill(p5);
      const p6 = await boot({ TTRPG_ADVENTURE_DIR: ADV, TTRPG_DATA_DIR: D3 });
      await call(p6, "set_badge", { badge: "game_master" });
      const survived = await call(p6, "manage_codex", { action: "get", id: "adventure_serpent_hall" });
      assertContains(survived, "loaded:serpent-hall");
      await kill(p6);
    });

    rmSync(ADV, { recursive: true, force: true });
    rmSync(DATA, { recursive: true, force: true });
  }

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
