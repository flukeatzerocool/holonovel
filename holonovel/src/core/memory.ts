// Compression ladder — deterministic tier derivation, budgeted assembly, and
// source-pointer traversal. Pure: no clocks, network, or LLM.
// REQ-590, REQ-591, REQ-592

import { describeEntry, type EventLogEntry } from "./event-log.js";
import type { AuditEntry, AuditArchiveSummary, Badge, NovelState, TierSummary } from "./state.js";

export type TierName = "recent" | "session" | "arc" | "campaign";

export interface TierCandidate {
  level: TierName;
  text: string;
  source_ordinals: number[];
}

export interface AssembledTiers {
  text: string;
  kept: TierName[];
  dropped: TierName[];
  tokens: number;
  source_ordinals: number[];
}

export interface TraversalResult {
  ordinal: number;
  entry: EventLogEntry | null;
  evicted: boolean;
}

// REQ-592 — shared token estimate: one token per four characters.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function spanOrdinals(eventLog: EventLogEntry[], start: string, end: string): number[] {
  if (!start || !end) return [];
  return eventLog.filter((e) => e.at >= start && e.at <= end).map((e) => e.ordinal);
}

// REQ-590 — Tier 1: the recent window, verbatim.
export function deriveRecentTier(eventLog: EventLogEntry[], limit: number): TierCandidate {
  const take = limit > 0 ? eventLog.slice(-limit) : eventLog.slice();
  return {
    level: "recent",
    text: take.length > 0 ? take.map(describeEntry).join("\n") : "[no recent events]",
    source_ordinals: take.map((e) => e.ordinal),
  };
}

// REQ-590 — Tier 2: a session summary derived from an audit slice.
export function deriveSessionTier(auditSlice: AuditEntry[], eventLog: EventLogEntry[]): TierCandidate {
  const body = auditSlice.filter((e) => e.tool !== "[session-boundary]");
  const start = auditSlice[0]?.timestamp ?? "";
  const end = auditSlice[auditSlice.length - 1]?.timestamp ?? "";
  const count = (pred: (e: AuditEntry) => boolean) => body.filter(pred).length;
  const significantRoll = (t: string) =>
    t === "fate_roll" || t === "ironsworn_move" || t === "ironsworn_progress_test" ||
    t === "forged_action_roll" || (t.includes("roll") && !t.includes("table"));
  const spanEvents = spanOrdinals(eventLog, start, end);
  const spanSet = new Set(spanEvents);
  const highlights = eventLog.filter((e) => spanSet.has(e.ordinal)).slice(-5).map((e) => `- ${e.text}`);
  const lines = [
    `session ${start || "(unknown)"} → ${end || "(unknown)"}`,
    `${body.length} entries, ${count((e) => e.tool === "end_combat")} confrontations`,
    `${count((e) => significantRoll(e.tool))} significant rolls, ${count((e) => e.tool.includes("condition"))} condition changes`,
    `${count((e) => e.tool.includes("roster") || e.tool === "import_character" || e.tool === "create_character")} roster changes, ${count((e) => e.tool === "set_scene_state")} scene transitions`,
    ...highlights,
  ];
  return { level: "session", text: lines.join("\n"), source_ordinals: spanEvents };
}

// REQ-590 — Tier 3: arc summaries over runs of session summaries.
export function deriveArcTier(
  sessions: AuditArchiveSummary[],
  eventLog: EventLogEntry[],
  sessionsPerArc: number,
  derivedAt: string,
): TierSummary[] {
  const size = sessionsPerArc > 0 ? sessionsPerArc : sessions.length;
  if (size <= 0 || sessions.length === 0) return [];
  const arcs: TierSummary[] = [];
  for (let i = 0; i < sessions.length; i += size) {
    const group = sessions.slice(i, i + size);
    const sourceSessions = group.flatMap((s) => s.source_sessions ?? [s.session_id]);
    const sourceOrdinals = [...new Set(group.flatMap((s) => s.source_ordinals ?? []))].sort((a, b) => a - b);
    const ordinalSet = new Set(sourceOrdinals);
    const highlights = eventLog.filter((e) => ordinalSet.has(e.ordinal)).slice(-5).map((e) => `- ${e.text}`);
    const text = [
      ...group.map((s) => `- ${s.session_id}: ${s.entry_count} entries, ${s.confrontations} confrontations, ${s.significant_rolls} significant rolls`),
      ...highlights,
    ].join("\n");
    arcs.push({ level: "arc", text, source_ordinals: sourceOrdinals, source_sessions: sourceSessions, source_refs: [], derived_at: derivedAt });
  }
  return arcs;
}

// REQ-590 — Tier 4: the campaign bible of stable facts. Player/Observer
// derivation omits secrets, GM-scoped lore, and GM-scoped campaign memory
// (REQ-072i badge scoping).
export function deriveCampaignTier(novel: NovelState, maxFacts: number, derivedAt: string, badge: Badge = "game_master"): TierSummary {
  const gm = badge === "game_master" || badge === "none";
  const facts: { text: string; ref: string; key: string }[] = [];
  for (const [key, lore] of novel.lore) {
    if (!lore.enabled) continue;
    if (!gm && lore.badge_scope === "game_master") continue;
    facts.push({ text: `lore ${key}: ${lore.content}`, ref: `lore:${key}`, key });
  }
  for (const faction of novel.factions) facts.push({ text: `faction ${faction.name}: ${faction.goals.join("; ")}`.trim(), ref: `faction:${faction.name}`, key: faction.name });
  if (gm) {
    for (const secret of novel.secrets) facts.push({ text: `secret ${secret.key}: ${secret.content}`, ref: `secret:${secret.key}`, key: secret.key });
  }
  for (const vow of novel.vows) {
    if (vow.state === "active") facts.push({ text: `vow ${vow.name}: ${vow.milestones} milestones (${vow.difficulty})`, ref: `vow:${vow.name}`, key: vow.name });
  }
  for (const [, npc] of novel.npcs) facts.push({ text: `npc ${npc.name}: ${npc.disposition ?? "neutral"}`, ref: `npc:${npc.name}`, key: npc.name });
  for (const mem of novel.campaign_memory ?? []) {
    if (!gm && mem.badge_scope === "game_master") continue;
    const ref = `campaign:${mem.category}:${mem.at}`;
    if (facts.some((f) => f.text === mem.text)) continue;
    facts.push({ text: mem.text, ref, key: mem.at });
  }
  const capped = maxFacts > 0 ? facts.slice(0, maxFacts) : facts;
  const sourceOrdinals = new Set<number>();
  for (const event of novel.event_log) {
    if (!gm && event.source === "game_master") continue;
    if (capped.some((f) => f.key.length > 2 && event.text.includes(f.key))) sourceOrdinals.add(event.ordinal);
  }
  return {
    level: "campaign",
    text: capped.length > 0 ? capped.map((f) => `- ${f.text}`).join("\n") : "[no campaign facts]",
    source_ordinals: [...sourceOrdinals].sort((a, b) => a - b),
    source_sessions: [],
    source_refs: capped.map((f) => f.ref),
    derived_at: derivedAt,
  };
}

// REQ-592 — pack by priority; drop in reverse priority order.
const PRIORITY: TierName[] = ["campaign", "recent", "session", "arc"];

export function assembleByBudget(tiers: TierCandidate[], budgetTokens: number): AssembledTiers {
  const present = new Map<TierName, TierCandidate>();
  for (const t of tiers) present.set(t.level, t);
  const kept = PRIORITY.filter((level) => present.has(level));
  const tokensOf = (levels: TierName[]) =>
    estimateTokens(levels.map((level) => present.get(level)!.text).join("\n\n"));
  if (budgetTokens > 0) {
    for (const level of [...PRIORITY].reverse()) {
      if (tokensOf(kept) <= budgetTokens) break;
      if (kept.length <= 1) break;
      const idx = kept.indexOf(level);
      if (idx >= 0) kept.splice(idx, 1);
    }
  }
  const dropped = PRIORITY.filter((level) => present.has(level) && !kept.includes(level));
  const parts = kept.map((level) => present.get(level)!.text);
  for (const level of dropped) parts.push(`[truncated] ${level} tier omitted at this budget`);
  const sourceOrdinals = [...new Set(kept.flatMap((level) => present.get(level)!.source_ordinals))].sort((a, b) => a - b);
  return { text: parts.join("\n\n"), kept, dropped, tokens: tokensOf(kept), source_ordinals: sourceOrdinals };
}

// REQ-591 — resolve pointers; evicted ordinals are reported, never dropped.
export function traverse(sourceOrdinals: number[], eventLog: EventLogEntry[]): TraversalResult[] {
  const byOrdinal = new Map(eventLog.map((e) => [e.ordinal, e]));
  return sourceOrdinals.map((ordinal) => {
    const entry = byOrdinal.get(ordinal) ?? null;
    return { ordinal, entry, evicted: entry === null };
  });
}
