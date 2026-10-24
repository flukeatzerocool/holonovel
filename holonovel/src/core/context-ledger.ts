// context-ledger.ts — side-effect-free context accounting and stable-prefix
// hashing for the context report. Pure: no clocks, network, or state writes.
// REQ-606, REQ-607, REQ-608, REQ-610

import { createHash } from "node:crypto";
import { estimateTokens } from "./memory.js";

export type ContextClass = "stable" | "semi_stable" | "volatile";

export interface ContextSectionDef {
  name: string;
  class: ContextClass;
}

export interface ContextSectionReport {
  name: string;
  class: ContextClass;
  tokens: number;
}

export interface StablePrefixReport {
  sections: string[];
  bytes: number;
  tokens: number;
  sha256: string;
  ratio: number;
}

export interface ContextLedgerReport {
  estimator: "utf8-bytes-div-4-ceil";
  profile: string;
  sections: ContextSectionReport[];
  total_tokens: number;
  stable_prefix: StablePrefixReport;
}

export interface ContextAllocation {
  budget_tokens: number;
  within_budget: boolean;
  kept: string[];
  dropped: string[];
  total_tokens: number;
}

// REQ-606 — the canonical, ordered section list. Every entry appears exactly
// once so a report cannot silently omit a section.
export const CONTEXT_SECTIONS: ReadonlyArray<ContextSectionDef> = [
  { name: "tool_catalog", class: "stable" },
  { name: "registered_prompts", class: "stable" },
  { name: "resource_directory", class: "stable" },
  { name: "scene_state", class: "semi_stable" },
  { name: "memory_tiers", class: "semi_stable" },
  { name: "last_tool_output", class: "volatile" },
];

// REQ-610 — required sections are never dropped; optional sections degrade in
// this order (lowest priority first), mirroring the REQ-118 truncation tiers.
export const CONTEXT_REQUIRED_SECTIONS: ReadonlySet<string> = new Set(["tool_catalog", "registered_prompts"]);
export const CONTEXT_DROP_ORDER: ReadonlyArray<string> = [
  "last_tool_output",
  "resource_directory",
  "scene_state",
  "memory_tiers",
];

// REQ-610 — deterministic packing under a per-turn budget. The allocator only
// decides which ledger sections are presented; it never changes an existing
// bound's own behaviour (REQ-004/083/118/135/239/588).
export function allocateContextBudget(report: ContextLedgerReport, budgetTokens: number): ContextAllocation {
  const dropped = new Set<string>();
  let total = report.total_tokens;
  for (const name of CONTEXT_DROP_ORDER) {
    if (total <= budgetTokens) break;
    const section = report.sections.find((entry) => entry.name === name);
    if (!section || CONTEXT_REQUIRED_SECTIONS.has(name)) continue;
    dropped.add(name);
    total -= section.tokens;
  }
  return {
    budget_tokens: budgetTokens,
    within_budget: total <= budgetTokens,
    kept: report.sections.filter((entry) => !dropped.has(entry.name)).map((entry) => entry.name),
    dropped: report.sections.filter((entry) => dropped.has(entry.name)).map((entry) => entry.name),
    total_tokens: total,
  };
}

// REQ-606, REQ-607 — derive the ledger from caller-supplied section text. A
// missing section is accounted as empty (zero tokens), never dropped.
export function buildContextLedger(input: {
  profile: string;
  sections: Record<string, string>;
}): ContextLedgerReport {
  const sections: ContextSectionReport[] = CONTEXT_SECTIONS.map((def) => ({
    name: def.name,
    class: def.class,
    tokens: estimateTokens(input.sections[def.name] ?? ""),
  }));
  const totalTokens = sections.reduce((sum, section) => sum + section.tokens, 0);
  const stableNames = CONTEXT_SECTIONS.filter((def) => def.class === "stable").map((def) => def.name);
  const stableText = stableNames.map((name) => input.sections[name] ?? "").join("\n");
  const prefixBytes = Buffer.byteLength(stableText, "utf-8");
  const prefixTokens = estimateTokens(stableText);
  const sha256 = createHash("sha256").update(stableText, "utf8").digest("hex");
  return {
    estimator: "utf8-bytes-div-4-ceil",
    profile: input.profile,
    sections,
    total_tokens: totalTokens,
    stable_prefix: {
      sections: stableNames,
      bytes: prefixBytes,
      tokens: prefixTokens,
      sha256,
      ratio: totalTokens > 0 ? Number((prefixTokens / totalTokens).toFixed(4)) : 0,
    },
  };
}
