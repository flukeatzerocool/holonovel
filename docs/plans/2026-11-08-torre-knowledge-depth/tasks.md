# Tasks — Torre player-facing knowledge depth

One commit via `npm run session:close`; the session touches `spec/`, so it is a
spec increment and is not split. Ordered by dependency.

## Phase 0 — trigger and surface

- [x] C-1: trigger confirmed — the seven pages were played and exploration
      still reads thin.
- [x] Enumerate the Player-visible knowledge surface: 7 readable pages, 17
      GM-only lore entries, 3 GM secrets.

## Phase 1 — content

- [x] Append `page — the tower's origin` (Seventh Floor — Teaching Nest),
      `page — the bargain` (Second Floor — Social Hall), and
      `page — the matches` (Fifth Floor — Wax Refill) to `world.things` in
      `holonovel/content/torre-nosferatu.source.json`.
- [x] Verify: 35 things, 10 pages, no duplicate names, every location resolves
      to a room, all seven floors covered.

## Phase 2 — harnesses and artifact

- [x] `test-starter-novel.ts`: page-surface assertions (count, readable,
      `read_text`, placement, seven floors).
- [x] `holosuite-novel.ts:185`: `things` pin 32 → 35.
- [x] `npm run build:starter-novel` — 156 pure-addition lines.
- [x] `test:starter-novel` 15/0; `test:holosuite-novel` PASS 100/0;
      `test:output-contracts` 338/0; `check-starter-freshness` PASS;
      `check-playability` PASS (4 Novels); `test:all` 54/0.

## Phase 3 — registers and artifacts

- [x] Delete the "Torre player-facing knowledge depth" section from `ROADMAP.md`.
- [x] Move the `Scheduled-roadmap` row to `## Resolved` in
      `spec/audit/review-register.md`.
- [x] `CHANGELOG.md` entry dated 2026-11-08.
- [x] `plan.md` (stamped bytes), `tasks.md`, `aar.md`.
- [x] `npm run assemble && npm run check:fast` (37/0 PASS); `npm run build-order`
      (exit 0).
- [ ] `npm run session:close`.
