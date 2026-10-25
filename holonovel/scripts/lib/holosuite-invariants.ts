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

import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer } from "./mcp-client.js";
import { fingerprintStable, fingerprintChanged, envelopeRecognized, isDenial, fingerprintOf } from "./eval-oracle.js";
import { readPersistedNovel } from "./eval-state.js";
import { assertionRecorder, type AssertionContext } from "./eval-assertion.js";
import type { TierResult } from "./eval-schema.js";

// Real source anchors per invariant class, so a finding cites the predicate it
// rests on rather than a gate message.
const P_READONLY = "holonovel/src/core/state.ts:1515"; // snapshot
const P_GATING = "holonovel/src/core/server.ts:22"; // requireGM
const P_UNDO = "holonovel/src/index.ts:3080"; // undo/redo handler
const P_ENVELOPE = "holonovel/src/world/parser.ts:26"; // dispatchCommand
const P_RESTART = "holonovel/src/core/state.ts:2241"; // atomic persist
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

export async function runInvariants(opts: { serverDir: string; dataDir?: string; seed?: number; steps?: number }): Promise<TierResult> {
  const seed = opts.seed ?? 1;
  const steps = Math.min(opts.steps ?? 12, 200);
  const ctx: AssertionContext = { findings: [], events: [], passed: 0, failed: 0 };
  const record = assertionRecorder(ctx, "invariants");

  // Own the state dir: a client-owned temp dir is deleted on close, which would
  // break the restart reboot; a caller-supplied --data-dir must be preserved.
  const ownsDataDir = opts.dataDir === undefined;
  const dataDir = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-inv-"));
  const client = await bootServer({ serverDir: opts.serverDir, dataDir, seed });

  try {
    await client.call("manage_novel", { action: "create", name: NOVEL_NAME });
    await client.call("set_badge", { badge: "game_master" });

    // --- Invariant: read-only actions never move the fingerprint -------------
    let before = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    await client.call("manage_diagnostics", { action: "health" });
    await client.call("run_command", { action: "execute", command: "look" });
    let after = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    record("read_only_no_mutation", fingerprintStable(before, after).ok, fingerprintStable(before, after).detail, 1, ["REQ-041"], P_READONLY);

    // --- Invariant: badge gating refuses a GM-only mutation under Player -----
    await client.call("set_badge", { badge: "player" });
    const refused = await client.call("manage_npc", { action: "create", name: "Probe" });
    record("gating_refusal_is_denial", isDenial(refused.text, refused.isError).ok, isDenial(refused.text, refused.isError).detail, 2, ["REQ-032"], P_GATING);
    await client.call("set_badge", { badge: "game_master" });

    // --- Invariant: diagnostics reads are non-mutating and repeat-stable ----
    const preDiag = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    const verifyOne = await client.call("manage_diagnostics", { action: "verify" });
    const verifyTwo = await client.call("manage_diagnostics", { action: "verify" });
    record("verify_repeat_stable", !verifyOne.isError && verifyOne.text === verifyTwo.text, verifyOne.text.split("\n")[0] ?? "", 2, ["REQ-603"], "holonovel/src/core/state-hash.ts:50");
    const replayOne = await client.call("manage_diagnostics", { action: "replay" });
    record("replay_read_only", !replayOne.isError, replayOne.text.split("\n")[0] ?? "", 2, ["REQ-604"], "holonovel/src/index.ts:8487");
    const ledgerOne = await client.call("manage_diagnostics", { action: "context_report" });
    const ledgerTwo = await client.call("manage_diagnostics", { action: "context_report" });
    record("context_report_stable", !ledgerOne.isError && ledgerOne.text === ledgerTwo.text, ledgerOne.isError ? "context_report errored" : `${ledgerOne.text.length} chars`, 2, ["REQ-606"], "holonovel/src/index.ts:8410");
    const postDiag = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    record("diagnostics_read_only", fingerprintStable(preDiag, postDiag).ok, fingerprintStable(preDiag, postDiag).detail, 2, ["REQ-603", "REQ-604", "REQ-606"], "holonovel/src/core/state-hash.ts:50");

    // --- Invariant: undo restores the pre-mutation fingerprint ---------------
    const preUndo = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    await client.call("manage_world", { action: "create_room", name: "Undo Room", description: "Temporary." });
    const postCreate = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    record("mutation_observed", fingerprintChanged(preUndo, postCreate).ok, fingerprintChanged(preUndo, postCreate).detail, 3, ["REQ-041"], P_UNDO);
    await client.call("manage_history", { action: "undo" });
    const postUndo = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    record("undo_round_trip", fingerprintStable(preUndo, postUndo).ok, `${fingerprintStable(preUndo, postUndo).detail}`, 4, ["REQ-041"], P_UNDO);

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
      record("envelope_recognized", envelopeRecognized(res.text, res.isError).ok, envelopeRecognized(res.text, res.isError).detail, step, ["REQ-001", "REQ-002"], P_ENVELOPE);
    }

    // --- Invariant: fingerprint survives a server restart --------------------
    const preRestart = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
    await client.close();
    const rebooted = await bootServer({ serverDir: opts.serverDir, dataDir, seed });
    try {
      const listed = await rebooted.call("manage_novel", { action: "list" });
      record("restart_reloads_novel", envelopeRecognized(listed.text, listed.isError).ok, envelopeRecognized(listed.text, listed.isError).detail, step + 1, ["REQ-050"], P_RESTART);
      const postRestart = fingerprintOf(readPersistedNovel(dataDir, NOVEL_NAME));
      record("fingerprint_continuity_restart", fingerprintStable(preRestart, postRestart).ok, fingerprintStable(preRestart, postRestart).detail, step + 2, ["REQ-050"], P_RESTART);
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
