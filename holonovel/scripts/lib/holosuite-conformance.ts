// holosuite-conformance.ts — Tier T0: protocol/registry conformance.
//
// Boots the target server, reads its live registry, and asserts it does what
// the committed `tool-definitions.json` artifact says: identical tool-name set,
// a title and non-empty description per tool, all four REQ-450 mutation-class
// annotation booleans present and matching the artifact; a non-empty,
// well-formed resource and prompt registry; and a recognized error envelope
// (never `[?]`) for a negative input. Tool-observable; no raw state file reads.
// Every assertion emits an event so per-REQ coverage is derived from what ran.
// Exit codes: n/a (library; the runner owns the exit code).
//
// REQ citations: REQ-450 (mutation-class annotations), REQ-001/REQ-002
// (response contract / error taxonomy) for the negative probe.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bootServer } from "./mcp-client.js";
import { classifyResult } from "./eval-oracle.js";
import { canonicalJson } from "./eval-schema.js";
import { assertionRecorder, type AssertionContext } from "./eval-assertion.js";
import type { TierResult } from "./eval-schema.js";

interface ArtifactTool {
  name: string;
  title?: string;
  description?: string;
  annotations?: Record<string, boolean> | null;
  action_enum?: string[];
}

const ANNOTATION_KEYS = ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"];
// Real source anchors per finding class, so a finding cites the predicate it
// rests on rather than a gate message.
const PREDICATE_TOOLS = "holonovel/src/index.ts:144"; // TOOL_ANNOTATIONS map
const PREDICATE_RESOURCES = "holonovel/src/index.ts:8522"; // first registerResource
const PREDICATE_PROMPTS = "holonovel/src/index.ts:11501"; // first server.prompt

export async function runConformance(opts: { serverDir: string; artifactPath?: string; dataDir?: string }): Promise<TierResult> {
  const artifactPath = opts.artifactPath ?? join(opts.serverDir, "tool-definitions.json");
  const ctx: AssertionContext = { findings: [], events: [], passed: 0, failed: 0 };
  const assert = assertionRecorder(ctx, "conformance");

  if (!existsSync(artifactPath)) {
    assert("artifact_missing", false, `committed tool-definitions.json not found at ${artifactPath}`, 0, ["REQ-450"], "holonovel/scripts/generate-tool-definitions.ts:1");
    return { tier: "conformance", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
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
    const registryMatches = JSON.stringify(serverNames) === JSON.stringify(artifactNames);
    assert(
      registryMatches ? "registry_conforms" : "registry_drift",
      registryMatches,
      registryMatches ? `${serverNames.length} tools match the artifact` : `live names [${serverNames.join(", ")}] != artifact [${artifactNames.join(", ")}]`,
      1,
      ["REQ-020", "REQ-450"],
      PREDICATE_TOOLS,
    );

    let step = 2;
    for (const tool of serverTools) {
      step++;
      if (!tool.title || !tool.description) {
        assert("missing_tool_metadata", false, `${tool.name}: title/description empty`, step, ["REQ-024", "REQ-450"], PREDICATE_TOOLS);
        continue;
      }
      const ann = tool.annotations;
      const missing = ANNOTATION_KEYS.filter((k) => typeof ann?.[k] !== "boolean");
      if (missing.length > 0) {
        assert("missing_annotation", false, `${tool.name}: missing boolean annotations ${missing.join(", ")}`, step, ["REQ-450"], PREDICATE_TOOLS);
        continue;
      }
      const art = artifactByName.get(tool.name);
      if (art?.annotations && canonicalJson(art.annotations) !== canonicalJson(ann)) {
        assert("annotation_mismatch", false, `${tool.name}: live annotations != artifact`, step, ["REQ-450"], PREDICATE_TOOLS);
        continue;
      }
      assert("tool_metadata_conforms", true, `${tool.name}: title, description, and annotations present`, step, ["REQ-024", "REQ-450"], PREDICATE_TOOLS);
    }

    // --- Action-enum parity with the committed artifact --------------------
    step++;
    const enumDrift = serverTools.flatMap((tool) => {
      const live = ((tool.inputSchema as { properties?: { action?: { enum?: string[] } } })?.properties?.action?.enum ?? []).slice().sort();
      const artifactEnum = (artifactByName.get(tool.name)?.action_enum ?? []).slice().sort();
      return JSON.stringify(live) === JSON.stringify(artifactEnum)
        ? []
        : [`${tool.name}: live [${live.join(", ")}] != artifact [${artifactEnum.join(", ")}]`];
    });
    assert(
      enumDrift.length > 0 ? "action_enum_drift" : "action_enum_conforms",
      enumDrift.length === 0,
      enumDrift.length > 0 ? enumDrift.slice(0, 3).join("; ") : "action enums match the artifact",
      step,
      ["REQ-450", "REQ-581"],
      PREDICATE_TOOLS,
    );

    // --- Resource registry --------------------------------------------------
    step++;
    const resources = await client.listResources();
    const badResources = resources.filter((r) => {
      const o = r as { uri?: string; name?: string };
      return !o.uri || !o.name;
    });
    if (resources.length === 0) {
      assert("empty_resource_registry", false, "resources/list returned no entries", step, ["REQ-022", "REQ-024"], PREDICATE_RESOURCES);
    } else if (badResources.length > 0) {
      assert("malformed_resource", false, `${badResources.length} resource(s) missing uri/name`, step, ["REQ-022", "REQ-024"], PREDICATE_RESOURCES);
    } else {
      assert("resource_registry_conforms", true, `${resources.length} resources present`, step, ["REQ-022", "REQ-024"], PREDICATE_RESOURCES);
    }
    step++;
    const hasAdventures = resources.some((r) => (r as { uri?: string }).uri === "adventures://");
    assert(
      hasAdventures ? "adventures_resource_present" : "missing_adventures_resource",
      hasAdventures,
      hasAdventures ? "resources/list includes adventures://" : "resources/list omitted adventures://",
      step,
      ["REQ-170"],
      PREDICATE_RESOURCES,
    );

    // --- Prompt registry ----------------------------------------------------
    step++;
    const prompts = await client.listPrompts();
    const badPrompts = prompts.filter((p) => {
      const o = p as { name?: string };
      return !o.name;
    });
    if (prompts.length === 0) {
      assert("empty_prompt_registry", false, "prompts/list returned no entries", step, ["REQ-023", "REQ-024"], PREDICATE_PROMPTS);
    } else if (badPrompts.length > 0) {
      assert("malformed_prompt", false, `${badPrompts.length} prompt(s) missing name`, step, ["REQ-023", "REQ-024"], PREDICATE_PROMPTS);
    } else {
      assert("prompt_registry_conforms", true, `${prompts.length} prompts present`, step, ["REQ-023", "REQ-024"], PREDICATE_PROMPTS);
    }
    step++;
    const hasNarrate = prompts.some((p) => (p as { name?: string }).name === "narrate");
    assert(
      hasNarrate ? "narrate_prompt_present" : "missing_narrate_prompt",
      hasNarrate,
      hasNarrate ? "prompts/list includes narrate" : "prompts/list omitted narrate",
      step,
      ["REQ-598"],
      PREDICATE_PROMPTS,
    );

    // --- Scoped surface projection ------------------------------------------
    step++;
    const scoped = await bootServer({ serverDir: opts.serverDir, env: { TTRPG_SURFACE_PROFILE: "small" } });
    try {
      const scopedNames = (await scoped.listTools()).map((t) => t.name);
      const outside = scopedNames.filter((n) => !serverNames.includes(n));
      const okScoped = scopedNames.length > 0 && scopedNames.length < serverNames.length && outside.length === 0 && !scopedNames.includes("manage_npc");
      assert(
        "scoped_surface_projection",
        okScoped,
        `${scopedNames.length}/${serverNames.length} tools; outside=${outside.slice(0, 3).join(", ") || "none"}; manage_npc=${scopedNames.includes("manage_npc")}`,
        step,
        ["REQ-570"],
        "holonovel/src/index.ts:1373",
      );
    } finally {
      await scoped.close();
    }

    // --- Negative probe: recognized envelope, not a crash -------------------
    step++;
    const probe = await client.call("manage_novel", { action: "__holosuite_probe__" });
    const classified = classifyResult(probe.text, probe.isError);
    ctx.events.push({
      tier: "conformance", step, role: "prober", badge: null, tool: "manage_novel",
      args: { action: "__holosuite_probe__" }, prefix: classified.prefix,
      error_class: classified.error_class, is_error: probe.isError, mcp_error: classified.mcp_error,
      latency_ms: 0, req_ids: ["REQ-001", "REQ-002"],
    });
    assert(
      classified.prefix === "[?]" ? "unrecognized_envelope" : "envelope_recognized",
      classified.prefix !== "[?]",
      classified.prefix === "[?]" ? `negative probe returned unclassified output: ${probe.text.slice(0, 80)}` : `negative probe returned ${classified.prefix}`,
      step,
      ["REQ-001", "REQ-002"],
      "holonovel/src/index.ts:1",
    );
  } finally {
    await client.close();
  }

  return { tier: "conformance", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
}
