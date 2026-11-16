/**
 * publish-state.ts — render a publication run record for the release status.
 * [build tool]
 *
 * REQ-418's recorded run is the only durable evidence of how far a publication
 * reached. The record itself is written by `scripts/publish/run.ts`; this module
 * turns it into one honest line so `npm run status` cannot present a dry run as
 * a publish. It reads no network and no registry — the registry is checked by
 * the pipeline's own `registry` step, not by a status report.
 *
 * Exit codes: n/a (library).
 */

export interface PublishRecord {
  schema_version?: number;
  started?: string;
  head?: string;
  /** Present on records written since 2026-11-16. */
  dry_run?: boolean;
  /** The furthest step the record reached. */
  stopped_at?: string;
  steps?: Array<{ id?: string; status?: string }>;
}

/**
 * Describe a run record without overclaiming.
 *
 * - `never recorded` when there is no record.
 * - `dry run, stopped at <step>` when the run was started with `--dry-run`.
 * - `pipeline run, stopped at <step>` otherwise.
 *
 * The step is the record's own `stopped_at`; an older record without it falls
 * back to its last recorded step, and a record with neither reports `start`.
 */
export function describePublishRun(record: PublishRecord | null | undefined): string {
  if (!record) return "never recorded";
  const step = record.stopped_at ?? record.steps?.at(-1)?.id ?? "start";
  const kind = record.dry_run === true ? "dry run" : "pipeline run";
  const started = record.started ? `, started ${record.started}` : "";
  return `${kind}, stopped at ${step}${started}`;
}
