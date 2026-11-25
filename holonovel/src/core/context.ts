// REQ-661 — pure context resolution. Every context-aware tool action resolves
// exactly one store before acting: novel, codex, roster, reference, or the
// compound `novel+codex` used only by an explicit `target: both`. The resolver
// takes a plain snapshot and imports nothing from the server, so the precedence
// is testable without booting the host.
//
// Rules, in order (D2 of the A2 plan):
//   1 explicit    — a `context`/`target` argument, or an explicit id
//   2 play        — a novel-capable action with a Novel open resolves to it;
//                   with none, a play-scoped action is UNRESOLVED (null) and
//                   the caller returns its existing refusal
//   3 subject     — a subject-scoped action resolves to the roster
//   4 authoring   — authoring with no Novel resolves to the codex
//   5 lookup      — a ruleset lookup resolves to the reference store
//   6 fallback    — codex; `novel` is never the silent fallback

export type ContextKind = "novel" | "codex" | "roster" | "reference" | "novel+codex";

export type ContextScope = "play" | "authoring" | "lookup" | "subject";

export type ContextSource = "explicit" | "play" | "subject" | "authoring" | "lookup" | "fallback";

export interface ResolvedContext {
  kind: ContextKind;
  /** Null for the compound kind, for a fallback with no specific id, and for an open Novel with no slug. */
  id: string | null;
  source: ContextSource;
}

export interface ContextRequest {
  /** An explicit `context`/`target` argument. `kind` wins; an id alone resolves as codex. */
  explicit?: { kind?: ContextKind; id?: string };
  /** The active Novel's slug, or null when no Novel is open. */
  activeNovelSlug?: string | null;
  /** What the action does, from the audit row's descriptor. */
  scope: ContextScope;
  /** True when the action has a meaning inside an open Novel. */
  novelCapable: boolean;
  /** The subject's kind, for a subject-scoped action (defaults to roster). */
  subjectKind?: ContextKind;
  /** The subject's id, when the action names one. */
  subjectId?: string;
}

/** Resolve one store, or null when a play-scoped novel-capable action has no Novel. */
export function resolveContext(request: ContextRequest): ResolvedContext | null {
  const { explicit, activeNovelSlug, scope, novelCapable, subjectKind, subjectId } = request;

  if (explicit && (explicit.kind || explicit.id)) {
    return { kind: explicit.kind ?? "codex", id: explicit.id ?? null, source: "explicit" };
  }

  const novelOpen = typeof activeNovelSlug === "string" && activeNovelSlug.length > 0;
  if (novelCapable && novelOpen) {
    return { kind: "novel", id: activeNovelSlug ?? null, source: "play" };
  }
  if (novelCapable && !novelOpen && scope === "play") {
    return null;
  }

  if (scope === "subject") {
    return { kind: subjectKind ?? "roster", id: subjectId ?? null, source: "subject" };
  }
  if (scope === "authoring") {
    return { kind: "codex", id: null, source: "authoring" };
  }
  if (scope === "lookup") {
    return { kind: "reference", id: null, source: "lookup" };
  }
  return { kind: "codex", id: null, source: "fallback" };
}

// REQ-661 — the printed and structured form of a resolved context. Mirrors
// withSeedWarning (REQ-050a): a JSON-bodied result stays parseable because the
// line rides as a second content block plus a `context` field, never inside the
// first block or `structuredContent.text`.
export interface ContextCarrier {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, any>;
  isError?: true;
}

export function contextLine(ctx: ResolvedContext): string {
  if (ctx.kind === "novel+codex") return `context: ${ctx.kind}`;
  return ctx.id ? `context: ${ctx.kind} (${ctx.id})` : `context: ${ctx.kind}`;
}

export function withContext<T extends ContextCarrier>(
  result: T,
  ctx: ResolvedContext | null,
  opts: { textBlock?: boolean } = {},
): T {
  if (!ctx) return result;
  if (result.isError) return result;
  if (result.structuredContent?.context) return result;
  // A JSON-bodied result keeps its text block byte-verbatim (REQ-001): the
  // context line would make the body unparseable, so those call sites pass
  // `textBlock: false` and the store rides in `structuredContent.context`.
  if (opts.textBlock !== false) {
    result.content = [...result.content, { type: "text" as const, text: contextLine(ctx) }];
  }
  if (result.structuredContent) {
    result.structuredContent.context = { kind: ctx.kind, id: ctx.id, source: ctx.source };
  }
  return result;
}
