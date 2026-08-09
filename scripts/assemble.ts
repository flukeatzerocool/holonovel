import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SPEC_DIR = path.join(ROOT, "spec");
const OUT_FILE = path.join(ROOT, "holonovel.md");

const CORE_FILES = [
  "01-foundations.md",
  "02-requirements.md",
  "03-build.md",
  "04-runtime.md",
  "05-verification.md",
  "06-artifacts.md",
  "07-independent.md",
  "08-enrichment.md",
];

const APPENDIX_REF = "appendices-reference.md";
const APPENDIX_FIX = "appendices-fixtures.md";
const APPENDIX_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXY";

function readFile(filePath: string): string {
  const fp = path.join(SPEC_DIR, filePath);
  if (!fs.existsSync(fp)) throw new Error(`${fp}: not found`);
  const text = fs.readFileSync(fp, "utf-8");
  if (text.trim().length === 0) throw new Error(`${fp}: empty file`);
  return text;
}

function parseAppendices(text: string): { header: string; blocks: Map<string, string> } {
  const blocks = new Map<string, string>();
  const parts = text.split("\n\n---\n\n");

  let header = "";
  let restIdx = 0;

  if (parts[0] && parts[0].startsWith("# Appendices")) {
    const headerEnd = parts[0].indexOf("\n\n## Appendix ");
    if (headerEnd !== -1) {
      header = parts[0].slice(0, headerEnd + 2); // "# Appendices\n\n"
      const block = parts[0].slice(headerEnd + 2); // "## Appendix A: ..."
      const m = block.match(/^## Appendix ([A-Z]):/);
      if (m) blocks.set(m[1], block);
    } else {
      header = parts[0];
    }
    restIdx = 1;
  }

  for (let i = restIdx; i < parts.length; i++) {
    const m = parts[i].match(/^## Appendix ([A-Z]):/);
    if (m) blocks.set(m[1], parts[i]);
  }

  return { header, blocks };
}

function assemble(): { content: string; report: string[] } {
  const report: string[] = [];
  const parts: string[] = [];

  // Core files
  for (const file of CORE_FILES) {
    const text = readFile(file);
    parts.push(text.replace(/\n+$/, ""));
    report.push(`  ${file} (${text.split("\n").length} lines)`);
  }

  // Appendices — interleaved from two source files
  const { header: refHeader, blocks: refBlocks } = parseAppendices(readFile(APPENDIX_REF));
  report.push(`  ${APPENDIX_REF} (${refBlocks.size} appendices)`);
  const { blocks: fixBlocks } = parseAppendices(readFile(APPENDIX_FIX));
  report.push(`  ${APPENDIX_FIX} (${fixBlocks.size} appendices)`);

  const allBlocks = new Map([...refBlocks, ...fixBlocks]);
  const ordered: string[] = [];
  for (const letter of APPENDIX_ORDER) {
    const block = allBlocks.get(letter);
    if (block) ordered.push(block.replace(/\n+$/, ""));
  }

  const appendixContent = refHeader + ordered.join("\n\n---\n\n") + "\n";
  report.push(`  appendices assembled: ${ordered.length} in canonical order`);

  const coreSeparator = "\n\n---\n\n";
  const coreContent = parts.join(coreSeparator);
  const content = coreContent + coreSeparator + appendixContent;

  const trimmed = content.replace(/\n+$/, "\n");

  const hash = createHash("sha256").update(trimmed).digest("hex");
  report.push(`\nAssembled: ${OUT_FILE}`);
  report.push(`Total lines: ${trimmed.split("\n").length}`);
  report.push(`SHA-256: ${hash}`);

  return { content: trimmed, report };
}

function main(): void {
  const { content, report } = assemble();

  console.log("Assembling holonovel.md from spec/ files:");
  for (const line of report) console.log(line);

  fs.writeFileSync(OUT_FILE, content, "utf-8");
  console.log(`\nWrote ${OUT_FILE}`);
}

main();
