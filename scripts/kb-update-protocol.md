# KB Update Protocol

After executing spec changes via the spec-engineering queue, update the
knowledge base at `.holonovel-state/knowledge-base/` to cache research
findings for future sessions.

## Before you start

Check `INDEX.md` for existing entries. Do not duplicate content that
already exists and is still fresh. Expiration rules:
- `web/` entries: fresh if ≤30 days since source date
- `spec/` entries: fresh if REQ count for that section hasn't changed
- `implementation/` entries: fresh if ≤14 days since source date

## Update steps

### 1. Web findings

For each novel web research result (competitor analysis, best practices,
domain patterns) not already in `KB/web/`, write a concise Markdown file
with:
- Title
- Topic tags
- Sourced date (today)
- Expiration date (today + 30 days)
- Key findings (≤10 lines)
- Source URLs

### 2. Implementation analysis

For each novel code analysis finding, write to `KB/implementation/`.
Expiration: 14 days from today.

### 3. Spec summaries

Read each changed section of `holonovel.md` (use `git diff` to find
changes) and write a 50-100 word summary to `KB/spec/`. Include REQ
numbers covered and the current git HEAD hash:

```
**Spec hash:** <git rev-parse HEAD>
```

Freshness check: an entry is fresh when the stored hash equals current
HEAD. If the hash differs but the REQ count is unchanged, the entry is
"stale-prose" — re-read only `git diff` since stored hash.

### 4. INDEX.md maintenance

Add entries for new files under the appropriate section headers.
Remove entries for files that no longer exist or are past their
expiration date.

## Constraints

- Keep entries concise. One topic per file.
- Do NOT commit — just write the KB files.
- Report which entries were added, updated, or pruned.

## Output

End with: `KB UPDATE COMPLETE.`
