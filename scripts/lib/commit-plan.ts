// commit-plan.ts — pure planner for the session commit series.
//
// Purpose: a spec increment stays one commit; every other session is split by
// concern. The planner owns the bucket order and the subject line; the driver
// (scripts/session-close.ts) owns staging, typechecking each tree, and the
// final hash assertion.
//
// No exit codes: library module.

export type BucketKey = "pipeline" | "server" | "config" | "misc" | "docs";

export interface CommitEntry {
  key: BucketKey | "increment";
  subject: string;
  paths: string[];
}

export interface CommitPlan {
  mode: "single" | "split";
  entries: CommitEntry[];
}

const BUCKET_ORDER: BucketKey[] = ["pipeline", "server", "config", "misc", "docs"];

const BUCKET_LABELS: Record<BucketKey, string> = {
  pipeline: "pipeline",
  server: "server",
  config: "config",
  misc: "misc",
  docs: "docs",
};

const SUBJECT_LIMIT = 120;

/** A spec increment is atomic: every layer of one increment is one commit. */
export function isSpecIncrement(paths: string[]): boolean {
  return paths.some(
    (path) =>
      path.startsWith("spec/") || path === "holonovel.md" || path === "holonovel/holonovel.md",
  );
}

export function classifyPath(path: string): BucketKey {
  if (path.startsWith("scripts/") || path.startsWith(".githooks/") || path.startsWith(".github/")) {
    return "pipeline";
  }
  if (path === "package.json") return "pipeline";
  if (
    path.startsWith("holonovel/src/") ||
    path.startsWith("holonovel/scripts/") ||
    path.startsWith("holonovel/bin/") ||
    path.startsWith("holonovel/content/") ||
    path.startsWith("holonovel/narrative_world_model/") ||
    path === "holonovel/tool-definitions.json" ||
    path === "holonovel/server.json"
  ) {
    return "server";
  }
  if (
    path === "package-lock.json" ||
    path === "tsconfig.json" ||
    path === ".markdownlint.json" ||
    path === ".gitignore" ||
    path === "holonovel/package.json" ||
    path === "holonovel/package-lock.json" ||
    path.startsWith("holonovel/tsconfig")
  ) {
    return "config";
  }
  if (
    path === "README.md" ||
    path === "CHANGELOG.md" ||
    path === "AGENTS.md" ||
    path === "ROADMAP.md" ||
    path === "holonovel/DECISIONS.md" ||
    path === "holonovel/AGENTS.md" ||
    path.startsWith("docs/")
  ) {
    return "docs";
  }
  return "misc";
}

/** Trim, strip a trailing period, and cap a subject at the hook's limit. */
export function normalizeSubject(raw: string): string {
  let subject = raw.trim().replace(/\.+$/, "");
  if (subject.length > SUBJECT_LIMIT) {
    subject = `${subject.slice(0, SUBJECT_LIMIT - 1).trimEnd()}…`;
  }
  return subject;
}

function compose(date: string, title: string, suffix: string): string {
  const titleText = title.trim().replace(/\.+$/, "");
  return normalizeSubject(`${date} — ${titleText}${suffix}`);
}

/**
 * Build the commit series. `paths` are repo-relative changed paths.
 * A spec increment yields one `increment` entry; otherwise one entry per
 * non-empty bucket in `pipeline → server → config → misc → docs` order, with
 * the last entry carrying the plain session subject.
 */
export function planCommits(paths: string[], date: string, title: string): CommitPlan {
  const unique = [...new Set(paths)].sort();
  if (unique.length === 0) return { mode: "split", entries: [] };

  if (isSpecIncrement(unique)) {
    return {
      mode: "single",
      entries: [{ key: "increment", subject: compose(date, title, ""), paths: unique }],
    };
  }

  const buckets = new Map<BucketKey, string[]>();
  for (const path of unique) {
    const key = classifyPath(path);
    const bucket = buckets.get(key) ?? [];
    bucket.push(path);
    buckets.set(key, bucket);
  }

  const ordered = BUCKET_ORDER.filter((key) => (buckets.get(key) ?? []).length > 0);
  const entries: CommitEntry[] = ordered.map((key, index) => ({
    key,
    // The last entry is the release-note commit and carries the plain title.
    subject:
      index === ordered.length - 1
        ? compose(date, title, "")
        : compose(date, title, `: ${BUCKET_LABELS[key]}`),
    paths: buckets.get(key) ?? [],
  }));

  return { mode: "split", entries };
}
