## Appendix V: Workflow Runbooks

This appendix is the operator-facing companion to §6.1. Each of the four
workflows has a runbook: the entry point that starts it, the happy path to
completion, and the recovery path when a step fails. Read the runbook you need
before the workflow's full §6 sections — they are the "how do I actually run
this" index into the normative text.

The entry points are also emitted by their commands: `build-ruleset` and
`update-server` print a pointer to this appendix when invoked without valid
arguments.

### V.1 Add a ruleset (Build)

**Entry point.** `npm run build-ruleset <slug>=<path>` (the B1 intake form), or
invoke the Build workflow directly on the builder with a `slug=path` pair.

**Happy path.**

1. Run `build-ruleset swse=/abs/path/to/books` to confirm intake and record the
   build in `DECISIONS.md`.
2. Discovery (§6.3): identify the ruleset name, subsystems, and cover books in
   the source; reject source that is incomplete or unrecoverable.
3. Construction (§6.4): write the ruleset profile, maps, and tables.
4. Package step (§6.4.2): emit the declarative package (REQ-389) to the install
   directory.
5. Verify (§6.5): run the convergence loop until no blocking findings remain.
6. Bind a Novel to the slug (`bind_novel_ruleset`) and confirm the slug's tools
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
   the `Spec hash` line; it does not write the narrative entry.
6. Record the deployed server location the gate evaluated, if it differs from
   the current working directory — the pending-update gate (REQ-394) reads
   fingerprints from the live server tree, not the spec repo.

**Recovery.**

The pending-update gate blocks publication with unchanged fingerprints: advance
the fingerprints by completing the implementation, or record an operator
override in `DECISIONS.md` when the update is deliberately scheduled.

### V.5 Remove a ruleset

**Entry point.** `remove_ruleset <slug>`.

**Happy path.**

1. Confirm no active Novel is bound to the slug (REQ-389c refuses otherwise).
2. Remove the package; the host deregisters its tools and reports the change
   in `spec_health`.

**Recovery.**

`remove_ruleset` returns `[ERROR] [STATE_CONFLICT]` because a Novel is bound:
unbind or archive the Novel first, then retry.

### V.6 Migrate a Novel to a ruleset

**Entry point.** `bind_novel_ruleset <slug>` on an existing Novel.

**Happy path.**

1. Build and install the target ruleset (§6) if it is not already installed.
2. Bind the Novel; it gains the slug's tools and the transition is audited.

**Recovery.**

The Novel is already bound to a different slug (`[ERROR] [STATE_CONFLICT]`):
the binding is one-way per REQ-380c — decide which slug the Novel should keep
before re-binding.
