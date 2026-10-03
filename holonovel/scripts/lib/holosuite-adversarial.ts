// holosuite-adversarial.ts — Tier T3: bounded adversarial input fuzzing.
//
// Drives a ruleset-free Novel through a fixed battery of malformed, unknown,
// oversized, and hostile tool inputs and asserts the adversarial invariants the
// STRIDE harness (scripts/test-security.ts, REQ-444–REQ-450) does not own:
// a known tool with bad arguments still returns a recognized envelope (never
// `[?]`); an unknown tool returns a well-formed protocol error rather than a
// crash; the server stays live across the whole battery; and read-only probes
// carrying injection payloads never move the state fingerprint. No raw state
// reads beyond fingerprinting. Bounded (fixed battery, fixed seed) so the gate
// is deterministic. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support (exercises the
// REQ-001/REQ-002 response and error contracts).

import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer } from "./mcp-client.js";
import { classifyResult, fingerprintOf } from "./eval-oracle.js";
import type { EvalEvent, EvalFinding, TierResult } from "./eval-schema.js";

// Real source anchors per finding class, so a finding cites the predicate it
// rests on rather than a gate message.
const P_ENVELOPE = "holonovel/src/world/parser.ts:26"; // dispatchCommand
const P_VALIDATION = "holonovel/src/index.ts:3140"; // manage_world schema
const P_PROTOCOL = "holonovel/src/index.ts:1"; // tool registry dispatch
const P_READONLY = "holonovel/src/core/state.ts:1515"; // snapshot
const NOVEL_NAME = "Holosuite Adversarial";

interface Probe {
  label: string;
  tool: string;
  args: Record<string, unknown>;
  /** `envelope` = known tool, must return a recognized envelope; `wellformed`
   *  = protocol-level, must return a non-empty well-formed error. */
  expect: "envelope" | "wellformed";
  predicate: string;
}

const OVERSIZED = "A".repeat(100_000);

const PROBES: Probe[] = [
  { label: "unknown tool", tool: "manage__nonexistent", args: {}, expect: "wellformed", predicate: P_PROTOCOL },
  { label: "unknown action", tool: "manage_novel", args: { action: "__nope__" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "missing required param", tool: "manage_world", args: { action: "create_room" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "wrong parameter type", tool: "manage_novel", args: { action: "create", name: 12345 }, expect: "envelope", predicate: P_VALIDATION },
  { label: "oversized string", tool: "manage_novel", args: { action: "create", name: OVERSIZED }, expect: "envelope", predicate: P_VALIDATION },
  { label: "command injection semicolon", tool: "run_command", args: { action: "execute", command: "look; rm -rf /" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "command injection subshell", tool: "run_command", args: { action: "execute", command: "$(cat /etc/passwd)" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "macro prototype key", tool: "run_command", args: { action: "execute", command: "{{__proto__}}" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "malformed macro delimiter", tool: "run_command", args: { action: "execute", command: "{{{" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "path traversal resume", tool: "manage_novel", args: { action: "resume", name: "../../etc/passwd" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "prototype pollution args", tool: "manage_npc", args: JSON.parse('{"action":"create","name":"x","__proto__":{"polluted":true}}'), expect: "envelope", predicate: P_VALIDATION },
  { label: "null action", tool: "manage_novel", args: { action: null }, expect: "envelope", predicate: P_VALIDATION },
  { label: "boolean where string", tool: "manage_world", args: { action: "create_room", name: true }, expect: "envelope", predicate: P_VALIDATION },
];

function readNovel(dataDir: string): Record<string, unknown> {
  const dir = join(dataDir, "novels");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error("no novel file persisted");
  return JSON.parse(readFileSync(join(dir, files[0]!), "utf-8")) as Record<string, unknown>;
}

interface Ctx {
  findings: EvalFinding[];
  events: EvalEvent[];
  passed: number;
  failed: number;
}

function record(ctx: Ctx, name: string, ok: boolean, detail: string, step: number, req: string[], predicate: string): void {
  if (ok) ctx.passed++;
  else {
    ctx.failed++;
    ctx.findings.push({ class: name, predicate, tier: "adversarial", step, severity: "P1", target: req.join(","), detail });
  }
}

export async function runAdversarial(opts: { serverDir: string; dataDir?: string; seed?: number }): Promise<TierResult> {
  const ctx: Ctx = { findings: [], events: [], passed: 0, failed: 0 };
  const ownsDataDir = opts.dataDir === undefined;
  const dataDir = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-adv-"));
  const client = await bootServer({ serverDir: opts.serverDir, dataDir, seed: opts.seed ?? 1 });

  try {
    await client.call("manage_novel", { action: "create", name: NOVEL_NAME });
    await client.call("set_badge", { badge: "game_master" });

    let step = 0;
    for (const probe of PROBES) {
      step++;
      const res = await client.call(probe.tool, probe.args);
      const c = classifyResult(res.text, res.isError);
      const ok = probe.expect === "wellformed" ? res.text.trim().length > 0 : c.prefix !== "[?]";
      record(ctx, probe.expect === "wellformed" ? "wellformed_protocol_error" : "envelope_recognized", ok, `${probe.label}: ${c.prefix}`, step, ["REQ-001", "REQ-002"], probe.predicate);
      ctx.events.push({
        tier: "adversarial", step, role: "prober", badge: "game_master", tool: probe.tool, args: probe.args,
        prefix: c.prefix, error_class: c.error_class, is_error: res.isError, mcp_error: c.mcp_error,
        latency_ms: 0, req_ids: ["REQ-001", "REQ-002"], detail: probe.label,
      });
    }

    // --- Read-only injection probes never move the fingerprint --------------
    const before = fingerprintOf(readNovel(dataDir));
    for (const cmd of ["look; rm -rf /", "$(cat /etc/passwd)", "{{__proto__}}", "{{{"]) {
      await client.call("run_command", { action: "execute", command: cmd });
    }
    const after = fingerprintOf(readNovel(dataDir));
    step++;
    record(ctx, "read_only_no_mutation", before === after, before === after ? "fingerprint unchanged" : `${before.slice(0, 8)} -> ${after.slice(0, 8)}`, step, ["REQ-041"], P_READONLY);

    // --- Liveness: a well-formed call still succeeds after the battery ------
    step++;
    const health = await client.call("manage_session", { action: "health" });
    record(ctx, "server_live_after_battery", health.text.trim().length > 0 && !health.isError, health.isError ? "health call errored" : "server responsive", step, ["REQ-002"], P_PROTOCOL);
  } catch (e) {
    ctx.failed++;
    ctx.findings.push({ class: "adversarial_error", predicate: P_PROTOCOL, tier: "adversarial", step: 0, severity: "P1", target: "T3", detail: e instanceof Error ? e.message : String(e) });
  } finally {
    await client.close();
    if (ownsDataDir) {
      try {
        rmSync(dataDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup of the temp dir; not a test signal.
      }
    }
  }

  return { tier: "adversarial", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
}
