#!/usr/bin/env node
/**
 * test-artifact-registry.ts — local artifact registry and admission harness. [gate]
 *
 * Exercises REQ-620/T738 and REQ-621/T739 against two isolated servers: an
 * artifact set is created on installation A, copied through the filesystem
 * exchange inbox, installed on installation B, and resolved offline through
 * `manage_artifact`. Covers registry equality and determinism, per-kind
 * catalogs, tamper/duplicate/traversal refusal, dependency-safe removal, and
 * security-event audit entries.
 *
 * Usage: tsx scripts/test-artifact-registry.ts
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 */
import { strict as assert } from "node:assert";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { resourceReader } from "./lib/jsonrpc.js";
import { computeContentHash } from "../src/rulesets.js";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const ROOT_A = mkdtempSync(join(tmpdir(), "holonovel-artifact-a-"));
const ROOT_B = mkdtempSync(join(tmpdir(), "holonovel-artifact-b-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";

function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: ChildProcess): void {
  buffer = "";
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)!(msg); pending.delete(msg.id); }
      } catch { /* non-JSON diagnostic line */ }
    }
  });
}
async function boot(dataDir: string): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: dataDir },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "artifact-registry-test", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 300));
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
}
const readResource = resourceReader(send);
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}

const ADVENTURE_BODY = "# Harbor Signal\n\n## Overview\nA signal in the fog.\n\n## Adventure Hook\nSomeone answers.\n";

function adventureFixture(): string {
  const body = ADVENTURE_BODY;
  const hash = createHash("sha256").update(body).digest("hex");
  return `---\ncreator: Ada\nattribution: Original work\nlicense: CC BY 4.0\ncontent_hash: ${hash}\n---\n${body}`;
}

function rulesetFixture(dir: string): { slug: string; manifest: any } {
  const slug = "fixture-rules";
  const manifest = {
    slug,
    name: "Fixture Rules",
    host_version: "0.0.0",
    package_format: PACKAGE_FORMAT,
    content_hash: "",
    built_at: "2026-10-29T00:00:00Z",
    counts: {},
  };
  const index: any[] = [];
  const model = {};
  const tools: any[] = [];
  const resources: any[] = [];
  const prompts: any[] = [];
  manifest.content_hash = computeContentHash(index, model, tools, resources, prompts);
  mkdirSync(dir, { recursive: true });
  for (const [name, value] of Object.entries({ "manifest.json": manifest, "index.json": index, "model.json": model, "tools.json": tools, "resources.json": resources, "prompts.json": prompts })) {
    writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + "\n");
  }
  return { slug, manifest };
}

async function registry(proc: ChildProcess, filter: Record<string, unknown> = {}): Promise<any> {
  return JSON.parse(await call(proc, "manage_artifact", { action: "list", ...filter }));
}

async function main() {
  console.log("=== Local artifact registry and admission (REQ-620/621) ===\n");

  mkdirSync(join(ROOT_A, "adventures"), { recursive: true });
  mkdirSync(join(ROOT_A, "inbox"), { recursive: true });
  mkdirSync(join(ROOT_B, "inbox"), { recursive: true });

  writeFileSync(join(ROOT_A, "adventures", "harbor-signal.md"), adventureFixture());
  const ruleset = rulesetFixture(join(ROOT_A, "rulesets", "fixture-rules"));

  const a = await boot(ROOT_A);
  const b = await boot(ROOT_B);

  await call(a, "set_badge", { badge: "game_master" });
  await call(b, "set_badge", { badge: "game_master" });
  await call(a, "manage_novel", { action: "create", name: "Pack One", description: "exchange fixture" });
  const exported = await call(a, "manage_archive", { action: "export", format: "json", scope: "full" });
  writeFileSync(join(ROOT_B, "inbox", "pack-one.json"), exported);

  // B needs an active Novel for security-event audit entries to land.
  await call(b, "manage_novel", { action: "resume", slug: "torre-nosferatu" });

  await test("T739: a traversal source is refused without a read", async () => {
    const out = await call(b, "manage_artifact", { action: "install", kind: "novel", source: "../../etc/passwd" });
    assert.match(out, /\[ERROR\] \[INVALID_INPUT\]/);
    assert.match(out, /outside the exchange inbox/);
  });

  await test("T739: a tampered Novel pack is refused with a hash mismatch", async () => {
    const tampered = JSON.parse(exported);
    tampered.novel.name = "Tampered";
    const tamperPath = join(ROOT_B, "inbox", "tampered.json");
    writeFileSync(tamperPath, JSON.stringify(tampered));
    const out = await call(b, "manage_artifact", { action: "install", kind: "novel", source: "tampered.json" });
    assert.match(out, /\[ERROR\] \[STATE_CONFLICT\]/);
    assert.match(out, /payload hash mismatch/);
  });

  await test("T739: installing all three kinds admits them", async () => {
    const novel = await call(b, "manage_artifact", { action: "install", kind: "novel", source: "pack-one.json" });
    assert.match(novel, /\[OK\]/);
    writeFileSync(join(ROOT_B, "inbox", "harbor-signal.md"), adventureFixture());
    const adventure = await call(b, "manage_artifact", { action: "install", kind: "adventure", source: "harbor-signal.md" });
    assert.match(adventure, /\[OK\]/);
    cpSync(join(ROOT_A, "rulesets", "fixture-rules"), join(ROOT_B, "inbox", "fixture-rules"), { recursive: true });
    const pkg = await call(b, "manage_artifact", { action: "install", kind: "ruleset", source: "fixture-rules" });
    assert.match(pkg, /\[OK\]/);
  });

  await test("T739: an existing slug is refused", async () => {
    const out = await call(b, "manage_artifact", { action: "install", kind: "novel", source: "pack-one.json" });
    assert.match(out, /\[ERROR\] \[STATE_CONFLICT\]/);
    assert.match(out, /already installed/);
  });

  await test("T738: both installations report equal registry entries", async () => {
    const strip = (entry: any) => ({ kind: entry.kind, slug: entry.slug, title: entry.title, content_hash: entry.content_hash, creator: entry.creator, attribution: entry.attribution, license: entry.license, integrity: entry.integrity });
    const wanted = new Set(["pack-one", "harbor-signal", ruleset.slug]);
    const aEntries = (await registry(a)).artifacts.filter((e: any) => wanted.has(e.slug)).map(strip);
    const bEntries = (await registry(b)).artifacts.filter((e: any) => wanted.has(e.slug)).map(strip);
    assert.deepEqual(bEntries, aEntries);
  });

  await test("T738: list is deterministic and filters by kind", async () => {
    const first = await call(b, "manage_artifact", { action: "list" });
    const second = await call(b, "manage_artifact", { action: "list" });
    assert.equal(first, second);
    const adventures = await registry(b, { kind: "adventure" });
    assert.ok(adventures.artifacts.every((e: any) => e.kind === "adventure"));
    assert.ok(adventures.artifacts.some((e: any) => e.slug === "harbor-signal"));
  });

  await test("T738: installed artifacts appear in their kind catalogs", async () => {
    assert.match(await call(b, "manage_novel", { action: "list" }), /Pack One/);
    assert.match(await call(b, "manage_adventure", { action: "list" }), /harbor-signal/);
    assert.match(await call(b, "manage_ruleset", { action: "list" }), new RegExp(ruleset.slug));
  });

  await test("T738: a corrupted artifact reports a non-verified integrity state", async () => {
    writeFileSync(join(ROOT_B, "novels", "broken.json"), JSON.stringify({ slug: "broken", name: "Broken", _checksum: "deadbeef" }));
    const out = await registry(b);
    const broken = out.artifacts.find((e: any) => e.slug === "broken");
    assert.ok(broken, "corrupted artifact must not be omitted");
    assert.equal(broken.integrity, "unverified");
  });

  await test("T739: remove refuses while a Novel is bound to the ruleset", async () => {
    await call(b, "manage_novel", { action: "create", name: "Bound", ruleset: ruleset.slug });
    const out = await call(b, "manage_artifact", { action: "remove", kind: "ruleset", slug: ruleset.slug });
    assert.match(out, /\[ERROR\] \[STATE_CONFLICT\]/);
    assert.match(out, /is bound to ruleset/);
    await call(b, "manage_novel", { action: "end", dispose: "yes" });
    await call(b, "manage_novel", { action: "resume", slug: "torre-nosferatu" });
  });

  await test("T739: remove deletes an installed artifact and rescans", async () => {
    const out = await call(b, "manage_artifact", { action: "remove", kind: "adventure", slug: "harbor-signal" });
    assert.match(out, /\[OK\]/);
    const after = await registry(b, { kind: "adventure" });
    assert.ok(!after.artifacts.some((e: any) => e.slug === "harbor-signal"));
  });

  await test("T739: install and remove record security-event audit entries", async () => {
    const audit = await readResource(b, "audit://novel");
    assert.match(audit, /install_artifact/);
    assert.match(audit, /remove_artifact/);
  });

  await test("REQ-620: spec_health reports artifact counts per kind", async () => {
    const health = await call(b, "manage_diagnostics", { action: "health" });
    assert.match(health, /artifacts_registered/);
    assert.match(health, /"ruleset": 1/);
  });

  await kill(a);
  await kill(b);

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(ROOT_A, { recursive: true, force: true });
  rmSync(ROOT_B, { recursive: true, force: true });
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
