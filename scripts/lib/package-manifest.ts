// Pure manifest assertions for the published holonovel package (REQ-614/T732).
// No filesystem access: the caller supplies the parsed package.json so the
// checks can be unit-tested against fixtures.

export interface ManifestIssue {
  code: string;
  message: string;
}

export interface ManifestReport {
  ok: boolean;
  issues: ManifestIssue[];
}

export const REQUIRED_FILES = [
  "dist",
  "src",
  "bin",
  "content/torre-nosferatu.json",
  "holonovel.md",
  "tool-surface-registry.json",
  "tool-disambiguation.json",
] as const;

export const FORBIDDEN_FILES = [
  "content/torre-nosferatu.source.json",
  "tool-definitions.json",
  "tool-routing.json",
  "testdata",
  "scripts",
] as const;

const EXPORT_ENTRIES = [".", "./server", "./core", "./world"] as const;
const LIFECYCLE_SCRIPTS = ["preinstall", "install", "postinstall"] as const;

function issue(code: string, message: string): ManifestIssue {
  return { code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function checkManifest(pkg: unknown): ManifestReport {
  const issues: ManifestIssue[] = [];
  if (!isRecord(pkg)) return { ok: false, issues: [issue("shape", "package.json must be an object")] };

  for (const field of ["name", "version", "description", "license"]) {
    if (typeof pkg[field] !== "string" || (pkg[field] as string).trim() === "") {
      issues.push(issue(`field:${field}`, `${field} must be a non-empty string`));
    }
  }
  if (pkg.type !== "module") issues.push(issue("field:type", "type must be \"module\""));
  if (pkg.private === true) issues.push(issue("field:private", "the server package must not be private"));
  if (typeof pkg.main !== "string" || !pkg.main.trim()) issues.push(issue("field:main", "main is required"));
  if (typeof pkg.types !== "string" || !pkg.types.trim()) issues.push(issue("field:types", "top-level types is required"));

  if (!isRecord(pkg.repository) || typeof pkg.repository.url !== "string") {
    issues.push(issue("field:repository", "repository.url is required"));
  }
  if (!isRecord(pkg.bugs) || typeof pkg.bugs.url !== "string") {
    issues.push(issue("field:bugs", "bugs.url is required"));
  }
  if (typeof pkg.homepage !== "string" || !pkg.homepage.trim()) {
    issues.push(issue("field:homepage", "homepage is required"));
  }
  if (!isRecord(pkg.author) || typeof pkg.author.name !== "string") {
    issues.push(issue("field:author", "author must be an object with a name"));
  }
  if (!Array.isArray(pkg.keywords) || pkg.keywords.length < 5) {
    issues.push(issue("field:keywords", "at least five keywords are required"));
  }

  if (!isRecord(pkg.exports)) {
    issues.push(issue("field:exports", "exports must be an object"));
  } else {
    for (const entry of EXPORT_ENTRIES) {
      const target = pkg.exports[entry];
      if (!isRecord(target) || typeof target.types !== "string" || typeof target.default !== "string") {
        issues.push(issue(`export:${entry}`, `${entry} must declare types and default conditions`));
      }
    }
    if (pkg.exports["./package.json"] !== "./package.json") {
      issues.push(issue("export:package-json", "./package.json export is required"));
    }
  }

  const files = Array.isArray(pkg.files) ? pkg.files.filter((f): f is string => typeof f === "string") : [];
  if (files.length === 0) issues.push(issue("field:files", "files allowlist is required"));
  for (const required of REQUIRED_FILES) {
    if (!files.includes(required)) issues.push(issue(`files:missing:${required}`, `files must include ${required}`));
  }
  for (const forbidden of FORBIDDEN_FILES) {
    if (files.includes(forbidden)) issues.push(issue(`files:forbidden:${forbidden}`, `files must not include ${forbidden}`));
  }
  if (files.includes("content")) {
    issues.push(issue("files:broad-content", "list the starter artifact, not the whole content directory"));
  }

  if (!isRecord(pkg.dependencies)) {
    issues.push(issue("field:dependencies", "dependencies must be an object"));
  } else {
    for (const [name, range] of Object.entries(pkg.dependencies)) {
      if (typeof range !== "string" || /^[~^]/.test(range) || range.includes("*")) {
        issues.push(issue(`dependency:${name}`, `${name} must be pinned to an exact version (got ${String(range)})`));
      }
    }
  }

  if (!isRecord(pkg.engines) || typeof pkg.engines.node !== "string") {
    issues.push(issue("field:engines", "engines.node is required"));
  } else {
    const match = /^>=\s*(\d+)/.exec(pkg.engines.node);
    if (!match || Number(match[1]) > 22) {
      issues.push(issue("engines:node", `engines.node must allow Node 22+ (got ${pkg.engines.node})`));
    }
  }

  if (!isRecord(pkg.scripts)) {
    issues.push(issue("field:scripts", "scripts must be an object"));
  } else {
    if (typeof pkg.scripts.prepack !== "string") issues.push(issue("scripts:prepack", "prepack is required"));
    if (typeof pkg.scripts.prepublishOnly === "string") issues.push(issue("scripts:prepublishOnly", "prepublishOnly is not used; prepack covers pack and publish"));
    for (const lifecycle of LIFECYCLE_SCRIPTS) {
      if (typeof pkg.scripts[lifecycle] === "string") {
        issues.push(issue(`scripts:${lifecycle}`, `${lifecycle} install scripts are not allowed`));
      }
    }
  }

  if (!isRecord(pkg.publishConfig) || pkg.publishConfig.access !== "public" || pkg.publishConfig.provenance !== true) {
    issues.push(issue("field:publishConfig", "publishConfig must set access=public and provenance=true"));
  }

  if (!isRecord(pkg.bin) || typeof pkg.bin.holonovel !== "string") {
    issues.push(issue("field:bin", "bin.holonovel is required"));
  }

  return { ok: issues.length === 0, issues };
}
