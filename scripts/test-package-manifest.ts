#!/usr/bin/env npx tsx
/**
 * test-package-manifest.ts — self-tests for the manifest gate. [gate]
 *
 * Guards `scripts/lib/package-manifest.ts` against regression: a conformant
 * fixture passes, and each guarded field fails when removed or weakened
 * (REQ-614/T732).
 *
 * Usage: npx tsx scripts/test-package-manifest.ts [--help]
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 */
import { strict as assert } from "node:assert";
import { handleHelp } from "./lib/args.js";
import { checkManifest } from "./lib/package-manifest.js";

const USAGE = "Usage: npx tsx scripts/test-package-manifest.ts [--help]\n";
handleHelp(process.argv, USAGE);

function baseFixture(): Record<string, unknown> {
  return {
    name: "holonovel",
    version: "2026.10.25",
    description: "test",
    license: "MIT",
    type: "module",
    main: "./dist/index.js",
    types: "./dist/library.d.ts",
    repository: { url: "git+https://example.test/repo.git" },
    homepage: "https://example.test",
    bugs: { url: "https://example.test/issues" },
    author: { name: "Holonovel" },
    keywords: ["mcp", "ttrpg", "world-model", "fate", "ironsworn"],
    exports: {
      ".": { types: "./dist/library.d.ts", default: "./dist/library.js" },
      "./server": { types: "./dist/index.d.ts", default: "./dist/index.js" },
      "./core": { types: "./dist/core/index.d.ts", default: "./dist/core/index.js" },
      "./world": { types: "./dist/world/index.d.ts", default: "./dist/world/index.js" },
      "./package.json": "./package.json",
    },
    files: [
      "dist",
      "src",
      "bin",
      "content/torre-nosferatu.json",
      "holonovel.md",
      "tool-surface-registry.json",
      "tool-disambiguation.json",
    ],
    dependencies: { "@modelcontextprotocol/sdk": "1.32.2", zod: "4.6.7" },
    engines: { node: ">=22" },
    scripts: { prepack: "npm run clean && npm run build" },
    publishConfig: { access: "public", provenance: true },
    bin: { holonovel: "bin/holonovel.js" },
  };
}

function mutate(mutator: (pkg: Record<string, unknown>) => void): Record<string, unknown> {
  const pkg = baseFixture();
  mutator(pkg);
  return pkg;
}

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

function expectFailure(pkg: Record<string, unknown>, code: string): void {
  const report = checkManifest(pkg);
  assert.equal(report.ok, false, "expected the manifest to fail");
  assert.ok(report.issues.some((item) => item.code === code), `expected issue ${code}, got ${report.issues.map((i) => i.code).join(", ")}`);
}

test("conformant fixture passes", () => {
  const report = checkManifest(baseFixture());
  assert.deepEqual(report.issues, []);
  assert.equal(report.ok, true);
});

test("missing spec copy fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.files = (pkg.files as string[]).filter((file) => file !== "holonovel.md");
  }), "files:missing:holonovel.md");
});

test("build-only source artifact fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.files = [...(pkg.files as string[]), "content/torre-nosferatu.source.json"];
  }), "files:forbidden:content/torre-nosferatu.source.json");
});

test("unpinned dependency fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.dependencies = { zod: "^4.6.7" };
  }), "dependency:zod");
});

test("missing export types condition fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.exports = { ...(pkg.exports as Record<string, unknown>), "./core": { default: "./dist/core/index.js" } };
  }), "export:./core");
});

test("Node 24-only engine fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.engines = { node: ">=24" };
  }), "engines:node");
});

test("prepublishOnly fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.scripts = { ...(pkg.scripts as Record<string, string>), prepublishOnly: "npm run build" };
  }), "scripts:prepublishOnly");
});

test("install lifecycle script fails", () => {
  expectFailure(mutate((pkg) => {
    pkg.scripts = { ...(pkg.scripts as Record<string, string>), postinstall: "node setup.js" };
  }), "scripts:postinstall");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
