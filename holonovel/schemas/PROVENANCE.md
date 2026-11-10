# Vendored schema provenance

`mcp-server.schema.json` in this directory is a byte-for-byte copy of the MCP
registry's server manifest schema.

| Field | Value |
|---|---|
| Source URL | `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json` |
| Fetch date | 2026-11-10 |
| Schema version | `2025-12-11` |
| SHA-256 | `3fba09590c99f61735d234822279f4223fab9e300c0a81e81c91ab62a4114de0` |
| Bytes | 22,090 |

## Why it is vendored

`scripts/lib/server-manifest.ts` validates `holonovel/server.json` against this
schema at build time (`check-server-manifest`), inside `version-check`, and in
the publish preflight. Validation must be deterministic and offline, so the
schema travels with the tree rather than being fetched at run time.

## Keyword vocabulary

The validator implements every key this schema uses, grouped into three sets.
A key outside all three fails the gate, so refreshing the schema forces the
validator to grow with it instead of silently skipping the new assertion.

- **Annotations** (accepted, not validated): `$schema`, `$id`, `$comment`,
  `title`, `description`, `example`, `examples`, `default`.
- **Containers** (descended into): `definitions`, `properties`.
- **Assertions** (validated): `$ref`, `type`, `required`, `additionalProperties`
  (boolean and object form), `items` (schema form), `enum`, `const`, `pattern`,
  `format` (`uri`), `anyOf`, `allOf`, `not`, `minLength`, `maxLength`.

Total: 8 annotations + 2 containers + 14 assertions = 24 keys. The instance
documents under `example`/`examples` are data, not schema, and are not walked.

## Refreshing

1. Fetch the new schema from the registry URL.
2. Replace `mcp-server.schema.json` byte-for-byte.
3. Update this file's URL, date, version, size, and sha256.
4. Run `npm run check-server-manifest`. A new key fails with its name; add the
   key to the matching set in `scripts/lib/server-manifest.ts` and extend
   `validateManifest` if it is an assertion.
5. Run `npm run test:tool-definitions` (T510).
