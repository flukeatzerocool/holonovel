#!/usr/bin/env npx tsx
/**
 * assemble.ts — assemble holonovel.md from spec/ source files. [build tool]
 *
 * Reads the core section files and the appendix files in canonical order and
 * writes the assembled `holonovel.md` plus the reference-implementation copy
 * (`holonovel/holonovel.md`). Exit codes: 0 = assembled, 1 = a source file is
 * missing or empty.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { parseAppendices } from "./lib/appendices.js";
import { computeSpecContentHash, writePhaseMapHash } from "./lib/phase-map-hash.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const SPEC_DIR = path.join(ROOT, "spec");
const OUT_FILE = path.join(ROOT, "holonovel.md");
const REF_IMPL_OUT = path.join(ROOT, "holonovel", "holonovel.md");

const CORE_FILES = [
  "01-foundations.md",
  "01a-constitution.md",
  "02-requirements.md",
  "03-build.md",
  "04-runtime.md",
  "05-verification.md",
  "06-artifacts.md",
  "07-independent.md",
  "08-synthesis.md",
];

const APPENDIX_REF = "appendices-reference.md";
const APPENDIX_FIX = "appendices-fixtures.md";
const APPENDIX_LIC = "appendices-licenses.md";
const APPENDIX_RUN = "appendices-runbooks.md";
const APPENDIX_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function readFile(filePath: string): string {
  const fp = path.join(SPEC_DIR, filePath);
  if (!fs.existsSync(fp)) throw new Error(`${fp}: not found`);
  const text = fs.readFileSync(fp, "utf-8");
  if (text.trim().length === 0) throw new Error(`${fp}: empty file`);
  return text;
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

  // Appendices — interleaved from four source files
  const ref = parseAppendices(readFile(APPENDIX_REF), APPENDIX_REF);
  if (ref.header === "") throw new Error(`${APPENDIX_REF}: source must begin with "# Appendices"`);
  report.push(`  ${APPENDIX_REF} (${ref.blocks.size} appendices)`);
  const fix = parseAppendices(readFile(APPENDIX_FIX), APPENDIX_FIX);
  report.push(`  ${APPENDIX_FIX} (${fix.blocks.size} appendices)`);
  const lic = parseAppendices(readFile(APPENDIX_LIC), APPENDIX_LIC);
  report.push(`  ${APPENDIX_LIC} (${lic.blocks.size} appendices)`);
  const run = parseAppendices(readFile(APPENDIX_RUN), APPENDIX_RUN);
  report.push(`  ${APPENDIX_RUN} (${run.blocks.size} appendices)`);

  // A malformed or duplicated heading must fail assembly rather than silently
  // dropping content from the assembled spec (CR-21).
  const allBlocks = new Map<string, string>();
  // A source preamble (everything before that file's first appendix) is
  // emitted immediately before the first block that file defines, so it keeps
  // its position instead of being discarded.
  const preambles = new Map<string, string>();
  for (const [label, source] of [[APPENDIX_REF, ref], [APPENDIX_FIX, fix], [APPENDIX_LIC, lic], [APPENDIX_RUN, run]] as const) {
    if (source.header !== "" && label !== APPENDIX_REF) {
      throw new Error(`${label}: only ${APPENDIX_REF} may carry the "# Appendices" header`);
    }
    const first = source.blocks.keys().next();
    if (source.preamble !== "" && !first.done) preambles.set(first.value, source.preamble);
    for (const [letter, block] of source.blocks) {
      if (allBlocks.has(letter)) throw new Error(`Appendix ${letter} is defined by more than one source file (${label})`);
      allBlocks.set(letter, block);
    }
  }
  const missing = [...APPENDIX_ORDER].filter((letter) => !allBlocks.has(letter));
  if (missing.length > 0) throw new Error(`Missing appendices: ${missing.join(", ")}`);
  const extras = [...allBlocks.keys()].filter((letter) => !APPENDIX_ORDER.includes(letter));
  if (extras.length > 0) throw new Error(`Unexpected appendix letters: ${extras.join(", ")}`);

  const ordered: string[] = [];
  for (const letter of APPENDIX_ORDER) {
    const block = allBlocks.get(letter);
    if (!block) continue;
    const preamble = preambles.get(letter);
    if (preamble) ordered.push(preamble);
    ordered.push(block);
  }

  const appendixContent = `${ref.header}\n\n${ordered.join("\n\n---\n\n")}\n`;
  report.push(`  appendices assembled: ${allBlocks.size} in canonical order`);

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

// Guard: a new top-level spec/*.md file that is not part of the canonical load
// order would be committed but never assembled. Fail loudly instead.
const ALLOWED_SOURCE_FILES = new Set([
  ...CORE_FILES,
  APPENDIX_REF,
  APPENDIX_FIX,
  APPENDIX_LIC,
  APPENDIX_RUN,
  "build-phase-map.md",
]);

function assertKnownSourceFiles(): void {
  const unknown = fs
    .readdirSync(SPEC_DIR)
    .filter((entry) => entry.endsWith(".md") && !ALLOWED_SOURCE_FILES.has(entry))
    .sort();
  if (unknown.length > 0) {
    throw new Error(
      `Unrecognized spec/ source file(s): ${unknown.join(", ")}. ` +
        `Add them to scripts/assemble.ts or remove them before assembling.`
    );
  }
}

function main(): void {
  assertKnownSourceFiles();
  const { content, report } = assemble();

  console.log("Assembling holonovel.md from spec/ files:");
  for (const line of report) console.log(line);

  fs.writeFileSync(OUT_FILE, content, "utf-8");
  console.log(`\nWrote ${OUT_FILE}`);

  // Mirror the assembled spec into the reference implementation package, which
  // loads holonovel.md at runtime to compute its spec-hash fingerprint.
  if (fs.existsSync(path.dirname(REF_IMPL_OUT))) {
    fs.writeFileSync(REF_IMPL_OUT, content, "utf-8");
    console.log(`Wrote ${REF_IMPL_OUT}`);
  }

  // REQ-278: record the content hash of the referenced spec sources in the
  // build-phase map so the validate gate can detect a stale map.
  const specHash = computeSpecContentHash();
  if (writePhaseMapHash(specHash)) {
    console.log(`Updated spec/build-phase-map.md content hash: ${specHash}`);
  } else {
    console.log(`spec/build-phase-map.md content hash current: ${specHash}`);
  }
}

main();
