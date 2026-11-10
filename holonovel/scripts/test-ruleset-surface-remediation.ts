#!/usr/bin/env node
/**
 * test-ruleset-surface-remediation.ts — ruleset-surface review P6b regression
 * assertions. [gate]
 *
 * Covers the chunk-P6b P0 fixes:
 * - REQ-381a/REQ-380c — ruleset scope is enforced at dispatch: a package tool
 *   from another ruleset is refused with `[ERROR] [INVALID_INPUT]` naming both.
 * - REQ-389c/REQ-390 — `manage_ruleset (action: list)` reports
 *   installed-versus-loaded state without hydrating an idle package.
 * - REQ-389c — a removed package's tools disappear from the live surface.
 * - REQ-389b — a content-hash rejection reaches `spec_health`.
 * - REQ-002/REQ-434 — a malformed Fate dice notation is an `[INVALID_INPUT]`
 *   refusal, not a thrown handler failure.
 * - REQ-380a — applying an imported/restored Novel state preserves `ruleset`.
 *
 * Usage: `npx tsx scripts/test-ruleset-surface-remediation.ts`
 * Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal error.
 */
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";

installHarnessGuard();

const ROOT = join(import.meta.dirname!, "..");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-ruleset-surface-"));
process.env.TTRPG_DATA_DIR = DATA_DIR;
process.env.TTRPG_SEED = "1";

const TOOL = (slug: string) => ({
  name: `lookup_${slug}`,
  title: `Lookup ${slug}`,
  description: `Look up a ${slug} entry. Use when: you need ${slug} details. Do NOT use when: you need another ruleset.`,
  kind: "lookup",
  group: "lookup",
  phases: ["none", "setup", "scene", "combat", "downtime", "closed"],
  collection: "concepts",
  inputSchema: { type: "object", properties: { key: { type: "string", description: "The entry name." } } },
});

function packageFiles(slug: string, corruptHash = false) {
  const files: Record<string, any> = {
    index: [{ id: `${slug}-entry`, anchor: `${slug} > Entry`, source_file: `${slug}.md`, content: `${slug} entry text.`, category: "Entry", confidence: "high" }],
    model: { concepts: { [`${slug}-entry`]: { name: `${slug} entry` } }, tables: {}, generation_tables: {} },
    tools: [TOOL(slug)],
    resources: [],
    prompts: [],
  };
  return files;
}

async function seedPackage(slug: string, corruptHash = false): Promise<void> {
  const { computeContentHash } = await import(pathToFileURL(join(ROOT, "src", "rulesets.ts")).href);
  const files = packageFiles(slug);
  const hash = corruptHash ? "0".repeat(64) : computeContentHash(files.index, files.model, files.tools, files.resources, files.prompts);
  const manifest = { slug, name: `${slug} test`, host_version: "2026.11.09", package_format: (await import(pathToFileURL(join(ROOT, "src", "generated", "contract-fingerprints.ts")).href)).PACKAGE_FORMAT, content_hash: hash, built_at: "2026-11-09", counts: { index: 1 } };
  const dir = join(DATA_DIR, "rulesets", slug);
  mkdirSync(dir, { recursive: true });
  const out: Record<string, any> = { "manifest.json": manifest, ...Object.fromEntries(Object.entries(files).map(([k, v]) => [`${k}.json`, v])) };
  for (const [name, obj] of Object.entries(out)) writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
}

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

async function main(): Promise<void> {
  await seedPackage("alpha");
  await seedPackage("beta");
  await seedPackage("gamma", true);

  const { createEngine } = await import(pathToFileURL(join(ROOT, "src", "library.ts")).href);
  const engine = await createEngine();

  await test("REQ-389c/REQ-390 — list reports idle packages without hydrating", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "idle" });
    await engine.tools.call("set_badge", { badge: "game_master" });
    const list = JSON.parse(textOf(await engine.tools.call("manage_ruleset", { action: "list" })));
    const alpha = list.find((entry: any) => entry.slug === "alpha");
    assert(alpha?.state === "installed", `alpha reported '${alpha?.state}', expected installed`);
    const health = JSON.parse(textOf(await engine.tools.call("manage_diagnostics", { action: "health" })));
    assert(health.rulesets_hydrated === 0, `list hydrated ${health.rulesets_hydrated} package(s)`);
  });

  await test("REQ-381a/REQ-380c — cross-ruleset package call is refused", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "scoped", ruleset: "alpha" });
    const refused = textOf(await engine.tools.call("beta_lookup_beta", { key: "beta-entry" }));
    assert(refused.includes("[ERROR] [INVALID_INPUT]"), `cross-ruleset call not refused: ${refused.slice(0, 160)}`);
    assert(refused.includes("alpha") && refused.includes("beta"), "refusal must name both rulesets");
    const allowed = textOf(await engine.tools.call("alpha_lookup_alpha", { key: "alpha-entry" }));
    assert(!allowed.includes("[ERROR] [INVALID_INPUT]"), `in-scope call refused: ${allowed.slice(0, 160)}`);
  });

  await test("REQ-389b — a content-hash rejection reaches spec_health", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "loadcheck" });
    const refused = textOf(await engine.tools.call("gamma_lookup_gamma", { key: "gamma-entry" }));
    assert(refused.includes("[STATE_CONFLICT]"), `corrupt package call not refused: ${refused.slice(0, 160)}`);
    const health = JSON.parse(textOf(await engine.tools.call("manage_diagnostics", { action: "health" })));
    const alerts = (health.ruleset_package_alerts ?? []).map((a: any) => `${a.slug}:${a.reason}`);
    assert(alerts.some((a: string) => a.startsWith("gamma:") && a.includes("[load-rejected]")), `gamma rejection missing from spec_health: ${JSON.stringify(alerts)}`);
  });

  await test("REQ-389c — a removed package's tools leave the live surface", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "unbound" });
    const removed = textOf(await engine.tools.call("manage_ruleset", { action: "remove", slug: "alpha" }));
    assert(removed.includes("[OK]") || removed.includes("removed"), `remove failed: ${removed.slice(0, 160)}`);
    const names = engine.tools.list().map((tool) => tool.name);
    assert(!names.includes("alpha_lookup_alpha"), "removed package tool still listed");
    const call = textOf(await engine.tools.call("alpha_lookup_alpha", { key: "alpha-entry" }));
    assert(call.includes("[STATE_CONFLICT]"), `removed package tool still callable: ${call.slice(0, 160)}`);
  });

  await test("REQ-002/REQ-434 — malformed Fate notation is an input refusal", async () => {
    await engine.tools.call("manage_novel", { action: "resume", slug: "idle" });
    const result = textOf(await engine.tools.call("resolve_mechanic", { action: "fate_roll", dice: "not-dice" }));
    assert(result.startsWith("[ERROR] [INVALID_INPUT]"), `malformed notation not an INVALID_INPUT refusal: ${result.slice(0, 160)}`);
  });

  await test("REQ-380a — applying imported/restored state preserves the ruleset", async () => {
    const { applyNovelState } = await import(pathToFileURL(join(ROOT, "src", "core", "state.ts")).href);
    const target: any = { ruleset: "alpha", name: "target" };
    const source: any = { ruleset: "beta", name: "source", undo_stacks: {}, redo_stacks: {} };
    applyNovelState(target, source, "replace");
    assert(target.ruleset === "alpha", `ruleset changed to '${target.ruleset}'`);
    assert(target.name === "source", "non-preserved fields must apply");
  });

  engine.close();
  rmSync(DATA_DIR, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  harnessComplete();
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
