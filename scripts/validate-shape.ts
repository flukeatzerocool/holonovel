import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { extractReqBodies, extractReqBodiesWithSentences } from "./lib/parse-spec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.join(ROOT, "spec");

function readFile(filename: string): string {
  return fs.readFileSync(path.join(SPEC_DIR, filename), "utf-8");
}

interface ReqBodyEntry {
  id: string;
  body: string;
  sentences: string[];
  paragraphCount: number;
}

function checkReqShapeLocal(reqs: Map<string, ReqBodyEntry>): string[] {
  const issues: string[] = [];
  for (const [reqId, entry] of reqs) {
    const body = entry.body;

    if (entry.paragraphCount > 1) {
      issues.push(`ERROR: ${reqId}: ${entry.paragraphCount} paragraphs`);
    }
    if (entry.sentences.length > 8) {
      issues.push(`ERROR: ${reqId}: ${entry.sentences.length} sentences`);
    }
    if (body.length > 800) {
      issues.push(`ERROR: ${reqId}: ${body.length} chars`);
    }

    const tableInBody = body.split("\n").some(
      (l) => !l.trim().startsWith("```") && l.trim().startsWith("|") && l.trim().endsWith("|")
    );
    if (tableInBody) issues.push(`ERROR: ${reqId}: table in body`);

    const bulletInBody = body.split("\n").some(
      (l) => /^\s*-\s/.test(l) && !l.startsWith("```")
    );
    if (bulletInBody) issues.push(`ERROR: ${reqId}: bullet list`);

    const numberedInBody = body.split("\n").some(
      (l) => /^\s*\d+\.\s/.test(l) && !l.startsWith("```")
    );
    if (numberedInBody) issues.push(`ERROR: ${reqId}: numbered steps`);

    const shallCount = (body.match(/\bSHALL\b/g) || []).length;
    if (shallCount > 10) issues.push(`ERROR: ${reqId}: ${shallCount} SHALL clauses`);
    else if (shallCount > 8) issues.push(`ERROR: ${reqId}: ${shallCount} SHALL clauses`);

    if (/\(string[,) ]|\(integer[,) ]|\(boolean[,) ]|\(float[,) ]|\(number[,) ]/.test(body)) {
      issues.push(`ERROR: ${reqId}: parameter type annotations`);
    }
    if (/Default:\s/.test(body)) issues.push(`ERROR: ${reqId}: Default: clause`);

    const enumerated = body.match(/`[^`]+`(,\s*`[^`]+`)*/g);
    if (enumerated) {
      for (const list of enumerated) {
        const count = (list.match(/`/g) || []).length / 2;
        if (count > 5) { issues.push(`ERROR: ${reqId}: ${count} tokens enumerated`); break; }
      }
    }
  }
  return issues;
}

const specFiles = fs.readdirSync(SPEC_DIR).filter(f => f.endsWith(".md"));
specFiles.sort();

for (const file of specFiles) {
  const text = readFile(file);
  const reqs = extractReqBodiesWithSentences(text);
  const issues = checkReqShapeLocal(reqs);
  if (issues.length > 0) {
    console.log(`${file}:`);
    for (const issue of issues) console.log(`  ${issue}`);
  }
}

const allText = specFiles.map(f => readFile(f)).join("\n");
const allReqs = extractReqBodiesWithSentences(allText);
const allIssues = checkReqShapeLocal(allReqs);
const errors = allIssues.filter(i => i.startsWith("ERROR")).length;
console.log(`\nTotal: ${errors} shape error(s) across ${specFiles.length} spec files`);
if (errors > 0) process.exit(1);
else process.exit(0);
