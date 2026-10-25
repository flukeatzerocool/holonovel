// enumeration.ts — REQ-409 response-lean enumeration projection. [library]
//
// Collection and listing tools return a summary entry by default; a per-call
// `detail: true` requests the full record. The projector is pure and derives
// every field from the supplied record, so a summary can never drift from the
// stored shape. Kind field sets are recorded in DECISIONS.md.

export type SummaryKind =
  | "npc"
  | "lore"
  | "faction"
  | "belief"
  | "agent_task"
  | "note"
  | "server_note";

interface SummarySpec {
  fields: string[];
  preview?: { field: string; limit: number };
}

const SPECS: Record<SummaryKind, SummarySpec> = {
  npc: { fields: ["id", "name", "disposition", "location"], preview: { field: "description", limit: 120 } },
  lore: { fields: ["key", "badge_scope", "enabled"], preview: { field: "content", limit: 120 } },
  faction: { fields: ["id", "name", "status"], preview: { field: "description", limit: 120 } },
  belief: { fields: ["entity_id", "question", "polarity", "confidence", "status"] },
  agent_task: { fields: ["id", "subject", "status", "autonomy", "updated_at"], preview: { field: "goal", limit: 120 } },
  note: { fields: ["key", "badge_scope"], preview: { field: "content", limit: 100 } },
  server_note: { fields: ["key", "narrative_tag"], preview: { field: "content", limit: 100 } },
};

export function summaryEntry(kind: SummaryKind, record: Record<string, any>): Record<string, any> {
  const spec = SPECS[kind];
  const out: Record<string, any> = {};
  for (const field of spec.fields) {
    if (record?.[field] !== undefined) out[field] = record[field];
  }
  if (spec.preview) {
    const value = record?.[spec.preview.field];
    if (typeof value === "string") {
      out.preview = value.length > spec.preview.limit
        ? `${value.slice(0, spec.preview.limit)}...`
        : value;
    }
  }
  return out;
}

export function summaryEntries(kind: SummaryKind, records: Iterable<Record<string, any>>): Record<string, any>[] {
  return [...records].map((record) => summaryEntry(kind, record));
}
