# Stage 1 — zoom out (cold)

Reviewer: review subagent (fresh context) · plan sha256 be5e2d9d… (pre-revision draft)

Findings: 2 Blockers, 15 Majors, 9 Nits — all clarity/consistency of the draft.

Summary of the accepted items (resolved in the revision):

- Done-bar predicates reused pre-edit line numbers.
- D6's narrowing contingency contradicted D7's fixed catalogue text.
- T727's manual fallback was asserted without naming the fallback line.
- The T640 matrix counted four rows but listed six, and the harness was said to
  boot per case when it boots one shared process.
- The `narrativeRole(novel)` grep expectation was wrong (baseline 2, not 1).
- T713 asserted a `clean` status that REQ-603 forbids (became D5a).
- The catalogue already carried the T545 replay clause and the T727
  export/clone/checkpoint clause; D7 now appends only the missing clauses.
- The `social_cast` checkpoint anchor did not cite the payload copy.
- The budget env var and character-vs-token unit were unstated.
- The projection version was not stated (current is 2).
- The restart leg needed the save-before-return predicate.
- `check-registers:strict` exists (`package.json:32`).
- The objective understated T727's scope; open questions were not "none".

Rejected as incorrect:

- "The section is the last P1 chunk" — softened to "one of the last".
