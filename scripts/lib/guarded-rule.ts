// guarded-rule.ts — pure helpers for the guarded-rule-change gate.
//
// A change that edits Appendix M's authoring rules and, in the same commit,
// the validator patterns that enforce them is self-attesting: the rule and its
// gate move together (AGENTS.md "Review-loop governance"). These helpers keep
// the decision testable; the git plumbing lives in
// scripts/check-guarded-rule-change.ts.

// The Appendix M section of the assembled spec or its source file. Returns
// null when the section is absent.
export function extractAppendixM(text: string): string | null {
  const start = text.indexOf("## Appendix M:");
  if (start === -1) return null;
  const end = text.indexOf("\n## Appendix N:", start);
  return end === -1 ? text.slice(start) : text.slice(start, end);
}

export interface GuardedRuleInput {
  ruleChanged: boolean;
  validatorChanged: boolean;
  registerAcknowledges: boolean;
}

// Returns a failure message when the co-change is unacknowledged, else null.
export function decideGuardedRuleChange(input: GuardedRuleInput): string | null {
  if (!input.ruleChanged || !input.validatorChanged) return null;
  if (input.registerAcknowledges) return null;
  return "Appendix M authoring rules and the validator patterns enforcing them "
    + "changed together, but no review-register entry names the rule — add a "
    + "spec/audit/review-register.md line containing \"Appendix M\" so the "
    + "change is recorded rather than self-attesting.";
}
