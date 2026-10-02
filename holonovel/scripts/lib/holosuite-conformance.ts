// holosuite-conformance.ts — Tier T0: protocol/registry conformance.
//
// Boots the target server, reads its live registry, and asserts it does what
// the committed `tool-definitions.json` artifact says: identical tool-name set,
// a title and non-empty description per tool, all four REQ-450 mutation-class
// annotation booleans present and matching the artifact; a non-empty,
// well-formed resource and prompt registry; and a recognized error envelope
// (never `[?]`) for a negative input. Tool-observable; no raw state file reads.
// Exit codes: n/a (library; the runner owns the exit code).
//
// REQ citations: REQ-450 (mutation-class annotations), REQ-001/REQ-002
// (response contract / error taxonomy) for the negative probe.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bootServer } from "./mcp-client.js";
import { classifyResult } from "./eval-oracle.js";
import { canonicalJson } from "./eval-schema.js";
import type { EvalEvent, EvalFinding, TierResult } from "./eval-schema.js";

interface ArtifactTool {
  name: string;
  title?: string;
  description?: string;
  annotations?: Record<string, boolean> | null;
}

const ANNOTATION_KEYS = ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"];
// Real source anchors per finding class, so a finding cites the predicate it
// rests on rather than a gate message.
const PREDICATE_TOOLS = "holonovel/src/index.ts:118"; // TOOL_ANNOTATIONS map
const PREDICATE_RESOURCES = "holonovel/src/index.ts:6660"; // first registerResource
const PREDICATE_PROMPTS = "holonovel/src/index.ts:9124"; // first server.prompt

export async function runConformance(opts: { serverDir: string; artifactPath?: string; dataDir?: string }): Promise<TierResult> {
  const artifactPath = opts.artifactPath ?? join(opts.serverDir, "tool-definitions.json");
  const findings: EvalFinding[] = [];
  const events: EvalEvent[] = [];
  let passed = 0;
  let failed = 0;

  const fail = (cls: string, step: number, detail: string, predicate: string, target = "REQ-450"): void => {
    failed++;
    findings.push({ class: cls, predicate, tier: "conformance", step, severity: "P1", target, detail });
  };

  if (!existsSync(artifactPath)) {
    fail("artifact_missing", 0, `committed tool-definitions.json not found at ${artifactPath}`, "holonovel/scripts/generate-tool-definitions.ts:1", "REQ-450");
    return { tier: "conformance", passed, failed, findings, events };
  }
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8")) as { tools?: ArtifactTool[] };
  const artifactTools = artifact.tools ?? [];
  const artifactByName = new Map(artifactTools.map((t) => [t.name, t]));

  const client = await bootServer({ serverDir: opts.serverDir, dataDir: opts.dataDir });
  try {
    // --- Tool registry ------------------------------------------------------
    const serverTools = await client.listTools();
    const serverNames = serverTools.map((t) => t.name).sort();
    const artifactNames = artifactTools.map((t) => t.name).sort();
    if (JSON.stringify(serverNames) !== JSON.stringify(artifactNames)) {
      fail("registry_drift", 1, `live names [${serverNames.join(", ")}] != artifact [${artifactNames.join(", ")}]`, PREDICATE_TOOLS);
    } else {
      passed++;
    }

    let step = 2;
    for (const tool of serverTools) {
      step++;
      if (!tool.title || !tool.description) {
        fail("missing_tool_metadata", step, `${tool.name}: title/description empty`, PREDICATE_TOOLS);
        continue;
      }
      const ann = tool.annotations;
      const missing = ANNOTATION_KEYS.filter((k) => typeof ann?.[k] !== "boolean");
      if (missing.length > 0) {
        fail("missing_annotation", step, `${tool.name}: missing boolean annotations ${missing.join(", ")}`, PREDICATE_TOOLS);
        continue;
      }
      const art = artifactByName.get(tool.name);
      if (art?.annotations && canonicalJson(art.annotations) !== canonicalJson(ann)) {
        fail("annotation_mismatch", step, `${tool.name}: live annotations != artifact`, PREDICATE_TOOLS);
        continue;
      }
      passed++;
    }

    // --- Resource registry --------------------------------------------------
    step++;
    const resources = await client.listResources();
    const badResources = resources.filter((r) => {
      const o = r as { uri?: string; name?: string };
      return !o.uri || !o.name;
    });
    if (resources.length === 0) fail("empty_resource_registry", step, "resources/list returned no entries", PREDICATE_RESOURCES, "REQ-024");
    else if (badResources.length > 0) fail("malformed_resource", step, `${badResources.length} resource(s) missing uri/name`, PREDICATE_RESOURCES, "REQ-024");
    else passed++;

    // --- Prompt registry ----------------------------------------------------
    step++;
    const prompts = await client.listPrompts();
    const badPrompts = prompts.filter((p) => {
      const o = p as { name?: string };
      return !o.name;
    });
    if (prompts.length === 0) fail("empty_prompt_registry", step, "prompts/list returned no entries", PREDICATE_PROMPTS, "REQ-024");
    else if (badPrompts.length > 0) fail("malformed_prompt", step, `${badPrompts.length} prompt(s) missing name`, PREDICATE_PROMPTS, "REQ-024");
    else passed++;

    // --- Negative probe: recognized envelope, not a crash -------------------
    step++;
    const probe = await client.call("manage_novel", { action: "__holosuite_probe__" });
    const classified = classifyResult(probe.text, probe.isError);
    events.push({
      tier: "conformance", step, role: "prober", badge: null, tool: "manage_novel",
      args: { action: "__holosuite_probe__" }, prefix: classified.prefix,
      error_class: classified.error_class, is_error: probe.isError, mcp_error: classified.mcp_error,
      latency_ms: 0, req_ids: ["REQ-001", "REQ-002"],
    });
    if (classified.prefix === "[?]") {
      fail("unrecognized_envelope", step, `negative probe returned unclassified output: ${probe.text.slice(0, 80)}`, "holonovel/src/index.ts:1", "REQ-002");
    } else {
      passed++;
    }
  } finally {
    await client.close();
  }

  return { tier: "conformance", passed, failed, findings, events };
}
