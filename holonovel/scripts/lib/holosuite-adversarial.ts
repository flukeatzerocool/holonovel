// holosuite-adversarial.ts — Tier T3: bounded adversarial input fuzzing.
//
// Drives a ruleset-free Novel through a fixed battery of malformed, unknown,
// oversized, and hostile tool inputs and asserts the adversarial invariants the
// STRIDE harness (scripts/test-security.ts, REQ-444–REQ-450) does not own:
// a known tool with bad arguments still returns a recognized envelope (never
// `[?]`); an unknown tool returns a well-formed protocol error rather than a
// crash; the server stays live across the whole battery; and read-only probes
// carrying injection payloads never move the state fingerprint. No raw state
// reads beyond fingerprinting. Bounded (fixed battery, fixed seed) so the gate
// is deterministic. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support (exercises the
// REQ-001/REQ-002 response and error contracts).

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer } from "./mcp-client.js";
import { classifyResult, fingerprintOf } from "./eval-oracle.js";
import { persistedNovels, hasUndefinedRecord } from "./eval-state.js";
import { REQUIRED_PARAMS } from "../../src/core/param-contract.js";
import { assertionRecorder, type AssertionContext } from "./eval-assertion.js";
import { anchor } from "./eval-predicate.js";
import type { TierResult } from "./eval-schema.js";

// Real source anchors per finding class, so a finding cites the predicate it
// rests on rather than a gate message.
const P_ENVELOPE = anchor("holonovel/src/world/parser.ts", 38, "dispatchCommand");
const P_VALIDATION = anchor("holonovel/src/tools/world-crud.ts", 133, "create_room");
const P_PROTOCOL = anchor("holonovel/src/index.ts", 12, "CallToolRequestSchema");
const P_DIAGNOSTICS = anchor("holonovel/src/index.ts", 10525, "verify");
const P_READONLY = anchor("holonovel/src/core/server.ts", 30, "requireNotObserver");
const P_ARTIFACT = anchor("holonovel/src/index.ts", 12294, "inboxSourcePath");
const P_SHARE = anchor("holonovel/src/index.ts", 12267, "share");
const P_RECAP = anchor("holonovel/src/index.ts", 10215, "recap");
const P_PROVENANCE = anchor("holonovel/src/core/adventure-provenance.ts", 50, "verifyAdventureProvenance");
const P_IMPORT_INTEGRITY = anchor("holonovel/src/index.ts", 11559, "strictMode");
const NOVEL_NAME = "Holosuite Adversarial";

interface Probe {
  label: string;
  tool: string;
  args: Record<string, unknown>;
  /** `envelope` = known tool, must return a recognized envelope; `wellformed`
   *  = protocol-level, must return a non-empty well-formed error. */
  expect: "envelope" | "wellformed";
  predicate: string;
}

const OVERSIZED = "A".repeat(100_000);

const PROBES: Probe[] = [
  { label: "unknown tool", tool: "manage__nonexistent", args: {}, expect: "wellformed", predicate: P_PROTOCOL },
  { label: "unknown action", tool: "manage_novel", args: { action: "__nope__" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "missing required param", tool: "manage_world", args: { action: "create_room" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "wrong parameter type", tool: "manage_novel", args: { action: "create", name: 12345 }, expect: "envelope", predicate: P_VALIDATION },
  { label: "oversized string", tool: "manage_novel", args: { action: "create", name: OVERSIZED }, expect: "envelope", predicate: P_VALIDATION },
  { label: "command injection semicolon", tool: "run_command", args: { action: "execute", command: "look; rm -rf /" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "command injection subshell", tool: "run_command", args: { action: "execute", command: "$(cat /etc/passwd)" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "macro prototype key", tool: "run_command", args: { action: "execute", command: "{{__proto__}}" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "malformed macro delimiter", tool: "run_command", args: { action: "execute", command: "{{{" }, expect: "envelope", predicate: P_ENVELOPE },
  { label: "path traversal resume", tool: "manage_novel", args: { action: "resume", name: "../../etc/passwd" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "prototype pollution args", tool: "manage_npc", args: JSON.parse('{"action":"create","name":"x","__proto__":{"polluted":true}}'), expect: "envelope", predicate: P_VALIDATION },
  { label: "null action", tool: "manage_novel", args: { action: null }, expect: "envelope", predicate: P_VALIDATION },
  { label: "boolean where string", tool: "manage_world", args: { action: "create_room", name: true }, expect: "envelope", predicate: P_VALIDATION },
  { label: "replay out-of-range ordinal", tool: "manage_diagnostics", args: { action: "replay", to_event: 999999 }, expect: "envelope", predicate: P_DIAGNOSTICS },
  { label: "malformed archive import", tool: "manage_archive", args: { action: "import", data: "{" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "corpus path traversal", tool: "manage_corpus", args: { action: "corpus_register", corpus_document_id: "../../etc/passwd", corpus_body: "probe" }, expect: "envelope", predicate: P_VALIDATION },
  { label: "take_turn missing intent", tool: "take_turn", args: {}, expect: "envelope", predicate: P_VALIDATION },
];

/** Keep a 100k hostile payload out of the canonical report. */
function redactArgs(value: unknown): Record<string, unknown> {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return v.length > 180 ? `${v.slice(0, 180)}…<${v.length} chars>` : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as Record<string, unknown>;
}

/** Every callable surface: each action value, or the tool itself when action-less. */
function surfacesFrom(tools: Array<{ name: string; inputSchema?: unknown }>): Array<{ tool: string; action?: string; key: string }> {
  const out: Array<{ tool: string; action?: string; key: string }> = [];
  for (const tool of tools) {
    const schema = tool.inputSchema as { properties?: Record<string, { enum?: unknown }> } | undefined;
    const action = schema?.properties?.action;
    const values = Array.isArray(action?.enum) ? (action!.enum as string[]) : [];
    if (values.length > 0) {
      for (const value of values) out.push({ tool: tool.name, action: value, key: `${tool.name}:${value}` });
    } else {
      out.push({ tool: tool.name, key: `${tool.name}:` });
    }
  }
  return out;
}

/** Persisted Novels, including ones the sweep moved to the trash. */
function persistedNovelFiles(dataDir: string): string[] {
  const files: string[] = [];
  for (const dir of [join(dataDir, "novels"), join(dataDir, ".trash")]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) if (name.endsWith(".json")) files.push(join(dir, name));
  }
  return files;
}

export async function runAdversarial(opts: { serverDir: string; dataDir?: string; seed?: number }): Promise<TierResult> {
  const ctx: AssertionContext = { findings: [], events: [], passed: 0, failed: 0 };
  const record = assertionRecorder(ctx, "adversarial");
  const ownsDataDir = opts.dataDir === undefined;
  const dataDir = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-adv-"));
  const client = await bootServer({ serverDir: opts.serverDir, dataDir, seed: opts.seed ?? 1 });

  try {
    await client.call("manage_novel", { action: "create", name: NOVEL_NAME });
    await client.call("set_badge", { badge: "game_master" });

    // Admission/interchange probes run before the malformed-input battery: the
    // oversized-name probe can leave the active Novel unsaveable (ENAMETOOLONG),
    // which would make every later mutation fail for the wrong reason.
    let step = 0;

    step++;
    const traversal = await client.call("manage_artifact", { action: "install", kind: "novel", source: "../../etc/passwd" });
    record("artifact_source_traversal_refused", /^\[ERROR\]/m.test(traversal.text) && /outside the exchange inbox/i.test(traversal.text), "inbox-relative source refused", step, ["REQ-621"], P_ARTIFACT);

    step++;
    const shareMarkdown = await client.call("manage_archive", { action: "export", format: "markdown", share: true });
    record("share_requires_json", /^\[ERROR\]/m.test(shareMarkdown.text) && /share requires format 'json'/i.test(shareMarkdown.text), "share requires json", step, ["REQ-096m"], P_SHARE);

    step++;
    const recapZero = await client.call("manage_context", { action: "recap", max_rolls: 0 });
    record("recap_bounds_rejected", /^\[ERROR\]/m.test(recapZero.text) && /max_rolls/.test(recapZero.text), "max_rolls out of range rejected", step, ["REQ-072e"], P_RECAP);

    step++;
    mkdirSync(join(dataDir, "adventures"), { recursive: true });
    writeFileSync(join(dataDir, "adventures", "plain.md"), "# Plain\n\n## Premise\nA plain module with no provenance.\n");
    const provenanceAbsent = await client.call("manage_adventure", { action: "load", slug: "plain" });
    record("provenance_absent_warns", !/^\[ERROR\]/m.test(provenanceAbsent.text) && /provenance-absent/.test(provenanceAbsent.text), "module without provenance loads with a warning", step, ["REQ-617"], P_PROVENANCE);

    step++;
    const exported = await client.call("manage_archive", { action: "export", format: "json", share: true });
    interface ShareBundle { novel?: Record<string, unknown>; integrity?: Record<string, unknown> }
    let bundle: ShareBundle | null = null;
    try {
      bundle = JSON.parse(exported.text) as ShareBundle;
    } catch {
      bundle = null; // A parse failure is reported by the assertion below.
    }
    const portable = !!bundle && typeof bundle.integrity?.payload_hash === "string" && !!bundle.novel;
    record("share_exports_portable_bundle", portable, portable ? "share bundle carries novel payload and integrity envelope" : "share export was not portable", step, ["REQ-096m"], P_SHARE);

    step++;
    // Fingerprint every persisted Novel, not a fixed slug: earlier probes may
    // have switched the active Novel, and a stale-slug hash makes the mutation
    // assertion vacuous (CR-34).
    const allFingerprint = (): string =>
      persistedNovels(dataDir).map((n) => fingerprintOf(n)).sort().join("|");
    const preTamper = allFingerprint();
    if (bundle?.novel) bundle.novel.name = "Tampered Bundle";
    const tampered = await client.call("manage_archive", { action: "import", data: JSON.stringify(bundle ?? {}), mode: "replace", strict: true });
    const postTamper = allFingerprint();
    record("tampered_share_refused", !!bundle?.novel && /^\[ERROR\]/m.test(tampered.text) && preTamper === postTamper, "tampered share refused before any write", step, ["REQ-096m", "REQ-616"], P_IMPORT_INTEGRITY);

    for (const probe of PROBES) {
      step++;
      const res = await client.call(probe.tool, probe.args);
      const c = classifyResult(res.text, res.isError);
      const ok = probe.expect === "wellformed" ? res.text.trim().length > 0 : c.prefix !== "[?]";
      record(probe.expect === "wellformed" ? "wellformed_protocol_error" : "envelope_recognized", ok, `${probe.label}: ${c.prefix}`, step, ["REQ-001", "REQ-002", "REQ-054"], probe.predicate);
      ctx.events.push({
        tier: "adversarial", step, role: "prober", badge: "game_master", tool: probe.tool, args: redactArgs(probe.args),
        prefix: c.prefix, error_class: c.error_class, is_error: res.isError, mcp_error: c.mcp_error,
        latency_ms: 0, req_ids: ["REQ-001", "REQ-002"], detail: probe.label,
      });
    }

    // --- Read-only injection probes never move the fingerprint --------------
    const before = allFingerprint();
    for (const cmd of ["look; rm -rf /", "$(cat /etc/passwd)", "{{__proto__}}", "{{{"]) {
      await client.call("run_command", { action: "execute", command: cmd });
    }
    const after = allFingerprint();
    step++;
    record("read_only_no_mutation", before === after, before === after ? "fingerprint unchanged" : `${before.slice(0, 8)} -> ${after.slice(0, 8)}`, step, ["REQ-041"], P_READONLY);

    // --- Player-badge denial: verify stays GM-only -------------------------
    await client.call("set_badge", { badge: "player" });
    step++;
    const playerVerify = await client.call("manage_diagnostics", { action: "verify" });
    record("player_verify_denied", playerVerify.isError && /FORBIDDEN|Game Master only/.test(playerVerify.text), playerVerify.text.split("\n")[0] ?? "", step, ["REQ-603", "REQ-032"], P_DIAGNOSTICS);
    await client.call("set_badge", { badge: "game_master" });

    // --- Generated sweep: every callable surface with minimal arguments ------
    // The fixed PROBES above test wrong values; this sweep tests absent ones.
    // A classified surface must refuse with [MISSING_PARAM] (or a legal -32602
    // SDK schema refusal); every surface must answer with a recognized envelope;
    // and the sweep must leave no record keyed "undefined" (F1/F4, T177).
    const surfaces = surfacesFrom(await client.listTools());
    // Lifecycle actions that legitimately tear down or archive the active
    // Novel when called without arguments; including them would destroy the
    // fixture mid-sweep. Their parameter contracts are covered by the table.
    const LIFECYCLE_SKIP = new Set([
      "manage_novel:end",
      "manage_archive:archive",
      "manage_archive:unarchive",
      "manage_archive:clone",
      "manage_archive:branch",
      "manage_archive:import",
    ]);
    // Section-document surfaces: REQ-548a's machine-payload exemption covers
    // JSON; `discover` returns a Markdown help document by contract.
    const PREFIX_EXEMPT = new Set(["manage_context:discover"]);
    const badSurfaces: string[] = [];
    for (const surface of surfaces) {
      if (LIFECYCLE_SKIP.has(surface.key)) continue;
      step++;
      const args = surface.action ? { action: surface.action } : {};
      const res = await client.call(surface.tool, args);
      const c = classifyResult(res.text, res.isError);
      const payload = /^\s*[[{"]/.test(res.text);
      const classified = Object.prototype.hasOwnProperty.call(REQUIRED_PARAMS, surface.key);
      if (classified) {
        const ok = /^\[ERROR\] \[MISSING_PARAM\]/m.test(res.text) || /MCP error -32602/.test(res.text);
        record("missing_param_refused", ok, `${surface.key}: ${res.text.split("\n")[0]?.slice(0, 80) ?? ""}`, step, ["REQ-001", "REQ-002", "REQ-054"], P_VALIDATION);
        if (!ok) badSurfaces.push(surface.key);
      } else {
        // A truncated response (REQ-004) replaces the body with the output://
        // pointer, which is the server's own envelope for an oversized result.
        const truncated = /^\s*… \[truncated/.test(res.text);
        const ok = c.prefix !== "[?]" || payload || truncated || PREFIX_EXEMPT.has(surface.key) || /MCP error -32602/.test(res.text);
        record("surface_answers", ok, `${surface.key}: ${c.prefix} ${JSON.stringify(res.text.slice(0, 60))}`, step, ["REQ-001"], P_VALIDATION);
        if (!ok) badSurfaces.push(surface.key);
      }
    }

    step++;
    const undefinedFiles = persistedNovelFiles(dataDir).filter((file) => {
      try {
        return hasUndefinedRecord(JSON.parse(readFileSync(file, "utf-8")));
      } catch {
        return true; // An unreadable save is a finding, not a skipped check.
      }
    });
    record("no_undefined_records", undefinedFiles.length === 0, `${surfaces.length} surfaces, ${undefinedFiles.length} undefined record(s)${undefinedFiles.length ? `: ${undefinedFiles.map((f) => f.split("/").pop()).join(", ")}` : ""}`, step, ["REQ-002", "REQ-054"], P_VALIDATION);

    step++;
    const listed = (await client.listResources()) as Array<{ name?: unknown }>;
    const unnamed = listed.filter((resource) => typeof resource.name !== "string");
    record("resources_are_named", unnamed.length === 0, `${listed.length} resources, ${unnamed.length} unnamed`, step, ["REQ-022"], P_VALIDATION);

    step++;
    record("every_surface_contracts", badSurfaces.length === 0, badSurfaces.length === 0 ? `${surfaces.length} surfaces conform` : badSurfaces.slice(0, 8).join(", "), step, ["REQ-001", "REQ-002"], P_VALIDATION);

    // --- Liveness: a well-formed call still succeeds after the battery ------
    step++;
    const health = await client.call("manage_diagnostics", { action: "health" });
    record("server_live_after_battery", health.text.trim().length > 0 && !health.isError, health.isError ? "health call errored" : "server responsive", step, ["REQ-002"], P_PROTOCOL);
  } catch (e) {
    ctx.failed++;
    ctx.findings.push({ class: "adversarial_error", predicate: P_PROTOCOL, tier: "adversarial", step: 0, severity: "P1", target: "T3", detail: e instanceof Error ? e.message : String(e) });
  } finally {
    await client.close();
    if (ownsDataDir) {
      try {
        rmSync(dataDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup of the temp dir; not a test signal.
      }
    }
  }

  return { tier: "adversarial", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
}
