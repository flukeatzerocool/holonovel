#!/usr/bin/env node
// Knowledge Corpus harness — covers REQ-496 (cold registration), REQ-497
// (source-profile routing), REQ-498 (access predicate), REQ-499 (consumption
// modes), REQ-500 (acquisition ledger), REQ-501 (cold-until-consumed),
// REQ-502 (reference deixis), REQ-503 (badge gating).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "corpus-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "corpus", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function register(p: any, args: any): Promise<string> { const r = await call(p, "manage_corpus", { action: "register", ...args }); const m = r.match(/document (doc-\d+)/); if (!m) throw new Error("register failed: " + r.slice(0, 160)); return m[1]; }
async function acquisitions(p: any, entity_id?: string): Promise<any[]> { const t = await call(p, "manage_corpus", { action: "acquisitions", entity_id }); try { return JSON.parse(t); } catch { return []; } }

async function main() {
  // ── T586: cold registration (REQ-496) ────────────────────────────────
  await test("T586/REQ-496: a registered document is cold — no acquisition yet", async () => {
    const p = await boot(); await newNovel(p, "cp1");
    await register(p, { title: "Field Notes", body: "The pass is snowed in.", domain: "geography", access_public: true });
    assert((await acquisitions(p)).length === 0, "registration created an acquisition");
    await kill(p);
  });

  // ── T587: source-profile routing (REQ-497) ───────────────────────────
  await test("T587/REQ-497: a document's domain is routed and re-routable", async () => {
    const p = await boot(); await newNovel(p, "cp2");
    const id = await register(p, { title: "Codex", body: "runes", domain: "arcana", source_profile: "settlement-wiki" });
    await call(p, "manage_corpus", { action: "route", document_id: id, domain: "history" });
    const doc = JSON.parse(await call(p, "manage_corpus", { action: "get", document_id: id }));
    assert(doc.domain === "history", "routing did not update the domain: " + doc.domain);
    await kill(p);
  });

  // ── T588: access predicate (REQ-498) ─────────────────────────────────
  await test("T588/REQ-498: public/domain/grant admit; deny wins", async () => {
    const p = await boot(); await newNovel(p, "cp3");
    const secret = await register(p, { title: "Sealed", body: "The king is dead", domain: "royal" });
    let r = await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: secret });
    assert(r.includes("[FORBIDDEN]"), "restricted doc should be forbidden: " + r.slice(0, 100));
    await call(p, "manage_corpus", { action: "grant", document_id: secret, entity_id: "hero" });
    r = await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: secret });
    assert(r.includes("Acquisition"), "granted doc should be consumable: " + r.slice(0, 120));
    // Domain match admits a different entity.
    await call(p, "manage_corpus", { action: "access", entity_id: "scholar", domains: ["royal"] });
    r = await call(p, "manage_corpus", { action: "consume", entity_id: "scholar", document_id: secret });
    assert(r.includes("Acquisition"), "domain-matched doc should be consumable: " + r.slice(0, 120));
    // Deny wins over public.
    const open = await register(p, { title: "Open", body: "common knowledge", domain: "general", access_public: true, denies: ["thief"] });
    r = await call(p, "manage_corpus", { action: "consume", entity_id: "thief", document_id: open });
    assert(r.includes("[FORBIDDEN]"), "deny should override public access: " + r.slice(0, 100));
    await kill(p);
  });

  // ── T589: consumption modes (REQ-499) ────────────────────────────────
  await test("T589/REQ-499: consumption records its mode", async () => {
    const p = await boot(); await newNovel(p, "cp4");
    const id = await register(p, { title: "Tome", body: "plain facts", domain: "general", access_public: true });
    await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: id, mode: "research" });
    const acq = await acquisitions(p, "hero");
    assert(acq[0].mode === "research", "mode not recorded: " + JSON.stringify(acq[0]));
    await kill(p);
  });

  // ── T590: acquisition ledger (REQ-500) ───────────────────────────────
  await test("T590/REQ-500: the ledger records entity, document, and domain", async () => {
    const p = await boot(); await newNovel(p, "cp5");
    const id = await register(p, { title: "Ledger", body: "text", domain: "trade", access_public: true });
    await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: id });
    const acq = await acquisitions(p, "hero");
    assert(acq[0].entity_id === "hero" && acq[0].document_id === id && acq[0].domain === "trade", "ledger fields wrong: " + JSON.stringify(acq[0]));
    await kill(p);
  });

  // ── T591: cold-until-consumed (REQ-501) ──────────────────────────────
  await test("T591/REQ-501: knowledge appears only after consumption", async () => {
    const p = await boot(); await newNovel(p, "cp6");
    const id = await register(p, { title: "Late", body: "the vault code is 4-7-1", domain: "secrets", access_public: true });
    assert((await acquisitions(p, "hero")).length === 0, "knowledge existed before consumption");
    await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: id });
    assert((await acquisitions(p, "hero")).length === 1, "knowledge not recorded on consumption");
    await kill(p);
  });

  // ── T592: reference deixis (REQ-502) ─────────────────────────────────
  await test("T592/REQ-502: first/second-person reference is left unresolved", async () => {
    const p = await boot(); await newNovel(p, "cp7");
    const id = await register(p, { title: "Memoir", body: "I am the rightful king and you will kneel.", domain: "history", access_public: true });
    await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: id });
    const acq = await acquisitions(p, "hero");
    assert(acq[0].deixis === "unresolved", "first-person reference was resolved as self: " + JSON.stringify(acq[0]));
    await kill(p);
  });

  // ── T593: badge gating (REQ-503) ─────────────────────────────────────
  await test("T593/REQ-503: Player consumes for own entity only; Observer is read-only", async () => {
    const p = await boot(); await newNovel(p, "cp8");
    const id = await register(p, { title: "Open", body: "plain", domain: "general", access_public: true });
    await call(p, "set_badge", { badge: "player" });
    const other = await call(p, "manage_corpus", { action: "consume", entity_id: "villain", document_id: id });
    assert(other.includes("[FORBIDDEN]"), "Player consume for another entity should be forbidden: " + other.slice(0, 100));
    await call(p, "set_badge", { badge: "observer" });
    const obs = await call(p, "manage_corpus", { action: "consume", entity_id: "hero", document_id: id });
    assert(obs.includes("[FORBIDDEN]") || obs.includes("[ERROR]"), "Observer consume should fail: " + obs.slice(0, 100));
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
