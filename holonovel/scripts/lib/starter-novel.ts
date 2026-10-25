// starter-novel.ts — shared emit logic for the bundled starter Novel.
//
// buildStarterArtifact reads the pristine source, stamps it with the server's
// authoritative DATA_FORMAT and package version (no `_checksum` — absent is
// valid per state.ts REQ-092), and returns the artifact text with recursively
// sorted keys so emission is byte-deterministic. The build tool and the
// freshness gate both import this so emit and compare stay one implementation.
//
// It also derives the opening workflow snapshot from the source state: a
// workflow cancel (or staleness auto-cancel) restores the authored world and
// active entity instead of a stale, empty snapshot. The derivation is
// deterministic and matches novelToSnapshotJSON (no undo/redo stacks).
//
// REQ-566.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_FORMAT } from "../../src/generated/contract-fingerprints.js";

export const STARTER_SLUG = "torre-nosferatu";
export const SOURCE_REL = join("content", `${STARTER_SLUG}.source.json`);
export const ARTIFACT_REL = join("content", `${STARTER_SLUG}.json`);

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function serverVersion(serverDir: string): string {
  return JSON.parse(readFileSync(join(serverDir, "package.json"), "utf-8")).version;
}

function deriveOpeningSnapshot(source: Record<string, unknown>): void {
  const pending = source.pending_workflow as { snapshot?: { state?: unknown } } | undefined;
  const snapshot = pending?.snapshot;
  if (!snapshot) return;
  const state = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
  delete state._checksum;
  delete state.data_format;
  delete state.spec_version;
  delete state.undo_stacks;
  delete state.redo_stacks;
  state.pending_workflow = null;
  snapshot.state = state;
}

export function buildStarterArtifact(serverDir: string): string {
  const source = JSON.parse(readFileSync(join(serverDir, SOURCE_REL), "utf-8")) as Record<string, unknown>;
  delete source._checksum;
  deriveOpeningSnapshot(source);
  source.data_format = DATA_FORMAT;
  source.spec_version = serverVersion(serverDir);
  return JSON.stringify(sortKeys(source), null, 2) + "\n";
}

// Freshness comparison drops `spec_version` (advances every CalVer release) and
// `_checksum` (absent by construction); everything else, including DATA_FORMAT,
// must match.
export function canonicalStarter(artifactText: string): string {
  const data = JSON.parse(artifactText) as Record<string, unknown>;
  delete data.spec_version;
  delete data._checksum;
  return JSON.stringify(sortKeys(data), null, 2) + "\n";
}
