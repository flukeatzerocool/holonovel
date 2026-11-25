export { expandMacros } from "./macros.js";
export type { MacroContext } from "./macros.js";
export { StateManager, normalizeBadge, migrateNovelData, NOVEL_FORMAT_VERSION } from "./state.js";
export type {
  Badge,
  NovelState,
  NovelEntity,
  NpcState,
  LoreEntry,
  Countdown,
  CombatState,
  AuditEntry,
} from "./state.js";
export {
  MUTATING_READ_ACTIONS,
  OBSERVER_DENY_ACTIONS,
  PROMPT_GATE,
  RESOURCE_GATE,
  actionKey,
  badgeRefusalFor,
  observerActionAllowed,
  promptAllowed,
  promptRefusalFor,
  resourceAllowed,
  toolObserverVisible,
} from "./badge-gate.js";
export type { BadgeLike, ToolAnnotationsLike } from "./badge-gate.js";
export {
  AUDIT_CAP_EXEMPT_ACTIONS,
  appendsAuditEntry,
  capacityRefusal,
} from "./audit-gate.js";
export {
  initServer,
  getBadge,
  requireGM,
  requirePlayer,
  requireNotObserver,
  requireNovel,
  novelSnapshot,
  withForbiddenAudit,
} from "./server.js";
export type { ToolCtx, ToolHandler } from "./server.js";
export { DEFAULT_WISDOM } from "./wisdom.js";
export type {
  WisdomItem,
  ActionPattern,
  WisdomManifest,
  NarrativeVoice,
} from "./wisdom.js";
export { buildArtifactRegistry, registryCounts } from "./artifact-registry.js";
export type { ArtifactEntry, ArtifactKind, ArtifactIntegrity, RegistrySources } from "./artifact-registry.js";
export { parseAdventureProvenance, verifyAdventureProvenance, provenanceSummary } from "./adventure-provenance.js";
export type { AdventureProvenance } from "./adventure-provenance.js";
export { resolveInboxDir } from "./data-dir.js";
export {
  resolveContext,
  withContext,
  contextLine,
} from "./context.js";
export type {
  ContextKind,
  ContextScope,
  ContextSource,
  ContextRequest,
  ResolvedContext,
  ContextCarrier,
} from "./context.js";
export { CONTEXT_AUDIT, descriptorFor } from "./context-audit.js";
export type { AuditRow, AuditClass, AuditDisposition, ContextDescriptor } from "./context-audit.js";
