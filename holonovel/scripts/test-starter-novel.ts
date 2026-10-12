#!/usr/bin/env node
/**
 * test-starter-novel.ts — bundled starter Novel harness. [gate]
 *
 * Purpose: verify the bundled starter contract (REQ-565/REQ-566). A fresh
 * install seeds the ruleset-free `torre-nosferatu` Novel once; the tombstone
 * suppresses re-seed after deletion; TTRPG_STARTER_NOVEL=off opts out; a
 * missing asset is non-fatal; the seeded Novel resumes and is playable with no
 * ruleset; and `spec_health` reports its provenance with no [data-stale] flag.
 *
 * Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal.
 *
 * Usage: tsx scripts/test-starter-novel.ts [--help]
 * REQ-565, REQ-566.
 */

import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateManager } from "../src/core/state.js";
import { bootServer } from "./lib/mcp-client.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: test-starter-novel.ts");
  console.log("  Verifies REQ-565/REQ-566 starter seed, tombstone, opt-out, playability.");
  process.exit(0);
}

const SERVER_DIR = join(import.meta.dirname, "..");
const SLUG = "torre-nosferatu";
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: unknown) { failed++; console.error(`  FAIL ${name}: ${(e as Error).message}`); }
}
function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}
function freshDir(): string {
  const d = mkdtempSync(join(tmpdir(), "holonovel-starter-"));
  mkdirSync(d, { recursive: true });
  return d;
}
function healthJson(text: string): Record<string, any> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1));
}

async function main(): Promise<void> {
  await test("T658/REQ-565: fresh install seeds the starter once", () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    assert(s.starterStatus.seeded === true, "starterStatus.seeded true");
    assert(s.novels.has(SLUG), "starter Novel is hydrated");
    assert(existsSync(join(dir, "novels", `${SLUG}.json`)), "starter save written");
    assert(existsSync(join(dir, "starter-seeded.json")), "tombstone sentinel written");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: tombstone suppresses re-seed after deletion", () => {
    const dir = freshDir();
    new StateManager(dir).seedStarterNovel();
    rmSync(join(dir, "novels", `${SLUG}.json`));
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    assert(s.starterStatus.skipped === "already-seeded", "second seed skipped");
    assert(!s.novels.has(SLUG), "deleted starter is not resurrected");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: TTRPG_STARTER_NOVEL=off opts out", () => {
    const dir = freshDir();
    process.env.TTRPG_STARTER_NOVEL = "off";
    const s = new StateManager(dir);
    try {
      s.seedStarterNovel();
      s.hydrateNovelsFromDisk();
    } finally {
      delete process.env.TTRPG_STARTER_NOVEL;
    }
    assert(s.starterStatus.skipped === "opt-out", "opt-out recorded");
    assert(!s.novels.has(SLUG), "no starter seeded under opt-out");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: a missing asset is non-fatal", () => {
    const dir = freshDir();
    process.env.TTRPG_STARTER_NOVEL = "no-such-starter";
    const s = new StateManager(dir);
    try {
      s.seedStarterNovel();
    } finally {
      delete process.env.TTRPG_STARTER_NOVEL;
    }
    assert(s.starterStatus.skipped === "asset-missing", "missing asset recorded, not thrown");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: seeded Novel resumes and is playable with no ruleset", async () => {
    const c = await bootServer({ serverDir: SERVER_DIR, env: { TTRPG_BADGE: "game_master" } });
    try {
      const list = await c.call("manage_novel", { action: "list" });
      assert(list.text.includes(SLUG), "starter listed");
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const look = await c.call("run_command", { action: "execute", command: "look" });
      assert(!look.isError, `look failed: ${look.text}`);
      assert(look.text.length > 20, "look returned room content ruleset-free");
    } finally {
      await c.close();
    }
  });

  await test("T659/REQ-566: spec_health reports provenance with no stale flag", async () => {
    const c = await bootServer({ serverDir: SERVER_DIR, env: { TTRPG_BADGE: "game_master" } });
    try {
      const health = await c.call("manage_session", { action: "health" });
      const h = healthJson(health.text);
      assert(h.starter?.slug === SLUG, "starter slug reported");
      assert(h.starter?.seeded === true, "starter seeded reported");
      assert(h.data_health?.stale && Object.keys(h.data_health.stale).length === 0,
        "no [data-stale] entry for the seeded starter");
    } finally {
      await c.close();
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed === 0) harnessComplete();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
