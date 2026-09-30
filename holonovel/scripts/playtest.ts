#!/usr/bin/env npx tsx
/**
 * playtest.ts — [informational] Simulated-play harness for a Holonovel server.
 *
 * Boots a target server (server-dir) against a per-run scratch copy of a
 * campaign, records agent turns to transcript.jsonl, and computes a completion
 * oracle plus objective mission telemetry (rules-govern-outcomes gating,
 * mechanical-memory fingerprints, hallucinated-tool detection, lookup-anchor
 * ratio, latency/context growth, NEED_INPUT capture). Read-only toward the
 * source state directory. Prints results to stdout.
 *
 * Exit codes: 0 = success, 1 = usage/state error, 2 = fatal error.
 *
 * Campaign data and adventure modules are supplied by the operator (via
 * --state-dir / --module) and are never committed with this tool.
 *
 * REQ citations: none — informational harness, not wired into a gate.
 *
 * Commands:
 *   init     --run <id> --state-dir <dir> --module <file.md> --novel <slug>
 *            [--adventure <slug>] [--vow <text>] [--escape-room <room>]
 *            [--persona <name>] [--gm <name>] [--seed <n>] [--server-dir <dir>]
 *   turn     --run <id> --agent <gm|player> --tool <name> --args '<json>' [--intent <text>]
 *   briefing --run <id> --agent <gm|player>
 *   oracle   --run <id>
 *   status   --run <id>
 *   report
 */
import { spawn, execSync, type ChildProcess } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { DEFECT_PREFIXES, DENIAL_PREFIXES, WORLD_TOOLS, prefix, errorClass, classifyResult, roomSet, stateFingerprint, pcVitals, pcAlive, anchorPresent } from "./lib/playtest-lib.js";

const HOME = import.meta.dirname;
const DEFAULT_SERVER_DIR = join(HOME, "..");
const ROOT = process.env.PLAYTEST_HOME ?? join(tmpdir(), "holonovel-playtest");
const RUNDIR = join(ROOT, "runs");

function help(): void {
  process.stdout.write(`playtest.ts — simulated-play harness (informational)

Commands:
  init     --run <id> --state-dir <dir> --module <file.md> --novel <slug>
           [--adventure <slug>] [--vow <text>] [--escape-room <room>]
           [--persona <name>] [--gm <name>] [--seed <n>] [--server-dir <dir>]
  turn     --run <id> --agent <gm|player> --tool <name> --args '<json>' [--intent <text>]
  briefing --run <id> --agent <gm|player>
  oracle   --run <id>
  status   --run <id>
  report
`);
}

function flag(name: string, fallback: string | null = null): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}
function requireFlag(name: string): string {
  const v = flag(name);
  if (!v) die(`${name} is required`, 1);
  return v;
}
const CMD = process.argv[2];

function die(msg: string, code = 1): never {
  process.stderr.write(`[playtest] ${msg}\n`);
  process.exit(code);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Provenance {
  server_git_sha: string | null;
  module_sha1: string;
  novel_sha1: string;
  ruleset_sha1: string | null;
  model_id: string | null;
  env: Record<string, string>;
  node: string;
}
interface RunConfig {
  run_id: string;
  server_dir: string;
  novel_slug: string;
  adventure_slug: string;
  central_vow: string;
  escape_room: string;
  created: string;
  persona: string;
  gm: string;
  seed: string | null;
  provenance: Provenance;
  catalog_size: number;
}
function readConfig(run: string): RunConfig {
  const p = join(run, "run.json");
  if (!existsSync(p)) die(`run not initialized: ${run}`, 1);
  return JSON.parse(readFileSync(p, "utf-8"));
}

let msgId = 0;
const pending = new Map<number, (m: any) => void>();
let buf = "";

function attach(proc: ChildProcess): void {
  buf = "";
  proc.stdout!.on("data", (d: Buffer) => {
    buf += d.toString();
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line);
        if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
      } catch { /* non-JSON server log line on stdout */ }
    }
  });
  proc.stderr!.on("data", () => { /* server diagnostics ignored; not a failure signal */ });
}

function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}

function runEnv(run: string, cfg: RunConfig, seedOverride?: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    TTRPG_DATA_DIR: join(run, "data"),
    TTRPG_ADVENTURE_DIR: join(run, "data", "adventures"),
    TTRPG_NOVEL: cfg.novel_slug,
    TTRPG_LOG_LEVEL: "error",
  };
  // The server keeps restart determinism (REQ-050c); the harness varies the
  // seed per turn so session rolls advance within a run.
  if (seedOverride !== undefined) env.TTRPG_SEED = seedOverride;
  return env;
}

async function boot(run: string, cfg: RunConfig, seedOverride?: string): Promise<ChildProcess> {
  const tsx = join(cfg.server_dir, "node_modules", ".bin", "tsx");
  const server = join(cfg.server_dir, "src", "index.ts");
  if (!existsSync(server)) die(`server not found at ${server}`, 2);
  const proc = spawn(tsx, [server], { env: runEnv(run, cfg, seedOverride), stdio: ["pipe", "pipe", "pipe"] });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "playtest", version: "1" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  return proc;
}

async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const r = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (r.error) return `[RPC_ERROR] ${JSON.stringify(r.error)}`;
  return (r.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
}

async function listTools(proc: ChildProcess): Promise<string[]> {
  const r = await send(proc, { method: "tools/list", params: {} });
  return (r.result?.tools ?? []).map((t: any) => String(t.name));
}

async function briefingText(proc: ChildProcess, badge: "game_master" | "player"): Promise<string> {
  await call(proc, "set_badge", { badge });
  const r = await send(proc, { method: "prompts/get", params: { name: "badge_briefing", arguments: {} } });
  if (r.error) return `[RPC_ERROR] ${JSON.stringify(r.error)}`;
  return (r.result?.messages ?? []).map((m: any) => m?.content?.text ?? "").join("\n");
}

async function kill(proc: ChildProcess): Promise<void> {
  await new Promise<void>((res) => { proc.on("exit", () => res()); proc.kill(); });
}

// FNV-1a 32-bit hash — turns a base-seed+turn string into a numeric seed the
// server's parseInt accepts, with well-separated states between turns.
function seedInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Per-run lock: two concurrent `turn` processes on one run corrupt the
// transcript. A stale lock (>10 min) is reclaimed.
function acquireLock(run: string): void {
  const p = join(run, ".lock");
  if (existsSync(p)) {
    const stamp = Number(readFileSync(p, "utf-8").split(":")[0] || 0);
    if (Date.now() - stamp < 10 * 60 * 1000) die(`run '${basename(run)}' is locked by another process`, 1);
  }
  writeFileSync(p, `${Date.now()}:${process.pid}`);
}
function releaseLock(run: string): void {
  try { rmSync(join(run, ".lock"), { force: true }); } catch { /* lock already released */ }
}

function txPath(run: string): string { return join(run, "transcript.jsonl"); }
function readTx(run: string): any[] {
  const p = txPath(run);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
function appendTx(run: string, rec: any): void { appendFileSync(txPath(run), JSON.stringify(rec) + "\n"); }

function novelPath(run: string, cfg: RunConfig): string { return join(run, "data", "novels", `${cfg.novel_slug}.json`); }
function readNovel(run: string, cfg: RunConfig): any {
  const p = novelPath(run, cfg);
  if (!existsSync(p)) die(`novel not found: ${p}`, 1);
  return JSON.parse(readFileSync(p, "utf-8"));
}

function hashFile(p: string): string {
  return existsSync(p) ? createHash("sha1").update(readFileSync(p)).digest("hex") : "missing";
}
function hashDir(dir: string): string | null {
  if (!existsSync(dir)) return null;
  const h = createHash("sha1");
  let files: string[] = [];
  try {
    files = (readdirSync(dir, { recursive: true }) as string[]).filter((f) => typeof f === "string");
  } catch { /* unreadable ruleset dir — report null hash rather than fail the run */ return null; }
  for (const f of files.sort()) {
    const full = join(dir, f);
    try { h.update(f).update(readFileSync(full)); } catch { /* skip unreadable entry; hash covers the rest */ }
  }
  return h.digest("hex");
}
function gitSha(dir: string): string | null {
  try { return execSync(`git -C ${JSON.stringify(dir)} rev-parse HEAD`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { /* not a git checkout — provenance field left null */ return null; }
}
function pickEnv(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) if (process.env[k] !== undefined) out[k] = String(process.env[k]);
  return out;
}

async function cmdInit(run: string): Promise<void> {
  const stateDir = requireFlag("--state-dir");
  const modulePath = requireFlag("--module");
  const serverDir = flag("--server-dir", process.env.PLAYTEST_SERVER_DIR ?? DEFAULT_SERVER_DIR)!;
  if (!existsSync(modulePath)) die(`module not found: ${modulePath}`, 2);
  if (!existsSync(join(stateDir, "novels"))) die(`state-dir has no novels/: ${stateDir}`, 2);
  const novelSlug = requireFlag("--novel");
  const adventureSlug = flag("--adventure", basename(modulePath).replace(/\.md$/, ""))!;
  const centralVow = flag("--vow", "Complete the adventure and get the party out alive")!;
  const escapeRoom = flag("--escape-room", "")!;
  const persona = flag("--persona", "unset")!;
  const gm = flag("--gm", "gm_fair")!;
  const seed = flag("--seed", null);

  rmSync(run, { recursive: true, force: true });
  mkdirSync(join(run, "data", "novels"), { recursive: true });
  mkdirSync(join(run, "data", "rulesets"), { recursive: true });
  mkdirSync(join(run, "data", "adventures"), { recursive: true });
  cpSync(join(stateDir, "novels", `${novelSlug}.json`), join(run, "data", "novels", `${novelSlug}.json`));
  if (existsSync(join(stateDir, "rulesets"))) cpSync(join(stateDir, "rulesets"), join(run, "data", "rulesets"), { recursive: true });
  cpSync(modulePath, join(run, "data", "adventures", `${adventureSlug}.md`));

  const cfg: RunConfig = {
    run_id: basename(run), server_dir: serverDir, novel_slug: novelSlug, adventure_slug: adventureSlug,
    central_vow: centralVow, escape_room: escapeRoom, created: new Date().toISOString(),
    persona, gm, seed, provenance: null as unknown as Provenance, catalog_size: 0,
  };
  const proc = await boot(run, cfg);
  const out: string[] = [];
  out.push(await call(proc, "set_badge", { badge: "game_master" }));
  const health = await call(proc, "manage_session", { action: "health" });
  out.push(await call(proc, "manage_adventure", { action: "load", slug: adventureSlug }));
  out.push(await call(proc, "manage_vow", { action: "set", name: centralVow, difficulty: "extreme", scope: "party" }));
  if (escapeRoom) out.push(await call(proc, "manage_scene", { action: "set", location: escapeRoom, beat: "setup" }));
  const catalog = await listTools(proc);
  await kill(proc);

  const novel = JSON.parse(readFileSync(join(run, "data", "novels", `${novelSlug}.json`), "utf-8"));
  const ruleset = novel.ruleset ?? null;
  cfg.provenance = {
    server_git_sha: gitSha(serverDir),
    module_sha1: hashFile(modulePath),
    novel_sha1: hashFile(join(stateDir, "novels", `${novelSlug}.json`)),
    ruleset_sha1: ruleset ? hashDir(join(run, "data", "rulesets", ruleset)) : null,
    model_id: process.env.PLAYTEST_MODEL ?? null,
    env: pickEnv(["TTRPG_AI_ROLE", "TTRPG_AGENT_AUTONOMY", "TTRPG_LOG_LEVEL"]),
    node: process.version,
  };
  cfg.catalog_size = catalog.length;
  writeFileSync(join(run, "tools.json"), JSON.stringify(catalog, null, 2));

  const manifest = {
    ...cfg,
    spec_version: JSON.parse(health).spec_version ?? null,
    ruleset,
    world: { rooms: novel.world?.rooms ? Object.keys(novel.world.rooms).length : 0, things: novel.world?.things ? Object.keys(novel.world.things).length : 0 },
    entities: Object.values(novel.entities ?? {}).map((e: any) => e.name),
    init_fingerprint: stateFingerprint(novel),
    init_rooms: roomSet(novel),
  };
  writeFileSync(join(run, "run.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ ok: true, init: out, world: manifest.world, spec_version: manifest.spec_version, catalog_size: catalog.length, gm, persona, seed }, null, 2));
}

async function cmdTurn(run: string): Promise<void> {
  const cfg = readConfig(run);
  const tool = requireFlag("--tool");
  const argsRaw = flag("--args", "{}")!;
  let args: any;
  try { args = JSON.parse(argsRaw); } catch { die(`--args is not valid JSON: ${argsRaw}`, 1); }
  const agent = flag("--agent", "player")!;
  acquireLock(run);
  const before = readNovel(run, cfg);
  const preFp = stateFingerprint(before);
  const roomsBefore = roomSet(before);
  const t0 = Date.now();
  const turnIndex = readTx(run).length;
  // The server parses TTRPG_SEED as an integer, so hash base+turn to a
  // well-separated 32-bit value (adjacent seeds give correlated first draws).
  const seed = String(seedInt(`${cfg.seed ?? "0"}:${turnIndex}`));
  const proc = await boot(run, cfg, seed);
  const badge = agent === "gm" ? "game_master" : "player";
  await call(proc, "set_badge", { badge });
  const rawRes = await send(proc, { method: "tools/call", params: { name: tool, arguments: args } });
  const result = (rawRes.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
  const isMcpError = rawRes.result?.isError === true || rawRes.error !== undefined;
  const gmBrief = await briefingText(proc, "game_master");
  const playerBrief = await briefingText(proc, "player");
  await kill(proc);
  const ms = Date.now() - t0;
  const after = readNovel(run, cfg);
  const postFp = stateFingerprint(after);
  const roomsAfter = roomSet(after);
  const { prefix: p, error_class: ecl, mcp_error } = classifyResult(result, isMcpError);
  const t = readTx(run).length + 1;
  const activeRoom = after?.entities?.[after?.active_entity_id]?.current_room ?? null;
  const rec = {
    t, agent, badge, tool, args, intent: flag("--intent"), prefix: p, result: result.slice(0, 4000),
    error_class: ecl, mcp_error,
    pre_fp: preFp, post_fp: postFp, rooms_before: roomsBefore, rooms_after: roomsAfter, active_room: activeRoom,
    ms, brief_bytes: gmBrief.length + playerBrief.length,
    need_input: /\[NEED_INPUT\]/.test(result),
    at: new Date().toISOString(),
  };
  appendTx(run, rec);
  releaseLock(run);
  console.log(JSON.stringify({ t, agent, tool, prefix: p, error_class: rec.error_class, seed, ms, rooms: `${roomsBefore.length}->${roomsAfter.length}`, result: result.slice(0, 5000), briefing_gm: gmBrief, briefing_player: playerBrief }, null, 2));
}

async function cmdBriefing(run: string): Promise<void> {
  const cfg = readConfig(run);
  const agent = flag("--agent", "player")!;
  const proc = await boot(run, cfg);
  const b = await briefingText(proc, agent === "gm" ? "game_master" : "player");
  await kill(proc);
  console.log(b);
}

function missionTelemetry(run: string, cfg: RunConfig, novel: any, tx: any[]): any {
  const catalogPath = join(run, "tools.json");
  const catalog: string[] | null = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, "utf-8")) : null;
  const usedTools = [...new Set(tx.map((r) => r.tool))].sort();
  const hallucinated = catalog ? usedTools.filter((t) => !catalog.includes(t)) : null;

  const hist: Record<string, number> = {};
  for (const r of tx) hist[r.prefix] = (hist[r.prefix] ?? 0) + 1;

  const persists: any[] = [];
  for (let i = 0; i < tx.length - 1; i++) {
    if (tx[i].post_fp && tx[i + 1].pre_fp && tx[i].post_fp !== tx[i + 1].pre_fp) {
      persists.push({ between: tx[i].t, prev: tx[i].post_fp, next: tx[i + 1].pre_fp });
    }
  }

  const roomDrift: any[] = [];
  for (const r of tx) {
    if (r.rooms_before && r.rooms_after && JSON.stringify(r.rooms_before) !== JSON.stringify(r.rooms_after) && !WORLD_TOOLS.has(r.tool)) {
      roomDrift.push({ t: r.t, tool: r.tool, before: r.rooms_before.length, after: r.rooms_after.length });
    }
  }

  const lookup = tx.filter((r) => /lookup_/.test(r.tool));
  const anchorHits = lookup.filter((r) => anchorPresent(r.result ?? "")).length;

  const needInputTurns = tx.filter((r) => r.need_input).map((r) => r.t);
  const lastNeedInput = tx.length ? !!tx[tx.length - 1]?.need_input : false;

  const latencies = tx.map((r) => Number(r.ms)).filter((n) => Number.isFinite(n));
  const briefBytes = tx.map((r) => Number(r.brief_bytes)).filter((n) => Number.isFinite(n));

  return {
    catalog_size: catalog?.length ?? null,
    used_tools: usedTools,
    hallucinated_tools: hallucinated,
    prefix_histogram: hist,
    persist_violations: persists,
    unexplained_room_drift: roomDrift,
    rules_lookups: lookup.length,
    anchor_hits: anchorHits,
    need_input_turns: needInputTurns,
    need_input_unresolved: lastNeedInput,
    reboots: tx.length,
    latency_ms: latencies.length ? { min: Math.min(...latencies), max: Math.max(...latencies), mean: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) } : null,
    briefing_bytes: briefBytes.length ? { first: briefBytes[0], last: briefBytes[briefBytes.length - 1], max: Math.max(...briefBytes) } : null,
  };
}

function computeOracle(run: string): any {
  const cfg = readConfig(run);
  const novel = readNovel(run, cfg);
  const tx = readTx(run);
  const vow = (novel.vows ?? []).find((v: any) => v.name === cfg.central_vow);
  const vowResolved = vow?.state === "resolved";
  const terminalBeat = (novel.story_beats ?? []).find((b: any) => ["resolution", "denouement"].includes(b.beat));
  const pcs = Object.values(novel.entities ?? {}) as any[];
  const survivors = pcs.filter(pcAlive);
  const activePc = pcs.find((p) => p.id === novel.active_entity_id) ?? pcs[0];
  const bare = (s: string) => s.toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
  const want = bare(cfg.escape_room ?? "");
  const activeInEscape = want ? bare(activePc?.current_room ?? "") === want : true;
  // Non-vacuous round trip: when the escape room is also the spawn room,
  // `active_pc_in_escape` is trivially true. Require the active PC to have
  // left the escape room and returned (from the recorded per-turn rooms).
  let leftEscape = false;
  let returnedEscape = false;
  if (want) {
    for (const r of tx) {
      const room = bare(String(r.active_room ?? ""));
      if (!room) continue;
      if (room !== want) leftEscape = true;
      else if (leftEscape) returnedEscape = true;
    }
  }
  const leftAndReturned = want ? (leftEscape && returnedEscape) : true;

  const defects = tx.filter((r) => (r.error_class ? r.error_class === "defect" : DEFECT_PREFIXES.has(r.prefix)));
  const errors: any[] = [];
  for (let i = 0; i < tx.length; i++) {
    const isDefect = tx[i].error_class ? tx[i].error_class === "defect" : DEFECT_PREFIXES.has(tx[i].prefix);
    if (!isDefect) continue;
    const next = tx.slice(i + 1).find((r) => r.agent === tx[i].agent);
    const nextIsDefect = next ? (next.error_class ? next.error_class === "defect" : DEFECT_PREFIXES.has(next.prefix)) : false;
    // Recovery = the next same-agent turn is not itself a defect. Ruleset
    // lookups return bare JSON (no [OK] envelope), so this is broader than an
    // explicit OK/WARNING check.
    const recovered = !!next && !nextIsDefect;
    if (!recovered) errors.push({ t: tx[i].t, tool: tx[i].tool, prefix: tx[i].prefix });
  }
  const unrecovered = errors.length;

  const beatFraction = Math.min(1, (novel.story_beats ?? []).length / 6);
  const totalCalls = tx.length || 1;
  const errorTurns = defects.length;
  const denials = tx.filter((r) => (r.error_class ? r.error_class === "denial" : DENIAL_PREFIXES.has(r.prefix))).length;
  const success = !!(vowResolved && terminalBeat && activeInEscape && leftAndReturned && survivors.length > 0 && unrecovered === 0);
  const partial = Number((0.4 * beatFraction + 0.4 * (vowResolved ? 1 : 0) + 0.2 * Math.max(0, 1 - errorTurns / totalCalls)).toFixed(3));
  const oracle = {
    run: cfg.run_id,
    gm: cfg.gm,
    persona: cfg.persona,
    success,
    components: {
      vow_resolved: !!vowResolved, terminal_beat: terminalBeat?.beat ?? null,
      active_pc_in_escape: activeInEscape,
      active_pc_left_and_returned: leftAndReturned,
      survivors: survivors.map((s: any) => s.name), survivors_count: survivors.length,
      pcs: pcs.map((p: any) => ({ name: p.name, room: p.current_room ?? null, alive: pcAlive(p), vitals: pcVitals(p) })),
      unrecovered_errors: unrecovered,
    },
    partial_score: partial, turns: tx.length, error_turns: errorTurns, denials,
    unrecovered_detail: errors.slice(0, 20),
    story_beats: (novel.story_beats ?? []).map((b: any) => b.beat), vow_state: vow?.state ?? null,
    gating_leak: !!vowResolved && !activeInEscape,
    mission: missionTelemetry(run, cfg, novel, tx),
  };
  writeFileSync(join(run, "oracle.json"), JSON.stringify(oracle, null, 2));
  return oracle;
}

function cmdStatus(run: string): void {
  const tx = readTx(run);
  const byPrefix: Record<string, number> = {};
  for (const r of tx) byPrefix[r.prefix] = (byPrefix[r.prefix] ?? 0) + 1;
  console.log(JSON.stringify({ run: basename(run), turns: tx.length, prefixes: byPrefix }, null, 2));
}

function cmdReport(): void {
  if (!existsSync(RUNDIR)) die("no runs", 1);
  const runs = readdirSync(RUNDIR).map((d) => join(RUNDIR, d)).filter((d) => existsSync(join(d, "run.json")));
  const rows = runs.map((r) => {
    const cfg = readConfig(r);
    const o = existsSync(join(r, "oracle.json")) ? JSON.parse(readFileSync(join(r, "oracle.json"), "utf-8")) : computeOracle(r);
    return { run: cfg.run_id, gm: cfg.gm, persona: cfg.persona, success: o.success, partial: o.partial_score, turns: o.turns, errors: o.error_turns, denials: o.denials, unrecovered: o.components.unrecovered_errors, hallucinated: o.mission?.hallucinated_tools ?? null, persist_violations: (o.mission?.persist_violations ?? []).length, beats: o.story_beats };
  });
  console.log(JSON.stringify(rows, null, 2));
}

(async () => {
  if (!CMD || CMD === "--help" || CMD === "-h") { help(); process.exit(0); }
  const run = join(RUNDIR, flag("--run", "run-1")!);
  switch (CMD) {
    case "init": await cmdInit(run); break;
    case "turn": await cmdTurn(run); break;
    case "briefing": await cmdBriefing(run); break;
    case "oracle": console.log(JSON.stringify(computeOracle(run), null, 2)); break;
    case "status": cmdStatus(run); break;
    case "report": cmdReport(); break;
    default: die(`unknown command '${CMD}'`, 1);
  }
  process.exit(0);
})().catch((e) => { console.error("fatal:", e); process.exit(2); });
