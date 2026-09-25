#!/usr/bin/env node
// Supplementary import harness — covers REQ-372 (Novel-scoped supplementary
// import, Wisdom-only under the REQ-373 waiver) and REQ-373 (dynamic tool
// registration waiver branch: no tools registered).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "supp-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "supp", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function toolCount(proc: any): Promise<number> { const r = await send(proc, { method: "tools/list", params: {} }); return (r.result?.tools ?? []).length; }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }

async function main() {
  // ── T423: Novel-scoped supplementary import (REQ-372) ────────────────
  await test("T423/REQ-372: supplementary Wisdom imports, lists, removes, persists", async () => {
    const p = await boot(); await newNovel(p, "supp1");
    const r = await call(p, "manage_ruleset", { action: "import_supplementary", slug: "xanathars", wisdom: [
      { module: "supplementary_guidance", key: "spells", content: "New spells for the guide." },
      { module: "supplementary_guidance", key: "classes", content: "New classes for the guide." },
    ] });
    assert(r.includes("Wisdom-only"), "import did not report the waiver: " + r.slice(0, 120));
    const synth = await call(p, "manage_synthesis", { action: "list" });
    assert(synth.includes("supplementary:xanathars"), "supplementary Wisdom not surfaced in synthesis list: " + synth.slice(0, 200));
    const health = JSON.parse(await call(p, "manage_session", { action: "health" }));
    assert((health.supplementary_rulesets ?? []).some((s: any) => s.slug === "xanathars"), "spec_health missing supplementary entry");
    // Novel-scoped value persists across a process restart.
    await kill(p);
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "supp1" });
    const health2 = JSON.parse(await call(p2, "manage_session", { action: "health" }));
    assert((health2.supplementary_rulesets ?? []).some((s: any) => s.slug === "xanathars"), "supplementary import did not persist/resume");
    const rm = await call(p2, "manage_ruleset", { action: "remove_supplementary", slug: "xanathars" });
    assert(rm.includes("Removed"), "remove_supplementary failed: " + rm.slice(0, 120));
    const synth2 = await call(p2, "manage_synthesis", { action: "list" });
    assert(!synth2.includes("supplementary:xanathars"), "supplementary Wisdom survived removal");
    await kill(p2);
  });

  // ── T424: dynamic-registration waiver (REQ-373) ──────────────────────
  await test("T424/REQ-373: no tools registered under the waiver; source gap reported", async () => {
    const p = await boot(); await newNovel(p, "supp2");
    const before = await toolCount(p);
    await call(p, "manage_ruleset", { action: "import_supplementary", slug: "tome", wisdom: [{ content: "one item" }] });
    const after = await toolCount(p);
    assert(after === before, `waiver violated: tool count changed ${before} -> ${after}`);
    // Import from a real source file, then remove the file -> [supplementary-gap].
    const src = join(DATA_DIR, "tome.md");
    writeFileSync(src, "# Tome\n\n## Rules\nOptional rules here.\n\n## Flavor\nExtra lore.\n", "utf-8");
    const r = await call(p, "manage_ruleset", { action: "import_supplementary", slug: "tomefile", source: src });
    assert(r.includes("2 Wisdom"), "file extraction did not yield two Wisdom items: " + r.slice(0, 140));
    rmSync(src, { force: true });
    const health = JSON.parse(await call(p, "manage_session", { action: "health" }));
    assert((health.supplementary_gap ?? []).some((g: any) => g.slug === "tomefile"), "missing source not reported as [supplementary-gap]");
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
