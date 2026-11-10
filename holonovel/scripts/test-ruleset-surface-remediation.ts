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
import { spawn } from "node:child_process";
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
  const attack = {
    name: "roll_weapon_attack",
    title: "Roll Weapon Attack",
    description: `Resolve a weapon attack for the ${slug} ruleset. Use when: an attack is declared. Do NOT use when: you need a lookup.`,
    kind: "roll",
    group: "resolve",
    phases: ["scene", "combat"],
    inputSchema: { type: "object", properties: { weapon: { type: "string", description: "The weapon name." } } },
  };
  const files: Record<string, any> = {
    index: [{ id: `${slug}-entry`, anchor: `${slug} > Entry`, source_file: `${slug}.md`, content: `${slug} entry text.`, category: "Entry", confidence: "high" }],
    model: { concepts: { [`${slug}-entry`]: { name: `${slug} entry` } }, tables: {}, generation_tables: {} },
    tools: [TOOL(slug), attack],
    resources: [],
    prompts: [],
  };
  return files;
}

async function seedPackage(slug: string, corruptHash = false, dataDir = DATA_DIR): Promise<void> {
  const { computeContentHash } = await import(pathToFileURL(join(ROOT, "src", "rulesets.ts")).href);
  const files = packageFiles(slug);
  const hash = corruptHash ? "0".repeat(64) : computeContentHash(files.index, files.model, files.tools, files.resources, files.prompts);
  const manifest = { slug, name: `${slug} test`, host_version: "2026.11.09", package_format: (await import(pathToFileURL(join(ROOT, "src", "generated", "contract-fingerprints.ts")).href)).PACKAGE_FORMAT, content_hash: hash, built_at: "2026-11-09", counts: { index: 1 } };
  const dir = join(dataDir, "rulesets", slug);
  mkdirSync(dir, { recursive: true });
  const out: Record<string, any> = { "manifest.json": manifest, ...Object.fromEntries(Object.entries(files).map(([k, v]) => [`${k}.json`, v])) };
  for (const [name, obj] of Object.entries(out)) writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
}

// ── Protocol-level client for tools/list (the MCP surface, not the engine
// façade). Spawned against an isolated data directory so it cannot disturb the
// in-process engine's state.
function bootServer(dataDir: string, extraEnv: Record<string, string> = {}): any {
  const env: NodeJS.ProcessEnv = { ...process.env, TTRPG_DATA_DIR: dataDir, ...extraEnv };
  // The in-process engine sets this guard; the spawned protocol server must
  // autostart on stdio.
  delete env.HOLONOVEL_NO_AUTOSTART;
  const proc = spawn("npx", ["tsx", join(ROOT, "src", "index.ts")], {
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let id = 0;
  let buffer = "";
  const pending = new Map<number, (value: any) => void>();
  proc.stdout.on("data", (d: Buffer) => {
    buffer += d.toString();
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
        // Non-JSON diagnostic on stdout is not a protocol response.
      }
    }
  });
  const send = (method: string, params: any) => new Promise<any>((resolve) => {
    const next = ++id;
    pending.set(next, resolve);
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: next, method, params }) + "\n");
  });
  return { proc, send };
}

async function waitForBoot(client: any): Promise<void> {
  await client.send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "surface", version: "1" } });
  client.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 250));
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

async function callTool(client: any, name: string, args: Record<string, unknown>): Promise<string> {
  const res = await client.send("tools/call", { name, arguments: args });
  return (res?.result?.content ?? []).map((part: any) => part?.text ?? "").join("\n");
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

  await test("T440/REQ-379c — tools/list reports ruleset scope and the prefix map", async () => {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-ruleset-scope-"));
    await seedPackage("alpha", false, dir);
    await seedPackage("beta", false, dir);
    const client = bootServer(dir);
    try {
      await waitForBoot(client);
      const listed = await client.send("tools/list", { _meta: { scope: "all" } });
      const tools: any[] = listed?.result?.tools ?? [];
      const alphaTool = tools.find((t: any) => t.name === "alpha_lookup_alpha");
      const hostTool = tools.find((t: any) => t.name === "manage_npc");
      assert(alphaTool?._meta?.ruleset === "alpha", `alpha tool ruleset '${alphaTool?._meta?.ruleset}'`);
      assert(hostTool?._meta?.ruleset === null, `host tool ruleset '${hostTool?._meta?.ruleset}'`);
      assert(!alphaTool?._meta?.inapplicable, "no Novel active must not mark a tool inapplicable");
      const health = JSON.parse(await callTool(client, "manage_diagnostics", { action: "health" }));
      const map = health.ruleset_prefix_map ?? {};
      assert(map.alpha === "alpha" && map.beta === "beta", `prefix map incomplete: ${JSON.stringify(map)}`);
    } finally {
      client.proc.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T458/REQ-391c — an over-cap tools/list paginates and the cursor resumes", async () => {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-ruleset-pages-"));
    await seedPackage("alpha", false, dir);
    await seedPackage("beta", false, dir);
    const client = bootServer(dir, { TTRPG_TOOLS_LIST_MAX_BYTES: "2000" });
    try {
      await waitForBoot(client);
      const names: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const res = await client.send("tools/list", { _meta: { scope: "all" }, ...(cursor ? { cursor } : {}) });
        const tools = res?.result?.tools ?? [];
        assert(tools.length > 0, "empty page returned");
        names.push(...tools.map((t: any) => t.name));
        cursor = res?.result?.nextCursor;
        pages++;
        assert(pages < 50, "pagination did not terminate");
      } while (cursor);
      assert(pages > 1, `listing did not paginate under a 2000-byte cap (pages ${pages})`);
      assert(new Set(names).size === names.length, "pagination returned a duplicate tool");
      const bad = await client.send("tools/list", { _meta: { scope: "all" }, cursor: "not-a-cursor" });
      assert(String(bad?.error?.message ?? "").includes("[INVALID_INPUT]"), "invalid cursor not refused");
    } finally {
      client.proc.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T442/REQ-381b/REQ-381c — cross-ruleset gating and inapplicable hints", async () => {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-ruleset-gating-"));
    await seedPackage("alpha", false, dir);
    await seedPackage("beta", false, dir);
    const client = bootServer(dir);
    try {
      await waitForBoot(client);
      const unbound = await callTool(client, "beta_lookup_beta", { key: "beta-entry" });
      assert(!unbound.includes("[ERROR]"), `no-Novel call refused: ${unbound.slice(0, 160)}`);
      await callTool(client, "manage_novel", { action: "create", name: "gated", ruleset: "alpha" });
      const refused = await callTool(client, "beta_lookup_beta", { key: "beta-entry" });
      assert(refused.includes("[ERROR] [INVALID_INPUT]"), `cross-ruleset call not refused: ${refused.slice(0, 160)}`);
      assert(refused.includes("alpha") && refused.includes("beta"), "refusal must name both rulesets");
      const allowed = await callTool(client, "alpha_lookup_alpha", { key: "alpha-entry" });
      assert(!allowed.includes("[ERROR]"), `in-scope call refused: ${allowed.slice(0, 160)}`);
      const listed = await client.send("tools/list", { _meta: { scope: "all" } });
      const tools: any[] = listed?.result?.tools ?? [];
      const beta = tools.find((t: any) => t.name === "beta_lookup_beta");
      const alpha = tools.find((t: any) => t.name === "alpha_lookup_alpha");
      assert(beta?._meta?.inapplicable === true, "mismatched-ruleset tool lacks the inapplicable hint");
      assert(alpha?._meta?.inapplicable === undefined, "matching-ruleset tool marked inapplicable");
    } finally {
      client.proc.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T444/REQ-383a/REQ-383b — per-ruleset health, combined summary, Player filter", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "healthcheck", ruleset: "alpha" });
    await engine.tools.call("set_badge", { badge: "game_master" });
    const gm = JSON.parse(textOf(await engine.tools.call("manage_diagnostics", { action: "health" })));
    const rh = gm.ruleset_health ?? {};
    assert(rh.alpha?.indexed_counts?.anchors === 1, `alpha anchors '${rh.alpha?.indexed_counts?.anchors}'`);
    assert(rh.beta?.indexed_counts?.anchors === 1, `beta anchors '${rh.beta?.indexed_counts?.anchors}'`);
    assert(rh.alpha?.must_action_coverage === "not-declared", "missing build field must report not-declared");
    assert(rh.combined?.tool_count > 0, "combined tool count missing");
    assert(rh.combined?.ruleset_prefix_map?.alpha === "alpha", "combined prefix map missing");
    assert(gm.ruleset_index_bytes > 0, "aggregate index bytes missing");
    await engine.tools.call("set_badge", { badge: "player" });
    const player = JSON.parse(textOf(await engine.tools.call("manage_diagnostics", { action: "health" })));
    assert(player.ruleset_health?.alpha !== undefined, "Player lost the active ruleset section");
    assert(player.ruleset_health?.beta === undefined, "Player saw another ruleset's section");
    assert(player.ruleset_health?.combined !== undefined, "Player lost the combined summary");
    // A ruleset-free Novel is created before the Player badge so the creation
    // guard does not refuse it; the Active Novel then has no ruleset scope.
    await engine.tools.call("set_badge", { badge: "game_master" });
    await engine.tools.call("manage_novel", { action: "create", name: "nores" });
    await engine.tools.call("set_badge", { badge: "player" });
    const unbound = JSON.parse(textOf(await engine.tools.call("manage_diagnostics", { action: "health" })));
    assert(unbound.ruleset_health?.alpha === undefined, "no-Novel Player saw a ruleset section");
    assert(unbound.ruleset_health?.combined !== undefined, "no-Novel Player lost the combined summary");
    await engine.tools.call("set_badge", { badge: "game_master" });
  });

  await test("T443/REQ-382b — search isolation across rulesets", async () => {
    await engine.tools.call("manage_novel", { action: "switch", slug: "healthcheck" });
    const alphaHit = textOf(await engine.tools.call("manage_ruleset", { action: "search", query: "alpha" }));
    assert(alphaHit.includes("alpha > Entry"), `alpha search did not return the alpha entry: ${alphaHit.slice(0, 160)}`);
    const betaMiss = textOf(await engine.tools.call("manage_ruleset", { action: "search", query: "beta" }));
    assert(betaMiss.includes("[ERROR] [NOT_FOUND]"), `alpha search leaked the beta index: ${betaMiss.slice(0, 160)}`);
    await engine.tools.call("manage_novel", { action: "create", name: "betanovel", ruleset: "beta" });
    const betaHit = textOf(await engine.tools.call("manage_ruleset", { action: "search", query: "beta" }));
    assert(betaHit.includes("beta > Entry"), `beta search did not return the beta entry: ${betaHit.slice(0, 160)}`);
    const alphaMiss = textOf(await engine.tools.call("manage_ruleset", { action: "search", query: "alpha" }));
    assert(alphaMiss.includes("[ERROR] [NOT_FOUND]"), `beta search leaked the alpha index: ${alphaMiss.slice(0, 160)}`);
  });

  await test("T446/REQ-385a/REQ-385b — suggest uses prefixed ruleset tools and no Novel is a conflict", async () => {
    await engine.tools.call("manage_novel", { action: "switch", slug: "healthcheck" });
    await engine.tools.call("set_badge", { badge: "game_master" });
    const suggested = textOf(await engine.tools.call("run_command", { action: "suggest", intent: "attack the goblin" }));
    assert(suggested.includes("alpha_roll_weapon_attack"), `suggest omitted the prefixed attack tool: ${suggested}`);
    assert(!suggested.includes("beta_roll_weapon_attack"), "suggest crossed the ruleset boundary");
    const spatial = textOf(await engine.tools.call("run_command", { action: "suggest", intent: "look around" }));
    assert(spatial.includes("run_command (action: execute"), "infrastructure parser suggestion missing");
    const dir = mkdtempSync(join(tmpdir(), "holonovel-ruleset-nonovel-"));
    const client = bootServer(dir);
    try {
      await waitForBoot(client);
      const conflict = await callTool(client, "run_command", { action: "suggest", intent: "attack" });
      assert(conflict.includes("[STATE_CONFLICT]"), `no-Novel suggest not a STATE_CONFLICT: ${conflict.slice(0, 160)}`);
    } finally {
      client.proc.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T451/REQ-380c — bind refuses mechanics-derived state; a clean bind is audited", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "bindme" });
    await engine.tools.call("set_badge", { badge: "game_master" });
    const created = textOf(await engine.tools.call("manage_character", { action: "create", name: "Mech", description: "mechanical" }));
    const id = created.match(/Entity id (\S+)\./)?.[1];
    assert(id, `character id missing from: ${created.slice(0, 160)}`);
    await engine.tools.call("manage_character", { action: "update", entity_id: id, stats: { might: 3 } });
    const refused = textOf(await engine.tools.call("manage_ruleset", { action: "bind", slug: "alpha" }));
    assert(refused.includes("[STATE_CONFLICT]"), `mechanics-state bind not refused: ${refused.slice(0, 200)}`);
    assert(refused.includes("alpha"), "bind refusal must name the target ruleset");
    await engine.tools.call("manage_novel", { action: "create", name: "clean" });
    const bound = textOf(await engine.tools.call("manage_ruleset", { action: "bind", slug: "alpha" }));
    assert(bound.includes("[OK]"), `clean bind failed: ${bound.slice(0, 160)}`);
    const again = textOf(await engine.tools.call("manage_ruleset", { action: "bind", slug: "alpha" }));
    assert(again.includes("[STATE_CONFLICT]"), "a second bind must be a STATE_CONFLICT");
    await engine.tools.call("manage_novel", { action: "resume", slug: "clean" });
    const info = textOf(await engine.tools.call("manage_novel", { action: "info" }));
    assert(info.includes("alpha"), "resume did not restore the migrated binding");
  });

  await test("T445/REQ-384b/REQ-384c — switching changes scope and audits both endpoints", async () => {
    await engine.tools.call("manage_novel", { action: "create", name: "swa", ruleset: "alpha" });
    await engine.tools.call("manage_novel", { action: "create", name: "swb", ruleset: "beta" });
    await engine.tools.call("manage_novel", { action: "switch", slug: "swa" });
    const inScope = textOf(await engine.tools.call("alpha_lookup_alpha", { key: "alpha-entry" }));
    assert(!inScope.includes("[ERROR]"), `alpha scope after switch: ${inScope.slice(0, 160)}`);
    const outScope = textOf(await engine.tools.call("beta_lookup_beta", { key: "beta-entry" }));
    assert(outScope.includes("[INVALID_INPUT]"), "beta tool callable under alpha scope after switch");
    const exported = JSON.parse(textOf(await engine.tools.call("manage_archive", { action: "export" })));
    const audit = exported?.novel?.audit_log ?? [];
    const switchEntry = [...audit].reverse().find((e: any) => e.tool === "switch_novel");
    assert(switchEntry, "switch was not audited");
    const switchData = JSON.parse(switchEntry.args ?? "{}");
    assert(switchData.from?.ruleset === "beta" && switchData.to?.ruleset === "alpha",
      `switch audit endpoints wrong: ${JSON.stringify(switchData)}`);
    await engine.tools.call("manage_novel", { action: "switch", slug: "swb" });
    const back = textOf(await engine.tools.call("beta_lookup_beta", { key: "beta-entry" }));
    assert(!back.includes("[ERROR]"), "switching back did not restore beta scope");
  });

  await test("T447/REQ-386a/REQ-386b — export names the ruleset; imports validate scope", async () => {
    await engine.tools.call("manage_novel", { action: "switch", slug: "swa" });
    const exported = JSON.parse(textOf(await engine.tools.call("manage_archive", { action: "export" })));
    assert(exported?.manifest?.ruleset === "alpha", `export manifest ruleset '${exported?.manifest?.ruleset}'`);
    const unknown = textOf(await engine.tools.call("manage_archive", {
      action: "import", mode: "apply",
      data: JSON.stringify({ novel: { slug: "ghost", name: "Ghost", ruleset: "nonexistent" } }),
    }));
    assert(unknown.includes("[INVALID_INPUT]"), `unknown-ruleset import not refused: ${unknown.slice(0, 200)}`);
    assert(unknown.includes("Valid rulesets"), "unknown-ruleset import must enumerate valid slugs");
    const staged = textOf(await engine.tools.call("manage_character", {
      action: "create", name: "Rosterite", description: "staged", stage_to_roster: true,
    }));
    const rosterId = staged.match(/Staged to roster as (\S+)\./)?.[1];
    assert(rosterId, `roster id missing from: ${staged.slice(0, 200)}`);
    await engine.tools.call("manage_novel", { action: "switch", slug: "swb" });
    const mismatch = textOf(await engine.tools.call("manage_character", { action: "import", roster_id: rosterId }));
    assert(mismatch.includes("[STATE_CONFLICT]"), `cross-ruleset character import not refused: ${mismatch.slice(0, 200)}`);
    assert(mismatch.includes("alpha") && mismatch.includes("beta"), "character-import refusal must name both rulesets");
  });

  await test("T448/REQ-387a/REQ-387b — codex ruleset axis", async () => {
    await engine.tools.call("manage_novel", { action: "switch", slug: "swa" });
    await engine.tools.call("set_badge", { badge: "game_master" });
    await engine.tools.call("manage_codex", { action: "set", kind: "spell_template", name: "Fireball", content: { level: 3 } });
    const alphaList = JSON.parse(textOf(await engine.tools.call("manage_codex", { action: "list", ruleset: "alpha" })));
    const fireball = alphaList.find((e: any) => e.id === "spell_template_fireball");
    assert(fireball?.ruleset === "alpha", `codex set did not default to alpha: ${JSON.stringify(fireball)}`);
    const betaList = JSON.parse(textOf(await engine.tools.call("manage_codex", { action: "list", ruleset: "beta" })));
    assert(!betaList.some((e: any) => e.id === "spell_template_fireball"), "beta codex list leaked an alpha entry");
    await engine.tools.call("manage_npc", { action: "create", name: "Gob" });
    await engine.tools.call("manage_codex", { action: "capture", kind: "npc", source_id: "Gob" });
    const captured = JSON.parse(textOf(await engine.tools.call("manage_codex", { action: "get", id: "npc_gob" })));
    assert(captured.ruleset === "alpha", `captured entry ruleset '${captured.ruleset}'`);
    // An entry stored with no active Novel is untagged and stays visible.
    await engine.tools.call("manage_novel", { action: "create", name: "untagged" });
    await engine.tools.call("manage_codex", { action: "set", kind: "lore_entry", name: "Shared", content: {} });
    const shared = JSON.parse(textOf(await engine.tools.call("manage_codex", { action: "list", ruleset: "alpha" })));
    assert(shared.some((e: any) => e.id === "lore_entry_shared" && e.ruleset === null), "untagged entry not visible under a ruleset filter");
    await engine.tools.call("manage_novel", { action: "switch", slug: "swb" });
    const refused = textOf(await engine.tools.call("manage_codex", { action: "import", id: "spell_template_fireball" }));
    assert(refused.includes("[STATE_CONFLICT]"), `cross-ruleset codex import not refused: ${refused.slice(0, 200)}`);
    assert(refused.includes("alpha") && refused.includes("beta"), "codex refusal must name both rulesets");
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
