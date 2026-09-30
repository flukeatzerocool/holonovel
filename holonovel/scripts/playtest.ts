#!/usr/bin/env npx tsx
/**
 * playtest.ts — [informational] Simulated-play harness for a Holonovel server.
 *
 * Boots a target server (server-dir) against a per-run scratch copy of a
 * campaign, records agent turns to transcript.jsonl, and computes a completion
 * oracle. Read-only toward the source state directory. Prints results to
 * stdout; exits 0 on success, 1 on usage/state error, 2 on fatal error.
 *
 * Campaign data and adventure modules are supplied by the operator (via
 * --state-dir / --module) and are never committed with this tool.
 *
 * Commands:
 *   init     --run <id> --state-dir <dir> --module <file.md> [--server-dir <dir>]
 *   turn     --run <id> --agent <gm|player> --tool <name> --args '<json>' [--intent <text>]
 *   briefing --run <id> --agent <gm|player>
 *   oracle   --run <id>
 *   status   --run <id>
 *   report
 */
import { spawn, type ChildProcess } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";

const HOME = import.meta.dirname;
const DEFAULT_SERVER_DIR = join(HOME, "..");
const ROOT = process.env.PLAYTEST_HOME ?? join(tmpdir(), "holonovel-playtest");
const RUNDIR = join(ROOT, "runs");

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

interface RunConfig {
  run_id: string;
  server_dir: string;
  novel_slug: string;
  adventure_slug: string;
  central_vow: string;
  escape_room: string;
  created: string;
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

function runEnv(run: string, cfg: RunConfig): NodeJS.ProcessEnv {
  return {
    ...process.env,
    TTRPG_DATA_DIR: join(run, "data"),
    TTRPG_ADVENTURE_DIR: join(run, "data", "adventures"),
    TTRPG_NOVEL: cfg.novel_slug,
    TTRPG_LOG_LEVEL: "error",
  };
}

async function boot(run: string, cfg: RunConfig): Promise<ChildProcess> {
  const tsx = join(cfg.server_dir, "node_modules", ".bin", "tsx");
  const server = join(cfg.server_dir, "src", "index.ts");
  if (!existsSync(server)) die(`server not found at ${server}`, 2);
  const proc = spawn(tsx, [server], { env: runEnv(run, cfg), stdio: ["pipe", "pipe", "pipe"] });
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

async function briefingText(proc: ChildProcess, badge: "game_master" | "player"): Promise<string> {
  await call(proc, "set_badge", { badge });
  const r = await send(proc, { method: "prompts/get", params: { name: "badge_briefing", arguments: {} } });
  if (r.error) return `[RPC_ERROR] ${JSON.stringify(r.error)}`;
  return (r.result?.messages ?? []).map((m: any) => m?.content?.text ?? "").join("\n");
}

async function kill(proc: ChildProcess): Promise<void> {
  await new Promise<void>((res) => { proc.on("exit", () => res()); proc.kill(); });
}

function prefix(text: string): string {
  const m = text.match(/\[(OK|WARNING|ERROR|PARTIAL|NEED_INPUT|FORBIDDEN|NOT_FOUND|RULE_VIOLATION|STATE_CONFLICT|INVALID_INPUT|[A-Z_]+)\]/);
  return m ? m[0] : (text.startsWith("[") ? text.slice(0, 24) : "[?]");
}

function txPath(run: string): string { return join(run, "transcript.jsonl"); }
function readTx(run: string): any[] {
  const p = txPath(run);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
function appendTx(run: string, rec: any): void { appendFileSync(txPath(run), JSON.stringify(rec) + "\n"); }

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

  rmSync(run, { recursive: true, force: true });
  mkdirSync(join(run, "data", "novels"), { recursive: true });
  mkdirSync(join(run, "data", "rulesets"), { recursive: true });
  mkdirSync(join(run, "data", "adventures"), { recursive: true });
  cpSync(join(stateDir, "novels", `${novelSlug}.json`), join(run, "data", "novels", `${novelSlug}.json`));
  if (existsSync(join(stateDir, "rulesets"))) cpSync(join(stateDir, "rulesets"), join(run, "data", "rulesets"), { recursive: true });
  cpSync(modulePath, join(run, "data", "adventures", `${adventureSlug}.md`));

  const cfg: RunConfig = { run_id: basename(run), server_dir: serverDir, novel_slug: novelSlug, adventure_slug: adventureSlug, central_vow: centralVow, escape_room: escapeRoom, created: new Date().toISOString() };
  const proc = await boot(run, cfg);
  const out: string[] = [];
  out.push(await call(proc, "set_badge", { badge: "game_master" }));
  const health = await call(proc, "manage_session", { action: "health" });
  out.push(await call(proc, "manage_adventure", { action: "load", slug: adventureSlug }));
  out.push(await call(proc, "manage_vow", { action: "set", name: centralVow, difficulty: "extreme", scope: "party" }));
  if (escapeRoom) out.push(await call(proc, "manage_scene", { action: "set", location: escapeRoom, beat: "setup" }));
  await kill(proc);

  const novel = JSON.parse(readFileSync(join(run, "data", "novels", `${novelSlug}.json`), "utf-8"));
  const manifest = {
    ...cfg, persona,
    spec_version: JSON.parse(health).spec_version ?? null,
    ruleset: novel.ruleset ?? null,
    world: { rooms: novel.world?.rooms ? Object.keys(novel.world.rooms).length : 0, things: novel.world?.things ? Object.keys(novel.world.things).length : 0 },
    entities: Object.values(novel.entities ?? {}).map((e: any) => e.name),
  };
  writeFileSync(join(run, "run.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ ok: true, init: out, world: manifest.world, spec_version: manifest.spec_version }, null, 2));
}

async function cmdTurn(run: string): Promise<void> {
  const cfg = readConfig(run);
  const tool = requireFlag("--tool");
  const argsRaw = flag("--args", "{}")!;
  let args: any;
  try { args = JSON.parse(argsRaw); } catch { die(`--args is not valid JSON: ${argsRaw}`, 1); }
  const agent = flag("--agent", "player")!;
  const proc = await boot(run, cfg);
  const badge = agent === "gm" ? "game_master" : "player";
  await call(proc, "set_badge", { badge });
  const result = await call(proc, tool, args);
  const gmBrief = await briefingText(proc, "game_master");
  const playerBrief = await briefingText(proc, "player");
  await kill(proc);
  const t = readTx(run).length + 1;
  appendTx(run, { t, agent, badge, tool, args, intent: flag("--intent"), prefix: prefix(result), result: result.slice(0, 4000), at: new Date().toISOString() });
  console.log(JSON.stringify({ t, agent, tool, prefix: prefix(result), result: result.slice(0, 5000), briefing_gm: gmBrief, briefing_player: playerBrief }, null, 2));
}

async function cmdBriefing(run: string): Promise<void> {
  const cfg = readConfig(run);
  const agent = flag("--agent", "player")!;
  const proc = await boot(run, cfg);
  const b = await briefingText(proc, agent === "gm" ? "game_master" : "player");
  await kill(proc);
  console.log(b);
}

function pcAlive(e: any): boolean {
  const cond = (e.conditions ?? []).map((c: any) => String(c).toLowerCase());
  if (cond.some((c: string) => /dead|deceased|killed|fatal|corpse/.test(c))) return false;
  const stats = e.stats ?? {};
  const hp = Number(stats.health ?? stats.HP ?? stats.body ?? NaN);
  if (!Number.isNaN(hp) && hp <= 0) return false;
  return true;
}

function computeOracle(run: string): any {
  const cfg = readConfig(run);
  const novel = JSON.parse(readFileSync(join(run, "data", "novels", `${cfg.novel_slug}.json`), "utf-8"));
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
  let unrecovered = 0;
  const errors: any[] = [];
  for (let i = 0; i < tx.length; i++) {
    if (tx[i].prefix === "[ERROR]" || tx[i].prefix === "[FORBIDDEN]") {
      const next = tx.slice(i + 1).find((r) => r.agent === tx[i].agent);
      const recovered = next && ["[OK]", "[PARTIAL]", "[WARNING]"].includes(next.prefix);
      if (!recovered) { unrecovered++; errors.push({ t: tx[i].t, tool: tx[i].tool, prefix: tx[i].prefix }); }
    }
  }
  const beatFraction = Math.min(1, (novel.story_beats ?? []).length / 6);
  const totalCalls = tx.length || 1;
  const errorTurns = tx.filter((r) => r.prefix === "[ERROR]" || r.prefix === "[FORBIDDEN]").length;
  const success = !!(vowResolved && terminalBeat && activeInEscape && survivors.length > 0 && unrecovered === 0);
  const partial = Number((0.4 * beatFraction + 0.4 * (vowResolved ? 1 : 0) + 0.2 * Math.max(0, 1 - errorTurns / totalCalls)).toFixed(3));
  const oracle = {
    run: cfg.run_id, success,
    components: {
      vow_resolved: !!vowResolved, terminal_beat: terminalBeat?.beat ?? null,
      active_pc_in_escape: activeInEscape,
      survivors: survivors.map((s) => s.name), survivors_count: survivors.length,
      pcs: pcs.map((p) => ({ name: p.name, room: p.current_room ?? null, alive: pcAlive(p) })),
      unrecovered_errors: unrecovered,
    },
    partial_score: partial, turns: tx.length, error_turns: errorTurns,
    unrecovered_detail: errors.slice(0, 20),
    story_beats: (novel.story_beats ?? []).map((b: any) => b.beat), vow_state: vow?.state ?? null,
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
    return { run: cfg.run_id, persona: (JSON.parse(readFileSync(join(r, "run.json"), "utf-8")).persona) ?? null, success: o.success, partial: o.partial_score, turns: o.turns, errors: o.error_turns, unrecovered: o.components.unrecovered_errors, beats: o.story_beats };
  });
  console.log(JSON.stringify(rows, null, 2));
}

(async () => {
  if (!CMD) die("usage: playtest.ts <init|turn|briefing|oracle|status|report> ...");
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
