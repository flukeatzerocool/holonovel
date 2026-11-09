#!/usr/bin/env npx tsx
/**
 * generate-tool-definitions.ts — capture the live `tools/list` surface into a
 * deterministic committed artifact. [build tool; `--check` = gate]
 *
 * Boots a ruleset-free host, reads `tools/list`, and writes
 * `holonovel/tool-definitions.json` with one record per host tool: name, title,
 * description + byte size, action enum, parameter names/descriptions, required
 * parameters, output-schema fields, annotations, category, and gate. The
 * artifact is byte-deterministic (tools and keys sorted, no wall-clock or
 * version stamp) so a freshness gate can compare it without flapping.
 *
 * This is the drift surface for the Tool Definition Authoring Standard
 * (REQ-024c, REQ-450, Appendix T.2): a new tool or an edited description must
 * regenerate the artifact, so the change is reviewable as a diff. Consumed by
 * `scripts/check-tool-definitions-sync.ts` and `scripts/tool-definitions-lint.ts`
 * (REQ-450), and by `spec_health.tool_quality` (REQ-025).
 *
 * Exit codes: 0 = written / in sync, 1 = `--check` found drift, 2 = fatal
 * (missing boot input or unreachable server).
 *
 * Flags: `--check` (compare only, do not write), `--stdout` (emit to stdout),
 * `--help`/`-h`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { computeContextSignals } from "../src/core/tdqs.js";
import { projectToolList, type SurfaceRegistryLike } from "../src/core/surface-projection.js";

const ROOT = join(import.meta.dirname, "..");
const ARTIFACT_PATH = join(ROOT, "tool-definitions.json");
const REGISTRY_PATH = join(ROOT, "tool-surface-registry.json");
const SERVER_SCRIPT = join(ROOT, "src", "index.ts");

interface ToolRecord {
  name: string;
  title: string;
  description: string;
  description_bytes: number;
  action_enum: string[];
  param_count: number;
  required: string[];
  params: Record<string, string>;
  output_fields: Record<string, string>;
  annotations: Record<string, boolean> | null;
  // REQ-581/REQ-554 — catalog metadata (`_meta.deprecated`, `replacement`)
  // captured so the static lint can reject deprecation on a listed tool.
  meta: Record<string, unknown> | null;
  // REQ-552/REQ-555 — deterministic context signals (schema depth, required
  // fields, union choices, invocation cost) for the static conformance lint.
  context_signals: Record<string, number | boolean>;
  category: string;
  gate: string;
}

interface HiddenAlias {
  name: string;
  kind: "tool" | "action";
  replacement: string;
  retired: boolean;
  action_enum?: string[];
}

interface CatalogSize {
  tools: number;
  bytes: number;
  tokens: number;
}
interface Artifact {
  schema_version: number;
  tool_count: number;
  tools_list_bytes: number;
  surface_footprint: {
    estimator: string;
    profiles: {
      full: CatalogSize;
      standard: CatalogSize;
      small: CatalogSize & { groups: Record<string, CatalogSize> };
    };
  };
  tools: ToolRecord[];
  hidden_aliases: HiddenAlias[];
}

// ── MCP client (boot + tools/list) ─────────────────────────────────────
let msgId = 0;
interface Pending { resolve: (m: any) => void; reject: (e: Error) => void }
const pending = new Map<number, Pending>();
let buffer = "";
let stderrTail = "";
function settleAll(err: Error): void {
  for (const p of pending.values()) p.reject(err);
  pending.clear();
}
function send(proc: ChildProcess, msg: any, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP request timed out after ${timeoutMs}ms; stderr: ${stderrTail.slice(-500)}`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (m: any) => { clearTimeout(timer); resolve(m); },
      reject: (e: Error) => { clearTimeout(timer); reject(e); },
    });
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: ChildProcess): void {
  buffer = "";
  stderrTail = "";
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let m: any;
      try { m = JSON.parse(line); } catch { continue; /* non-JSON diagnostic line */ }
      if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!.resolve(m); pending.delete(m.id); }
    }
  });
  // Drain stderr so a chatty server cannot fill the pipe and deadlock (CR-24).
  proc.stderr!.on("data", (data: Buffer) => { stderrTail = (stderrTail + data.toString()).slice(-8000); });
  proc.on("exit", (code, signal) => settleAll(new Error(`server exited (${code ?? signal}) before responding; stderr: ${stderrTail.slice(-500)}`)));
  proc.on("error", (err) => settleAll(err));
}
async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    cwd: ROOT,
    env: { ...process.env, TTRPG_DATA_DIR: mkdtempSync(join(tmpdir(), "holonovel-tooldefgen-")) },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "tooldefgen", version: "1" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 300));
  return proc;
}

function sortedKeys<T>(obj: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k];
  return out;
}

function buildRecord(t: any): ToolRecord {
  const schema: any = t.inputSchema && typeof t.inputSchema === "object" ? t.inputSchema : {};
  const props: Record<string, any> = schema.properties ?? {};
  const actionEnum: string[] = props.action?.enum ?? [];
  const params: Record<string, string> = {};
  const paramNames = Object.keys(props).filter((k) => k !== "action");
  for (const k of paramNames) params[k] = String(props[k]?.description ?? "");
  const outProps: Record<string, any> = t.outputSchema && typeof t.outputSchema === "object" ? (t.outputSchema.properties ?? {}) : {};
  const outputFields: Record<string, string> = {};
  for (const k of Object.keys(outProps)) outputFields[k] = String(outProps[k]?.description ?? "");
  const description = typeof t.description === "string" ? t.description : "";
  const contextSignals = computeContextSignals({
    name: t.name,
    title: typeof t.title === "string" ? t.title : "",
    description,
    inputSchema: schema,
    outputSchema: t.outputSchema ?? null,
    annotations: t.annotations ?? null,
  });
  return {
    name: t.name,
    title: typeof t.title === "string" ? t.title : "",
    description,
    description_bytes: Buffer.byteLength(description, "utf-8"),
    action_enum: actionEnum,
    param_count: paramNames.length,
    required: Array.isArray(schema.required) ? [...schema.required].sort() : [],
    params: sortedKeys(params),
    output_fields: sortedKeys(outputFields),
    annotations: t.annotations && typeof t.annotations === "object" ? sortedKeys({ ...t.annotations }) as Record<string, boolean> : null,
    meta: t._meta && typeof t._meta === "object" ? sortedKeys({ ...t._meta }) as Record<string, unknown> : null,
    context_signals: contextSignals as unknown as Record<string, number | boolean>,
    category: "", // populated by the consumer from TOOL_CATEGORIES; kept for schema stability
    gate: "",
  };
}

function catalogSize(tools: unknown[]): CatalogSize {
  const bytes = Buffer.byteLength(JSON.stringify(tools), "utf-8");
  return { tools: tools.length, bytes, tokens: Math.ceil(bytes / 4) };
}
function surfaceFootprint(tools: any[], registry: SurfaceRegistryLike): Artifact["surface_footprint"] {
  const sizeFor = (profile: "full" | "standard" | "small", group: string | null = null): CatalogSize =>
    catalogSize(projectToolList(tools, { profile, group, activeGroup: "table", registry }));
  const full = sizeFor("full");
  const standard = sizeFor("standard");
  const groups: Record<string, CatalogSize> = {};
  let small = { tools: 0, bytes: 0, tokens: 0 };
  for (const group of registry.taxonomy.groups) {
    const measured = sizeFor("small", group);
    groups[group] = measured;
    if (measured.bytes > small.bytes) small = measured;
  }
  return { estimator: "utf8-bytes-div-4-ceil", profiles: { full, standard, small: { ...small, groups } } };
}
function buildArtifact(tools: any[], registry: SurfaceRegistryLike, hiddenAliases: HiddenAlias[] = []): Artifact {
  const records = tools.map(buildRecord).sort((a, b) => a.name.localeCompare(b.name));
  return {
    schema_version: 3,
    tool_count: records.length,
    tools_list_bytes: Buffer.byteLength(JSON.stringify(tools), "utf-8"),
    surface_footprint: surfaceFootprint(tools, registry),
    tools: records,
    hidden_aliases: hiddenAliases
      .map((alias) => ({
        name: alias.name,
        kind: alias.kind,
        replacement: alias.replacement,
        retired: alias.retired,
        ...(alias.action_enum ? { action_enum: [...alias.action_enum].sort() } : {}),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function parseHiddenAliases(healthText: string): HiddenAlias[] {
  let health: any;
  try {
    health = JSON.parse(healthText);
  } catch (e) {
    throw new Error(`malformed health payload: ${(e as Error).message}; body: ${healthText.slice(0, 200)}`);
  }
  const aliases = health?.tool_surface?.compatibility?.aliases;
  // A missing aliases array is a generator defect, not a silent empty list;
  // fail closed so the artifact cannot hide a retired alias (CR-24).
  if (!Array.isArray(aliases)) throw new Error("health payload is missing tool_surface.compatibility.aliases");
  return aliases.map((alias: any) => ({
    name: String(alias.name),
    kind: alias.kind === "action" ? "action" : "tool",
    replacement: String(alias.replacement),
    retired: alias.retired === true,
    ...(Array.isArray(alias.actions) ? { action_enum: alias.actions.map(String) } : {}),
  }));
}

function serialize(a: Artifact): string {
  return JSON.stringify(a, null, 2) + "\n";
}

function usage(): void {
  console.log("generate-tool-definitions — capture tools/list into tool-definitions.json\n");
  console.log("Usage: npx tsx holonovel/scripts/generate-tool-definitions.ts [--check] [--stdout]\n");
  console.log("  --check   compare the committed artifact to the live surface; exit 1 when stale");
  console.log("  --stdout  print the artifact instead of writing it");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) { usage(); process.exit(0); }
  const unknown = argv.filter((a) => !["--check", "--stdout"].includes(a));
  if (unknown.length > 0) { console.error(`unknown flag: ${unknown.join(", ")}`); usage(); process.exit(1); }
  const checkOnly = argv.includes("--check");
  const toStdout = argv.includes("--stdout");

  if (!existsSync(SERVER_SCRIPT)) { console.error(`FATAL: ${SERVER_SCRIPT} not found.`); process.exit(2); }

  const proc = await boot();
  let result: any;
  let health: any;
  try {
    result = await send(proc, { method: "tools/list", params: { _meta: { profile: "full" } } });
    health = await send(proc, {
      method: "tools/call",
      params: { name: "manage_diagnostics", arguments: { action: "health" } },
    });
  } catch (e) {
    console.error(`FATAL: ${(e as Error).message}`);
    process.exit(2);
  } finally {
    try { proc.kill("SIGKILL"); } catch { /* already exited — killing twice is a no-op */ }
  }
  const tools: any[] = result?.result?.tools ?? [];
  if (tools.length === 0) { console.error("FATAL: tools/list returned no tools."); process.exit(2); }
  const healthText = (health?.result?.content ?? []).map((part: any) => part?.text ?? "").join("\n");
  const hiddenAliases = parseHiddenAliases(healthText);

  let registry: SurfaceRegistryLike;
  try {
    registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as SurfaceRegistryLike;
  } catch {
    console.error(`FATAL: unreadable registry: ${REGISTRY_PATH}`);
    process.exit(2);
  }
  const rendered = serialize(buildArtifact(tools, registry, hiddenAliases));

  if (toStdout) { process.stdout.write(rendered); process.exit(0); }

  if (checkOnly) {
    if (!existsSync(ARTIFACT_PATH)) {
      console.error(`STALE: ${ARTIFACT_PATH} is missing — run \`npx tsx holonovel/scripts/generate-tool-definitions.ts\`.`);
      process.exit(1);
    }
    const committed = readFileSync(ARTIFACT_PATH, "utf-8");
    if (committed !== rendered) {
      console.error("STALE: tool-definitions.json does not match the live tools/list surface.");
      console.error("A tool or description changed without regenerating the artifact. Fix: npm run build-order");
      process.exit(1);
    }
    console.log(`Tool definitions in sync (${tools.length} tools).`);
    process.exit(0);
  }

  writeFileSync(ARTIFACT_PATH, rendered);
  console.log(`Wrote ${ARTIFACT_PATH} (${tools.length} tools, ${Buffer.byteLength(rendered, "utf-8")} bytes).`);
  process.exit(0);
}

main().catch((e) => { console.error(`FATAL: ${e instanceof Error ? e.message : e}`); process.exit(2); });
