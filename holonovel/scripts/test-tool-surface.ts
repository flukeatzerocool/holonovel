#!/usr/bin/env node
// Tool-surface catalog harness (REQ-568, REQ-570, REQ-572, REQ-580). [gate]
// Exercises T661 (conformance report), T663/T676/T677 (catalog projection),
// T665 (group directory), T673 (surface-profile precedence), and T678
// (measured profiles and budgets).
//
// Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal error.

import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildSurfaceReport, type SurfaceRegistry } from "../src/surface-report.js";
import { hiddenActionAliases, hiddenAliasNames, retiredAliasRefusal, surfaceAliasList } from "../src/core/surface-aliases.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER = join(import.meta.dirname, "..", "src", "index.ts");
const procs: ChildProcess[] = [];
const dirs: string[] = [];

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

let nextId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";
function send(proc: ChildProcess, message: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...message, id, jsonrpc: "2.0" }) + "\n");
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
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
      } catch {
        // Non-JSON stderr/oversized lines are not protocol messages.
      }
    }
  });
}
async function boot(profile: string, guidance = "full"): Promise<ChildProcess> {
  const dataDir = mkdtempSync(join(tmpdir(), "holonovel-tool-surface-"));
  dirs.push(dataDir);
  const proc = spawn("npx", ["tsx", SERVER], {
    env: {
      ...process.env,
      TTRPG_DATA_DIR: dataDir,
      TTRPG_STARTER_NOVEL: "off",
      TTRPG_SURFACE_PROFILE: profile,
      TTRPG_GUIDANCE_PROFILE: guidance,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  procs.push(proc);
  attach(proc);
  await send(proc, {
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "tool-surface", version: "1.0.0" },
    },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 250));
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown>): Promise<string> {
  const response = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  const content = response?.result?.content ?? [];
  return content.map((part: any) => part?.text ?? "").join("\n");
}
async function listTools(proc: ChildProcess, params: Record<string, unknown> = {}): Promise<any> {
  return send(proc, { method: "tools/list", params });
}
function toolNames(response: any): string[] {
  return (response?.result?.tools ?? []).map((tool: any) => tool.name);
}
async function readGroups(proc: ChildProcess): Promise<any[]> {
  const response = await send(proc, { method: "resources/read", params: { uri: "holonovel://tool-groups" } });
  if (response?.error) throw new Error(`resources/read failed: ${JSON.stringify(response.error)}`);
  const text = response?.result?.contents?.[0]?.text ?? "{}";
  return JSON.parse(text).groups ?? [];
}
async function registeredResourceUris(proc: ChildProcess): Promise<string[]> {
  const concrete = await send(proc, { method: "resources/list", params: {} });
  const templates = await send(proc, { method: "resources/templates/list", params: {} });
  const uris = [
    ...(concrete?.result?.resources ?? []).map((resource: any) => resource.uri),
    ...(templates?.result?.resourceTemplates ?? []).map((template: any) => template.uriTemplate),
  ];
  return uris.filter((uri: unknown): uri is string => typeof uri === "string");
}
async function badgeBriefing(proc: ChildProcess): Promise<string> {
  const response = await send(proc, { method: "prompts/get", params: { name: "badge_briefing", arguments: {} } });
  const messages = response?.result?.messages ?? [];
  return messages.map((message: any) => message?.content?.text ?? "").join("\n");
}
function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}
function assertArray(value: unknown, message: string): void {
  assert(Array.isArray(value), message);
}

const GLOBALS = ["set_badge", "manage_session", "respond_decision", "open_session", "close_session"];

function fixtureRegistry(): SurfaceRegistry {
  const decl = (group: string, entry: boolean, successors: string[] = []) => ({
    group,
    phases: ["scene"],
    entry,
    mutation_class: "read",
    ruleset: null,
    preconditions: [],
    successors,
    edges: [],
  });
  return {
    schema_version: 1,
    taxonomy: { groups: ["explore", "lookup"], phases: ["scene"], mutation_classes: ["read"] },
    actions: {
      "alpha.read": decl("explore", true, ["beta.read"]),
      "alpha.scan": decl("explore", true),
      "beta.read": decl("lookup", true),
    },
  };
}

async function run(): Promise<void> {
  const registry = fixtureRegistry();

  await test("T661: report derives coverage, duplicates, balance, and workflow counts", () => {
    const report = buildSurfaceReport({
      registry,
      live: new Set(["alpha.read", "alpha.scan", "beta.read", "orphan.tool"]),
      profile: "standard",
      catalogBytes: 400,
      overrides: 2,
      budgets: { standard: 200, small: 40 },
    });
    assert(report.profile === "standard", `profile was ${report.profile}`);
    assert(report.coverage.orphan_actions.includes("orphan.tool"), "orphan action not reported");
    assertArray(report.coverage.missing_actions, "missing_actions is not an array");
    assert(report.duplicate_entry_groups.includes("explore"), "duplicate entry group not reported");
    assert(report.entry_uniqueness.explore === 2, `entry uniqueness was ${report.entry_uniqueness.explore}`);
    assert(report.group_balance.explore.tools === 1 && report.group_balance.explore.actions === 2,
      `explore balance was ${JSON.stringify(report.group_balance.explore)}`);
    assert(report.workflow_calls.total === 1, `workflow total was ${report.workflow_calls.total}`);
    assert(report.workflow_calls.by_group.explore === 1, "workflow count not attributed to explore");
    assert(report.catalog_tokens_estimate === 100, `token estimate was ${report.catalog_tokens_estimate}`);
    assert(report.overrides === 2, `override count was ${report.overrides}`);
  });

  const standard = await boot("standard");
  await call(standard, "manage_novel", { action: "create", name: "tool-surface" });
  await call(standard, "set_badge", { badge: "game_master" });

  await test("T675: canonical group spans reject three groups and accept a compatibility third", () => {
    const spanDecl = (group: string, compatibility?: { replacement: string }) => ({
      group,
      phases: ["scene"],
      entry: group === "explore",
      mutation_class: "read",
      ruleset: null,
      preconditions: [],
      successors: [],
      edges: [],
      ...(compatibility ? { compatibility } : {}),
    });
    const spanning: SurfaceRegistry = {
      schema_version: 1,
      taxonomy: { groups: ["explore", "lookup", "referee"], phases: ["scene"], mutation_classes: ["read"] },
      actions: {
        "gamma.read": spanDecl("explore"),
        "gamma.scan": spanDecl("lookup"),
        "gamma.ref": spanDecl("referee"),
      },
    };
    const before = buildSurfaceReport({
      registry: spanning, live: new Set(Object.keys(spanning.actions)), profile: "full",
      catalogBytes: 100, overrides: 0, budgets: { standard: 50, small: 10 },
    });
    assert(before.span_violations.some((v) => v.startsWith("gamma:")), `three-group span not reported: ${JSON.stringify(before.span_violations)}`);
    const fixed: SurfaceRegistry = {
      ...spanning,
      actions: {
        ...spanning.actions,
        "gamma.ref": spanDecl("referee", { replacement: "gamma.scan" }),
      },
    };
    const after = buildSurfaceReport({
      registry: fixed, live: new Set(Object.keys(fixed.actions)), profile: "full",
      catalogBytes: 100, overrides: 0, budgets: { standard: 50, small: 10 },
    });
    assert(after.span_violations.length === 0, `compatibility third group still flagged: ${JSON.stringify(after.span_violations)}`);
    assert(after.canonical.tools === 1 && after.compatibility.actions === 1,
      `canonical/compat accounting was ${JSON.stringify({ canonical: after.canonical, compatibility: after.compatibility })}`);
  });

  await test("T674/T675: fixture aliases exercise both callable and retired branches", () => {
    const aliasDecl = (group: string, compatibility?: { replacement: string; retired?: boolean }) => ({
      group,
      phases: ["scene"],
      entry: false,
      mutation_class: "read",
      ruleset: null,
      preconditions: [],
      successors: [],
      edges: [],
      ...(compatibility ? { compatibility } : {}),
    });
    const fixture: SurfaceRegistry = {
      schema_version: 1,
      taxonomy: { groups: ["explore", "lookup"], phases: ["scene"], mutation_classes: ["read"] },
      actions: {
        "alpha.read": aliasDecl("explore"),
        "legacy.read": aliasDecl("explore", { replacement: "alpha.read" }),
        "delta.read": aliasDecl("explore", { replacement: "alpha.read", retired: true }),
      },
    };
    assert(hiddenAliasNames(fixture).has("legacy"), "non-retired tool alias not hidden");
    assert(hiddenAliasNames(fixture).has("delta"), "retired tool alias not hidden");
    assert(hiddenActionAliases(fixture).get("legacy.read") === "alpha.read", "action alias replacement missing");
    assert(retiredAliasRefusal(fixture, "legacy", { action: "read" }) === null, "non-retired alias refused");
    const refusal = retiredAliasRefusal(fixture, "delta", { action: "read" });
    assert(refusal?.includes("[NOT_FOUND]") && refusal.includes("alpha.read"), `retired refusal wrong: ${refusal}`);
    const aliases = surfaceAliasList(fixture);
    const legacy = aliases.find((entry) => entry.name === "legacy");
    const delta = aliases.find((entry) => entry.name === "delta");
    assert(legacy?.replacement === "alpha" && legacy.retired === false, `non-retired alias entry wrong: ${JSON.stringify(legacy)}`);
    assert(delta?.replacement === "alpha" && delta.retired === true, `retired alias entry wrong: ${JSON.stringify(delta)}`);
    const report = buildSurfaceReport({
      registry: fixture, live: new Set(Object.keys(fixture.actions)), profile: "full",
      catalogBytes: 100, overrides: 0, budgets: { standard: 50, small: 10 },
    });
    assert(report.canonical.actions === 1 && report.compatibility.actions === 2,
      `alias accounting was ${JSON.stringify({ canonical: report.canonical, compatibility: report.compatibility })}`);
    assert(report.compatibility.retired === 1, `retired count was ${report.compatibility.retired}`);
  });

  await test("T661: spec_health.tool_surface reports every contract field", async () => {
    const health = JSON.parse(await call(standard, "manage_diagnostics", { action: "health" }));
    const surface = health?.tool_surface;
    assert(surface, "missing tool_surface");
    assert(surface.profile === "standard", `profile was ${surface.profile}`);
    assert(typeof surface.actions === "number" && surface.actions > 0, "missing action count");
    assert(typeof surface.coverage?.live === "number", "missing live coverage");
    assert(typeof surface.coverage?.declared === "number", "missing declared coverage");
    assertArray(surface.coverage?.orphan_actions, "missing orphan_actions");
    assertArray(surface.coverage?.missing_actions, "missing missing_actions");
    assert(Object.keys(surface.groups ?? {}).length > 0, "missing group coverage");
    assert(Object.keys(surface.group_balance ?? {}).length > 0, "missing group balance");
    assert(Object.keys(surface.entries ?? {}).length > 0, "missing entry map");
    assert(Object.keys(surface.entry_uniqueness ?? {}).length > 0, "missing entry uniqueness");
    assertArray(surface.duplicate_entry_groups, "missing duplicate_entry_groups");
    assert(typeof surface.workflow_calls?.total === "number", "missing workflow call count");
    assert(typeof surface.catalog_bytes === "number", "missing catalog bytes");
    assert(typeof surface.catalog_tokens_estimate === "number", "missing catalog token estimate");
    for (const profile of ["full", "standard", "small"]) {
      assert(typeof surface.catalog_profiles?.[profile]?.bytes === "number", `missing ${profile} catalog bytes`);
      assert(typeof surface.catalog_profiles?.[profile]?.tokens === "number", `missing ${profile} catalog tokens`);
    }
    assert(typeof surface.budgets?.standard === "number" && typeof surface.budgets?.small === "number", "missing budgets");
    assert(typeof surface.overrides === "number", "missing override count");
  });

  await test("T663: small profile projects the active group, ordering is stable", async () => {
    const full = toolNames(await listTools(standard, { _meta: { profile: "full" } }));
    const projected = toolNames(await listTools(standard, { _meta: { profile: "small" } }));
    assert(projected.length > 0 && projected.length < full.length, `default projection ${projected.length} vs full ${full.length}`);
    assert(projected.every((name) => full.includes(name)), "projection returned an unknown tool or was not a subset");
    for (const name of GLOBALS) assert(projected.includes(name), `default projection missing global ${name}`);

    const groups = await readGroups(standard);
    const lookup = groups.find((group) => group.group === "lookup");
    assert(lookup?.tools?.length > 0, "lookup group has no tools in the directory");
    const lookupPage = toolNames(await listTools(standard, { _meta: { profile: "small", group: "lookup" } }));
    assert(lookupPage.some((name) => lookup.tools.includes(name)), "group selection returned no lookup tool");
    for (const name of GLOBALS) assert(lookupPage.includes(name), `group selection missing global ${name}`);

    const again = toolNames(await listTools(standard, { _meta: { profile: "small", group: "lookup" } }));
    assert(JSON.stringify(again) === JSON.stringify(lookupPage), "group projection ordering is not stable");
  });

  await test("T663: an unknown group returns [INVALID_INPUT]", async () => {
    const response = await listTools(standard, { _meta: { group: "not-a-real-group" } });
    assert(response?.error, "unknown group did not return an error");
    assert(String(response.error.message ?? "").includes("[INVALID_INPUT]"), `error was ${JSON.stringify(response.error)}`);
  });

  await test("T665: resource and discover agree; badge filters the directory", async () => {
    const resourceGroups = await readGroups(standard);
    assert(resourceGroups.length > 0, "group directory resource is empty");
    const gmNames = resourceGroups.map((group) => group.group);
    assert(new Set(gmNames).size === gmNames.length, "a group appears more than once");
    for (const group of resourceGroups) {
      assert(group.entry, `group ${group.group} has no entry action`);
      const entryTool = group.entry.includes(".") ? group.entry.slice(0, group.entry.indexOf(".")) : group.entry;
      assert(group.tools.includes(entryTool), `group ${group.group} entry ${group.entry} is not a member`);
    }

    const discover = await call(standard, "manage_session", { action: "discover" });
    const discoverGroups = [...discover.matchAll(/^- \*\*([a-z_]+)\*\* — entry:/gm)].map((m) => m[1]);
    assert(JSON.stringify([...discoverGroups].sort()) === JSON.stringify([...gmNames].sort()),
      `discover ${discoverGroups.join(",")} != resource ${gmNames.join(",")}`);

    await call(standard, "set_badge", { badge: "player" });
    const playerDirectory = await readGroups(standard);
    const playerGroups = playerDirectory.map((group) => group.group);
    assert(playerGroups.every((name) => gmNames.includes(name)), "player directory introduced an unknown group");
    const gmActions = resourceGroups.reduce((sum, group) => sum + group.actions, 0);
    const playerActions = playerDirectory.reduce((sum, group) => sum + group.actions, 0);
    assert(playerActions < gmActions, `player directory was not filtered (${playerActions}/${gmActions} actions)`);
    await call(standard, "set_badge", { badge: "game_master" });

    const uris = await registeredResourceUris(standard);
    assert(uris.length > 0, "the server registered no resources");
    for (const uri of uris) {
      const concrete = uri.replace(/\{[^}]+\}/g, "fixture");
      try {
        new URL(concrete);
      } catch {
        throw new Error(`registered resource URI is not a valid URL: ${uri}`);
      }
    }
  });

  await test("T673: surface profile governs the catalog, guidance profile does not", async () => {
    const full = await boot("full", "full");
    await call(full, "manage_novel", { action: "create", name: "full-profile" });
    await call(full, "set_badge", { badge: "game_master" });
    const fullNames = toolNames(await listTools(full));

    const smallFull = await boot("small", "full");
    await call(smallFull, "manage_novel", { action: "create", name: "small-full" });
    await call(smallFull, "set_badge", { badge: "game_master" });
    const smallFullNames = toolNames(await listTools(smallFull));
    const fullBriefing = await badgeBriefing(smallFull);

    const smallLean = await boot("small", "lean");
    await call(smallLean, "manage_novel", { action: "create", name: "small-lean" });
    await call(smallLean, "set_badge", { badge: "game_master" });
    const smallLeanNames = toolNames(await listTools(smallLean));
    const leanBriefing = await badgeBriefing(smallLean);

    const standard = await boot("standard", "full");
    await call(standard, "manage_novel", { action: "create", name: "standard-profile" });
    await call(standard, "set_badge", { badge: "game_master" });
    const standardNames = toolNames(await listTools(standard));
    assert(JSON.stringify(standardNames) === JSON.stringify(fullNames),
      `standard catalog ${standardNames.length} != full ${fullNames.length}`);
    assert(smallFullNames.length < standardNames.length,
      `small catalog ${smallFullNames.length} not smaller than standard ${standardNames.length}`);
    assert(JSON.stringify(smallFullNames) === JSON.stringify(smallLeanNames),
      "changing the guidance profile changed the catalog projection");
    assert(fullBriefing.includes("Read the current state, resolve mechanics through tools, then"),
      `full guidance orientation missing: ${fullBriefing.slice(0, 200)}`);
    assert(leanBriefing.includes("State, then tools, then narration."),
      `lean guidance orientation missing: ${leanBriefing.slice(0, 200)}`);
    assert(!leanBriefing.includes("Read the current state, resolve mechanics through tools, then"),
      "lean guidance still carried the full orientation");
  });

  await test("T676: standard is call-complete and lean", async () => {
    const proc = await boot("standard");
    await call(proc, "manage_novel", { action: "create", name: "standard-lean" });
    await call(proc, "set_badge", { badge: "game_master" });
    const full = await listTools(proc, { _meta: { profile: "full" } });
    const leaned = await listTools(proc, { _meta: { profile: "standard" } });
    const fullNames = toolNames(full);
    const standardNames = toolNames(leaned);
    assert(JSON.stringify(standardNames) === JSON.stringify(fullNames), "standard catalog is not call-complete");
    const fullBytes = Buffer.byteLength(JSON.stringify(full.result.tools), "utf8");
    const standardBytes = Buffer.byteLength(JSON.stringify(leaned.result.tools), "utf8");
    assert(standardBytes < fullBytes, `standard ${standardBytes}B is not smaller than full ${fullBytes}B`);
    const sample = leaned.result.tools.find((tool: any) => tool.name === "manage_lore");
    assert(sample && JSON.stringify(sample.outputSchema) === JSON.stringify({ type: "object" }),
      `standard output schema was not a presence marker: ${JSON.stringify(sample?.outputSchema)}`);
    const crossGroup = await call(proc, "manage_countdown", { action: "list" });
    assert(!crossGroup.includes("belongs to group"), `standard cross-group call refused: ${crossGroup.slice(0, 160)}`);
  });

  await test("T677: small is a summary discovery catalog", async () => {
    const proc = await boot("small");
    await call(proc, "manage_novel", { action: "create", name: "small-summary" });
    await call(proc, "set_badge", { badge: "game_master" });
    const small = await listTools(proc, { _meta: { profile: "small" } });
    const standard = await listTools(proc, { _meta: { profile: "standard" } });
    const smallNames = toolNames(small);
    const standardNames = toolNames(standard);
    assert(smallNames.length < standardNames.length, "small is not smaller than standard");
    assert(smallNames.every((name) => standardNames.includes(name)), "small introduced an unknown tool");
    const smallBytes = Buffer.byteLength(JSON.stringify(small.result.tools), "utf8");
    const standardBytes = Buffer.byteLength(JSON.stringify(standard.result.tools), "utf8");
    assert(smallBytes <= Math.ceil(standardBytes * 0.1),
      `small ${smallBytes}B exceeds one tenth of standard ${standardBytes}B`);
    for (const tool of small.result.tools) {
      assert(!String(tool.description ?? "").includes("Do NOT use when"), `${tool.name} kept a full description`);
      assert(JSON.stringify(tool.outputSchema) === JSON.stringify({ type: "object" }), `${tool.name} kept an output body`);
      for (const property of Object.values(tool.inputSchema?.properties ?? {})) {
        assert(!(property as any).description, `${tool.name} kept a parameter description`);
      }
    }
  });

  await test("T678: measured catalog profiles and budgets are reported", async () => {
    const proc = await boot("full");
    await call(proc, "manage_novel", { action: "create", name: "measured-profiles" });
    await call(proc, "set_badge", { badge: "game_master" });
    await listTools(proc);
    const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
    const surface = health.tool_surface;
    const profiles = surface.catalog_profiles;
    assert(profiles.full.tokens > profiles.standard.tokens, "standard is not leaner than full");
    assert(profiles.standard.tokens > profiles.small.tokens, "small is not leaner than standard");
    assert(profiles.standard.tokens <= Math.ceil(profiles.full.tokens * 0.9),
      `standard ${profiles.standard.tokens} exceeds 90% of full ${profiles.full.tokens}`);
    assert(profiles.small.tokens <= Math.ceil(profiles.full.tokens * 0.1),
      `small ${profiles.small.tokens} exceeds 10% of full ${profiles.full.tokens}`);
    assert(surface.budgets.standard === Math.ceil(profiles.full.tokens * 0.9), "recorded standard budget drifted");
    assert(surface.budgets.small === Math.ceil(profiles.full.tokens * 0.1), "recorded small budget drifted");
  });
}

let fatal = false;
run()
  .catch((e) => {
    fatal = true;
    console.error(`Fatal: ${e?.stack ?? e}`);
  })
  .finally(() => {
    for (const proc of procs) proc.kill();
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
    console.log(`\n${passed} passed, ${failed} failed`);
    if (fatal) process.exit(2);
    if (failed > 0) process.exit(1);
    harnessComplete();
    process.exit(0);
  });
