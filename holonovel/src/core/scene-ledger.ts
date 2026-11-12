// scene-ledger.ts — pure helpers for the §5.6 scene ledger, presence, and NPC
// depth surfaces. No I/O, no clock reads, no mutation: every function takes the
// Novel state and returns a value, so the ledger's derivations stay testable
// and deterministic.
//
// REQ-307a/b (presence), REQ-076b5/b6/b7 (lore contradiction), REQ-075c/d
// (session distance for the [distant] marker).

import type { NovelState } from "./state.js";

/**
 * REQ-307a — the presence list, with the absent/empty distinction preserved.
 * `null` means the field was never declared, which makes every imported entity
 * present (backward compatible); a Set is the explicit declaration, and an
 * empty Set means "none present" per REQ-307c.
 */
export function presentEntityIds(novel: NovelState): Set<string> | null {
  const ids = novel.characters_present_ids;
  if (ids === null || ids === undefined) return null;
  return new Set(ids);
}

/** REQ-307a — one entity's presence under the same absent/empty rule. */
export function isPresent(novel: NovelState, entityId: string): boolean {
  const ids = presentEntityIds(novel);
  return ids === null ? true : ids.has(entityId);
}

/** REQ-076b2 — the presence snapshot stored on a scene-history entry. */
export function presentIdsForLedger(novel: NovelState, extra: string[] = []): string[] {
  const ids = presentEntityIds(novel);
  if (ids === null) return [...new Set([...novel.entities.keys(), ...extra])];
  return [...new Set([...ids, ...extra])];
}

/**
 * REQ-075d — sessions elapsed since an ISO timestamp, derived from the
 * REQ-237 session-boundary metadata. Returns null when the Novel carries no
 * session data, so callers never render a guessed integer (REQ-173b's rule).
 */
export function sessionsSince(novel: NovelState, iso: string | undefined): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const sessions = novel.metadata?.sessions ?? [];
  if (sessions.length === 0) return null;
  let later = 0;
  for (const session of sessions) {
    const start = Date.parse(session.timespan_start ?? "");
    if (!Number.isNaN(start) && start > at) later++;
  }
  return later;
}

/** Adjective pairs used by the keyword contradiction check (REQ-076b7). */
const ANTONYM_PAIRS: Array<[string, string]> = [
  ["crowded", "empty"],
  ["noisy", "quiet"],
  ["busy", "deserted"],
  ["bustling", "deserted"],
  ["lively", "quiet"],
  ["bright", "dark"],
  ["clean", "filthy"],
  ["warm", "cold"],
  ["safe", "dangerous"],
  ["prosperous", "impoverished"],
];

/** Disposition sentiment and the scene words that contradict it (REQ-076b6b). */
const DISPOSITION_CONTRADICTIONS: Record<string, string[]> = {
  hostile: ["peaceful", "calm", "welcoming", "friendly", "serene"],
  suspicious: ["welcoming", "trusting", "friendly"],
  wary: ["welcoming", "trusting", "relaxed"],
  friendly: ["hostile", "menacing", "threatening"],
};

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean),
  );
}

/**
 * REQ-076b5/b6/b7 — the advisory contradiction check for a scene change.
 *
 * Compares the new description against (a) lore entries with a GM or shared
 * badge scope whose triggers match the location, and (b) NPC dispositions set
 * explicitly on NPCs located at the scene. The comparison is a fixed adjective
 * table, never semantic analysis: it reports the first contradiction it finds
 * and returns null when there is none. The caller surfaces the string as a
 * `[WARNING]` paragraph and never blocks the scene change.
 */
export function loreContradictionWarning(
  novel: NovelState,
  location: string | undefined,
  description: string,
): string | null {
  const sceneWords = tokens(description);
  const locationText = (location ?? "").toLowerCase();
  const locationWords = tokens(location ?? "");

  if (locationText) {
    for (const [, entry] of novel.lore) {
      if (!entry.enabled) continue;
      if (entry.badge_scope !== "game_master" && entry.badge_scope !== "shared") continue;
      const triggerHit = entry.triggers.some((trigger) => {
        const t = trigger.toLowerCase();
        return t.length > 1 && (locationText.includes(t) || locationWords.has(t));
      });
      if (!triggerHit) continue;
      const loreWords = tokens(entry.content ?? "");
      for (const [a, b] of ANTONYM_PAIRS) {
        const loreWord = loreWords.has(a) ? a : loreWords.has(b) ? b : null;
        if (!loreWord) continue;
        const opposite = loreWord === a ? b : a;
        if (!sceneWords.has(opposite)) continue;
        return `Scene description contradicts lore entry '${entry.key}' for ${location}: the entry says '${loreWord}', the scene describes '${opposite}'. Advisory — the scene change stands.`;
      }
    }
  }

  for (const [, npc] of novel.npcs) {
    const disposition = npc.disposition;
    if (!disposition || disposition === "neutral") continue;
    if (!npc.location || npc.location.toLowerCase() !== locationText) continue;
    const contradicting = DISPOSITION_CONTRADICTIONS[disposition];
    if (!contradicting) continue;
    const hit = contradicting.find((word) => sceneWords.has(word));
    if (hit) {
      return `Scene description contradicts ${npc.name}'s explicit disposition '${disposition}' at ${location}. Advisory — the scene change stands.`;
    }
  }

  return null;
}
