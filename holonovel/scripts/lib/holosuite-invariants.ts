// holosuite-invariants.ts — Tier T1: bounded model-based invariants.
//
// Drives a ruleset-free Novel through a small, seeded sequence of world
// mutations and read-only probes, asserting mechanical invariants after each
// step: read-only actions never move the state fingerprint; mutating actions
// do; every result carries a recognized envelope; badge gating refuses GM-only
// mutations under the Player badge; undo restores the pre-mutation fingerprint;
// and the fingerprint survives a server restart. Bounded (fixed seed, small
// step count) so the gate is deterministic. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support (exercises
// the REQ-032 gating, REQ-041 undo, and REQ-050 determinism contracts).

import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer } from "./mcp-client.js";
import { fingerprintStable, fingerprintChanged, envelopeRecognized, isDenial, fingerprintOf } from "./eval-oracle.js";
import type { EvalEvent, EvalFinding, TierResult } from "./eval-schema.js";

// Real source anchors per invariant class, so a finding cites the predicate it
// rests on rather than a gate message.
const P_READONLY = "holonovel/src/core/state.ts:1515"; // snapshot
const P_GATING = "holonovel/src/core/server.ts:22"; // requireGM
const P_UNDO = "holonovel/src/index.ts:2015"; // undo/redo handler
const P_ENVELOPE = "holonovel/src/world/parser.ts:26"; // dispatchCommand
const P_RESTART = "holonovel/src/core/state.ts:796"; // atomic persist
const NOVEL_NAME = "Holosuite Invariants";

/** Deterministic PRNG (mulberry32) — no wall-clock, reproducible per seed. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
    ctx.findings.push({ class: name, predicate, tier: "invariants", step, severity: "P1", target: req.join(","), detail });
  }
}

export async function runInvariants(opts: { serverDir: string; dataDir?: string; seed?: number; steps?: number }): Promise<TierResult> {
  const seed = opts.seed ?? 1;
  const steps = Math.min(opts.steps ?? 12, 200);
  const ctx: Ctx = { findings: [], events: [], passed: 0, failed: 0 };

  // Own the state dir: a client-owned temp dir is deleted on close, which would
  // break the restart reboot; a caller-supplied --data-dir must be preserved.
  const ownsDataDir = opts.dataDir === undefined;
  const dataDir = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-inv-"));
  const client = await bootServer({ serverDir: opts.serverDir, dataDir, seed });

  try {
    await client.call("manage_novel", { action: "create", name: NOVEL_NAME });
    await client.call("set_badge", { badge: "game_master" });

    // --- Invariant: read-only actions never move the fingerprint -------------
    let before = fingerprintOf(readNovel(dataDir));
    await client.call("manage_session", { action: "health" });
    await client.call("run_command", { action: "execute", command: "look" });
    let after = fingerprintOf(readNovel(dataDir));
    record(ctx, "read_only_no_mutation", fingerprintStable(before, after).ok, fingerprintStable(before, after).detail, 1, ["REQ-041"], P_READONLY);

    // --- Invariant: badge gating refuses a GM-only mutation under Player -----
    await client.call("set_badge", { badge: "player" });
    const refused = await client.call("manage_npc", { action: "create", name: "Probe" });
    record(ctx, "gating_refusal_is_denial", isDenial(refused.text, refused.isError).ok, isDenial(refused.text, refused.isError).detail, 2, ["REQ-032"], P_GATING);
    await client.call("set_badge", { badge: "game_master" });

    // --- Invariant: undo restores the pre-mutation fingerprint ---------------
    const preUndo = fingerprintOf(readNovel(dataDir));
    await client.call("manage_world", { action: "create_room", name: "Undo Room", description: "Temporary." });
    const postCreate = fingerprintOf(readNovel(dataDir));
    record(ctx, "mutation_observed", fingerprintChanged(preUndo, postCreate).ok, fingerprintChanged(preUndo, postCreate).detail, 3, ["REQ-041"], P_UNDO);
    await client.call("manage_history", { action: "undo" });
    const postUndo = fingerprintOf(readNovel(dataDir));
    record(ctx, "undo_round_trip", fingerprintStable(preUndo, postUndo).ok, `${fingerprintStable(preUndo, postUndo).detail}`, 4, ["REQ-041"], P_UNDO);

    // --- Bounded seeded sequence: every result carries a recognized envelope
    const rand = rng(seed);
    let step = 5;
    for (let i = 0; i < steps; i++) {
      step++;
      const choice = Math.floor(rand() * 3);
      let res;
      if (choice === 0) res = await client.call("manage_world", { action: "create_room", name: `Gen Room ${i}`, description: "generated." });
      else if (choice === 1) res = await client.call("manage_world", { action: "create_thing", name: `gen-thing-${i}`, location: "Hall" });
      else res = await client.call("run_command", { action: "execute", command: "look" });
      record(ctx, "envelope_recognized", envelopeRecognized(res.text, res.isError).ok, envelopeRecognized(res.text, res.isError).detail, step, ["REQ-001", "REQ-002"], P_ENVELOPE);
    }

    // --- Invariant: fingerprint survives a server restart --------------------
    const preRestart = fingerprintOf(readNovel(dataDir));
    await client.close();
    const rebooted = await bootServer({ serverDir: opts.serverDir, dataDir, seed });
    try {
      const listed = await rebooted.call("manage_novel", { action: "list" });
      record(ctx, "restart_reloads_novel", envelopeRecognized(listed.text, listed.isError).ok, envelopeRecognized(listed.text, listed.isError).detail, step + 1, ["REQ-050"], P_RESTART);
      const postRestart = fingerprintOf(readNovel(dataDir));
      record(ctx, "fingerprint_continuity_restart", fingerprintStable(preRestart, postRestart).ok, fingerprintStable(preRestart, postRestart).detail, step + 2, ["REQ-050"], P_RESTART);
      ctx.events.push({
        tier: "invariants", step, role: "generator", badge: "game_master", tool: "holosuite",
        args: { seed, steps }, prefix: "[OK]", error_class: "ok", is_error: false, mcp_error: false,
        latency_ms: 0, req_ids: ["REQ-050"], detail: `seeded sequence of ${steps} steps`,
      });
    } finally {
      await rebooted.close();
    }
  } catch (e) {
    ctx.failed++;
    ctx.findings.push({ class: "invariant_error", predicate: P_RESTART, tier: "invariants", step: 0, severity: "P1", target: "T1", detail: e instanceof Error ? e.message : String(e) });
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

  return { tier: "invariants", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
}
