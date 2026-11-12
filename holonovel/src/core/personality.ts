// personality.ts — one reader/writer for entity and NPC personality surfaces.
// [build tool] Shared pure helpers used by the briefing, the personality
// resources, and the character sheet. Exit codes: n/a (library).
//
// REQ-077 (personality fields), REQ-126 (voice-example ordering), REQ-166
// (briefing rendering), REQ-167 (resource shape), REQ-282 (voice directive).

export interface PersonalityFields {
  description?: string;
  voice?: string;
  background?: string;
  goals?: string;
  persona?: string;
}

export interface VoiceExample {
  context: string;
  dialogue: string;
  tag?: string;
  source?: "synthesis" | "codex" | "player-corrected";
  source_url?: string;
}

export const MAX_VOICE_EXAMPLES = 5;

// REQ-077a/d — the entity personality object, with the NPC's top-level
// `persona`/`description` fields folded in so both tiers read one shape.
export function personalityFieldsFor(target: any): PersonalityFields {
  const p = target?.personality ?? {};
  const out: PersonalityFields = {};
  const description = p.description ?? target?.description;
  if (description) out.description = String(description);
  if (p.voice) out.voice = String(p.voice);
  if (p.background) out.background = String(p.background);
  if (p.goals) out.goals = String(p.goals);
  const persona = p.persona ?? target?.persona;
  if (persona) out.persona = String(persona);
  return out;
}

export function hasPersonalityData(target: any): boolean {
  return Object.keys(personalityFieldsFor(target)).length > 0
    || (Array.isArray(target?.voice_examples) && target.voice_examples.length > 0);
}

// REQ-282c — tag filter first: no tag or "neutral" always surfaces; any other
// tag must match an active scene type. The cap applies after filtering.
export function voiceExamplesFor(target: any, activeSceneTypes: readonly string[] = []): VoiceExample[] {
  const list: VoiceExample[] = Array.isArray(target?.voice_examples) ? target.voice_examples : [];
  const active = new Set(activeSceneTypes.map((t) => String(t).toLowerCase()));
  return list
    .filter((ex) => {
      const tag = String(ex?.tag ?? "").toLowerCase();
      if (!tag || tag === "neutral") return true;
      return active.has(tag);
    })
    .slice(0, MAX_VOICE_EXAMPLES);
}

// REQ-344b / REQ-347b / REQ-126b — provenance annotations stay distinct.
export function voiceExampleAnnotation(ex: VoiceExample): string {
  const tag = String(ex?.tag ?? "").toLowerCase();
  if (tag === "player-corrected" || ex?.source === "player-corrected") return " [player-corrected]";
  if (tag === "codex-corrected" || ex?.source === "codex") return " [codex-corrected]";
  if (ex?.source === "synthesis") return ` [supplementary]${ex.source_url ? ` ${ex.source_url}` : ""}`;
  return "";
}

export function renderVoiceExample(ex: VoiceExample): string {
  const tag = ex?.tag ? `[${ex.tag}] ` : "";
  return `- ${tag}"${ex?.dialogue ?? ""}"${voiceExampleAnnotation(ex)}`;
}

// REQ-126/REQ-166a — dialogue examples precede trait descriptions; unset fields
// render no placeholder line. The caller supplies the block header.
export function renderPersonalityBlock(
  name: string,
  fields: PersonalityFields,
  examples: VoiceExample[],
  opts: { npc?: boolean } = {},
): string {
  const lines: string[] = [`**${name}**${opts.npc ? " [NPC]" : ""}`];
  for (const ex of examples) lines.push(renderVoiceExample(ex));
  if (fields.description) lines.push(`**Description:** ${fields.description}`);
  if (fields.voice) lines.push(`**Voice:** ${fields.voice}`);
  if (fields.background) lines.push(`**Background:** ${fields.background}`);
  if (fields.goals) lines.push(`**Goals:** ${fields.goals}`);
  if (fields.persona) lines.push(`**Persona:** ${fields.persona}`);
  return lines.join("\n");
}

// REQ-077a — the array holds up to 5 examples. Refuse an oversized write rather
// than silently dropping authored data.
export function normalizeVoiceExamples(examples: any): { ok: true; examples: VoiceExample[] } | { ok: false; error: string } {
  if (!Array.isArray(examples)) return { ok: false, error: "examples must be an array." };
  if (examples.length > MAX_VOICE_EXAMPLES) {
    return { ok: false, error: `at most ${MAX_VOICE_EXAMPLES} voice examples are allowed; received ${examples.length}.` };
  }
  return { ok: true, examples: examples as VoiceExample[] };
}

// REQ-282a — the directive names the NPC's role; the NPC group has no role
// field of its own in older Novels, so fall back to a plain label.
export function npcRole(npc: any): string {
  const role = npc?.role ?? npc?.stats?.role ?? npc?.role_label;
  return typeof role === "string" && role.trim() ? role.trim() : "NPC";
}

// REQ-282a — a small fixed opposite table keeps the "Avoid:" line deterministic
// instead of inferring an antonym from arbitrary prose.
const VOICE_OPPOSITES: Array<[RegExp, string]> = [
  [/\bformal\b/i, "clipped slang and casual contractions"],
  [/\bclipped\b/i, "long, winding sentences"],
  [/\brambl\w*/i, "terse, one-word answers"],
  [/\bwarm\b/i, "cold, dismissive delivery"],
  [/\bcold\b/i, "warm, reassuring delivery"],
  [/\bgruff\b/i, "soft, polished delivery"],
  [/\bsoft\b/i, "blunt, hard-edged delivery"],
  [/\bslow\b/i, "rushed, hurried speech"],
  [/\bfast\b/i, "slow, deliberate speech"],
];

export function avoidLine(voice: string): string {
  const hit = VOICE_OPPOSITES.find(([re]) => re.test(voice));
  return `Avoid: ${hit ? hit[1] : `speech that is the opposite of "${voice || "the stated voice"}"`}.`;
}
