#!/usr/bin/env npx tsx
/**
 * steps.ts — the publication pipeline as an ordered step registry. [build tool]
 *
 * Exit codes: n/a (module imported by scripts/publish/run.ts; the caller owns
 * the process exit code).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeGateRun } from "../lib/gate-run-manifest.js";
import { runPreflight } from "./preflight.js";

export type Stage = "repo" | "tag" | "release" | "docs" | "deploy";
export type Status = "pass" | "skip" | "fail";

export interface Flags {
  dryRun: boolean;
  yes: boolean;
  noPush: boolean;
  allowPending: boolean;
  allowUntracked: boolean;
  allowMissingDeploy: boolean;
  allowStaleBase: boolean;
  fullTests: boolean;
  autoUpdate: boolean;
}

export interface Ctx {
  root: string;
  // Hermetic harness mode: heavy steps (build, gates, delta, update, record,
  // deploy verification) are stubbed so the control flow can be exercised
  // without the project toolchain. Never set in production.
  stub: boolean;
  servers: string[];
  flags: Flags;
  deployDir: string;
  state: {
    specHash?: string;
    delta: Record<string, string>;
    base: string;
    checkRan: boolean;
    contractChanged: boolean;
    needTests: boolean;
    suite: "fast" | "full";
    verification: string;
    tagToPush?: string;
    didCommit: boolean;
    didTag: boolean;
    didPush: boolean;
    didMirror: boolean;
    didWiki: boolean;
    didWikiMirror: boolean;
    didDeploy: boolean;
    registry?: { pid: number; log: string };
  };
  log(message: string): void;
}

export interface Step {
  id: string;
  stage: Stage;
  // A non-optional step fails the run; an optional one records `fail` and
  // continues (the deploy gate still decides publication).
  optional?: boolean;
  run(ctx: Ctx): Status;
}

function sh(ctx: Ctx, command: string, args: string[], cwd = ctx.root, env?: NodeJS.ProcessEnv): number {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
  return result.status ?? 1;
}

function out(ctx: Ctx, command: string, args: string[], cwd = ctx.root, env?: NodeJS.ProcessEnv): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    env: env ? { ...process.env, ...env } : process.env,
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr ?? "").trim()}`);
  }
  return (result.stdout ?? "").trim();
}

function git(ctx: Ctx, args: string[], cwd = ctx.root): string {
  return out(ctx, "git", args, cwd);
}

function tryGit(ctx: Ctx, args: string[], cwd = ctx.root): string | null {
  try {
    return git(ctx, args, cwd);
  } catch {
    return null;
  }
}

function must(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function classifyDelta(ctx: Ctx, server: string): string {
  const dir = mkdtempSync(join(tmpdir(), "holonovel-delta-"));
  try {
    const result = spawnSync(
      "npx",
      ["tsx", "scripts/spec-delta.ts", "--server", server, "--base", ctx.state.base, "--report-only"],
      { cwd: ctx.root, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if ((result.status ?? 1) !== 0) {
      throw new Error(`spec-delta failed for ${server}: ${(result.stderr ?? "").trim()}`);
    }
    const start = result.stdout.indexOf("{");
    const end = result.stdout.lastIndexOf("}");
    const parsed = JSON.parse(result.stdout.slice(start, end + 1)) as { classification?: string };
    const classification = parsed.classification;
    if (!classification || !["none", "patch", "editorial", "minor", "major"].includes(classification)) {
      throw new Error(`invalid delta classification: ${classification}`);
    }
    return classification === "none" ? "patch" : classification;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Temp dir cleanup is best-effort; a leftover under the OS temp root is
      // harmless and must not mask the classification result.
    }
  }
}

function serverPaths(ctx: Ctx): string[] {
  const paths: string[] = [];
  for (const server of ctx.servers) {
    paths.push(
      `${server}/src`,
      `${server}/scripts`,
      `${server}/content`,
      `${server}/bin`,
      `${server}/package.json`,
      `${server}/package-lock.json`,
      `${server}/tool-definitions.json`,
      `${server}/server.json`,
      `${server}/tsconfig.json`,
      `${server}/tsconfig.build.json`,
      `${server}/narrative_world_model`,
    );
  }
  return paths;
}

export const STEPS: Step[] = [
  {
    id: "preflight",
    stage: "repo",
    run(ctx) {
      const result = runPreflight({
        root: ctx.root,
        deployDir: ctx.deployDir,
        noPush: ctx.flags.noPush,
        yes: ctx.flags.yes,
        allowUntracked: ctx.flags.allowUntracked,
        allowMissingDeploy: ctx.flags.allowMissingDeploy,
      });
      for (const warning of result.warnings) ctx.log(`  WARNING: ${warning}`);
      for (const problem of result.problems) ctx.log(`  BLOCKED: ${problem}`);
      must(result.problems.length === 0, "preflight failed — nothing was changed");
      return "pass";
    },
  },
  {
    id: "build",
    stage: "repo",
    run(ctx) {
      if (ctx.stub) {
        ctx.log("  [stub] build-order skipped");
        ctx.state.checkRan = true;
        return "pass";
      }
      const status = sh(ctx, "npm", ["run", "build-order"], ctx.root, { HOLONOVEL_IMPL_STRICT: "1" });
      must(status === 0, "build order failed");
      ctx.state.contractChanged =
        (tryGit(ctx, ["diff", "--name-only", "--", "holonovel/src/generated/contract-fingerprints.ts"]) ?? "") !== "";
      const runFile = join(ctx.root, ".holonovel-state", "build-order-run.json");
      if (existsSync(runFile)) {
        try {
          const record = JSON.parse(readFileSync(runFile, "utf-8")) as { check_ran?: boolean };
          ctx.state.checkRan = record.check_ran === true;
        } catch {
          // A corrupt run record means "the full check did not verifiably run",
          // so the fast suite runs instead — the safe direction.
          ctx.state.checkRan = false;
        }
      }
      return "pass";
    },
  },
  {
    id: "gates",
    stage: "repo",
    run(ctx) {
      ctx.state.suite = ctx.state.checkRan ? "full" : "fast";
      if (ctx.stub) {
        ctx.log("  [stub] gate suite skipped");
        return "pass";
      }
      if (ctx.state.checkRan) {
        ctx.log("  gate evidence: the full check suite ran in build-order");
      } else {
        ctx.log("  running fast gates: build-order skipped its check pass");
        must(sh(ctx, "npm", ["run", "check:fast"], ctx.root) === 0, "fast gate suite failed");
        spawnSync("npx", ["tsx", "scripts/compare-spec-code.ts", "--dedicated"], {
          cwd: ctx.root,
          stdio: "inherit",
        });
      }
      return "pass";
    },
  },
  {
    id: "delta",
    stage: "repo",
    run(ctx) {
      const fetched = sh(ctx, "git", ["fetch", "origin", "main", "--quiet"]);
      if (fetched !== 0) {
        must(
          ctx.flags.noPush || ctx.flags.allowStaleBase,
          "origin fetch failed — refusing to classify against a stale base (use --allow-stale-base or --no-push)",
        );
        ctx.log("  origin fetch failed — continuing with a possibly stale base");
      }
      if (ctx.stub) {
        ctx.state.base = "HEAD";
        ctx.state.specHash = "stub";
        for (const server of ctx.servers) ctx.state.delta[server] = "patch";
        ctx.log("  [stub] delta classification skipped (patch)");
        return "pass";
      }
      ctx.state.base = tryGit(ctx, ["rev-parse", "--verify", "--quiet", "origin/main"]) ? "origin/main" : "HEAD";
      ctx.log(`  delta base: ${ctx.state.base}`);
      ctx.state.specHash = out(ctx, "npx", ["tsx", "scripts/spec-hash.ts"]);
      for (const server of ctx.servers) {
        ctx.state.delta[server] = classifyDelta(ctx, server);
        ctx.log(`  ${server}: delta class = ${ctx.state.delta[server]}`);
      }
      return "pass";
    },
  },
  {
    id: "update",
    stage: "repo",
    run(ctx) {
      if (ctx.stub) {
        ctx.log("  [stub] pending-update gate skipped");
        return "pass";
      }
      const env: NodeJS.ProcessEnv = ctx.flags.autoUpdate ? { HOLONOVEL_INVOKE_UPDATE: "1" } : {};
      for (const server of ctx.servers) {
        const args = [
          "tsx",
          "scripts/update-server.ts",
          "--server",
          server,
          "--spec-hash",
          ctx.state.specHash ?? "",
          "--scope-by-fingerprint",
          "--delta-class",
          ctx.state.delta[server],
        ];
        if (ctx.flags.allowPending) args.push("--allow-pending");
        const status = sh(ctx, "npx", args, ctx.root, env);
        must(
          status === 0,
          `pending update for ${server}: the implementation has not been updated to match the spec (REQ-394)`,
        );
      }
      return "pass";
    },
  },
  {
    id: "harness",
    stage: "repo",
    run(ctx) {
      if (ctx.stub) {
        ctx.log("  [stub] server harness skipped");
        return "skip";
      }
      const paths = serverPaths(ctx);
      const serverChanged =
        (tryGit(ctx, ["diff", "--name-only", ctx.state.base, "--", ...paths]) ?? "") !== "" ||
        (tryGit(ctx, ["ls-files", "--others", "--exclude-standard", "--", ...paths]) ?? "") !== "";
      ctx.state.needTests =
        ctx.flags.fullTests ||
        ctx.state.contractChanged ||
        serverChanged ||
        ctx.servers.some((server) => ["minor", "major"].includes(ctx.state.delta[server]));
      if (!ctx.state.needTests) {
        ctx.log("  skipped: patch/editorial delta, no contract or server-source change (§6.7 G0-only)");
        return "skip";
      }
      must(sh(ctx, "npm", ["run", "test:all"], join(ctx.root, "holonovel")) === 0, "server harness suite failed");
      return "pass";
    },
  },
  {
    id: "record",
    stage: "repo",
    run(ctx) {
      if (ctx.stub) {
        ctx.log("  [stub] spec-update record skipped");
        return "pass";
      }
      const harness = ctx.state.needTests ? "ran" : "skipped (§6.7 G0)";
      ctx.state.verification =
        `Gates: ${ctx.state.suite} check suite passed; server harness suite ${harness}; ` +
        `spec SHA ${ctx.state.specHash}; deploy verification is the deploy stage (REQ-418).`;
      must(
        sh(ctx, "npx", ["tsx", "scripts/spec-update-record.ts", "--verification", ctx.state.verification]) === 0,
        "Spec Update record generation failed",
      );
      for (const server of ctx.servers) {
        const decisions = join(ctx.root, server, "DECISIONS.md");
        if (!existsSync(decisions)) continue;
        const text = readFileSync(decisions, "utf-8");
        if (!/\*\*Spec hash:\*\*/.test(text)) {
          ctx.log(`  WARNING: ${server}/DECISIONS.md has no '**Spec hash:**' line`);
          continue;
        }
        const updated = text.replace(/\*\*Spec hash:\*\*\s*[a-f0-9]+/, `**Spec hash:** ${ctx.state.specHash}`);
        writeFileSyncSafe(decisions, updated);
        ctx.log(`  updated spec hash in ${server}/DECISIONS.md`);
      }
      must(sh(ctx, "npx", ["tsx", "scripts/spec-update-record.ts", "--check"]) === 0, "Spec Update narrative missing or unverified");
      return "pass";
    },
  },
  {
    id: "stage",
    stage: "repo",
    run(ctx) {
      must(sh(ctx, "git", ["add", "-A", "--", "."]) === 0, "git add failed");
      spawnSync("git", ["reset", "-q", "--", ".holonovel-state/wiki"], { cwd: ctx.root, stdio: "inherit" });
      sh(ctx, "git", ["diff", "--cached", "--stat"]);
      return "pass";
    },
  },
  {
    id: "commit",
    stage: "repo",
    run(ctx) {
      // `git diff --staged --quiet` exits 1 when changes are staged.
      const hasStaged = tryGit(ctx, ["diff", "--staged", "--quiet"]) === null;
      if (!hasStaged) {
        ctx.log("  nothing new to commit");
        return "skip";
      }
      const changelog = readFileSync(join(ctx.root, "CHANGELOG.md"), "utf-8");
      const match = changelog.match(/^## \d{4}-\d{2}-\d{2} — .+(?:\n(?!## ).*)*/m);
      must(match !== null, "no dated CHANGELOG entry found for the commit message");
      // The heading is the source of truth, but the `## ` marker is Markdown,
      // not part of the subject. Stripping it here is what ends the two-form
      // drift (502 commits without the marker, 73 with).
      const lines = match![0].trim().split("\n");
      const subject = lines[0].replace(/^## /, "");
      const body = lines.slice(1).join("\n").trim();
      const message = body ? `${subject}\n\n${body}\n` : `${subject}\n`;
      const status = spawnSync("git", ["commit", "-F", "-"], {
        cwd: ctx.root,
        input: message,
        encoding: "utf-8",
        stdio: ["pipe", "inherit", "inherit"],
      }).status;
      must(status === 0, "git commit failed");
      ctx.state.didCommit = true;
      // Record the pass against the committed tree so pre-push can trust it.
      writeGateRun(ctx.state.suite, new Date().toISOString(), new Date().toISOString(), "pass", true);
      return "pass";
    },
  },
  {
    id: "tag",
    stage: "tag",
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      const version = JSON.parse(readFileSync(join(ctx.root, "package.json"), "utf-8")).version as string;
      const tag = `v${version}`;
      const remoteTag = tryGit(ctx, ["ls-remote", "--tags", "origin", `refs/tags/${tag}`]) ?? "";
      if (remoteTag.includes(`refs/tags/${tag}`)) {
        ctx.log(`  tag ${tag} already on remote — leaving it pinned`);
        return "skip";
      }
      const localTag = tryGit(ctx, ["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
      if (localTag) {
        must(localTag === git(ctx, ["rev-parse", "HEAD"]), `local tag ${tag} points elsewhere — refusing to retarget`);
      } else {
        must(sh(ctx, "git", ["tag", tag]) === 0, `git tag ${tag} failed`);
      }
      ctx.state.tagToPush = tag;
      ctx.state.didTag = true;
      return "pass";
    },
  },
  {
    id: "push_repo",
    stage: "release",
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      const pending = Number(out(ctx, "git", ["rev-list", "--count", "origin/main..main"]));
      if (pending === 0) {
        ctx.log("  nothing to push — origin is up to date");
        return "skip";
      }
      const refs = ["main"];
      if (ctx.state.tagToPush) refs.push(ctx.state.tagToPush);
      must(sh(ctx, "git", ["push", "--atomic", "origin", ...refs]) === 0, "push failed — aborting deploy");
      ctx.state.didPush = true;
      return "pass";
    },
  },
  {
    id: "mirror",
    stage: "release",
    optional: true,
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      const remote = tryGit(ctx, ["config", "--get", "remote.github.url"]);
      if (!remote) {
        ctx.log("  no 'github' remote configured — skipping mirror");
        return "skip";
      }
      const refs = ["main"];
      if (ctx.state.tagToPush) refs.push(ctx.state.tagToPush);
      const status = sh(ctx, "git", ["push", "--atomic", "github", ...refs]);
      if (status !== 0) {
        ctx.log("  WARNING: mirror push failed — GitHub mirror is behind origin");
        return "fail";
      }
      ctx.state.didMirror = true;
      return "pass";
    },
  },
  {
    id: "registry",
    stage: "release",
    optional: true,
    run(ctx) {
      if (!ctx.state.didMirror) {
        ctx.log("  skipped: no mirror push this run");
        return "skip";
      }
      const status = sh(ctx, "npx", ["tsx", "scripts/check-registry-publish.ts", "--wait", "900"]);
      if (status !== 0) {
        ctx.log("  WARNING: MCP Registry does not list the published version yet (REQ-428, advisory)");
        return "fail";
      }
      return "pass";
    },
  },
  {
    id: "wiki",
    stage: "docs",
    optional: true,
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      const wiki = join(ctx.root, ".holonovel-state", "wiki");
      if (!existsSync(join(wiki, ".git"))) {
        ctx.log("  wiki clone not found — skipping");
        return "skip";
      }
      if (sh(ctx, "git", ["add", "-A"], wiki) !== 0) {
        ctx.log("  WARNING: wiki staging failed — continuing to deploy");
        return "fail";
      }
      if (tryGit(ctx, ["diff", "--staged", "--quiet"], wiki) !== null) {
        ctx.log("  no wiki changes");
        return "skip";
      }
      const date = new Date().toISOString().slice(0, 10);
      if (sh(ctx, "git", ["commit", "-m", `Wiki refresh ${date}`], wiki) !== 0) {
        ctx.log("  WARNING: wiki commit failed — continuing to deploy");
        return "fail";
      }
      if (sh(ctx, "git", ["push", "--atomic", "origin", "main"], wiki) !== 0) {
        ctx.log("  WARNING: wiki push failed — continuing to deploy");
        return "fail";
      }
      ctx.state.didWiki = true;
      return "pass";
    },
  },
  {
    id: "wiki_mirror",
    stage: "docs",
    optional: true,
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      const wiki = join(ctx.root, ".holonovel-state", "wiki");
      if (!existsSync(join(wiki, ".git"))) return "skip";
      if (tryGit(ctx, ["remote", "get-url", "github"], wiki) === null) {
        ctx.log("  no 'github' remote in the wiki repo — skipping mirror");
        return "skip";
      }
      const master = tryGit(ctx, ["ls-remote", "github", "refs/heads/master"], wiki)?.split(/\s+/)[0] ?? "";
      const args = ["push", "--atomic", `--force-with-lease=master:${master}`, "github", "main:master"];
      if (sh(ctx, "git", args, wiki) !== 0) {
        ctx.log("  WARNING: wiki mirror push failed — GitHub wiki is behind");
        return "fail";
      }
      ctx.state.didWikiMirror = true;
      return "pass";
    },
  },
  {
    id: "deploy",
    stage: "deploy",
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      if (!existsSync(join(ctx.deployDir, ".git"))) {
        must(ctx.flags.allowMissingDeploy, `deploy clone not found at ${ctx.deployDir} (REQ-418)`);
        ctx.log(`  deploy clone not found at ${ctx.deployDir} — skipping (--allow-missing-deploy)`);
        return "skip";
      }
      const publishedHead = tryGit(ctx, ["rev-parse", "origin/main"]) ?? git(ctx, ["rev-parse", "HEAD"]);
      if ((tryGit(ctx, ["status", "--porcelain"], ctx.deployDir) ?? "") !== "") {
        ctx.log("  deploy tree has uncommitted changes — discarding before pull");
        sh(ctx, "git", ["checkout", "--", "."], ctx.deployDir);
        sh(ctx, "git", ["clean", "-fd"], ctx.deployDir);
      }
      const previous = tryGit(ctx, ["rev-parse", "HEAD"], ctx.deployDir) ?? "";
      must(sh(ctx, "git", ["pull", "--ff-only", "origin", "main"], ctx.deployDir) === 0, "deploy pull could not fast-forward");
      const current = tryGit(ctx, ["rev-parse", "HEAD"], ctx.deployDir) ?? "";
      must(current === publishedHead, "deployed HEAD does not match published origin/main (REQ-418)");
      if (previous !== current) {
        for (const server of ctx.servers) {
          const serverDir = join(ctx.deployDir, server);
          if (!existsSync(serverDir)) continue;
          const changed = tryGit(ctx, ["diff", "--name-only", previous, current, "--", server], ctx.deployDir) ?? "";
          if (previous === "" || changed.includes(`${server}/package-lock.json`)) {
            must(sh(ctx, "npm", ["ci", "--quiet", "--no-audit", "--no-fund"], serverDir) === 0, `${server}: dependency install failed`);
            if ((tryGit(ctx, ["status", "--porcelain", "--", "package-lock.json"], serverDir) ?? "") !== "") {
              ctx.log(`    ${server}: package-lock.json drifted during install — reverting`);
              sh(ctx, "git", ["checkout", "--", "package-lock.json"], serverDir);
            }
          }
          if (previous === "" || changed.includes(`${server}/src/`) || changed.includes(`${server}/tsconfig`)) {
            must(sh(ctx, "npm", ["run", "build", "--if-present"], serverDir) === 0, `${server}: build failed`);
          }
        }
      }
      return "pass";
    },
  },
  {
    id: "verify_deploy",
    stage: "deploy",
    run(ctx) {
      if (ctx.flags.noPush) return "skip";
      if (!existsSync(join(ctx.deployDir, ".git"))) return "skip";
      if (ctx.stub) {
        ctx.log("  [stub] deployed-tree verification skipped");
        ctx.state.didDeploy = true;
        return "pass";
      }
      for (const server of ctx.servers) {
        const status = sh(ctx, "npx", [
          "tsx",
          "scripts/update-server.ts",
          "--server",
          server,
          "--server-dir",
          join(ctx.deployDir, server),
          "--spec-hash",
          ctx.state.specHash ?? "",
          "--verify-deployed",
        ]);
        must(status === 0, `deploy verification failed for ${server} (REQ-418)`);
      }
      ctx.state.didDeploy = true;
      return "pass";
    },
  },
];

function writeFileSyncSafe(path: string, content: string): void {
  writeFileSync(path, content);
}
