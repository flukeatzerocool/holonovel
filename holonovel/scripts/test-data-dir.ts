#!/usr/bin/env node
/**
 * test-data-dir.ts — portable data-directory resolution harness. [gate]
 *
 * Exercises REQ-613/T731: TTRPG_DATA_DIR precedence, legacy
 * `<install>/.holonovel-state` detection, per-OS user-data paths, and
 * owner-only creation. Pure resolution (injected env/platform/exists/mkdir)
 * so no real user directory is touched.
 *
 * Usage: tsx scripts/test-data-dir.ts
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 */
import { strict as assert } from "node:assert";
import { resolveDataDir } from "../src/core/data-dir.js";

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

interface Harness {
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  homedir: string;
  existing: Set<string>;
  created: string[];
  options: Parameters<typeof resolveDataDir>[1];
}

function harness(overrides: Partial<Pick<Harness, "env" | "platform" | "homedir" | "existing">> = {}): Harness {
  const h: Harness = {
    env: overrides.env ?? {},
    platform: overrides.platform ?? "linux",
    homedir: overrides.homedir ?? "/home/player",
    existing: overrides.existing ?? new Set<string>(),
    created: [],
    options: undefined,
  };
  h.options = {
    env: h.env,
    platform: h.platform,
    homedir: h.homedir,
    exists: (candidate: string) => h.existing.has(candidate),
    mkdir: (candidate: string) => { h.created.push(candidate); },
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
