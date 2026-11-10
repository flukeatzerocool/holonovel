#!/usr/bin/env node
/**
 * test-data-dir.ts — portable data-directory resolution harness. [gate]
 *
 * Exercises REQ-613/T731: TTRPG_DATA_DIR precedence, legacy
 * `<install>/.holonovel-state` detection, per-OS user-data paths, and
 * owner-only creation. Pure resolution (injected env/platform/exists/mkdir)
 * so no real user directory is touched.
 *
 * Also exercises REQ-397/T466: the in-work-tree detection, the
 * `[state-in-tree]` warning in `spec_health` and on stderr (non-blocking),
 * state survival across `git clean -fdx` + `git reset --hard`, and the repo
 * entry scripts resolving the same state location as the server.
 *
 * Usage: tsx scripts/test-data-dir.ts
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { resolveDataDir, locateStateDir } from "../src/core/data-dir.js";
import { StateManager } from "../src/core/state.js";
import { bootServer } from "./lib/mcp-client.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

async function testAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

interface Harness {
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  homedir: string;
  existing: Set<string>;
  markers: Set<string>;
  created: string[];
  options: Parameters<typeof resolveDataDir>[1];
}

function harness(overrides: Partial<Pick<Harness, "env" | "platform" | "homedir" | "existing" | "markers">> = {}): Harness {
  const h: Harness = {
    env: overrides.env ?? {},
    platform: overrides.platform ?? "linux",
    homedir: overrides.homedir ?? "/home/player",
    existing: overrides.existing ?? new Set<string>(),
    markers: overrides.markers ?? new Set<string>(),
    created: [],
    options: undefined,
  };
  h.options = {
    env: h.env,
    platform: h.platform,
    homedir: h.homedir,
    exists: (candidate: string) => h.existing.has(candidate),
    mkdir: (candidate: string) => { h.created.push(candidate); },
    isGitMarker: (candidate: string) => h.markers.has(candidate),
  };
  return h;
}

test("T731: TTRPG_DATA_DIR wins over every other location", () => {
  const h = harness({ env: { TTRPG_DATA_DIR: "/explicit/state" }, existing: new Set(["/pkg/.holonovel-state"]) });
  const out = resolveDataDir("/pkg", h.options);
  assert.equal(out, "/explicit/state");
  assert.deepEqual(h.created, ["/explicit/state"]);
});

test("an existing legacy directory is honored, not migrated", () => {
  const legacy = "/pkg/.holonovel-state";
  const h = harness({ existing: new Set([legacy]) });
  const out = resolveDataDir("/pkg", h.options);
  assert.equal(out, legacy);
  assert.deepEqual(h.created, []);
});

test("Linux uses XDG_DATA_HOME", () => {
  const h = harness({ env: { XDG_DATA_HOME: "/xdg" } });
  const out = resolveDataDir("/pkg", h.options);
  assert.equal(out, "/xdg/holonovel");
  assert.deepEqual(h.created, ["/xdg/holonovel"]);
});

test("Linux falls back to ~/.local/share", () => {
  const h = harness();
  const out = resolveDataDir("/pkg", h.options);
  assert.equal(out, "/home/player/.local/share/holonovel");
});

test("macOS uses Application Support", () => {
  const h = harness({ platform: "darwin" });
  const out = resolveDataDir("/pkg", h.options);
  assert.equal(out, "/home/player/Library/Application Support/holonovel");
});

test("Windows uses LOCALAPPDATA", () => {
  const h = harness({ platform: "win32", env: { LOCALAPPDATA: "C:\\Users\\player\\AppData\\Local" } });
  const out = resolveDataDir("/pkg", h.options);
  assert.ok(out.endsWith("holonovel"));
  assert.ok(out.includes("AppData"));
});

test("Windows falls back to APPDATA then the home directory", () => {
  const h = harness({ platform: "win32", env: { APPDATA: "C:\\Users\\player\\AppData\\Roaming" } });
  assert.ok(resolveDataDir("/pkg", h.options).includes("AppData"));
  const h2 = harness({ platform: "win32" });
  assert.ok(resolveDataDir("/pkg", h2.options).includes("AppData"));
});

test("the default never resolves inside the package root", () => {
  const h = harness({ env: { XDG_DATA_HOME: "/xdg" } });
  const out = resolveDataDir("/pkg", h.options);
  assert.ok(!out.startsWith("/pkg/"));
  assert.equal(out, "/xdg/holonovel");
});

test("an already-present per-OS directory is not recreated", () => {
  const h = harness({ env: { XDG_DATA_HOME: "/xdg" }, existing: new Set(["/xdg/holonovel"]) });
  const out = resolveDataDir("/pkg", h.options);
  assert.equal(out, "/xdg/holonovel");
  assert.deepEqual(h.created, []);
});

test("a creation failure propagates instead of silently falling back", () => {
  const h = harness({ env: { XDG_DATA_HOME: "/readonly" } });
  h.options!.mkdir = () => { throw new Error("EACCES"); };
  assert.throws(() => resolveDataDir("/pkg", h.options), /EACCES/);
});

// ── REQ-397 / T466 — in-work-tree detection ────────────────────────────────

test("T466/REQ-397: an explicit state path inside a work tree is reported", () => {
  const h = harness({ env: { TTRPG_DATA_DIR: "/repo/state" }, markers: new Set(["/repo/.git"]) });
  const location = locateStateDir("/pkg", h.options);
  assert.equal(location.source, "env");
  assert.equal(location.inGitWorkTree, true);
  assert.equal(location.workTreeRoot, "/repo");
});

test("T466/REQ-397: a per-OS state path outside any work tree is not flagged", () => {
  const h = harness({ env: { XDG_DATA_HOME: "/xdg" } });
  const location = locateStateDir("/pkg", h.options);
  assert.equal(location.source, "user-data");
  assert.equal(location.inGitWorkTree, false);
  assert.equal(location.workTreeRoot, null);
});

test("T466/REQ-397: an honored legacy directory inside a work tree is flagged", () => {
  const h = harness({
    existing: new Set(["/pkg/.holonovel-state"]),
    markers: new Set(["/pkg/.git"]),
  });
  const location = locateStateDir("/pkg", h.options);
  assert.equal(location.source, "legacy");
  assert.equal(location.inGitWorkTree, true);
  assert.equal(location.workTreeRoot, "/pkg");
});

test("T466/REQ-397: locateStateDir never creates a directory", () => {
  const h = harness({ env: { TTRPG_DATA_DIR: "/explicit/state" } });
  locateStateDir("/pkg", h.options);
  assert.deepEqual(h.created, []);
});

test("T466/REQ-397: a .git *file* marks a work-tree root", () => {
  const scratch = mkdtempSync(join(tmpdir(), "holo-gitfile-"));
  try {
    writeFileSync(join(scratch, ".git"), "gitdir: /elsewhere\n");
    mkdirSync(join(scratch, "state"), { recursive: true });
    const location = locateStateDir("/pkg", {
      env: { TTRPG_DATA_DIR: join(scratch, "state") },
      isGitMarker: (candidate) => existsSync(candidate),
    });
    assert.equal(location.inGitWorkTree, true);
    assert.equal(location.workTreeRoot, scratch);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

// ── REQ-397 / T466 — live server and entry-script cases ────────────────────

const SERVER_DIR = join(import.meta.dirname, "..");
const REPO_ROOT = join(import.meta.dirname, "..", "..");

function git(args: string[], cwd: string): void {
  const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
}

async function liveCases(): Promise<void> {
  await testAsync("T466/REQ-397: an in-tree state directory warns in spec_health and on stderr", async () => {
    const repo = mkdtempSync(join(tmpdir(), "holo-in-tree-"));
    const dataDir = join(repo, ".holonovel-state");
    try {
      mkdirSync(dataDir, { recursive: true });
      git(["init", "-q"], repo);
      const client = await bootServer({ serverDir: SERVER_DIR, dataDir });
      try {
        const health = await client.call("manage_diagnostics", { action: "health" });
        assert.equal(health.isError, false, health.text.slice(0, 300));
        assert.match(health.text, /\[state-in-tree\]/, "spec_health must carry [state-in-tree]");
        assert.match(client.stderrTail(), /\[state-in-tree\]/, "stderr must carry [state-in-tree]");
      } finally {
        await client.close();
      }
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  await testAsync("T466/REQ-397: state outside the work tree survives clean -fdx and reset --hard", async () => {
    const work = mkdtempSync(join(tmpdir(), "holo-work-"));
    const dataDir = mkdtempSync(join(tmpdir(), "holo-state-"));
    try {
      git(["init", "-q"], work);
      writeFileSync(join(work, "tracked.txt"), "tracked\n");
      git(["add", "-A"], work);
      git(["-c", "user.email=t@example.invalid", "-c", "user.name=T", "commit", "-qm", "init"], work);

      const state = new StateManager(dataDir);
      const novel = state.createNovel("Survival Novel");
      novel.world.rooms.set("room-1", {
        name: "Room",
        description: "A room.",
        exits: new Map(),
        doorRefs: new Map(),
        annotations: {} as never,
      });
      state.saveNovel(novel);
      state.roster.set("r1", { id: "r1", name: "Roster" } as never);
      state.saveRoster();
      state.codex.set("c1", { id: "c1", name: "Codex" } as never);
      state.saveCodex();
      state.serverNotes.set("n1", { content: "note" });
      state.saveServerNotes();
      mkdirSync(join(dataDir, "rulesets", "pkg"), { recursive: true });
      writeFileSync(join(dataDir, "rulesets", "pkg", "manifest.json"), "{\"slug\":\"pkg\"}");

      git(["clean", "-fdx"], work);
      git(["reset", "--hard"], work);

      assert.ok(existsSync(join(dataDir, "novels", "survival-novel.json")), "Novel must survive");
      assert.ok(existsSync(join(dataDir, "roster.json")), "roster must survive");
      assert.ok(existsSync(join(dataDir, "codex.json")), "codex must survive");
      assert.ok(existsSync(join(dataDir, "server-notes.json")), "server notes must survive");
      assert.ok(existsSync(join(dataDir, "rulesets", "pkg", "manifest.json")), "installed package must survive");

      const reloaded = new StateManager(dataDir);
      reloaded.loadRoster();
      reloaded.loadCodex();
      reloaded.loadServerNotes();
      reloaded.hydrateNovelsFromDisk();
      assert.ok(reloaded.novels.has("survival-novel"), "Novel must reload");
      assert.ok(reloaded.novels.get("survival-novel")!.world.rooms.has("room-1"), "world-model entry must reload");
      assert.ok(reloaded.roster.has("r1"), "roster must reload");
      assert.ok(reloaded.codex.has("c1"), "codex must reload");
      assert.ok(reloaded.serverNotes.has("n1"), "server notes must reload");
    } finally {
      rmSync(work, { recursive: true, force: true });
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  await testAsync("T466/REQ-397: the update entry point resolves the same state directory as the server", async () => {
    const home = mkdtempSync(join(tmpdir(), "holo-home-"));
    try {
      const xdg = join(home, "xdg");
      const env: NodeJS.ProcessEnv = { ...process.env, HOME: home, XDG_DATA_HOME: xdg };
      delete env.TTRPG_DATA_DIR;
      const result = spawnSync("npx", ["tsx", join(REPO_ROOT, "scripts", "update.ts"), "--data-only"], {
        cwd: REPO_ROOT,
        env,
        encoding: "utf-8",
      });
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
      const line = (result.stdout ?? "").split("\n").find((l) => l.startsWith("Install directory:"));
      assert.ok(line, "update must print the install directory");
      const resolved = line!.slice("Install directory:".length).trim();
      const expected = join(locateStateDir(join(REPO_ROOT, "holonovel"), { env }).dir, "rulesets");
      assert.equal(resolved, expected, "the entry point must read the same state location as the server");
      // F-P6b-8 regression guard: no repo entry point may carry its own
      // in-tree fallback again.
      for (const script of ["build-ruleset.ts", "update-rulesets.ts", "migrate-user-data.ts", "update.ts"]) {
        const source = readFileSync(join(REPO_ROOT, "scripts", script), "utf-8");
        assert.ok(
          !source.includes('join(root, "holonovel", ".holonovel-state")'),
          `${script} must not hardcode the in-tree state directory`,
        );
      }
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
}

await liveCases();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
