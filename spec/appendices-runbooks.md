## Appendix V: Workflow Runbooks

This appendix is the operator-facing companion to §6.1. Each of the four
workflows has a runbook: the entry point that starts it, the happy path to
completion, and the recovery path when a step fails. Read the runbook you need
before the workflow's full §6 sections — they are the "how do I actually run
this" index into the normative text.

The entry points are also emitted by their commands: `build-ruleset`,
`update-server`, `update-rulesets`, and `migrate-user-data` print a pointer to
this appendix when invoked without valid arguments.

### V.1 Add a ruleset (Build)

**Entry point.** `npm run build-ruleset <slug>=<path>` (the B1 intake form), or
invoke the Build workflow directly on the builder with a `slug=path` pair.

**Happy path.**

1. Run `build-ruleset example=/abs/path/to/books` to confirm intake and record the
   build in `DECISIONS.md`.
2. Discovery (§6.3): identify the ruleset name, subsystems, and cover books in
   the source; reject source that is incomplete or unrecoverable.
3. Construction (§6.4): write the ruleset profile, maps, and tables.
4. Package step (§6.4.2): emit the declarative package (REQ-389) to the install
   directory.
5. Verify (§6.5): run the convergence loop until no blocking findings remain.
6. Bind a Novel to the slug (`ruleset (action: bind)`) and confirm the slug's tools
   serve without re-parsing source Markdown.

**Recovery.**

- Intake rejects the path: point at a directory that exists and contains
  Markdown; the entry point names the failure.
- Discovery flags unrecoverable source: fix or supply the source, then re-run
  Discovery — do not waive a subsystem (convergence finds gaps, it does not
  waive them).
- Package step fails the manifest hash check: re-emit the package and confirm
  the manifest matches the indexed content before install.

### V.2 Convert

**Entry point.** The Convert workflow (§6.1), selected by the operator; the
builder asks only Convert's questions and validates structure (Appendix G, H).

**Happy path.**

1. Name the PDF/HTML/web source and the target ruleset.
2. Convert each source to Markdown, preserving structure and headings.
3. Validate structure against Appendix G (source conversion) and Appendix H
   (preparation checklist).
4. Confirm the converted Markdown is Build-ready before handing off to the
   Build workflow.

**Recovery.**

If a converter drops headings or tables, re-run with a validated converter
(Appendix G.6 cross-verifies converters) rather than hand-editing the output.

### V.3 Synthesize

**Entry point.** The Synthesize workflow (§6.1), optional; feeds §11.1.

**Happy path.**

After a server builds cleanly, run Synthesize to add community play advice and
structured synthesis (§11.1); keep it separate from the normative server so it
can be re-run without touching verification.

**Recovery.**

Synthesis produces a contradiction with core rules: discard the synthesis, not
the core — §11.1 material never overrides Discovered ruleset substance.

### V.4 Update

**Entry point.** `npm run update-server` (scripts/update-server.ts), or the
Update workflow (§6.7) driven manually.

**Happy path.**

1. Read §6.7, then the CHANGELOG for the spec version delta.
2. Run the gap audit against the §5 subsections the delta cites.
3. Implement the changes, then re-verify all blocking Pattern Buffer
   sub-workflows (§6.6).
4. Recompute the implementation fingerprints (REQ-313) — publication is
   blocked by REQ-394 until they advance. Implementation fingerprints are
   computed from the live server source tree (REQ-313d), never read from the
   historical fingerprint lines recorded in earlier `DECISIONS.md` entries.
5. Record the Spec Update entry in `DECISIONS.md` — delta class, changed
   surfaces, and verification — before pushing. The push pipeline syncs only
   the `Spec hash` line; it does not write the narrative entry. An Editorial
   delta additionally records the repaired REQ set in the entry.
6. Record the deployed server location the gate evaluated, if it differs from
   the current working directory — the pending-update gate (REQ-394) reads
   fingerprints from the live server tree, not the spec repo.
7. After the deploy pull, verify the deployed spec hash equals the published
   hash and the deployed fingerprints match (REQ-418). A deploy that cannot
   fast-forward fails with a deploy-failed notice, not a success marker.

**Recovery.**

The pending-update gate blocks publication with unchanged fingerprints: advance
the fingerprints by completing the implementation, or record an operator
override in `DECISIONS.md` when the update is deliberately scheduled.

### V.5 Remove a ruleset

**Entry point.** `ruleset (action: remove) <slug>`.

**Happy path.**

1. Confirm no active Novel is bound to the slug (REQ-389c refuses otherwise).
2. Remove the package; the host deregisters its tools and reports the change
   in `spec_health`.

**Recovery.**

`ruleset (action: remove)` returns `[ERROR] [STATE_CONFLICT]` because a Novel is bound:
unbind or archive the Novel first, then retry.

### V.6 Migrate a Novel to a ruleset

**Entry point.** `ruleset (action: bind) <slug>` on an existing Novel.

**Happy path.**

1. Build and install the target ruleset (§6) if it is not already installed.
2. Bind the Novel; it gains the slug's tools and the transition is audited.

**Recovery.**

The Novel is already bound to a different slug (`[ERROR] [STATE_CONFLICT]`):
the binding is one-way per REQ-380c — decide which slug the Novel should keep
before re-binding.

### V.7 Update a ruleset

**Entry point.** `npm run update-rulesets` (scripts/update-rulesets.ts).

**Happy path.**

1. Run `update-rulesets` with no arguments — it prints usage, the install
   directory, and a per-package compatibility summary listing each installed
   slug with its package-format fingerprint and whether it matches the host's
   current value (REQ-420).
2. For each stale slug, rebuild against the recorded source: `build-ruleset
   <slug>=<path>` — the source registry (REQ-421) defaults the path when it is
   omitted.
3. Confirm `spec_health` no longer reports `[package-incompatible]` for the
   slug after the rebuild.

**Recovery.**

- A legacy package lacks a `package_format` fingerprint: rebuild it once via
  `build-ruleset` — it is flagged stale, never dropped or hard-blocked.
- The registry has no entry for a stale slug: re-run `build-ruleset
  <slug>=<path>` with the explicit source path, which re-records it.

### V.8 Migrate user data

**Entry point.** `npm run migrate-user-data` (scripts/migrate-user-data.ts).

**Happy path.**

1. Run `migrate-user-data` in its default dry-run mode — it lists artifacts
   whose data-format fingerprint differs from the host's current value (REQ-423)
   and reports what re-stamping would change, with no side effects.
2. Re-run with the explicit migrate flag to re-serialize each stale artifact
   through the interchange round-trip (REQ-096, Appendix Q), re-stamping the
   current fingerprint while preserving inert fields and applying defaults
   (REQ-065).
3. Confirm `spec_health.data_health` reports no `[data-stale]` flags after the
   migration.

**Recovery.**

- A migration fails mid-round-trip: the original artifact is left unchanged and
  the failure names the artifact — inspect and retry, or leave the artifact
  stale (staleness never blocks loading, REQ-423).
- A legacy artifact lacks a fingerprint: it is flagged `[data-stale]` and
  re-stamped by the next explicit migration.
