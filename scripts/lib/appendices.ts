// appendices.ts — appendix source parsing shared by assemble.ts and its tests.
//
// A source file is a set of `## Appendix <letter>:` sections separated by
// horizontal rules, optionally preceded by a header (`# Appendices`) or a
// budget-owned preamble (e.g. the fixture coverage matrix). Parsing slices by
// heading boundaries, so text between two headings — including continuation
// blocks after an intra-appendix `---` — always belongs to the preceding
// appendix and can never be silently discarded.

export interface AppendixSource {
  /** Leading `# Appendices` block, or "" when the file has none. */
  header: string;
  /** Leading block that is neither the header nor an appendix, or "". */
  preamble: string;
  /** Letter → block body, in source order. */
  blocks: Map<string, string>;
}

/** Strip a trailing horizontal rule and padding newlines from a block. */
function trimBlock(text: string): string {
  return text.replace(/\n\n---\s*$/, "").replace(/\n+$/, "");
}

export function parseAppendices(text: string, label: string): AppendixSource {
  const headings = [...text.matchAll(/^## Appendix ([A-Z]):/gm)];
  if (headings.length === 0) throw new Error(`${label}: no "## Appendix <letter>:" heading found`);

  const lead = trimBlock(text.slice(0, headings[0].index));
  const isHeader = lead.startsWith("# Appendices");
  if (isHeader && !/^# Appendices\s*$/.test(lead)) {
    throw new Error(`${label}: unexpected content after the "# Appendices" heading`);
  }

  const blocks = new Map<string, string>();
  headings.forEach((heading, index) => {
    const letter = heading[1];
    if (blocks.has(letter)) throw new Error(`${label}: duplicate Appendix ${letter}`);
    const end = index + 1 < headings.length ? headings[index + 1].index : text.length;
    blocks.set(letter, trimBlock(text.slice(heading.index, end)));
  });

  return {
    header: isHeader ? lead : "",
    preamble: lead && !isHeader ? lead : "",
    blocks,
  };
}
