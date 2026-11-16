/**
 * changelog-entry.ts — derive a dated CHANGELOG block from an increment's AAR.
 *
 * Purpose: `session:close` should write the CHANGELOG entry from the AAR rather
 * than have the operator retype it (ROADMAP item 6). The AAR carries a machine
 * readable block; this module parses it, rejects a malformed one, and renders
 * the exact Markdown the close prepends.
 *
 * Pure: no filesystem, no clock, no process state.
 *
 * Block shape (inside aar.md):
 *
 *   ## Changelog entry
 *
 *   **Title:** One line, no date prefix, 100 characters or fewer.
 *
 *   **Summary:** One paragraph.
 *
 *   - one bullet
 *
 * Citations: ROADMAP item 6; REQ-394a's bookkeeping conventions.
 */

export const BLOCK_HEADING = "## Changelog entry";
export const MAX_TITLE_CHARS = 100;
export const MAX_BULLETS = 8;

export interface ChangelogEntry {
  title: string;
  summary: string;
  bullets: string[];
}

export type ChangelogParse =
  | { status: "absent" }
  | { status: "malformed"; reason: string }
  | { status: "ok"; entry: ChangelogEntry };

/**
 * Read the `## Changelog entry` block from an AAR. Absent (no heading) is a
 * distinct outcome from malformed (heading present, content unusable): the
 * close warns on the former and refuses the latter.
 */
export function parseChangelogEntry(aarText: string): ChangelogParse {
  const lines = aarText.split("\n");
  const start = lines.findIndex((line) => line.trim() === BLOCK_HEADING);
  if (start === -1) return { status: "absent" };

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  const body = lines.slice(start + 1, end);

  const titleAt = body.findIndex((line) => /^\*\*Title:\*\*/.test(line.trim()));
  if (titleAt === -1) return { status: "malformed", reason: "missing '**Title:**'" };
  const title = body[titleAt]!.replace(/^\s*\*\*Title:\*\*\s*/, "").trim();
  if (title === "") return { status: "malformed", reason: "'**Title:**' is empty" };
  if (title.length > MAX_TITLE_CHARS) {
    return { status: "malformed", reason: `title is ${title.length} characters (max ${MAX_TITLE_CHARS})` };
  }
  if (/^\d{4}-\d{2}-\d{2}\b/.test(title)) {
    return { status: "malformed", reason: "title must not repeat the date prefix" };
  }

  const summaryAt = body.findIndex((line) => /^\*\*Summary:\*\*/.test(line.trim()));
  if (summaryAt === -1) return { status: "malformed", reason: "missing '**Summary:**'" };
  const summaryLines = [body[summaryAt]!.replace(/^\s*\*\*Summary:\*\*\s*/, "").trim()];
  for (let i = summaryAt + 1; i < body.length; i++) {
    const line = body[i]!;
    if (line.trim() === "" || /^\s*-\s+/.test(line)) break;
    summaryLines.push(line.trim());
  }
  const summary = summaryLines.filter(Boolean).join(" ").trim();
  if (summary === "") return { status: "malformed", reason: "'**Summary:**' is empty" };

  const bullets: string[] = [];
  for (let i = summaryAt + 1; i < body.length; i++) {
    const match = body[i]!.match(/^\s*-\s+(.+)$/);
    if (match) bullets.push(match[1]!.trim());
  }
  if (bullets.length === 0) return { status: "malformed", reason: "no '- ' bullets" };
  if (bullets.length > MAX_BULLETS) {
    return { status: "malformed", reason: `${bullets.length} bullets (max ${MAX_BULLETS})` };
  }

  return { status: "ok", entry: { title, summary, bullets } };
}

/** Render the dated heading, summary paragraph, and bullets. Ends with one newline. */
export function renderChangelogEntry(date: string, entry: ChangelogEntry): string {
  const bullets = entry.bullets.map((bullet) => `- ${bullet}`).join("\n");
  return `## ${date} — ${entry.title}\n\n${entry.summary}\n\n${bullets}\n`;
}

/**
 * Put a rendered entry directly under the `# Changelog` title. Returns the text
 * unchanged when the same dated heading is already present, so a re-run is a
 * no-op rather than a duplicate.
 */
export function prependChangelogEntry(changelogText: string, rendered: string): string {
  const heading = rendered.split("\n")[0]!;
  if (changelogText.split("\n").some((line) => line.trim() === heading.trim())) {
    return changelogText;
  }
  const title = "# Changelog";
  if (changelogText.startsWith(title)) {
    const rest = changelogText.slice(title.length).replace(/^\s*\n/, "");
    return `${title}\n\n${rendered}\n${rest}`;
  }
  return `${rendered}\n${changelogText}`;
}
