export { expandMacros } from "./macros.js";
export type { MacroContext } from "./macros.js";
export { StateManager, normalizeBadge, migrateNovelData } from "./state.js";
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
export { DEFAULT_ENRICHMENT } from "./enrichment.js";
export type {
  EnrichmentItem,
  ActionPattern,
  EnrichmentManifest,
  NarrativeVoice,
} from "./enrichment.js";
