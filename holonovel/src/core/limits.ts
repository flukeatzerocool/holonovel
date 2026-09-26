// Novel property-group cardinality limits (REQ-129, REQ-097).
//
// Every Novel-scoped property group has an enforced maximum item count drawn
// from its §7.6 configuration variable. A maximum of zero disables the group's
// mutating tools (REQ-129c). The same table drives the `spec_health` count and
// overflow report (REQ-097, REQ-129c).

export interface GroupCap {
  group: string;
  variable: string;
  max: number;
}

function envInt(name: string, dflt: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return dflt;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? dflt : n;
}

// REQ-129b1/b2 — group maxima and configuration sources; defaults from §7.6.
export function groupCaps(): Record<string, GroupCap> {
  return {
    npcs: { group: "NPCs", variable: "TTRPG_MAX_NPCS", max: envInt("TTRPG_MAX_NPCS", 500) },
    lore: { group: "lore entries", variable: "TTRPG_MAX_LORE_ENTRIES", max: envInt("TTRPG_MAX_LORE_ENTRIES", 500) },
    countdowns: { group: "countdowns", variable: "TTRPG_MAX_COUNTDOWNS", max: envInt("TTRPG_MAX_COUNTDOWNS", 100) },
    synthesis: { group: "synthesis items", variable: "TTRPG_MAX_SYNTHESIS_ITEMS", max: envInt("TTRPG_MAX_SYNTHESIS_ITEMS", 15) },
    story: { group: "story journal entries", variable: "TTRPG_MAX_STORY_ENTRIES", max: envInt("TTRPG_MAX_STORY_ENTRIES", 1000) },
    entities: { group: "entities", variable: "TTRPG_MAX_ENTITIES", max: envInt("TTRPG_MAX_ENTITIES", 50) },
    roster: { group: "roster entities", variable: "TTRPG_MAX_ROSTER_ENTITIES", max: envInt("TTRPG_MAX_ROSTER_ENTITIES", 100) },
    snapshots: { group: "undo snapshots", variable: "TTRPG_MAX_SNAPSHOT_DEPTH", max: Math.max(10, envInt("TTRPG_MAX_SNAPSHOT_DEPTH", 10)) },
  };
}

// REQ-041 — the undo stack never drops below ten entries regardless of config.
export function snapshotDepth(): number {
  return groupCaps().snapshots.max;
}

// REQ-129a/c — a create/set/update that would exceed the group maximum is
// refused; a maximum of zero disables the group entirely.
export function capRefusal(group: string, current: number): { group: string; current: number; max: number } | null {
  const cap = groupCaps()[group];
  if (!cap) return null;
  if (cap.max === 0 || current >= cap.max) return { group: cap.group, current, max: cap.max };
  return null;
}
