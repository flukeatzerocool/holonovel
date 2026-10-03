/**
 * tdqs.ts — deterministic subset of the Tool Definition Quality Score, shared
 * by the runtime (`spec_health`, ruleset-package validation) and the build
 * harnesses (static tool-definition lint, scoring report). [library]
 *
 * REQ-552/REQ-553/REQ-554/REQ-555 — the authoritative TDQS is LLM-graded and
 * external (tdqs.dev); this module implements only the deterministic parts the
 * spec adopts as build contracts: context signals, hard gates, dimension
 * proxies, tier mapping, coherence proxies, and shadow candidates. It performs
 * no I/O and no network access.
 */

export interface ToolDefinition {
  name: string;
  title?: string | null;
  description?: string | null;
  inputSchema?: unknown;
  outputSchema?: unknown;
  annotations?: Record<string, boolean> | null;
}

export interface ContextSignals {
  paramCount: number;
  requiredParamCount: number;
  paramsWithDescriptions: number;
  paramsWithEnums: number;
  schemaDescriptionCoverage: number;
  hasNestedObjects: boolean;
  requiredFieldCount: number;
  schemaDepth: number;
  unionChoiceCount: number;
  invocationCost: number;
  hasOutputSchema: boolean;
  hasAnnotations: boolean;
  titleIsMeaningful: boolean;
  definitionBytes: number;
}

export type Dimension =
  | "purpose_clarity"
  | "usage_guidelines"
  | "behavioral_transparency"
  | "parameter_semantics"
  | "conciseness_structure"
  | "contextual_completeness";

export const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  purpose_clarity: 25,
  usage_guidelines: 20,
  behavioral_transparency: 20,
  parameter_semantics: 15,
  conciseness_structure: 10,
  contextual_completeness: 10,
};

export const PASSING_TIER = "B";

const DESCRIPTION_BUDGET_FALLBACK = 1000;
const PERSISTENCE_TOKENS = ["persist", "audit", "record"];
const REVERSIBILITY_TOKENS = ["revert", "undo", "reversib", "permanent", "append-only", "idempotent", "derived"];
const MUTATION_VERBS = /\b(creates?|updates?|removes?|deletes?|destroys?|installs?|applies?|persists?|writes?)\b/i;
const READ_ONLY_CLAIM = /^\s*(?:this tool is\s+)?read[- ]only\b|^\s*does not (?:mutate|modify|persist)/i;

function resolveRef(node: any, root: any, seen: Set<string> = new Set()): any {
  if (!node || typeof node !== "object") return node;
  const ref = node.$ref;
  if (typeof ref !== "string" || !ref.startsWith("#/")) return node;
  if (seen.has(ref)) return node;
  seen.add(ref);
  let cur = root;
  for (const part of ref.slice(2).split("/")) {
    if (cur == null) return node;
    cur = cur[part];
  }
  return resolveRef(cur, root, seen);
}

function isNullBranch(branch: any): boolean {
  return !!branch && typeof branch === "object" && (branch.type === "null" || (Array.isArray(branch.type) && branch.type.includes("null")));
}

function isObjectSchema(node: any): boolean {
  return !!node && typeof node === "object" && (node.type === "object" || (node.properties && typeof node.properties === "object"));
}

function unionBranches(node: any, root: any): any[] {
  for (const key of ["oneOf", "anyOf"] as const) {
    const raw = resolveRef(node, root)?.[key];
    if (Array.isArray(raw)) {
      return raw.map((b: any) => resolveRef(b, root)).filter((b: any) => b && !isNullBranch(b));
    }
  }
  return [];
}

interface Subtree {
  requiredFields: number;
  depth: number;
  unions: number;
}

function emptySubtree(): Subtree {
  return { requiredFields: 0, depth: 0, unions: 0 };
}

// Required-subtree traversal: the node itself is not counted; a required property
// counts once for itself plus, when it is an object/array-of-object, once for each
// of its own required properties. A union property counts as its widest branch.
function walkRequired(schema: any, root: any, level = 0): Subtree {
  const node = resolveRef(schema, root);
  if (!node || typeof node !== "object" || level > 10) return emptySubtree();

  const branches = unionBranches(node, root);
  if (branches.length > 0) {
    const unions = branches.length > 1 ? branches.length - 1 : 0;
    let widest = emptySubtree();
    for (const b of branches) {
      const s = walkRequired(b, root, level + 1);
      if (s.requiredFields > widest.requiredFields) widest = s;
    }
    return { requiredFields: widest.requiredFields, depth: widest.depth, unions: unions + widest.unions };
  }

  if (!isObjectSchema(node)) return emptySubtree();

  const props = (node.properties ?? {}) as Record<string, any>;
  const required: string[] = Array.isArray(node.required) ? node.required : [];
  let requiredFields = 0;
  let depth = 1;
  let unions = 0;
  for (const key of required) {
    const prop = resolveRef(props[key], root);
    if (!prop) continue;
    const child = isObjectSchema(prop) ? prop : prop.type === "array" && isObjectSchema(resolveRef(prop.items, root)) ? resolveRef(prop.items, root) : null;
    if (child) {
      const s = walkRequired(child, root, level + 1);
      requiredFields += 1 + s.requiredFields;
      depth = Math.max(depth, 1 + s.depth);
      unions += s.unions;
    } else if (unionBranches(prop, root).length > 0) {
      const s = walkRequired(prop, root, level + 1);
      requiredFields += s.requiredFields;
      depth = Math.max(depth, s.depth);
      unions += s.unions;
    } else {
      requiredFields += 1;
    }
  }
  return { requiredFields, depth, unions };
}

export function computeContextSignals(def: ToolDefinition): ContextSignals {
  const schema = (def.inputSchema ?? {}) as any;
  const props = (schema.properties && typeof schema.properties === "object" ? schema.properties : {}) as Record<string, any>;
  const required: string[] = Array.isArray(schema.required) ? schema.required : [];
  const paramCount = Object.keys(props).length;
  const paramsWithDescriptions = Object.values(props).filter(
    (p: any) => p && typeof p.description === "string" && p.description.trim() !== "",
  ).length;
  const paramsWithEnums = Object.values(props).filter((p: any) => p && Array.isArray(p.enum)).length;
  const schemaDescriptionCoverage = paramCount === 0 ? 100 : Math.round((paramsWithDescriptions / paramCount) * 100);
  const hasNestedObjects = Object.values(props).some(
    (p: any) => p && (p.type === "object" || (p.type === "array" && p.items && (p.items.type === "object" || p.items.properties))),
  );
  const subtree = isEmptySchema(schema) ? emptySubtree() : walkRequired(schema, schema);
  const invocationCost = subtree.requiredFields + 2 * Math.max(0, subtree.depth - 1) + 2 * subtree.unions;
  const outputSchema = def.outputSchema as any;
  const hasOutputSchema = !!outputSchema && (typeof outputSchema !== "object" || Object.keys(outputSchema).length > 0);
  const annotations = def.annotations ?? null;
  const hasAnnotations = !!annotations && Object.keys(annotations).length > 0;
  const title = typeof def.title === "string" ? def.title : "";
  const titleIsMeaningful = title.trim() !== "" && title !== def.name && title.length > def.name.length;
  const definitionBytes = Buffer.byteLength(
    JSON.stringify({
      name: def.name,
      title: def.title ?? null,
      description: def.description ?? null,
      inputSchema: def.inputSchema ?? null,
      outputSchema: def.outputSchema ?? null,
      annotations: def.annotations ?? null,
    }),
    "utf-8",
  );
  return {
    paramCount,
    requiredParamCount: required.length,
    paramsWithDescriptions,
    paramsWithEnums,
    schemaDescriptionCoverage,
    hasNestedObjects,
    requiredFieldCount: subtree.requiredFields,
    schemaDepth: subtree.depth,
    unionChoiceCount: subtree.unions,
    invocationCost,
    hasOutputSchema,
    hasAnnotations,
    titleIsMeaningful,
    definitionBytes,
  };
}

function isEmptySchema(schema: any): boolean {
  return !schema || typeof schema !== "object" || Object.keys(schema).length === 0;
}

export interface HardGateFinding {
  gate: "No Description" | "Tautological Description" | "Annotation Contradiction";
  detail: string;
}

export function applyHardGates(def: ToolDefinition, signals?: ContextSignals): HardGateFinding[] {
  const findings: HardGateFinding[] = [];
  const desc = typeof def.description === "string" ? def.description : "";
  if (desc.trim() === "") {
    findings.push({ gate: "No Description", detail: "description is absent or whitespace-only" });
    return findings;
  }
  const trimmed = desc.trim().replace(/\.$/, "");
  const title = typeof def.title === "string" ? def.title : "";
  if (trimmed === def.name || (title !== "" && trimmed === title)) {
    findings.push({ gate: "Tautological Description", detail: "description restates the tool name or title" });
  }
  const annotations = def.annotations ?? {};
  if (annotations["readOnlyHint"] === true && MUTATION_VERBS.test(desc)) {
    findings.push({
      gate: "Annotation Contradiction",
      detail: "readOnlyHint is true but the description names a mutating operation",
    });
  } else if (annotations["readOnlyHint"] === false && READ_ONLY_CLAIM.test(desc)) {
    findings.push({
      gate: "Annotation Contradiction",
      detail: "the annotation declares mutation but the description claims the tool is read-only",
    });
  }
  void signals;
  return findings;
}

export function tierForScore(score: number): string {
  if (score >= 3.5) return "A";
  if (score >= 3.0) return "B";
  if (score >= 2.0) return "C";
  if (score >= 1.0) return "D";
  return "F";
}

function round1(p: number, q: number): number {
  return Math.floor((20 * p + q) / (2 * q)) / 10;
}

export function computeTier(score: number): string {
  return tierForScore(score);
}

export function computeTdqs(scores: Record<Dimension, number>): number {
  let hundredths = 0;
  for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS) as [Dimension, number][]) {
    hundredths += (scores[dimension] ?? 0) * weight;
  }
  return round1(hundredths, 100);
}

function clamp(n: number): number {
  return Math.max(1, Math.min(5, n));
}

function namesSibling(description: string, siblings: string[], self: string): boolean {
  const lower = description.toLowerCase();
  return siblings.some((s) => s !== self && lower.includes(s.toLowerCase()));
}

export function dimensionProxies(def: ToolDefinition, signals: ContextSignals, siblings: string[] = [], budget = DESCRIPTION_BUDGET_FALLBACK): Record<Dimension, number> {
  const desc = typeof def.description === "string" ? def.description : "";
  const lower = desc.toLowerCase();
  const hasUseWhen = lower.includes("use when");
  const hasNotWhen = lower.includes("do not use when");
  const notIdx = lower.indexOf("do not use when");
  const notClause = notIdx === -1 ? "" : desc.slice(notIdx);

  const tautology = applyHardGates(def).some((f) => f.gate === "Tautological Description");
  const purpose = tautology ? 2 : hasUseWhen && hasNotWhen && namesSibling(notClause, siblings, def.name) ? 5 : hasUseWhen ? 4 : 3;
  const usage = hasNotWhen && namesSibling(notClause, siblings, def.name) ? 5 : hasNotWhen ? 4 : hasUseWhen ? 3 : 2;

  const behavioralTokens = (lower.match(/persist|audit|read-only|mutating|reversib|append-only|destructive/gi) ?? []).length;
  const behavior = clamp(behavioralTokens >= 3 ? 5 : behavioralTokens >= 2 ? 4 : 3);

  const paramCount = signals.paramCount;
  const coverage = signals.schemaDescriptionCoverage;
  let parameters: number;
  if (paramCount === 0) parameters = 4;
  else if (coverage > 80) parameters = 3;
  else if (coverage >= 50) parameters = 3;
  else parameters = 2;
  if (paramCount > 0 && /\b(interacts?|conflicts? with|requires .* when|only when|together with)\b/i.test(desc)) {
    parameters = clamp(parameters + 1);
  }

  const bytes = signals.definitionBytes;
  const conciseness = clamp(desc.length >= 30 && bytes <= budget ? 5 : bytes <= budget ? 4 : 3);

  const completeness = signals.hasOutputSchema && signals.paramsWithDescriptions === paramCount ? 5 : signals.hasOutputSchema ? 4 : 3;

  return {
    purpose_clarity: clamp(purpose),
    usage_guidelines: clamp(usage),
    behavioral_transparency: behavior,
    parameter_semantics: parameters,
    conciseness_structure: conciseness,
    contextual_completeness: completeness,
  };
}

export interface ToolScore {
  name: string;
  signals: ContextSignals;
  scores: Record<Dimension, number>;
  tdqs: number;
  tier: string;
  smells: Dimension[];
  hardGates: HardGateFinding[];
}

export function scoreTool(def: ToolDefinition, siblings: string[] = [], budget = DESCRIPTION_BUDGET_FALLBACK): ToolScore {
  const signals = computeContextSignals(def);
  const hardGates = applyHardGates(def, signals);
  const scores = dimensionProxies(def, signals, siblings, budget);
  const tdqs = computeTdqs(scores);
  const smells = (Object.entries(scores) as [Dimension, number][]).filter(([, v]) => v < 3).map(([k]) => k);
  return { name: def.name, signals, scores, tdqs, tier: computeTier(tdqs), smells, hardGates };
}

export interface CoherenceProxies {
  disambiguation: number;
  namingConsistency: number;
  toolCountAppropriateness: number;
  completeness: number;
  coherence: number;
  overlappingPairs: [string, string][];
}

const VERB_ALLOWLIST = ["manage", "resolve", "run", "respond", "set"];

function tokens(text: string): Set<string> {
  const stop = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "with", "when", "do", "not", "use", "this", "that", "is", "are", "it", "its", "by", "on", "in", "as", "at", "be"]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stop.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function toolCountScore(count: number): number {
  if (count >= 3 && count <= 15) return 5;
  if (count >= 16 && count <= 25) return 3;
  if (count >= 26) return 2;
  return 3;
}

export function coherenceProxies(defs: ToolDefinition[]): CoherenceProxies {
  const names = defs.map((d) => d.name);
  const wellNamed = names.filter((n) => /^[a-z][a-z0-9]*_[a-z0-9_]+$/.test(n) && VERB_ALLOWLIST.includes(n.split("_")[0]!)).length;
  const namingConsistency = names.length === 0 ? 5 : Math.round((wellNamed / names.length) * 4) + 1;

  const overlappingPairs: [string, string][] = [];
  for (let i = 0; i < defs.length; i++) {
    for (let j = i + 1; j < defs.length; j++) {
      const a = defs[i];
      const b = defs[j];
      const sim = jaccard(tokens(a.description ?? ""), tokens(b.description ?? ""));
      const sharedName = a.name.split("_").slice(1).join("_") === b.name.split("_").slice(1).join("_");
      if (sim >= 0.5 || (sharedName && sim >= 0.35)) overlappingPairs.push([a.name, b.name]);
    }
  }
  const disambiguation = overlappingPairs.length === 0 ? 5 : overlappingPairs.length <= 2 ? 4 : 3;

  const complete = defs.filter((d) => {
    const s = computeContextSignals(d);
    return s.hasOutputSchema && (s.paramCount === 0 || s.paramsWithDescriptions === s.paramCount);
  }).length;
  const completeness = defs.length === 0 ? 5 : Math.round((complete / defs.length) * 4) + 1;

  const toolCountAppropriateness = toolCountScore(defs.length);
  const coherence = Math.round(((disambiguation + namingConsistency + toolCountAppropriateness + completeness) / 4) * 10) / 10;
  return { disambiguation, namingConsistency, toolCountAppropriateness, completeness, coherence, overlappingPairs };
}

export interface ShadowCandidate {
  tool: string;
  cheaperSibling: string;
  invocationCost: number;
  cheaperSiblingInvocationCost: number;
  justification: string;
}

export function isShadowCandidate(cheap: number, expensive: number): boolean {
  return expensive >= 2 * cheap && expensive - cheap >= 4;
}

export function shadowCandidates(defs: ToolDefinition[]): ShadowCandidate[] {
  return shadowCandidatesWithCosts(
    defs.map((d) => ({ name: d.name, description: d.description ?? "", cost: computeContextSignals(d).invocationCost })),
  );
}

export function shadowCandidatesWithCosts(items: { name: string; description: string; cost: number }[]): ShadowCandidate[] {
  const byName = new Map(items.map((i) => [i.name, i]));
  const out: ShadowCandidate[] = [];
  for (const item of items) {
    let dearest: string | null = null;
    let dearestCost = -1;
    for (const other of items) {
      if (other.name === item.name) continue;
      if (isShadowCandidate(other.cost, item.cost) && other.cost > dearestCost) {
        dearest = other.name;
        dearestCost = other.cost;
      }
    }
    if (dearest === null) continue;
    const overlap = jaccard(tokens(item.description), tokens(byName.get(dearest)!.description));
    if (overlap < 0.2) continue;
    out.push({
      tool: item.name,
      cheaperSibling: dearest,
      invocationCost: item.cost,
      cheaperSiblingInvocationCost: dearestCost,
      justification: `purpose overlaps ${dearest} while costing ${item.cost} versus ${dearestCost} to invoke`,
    });
  }
  return out;
}

export interface ConformanceReport {
  toolCount: number;
  minTdqs: number;
  meanTdqs: number;
  descriptionQuality: number;
  descriptionQualityTier: string;
  belowPassing: string[];
  hardGateDefects: Record<string, HardGateFinding[]>;
  coherence: CoherenceProxies;
  shadowingRisks: ShadowCandidate[];
}

export function conformanceReport(defs: ToolDefinition[], budget = DESCRIPTION_BUDGET_FALLBACK): ConformanceReport {
  const siblings = defs.map((d) => d.name);
  const scored = defs.map((d) => scoreTool(d, siblings, budget));
  const mean = scored.length === 0 ? 0 : scored.reduce((s, t) => s + t.tdqs, 0) / scored.length;
  const min = scored.length === 0 ? 0 : Math.min(...scored.map((t) => t.tdqs));
  const descriptionQuality = round1(Math.round((0.6 * mean + 0.4 * min) * 100), 100);
  const hardGateDefects: Record<string, HardGateFinding[]> = {};
  for (const t of scored) if (t.hardGates.length > 0) hardGateDefects[t.name] = t.hardGates;
  return {
    toolCount: defs.length,
    minTdqs: Math.round(min * 10) / 10,
    meanTdqs: Math.round(mean * 10) / 10,
    descriptionQuality,
    descriptionQualityTier: computeTier(descriptionQuality),
    belowPassing: scored.filter((t) => t.tier > PASSING_TIER).map((t) => t.name),
    hardGateDefects,
    coherence: coherenceProxies(defs),
    shadowingRisks: shadowCandidates(defs),
  };
}
