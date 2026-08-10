import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SPEC_PATH = join(root, "holonovel.md");

const server = process.argv.includes("--server")
  ? process.argv[process.argv.indexOf("--server") + 1]
  : "dnd5e-holonovel";

if (server !== "dnd5e-holonovel" && server !== "holonovel") {
  console.error("Usage: npm run spec-delta -- --server holonovel|dnd5e-holonovel");
  process.exit(1);
}

const SERVER_DIR = join(root, server);
const DECISIONS_PATH = join(SERVER_DIR, "DECISIONS.md");

function sha256(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function grepInFile(filePath: string, pattern: RegExp): string | null {
  const match = readFileSync(filePath, "utf-8").match(pattern);
  return match ? (match[1] ?? null) : null;
}

interface DeltaReport {
  in_sync: boolean;
  current_hash: string;
  stored_hash: string | null;
  classification: "none" | "patch" | "minor" | "major";
  spec_modified: boolean;
  requirements_changed: { added: string[]; removed: string[]; modified: string[] };
  version_changed: { from: string | null; to: string };
  sections_changed: string[];
  raw_diff_lines: number;
}

const report: DeltaReport = {
  in_sync: true,
  current_hash: sha256(SPEC_PATH),
  stored_hash: null,
  classification: "none",
  spec_modified: false,
  requirements_changed: { added: [], removed: [], modified: [] },
  version_changed: { from: null, to: "" },
  sections_changed: [],
  raw_diff_lines: 0,
};

const decisions = readFileSync(DECISIONS_PATH, "utf-8");
report.stored_hash = grepInFile(DECISIONS_PATH, /\*\*Spec hash:\*\*\s*([a-f0-9]+)/m);

const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
report.version_changed.to = rootPkg.version;

report.in_sync = report.current_hash === report.stored_hash;

if (!report.in_sync) {
  report.spec_modified = true;

  let specModified = false;
  try {
    const diff = execSync(
      `git diff $(cat .git/refs/heads/main 2>/dev/null || echo HEAD) -- holonovel.md 2>/dev/null || git diff HEAD -- holonovel.md`,
      { cwd: root, encoding: "utf-8" }
    );
    if (diff.trim()) {
      specModified = true;
      report.raw_diff_lines = diff.split("\n").length;
    }
  } catch { /* not a git repo or no diff */ }

  if (!specModified) {
    try {
      const staged = execSync(
        `git diff --cached -- holonovel.md`,
        { cwd: root, encoding: "utf-8" }
      );
      if (staged.trim()) {
        specModified = true;
        report.raw_diff_lines = staged.split("\n").length;
      }
    } catch { /* no staged changes */ }
  }

  const currentSpec = readFileSync(SPEC_PATH, "utf-8");

  const currentReqs = [...currentSpec.matchAll(/\*\*REQ-(\d+)/g)].map(m => m[1]);
  const currentSections = [...currentSpec.matchAll(/^##\s+(.+)/gm)].map(m => m[1].split(" ")[0]);

  if (report.stored_hash) {
    try {
      const storedSpec = execSync(
        `git show $(git rev-list -n 1 HEAD -- holonovel.md) -- holonovel.md 2>/dev/null`,
        { cwd: root, encoding: "utf-8", timeout: 10000 }
      );
      if (storedSpec.trim()) {
        const storedReqs = [...storedSpec.matchAll(/\*\*REQ-(\d+)/g)].map(m => m[1]);
        const storedSections = [...storedSpec.matchAll(/^##\s+(.+)/gm)].map(m => m[1].split(" ")[0]);

        report.requirements_changed.added = currentReqs.filter(r => !storedReqs.includes(r));
        report.requirements_changed.removed = storedReqs.filter(r => !currentReqs.includes(r));
        report.requirements_changed.modified = [];
        report.sections_changed = currentSections.filter(s => !storedSections.includes(s));
      }
    } catch { /* fallback to simple comparison */ }
  }

  const hasNewReqs = report.requirements_changed.added.length > 0;
  const hasRemovedReqs = report.requirements_changed.removed.length > 0;
  const hasNewSections = report.sections_changed.length > 0;

  const reqBodyChanges = hasNewReqs || hasRemovedReqs;

  const stateModelReqs = [
    "030", "031", "032", "040", "041", "042", "043", "044",
    "055", "065", "074", "075", "076", "077", "083", "088",
    "092", "093",
  ];
  const toolSurfaceReqs = [
    "020", "021", "022", "023", "024", "025", "042", "056",
    "057", "058", "060", "061", "066", "067", "073", "079",
    "081", "082", "084", "086", "087", "089", "090", "091",
    "098", "104",
  ];

  const changedIds = [
    ...report.requirements_changed.added,
    ...report.requirements_changed.removed,
  ];

  const stateModelChanged = changedIds.some(id => stateModelReqs.includes(id));
  const toolSurfaceChanged = changedIds.some(id => toolSurfaceReqs.includes(id));
  const hasMajorTrigger = hasNewSections || stateModelChanged || toolSurfaceChanged;

  if (!reqBodyChanges && !hasNewSections) {
    report.classification = "patch";
  } else if (!hasMajorTrigger) {
    report.classification = "minor";
  } else {
    report.classification = "major";
  }
}

console.log(JSON.stringify(report, null, 2));

if (!report.in_sync) {
  console.error(`\nSpec delta detected: ${report.classification.toUpperCase()}`);
  process.exit(1);
} else {
  console.error("\nServer in sync with spec.");
  process.exit(0);
}
