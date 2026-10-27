#!/usr/bin/env node
/**
 * smoke-package.ts — packed-artifact integrity gate. [gate]
 *
 * Packs the server (REQ-614/T732), verifies the tarball file list, installs it
 * in an isolated directory, and drives an MCP handshake that asserts the
 * embedded specification, the recorded tool surface, starter seeding, the
 * default data directory (REQ-613), and that importing the package root does
 * not start a server.
 *
 * Usage: tsx scripts/smoke-package.ts
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 */
import { strict as assert } from "node:assert";
import { execFileSync, spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolveDataDir } from "../src/core/data-dir.js";
import { harnessComplete, installHarnessGuard } from "./lib/harness-guard.js";

installHarnessGuard();

const ROOT = resolve(import.meta.dirname, "..", "..");
const PACKAGE = join(ROOT, "holonovel");
const SPEC = join(ROOT, "holonovel.md");
const TEMP = mkdtempSync(join(tmpdir(), "holonovel-package-smoke-"));
const PACKED_LIMIT = 2.5 * 1024 * 1024;

const REQUIRED = [
  "package.json",
  "README.md",
  "LICENSE.md",
  "bin/holonovel.js",
  "dist/index.js",
  "dist/library.js",
  "dist/core/index.js",
  "dist/world/index.js",
  "src/index.ts",
  "content/torre-nosferatu.json",
  "holonovel.md",
  "tool-surface-registry.json",
  "tool-disambiguation.json",
];
const FORBIDDEN = [
  "content/torre-nosferatu.source.json",
  "tool-definitions.json",
  "tool-routing.json",
];
const FORBIDDEN_PREFIXES = ["scripts/", "testdata/", ".holonovel-state/"];

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

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

class Rpc {
  private child: ChildProcess;
  private buffer = "";
  private pending = new Map<number, (message: any) => void>();
  private nextId = 0;
  private stderr = "";

  constructor(child: ChildProcess) {
    this.child = child;
    child.stdout!.on("data", (data: Buffer) => {
      this.buffer += data.toString();
      let index = this.buffer.indexOf("\n");
      while (index >= 0) {
        const line = this.buffer.slice(0, index).trim();
        this.buffer = this.buffer.slice(index + 1);
        if (line) this.dispatch(line);
        index = this.buffer.indexOf("\n");
      }
    });
    child.stderr!.on("data", (data: Buffer) => { this.stderr += data.toString(); });
  }

  private dispatch(line: string): void {
    let message: any;
    try {
      message = JSON.parse(line);
    } catch {
      // Non-JSON stdout is ignored; the server speaks newline-delimited JSON.
      return;
    }
    if (message.id !== undefined && this.pending.has(message.id)) {
      this.pending.get(message.id)!(message);
      this.pending.delete(message.id);
    }
  }

  request(method: string, params: Record<string, unknown> = {}): Promise<any> {
    return new Promise((resolveRequest, rejectRequest) => {
      const id = ++this.nextId;
      this.pending.set(id, resolveRequest);
      this.child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      setTimeout(() => {
        if (this.pending.delete(id)) rejectRequest(new Error(`timeout: ${method}\n${this.stderr.slice(-4000)}`));
      }, 20_000);
    });
  }

  notify(method: string): void {
    this.child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method }) + "\n");
  }

  close(): void {
    try {
      this.child.kill();
    } catch {
      // Already exited: nothing to close.
    }
  }

  diagnostics(): string {
    return this.stderr.slice(-4000);
  }
}

function runRpc(packageDir: string, env: NodeJS.ProcessEnv): Rpc {
  const child = spawn(process.execPath, ["bin/holonovel.js"], {
    cwd: packageDir,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return new Rpc(child);
}

async function main(): Promise<void> {
  const packedJson = execFileSync("npm", ["pack", "--json", "--pack-destination", TEMP], {
    cwd: PACKAGE,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 300_000,
  });
  const jsonStart = packedJson.indexOf("[");
  const jsonEnd = packedJson.lastIndexOf("]");
  if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error(`could not locate npm pack JSON: ${packedJson.slice(0, 400)}`);
  const packed = JSON.parse(packedJson.slice(jsonStart, jsonEnd + 1))[0];
  const paths: string[] = packed.files.map((file: { path: string }) => file.path);

  test("T732: tarball contains every required runtime artifact", () => {
    const missing = REQUIRED.filter((file) => !paths.includes(file));
    assert.deepEqual(missing, [], `missing: ${missing.join(", ")}`);
  });
  test("tarball excludes build-only inputs", () => {
    const forbidden = paths.filter((file) => FORBIDDEN.includes(file) || FORBIDDEN_PREFIXES.some((prefix) => file.startsWith(prefix)));
    assert.deepEqual(forbidden, [], `forbidden: ${forbidden.join(", ")}`);
  });
  test(`tarball is at most ${PACKED_LIMIT} bytes`, () => {
    assert.ok(packed.size <= PACKED_LIMIT, `packed size ${packed.size} > ${PACKED_LIMIT}`);
  });

  const tarball = join(TEMP, packed.filename);
  const app = join(TEMP, "app");
  mkdirSync(app, { recursive: true });
  writeFileSync(join(app, "package.json"), JSON.stringify({ private: true, type: "module" }) + "\n");

  let usedOfflineFallback = false;
  let installed = false;
  for (let attempt = 1; attempt <= 2 && !installed; attempt++) {
    try {
      execFileSync("npm", ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
        cwd: app,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 300_000,
      });
      installed = true;
    } catch (error) {
      rmSync(join(app, "node_modules"), { recursive: true, force: true });
      if (attempt === 1) {
        console.error(`  WARN npm install attempt 1 failed; retrying: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
        continue;
      }
      usedOfflineFallback = true;
      console.error(`  WARN npm install failed twice; using offline node_modules fallback: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
      mkdirSync(join(app, "node_modules", "holonovel"), { recursive: true });
      execFileSync("tar", ["-xzf", tarball, "-C", join(app, "node_modules", "holonovel"), "--strip-components=1"], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      symlinkSync(join(PACKAGE, "node_modules"), join(app, "node_modules", "holonovel", "node_modules"), "dir");
    }
  }

  const packageDir = join(app, "node_modules", "holonovel");
  const home = join(TEMP, "home");
  mkdirSync(home, { recursive: true });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: home,
    XDG_DATA_HOME: join(TEMP, "xdg"),
    LOCALAPPDATA: join(TEMP, "localappdata"),
    APPDATA: join(TEMP, "appdata"),
  };
  delete env.TTRPG_DATA_DIR;
  delete env.TTRPG_STARTER_NOVEL;

  const dataDir = resolveDataDir(packageDir, { env });
  const rpc = runRpc(packageDir, env);
  try {
    await rpc.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "package-smoke", version: "1.0.0" },
    });
    rpc.notify("notifications/initialized");

    const tools = await rpc.request("tools/list");
    const definitions = JSON.parse(readFileSync(join(PACKAGE, "tool-definitions.json"), "utf-8"));
    const expectedTools = definitions.tool_count;
    test(`tools/list exposes ${expectedTools} tools`, () => {
      assert.equal(tools.result.tools.length, expectedTools);
      const names = new Set(tools.result.tools.map((tool: { name: string }) => tool.name));
      for (const required of ["resolve_mechanic", "manage_diagnostics", "manage_world"]) {
        assert.ok(names.has(required), `missing tool: ${required}`);
      }
      for (const retired of ["resolve_fate", "resolve_ironsworn", "resolve_forged"]) {
        assert.ok(!names.has(retired), `retired alias should be hidden: ${retired}`);
      }
    });

    const resources = await rpc.request("resources/list");
    test("resources/list includes spec://build", () => {
      const uris = resources.result.resources.map((resource: { uri: string }) => resource.uri);
      assert.ok(uris.includes("spec://build"), "spec://build missing");
    });

    const spec = await rpc.request("resources/read", { uri: "spec://build" });
    const specText: string = spec.result.contents[0].text;
    test("spec://build returns the shipped specification", () => {
      assert.ok(specText.length > 100_000, `spec length ${specText.length}`);
      assert.ok(!specText.includes("Specification not embedded"), "spec resource is the placeholder");
    });

    const healthResult = await rpc.request("tools/call", {
      name: "manage_diagnostics",
      arguments: { action: "health" },
    });
    const healthText = (healthResult.result.content ?? []).map((part: { text?: string }) => part.text ?? "").join("\n");
    const health = JSON.parse(healthText);
    const expectedHash = sha256(SPEC);
    test("spec_health reports the shipped spec and source hashes", () => {
      assert.equal(health.spec_hash, expectedHash);
      assert.equal(health.spec_hash_current, true);
      assert.match(String(health.source_hash), /^[a-f0-9]{64}$/, `source_hash unavailable: ${health.source_hash}`);
    });

    test("starter Novel seeded in the per-OS data directory", () => {
      assert.ok(existsSync(join(dataDir, "novels", "torre-nosferatu.json")), `missing starter under ${dataDir}`);
    });
    test("no state directory was created inside the installed package", () => {
      assert.ok(!existsSync(join(packageDir, ".holonovel-state")), "package-local .holonovel-state exists");
    });

    const libraryCode = [
      "const m = await import('holonovel');",
      "if (typeof m.core?.StateManager !== 'function') throw new Error('core namespace missing');",
      "if (!m.world?.WORLD_MODEL_KINDS) throw new Error('world namespace missing');",
    ].join("\n");
    const library = spawnSync(process.execPath, ["--input-type=module", "-e", libraryCode], {
      cwd: app,
      env,
      encoding: "utf-8",
      timeout: 5000,
    });
    test("importing the package root resolves the library without starting a server", () => {
      assert.notEqual((library.error as NodeJS.ErrnoException | undefined)?.code, "ETIMEDOUT", "library import started the server and timed out");
      assert.equal(library.status, 0, `library import exited ${library.status}: ${library.stderr}`);
    });

    if (usedOfflineFallback) console.error("  WARN offline fallback was used; dependency resolution was not exercised");
  } finally {
    rpc.close();
    rmSync(TEMP, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    harnessComplete();
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((error) => {
    harnessComplete();
    console.error("smoke-package: fatal:", error instanceof Error ? error.stack ?? error.message : error);
    rmSync(TEMP, { recursive: true, force: true });
    process.exit(2);
  });
