// subworkflow.ts — §6.6 sub-workflow-to-REQ map parser.
//
// Shared by validate.ts and compare-spec-code.ts, which previously carried
// identical copies. Parses the §6.6 table rows `| REQ-… | S…/I… |` into a
// map of REQ ID to the set of sub-workflow IDs it names.

export function parseSubworkflowMap(text: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const line of text.split("\n")) {
    const m = line.match(/^\|\s*(REQ-\d{3}[a-z0-9]*)\s+\|\s*([^|\n]+)\s*\|/);
    if (!m) continue;
    const ids = m[2].matchAll(/\b([SI]\d+[a-z0-9]*)\b/g);
    if (!map.has(m[1])) map.set(m[1], new Set());
    for (const im of ids) map.get(m[1])!.add(im[1]);
  }
  return map;
}
