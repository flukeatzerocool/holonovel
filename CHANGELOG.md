# Changelog

## 2026-07-28 — Add character-sheet-from-pdf skill

- Added `skills/character-sheet-from-pdf/SKILL.md`: opencode skill for building
  character sheet rendering on top of a holonovel-built server.
- Updated `README.md` project structure and `AGENTS.md` layer map to reference
  the new skill.

## 2026-07-28 — Parsing heuristics expansion

- Appendix A: added table header detection (gap 1).
- Appendix A: added inline formatting preservation in table cells (gap 2).
- Appendix A: added fenced info-string handling for code blocks (gap 3).
- Appendix A: added callout classification heuristic (gap 4).
- Appendix A: added definition-list extraction (gap 5).
- Appendix A: added horizontal rule content-boundary handling (gap 6).
- Section 6.1: added Unicode normalization for quotation marks, dashes, and
  double-prime in canonical alias resolution (gap 7).
- Appendix A: added nested-list diagnostic for unmappable sections (gap 8).
- Appendix A: added role-scoping disambiguation for multi-word role terms
  sharing a final word (gap 9).
- Appendix A: added table caption association (gap 10).
- Appendix A: added strikethrough handling with content-finding flag (gap 12).
- Appendix A "Counted defect classes": expanded content-finding examples to
  cover nested-list unextractable sections and struck-through content (gaps
  8, 12).

## 2026-07-27 — Initial commit

- Moved `holonovel.md` from `~/Documents/` into this project directory.
- Added `.markdownlint.json` with prose line-length limit of 120 (tables and
  code blocks excluded).
- Added `scripts/validate.py` for cross-reference checking.
- Added `package.json` scripts (`lint`, `validate`, `check`) as task runner
  (`make` is unavailable on the build system).
- Prose lines exceeding 120 characters were re-wrapped near 110 columns; no
  text was added, removed, or reworded.
