// spec-delta-classify.ts — pure delta classification for spec-delta.ts.
//
// Extracted so the classification rules (notably the state-model and
// tool-surface major triggers) are unit-testable without executing the script.
// Exit codes: n/a (library).

export const STATE_MODEL_REQS: readonly string[] = [
  "030", "031", "032", "040", "041", "042", "043", "044",
  "055", "065", "074", "075", "076", "077", "083", "088",
  "092", "093",
];

export const TOOL_SURFACE_REQS: readonly string[] = [
  "020", "021", "022", "023", "024", "025", "042", "056",
  "057", "058", "060", "061", "066", "067", "073", "079",
  "081", "082", "084", "086", "087", "089", "090", "091",
  "098", "104",
];

// REQ-395c → "395"; a base ID with no letter suffix is returned unchanged.
export function reqFamily(id: string): string {
  return id.replace(/(?<=\d)[a-z][a-z0-9]*$/, "");
}

export type DeltaClassification = "none" | "patch" | "editorial" | "minor" | "major";

export interface DeltaShape {
  added: string[];
  removed: string[];
  modified: string[];
  sectionsChanged: string[];
  editorial: boolean;
}

export function classifyDelta(shape: DeltaShape): DeltaClassification {
  const hasNew = shape.added.length > 0;
  const hasRemoved = shape.removed.length > 0;
  const hasModified = shape.modified.length > 0;
  const hasNewSections = shape.sectionsChanged.length > 0;

  const families = [...shape.added, ...shape.removed, ...shape.modified].map(reqFamily);
  const stateModelChanged = families.some((id) => STATE_MODEL_REQS.includes(id));
  const toolSurfaceChanged = families.some((id) => TOOL_SURFACE_REQS.includes(id));
  const hasMajorTrigger = hasNewSections || stateModelChanged || toolSurfaceChanged;

  if (hasModified && !hasNew && !hasRemoved && !hasNewSections && shape.editorial) return "editorial";
  if (!hasNew && !hasRemoved && !hasModified && !hasNewSections) return "patch";
  return hasMajorTrigger ? "major" : "minor";
}
