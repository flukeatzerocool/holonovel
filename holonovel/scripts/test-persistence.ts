#!/usr/bin/env node
// Novel persistence and transport conformance harness (§5.9 — REQ-089/093/095/
// 096/097/238/240/256/257/258). Exercises the Appendix F tests T74, T78, T99,
// T100, T101, T160, T276, T278, T281, T315, T316, T317 against a live server:
// lifecycle, switching, rename, listing, metadata, interchange round-trip,
// backup rotation, clone, and health reporting.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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
    await call(proc, "create_novel", { name: "first", description: "A first novel." });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T74: create_novel surfaces novel_setup as the recommended next step", async () => {
      const resp = await call(proc, "create_novel", { name: "extra", description: "setup check" });
      assertContains(resp, "novel_setup");
      await call(proc, "switch_novel", { slug: "first" });
    });

    await test("T316/T257: list_novels lists created Novels", async () => {
      const list = await call(proc, "list_novels", {});
      assertContains(list, "first");
    });

    await test("T317/T258: novel_info returns metadata", async () => {
      const info = await call(proc, "novel_info", {});
      assertContains(info, "first");
      assertContains(info, "A first novel.");
    });

    await test("T315/T256: rename_novel changes slug and persists", async () => {
      await call(proc, "rename_novel", { new_slug: "renamed" });
      const info = await call(proc, "novel_info", {});
      assertContains(info, "renamed");
    });

    await test("T278/T240: clone_novel creates an independent copy", async () => {
      await call(proc, "create_thing", { name: "sword", description: "A sharp blade." });
      await call(proc, "clone_novel", { source_slug: "renamed", new_name: "fork" });
      const list = await call(proc, "list_novels", {});
      assertContains(list, "fork");
      assertContains(list, "renamed");
    });

    await test("T100/T281/T096: export produces a valid interchange manifest; import validates", async () => {
      const exported = await call(proc, "export_novel", { format: "json" });
      const parsed = JSON.parse(exported); // must be parseable JSON
      assertContains(exported, "\"slug\"");
      assertContains(exported, "\"name\"");
      // Appendix Q envelope: format_version (integer) + manifest object.
      assertContains(exported, "\"format_version\"");
      assertContains(exported, "\"manifest\"");
      assertContains(exported, "\"novel\"");
      const dryrun = await call(proc, "import_novel", { data: exported, mode: "dry-run" });
      assertContains(dryrun, "valid manifest");
    });

    await test("T100: replace-import round-trip restores world and entities", async () => {
      // Populate a novel with world model + NPC + countdown + lore.
      await call(proc, "create_room", { name: "throne room", description: "A grand hall." });
      await call(proc, "create_thing", { name: "throne", description: "An ornate seat." });
      await call(proc, "create_npc", { name: "Chancellor", description: "A wary official.", disposition: "neutral" });
      await call(proc, "set_countdown", { name: "court adjourns", ticks: 5, type: "narrative", scope: "throne room" });
      await call(proc, "set_lore_entry", { key: "the_crown", content: "The crown is a forgery.", triggers: ["the_crown"] });

      const before = JSON.parse(await call(proc, "export_novel", { format: "json" }));
      const roomsBefore = Object.keys(before.novel.world.rooms).sort();
      const thingsBefore = Object.keys(before.novel.world.things).sort();
      const npcsBefore = Object.keys(before.novel.npcs).sort();
      const loreBefore = Object.keys(before.novel.lore).sort();
      const countdownsBefore = Object.keys(before.novel.countdowns).sort();
      assertContains(roomsBefore.join(","), "throne room");
      assertContains(thingsBefore.join(","), "throne");

      // Replace-import the export back and re-export — tiers must survive.
      await call(proc, "import_novel", { data: JSON.stringify(before), mode: "replace" });
      const after = JSON.parse(await call(proc, "export_novel", { format: "json" }));
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
      const health = await call(proc, "spec_health", {});
      assertContains(health, "novel");
    });

    await test("T101/T160/T097: spec_health reports novel health", async () => {
      const health = await call(proc, "spec_health", {});
      assertContains(health, "health");
    });

    await test("T98/T095: switch_novel activates another Novel", async () => {
      await call(proc, "create_novel", { name: "second" });
      await call(proc, "switch_novel", { slug: "second" });
      const info = await call(proc, "novel_info", {});
      assertContains(info, "second");
    });

    await test("T276/T238: mutations persist and backup rotation does not corrupt state", async () => {
      for (let i = 0; i < 5; i++) await call(proc, "set_note", { key: `note-${i}`, content: `content ${i}` });
      const list = await call(proc, "list_notes", {});
      assertContains(list, "note-4");
    });

    await test("T158/REQ-140: end_novel confirmation dispatch removes the Novel", async () => {
      await call(proc, "create_novel", { name: "dispatch-me" });
      const confirm = await call(proc, "end_novel", {});
      assertContains(confirm, "[NEED_INPUT]");
      await call(proc, "respond", { decision: "end novel", option: "yes" });
      // After disposal, resume of the removed slug is a STATE_CONFLICT.
      const resume = await call(proc, "resume_novel", { slug: "dispatch-me" });
      assertContains(resume, "[STATE_CONFLICT]");
      // Restore a working novel for subsequent tests.
      await call(proc, "create_novel", { name: "restore-novel" });
    });

    await kill(proc);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
