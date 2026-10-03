// holosuite-differential.ts — Tier T4: bounded differential/replay checks.
//
// Compares two independently built Novels that received the same operations in
// different orders, and replays the same operation sequence in a second server
// process, asserting an order-independent world projection is identical. Owns
// the class the persistence harness (scripts/test-persistence.ts) and the
// restart-continuity invariant (T1) do not: cross-process determinism of an
// explicitly seeded operation sequence. No generation tables are used, so the
// tier is ruleset-free. Bounded and deterministic. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support (exercises the
// REQ-050 determinism and REQ-089 persistence contracts).

import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer, type McpClient } from "./mcp-client.js";
import type { EvalEvent, EvalFinding, TierResult } from "./eval-schema.js";

// Real source anchors per finding class.
const P_REPLAY = "holonovel/src/core/state.ts:796"; // atomic persist
const P_WORLD = "holonovel/src/world/model.js:82"; // WorldModel.rooms/things maps

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
    ctx.findings.push({ class: name, predicate, tier: "differential", step, severity: "P1", target: req.join(","), detail });
  }
}

function readNovel(dataDir: string): Record<string, unknown> {
  const dir = join(dataDir, "novels");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error("no novel file persisted");
  return JSON.parse(readFileSync(join(dir, files[0]!), "utf-8")) as Record<string, unknown>;
}

/** Order- and id-independent projection of the world model. */
function worldProjection(novel: Record<string, unknown>): string {
  const world = (novel.world ?? {}) as { rooms?: Record<string, { name?: string }>; things?: Record<string, { name?: string; location?: string | null }> };
  const rooms = Object.values(world.rooms ?? {}).map((r) => String(r.name ?? "")).sort();
  const things = Object.values(world.things ?? {}).map((t) => `${t.name}@${t.location ?? ""}`).sort();
  return JSON.stringify({ rooms, things });
}

async function buildNovel(client: McpClient, name: string, rooms: string[], thingLocation: string): Promise<void> {
  await client.call("manage_novel", { action: "create", name });
  await client.call("set_badge", { badge: "game_master" });
  for (const room of rooms) {
    await client.call("manage_world", { action: "create_room", name: room, description: `${room} room.` });
  }
  await client.call("manage_world", { action: "create_thing", name: "coin", location: thingLocation });
}

export async function runDifferential(opts: { serverDir: string; dataDir?: string; seed?: number }): Promise<TierResult> {
  const ctx: Ctx = { findings: [], events: [], passed: 0, failed: 0 };
  const ownsDataDir = opts.dataDir === undefined;
  const dataDirA = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-diff-a-"));
  const dataDirB = mkdtempSync(join(tmpdir(), "holosuite-diff-b-"));
  const seed = opts.seed ?? 1;

  let a: McpClient | undefined;
  let b: McpClient | undefined;
  try {
    // --- Two independent processes, same ops in different orders ------------
    a = await bootServer({ serverDir: opts.serverDir, dataDir: dataDirA, seed });
    await buildNovel(a, "Holosuite Diff A", ["P", "Q", "R"], "P");
    const projectionA = worldProjection(readNovel(dataDirA));

    b = await bootServer({ serverDir: opts.serverDir, dataDir: dataDirB, seed });
    await buildNovel(b, "Holosuite Diff B", ["R", "Q", "P"], "P");
    const projectionB = worldProjection(readNovel(dataDirB));

    record(ctx, "order_independence", projectionA === projectionB, projectionA === projectionB ? "projections equal" : `${projectionA} != ${projectionB}`, 1, ["REQ-050"], P_WORLD);

    // --- Replay the same sequence in a third process ------------------------
    const dataDirC = mkdtempSync(join(tmpdir(), "holosuite-diff-c-"));
    const c = await bootServer({ serverDir: opts.serverDir, dataDir: dataDirC, seed });
    try {
      await buildNovel(c, "Holosuite Diff C", ["P", "Q", "R"], "P");
      const projectionC = worldProjection(readNovel(dataDirC));
      record(ctx, "cross_process_replay", projectionA === projectionC, projectionA === projectionC ? "replay projection equal" : `${projectionA} != ${projectionC}`, 2, ["REQ-050"], P_REPLAY);
    } finally {
      await c.close();
      rmSync(dataDirC, { recursive: true, force: true });
    }

    // --- Restart preserves the projection -----------------------------------
    await a.close();
    a = await bootServer({ serverDir: opts.serverDir, dataDir: dataDirA, seed });
    const projectionA2 = worldProjection(readNovel(dataDirA));
    record(ctx, "restart_projection_stable", projectionA === projectionA2, projectionA === projectionA2 ? "projection stable across restart" : `${projectionA} != ${projectionA2}`, 3, ["REQ-089"], P_REPLAY);

    ctx.events.push({
      tier: "differential", step: 4, role: "prober", badge: "game_master", tool: "holosuite",
      args: { seed, rooms: ["P", "Q", "R"] }, prefix: "[OK]", error_class: "ok", is_error: false,
      mcp_error: false, latency_ms: 0, req_ids: ["REQ-050"], detail: "differential projection comparison",
    });
  } catch (e) {
    ctx.failed++;
    ctx.findings.push({ class: "differential_error", predicate: P_REPLAY, tier: "differential", step: 0, severity: "P1", target: "T4", detail: e instanceof Error ? e.message : String(e) });
  } finally {
    if (a) await a.close();
    if (b) await b.close();
    if (ownsDataDir) {
      try {
        rmSync(dataDirA, { recursive: true, force: true });
        rmSync(dataDirB, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup of the temp dirs; not a test signal.
      }
    }
  }

  return { tier: "differential", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
}
