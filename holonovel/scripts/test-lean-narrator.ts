#!/usr/bin/env node
// Lean-narrator integration harness (2026-09-26). [gate]
//
// Role: gate — exercises the structured-result, discovery-routing, orientation,
// and grounding contracts, plus the builder-side disposition records.
// Exit codes: 0 = pass, 1 = failure.
// Covers REQ-548a (T632), REQ-548b (T633), REQ-548c (T634), REQ-548d (T635),
// REQ-067d (T636), REQ-114c (T637), REQ-551 (T638), REQ-551a (T639),
// REQ-412a (T640), REQ-312e (T641), and REQ-598a (T788).

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DECISIONS = join(process.cwd(), "DECISIONS.md");
let msgId = 0;
const pending = new Map<number, (m: any) => void>();
let buffer = "";
function send(proc: any, msg: any): Promise<any> {
  return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); });
}
function attach(proc: any): void {
  buffer = "";
  proc.stdout.on("data", (d: Buffer) => {
    buffer += d.toString();
    const ls = buffer.split("\n");
    buffer = ls.pop() ?? "";
    for (const l of ls) {
      if (!l.trim()) continue;
      try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON diagnostic line */ }
    }
  });
}
async function boot(env: any = {}): Promise<any> {
  const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: mkdtempSync(join(tmpdir(), "lean-")), ...env }, stdio: ["pipe", "pipe", "pipe"] });
  attach(p);
  await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "lean", version: "1" } } });
  p.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 350));
  return p;
}
async function raw(proc: any, name: string, args: any = {}): Promise<any> {
  const r = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (r.error) throw new Error(`${name}: ${r.error.message ?? JSON.stringify(r.error)}`);
  return r.result ?? {};
}
async function call(proc: any, name: string, args: any = {}): Promise<string> {
  const r = await raw(proc, name, args);
  return (r.content ?? []).map((x: any) => x?.text ?? "").join("\n");
}
async function proto(proc: any, method: string, params: any): Promise<any> {
  const r = await send(proc, { method, params });
  return r.result ?? {};
}
async function kill(proc: any): Promise<void> {
  try { proc.kill("SIGKILL"); } catch { /* already exited */ }
  await new Promise((r) => setTimeout(r, 120));
}

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(c: boolean, m: string): void { if (!c) throw new Error(m); }

async function main(): Promise<void> {
  const p = await boot();

  await test("REQ-548b T633 output-schema declaration", async () => {
    const list = await proto(p, "tools/list", {});
    const tools = list.tools ?? [];
    assert(tools.length > 0, "no tools listed");
    for (const t of tools) assert(Boolean(t.outputSchema), `tool ${t.name} lacks outputSchema`);
  });

  await test("REQ-548a T632 structured tool results", async () => {
    const r = await raw(p, "manage_novel", { action: "create", name: "Lean Test" });
    assert(Boolean(r.structuredContent), "no structuredContent on ok response");
    assert(r.structuredContent.status === "OK", `status=${r.structuredContent.status}`);
    // A machine-readable body keeps its verbatim text (REQ-001) and reports a
    // declared status (REQ-548a); `RAW` is not in the vocabulary.
    const declared = new Set(["OK", "NEED_INPUT", "WARNING", "PARTIAL", "ERROR"]);
    const json = await raw(p, "manage_story", { action: "list" });
    assert(declared.has(json.structuredContent?.status), `machine-readable body status=${json.structuredContent?.status}`);
    assert(json.structuredContent?.status !== "RAW", "RAW is an undeclared status");
  });

  await test("REQ-548c T634 structured error results", async () => {
    const r = await raw(p, "respond_decision", { decision: "x", option: "y" });
    assert(Boolean(r.structuredContent), "no structuredContent on error response");
    assert(Boolean(r.structuredContent.category), "no category");
    assert("corrective_action" in r.structuredContent, "no corrective_action");
    // The structured error carries the same enumeration its text reports.
    const nf = await raw(p, "manage_scene", { action: "set", scene_type: "nonsense" });
    const values = nf.structuredContent?.values;
    assert(Array.isArray(values) && values.includes("social"), `no values in structured error: ${JSON.stringify(nf.structuredContent)}`);
    const textValues = (nf.content ?? []).map((c: any) => c?.text ?? "").join("\n").match(/Valid values:\s*([^\n]+)/)?.[1] ?? "";
    for (const value of values) assert(textValues.includes(value), `structured value '${value}' absent from the text`);
  });

  await test("REQ-548d T635 machine-readable decision options", async () => {
    await call(p, "set_badge", { badge: "game_master" });
    const r = await raw(p, "manage_diagnostics", { action: "compact", sessions: 2 });
    const sc = r.structuredContent ?? {};
    assert(sc.status === "NEED_INPUT", `status=${sc.status}`);
    assert(Array.isArray(sc.options) && sc.options.length > 0, "no options");
    assert(sc.options.some((o: any) => o.value === "cancel"), "cancel option missing");
    // REQ-042b/REQ-191 — every entry is a kebab value + display label, cancel is
    // last, values are unique, and the set never exceeds 25 entries.
    assert(sc.options.every((o: any) => typeof o.value === "string" && typeof o.label === "string" && o.label.length <= 60), "option pair/label invalid");
    assert(sc.options[sc.options.length - 1].value === "cancel", "cancel is not last");
    assert(sc.options[sc.options.length - 1].label === "Cancel", "cancel label is not 'Cancel'");
    assert(new Set(sc.options.map((o: any) => o.value)).size === sc.options.length, "duplicate option values");
    assert(sc.options.length <= 25, `${sc.options.length} options exceeds the 25 cap`);
  });

  await test("REQ-067d T636 task-map intent routing", async () => {
    await call(p, "set_badge", { badge: "game_master" });
    const t = await call(p, "manage_context", { action: "discover" });
    assert(t.includes("Example:"), "no example invocation in task map");
  });

  // REQ-412a — the play-loop orientation token follows the AI's narrative role
  // (REQ-304/REQ-598) and sits in the never-truncated tier (REQ-135b). Each
  // case boots its own host because the badge lives on the Novel and
  // `boot()` mints a fresh data directory.
  const PLAYER_TOKEN = "act in character once the engine validates the result";
  const GM_TOKEN = "narrate the validated result to the table";
  async function roleCase(label: string, env: Record<string, string>, badge: string, want: "player" | "game_master") {
    await test(`REQ-412a T640 ${label}`, async () => {
      const r = await boot({ TTRPG_GUIDANCE_PROFILE: "full", ...env });
      try {
        await call(r, "manage_novel", { action: "create", name: `role-${badge}-${label.replace(/[^a-z0-9]+/gi, "-")}` });
        await call(r, "set_badge", { badge });
        const got = await proto(r, "prompts/get", { name: "badge_briefing" });
        const text = (got.messages ?? []).map((m: any) => m.content?.text ?? "").join("\n");
        const wanted = want === "player" ? PLAYER_TOKEN : GM_TOKEN;
        const other = want === "player" ? GM_TOKEN : PLAYER_TOKEN;
        assert(text.includes(wanted), `T640 missing the ${want} orientation under ${badge}/${JSON.stringify(env)}`);
        assert(!text.includes(other), `T640 rendered the other role's orientation under ${badge}/${JSON.stringify(env)}`);
      } finally {
        await kill(r);
      }
    });
  }
  await roleCase("counterpart under a Game-Master badge", { TTRPG_AI_ROLE: "" }, "game_master", "player");
  await roleCase("counterpart under a Player badge", { TTRPG_AI_ROLE: "" }, "player", "game_master");
  await roleCase("counterpart under the Editor badge", { TTRPG_AI_ROLE: "" }, "none", "game_master");
  await roleCase("AI-Game-Master role under a Game-Master badge", { TTRPG_AI_ROLE: "game_master" }, "game_master", "game_master");
  await roleCase("AI-Player role under a Player badge", { TTRPG_AI_ROLE: "player" }, "player", "player");
  await roleCase("AI-Player role under the Editor badge", { TTRPG_AI_ROLE: "player" }, "none", "player");
  await test("REQ-412a T640 play-loop orientation token survives a minimal briefing budget", async () => {
    const r = await boot({ TTRPG_MAX_BRIEFING_TOKENS: "150", TTRPG_AI_ROLE: "", TTRPG_GUIDANCE_PROFILE: "full" });
    try {
      await call(r, "manage_novel", { action: "create", name: "role-budget" });
      await call(r, "set_badge", { badge: "game_master" });
      const got = await proto(r, "prompts/get", { name: "badge_briefing" });
      const text = (got.messages ?? []).map((m: any) => m.content?.text ?? "").join("\n");
      assert(text.includes("**Play loop:**"), "T640 orientation token lost at a minimal budget");
      assert(text.includes("[truncated"), "T640 budget case did not truncate a lower-priority section");
    } finally {
      await kill(r);
    }
  });
  await kill(p);

  const p2 = await boot({ TTRPG_NARRATION_VALIDATION: "on" });
  await test("REQ-312e T641 narration grounding set", async () => {
    const r = await raw(p2, "manage_novel", { action: "create", name: "Grounding Test" });
    const sc = r.structuredContent ?? {};
    assert(Boolean(sc.grounding), "no grounding set on state-mutating response");
    assert(Array.isArray(sc.grounding.entities), "grounding.entities missing");
  });
  await kill(p2);

  // REQ-598a — scene-type anchoring (§7.3a). The directive follows the scene
  // tag, is absent for an unrelated tag, and persists across reads because it
  // is derived from Novel state on every render.
  const p3 = await boot({ TTRPG_AI_ROLE: "game_master" });
  await test("REQ-598a T788 scene-type tone directive", async () => {
    const readNarrate = async (): Promise<string> => {
      const got = await proto(p3, "prompts/get", { name: "narrate" });
      return (got.messages ?? []).map((m: any) => m.content?.text ?? "").join("\n");
    };
    await call(p3, "manage_novel", { action: "create", name: "Scene Tone" });
    await call(p3, "set_badge", { badge: "game_master" });

    let text = await readNarrate();
    assert(text.includes("### Scene tone"), "narrate prompt has no scene-tone section");
    assert(text.includes("steady pacing"), "neutral tone directive missing with no scene tag");

    await call(p3, "manage_scene", { action: "set", scene_type: ["combat"] });
    text = await readNarrate();
    assert(text.includes("danger and momentum"), "combat tone directive missing");
    assert(!text.includes("interpersonal tension"), "social tone directive leaked into a combat scene");
    assert(!text.includes("[truncated"), "narrate prompt truncated under the default budget");

    const again = await readNarrate();
    assert(again.includes("danger and momentum"), "combat tone directive did not persist across reads");

    await call(p3, "manage_scene", { action: "set", scene_type: ["social"] });
    text = await readNarrate();
    assert(text.includes("interpersonal tension"), "social tone directive missing");
    assert(!text.includes("danger and momentum"), "combat tone directive survived the scene change");
  });
  await kill(p3);

  const decisions = readFileSync(DECISIONS, "utf8");
  await test("REQ-114c T637 tool-selection coverage recorded", async () => { assert(decisions.includes("REQ-114c tool-selection coverage"), "REQ-114c record missing"); });
  await test("REQ-551 T638 extraction structural verification recorded", async () => { assert(decisions.includes("REQ-551 extraction structural verification"), "REQ-551 record missing"); });
  await test("REQ-551a T639 extractor divergence flags recorded", async () => { assert(decisions.includes("REQ-551a extractor divergence flags"), "REQ-551a record missing"); });

  harnessComplete();
  console.log(`lean-narrator harness: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
