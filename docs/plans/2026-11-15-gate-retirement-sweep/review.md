# Review — gate-retirement sweep: the 36 candidates

Question this table answers: **does any candidate have a redundant cover?** A cover means
another *gate in the manifest* that fails on the same finding class. If one existed, the
candidate would become writable and `--apply` would downgrade it. None exists.

Method: the candidate list is `npm run gate-cost -- --json` at HEAD (36 names, this session's
timing log); each gate's finding class is its own manifest description
(`scripts/lib/gate-manifest.ts`); the neighbour column names the gate closest in subject, and
the last column states why that neighbour does not fail on the same condition.

Two patterns explain most rows:

- **Mirror pairs** (`check-X` / `test:X`) look like covers but are not. The `test:` harness
  asserts that the *checker* catches a violation; the check asserts that *the tree* has none.
  Downgrading the check leaves the harness proving a checker works while nothing fails on
  drift.
- **Subject neighbours** (manifest vs manifest, surface vs budget) assert different predicates
  over related data: equality vs ceiling, freshness vs quality, schema vs assertion.

| # | Gate | Finding class (manifest description) | Nearest neighbour | Why the neighbour is not a cover |
|---|---|---|---|---|
| 1 | `test:ruleset-gates` | Ruleset package gate self-tests | `check-package-manifest` | Asserts published-manifest shape, not the ruleset gate behaviours (hash, provenance, re-emit) the harness exercises. |
| 2 | `test:spec-tooling` | Spec-delta and assembly tooling self-tests | `test:validators` | Validators test REQ shape and ambiguity; nothing else tests delta classification or assembly byte-identity. |
| 3 | `lint` | Markdown style on the assembled spec and README | `validate-readme` | README structure/voice/links, not line length, heading form, or the assembled spec's own prose. |
| 4 | `check-fixture-emitter` | Covered reference package re-emits byte-identically | `check-vendor-manifest` | Vendor hashes track content provenance; the emitter asserts emission determinism. |
| 5 | `test:data-dir` | Portable data directory and in-work-tree warning | `check-package-manifest` | Static manifest assertions cannot see runtime path placement or the warning. |
| 6 | `test:anchor-tooling` | Anchor resolver and refresh-predicate self-tests | `check-anchors` | The gate resolves live anchors; the harness tests the resolver's CLI contract (ambiguity refusal). |
| 7 | `check-tool-definitions-sync` | Generated tool definitions match their source | `tool-definitions-lint` | Lint judges description quality; freshness against source is a different predicate. |
| 8 | `surface-replay` | Recorded surface replays still resolve | `check-tool-surface` | Counts vs the documented surface; replay resolves recorded invocations. |
| 9 | `typecheck` | TypeScript type checking | — | No other gate compiles TypeScript. No neighbour exists. |
| 10 | `tool-definitions-lint` | Tool description quality rules | `check-tool-definitions-sync` | Freshness ≠ quality (mirror of row 7). |
| 11 | `check-fingerprint-sync` | Committed contract fingerprints match the spec | `check-markers` | Markers are README `@spec:` hashes; fingerprints are baked contract constants. |
| 12 | `test:commit-plan` | Session commit planner and subject hook self-tests | `check-loop-artifacts` | The artifact contract validates plan/tasks/AAR; the planner decides commit grouping. |
| 13 | `check-traceability` | DECISIONS register drift vs registered tools | `check-registers` | Register structure and dispositions, not cross-reference to live tools. |
| 14 | `check-markers` | README `@spec:` marker freshness | `check-fingerprint-sync` | Opposite direction of row 11: README hashes, not baked constants. |
| 15 | `check-script-discipline` | Script shebang, role header, exit codes, path and shell rules | `check-script-quality` | Quality detectors cover reachability and duplicate helpers, not headers or exit codes. |
| 16 | `check-package-manifest` | Published package manifest assertions | `test:package-manifest` | Mirror pair: the self-test proves the assertions fire; it asserts nothing about the package. |
| 17 | `test:validators` | REQ validator self-tests | `validate` | `validate` runs the checks on the spec; the harness proves they catch violations. |
| 18 | `action-conflicts` | Action contract conflicts across tools | `check-tool-surface` | Surface counts, not cross-tool action semantics. |
| 19 | `tool-citation-check` | Tool citations resolve to spec identifiers | `check-traceability` | DECISIONS drift vs citation resolution — different registers. |
| 20 | `check-roadmap` | Roadmap admission rule and Non-goals pointer | `check-registers` | Register dispositions vs roadmap scheduling shape. |
| 21 | `check-tool-surface` | Surface counts match the documented surface | `surface-budget` | A budget ceiling is not count equality (mirror of row 8's neighbour pair). |
| 22 | `check-workflows` | CI workflow hygiene rules | `test:workflows` | Mirror pair: the harness exercises the detectors; the check asserts the workflow. |
| 23 | `check-tdqs-scoreboard` | TDQS scoreboard consistency | `check-performance-record` | Different records with different schemas. |
| 24 | `check-performance-record` | Performance record freshness | `check-tdqs-scoreboard` | Mirror of row 23. |
| 25 | `check-reference-server-cleanliness` | Reference server stays inside the content boundary | `check-vendor-manifest` | Boundary sanctions paths; the manifest hashes content. |
| 26 | `test:package-manifest` | Package manifest gate self-tests | `check-package-manifest` | Mirror of row 16. |
| 27 | `check:conformance` | Spec-to-code bundle dependence | `check-fingerprint-sync` | Fingerprints bake constants; conformance maps REQ → exercised evidence. |
| 28 | `test:world-provider` | `world://kinds` provider payload | `check-world-provider` | Payload contract vs generated-document freshness. |
| 29 | `check-world-provider` | Generated world-provider document freshness | `test:world-provider` | Mirror of row 28. |
| 30 | `test:workflows` | CI workflow detector self-tests | `check-workflows` | Mirror of row 22. |
| 31 | `validate-readme` | README structure, voice, links, comparison table | `lint` | Style rules, not structure, links, or the comparison table. |
| 32 | `test:script-tooling` | Script discipline and quality detector self-tests | `check-script-discipline` | Mirror pair; the harness proves detection, the gate asserts the corpus. |
| 33 | `check-server-manifest` | Registry manifest schema validation | `check-package-manifest` | Package assertions vs registry schema shape. |
| 34 | `check-adventure-index` | Adventure index and DECISIONS table freshness | `check-traceability` | Register drift vs index/table freshness. |
| 35 | `check-vendor-manifest` | Vendored content hashes match the manifest | `check-fixture-emitter` | Emission determinism vs content hashes (mirror of row 4). |
| 36 | `check-container-image` | Container image builds and starts the host | `check-server-manifest` | Schema validation vs a real build-and-start exercise. |

Result: **36 candidates, 0 writable, 0 retirements.** No gate declares `coveredBy`, and this
table is the reason none should: every candidate guards a distinct predicate.

## Replay — the old predicate really decided, it did not merely report

`git worktree add /tmp/opencode/replay-gr 675daeb`, then `.holonovel-state/gate-timing.json`
copied into the worktree from the main tree (the log is local state, not tracked).

Old report (HEAD `675daeb`, unchanged code):

```
$ npx tsx scripts/gate-cost-report.ts --apply
Retirement threshold: 20 consecutive zero-finding runs. 36 candidate(s).

gate-cost-report: wrote /tmp/opencode/replay-gr/spec/audit/gate-retirement.json (36 advisory gate(s))
$ node -e 'console.log(require("./spec/audit/gate-retirement.json").advisory.length)'
36
```

New report (this increment, same timing log):

```
$ npm run gate-cost -- --apply
...
gate-cost-report: --apply wrote nothing
$ ls spec/audit/gate-retirement.json
ls: cannot access 'spec/audit/gate-retirement.json': No such file or directory
```

Same input, opposite decision: the old policy would have converted 36 of the 49 blocking gates
into advice on the next monthly sweep; the new one retires none, and the 36 refusal lines name
the reason (`no cover declared`).
