#!/usr/bin/env node
/**
 * test-memory-recall.ts — compression-ladder and recall-probe gate. [gate]
 *
 * Builds a deterministic three-session fixture campaign, forces session
 * summarization through the real compaction path, and verifies source-pointer
 * traversal, budgeted tier degradation, and recall@budget against the committed
 * probe fixture.
 *
 * Exit codes: 0 = pass, 1 = a check failed, 2 = fatal.
 * REQ-590, REQ-591, REQ-592, REQ-593, REQ-633, REQ-644, REQ-645, REQ-646,
 * REQ-647, REQ-648
 */

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { affectValence } from "../src/core/divergence.js";
import { assembleMemorySection, type SubjectiveMemoryRecord } from "../src/core/subjective.js";
import { estimateTokens } from "../src/core/memory.js";

installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const FIXTURE = join(import.meta.dirname!, "fixtures", "memory-recall.json");
const DIVERGENCE_FIXTURE = join(import.meta.dirname!, "fixtures", "subjective-divergence.json");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-memory-recall-"));
const SLUG = "recall-fixture";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 400)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}", got: ${hay.substring(0, 400)}`);
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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "memory-recall-test", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(250);
  return proc;
}

async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}

async function readResource(proc: ChildProcess, uri: string): Promise<string> {
  const resp = await send(proc, { method: "resources/read", params: { uri } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.contents ?? []).map((c: any) => c?.text ?? "").join("\n");
}

function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    proc.on("exit", () => resolve());
    proc.kill();
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

interface Probe {
  id: string;
  question: string;
  expected_contains: string[];
  tier: string;
  budget_tokens: number;
  required: boolean;
}

// REQ-633 — one divergence probe: a deliberately wrong memory and its verdict.
interface DivergenceProbe {
  id: string;
  gist: string;
  claim: { subject: string; predicate: string; object: string; polarity: "positive" | "negative" };
  felt_then: string;
  event_ordinal: number | null;
  expected_verdict: string;
}

// REQ-633 — the failure path is evaluable on its own, so a missed expectation
// is proven to fail rather than assumed to.
function divergenceMisses(probes: DivergenceProbe[], verdicts: Map<string, string>): string[] {
  const misses: string[] = [];
  for (const probe of probes) {
    const actual = verdicts.get(probe.gist) ?? "(missing)";
    if (actual !== probe.expected_verdict) misses.push(`${probe.id} expected ${probe.expected_verdict}, got ${actual}`);
  }
  return misses;
}

// REQ-648 — the recall floor lives in Appendix O.12; read it from the assembled
// spec copy rather than hardcoding it, so a floor change cannot drift.
function recallFloor(): number {
  const candidates = [
    join(import.meta.dirname!, "..", "holonovel.md"),
    join(import.meta.dirname!, "..", "..", "spec", "appendices-reference.md"),
  ];
  for (const candidate of candidates) {
    try {
      const text = readFileSync(candidate, "utf8");
      const match = text.match(/Subjective recall floor[^\n|]*\|\s*([0-9.]+)/);
      if (match) return Number(match[1]);
    } catch { /* try the next spec copy */ }
  }
  throw new Error("Appendix O.12 subjective recall floor not found");
}

async function main() {
  console.log("=== Compression ladder and recall probes (REQ-590–593) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  await test("T749/REQ-630: affect classification matches whole tokens, not substrings", () => {
    if (affectValence("unsafe") !== 0) throw new Error("'unsafe' classified as positive affect");
    if (affectValence("wonder") !== 0) throw new Error("'wonder' classified as an outcome cue");
    if (affectValence("relieved") !== 1) throw new Error("'relieved' not positive");
    if (affectValence("terrified") !== -1) throw new Error("'terrified' not negative");
  });

  await test("T768/REQ-632,REQ-646: a marker suffix does not enter the budget cost", () => {
    const rec: SubjectiveMemoryRecord = {
      id: "sm-1", entity_id: "e", event_ordinal: 1, gist: "g",
      claim: { subject: "s", predicate: "p", object: "o", polarity: "positive" },
      felt_then: "", salience: 0.5, origin: "authored", disclosure: "open", at: "",
    };
    const base = "- [authored] e: g";
    const suffix = " [divergence: false outcome] [evicted #1]";
    const asm = assembleMemorySection([rec], () => ({ text: base, suffix }), {
      maxRecords: 5, budgetTokens: estimateTokens(base), marker: (n) => `[truncated] ${n}`,
    });
    if (asm.lines[0] !== base + suffix) throw new Error("suffix not appended after admission: " + asm.lines[0]);
    if (asm.tokens !== estimateTokens(base)) throw new Error("suffix changed the token cost");
  });

  await test("T767/REQ-645: the token budget is a ceiling, not a first-record bypass", () => {
    const make = (id: string): SubjectiveMemoryRecord => ({
      id, entity_id: "e", event_ordinal: 1, gist: "g",
      claim: { subject: "s", predicate: "p", object: "o", polarity: "positive" },
      felt_then: "", salience: 0.5, origin: "authored", disclosure: "open", at: "",
    });
    const asm = assembleMemorySection([make("sm-1"), make("sm-2")], () => ({
      text: "- a memory line long enough to exceed one token",
    }), { maxRecords: 5, budgetTokens: 1, marker: (n) => `[truncated] ${n} memories omitted at budget` });
    if (asm.lines.some((l) => l.startsWith("- "))) throw new Error("a record was admitted over the budget: " + asm.lines.join(" | "));
    if (!asm.lines.some((l) => l.includes("[truncated] 2"))) throw new Error("omitted count not reported");
  });


  // ── Session 1: stable facts and the vault event ─────────────────────
  let proc = await boot({ TTRPG_SESSION_ID: "s1" });
  await call(proc, "manage_novel", { action: "create", name: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_npc", { action: "create", name: "Kael", disposition: "loyal", goals: "Guard the chapel" });
  await call(proc, "manage_faction", { action: "create", name: "Merchant Guild", goals: ["Control the docks"] });
  await call(proc, "manage_vow", { action: "set", name: "Protect the chapel", difficulty: "dangerous" });
  await call(proc, "manage_lore", { action: "set", key: "vault", content: "The vault lies beneath the chapel." });
  await call(proc, "manage_diagnostics", { action: "event", text: "The vault door was opened" });
  await kill(proc);

  // ── Session 2: the oath ─────────────────────────────────────────────
  proc = await boot({ TTRPG_SESSION_ID: "s2" });
  await call(proc, "manage_novel", { action: "resume", slug: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_diagnostics", { action: "event", text: "Kael swore to protect the chapel" });
  await kill(proc);

  // ── Session 3: the bell, then compact sessions 1–2 ──────────────────
  proc = await boot({ TTRPG_SESSION_ID: "s3" });
  await call(proc, "manage_novel", { action: "resume", slug: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_diagnostics", { action: "event", text: "The bell rang at dusk" });

  const pendingCompact = await call(proc, "manage_diagnostics", { action: "compact", sessions: 1 });
  assertContains(pendingCompact, "[NEED_INPUT]");
  const compacted = await call(proc, "respond_decision", { decision: "compress_audit:1", option: "yes" });
  assertContains(compacted, "compacted");

  await test("T697: campaign and arc tiers carry deterministic facts and pointers", async () => {
    const campaign = await call(proc, "manage_context", { action: "recap", tier: "campaign", budget_tokens: 4000 });
    assertContains(campaign, "Kael");
    assertContains(campaign, "Merchant Guild");
    assertContains(campaign, "lore vault");
    const again = await call(proc, "manage_context", { action: "recap", tier: "campaign", budget_tokens: 4000 });
    const strip = (s: string) => s.replace(/\d{4}-\d{2}-\d{2}T[^\s]+/g, "<ts>");
    if (strip(campaign) !== strip(again)) throw new Error("campaign tier derivation is not deterministic");
    const arc = await call(proc, "manage_context", { action: "recap", tier: "arc", budget_tokens: 4000 });
    assertContains(arc, "Kael swore to protect the chapel");
  });

  let archivedPointers: number[] = [];
  await test("T698: summary source pointers traverse back to raw events", async () => {
    const archive = JSON.parse(await readResource(proc, "audit://novel/archive"));
    if (!Array.isArray(archive) || archive.length < 2) throw new Error(`expected archived sessions, got ${JSON.stringify(archive)}`);
    archivedPointers = [...new Set(archive.flatMap((s: any) => s.source_ordinals ?? []))].sort((a, b) => a - b) as number[];
    if (archivedPointers.length === 0) { const hist = await call(proc, "manage_diagnostics", { action: "history" }); throw new Error(`archived summaries carry no source_ordinals: ${JSON.stringify(archive)} history=${hist}`); }
    const raw = await call(proc, "manage_diagnostics", { action: "history", ordinals: archivedPointers });
    assertContains(raw, "The vault door was opened");
    assertContains(raw, "Kael swore to protect the chapel");
  });

  await test("T699: budgeted assembly drops tiers in declared order; no-arg recap unchanged", async () => {
    const plain1 = await call(proc, "manage_context", { action: "recap" });
    const plain2 = await call(proc, "manage_context", { action: "recap" });
    if (plain1 !== plain2) throw new Error("no-arg recap is not deterministic");
    assertNotContains(plain1, "tiered_memory");
    const tight = await call(proc, "manage_context", { action: "recap", budget_tokens: 1 });
    assertContains(tight, "tiered_memory:");
    assertContains(tight, "[truncated] arc tier omitted");
    assertContains(tight, "[truncated] session tier omitted");
    const bad = await call(proc, "manage_context", { action: "recap", tier: "nope" });
    assertContains(bad, "[INVALID_INPUT]");
    const badBudget = await call(proc, "manage_context", { action: "recap", budget_tokens: 0 });
    assertContains(badBudget, "[INVALID_INPUT]");
  });

  const probes: Probe[] = JSON.parse(readFileSync(FIXTURE, "utf8")).probes;
  await test("T699/REQ-072i: Player recap tiers omit GM-only secrets and events", async () => {
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_lore", { action: "set_secret", key: "hidden_heir", content: "The hidden heir is the duke's son." });
    await call(proc, "manage_diagnostics", { action: "event", text: "GM-ONLY: the duke is a doppelganger", source: "game_master" });
    await call(proc, "set_badge", { badge: "player" });
    const campaign = await call(proc, "manage_context", { action: "recap", tier: "campaign" });
    assertNotContains(campaign, "hidden heir");
    assertNotContains(campaign, "doppelganger");
    const recent = await call(proc, "manage_context", { action: "recap", tier: "recent" });
    assertNotContains(recent, "doppelganger");
    await call(proc, "set_badge", { badge: "game_master" });
  });

  await test("T700: recall@budget meets the threshold", async () => {
    let hits = 0;
    const misses: string[] = [];
    for (const probe of probes) {
      const out = await call(proc, "manage_context", { action: "recap", tier: probe.tier, budget_tokens: probe.budget_tokens });
      const hit = probe.expected_contains.every((needle) => out.toLowerCase().includes(needle.toLowerCase()));
      if (hit) hits++;
      else misses.push(`${probe.id} (${probe.tier})`);
    }
    const recall = hits / probes.length;
    console.log(`    recall@budget: ${(recall * 100).toFixed(0)}% (${hits}/${probes.length})`);
    const requiredMiss = probes.some((p) => p.required && misses.some((m) => m.startsWith(p.id)));
    if (requiredMiss) throw new Error(`required-recall probe missed: ${misses.join(", ")}`);
    if (recall < 0.9) throw new Error(`aggregate recall ${recall.toFixed(2)} below 0.90: ${misses.join(", ")}`);
  });

  await test("T752/REQ-633: divergence probes return their declared verdicts", async () => {
    await call(proc, "manage_novel", { action: "create", name: "divergence-fixture" });
    await call(proc, "set_badge", { badge: "game_master" });
    const annaRes = await call(proc, "manage_character", { action: "create", name: "Anna" });
    const anna = annaRes.match(/Entity id ([a-z0-9_]+)/i)?.[1];
    if (!anna) throw new Error(`character create did not return an id: ${annaRes.slice(0, 160)}`);
    await call(proc, "manage_npc", { action: "create", name: "Kael", disposition: "loyal" });
    await call(proc, "manage_npc", { action: "create", name: "Mira", disposition: "hostile" });
    await call(proc, "manage_relationship", { action: "set", entity_a: anna, entity_b: "Kael", type: "ally" });
    await call(proc, "manage_diagnostics", { action: "event", text: "Kael gave the chapel to Anna" });
    await call(proc, "manage_diagnostics", { action: "event", text: "Mira betrayed Anna" });
    const infoBefore = await call(proc, "manage_novel", { action: "info", slug: "divergence-fixture" });
    const eventsBefore = infoBefore.match(/"event_count":\s*(\d+)/)?.[1];

    const probes: DivergenceProbe[] = JSON.parse(readFileSync(DIVERGENCE_FIXTURE, "utf8")).probes;
    for (const probe of probes) {
      const recorded = await call(proc, "manage_belief", {
        action: "subjective_record",
        subjective_entity: anna,
        subjective_gist: probe.gist,
        subjective_subject: probe.claim.subject,
        subjective_predicate: probe.claim.predicate,
        subjective_object: probe.claim.object,
        subjective_polarity: probe.claim.polarity,
        subjective_felt_then: probe.felt_then || undefined,
        subjective_event_ordinal: probe.event_ordinal ?? undefined,
        subjective_origin: "witnessed",
      });
      assertContains(recorded, "[OK]");
    }

    const view = await call(proc, "manage_belief", { action: "subjective_verify", subjective_entity: anna });
    const rows = JSON.parse(view) as Array<{ gist: string; verdict: string }>;
    const verdicts = new Map(rows.map((r) => [r.gist, r.verdict]));
    for (const probe of probes) {
      console.log(`    probe ${probe.id} → ${verdicts.get(probe.gist) ?? "(missing)"}`);
    }
    const misses = divergenceMisses(probes, verdicts);
    if (misses.length > 0) throw new Error(`divergence probes missed: ${misses.join("; ")}`);

    // A deliberately missed expectation must fail the evaluator.
    const flipped = probes.map((p, i) => (i === 0 ? { ...p, expected_verdict: "unverifiable" } : p));
    if (divergenceMisses(flipped, verdicts).length === 0) throw new Error("a deliberately missed verdict did not fail the probe check");
    // A probe that resolves to unverifiable must fail, not pass.
    if (divergenceMisses([{ ...probes[0], expected_verdict: "confirmed" }], new Map([[probes[0].gist, "unverifiable"]])).length === 0) {
      throw new Error("an unverifiable probe passed");
    }

    const again = await call(proc, "manage_belief", { action: "subjective_verify", subjective_entity: anna });
    if (again !== view) throw new Error("recomputation of unchanged state differs");
    const infoAfter = await call(proc, "manage_novel", { action: "info", slug: "divergence-fixture" });
    if (infoAfter.match(/"event_count":\s*(\d+)/)?.[1] !== eventsBefore) throw new Error("the divergence check advanced the event log");
  });

  await kill(proc);

  // ── Subjective recall: score, budget, markers, retention, probes ─────
  // REQ-644–REQ-648. Fixture-driven where the shape is data (T770), inline
  // where the shape is behaviour (T766–T769).
  const SUBJECTIVE_FIXTURE = join(import.meta.dirname!, "fixtures", "subjective-recall.json");
  interface SubjectiveFixture {
    events: string[];
    records: Array<{
      entity: "anna" | "kael";
      disclosure: string;
      salience: number;
      origin: string;
      gist: string;
      claim: { subject: string; predicate: string; object: string; polarity: string };
      felt_then: string;
      event_ordinal: number;
    }>;
    gm_order: string[];
    probes: Array<{
      id: string;
      badge: "both" | "game_master" | "player";
      budget_tokens: number;
      expected_contains: string[];
      required: boolean;
    }>;
  }

  async function promptText(proc: any, name: string, args: any = {}): Promise<string> {
    const r = await send(proc, { method: "prompts/get", params: { name, arguments: args } });
    if (r.error) throw new Error(`${name} prompt: ${r.error.message ?? JSON.stringify(r.error)}`);
    return (r.result?.messages ?? []).map((m: any) => m?.content?.text ?? "").join("\n");
  }

  function section(text: string, header: string): string {
    const idx = text.indexOf(header);
    if (idx < 0) return "";
    const rest = text.slice(idx + header.length);
    const next = rest.indexOf("\n## ");
    return (next < 0 ? text.slice(idx) : text.slice(idx, idx + header.length + next)).trim();
  }

  // REQ-648 — the miss detector is pure so its firing can be proven without a
  // server round trip (the divergence-probe precedent at REQ-633).
  function recallMisses(
    probes: SubjectiveFixture["probes"],
    rendered: Map<string, string>,
    badge: "game_master" | "player",
  ): string[] {
    const misses: string[] = [];
    for (const probe of probes) {
      if (probe.badge !== "both" && probe.badge !== badge) continue;
      const out = (rendered.get(`${probe.budget_tokens}:${badge}`) ?? "").toLowerCase();
      if (!probe.expected_contains.every((needle) => out.includes(needle.toLowerCase()))) misses.push(probe.id);
    }
    return misses;
  }

  async function seedSubjectiveFixture(p: ChildProcess, slug: string): Promise<{ anna: string; kael: string }> {
    const fx: SubjectiveFixture = JSON.parse(readFileSync(SUBJECTIVE_FIXTURE, "utf8"));
    await call(p, "manage_novel", { action: "create", name: slug });
    await call(p, "set_badge", { badge: "game_master" });
    const ids: Record<string, string> = {};
    for (const name of ["Anna", "Kael"]) {
      const created = await call(p, "manage_character", { action: "create", name });
      const id = created.match(/Entity id ([a-z0-9_]+)/i)?.[1];
      if (!id) throw new Error(`character create did not return an id: ${created.slice(0, 160)}`);
      ids[name.toLowerCase()] = id;
    }
    await call(p, "manage_staging", { action: "presence", entity_ids: [ids.anna, ids.kael] });
    for (const text of fx.events) await call(p, "manage_diagnostics", { action: "event", text });
    for (const record of fx.records) {
      const res = await call(p, "manage_belief", {
        action: "subjective_record",
        subjective_entity: ids[record.entity],
        subjective_gist: record.gist,
        subjective_subject: record.claim.subject,
        subjective_predicate: record.claim.predicate,
        subjective_object: record.claim.object,
        subjective_polarity: record.claim.polarity,
        subjective_felt_then: record.felt_then,
        subjective_salience: record.salience,
        subjective_origin: record.origin,
        subjective_disclosure: record.disclosure,
        subjective_event_ordinal: record.event_ordinal,
      });
      assertContains(res, "[OK]");
    }
    return { anna: ids.anna, kael: ids.kael };
  }

  interface RecallSample { proc: ChildProcess; text: string }

  async function renderAt(
    slug: string,
    budget: number,
    badge: "game_master" | "player",
    activeId?: string,
    maxRecords = 50,
  ): Promise<RecallSample> {
    const proc = await boot({
      TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS: String(budget),
      TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX: String(maxRecords),
    });
    await call(proc, "manage_novel", { action: "resume", slug });
    if (activeId && badge === "player") await call(proc, "manage_character", { action: "set_active", entity_id: activeId });
    await call(proc, "set_badge", { badge });
    const text = section(await promptText(proc, "badge_briefing"), "## Subjective Memory");
    return { proc, text };
  }

  const seeder = await boot({ TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS: "800" });
  const seeded = await seedSubjectiveFixture(seeder, "subj-recall");
  await kill(seeder);
  const fixture: SubjectiveFixture = JSON.parse(readFileSync(SUBJECTIVE_FIXTURE, "utf8"));

  await test("T766/REQ-644: score orders the section deterministically", async () => {
    const gm = await renderAt("subj-recall", 400, "game_master");
    const again = await renderAt("subj-recall", 400, "game_master");
    await kill(gm.proc);
    await kill(again.proc);
    if (gm.text !== again.text) throw new Error("two renders of unchanged state differ");
    const positions = fixture.gm_order.map((gist) => gm.text.indexOf(gist));
    if (positions.some((p) => p < 0)) throw new Error(`not every memory rendered: ${gm.text}`);
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] < positions[i - 1]) {
        throw new Error(`score order violated at ${fixture.gm_order[i]}: ${gm.text}`);
      }
    }
    // Salience dominates recency: the older, higher-salience oath precedes the
    // newer, lower-salience ledger entry.
    const oath = gm.text.indexOf("harbour bell");
    const ledger = gm.text.indexOf("ledger names");
    if (!(oath >= 0 && ledger >= 0 && oath < ledger)) throw new Error("salience did not outrank recency: " + gm.text);
  });

  await test("T767/REQ-645: budget binds, truncation is reported, count is badge-scoped", async () => {
    const gm = await renderAt("subj-recall", 60, "game_master");
    const gmCount = parseInt(gm.text.match(/\[truncated\] (\d+) memories omitted at budget/)?.[1] ?? "0", 10);
    await kill(gm.proc);
    if (gmCount <= 0) throw new Error("a tight budget did not report an omitted count: " + gm.text);
    const player = await renderAt("subj-recall", 60, "player", seeded.anna);
    const playerCount = parseInt(player.text.match(/\[truncated\] (\d+) memories omitted at budget/)?.[1] ?? "0", 10);
    await kill(player.proc);
    assertNotContains(player.text, "sealed sigil");
    if (playerCount <= 0) throw new Error("the Player render reported no omissions");
    if (playerCount >= gmCount) {
      // The Player pool drops the secret record, so its visible omissions are
      // fewer than the Game Master's — the count cannot leak hidden memory.
      throw new Error(`Player omitted count ${playerCount} did not exclude secret records (GM ${gmCount})`);
    }
  });

  await test("T768/REQ-646: an evicted source is reported, never dropped", async () => {
    const p = await boot({ TTRPG_EVENT_LOG_MAX_ENTRIES: "4", TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS: "400" });
    await call(p, "manage_novel", { action: "create", name: "subj-evicted" });
    await call(p, "set_badge", { badge: "game_master" });
    const created = await call(p, "manage_character", { action: "create", name: "Anna" });
    const anna = created.match(/Entity id ([a-z0-9_]+)/i)?.[1];
    await call(p, "manage_staging", { action: "presence", entity_ids: [anna] });
    // REQ-646 — a record citing no event reports `none`. An empty event log is
    // the one reachable path to a null ordinal (REQ-624 binds the latest event
    // when one exists), so this record lands before any event exists.
    await call(p, "manage_belief", {
      action: "subjective_record",
      subjective_entity: anna,
      subjective_gist: "an authored recollection",
      subjective_subject: "recollection",
      subjective_predicate: "is",
      subjective_object: "authored",
      subjective_salience: 0.1,
    });
    for (let i = 1; i <= 4; i++) await call(p, "manage_diagnostics", { action: "event", text: `event ${i}` });
    await call(p, "manage_belief", {
      action: "subjective_record",
      subjective_entity: anna,
      subjective_gist: "the old lantern was lost",
      subjective_subject: "lantern",
      subjective_predicate: "was lost at",
      subjective_object: "the ford",
      subjective_event_ordinal: 1,
    });
    for (let i = 5; i <= 8; i++) await call(p, "manage_diagnostics", { action: "event", text: `event ${i}` });
    const text = section(await promptText(p, "badge_briefing"), "## Subjective Memory");
    await kill(p);
    assertContains(text, "[evicted #1]");
    assertContains(text, "the old lantern was lost");
    if (/an authored recollection.*\[evicted/.test(text)) throw new Error("a null-ordinal memory was marked evicted: " + text);

    const listed = JSON.parse(await (async () => {
      const q = await boot({ TTRPG_EVENT_LOG_MAX_ENTRIES: "4" });
      await call(q, "manage_novel", { action: "resume", slug: "subj-evicted" });
      await call(q, "set_badge", { badge: "game_master" });
      const out = await call(q, "manage_belief", { action: "subjective_list", subjective_entity: anna });
      await kill(q);
      return out;
    })()) as Array<{ gist: string; event_state: string }>;
    const lantern = listed.find((r) => r.gist === "the old lantern was lost");
    const authored = listed.find((r) => r.gist === "an authored recollection");
    if (lantern?.event_state !== "evicted") throw new Error(`cited-event memory reports ${lantern?.event_state}`);
    if (authored?.event_state !== "none") throw new Error(`authored memory reports ${authored?.event_state}`);
  });

  await test("T769/REQ-647: per-entity retention folds evicted gists into the ladder", async () => {
    const p = await boot({ TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX: "2", TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX: "2000" });
    await call(p, "manage_novel", { action: "create", name: "subj-retain" });
    await call(p, "set_badge", { badge: "game_master" });
    const created = await call(p, "manage_character", { action: "create", name: "Anna" });
    const anna = created.match(/Entity id ([a-z0-9_]+)/i)?.[1];
    await call(p, "manage_staging", { action: "presence", entity_ids: [anna] });
    for (const [gist, salience] of [["keeper of the keep", 0.9], ["forgotten errand", 0.1], ["middle matter", 0.5]] as Array<[string, number]>) {
      await call(p, "manage_belief", {
        action: "subjective_record",
        subjective_entity: anna,
        subjective_gist: gist,
        subjective_subject: "matter",
        subjective_predicate: "concerns",
        subjective_object: gist,
        subjective_salience: salience,
      });
    }
    const kept = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: anna })) as Array<{ gist: string }>;
    if (kept.length !== 2) throw new Error(`per-entity cap kept ${kept.length} records`);
    if (kept.some((r) => r.gist === "forgotten errand")) throw new Error("the lowest-scored record survived the cap");
    const gmRecap = await call(p, "manage_context", { action: "recap", tier: "campaign" });
    assertContains(gmRecap, "forgotten errand");
    // REQ-590/REQ-647 — the refresh at close must not wipe the summaries.
    await call(p, "close_session");
    const afterClose = await call(p, "manage_context", { action: "recap", tier: "campaign" });
    assertContains(afterClose, "forgotten errand");
    await call(p, "set_badge", { badge: "player" });
    await call(p, "manage_character", { action: "set_active", entity_id: anna });
    const playerRecap = await call(p, "manage_context", { action: "recap", tier: "campaign" });
    assertNotContains(playerRecap, "forgotten errand");
    // A re-fold after undo must not duplicate the folded line, and the fold
    // itself must survive the undo that reverted the surrounding state.
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_history", { action: "undo" });
    const afterUndo = await call(p, "manage_context", { action: "recap", tier: "campaign" });
    assertContains(afterUndo, "forgotten errand");
    await call(p, "manage_belief", {
      action: "subjective_record",
      subjective_entity: anna,
      subjective_gist: "middle matter",
      subjective_subject: "matter",
      subjective_predicate: "concerns",
      subjective_object: "middle matter",
      subjective_salience: 0.5,
    });
    const regrown = await call(p, "manage_context", { action: "recap", tier: "campaign" });
    await kill(p);
    const occurrences = (regrown.match(/forgotten errand/g) ?? []).length;
    if (occurrences > 1) throw new Error(`re-fold duplicated the consolidated line (${occurrences})`);
  });

  await test("T770/REQ-648: subjective recall meets the floor; a withheld expectation fails", async () => {
    const budgets = [...new Set(fixture.probes.map((p) => p.budget_tokens))];
    const rendered = new Map<string, string>();
    for (const budget of budgets) {
      const gm = await renderAt("subj-recall", budget, "game_master");
      rendered.set(`${budget}:game_master`, gm.text);
      await kill(gm.proc);
      const player = await renderAt("subj-recall", budget, "player", seeded.anna);
      rendered.set(`${budget}:player`, player.text);
      await kill(player.proc);
    }
    for (const badge of ["game_master", "player"] as Array<"game_master" | "player">) {
      const applicable = fixture.probes.filter((p) => p.badge === "both" || p.badge === badge);
      const misses = recallMisses(fixture.probes, rendered, badge);
      const recall = (applicable.length - misses.length) / applicable.length;
      console.log(`    subjective recall@budget (${badge}): ${(recall * 100).toFixed(0)}% (${applicable.length - misses.length}/${applicable.length})`);
      const requiredMiss = applicable.some((p) => p.required && misses.includes(p.id));
      if (requiredMiss) throw new Error(`required subjective probe missed (${badge}): ${misses.join(", ")}`);
      if (recall < recallFloor()) throw new Error(`subjective recall ${recall.toFixed(2)} below the O.12 floor ${recallFloor()} (${badge})`);
    }
    // The miss detector must fire on a withheld expectation.
    const withheld = new Map<string, string>();
    for (const key of rendered.keys()) withheld.set(key, "no memories at all");
    if (recallMisses(fixture.probes, withheld, "game_master").length === 0) {
      throw new Error("a deliberately withheld expectation did not fail the probe reader");
    }
    const synthetic = [{ id: "synthetic-miss", badge: "game_master" as const, budget_tokens: budgets[0], expected_contains: ["never rendered"], required: true }];
    if (recallMisses(synthetic, rendered, "game_master").length === 0) {
      throw new Error("the synthetic miss detector did not fire");
    }
  });


  // ── Eviction: pointers survive as [evicted] markers ─────────────────
  proc = await boot({ TTRPG_SESSION_ID: "s4", TTRPG_EVENT_LOG_MAX_ENTRIES: "1" });
  await call(proc, "manage_novel", { action: "resume", slug: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_diagnostics", { action: "event", text: "A new observation evicts the rest" });
  await test("T698/REQ-591: evicted pointers report [evicted] instead of vanishing", async () => {
    const old = archivedPointers[0];
    const raw = await call(proc, "manage_diagnostics", { action: "history", ordinals: [old] });
    assertContains(raw, "[evicted]");
  });
  await kill(proc);

  rmSync(DATA_DIR, { recursive: true, force: true });
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  harnessComplete();
}

main().catch((e) => { console.error(e); process.exit(2); });
