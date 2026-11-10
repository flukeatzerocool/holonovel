#!/usr/bin/env npx tsx
/**
 * check-container-image.ts — container image gate (REQ-428). [gate]
 *
 * Builds `holonovel/Dockerfile` and starts the host with `help`, proving the
 * image boots the server from compiled output. Docker is an optional local
 * prerequisite: when it is absent the gate prints a notice and exits 0 (the CI
 * `container` job runs it unconditionally). Full-tier only — the build is too
 * slow for `check:fast`.
 *
 * Usage: npx tsx scripts/check-container-image.ts [--help]
 * Exit codes: 0 = image built and started (or docker absent), 1 = build/start
 *             failure, 2 = fatal.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const USAGE = `check-container-image.ts — build the container image and start the host.

Usage: npx tsx scripts/check-container-image.ts
Exit codes: 0 = valid (or docker absent), 1 = failure, 2 = fatal.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}
const unknown = process.argv.slice(2);
if (unknown.length > 0) {
  console.error(`unknown argument: ${unknown[0]}\n\n${USAGE}`);
  process.exit(1);
}

const root = join(import.meta.dirname, "..");
const context = join(root, "holonovel");
const tag = `holonovel-gate:${process.pid}`;

function docker(args: string[], timeout: number): ReturnType<typeof spawnSync> {
  return spawnSync("docker", args, { cwd: root, encoding: "utf-8", timeout });
}

const probe = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], { encoding: "utf-8" });
if (probe.status !== 0) {
  console.log(
    "check-container-image: docker daemon not reachable — skipping (CI runs this gate unconditionally)",
  );
  process.exit(0);
}

const build = docker(["build", "-q", "-t", tag, context], 15 * 60 * 1000);
if (build.status !== 0) {
  console.error("check-container-image: docker build failed");
  console.error((build.stderr ?? "").slice(-2000));
  process.exit(1);
}

const run = docker(["run", "--rm", tag, "help"], 60 * 1000);
const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
if (run.status !== 0 || !output.includes("Usage: holonovel")) {
  console.error("check-container-image: the image did not start the host");
  console.error(output.slice(-2000));
  docker(["image", "rm", "-f", tag], 30 * 1000);
  process.exit(1);
}

docker(["image", "rm", "-f", tag], 30 * 1000);
console.log("check-container-image: image built and the host started");
