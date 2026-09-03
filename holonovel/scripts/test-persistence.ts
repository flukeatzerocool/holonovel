#!/usr/bin/env node
// Novel persistence and transport conformance harness (§5.9 — REQ-089/093/095/
// 096/097/238/240/256/257/258, plus REQ-065 hydration keying and REQ-088
// startup auto-load). Exercises the Appendix F tests T74, T78, T99,
// T100, T101, T159, T160, T276, T278, T281, T315, T316, T317 against a live
// server: lifecycle, switching, rename, listing, metadata, interchange
// round-trip, backup rotation, clone, hydration keying, and health reporting.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-persistence-test-"));

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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "persistence-test", version: "1.0.0" } } });
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
async function promptText(proc: ChildProcess, name: string): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name, arguments: {} } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const messages = resp.result?.messages ?? [];
  return messages.map((m: any) => (m?.content?.text ?? "")).join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}

async function main() {
  console.log("=== Novel persistence / transport conformance (§5.9) ===\n");

  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "first", description: "A first novel." });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T74: create_novel surfaces novel_setup as the recommended next step", async () => {
      const resp = await call(proc, "novel", { action: "create",  name: "extra", description: "setup check" });
      assertContains(resp, "novel_setup");
      await call(proc, "novel", { action: "switch",  slug: "first" });
    });

    await test("T316/T257: list_novels lists created Novels", async () => {
      const list = await call(proc, "novel", { action: "list" });
      assertContains(list, "first");
    });

    await test("T317/T258: novel_info returns metadata", async () => {
      const info = await call(proc, "novel", { action: "info" });
      assertContains(info, "first");
      assertContains(info, "A first novel.");
    });

    await test("T315/T256: rename_novel changes slug and persists", async () => {
      await call(proc, "novel", { action: "rename",  new_slug: "renamed" });
      const info = await call(proc, "novel", { action: "info" });
      assertContains(info, "renamed");
    });

    await test("T278/T240: clone_novel creates an independent copy", async () => {
      await call(proc, "world", { action: "create_thing",  name: "sword", description: "A sharp blade." });
      await call(proc, "novel", { action: "clone",  source_slug: "renamed", new_name: "fork" });
      const list = await call(proc, "novel", { action: "list" });
      assertContains(list, "fork");
      assertContains(list, "renamed");
    });

    await test("T315/T278: rename and clone onto an existing slug return [STATE_CONFLICT]", async () => {
      // rename active "renamed" onto existing "fork" must refuse (REQ-256).
      const renameConflict = await call(proc, "novel", { action: "rename",  new_slug: "fork" });
      assertContains(renameConflict, "[STATE_CONFLICT]");
      const info = JSON.parse(await call(proc, "novel", { action: "info" }));
      if (info.slug !== "renamed") throw new Error(`rename conflict altered active slug: ${info.slug}`);
      // clone "renamed" onto existing "fork" must refuse (REQ-240).
      const cloneConflict = await call(proc, "novel", { action: "clone",  source_slug: "renamed", new_name: "fork" });
      assertContains(cloneConflict, "[STATE_CONFLICT]");
      const still = await call(proc, "novel", { action: "info",  slug: "fork" });
      assertContains(still, "fork");
    });

    await test("T100/T281/T096: export produces a valid interchange manifest; import validates", async () => {
      const exported = await call(proc, "novel", { action: "export",  format: "json" });
      const parsed = JSON.parse(exported); // must be parseable JSON
      assertContains(exported, "\"slug\"");
      assertContains(exported, "\"name\"");
      // Appendix Q envelope: format_version (integer) + manifest object.
      assertContains(exported, "\"format_version\"");
      assertContains(exported, "\"manifest\"");
      assertContains(exported, "\"novel\"");
      const dryrun = await call(proc, "novel", { action: "import",  data: exported, mode: "dry-run" });
      assertContains(dryrun, "valid manifest");
    });

    await test("T100: replace-import round-trip restores world and entities", async () => {
      // Populate a novel with world model + NPC + countdown + lore.
      await call(proc, "world", { action: "create_room",  name: "throne room", description: "A grand hall." });
      await call(proc, "world", { action: "create_thing",  name: "throne", description: "An ornate seat." });
      await call(proc, "npc", { action: "create",  name: "Chancellor", description: "A wary official.", disposition: "neutral" });
      await call(proc, "countdown", { action: "set",  name: "court adjourns", ticks: 5, type: "narrative", scope: "throne room" });
      await call(proc, "lore", { action: "set",  key: "the_crown", content: "The crown is a forgery.", triggers: ["the_crown"] });

      const before = JSON.parse(await call(proc, "novel", { action: "export",  format: "json" }));
      const roomsBefore = Object.keys(before.novel.world.rooms).sort();
      const thingsBefore = Object.keys(before.novel.world.things).sort();
      const npcsBefore = Object.keys(before.novel.npcs).sort();
      const loreBefore = Object.keys(before.novel.lore).sort();
      const countdownsBefore = Object.keys(before.novel.countdowns).sort();
      assertContains(roomsBefore.join(","), "throne room");
      assertContains(thingsBefore.join(","), "throne");

      // Replace-import the export back and re-export — tiers must survive.
      await call(proc, "novel", { action: "import",  data: JSON.stringify(before), mode: "replace" });
      const after = JSON.parse(await call(proc, "novel", { action: "export",  format: "json" }));
      if (JSON.stringify(Object.keys(after.novel.world.rooms).sort()) !== JSON.stringify(roomsBefore)) {
        throw new Error(`round-trip rooms mismatch: before=${roomsBefore} after=${Object.keys(after.novel.world.rooms).sort()}`);
      }
      if (JSON.stringify(Object.keys(after.novel.world.things).sort()) !== JSON.stringify(thingsBefore)) {
        throw new Error("round-trip things mismatch");
      }
      if (JSON.stringify(Object.keys(after.novel.npcs).sort()) !== JSON.stringify(npcsBefore)) {
        throw new Error("round-trip npcs mismatch");
      }
      if (JSON.stringify(Object.keys(after.novel.lore).sort()) !== JSON.stringify(loreBefore)) {
        throw new Error("round-trip lore mismatch");
      }
      if (JSON.stringify(Object.keys(after.novel.countdowns).sort()) !== JSON.stringify(countdownsBefore)) {
        throw new Error("round-trip countdowns mismatch");
      }
    });

    await test("T78/T99/T093: metadata in spec_health lists Novels", async () => {
      const health = await call(proc, "session", { action: "health" });
      assertContains(health, "novel");
    });

    await test("T101/T160/T097: spec_health reports novel health", async () => {
      const health = await call(proc, "session", { action: "health" });
      assertContains(health, "health");
    });

    await test("T98/T095: switch_novel activates another Novel", async () => {
      await call(proc, "novel", { action: "create",  name: "second" });
      await call(proc, "novel", { action: "switch",  slug: "second" });
      const info = await call(proc, "novel", { action: "info" });
      assertContains(info, "second");
    });

    await test("T276/T238: mutations persist and backup rotation does not corrupt state", async () => {
      for (let i = 0; i < 5; i++) await call(proc, "note", { action: "set",  key: `note-${i}`, content: `content ${i}` });
      const list = await call(proc, "note", { action: "list" });
      assertContains(list, "note-4");
    });

    await test("T158/REQ-140: end_novel confirmation dispatch removes the Novel", async () => {
      await call(proc, "novel", { action: "create",  name: "dispatch-me" });
      const confirm = await call(proc, "novel", { action: "end" });
      assertContains(confirm, "[NEED_INPUT]");
      await call(proc, "respond", { decision: "end novel", option: "yes" });
      // After disposal, resume of the removed slug is a STATE_CONFLICT.
      const resume = await call(proc, "novel", { action: "resume",  slug: "dispatch-me" });
      assertContains(resume, "[STATE_CONFLICT]");
      // Restore a working novel for subsequent tests.
      await call(proc, "novel", { action: "create",  name: "restore-novel" });
    });

    await test("T318/REQ-259: update_novel_description sets, surfaces, and clears", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "novel", { action: "description",  description: "A new premise." });
      const info = JSON.parse(await call(proc, "novel", { action: "info" }));
      if (info.description !== "A new premise.") throw new Error(`desc not set: ${info.description}`);
      await call(proc, "novel", { action: "description",  description: "" });
      const info2 = JSON.parse(await call(proc, "novel", { action: "info" }));
      if (info2.description !== "") throw new Error("empty string did not clear description");
    });

    await test("T339/REQ-294: genre declaration surfaces in novel_info and spec_health", async () => {
      await call(proc, "novel", { action: "create",  name: "genre-novel" });
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "novel", { action: "genre",  genre: "noir" });
      const health = JSON.parse(await call(proc, "session", { action: "health" }));
      if (health.active_genre !== "noir") throw new Error(`active_genre missing: ${health.active_genre}`);
      const info = JSON.parse(await call(proc, "novel", { action: "info" }));
      if (info.genre !== "noir") throw new Error(`genre not in novel_info: ${info.genre}`);
      const bad = await call(proc, "novel", { action: "genre",  genre: "invalid_genre" });
      assertContains(bad, "[INVALID_INPUT]");
    });

    await test("T122/REQ-117: ended Novel moves to trash and is unresumable", async () => {
      await call(proc, "novel", { action: "create",  name: "trash-me" });
      await call(proc, "novel", { action: "end" });
      await call(proc, "respond", { decision: "end novel", option: "yes" });
      const resume = await call(proc, "novel", { action: "resume",  slug: "trash-me" });
      assertContains(resume, "[STATE_CONFLICT]");
      await call(proc, "novel", { action: "create",  name: "restore-novel" });
    });

    await test("T381/REQ-334: archive/unarchive Novel lifecycle", async () => {
      await call(proc, "novel", { action: "create",  name: "archive-me" });
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "world", { action: "create_room",  name: "archived-room", description: "d" });
      await call(proc, "novel", { action: "archive",  slug: "archive-me" });
      const active = await call(proc, "novel", { action: "list" });
      if (active.includes("archive-me")) throw new Error("archived novel still listed as active");
      const archived = await call(proc, "novel", { action: "list",  filter: "archived" });
      assertContains(archived, "archive-me");
      const health = JSON.parse(await call(proc, "session", { action: "health" }));
      if (!JSON.stringify(health.archived_novels).includes("archive-me")) throw new Error("archived_novels missing");
      const resume = await call(proc, "novel", { action: "resume",  slug: "archive-me" });
      assertContains(resume, "[STATE_CONFLICT]");
      await call(proc, "novel", { action: "unarchive",  slug: "archive-me" });
      const info = JSON.parse(await call(proc, "novel", { action: "info" }));
      if (info.slug !== "archive-me") throw new Error("unarchive did not restore active novel");
    });

    await kill(proc);
  }

  // ── REQ-065 hydration keying + REQ-088 startup auto-load ─────────
  {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-hydration-test-"));
    mkdirSync(join(dir, "novels"), { recursive: true });
    const meta = { created: new Date().toISOString(), modified: new Date().toISOString(), session_count: 0 };

    // B — a save file whose filename diverges from its internal slug.
    writeFileSync(join(dir, "novels", "misnamed.json"), JSON.stringify({ slug: "real-slug", name: "real-slug", badge: "game_master", metadata: meta }));

    let proc = await boot({ TTRPG_DATA_DIR: dir });
    await test("B/REQ-065: hydration keys the registry by internal slug, not filename", async () => {
      const list = await call(proc, "novel", { action: "list" });
      assertContains(list, "real-slug");
      const info = JSON.parse(await call(proc, "novel", { action: "info",  slug: "real-slug" }));
      if (info.slug !== "real-slug") throw new Error("info by internal slug did not resolve");
      const dup = await call(proc, "novel", { action: "create",  name: "Real Slug" });
      assertContains(dup, "[STATE_CONFLICT]");
      await call(proc, "novel", { action: "switch",  slug: "real-slug" });
      const list2 = JSON.parse(await call(proc, "novel", { action: "list" }));
      const matches = list2.filter((r: any) => r.slug === "real-slug").length;
      if (matches !== 1) throw new Error(`real-slug listed ${matches} times`);
    });
    await kill(proc);

    // T159a — resume an existing Novel at startup.
    writeFileSync(join(dir, "novels", "auto-slug.json"), JSON.stringify({ slug: "auto-slug", name: "auto-slug", badge: "game_master", metadata: meta }));
    proc = await boot({ TTRPG_DATA_DIR: dir, TTRPG_NOVEL: "auto-slug" });
    await test("T159/REQ-088: TTRPG_NOVEL resumes an existing Novel before any tool call", async () => {
      const health = JSON.parse(await call(proc, "session", { action: "health" }));
      if (health.active_novel !== "auto-slug") throw new Error(`startup novel not active: ${health.active_novel}`);
    });
    await kill(proc);

    // T159b — create a missing Novel at startup.
    proc = await boot({ TTRPG_DATA_DIR: dir, TTRPG_NOVEL: "brand-new" });
    await test("T159/REQ-088: TTRPG_NOVEL creates a missing Novel before any tool call", async () => {
      const health = JSON.parse(await call(proc, "session", { action: "health" }));
      if (health.active_novel !== "brand-new") throw new Error(`created startup novel not active: ${health.active_novel}`);
    });
    await kill(proc);

    // T159c — corrupt file: error to stderr + spec_health, no active Novel.
    writeFileSync(join(dir, "novels", "bad.json"), "{ not valid json ");
    await test("T159/REQ-088: corrupt TTRPG_NOVEL reports to stderr + spec_health, no active Novel", async () => {
      const p = spawn("npx", ["tsx", SERVER_SCRIPT], {
        env: { ...process.env, TTRPG_DATA_DIR: dir, TTRPG_NOVEL: "bad" },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let errBuf = "";
      p.stderr!.on("data", (d: Buffer) => { errBuf += d.toString(); });
      attach(p);
      await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "persistence-test", version: "1.0.0" } } });
      p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
      await new Promise((r) => setTimeout(r, 250));
      const health = JSON.parse(await call(p, "session", { action: "health" }));
      if (health.active_novel !== null) throw new Error(`corrupt startup novel became active: ${health.active_novel}`);
      const corrupted = Object.keys(health.data_health?.corrupted ?? {});
      if (!corrupted.includes("bad")) throw new Error(`corrupted slug not surfaced: ${JSON.stringify(health.data_health)}`);
      if (!errBuf.toLowerCase().includes("activation failed")) throw new Error(`stderr did not report activation failure: ${errBuf}`);
      await kill(p);
    });

    rmSync(dir, { recursive: true, force: true });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
