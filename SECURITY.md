# Security & Ownership

Holonovel is a local-first MCP server. This document states its security
model, where campaign data lives, and what it deliberately does not do. It is
a description of the current design, not a marketing claim.

## Local-first by design

Holonovel runs as a local process over the MCP `stdio` transport, launched by
the user's own MCP client. There is no hosted tier, no remote endpoint, and
no account system. The threat model is a single trusted host: the server
trusts the user running it and the MCP client that spawns it.

## Data ownership

Campaign data is the user's. It is stored as plain files under the state
directory (`.holonovel-state/`):

- Novels: `.holonovel-state/novels/<slug>.json` (atomic writes).
- Roster: `.holonovel-state/roster.json`.
- Trash: `.holonovel-state/.trash/` (ended Novels are moved, never deleted).

Save files are portable and inspectable. `manage_novel (action: export)` and
`manage_novel (action: import)` move a campaign between machines; `clone`,
`branch`, checkpoints, and per-badge undo/redo give recoverability. There is
no proprietary store and no silent migration to a service — leaving Holonovel
means keeping your files.

## No outbound network

The server makes no outbound network calls (REQ-051). The build-time semantic
index is constructed by deterministic offline feature extraction with no
outbound access (REQ-504). Synthesis content is inert by default and only
activates on explicit operator action; when external research is enabled, its
provenance (URL, confidence, freshness) is recorded and the content is
revertible.

## Access control

Access is enforced **server-side** by badge, not by convention. Four badges
exist (Game Master, Player, Observer, Editor). Tools, resources, prompts,
briefing sections, and error hints are filtered to the active badge; a Player
never receives GM-only content, and error responses do not disclose the
existence of invisible surfaces (REQ-445). GM-only NPC `mind` content is
excluded from every Player-facing surface.

## Filesystem containment

The server reads files only from the configured ruleset directory, its own
installation directory, and the state directory. Path traversal and malformed
input are rejected (REQ-052).

## Explicit non-goals

- **No hosting.** There is no hosted deployment, no OAuth endpoint, and no
  multi-tenant service.
- **No telemetry.** The server reports nothing about usage to any external
  party.
- **No server-side LLM.** Holonovel never invokes an external model API; the
  user's MCP client supplies the model.

## Reporting

Security concerns are reported through the project's issue tracker. Because
this is a local, single-user tool with no remote surface, the realistic risk
classes are filesystem-path handling and badge-boundary disclosure, both of
which are covered by the requirements cited above.
