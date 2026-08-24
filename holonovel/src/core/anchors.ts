// REQ-194 — deterministic anchor derivation. Anchors are derived from heading
// text: lowercase, strip `[\p{P}\p{S}]`, collapse whitespace/hyphen runs to a
// single hyphen, trim leading/trailing hyphens. Explicit `{#id}` takes
// precedence; role-scoping markers (`*Keeper only*`, `*Player only*`) are
// stripped before derivation; duplicate anchors within a file append `-1`,
// `-2`, … per GFM convention. CJK and non-ASCII word characters are preserved.
// Re-deriving the same source reproduces identical anchors (determinism).

export function deriveAnchor(
  heading: string,
  explicitId?: string,
  existing?: Set<string>,
): string {
  // Explicit `{#id}` takes precedence over derived anchors (REQ-194a).
  const inlineId = String(heading).match(/\{#([^}]+)\}/)?.[1];
  if (explicitId) return explicitId;
  if (inlineId) return inlineId;
  let text = heading
    .replace(/\*[^*]+\*/g, "")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, "")
    .replace(/[\s\u00a0]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!text) text = "section";
  if (existing) {
    if (existing.has(text)) {
      let n = 1;
      while (existing.has(`${text}-${n}`)) n++;
      text = `${text}-${n}`;
    }
    existing.add(text);
  }
  return text;
}