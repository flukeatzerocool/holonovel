import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_README = path.resolve(__dirname, "..", "..", "README.md");

export function readReadme(readmePath?: string): string {
  const target = readmePath || DEFAULT_README;
  if (!fs.existsSync(target)) {
    throw new Error(`${target} not found`);
  }
  return fs.readFileSync(target, "utf-8");
}

export interface Heading {
  level: number;
  title: string;
  line: number;
}

export function extractHeadings(text: string): Heading[] {
  const headings: Heading[] = [];
  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;
    const m = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (m) {
      headings.push({ level: m[1].length, title: m[2].trim(), line: i + 1 });
    }
  }
  return headings;
}

export function extractLinks(text: string): { url: string; label: string; line: number }[] {
  const links: { url: string; label: string; line: number }[] = [];
  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;
    const re = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(lines[i])) !== null) {
      links.push({ label: match[1], url: match[2], line: i + 1 });
    }
  }
  return links;
}

export function extractBlockquotes(text: string): { content: string; line: number }[] {
  const quotes: { content: string; line: number }[] = [];
  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;
    if (lines[i].trim().startsWith(">")) {
      quotes.push({ content: lines[i].trimStart().replace(/^>\s?/, ""), line: i + 1 });
    }
  }
  return quotes;
}

export function extractBulletLists(text: string): { items: string[]; startLine: number }[] {
  const lists: { items: string[]; startLine: number }[] = [];
  let inBlock = false;
  const lines = text.split("\n");
  let current: string[] = [];
  let currentStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("```")) {
      inBlock = !inBlock;
      if (current.length > 0) {
        lists.push({ items: current, startLine: currentStart });
        current = [];
        currentStart = 0;
      }
      continue;
    }
    if (inBlock) continue;
    if (/^[-*]\s/.test(trimmed) && !/^-{3,}/.test(trimmed)) {
      if (current.length === 0) currentStart = i + 1;
      current.push(trimmed);
    } else {
      if (current.length > 0) {
        lists.push({ items: current, startLine: currentStart });
        current = [];
        currentStart = 0;
      }
    }
  }
  if (current.length > 0) {
    lists.push({ items: current, startLine: currentStart });
  }
  return lists;
}

export function splitCodeFences(text: string): string[] {
  const chunks: string[] = [];
  let inBlock = false;
  let current = "";
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("```")) {
      inBlock = !inBlock;
      current += line + "\n";
      if (!inBlock) {
        chunks.push(current);
        current = "";
      }
      continue;
    }
    if (!inBlock) {
      chunks.push(line);
    } else {
      current += line + "\n";
    }
  }
  return chunks;
}

export function proseOnly(text: string): string {
  return splitCodeFences(text)
    .filter((chunk) => !chunk.startsWith("```"))
    .join("\n");
}

export function proseLines(text: string): { line: number; content: string }[] {
  const lines: { line: number; content: string }[] = [];
  let inBlock = false;
  const raw = text.split("\n");
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (!inBlock) {
      lines.push({ line: i + 1, content: raw[i] });
    }
  }
  return lines;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9\s-—]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
