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

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer } from "./mcp-client.js";
import { classifyResult, fingerprintOf } from "./eval-oracle.js";
import { persistedNovels } from "./eval-state.js";
import { assertionRecorder, type AssertionContext } from "./eval-assertion.js";
import { anchor } from "./eval-predicate.js";
import type { TierResult } from "./eval-schema.js";

// Real source anchors per finding class, so a finding cites the predicate it
// rests on rather than a gate message.
const P_ENVELOPE = anchor("holonovel/src/world/parser.ts", 26, "dispatchCommand");
const P_VALIDATION = anchor("holonovel/src/index.ts", 4841, "create_room");
const P_PROTOCOL = anchor("holonovel/src/index.ts", 12, "CallToolRequestSchema");
const P_DIAGNOSTICS = anchor("holonovel/src/index.ts", 8734, "verify");
const P_READONLY = anchor("holonovel/src/core/state.ts", 606, "snapshot");
const P_ARTIFACT = anchor("holonovel/src/index.ts", 10753, "inboxSourcePath");
const P_SHARE = anchor("holonovel/src/index.ts", 9891, "share");
const P_RECAP = anchor("holonovel/src/index.ts", 8879, "recap");
const P_PROVENANCE = anchor("holonovel/src/index.ts", 78, "provenance");
const P_IMPORT_INTEGRITY = anchor("holonovel/src/index.ts", 10072, "strictMode");
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
