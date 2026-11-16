#!/usr/bin/env npx tsx
/**
 * steps.ts — the publication pipeline as an ordered step registry. [build tool]
 *
 * Exit codes: n/a (module imported by scripts/publish/run.ts; the caller owns
 * the process exit code).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeGateRun } from "../lib/gate-run-manifest.js";
import { collectStagedGuards, classifyStatePaths, deployStateCandidates } from "../lib/publish-guards.js";
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
  allowSecrets: boolean;
}

// The changed-REQ set `spec-delta.ts` already emits (REQ-394a input). Carried
// through the pipeline so `update` can hand it to the derivation; a flat set
// cannot express `removed`.
export interface DeltaReport {
  requirements_changed: { added: string[]; removed: string[]; modified: string[] };
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
    deltaReport: Record<string, DeltaReport>;
    base: string;
    checkRan: boolean;
    suiteRan: boolean;
    contractChanged: boolean;
    needTests: boolean;
    harness: string;
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

function classifyDelta(ctx: Ctx, server: string): { classification: string; report: DeltaReport | null } {
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
    const parsed = JSON.parse(result.stdout.slice(start, end + 1)) as {
      classification?: string;
      baseline_missing?: boolean;
      requirements_changed?: Partial<DeltaReport["requirements_changed"]>;
    };
    // REQ-394 — `--report-only` keeps exit 0, so the explicit flag is the
    // enforcement point: a missing published baseline blocks publication.
    if (parsed.baseline_missing === true) {
      throw new Error(`spec-delta: no published baseline for ${server} (REQ-394)`);
    }
    const classification = parsed.classification;
    if (!classification || !["none", "patch", "editorial", "minor", "major"].includes(classification)) {
      throw new Error(`invalid delta classification: ${classification}`);
    }
    const changed = parsed.requirements_changed;
    const report: DeltaReport | null = changed
      ? {
          requirements_changed: {
            added: changed.added ?? [],
            removed: changed.removed ?? [],
            modified: changed.modified ?? [],
          },
        }
      : null;
    return { classification: classification === "none" ? "patch" : classification, report };
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Temp dir cleanup is best-effort; a leftover under the OS temp root is
      // harmless and must not mask the classification result.
    }
  }
}

// A bounded run (`--from`, `--only`, `--stage`) can reach a step before the
// step that normally computes its state. Recompute the value rather than
// passing an empty string: a silent empty hash is worse than a loud failure.
function ensureBase(ctx: Ctx): string {
  if (ctx.state.base !== "origin/main") return ctx.state.base;
  if (tryGit(ctx, ["rev-parse", "--verify", "--quiet", "origin/main"]) !== null) return ctx.state.base;
  ctx.state.base = "HEAD";
  return ctx.state.base;
}

function ensureSpecHash(ctx: Ctx): string {
  if (ctx.state.specHash) return ctx.state.specHash;
  if (ctx.stub) {
    ctx.state.specHash = "stub";
    return ctx.state.specHash;
  }
  ctx.state.specHash = out(ctx, "npx", ["tsx", "scripts/spec-hash.ts"]);
  return ctx.state.specHash;
}

function ensureDelta(ctx: Ctx, server: string): string {
  const cached = ctx.state.delta[server];
  if (cached) return cached;
  if (ctx.stub) {
    ctx.state.delta[server] = "patch";
    ctx.state.deltaReport[server] = { requirements_changed: { added: [], removed: [], modified: [] } };
    return "patch";
  }
  ensureBase(ctx);
  const { classification, report } = classifyDelta(ctx, server);
  ctx.state.delta[server] = classification;
  if (report) ctx.state.deltaReport[server] = report;
  return classification;
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
        dryRun: ctx.flags.dryRun,
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
      ctx.state.suiteRan = true;
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
        for (const server of ctx.servers) {
          ctx.state.delta[server] = "patch";
          ctx.state.deltaReport[server] = { requirements_changed: { added: [], removed: [], modified: [] } };
        }
        ctx.log("  [stub] delta classification skipped (patch)");
        return "pass";
      }
      ctx.state.base = tryGit(ctx, ["rev-parse", "--verify", "--quiet", "origin/main"]) ? "origin/main" : "HEAD";
      ctx.log(`  delta base: ${ctx.state.base}`);
      ctx.state.specHash = out(ctx, "npx", ["tsx", "scripts/spec-hash.ts"]);
      for (const server of ctx.servers) {
        const { classification, report } = classifyDelta(ctx, server);
        ctx.state.delta[server] = classification;
        if (report) ctx.state.deltaReport[server] = report;
        ctx.log(`  ${server}: delta class = ${classification}`);
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
      for (const server of ctx.servers) {
        const specHash = ensureSpecHash(ctx);
        const deltaClass = ensureDelta(ctx, server);
        const args = [
          "tsx",
          "scripts/update-server.ts",
          "--server",
          server,
          "--spec-hash",
          specHash,
          "--scope-by-fingerprint",
          "--delta-class",
          deltaClass,
        ];
        // REQ-394a — hand the derivation the changed-REQ set and the operator
        // channel. A dry run passes `--check`, so it derives nothing and writes
        // no baseline (the promise the dry run makes).
        const report = ctx.state.deltaReport[server];
        if (report) {
          const reportPath = join(ctx.root, ".holonovel-state", `delta-${server}.json`);
          mkdirSync(join(ctx.root, ".holonovel-state"), { recursive: true });
          writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
          args.push("--delta-report", reportPath);
        }
        args.push("--dispositions", join(ctx.root, "spec", "audit", "update-dispositions.md"));
        if (ctx.flags.allowPending) args.push("--allow-pending");
        if (ctx.flags.dryRun) args.push("--check");
        const status = sh(ctx, "npx", args, ctx.root);
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
      ensureBase(ctx);
      const deltas = ctx.servers.map((server) => ensureDelta(ctx, server));
      const serverChanged =
        (tryGit(ctx, ["diff", "--name-only", ctx.state.base, "--", ...paths]) ?? "") !== "" ||
        (tryGit(ctx, ["ls-files", "--others", "--exclude-standard", "--", ...paths]) ?? "") !== "";
      ctx.state.needTests =
        ctx.flags.fullTests ||
        ctx.state.contractChanged ||
        serverChanged ||
        deltas.some((delta) => ["minor", "major"].includes(delta));
      if (!ctx.state.needTests) {
        ctx.log("  skipped: patch/editorial delta, no contract or server-source change (§6.7 G0-only)");
        return "skip";
      }
      // The full `check` suite runs `test:all` (full mode only), so a run whose
      // build-order recorded it on this tree needs no second pass. Anything
      // else runs it: a missing record is the closed direction, never a skip.
      if (ctx.state.checkRan) {
        ctx.log("  skipped: build-order's full check suite already ran test:all on this tree");
        ctx.state.harness = "ran in the build-order full check suite";
        return "pass";
      }
      must(sh(ctx, "npm", ["run", "test:all"], join(ctx.root, "holonovel")) === 0, "server harness suite failed");
      ctx.state.harness = "ran";
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
      const harness = ctx.state.harness ? ctx.state.harness : "skipped (§6.7 G0 or not run in this bounded range)";
      ctx.state.verification =
        `Gates: ${ctx.state.suite} check suite passed; server harness suite ${harness}; ` +
        `spec SHA ${ensureSpecHash(ctx)}; deploy verification is the deploy stage (REQ-418).`;
      const recordArgs = ["tsx", "scripts/spec-update-record.ts", "--verification", ctx.state.verification];
      // A dry run prints the entry and writes nothing, and skips the follow-on
      // --check: check mode wrote no delta record, so that assertion would fail
      // on an artifact the dry run deliberately did not produce.
      if (ctx.flags.dryRun) recordArgs.push("--dry-run");
      must(sh(ctx, "npx", recordArgs) === 0, "Spec Update record generation failed");
      if (ctx.flags.dryRun) {
        ctx.log("  [dry run] Spec Update entry printed; DECISIONS.md and the baseline unchanged");
        return "pass";
      }
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
      const guards = collectStagedGuards(ctx.root);
      const secretProblems = guards.problems.filter((problem) => problem.startsWith("secret-pattern match:"));
      const hardProblems = guards.problems.filter((problem) => !problem.startsWith("secret-pattern match:"));
      if (ctx.flags.allowSecrets) {
        for (const problem of secretProblems) {
          ctx.log(`  WARNING: ${problem} (allowed by --allow-secrets)`);
        }
      } else {
        hardProblems.push(...secretProblems);
      }
      for (const problem of hardProblems) ctx.log(`  BLOCKED: ${problem}`);
      must(hardProblems.length === 0, "staging guards failed — refusing to commit");
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
      // A bounded run that skipped the gate suite must not record a pass.
      if (ctx.state.suiteRan) {
        writeGateRun(ctx.state.suite, new Date().toISOString(), new Date().toISOString(), "pass", true);
      }
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
      // REQ-428 — the registry check follows the publish, not the mirror: a push
      // with nothing pending (or a failed mirror) must not suppress it.
      if (ctx.flags.noPush) {
        ctx.log("  skipped: no-push run");
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

      // REQ-396/REQ-397 — refuse before any file is removed when the pending
      // checkout/clean would touch state. Ignored state is preserved by
      // `git clean -fd` (no `-x`) and is reported, not refused.
      const stateFindings = classifyStatePaths(
        ctx.deployDir,
        deployStateCandidates(ctx.deployDir, ctx.servers),
        (args) => tryGit(ctx, args, ctx.deployDir),
      );
      const blockedState = stateFindings.filter((finding) => finding.reason !== "ignored");
      for (const finding of stateFindings) {
        if (finding.reason === "ignored") ctx.log(`  state at ${finding.path} is gitignored — preserved by checkout/clean`);
      }
      must(
        blockedState.length === 0,
        blockedState
          .map(
            (finding) =>
              `deploy-refused: ${finding.reason} state at ${finding.path} would be touched by checkout/clean; ` +
              `relocate it with TTRPG_DATA_DIR or TTRPG_RULESET_DIRS (REQ-396, REQ-397)`,
          )
          .join("; "),
      );

      if ((tryGit(ctx, ["status", "--porcelain"], ctx.deployDir) ?? "") !== "") {
        ctx.log("  deploy tree has uncommitted changes — discarding before pull");
        sh(ctx, "git", ["checkout", "--", "."], ctx.deployDir);
        sh(ctx, "git", ["clean", "-fd"], ctx.deployDir);
      }
      const previous = tryGit(ctx, ["rev-parse", "HEAD"], ctx.deployDir) ?? "";
      if (sh(ctx, "git", ["pull", "--ff-only", "origin", "main"], ctx.deployDir) !== 0) {
        throw new Error(
          `deploy-failed: ${ctx.servers.join(", ")}: pull could not fast-forward (REQ-418)`,
        );
      }
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
        ctx.log("  [stub] deploy verification not run");
        // REQ-418 — a stubbed verification is not a completed deploy; leave
        // `didDeploy` false so the run summary cannot claim one.
        return "skip";
      }
      for (const server of ctx.servers) {
        const specHash = ensureSpecHash(ctx);
        const status = sh(ctx, "npx", [
          "tsx",
          "scripts/update-server.ts",
          "--server",
          server,
          "--server-dir",
          join(ctx.deployDir, server),
          "--spec-hash",
          specHash,
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
