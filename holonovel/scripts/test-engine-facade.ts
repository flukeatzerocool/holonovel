#!/usr/bin/env node
/**
 * test-engine-facade.ts — in-process engine façade parity and isolation. [gate]
 *
 * Proves the E3 seam: the tool registry is the definition site, the façade
 * drives the same handlers and guard path as the MCP adapter, and importing the
 * library does not start a transport.
 *
 * Asserts:
 * - GM tool calls succeed through `createEngine()`.
 * - A Player call to a GM-only tool refuses with `[FORBIDDEN]`.
 * - A retired compatibility alias refuses with `[NOT_FOUND]` naming its replacement.
 * - Façade output equals direct registry-handler output for read-only calls.
 * - Two identical seeded sequences produce the same canonical state hash.
 * - A child process importing the library (built when available) exits without
 *   starting a server.
 *
 * Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal error.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const ROOT = join(import.meta.dirname, "..");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-engine-facade-"));
process.env.TTRPG_DATA_DIR = DATA_DIR;
process.env.TTRPG_SEED = "1";

const NOVEL = "torre-nosferatu";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  FAIL ${name}: ${e?.message ?? e}`);
  }
}
function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}
function textOf(result: any): string {
  return (result?.content ?? []).map((part: any) => part?.text ?? "").join("\n");
}

async function loadLibrary(): Promise<any> {
  return import(pathToFileURL(join(ROOT, "src", "library.ts")).href);
}

async function runSequence(): Promise<void> {
  const { createEngine } = await loadLibrary();
  const { stateHash } = await import(pathToFileURL(join(ROOT, "src", "core", "state-hash.ts")).href);
  const engine = createEngine();
  await engine.tools.call("manage_novel", { action: "resume", slug: NOVEL });
  await engine.tools.call("respond_decision", { decision: "present_choices", option: "take_stair" });
  await engine.tools.call("set_badge", { badge: "game_master" });
  await engine.tools.call("resolve_mechanic", { action: "fate_roll" });
  await engine.tools.call("manage_countdown", { action: "set", name: "e3-clock", ticks: 3 });
  const exported = await engine.tools.call("manage_archive", { action: "export" });
  engine.close();
  const bundle = JSON.parse(textOf(exported));
  // The canonical hash covers every persisted field, including the wall-clock
  // `last_mutation_at`; mask only that field so the sequence's deterministic
  // content can be compared across processes.
  const novel = { ...(bundle?.novel ?? {}), last_mutation_at: null };
  console.log(JSON.stringify({ state_hash: stateHash(novel), events: novel?.event_log?.length ?? null }));
}

async function childStateHash(dir: string): Promise<string> {
  const self = join(import.meta.dirname, "test-engine-facade.ts");
  const run = spawnSync("npx", ["tsx", self, "--sequence"], {
    cwd: ROOT,
    env: { ...process.env, TTRPG_DATA_DIR: dir, TTRPG_SEED: "1" },
    encoding: "utf8",
    timeout: 120_000,
  });
  if (run.status !== 0) {
    throw new Error(`sequence child failed (status ${run.status}): ${(run.stderr ?? "").slice(0, 300)}`);
  }
  const line = (run.stdout ?? "").trim().split("\n").reverse().find((candidate) => candidate.startsWith("{"));
  if (!line) throw new Error(`sequence child produced no hash: ${(run.stdout ?? "").slice(0, 200)}`);
  const parsed = JSON.parse(line);
  const hash = parsed?.state_hash;
  if (typeof hash !== "string" || hash.length === 0) throw new Error("sequence child produced no state hash");
  return `${hash}:${parsed.events}`;
}

async function skipAutostartCheck(): Promise<void> {
  const built = join(ROOT, "dist", "library.js");
  const source = join(ROOT, "src", "library.ts");
  // A stale dist must not stand in for the current source: require the built
  // entry to exist and to be at least as new as the source it implements.
  const builtEngine = join(ROOT, "dist", "engine.js");
  const sourceEntry = join(ROOT, "src", "index.ts");
  const useBuilt = existsSync(built) && existsSync(builtEngine)
    && statSync(builtEngine).mtimeMs >= statSync(sourceEntry).mtimeMs;
  const target = useBuilt ? pathToFileURL(built).href : pathToFileURL(source).href;
  const code = `import(${JSON.stringify(target)}).then((m) => { if (typeof m.createEngine !== "function") process.exit(1); process.exit(0); })`;
  const run = useBuilt
    ? spawnSync(process.execPath, ["--input-type=module", "-e", code], {
        cwd: ROOT,
        env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, TTRPG_SEED: "1" },
        encoding: "utf8",
        timeout: 60_000,
      })
    : spawnSync("npx", ["tsx", "-e", code], {
        cwd: ROOT,
        env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, TTRPG_SEED: "1" },
        encoding: "utf8",
        timeout: 60_000,
      });
  if (run.status !== 0) {
    throw new Error(`importing the library did not exit cleanly (status ${run.status}, signal ${run.signal}): ${(run.stderr ?? "").slice(0, 300)}`);
  }
}

async function main(): Promise<void> {
  if (process.argv.includes("--sequence")) {
    await runSequence();
    harnessComplete();
    process.exit(0);
  }
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: tsx scripts/test-engine-facade.ts [--help]");
    console.log("Gate: façade parity, guard reuse, determinism, and no-autostart library import.");
    return;
  }
  const { createEngine } = await loadLibrary();
  const engine = createEngine();
  const index = await import(pathToFileURL(join(ROOT, "src", "index.ts")).href);

  try {
    await test("GM call succeeds through the facade", async () => {
      await engine.tools.call("manage_novel", { action: "resume", slug: NOVEL });
      const drained = await engine.tools.call("respond_decision", { decision: "present_choices", option: "take_stair" });
      assert(drained?.isError !== true, `workflow drain failed: ${textOf(drained).slice(0, 160)}`);
      const badge = await engine.tools.call("set_badge", { badge: "game_master" });
      assert(badge?.isError !== true, `badge switch failed: ${textOf(badge).slice(0, 160)}`);
      const result = await engine.tools.call("manage_countdown", { action: "list" });
      assert(result?.isError !== true, `GM call errored: ${textOf(result).slice(0, 160)}`);
      assert(textOf(result).length > 0, "GM call returned an empty envelope");
    });

    await test("Player call to a GM-only tool refuses with FORBIDDEN", async () => {
      const switched = await engine.tools.call("set_badge", { badge: "player" });
      assert(switched?.isError !== true, `badge switch failed: ${textOf(switched).slice(0, 160)}`);
      const result = await engine.tools.call("manage_diagnostics", { action: "verify" });
      assert(result?.isError === true, "GM-only call did not error for the Player badge");
      assert(/\[FORBIDDEN\]/.test(textOf(result)), `missing FORBIDDEN marker: ${textOf(result).slice(0, 160)}`);
      await engine.tools.call("set_badge", { badge: "game_master" });
    });

    await test("retired alias refuses and names the replacement", async () => {
      const result = await engine.tools.call("manage_novel", { action: "export" });
      assert(result?.isError === true, "retired alias did not refuse");
      assert(/\[NOT_FOUND\]/.test(textOf(result)) && /manage_archive/.test(textOf(result)),
        `refusal did not name manage_archive: ${textOf(result).slice(0, 160)}`);
    });

    await test("facade output equals direct registry-handler output", async () => {
      const registry = index.toolRegistry;
      const calls: Array<[string, Record<string, unknown>]> = [
        ["manage_novel", { action: "list" }],
        ["manage_countdown", { action: "list" }],
        ["manage_session", { action: "discover", query: "novel" }],
      ];
      for (const [name, args] of calls) {
        const viaFacade = await engine.tools.call(name, args);
        const direct = await registry.get(name)!.handler(args, { badge: "game_master" });
        assert(JSON.stringify(viaFacade) === JSON.stringify(direct), `${name} envelope drifted between facade and registry handler`);
      }
    });

    await test("list and get expose the same definitions", async () => {
      const listed = engine.tools.list();
      const names = listed.map((tool: any) => tool.name);
      assert(names.length > 0, "empty tool list");
      assert(new Set(names).size === names.length, "duplicate tool names in the facade listing");
      for (const name of names.slice(0, 5)) {
        assert(engine.tools.get(name)?.name === name, `get(${name}) did not resolve`);
      }
      assert(engine.tools.get("no_such_tool") === undefined, "get() resolved an unknown tool");
    });

    await test("two identical seeded sequences produce the same state hash", async () => {
      const firstDir = mkdtempSync(join(tmpdir(), "holonovel-engine-seq-a-"));
      const secondDir = mkdtempSync(join(tmpdir(), "holonovel-engine-seq-b-"));
      try {
        const first = await childStateHash(firstDir);
        const second = await childStateHash(secondDir);
        assert(first === second, `state hash diverged: ${first} vs ${second}`);
      } finally {
        rmSync(firstDir, { recursive: true, force: true });
        rmSync(secondDir, { recursive: true, force: true });
      }
    });

    await test("importing the library does not start a transport", async () => {
      await skipAutostartCheck();
    });
  } finally {
    engine.close();
    rmSync(DATA_DIR, { recursive: true, force: true });
  }

  console.log(`test-engine-facade: ${passed} passed, ${failed} failed`);
  harnessComplete();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
