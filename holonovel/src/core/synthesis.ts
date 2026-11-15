// §11.2 internal synthesis — deterministic Novel-state analysis.
//
// REQ-262a/b — the run pass and its `synthesis_fingerprint`; REQ-264a — the
// confidence model; REQ-130a/b — activated items survive re-synthesis; §11.3 —
// per-pass and total-Novel budgets, `[LOW]` confidence, partial refresh by
// per-module hash, and `[empty]` markers.
//
// Everything here is a pure function of (Novel state, manifest, caps): no
// wall-clock value enters a hash, and item order is a sorted order, so two runs
// over the same state produce byte-identical output.

import crypto from "node:crypto";
import { canonicalJson } from "./state-hash.js";
import { DEFAULT_WISDOM, withWisdomKeys } from "./wisdom.js";
import { groupCaps } from "./limits.js";

// §11.3 — the seven output modules, in the documented order.
export const SYNTHESIS_MODULES = [
  "voice_examples",
  "briefing_order",
  "lore_templates",
  "action_patterns",
  "supplementary_guidance",
  "adventure_advice",
  "narrative_voices",
] as const;

export type SynthesisModule = (typeof SYNTHESIS_MODULES)[number];

export function isSynthesisModule(value: string): value is SynthesisModule {
  return (SYNTHESIS_MODULES as readonly string[]).includes(value);
}

// §11.3 budgets — "Internal per-pass cap" column. `voice_examples` is per NPC
// (three snippets each); every other module is a count of new items per pass.
export const SYNTHESIS_PER_PASS_CAP: Record<SynthesisModule, number> = {
  voice_examples: 3,
  briefing_order: 1,
  lore_templates: 5,
  action_patterns: 5,
  supplementary_guidance: 10,
  adventure_advice: 8,
  narrative_voices: 1,
};

// §11.3 budgets — "Total Novel cap" column.
export const SYNTHESIS_TOTAL_CAP: Record<SynthesisModule, number> = {
  voice_examples: 50,
  briefing_order: 1,
  lore_templates: 30,
  action_patterns: 10,
  supplementary_guidance: 20,
  adventure_advice: 30,
  narrative_voices: 15,
};

// Rule 8's combined per-pass budget across two output modules (§11.2.8).
const ROOMS_THINGS_PASS_CAP = 3;

// The projection keys each module reads. A module's source hash covers only
// these, which is what makes partial refresh meaningful (§11.3).
const MODULE_SOURCE_KEYS: Record<SynthesisModule, string[]> = {
  voice_examples: ["entities", "npcs"],
  briefing_order: ["scene", "journal"],
  lore_templates: ["lore", "npcs", "factions", "rooms", "things"],
  action_patterns: ["npcs", "scene"],
  supplementary_guidance: ["npcs", "journal", "factions", "secrets", "relationships", "countdowns"],
  adventure_advice: ["journal", "scenes", "countdowns", "rooms", "things"],
  narrative_voices: ["journal"],
};

function sha(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function slug(value: string): string {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
}

// A synthesis item is internal when its source is the Novel itself. Build
// output (vendor, ruleset, player-authored, untagged) is never internal, so the
// caps and the persistence boundary key on this predicate rather than on `tag`
// — `DEFAULT_WISDOM.action_patterns` carries no tag at all.
export function isInternalSynthesisItem(item: any): boolean {
  return String(item?.source_url ?? "").startsWith("novel://");
}

function sortedEntities(novel: any): Array<[string, any]> {
  return [...((novel?.entities ?? new Map()) as Map<string, any>).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function sortedNpcs(novel: any): Array<[string, any]> {
  return [...((novel?.npcs ?? new Map()) as Map<string, any>).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function sortedLore(novel: any): Array<[string, any]> {
  return [...((novel?.lore ?? new Map()) as Map<string, any>).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function sortedCountdowns(novel: any): Array<[string, any]> {
  return [...((novel?.countdowns ?? new Map()) as Map<string, any>).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function sortedRooms(novel: any): Array<[string, any]> {
  return [...((novel?.world?.rooms ?? new Map()) as Map<string, any>).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function sortedThings(novel: any): Array<[string, any]> {
  return [...((novel?.world?.things ?? new Map()) as Map<string, any>).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function personalityOf(target: any): any {
  const p = target?.personality ?? {};
  return {
    description: p.description ?? target?.description ?? "",
    voice: p.voice ?? "",
    goals: p.goals ?? "",
    background: p.background ?? "",
    persona: p.persona ?? "",
  };
}

// Canonical, order-stable projection of the state internal synthesis reads.
// Bookkeeping (audit, event log, counters, timestamps) is deliberately absent so
// narration activity alone never invalidates synthesis.
export interface SynthesisProjection {
  scene: { description: string; location: string; time_of_day: string; atmosphere: string; type: string[]; beat: string };
  entities: Array<[string, string, any]>;
  npcs: Array<[string, string, any, string, string[]]>;
  lore: Array<[string, string, string[], string, string, string]>;
  journal: Array<{ type: string; entry: string; scene_anchor: string; entity_ids: string[] }>;
  scenes: Array<{ anchor: string; description: string; location: string; atmosphere: string }>;
  factions: Array<{ id: string; name: string; description: string; goals: string[]; status: string; clock: number; clock_max: number }>;
  secrets: Array<{ key: string; content: string; known_by: string[] }>;
  relationships: Array<{ a: string; b: string; type: string; description: string }>;
  countdowns: Array<{ name: string; ticks: number; total: number; type: string; scope: string; direction: string }>;
  rooms: Array<{ name: string; description: string; exits: Array<[string, string]>; contents: string[] }>;
  things: Array<{ name: string; description: string; read_text: string; readable: boolean; location: string }>;
}

export function synthesisProjection(novel: any): SynthesisProjection {
  return {
    scene: {
      description: novel?.scene_description ?? "",
      location: novel?.scene_location ?? "",
      time_of_day: novel?.scene_time_of_day ?? "",
      atmosphere: novel?.scene_atmosphere ?? "",
      type: [...(novel?.scene_type ?? [])].sort(),
      beat: novel?.scene_beat ?? "",
    },
    entities: sortedEntities(novel).map(([id, e]) => [id, e?.name ?? id, personalityOf(e)]),
    npcs: sortedNpcs(novel).map(([id, n]) => [
      id,
      n?.name ?? id,
      personalityOf(n),
      String(n?.disposition ?? ""),
      (n?.goals ?? []).length ? [...(n.goals as any[])].map((g: any) => String(g?.text ?? g)).sort() : [],
    ]),
    lore: sortedLore(novel).map(([k, l]) => [k, l?.content ?? "", [...(l?.triggers ?? [])].sort(), l?.group ?? "", l?.badge_scope ?? "", l?.visibility ?? ""]),
    journal: (novel?.story_journal ?? []).slice(-10).map((s: any) => ({
      type: s?.type ?? "",
      entry: s?.entry ?? "",
      scene_anchor: s?.scene_anchor ?? "",
      entity_ids: [...(s?.entity_ids ?? [])].sort(),
    })),
    scenes: [...new Set<string>((novel?.scene_history ?? []).map((s: any) => String(s?.scene_anchor ?? s?.location ?? s?.timestamp ?? "")).filter(Boolean))]
      .sort()
      .map((anchor) => {
        const s = (novel?.scene_history ?? []).find((x: any) => String(x?.scene_anchor ?? x?.location ?? x?.timestamp ?? "") === anchor) ?? {};
        return { anchor, description: s?.description ?? "", location: s?.location ?? "", atmosphere: s?.atmosphere ?? "" };
      }),
    factions: [...(novel?.factions ?? [])]
      .map((f: any) => ({ id: String(f?.id ?? ""), name: String(f?.name ?? ""), description: String(f?.description ?? ""), goals: [...(f?.goals ?? [])].map(String).sort(), status: String(f?.status ?? ""), clock: Number(f?.clock ?? 0), clock_max: Number(f?.clock_max ?? 0) }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    secrets: [...(novel?.secrets ?? [])]
      .map((s: any) => ({ key: String(s?.key ?? ""), content: String(s?.content ?? ""), known_by: [...(s?.known_by ?? [])].sort() }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)),
    relationships: [...(novel?.relationships ?? [])]
      .map((r: any) => ({ a: String(r?.entity_a ?? ""), b: String(r?.entity_b ?? ""), type: String(r?.type ?? ""), description: String(r?.description ?? "") }))
      .sort((x, y) => (`${x.a}|${x.b}` < `${y.a}|${y.b}` ? -1 : `${x.a}|${x.b}` > `${y.a}|${y.b}` ? 1 : 0)),
    countdowns: sortedCountdowns(novel).map(([name, c]) => ({ name, ticks: Number(c?.ticks ?? 0), total: Number(c?.total ?? 0), type: c?.type ?? "", scope: c?.scope ?? "", direction: c?.direction ?? "" })),
    rooms: sortedRooms(novel).map(([name, r]) => ({
      name,
      description: String(r?.description ?? ""),
      exits: [...((r?.exits ?? new Map()) as Map<string, string>).entries()].sort(([a], [b]) => (a < b ? -1 : 1)),
      contents: [...((novel?.world?.things ?? new Map()) as Map<string, any>).entries()].filter(([, t]) => String(t?.location ?? "") === name).map(([n]) => n).sort(),
    })),
    things: sortedThings(novel).map(([name, t]) => ({
      name,
      description: String(t?.description ?? ""),
      read_text: String(t?.read_text ?? ""),
      readable: !!t?.readable,
      location: String(t?.location ?? ""),
    })),
  };
}

export function synthesisModuleSourceHashes(novel: any): Record<string, string> {
  const projection = synthesisProjection(novel) as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const module of SYNTHESIS_MODULES) {
    const subset: Record<string, unknown> = {};
    for (const key of MODULE_SOURCE_KEYS[module]) subset[key] = projection[key];
    out[module] = sha(canonicalJson(subset));
  }
  return out;
}

// REQ-262b/§11.3 — the runtime-observable synthesis configuration. The E1–E4
// intake answers are build-time answers with no runtime representation, so the
// intake component is the configuration that actually changes synthesis output.
export function synthesisIntakeMarker(): string {
  return canonicalJson({
    auto_trigger: String(process.env.TTRPG_SYNTHESIS_AUTO_TRIGGER ?? "off").trim(),
    max_items: groupCaps().synthesis.max,
    stale_days: String(process.env.TTRPG_SYNTHESIS_STALE_DAYS ?? "90").trim(),
  });
}

// §11.3 idempotence — root hash over the ruleset content hash, the intake
// marker and the Novel-state hash. The specification version is excluded so a
// spec-only update does not invalidate valid synthesis.
export function synthesisFingerprint(rulesetHash: string, novel: any): string {
  const novelHash = sha(canonicalJson(synthesisProjection(novel)));
  return sha(`syn1|${rulesetHash}|${synthesisIntakeMarker()}|${novelHash}`);
}

// The effective total cap: the smaller of §11.3's total-Novel cap and the
// REQ-129b1 storage cap. A zero storage cap disables synthesis entirely, which
// the handler refuses before any work.
export function effectiveTotalCap(module: SynthesisModule): number {
  const storage = groupCaps().synthesis.max;
  const spec = SYNTHESIS_TOTAL_CAP[module];
  if (storage <= 0) return 0;
  return Math.min(spec, storage);
}

function moduleArray(manifest: any, module: SynthesisModule): any[] {
  if (module === "adventure_advice") {
    manifest.adventure_advice ??= {};
    manifest.adventure_advice.scenario_starters ??= [];
    return manifest.adventure_advice.scenario_starters;
  }
  if (module === "briefing_order") return [];
  manifest[module] ??= [];
  return manifest[module];
}

function item(module: SynthesisModule, key: string, content: string, confidence: "MEDIUM" | "LOW", source: string, extra: Record<string, any> = {}): any {
  return {
    key,
    module,
    content,
    ...(extra.category ? { category: extra.category } : {}),
    source_url: `novel://${source}`,
    confidence,
    tag: "supplementary",
    badge_scope: "game_master",
    collected_at: new Date().toISOString(),
    ...extra,
  };
}

// §11.2 rules 1–8. Each rule reads only the projection and emits deterministic
// keys, so a re-run over the same state replaces rather than duplicates.
function novelDerivedItems(novel: any): Record<string, any[]> {
  const projection = synthesisProjection(novel);
  const slugOf = String(novel?.slug ?? "novel");
  const out: Record<string, any[]> = Object.fromEntries(SYNTHESIS_MODULES.map((m) => [m, []] as [string, any[]]));

  // Rule 1 — NPC (and entity) personality → voice examples, three snippets per
  // NPC drawn from voice and description.
  for (const [id, name, personality] of projection.npcs) {
    const text = [personality.voice, personality.description].filter(Boolean).join(". ");
    if (!text) continue;
    const snippets = String(text).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, SYNTHESIS_PER_PASS_CAP.voice_examples);
    out.voice_examples.push(item("voice_examples", `novel-voice-${slug(id)}`, `${name}: ${snippets.join(" ")}`, "MEDIUM", `${slugOf}/npc/${id}`, { context: "npc-voice" }));
  }
  for (const [id, name, personality] of projection.entities) {
    const text = [personality.voice, personality.description].filter(Boolean).join(". ");
    if (!text) continue;
    const snippets = String(text).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, SYNTHESIS_PER_PASS_CAP.voice_examples);
    out.voice_examples.push(item("voice_examples", `novel-voice-${slug(id)}`, `${name}: ${snippets.join(" ")}`, "MEDIUM", `${slugOf}/entity/${id}`, { context: "entity-voice" }));
  }

  // Rule 2 — more than five NPCs → one spotlight recommendation (inference).
  if (projection.npcs.length > 5) {
    const journalText = projection.journal.map((j) => j.entry).join(" ").toLowerCase();
    const sceneText = [projection.scene.description, projection.scene.atmosphere].join(" ").toLowerCase();
    const unreferenced = projection.npcs.filter(([, name]) => name && !journalText.includes(String(name).toLowerCase())).map(([, name]) => String(name));
    const intersects = projection.npcs.filter(([, name, p]) => String(p.goals ?? "").split(/\s+/).some((w) => w.length > 3 && sceneText.includes(w.toLowerCase()))).map(([, name]) => String(name));
    const parts: string[] = [];
    if (unreferenced.length) parts.push(`Not yet referenced recently: ${unreferenced.slice(0, 5).join(", ")}`);
    if (intersects.length) parts.push(`Goals intersecting the current scene: ${intersects.slice(0, 5).join(", ")}`);
    if (parts.length) out.supplementary_guidance.push(item("supplementary_guidance", "novel-npc-spotlight", `NPC spotlight — ${parts.join("; ")}.`, "LOW", `${slugOf}/npcs`));
  }

  // Rule 3 — lore name overlap with NPCs, factions or other lore → a connecting
  // template (explicit fields), up to the per-pass cap.
  const nameSources: Array<{ name: string; kind: string }> = [
    ...projection.npcs.map(([, name]) => ({ name: String(name ?? ""), kind: "NPC" })),
    ...projection.factions.map((f) => ({ name: f.name, kind: "faction" })),
    ...projection.lore.map(([key]) => ({ name: key.replace(/[-_]+/g, " "), kind: "lore" })),
  ].filter((s) => s.name.length > 2);
  const links: any[] = [];
  for (const [key, content] of projection.lore) {
    if (links.length >= SYNTHESIS_PER_PASS_CAP.lore_templates) break;
    const lower = `${key} ${content}`.toLowerCase();
    const matches = nameSources.filter((s) => s.name.toLowerCase() !== key.toLowerCase() && lower.includes(s.name.toLowerCase())).slice(0, 3);
    if (matches.length === 0) continue;
    links.push(item("lore_templates", `novel-lore-link-${slug(key)}`, `Lore "${key}" shares a name with ${matches.map((m) => `${m.kind} "${m.name}"`).join(", ")} — connect them with a shared relationship or a single narrative arc.`, "MEDIUM", `${slugOf}/lore/${key}`, { triggers: [slug(key)] }));
  }
  out.lore_templates.push(...links);

  // Rule 4 — the last ten journal entries → one narrative voice profile, plus
  // the recurring-theme guidance item the harness pins as `novel-theme`.
  const journal = projection.journal;
  if (journal.length > 0) {
    const themes: Record<string, RegExp> = {
      betrayal: /\b(betray\w*|treason|deceiv\w*)\b/i,
      discovery: /\b(discover\w*|reveal\w*|uncover\w*|found)\b/i,
      sacrifice: /\b(sacrific\w*|gave up|paid the price)\b/i,
      alliance: /\b(ally|alliance|pact|oath|bargain)\b/i,
    };
    const found = Object.entries(themes).filter(([, re]) => journal.some((j) => re.test(String(j.entry ?? "")))).map(([name]) => name).sort();
    const tone = journal[journal.length - 1]?.type ?? "moment";
    const themeList = found.length ? found.join(", ") : "no repeated theme yet";
    out.narrative_voices.push(item("narrative_voices", "novel-voice-profile", "Novel Voice", "LOW", `${slugOf}/story_journal`, {
      name: `Novel Voice — ${found.length ? found.join(" and ") : "unsettled"}`,
      media_title: String(novel?.name ?? "Novel"),
      media_type: "other",
      description: `A voice synthesised from the last ${journal.length} journal entries: recurring themes ${themeList}, closing on a ${tone} beat. Prefer consequence-forward framing and keep revelations tied to what the player already did.`,
    }));
    out.supplementary_guidance.push(item("supplementary_guidance", "novel-theme", `Recurring theme from the story journal: ${journal[journal.length - 1].entry}`, "LOW", `${slugOf}/story_journal`));
  }

  // Rule 5 — three or more distinct scene anchors → one hook per unresolved
  // thread: a `decision` with no matching `consequence`, or an un-triggered lore
  // keyword. Capped at the adventure-advice per-pass budget.
  if (projection.scenes.length >= 3) {
    const all = (novel?.story_journal ?? []).slice(-10) as any[];
    const hooks: any[] = [];
    for (const entry of all) {
      if (hooks.length >= SYNTHESIS_PER_PASS_CAP.adventure_advice) break;
      if (entry?.type !== "decision") continue;
      const ids = [...(entry?.entity_ids ?? [])].map(String).sort();
      const resolved = all.some((later) => later?.type === "consequence" && ids.length > 0 && [...(later?.entity_ids ?? [])].map(String).sort().some((id) => ids.includes(id)));
      if (resolved) continue;
      hooks.push(item("adventure_advice", `novel-hook-decision-${Number(entry?.index ?? hooks.length)}`, `Unresolved thread — "${String(entry?.entry ?? "").slice(0, 160)}" has no consequence yet. Stage a scene where it lands.`, "LOW", `${slugOf}/story_journal/${Number(entry?.index ?? 0)}`, { category: "scenario_starters" }));
    }
    const recentText = [projection.scene.description, ...projection.journal.map((j) => j.entry), ...projection.scenes.map((s) => s.description)].join(" ").toLowerCase();
    for (const [key, , triggers] of projection.lore) {
      if (hooks.length >= SYNTHESIS_PER_PASS_CAP.adventure_advice) break;
      const fired = triggers.some((t) => t.length > 2 && recentText.includes(String(t).toLowerCase()));
      if (fired || triggers.length === 0) continue;
      hooks.push(item("adventure_advice", `novel-hook-lore-${slug(key)}`, `Un-triggered lore "${key}" — its triggers (${triggers.join(", ")}) have not appeared in recent scenes. Give one a scene to fire in.`, "LOW", `${slugOf}/lore/${key}`, { category: "scenario_starters" }));
    }
    out.adventure_advice.push(...hooks);
  }

  // Rule 6 — factions + secrets + relationships → tension notes (explicit
  // fields, MEDIUM).
  const factionNames = new Map(projection.factions.map((f) => [f.id, f.name] as [string, string]));
  for (const secret of projection.secrets) {
    if (out.supplementary_guidance.length >= SYNTHESIS_PER_PASS_CAP.supplementary_guidance) break;
    const holders = secret.known_by.filter((id) => factionNames.has(id)).map((id) => factionNames.get(id)!);
    if (holders.length >= 2) {
      out.supplementary_guidance.push(item("supplementary_guidance", `novel-tension-secret-${slug(secret.key)}`, `Tension — ${holders.join(" and ")} both know secret "${secret.key}". Neither can move openly without exposing it.`, "MEDIUM", `${slugOf}/secret/${secret.key}`));
    } else if (holders.length === 0) {
      out.supplementary_guidance.push(item("supplementary_guidance", `novel-reveal-${slug(secret.key)}`, `Revelation opportunity — secret "${secret.key}" has no known holder. Stage the moment someone learns it.`, "LOW", `${slugOf}/secret/${secret.key}`));
    }
  }
  for (const rel of projection.relationships) {
    if (out.supplementary_guidance.length >= SYNTHESIS_PER_PASS_CAP.supplementary_guidance) break;
    if (rel.type !== "hostile" && rel.type !== "suspicious") continue;
    const hasSecret = projection.secrets.some((s) => s.known_by.includes(rel.a) || s.known_by.includes(rel.b) || String(s.content ?? "").includes(rel.a) || String(s.content ?? "").includes(rel.b));
    if (hasSecret) continue;
    out.supplementary_guidance.push(item("supplementary_guidance", `novel-secret-suggestion-${slug(rel.a)}-${slug(rel.b)}`, `Create a secret — ${rel.a} and ${rel.b} are ${rel.type} with no secret between them.`, "LOW", `${slugOf}/relationship/${slug(rel.a)}/${slug(rel.b)}`));
  }

  // Rule 7 — countdowns → urgency and linked-clock tension; no countdowns with
  // active factions → a countdown suggestion.
  for (const clock of projection.countdowns) {
    if (out.supplementary_guidance.length >= SYNTHESIS_PER_PASS_CAP.supplementary_guidance) break;
    if (clock.ticks === 1) {
      out.supplementary_guidance.push(item("supplementary_guidance", `novel-urgency-${slug(clock.name)}`, `Urgency — countdown "${clock.name}" has one tick left (${clock.ticks}/${clock.total}).`, "MEDIUM", `${slugOf}/countdown/${slug(clock.name)}`));
    }
  }
  for (let i = 0; i < projection.countdowns.length; i++) {
    for (let j = i + 1; j < projection.countdowns.length; j++) {
      if (out.supplementary_guidance.length >= SYNTHESIS_PER_PASS_CAP.supplementary_guidance) break;
      const a = projection.countdowns[i];
      const b = projection.countdowns[j];
      const shared = (a.scope && a.scope === b.scope) || (a.direction && a.direction === b.direction);
      if (!shared) continue;
      out.supplementary_guidance.push(item("supplementary_guidance", `novel-tension-clock-${slug(a.name)}-${slug(b.name)}`, `Tension — "${a.name}" and "${b.name}" share a ${a.scope && a.scope === b.scope ? "scope" : "direction"}; advancing one should press the other.`, "LOW", `${slugOf}/countdown`));
    }
  }
  if (projection.countdowns.length === 0 && projection.factions.length > 0 && out.supplementary_guidance.length < SYNTHESIS_PER_PASS_CAP.supplementary_guidance) {
    out.supplementary_guidance.push(item("supplementary_guidance", "novel-countdown-suggestion", `No countdowns are running while ${projection.factions.length} faction(s) are active. Set one to give their goals a clock.`, "LOW", `${slugOf}/countdowns`));
  }

  // Rule 8 — rooms + things. A connected room graph of three or more rooms gives
  // one scene hook per room; a readable/described thing naming a proper noun
  // gives a lore template. Combined cap: three items per pass.
  let roomsProduced = 0;
  if (projection.rooms.length >= 3) {
    const connected = new Set<string>();
    for (const room of projection.rooms) for (const [, target] of room.exits) connected.add(`${room.name}->${target}`);
    if (connected.size >= projection.rooms.length - 1) {
      for (const room of projection.rooms) {
        if (roomsProduced >= ROOMS_THINGS_PASS_CAP) break;
        if (out.adventure_advice.length >= SYNTHESIS_PER_PASS_CAP.adventure_advice) break;
        const exits = room.exits.map(([dir, target]) => `${dir} to ${target}`);
        out.adventure_advice.push(item("adventure_advice", `novel-room-hook-${slug(room.name)}`, `${room.name}${exits.length ? ` (${exits.join(", ")})` : ""} — ${room.description || "a place with more than one way out"}. A confrontation here closes ${exits.length} path(s).`, "MEDIUM", `${slugOf}/world/room/${slug(room.name)}`, { category: "scenario_starters" }));
        roomsProduced++;
      }
    }
  }
  for (const thing of projection.things) {
    if (roomsProduced >= ROOMS_THINGS_PASS_CAP) break;
    const text = [thing.read_text, thing.readable ? thing.description : "", thing.description].filter(Boolean).join(" ");
    const proper = [...new Set((text.match(/\b[A-Z][a-z]{2,}\b/g) ?? []).filter((w) => !["The", "This", "That", "You"].includes(w)))];
    if (proper.length === 0 || !thing.location) continue;
    out.lore_templates.push(item("lore_templates", `novel-thing-lore-${slug(thing.name)}`, `"${thing.name}" in ${thing.location} names ${proper.slice(0, 3).join(", ")} — seed a lore entry tying them to the room.`, "MEDIUM", `${slugOf}/world/thing/${slug(thing.name)}`, { triggers: [slug(thing.name)] }));
    roomsProduced++;
  }

  return out;
}

function dedupeByKey(items: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const entry of items) {
    const key = String(entry?.key ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

export interface SynthesisPassResult {
  manifest: any;
  up_to_date: boolean;
  fingerprint: string;
  module_hashes: Record<string, string>;
  per_module: Array<{ module: string; produced: number; preserved: number; replaced: number; total: number; overflow: number }>;
  empty: Record<string, string>;
  overflow: number;
}

// §11.3 partial refresh + REQ-130b preservation. A module whose source hash is
// unchanged is left byte-identical; a changed module keeps its activated items
// and replaces only the inactive internal ones.
export function synthesizeFromNovel(manifestIn: any, novel: any, opts: { force?: boolean; rulesetHash?: string } = {}): SynthesisPassResult {
  const manifest = manifestIn ?? withWisdomKeys(DEFAULT_WISDOM);
  const module_hashes = synthesisModuleSourceHashes(novel);
  const fingerprint = synthesisFingerprint(String(opts.rulesetHash ?? "ruleset-free"), novel);
  const per_module: SynthesisPassResult["per_module"] = [];
  const empty: Record<string, string> = {};

  if (!opts.force && manifest._fingerprint && manifest._fingerprint === fingerprint) {
    for (const module of SYNTHESIS_MODULES) {
      per_module.push({ module, produced: 0, preserved: moduleArray(manifest, module).filter(isInternalSynthesisItem).length, replaced: 0, total: moduleArray(manifest, module).length, overflow: 0 });
    }
    return { manifest, up_to_date: true, fingerprint, module_hashes, per_module, empty: manifest._empty ?? {}, overflow: 0 };
  }

  const fresh = novelDerivedItems(novel);
  const activated = (novel?.synthesis_activated ?? {}) as Record<string, string[]>;
  let overflowTotal = 0;

  for (const module of SYNTHESIS_MODULES) {
    const live = moduleArray(manifest, module);
    const priorInternal = live.filter(isInternalSynthesisItem);
    const untouched = manifest._module_hashes?.[module] && manifest._module_hashes[module] === module_hashes[module] && !opts.force;
    let produced = 0;
    let replaced = 0;
    let preserved = 0;

    if (untouched) {
      preserved = priorInternal.length;
      if (live.length === 0 && fresh[module].length === 0) {
        empty[module] = projectionHasData(novel, module) ? "no synthesizable state" : "no state";
      }
    } else {
      const activeKeys = new Set(activated[module] ?? []);
      const keptActive = priorInternal.filter((entry) => activeKeys.has(String(entry.key)));
      const external = live.filter((entry) => !isInternalSynthesisItem(entry));
      const cap = effectiveTotalCap(module);
      const passCap = SYNTHESIS_PER_PASS_CAP[module];
      const candidates = dedupeByKey([...keptActive, ...fresh[module].filter((entry) => !activeKeys.has(String(entry.key)))]);
      const keptByHead = candidates.slice(0, Math.max(0, passCap + keptActive.length));
      const capped = cap > 0 ? keptByHead.slice(0, cap) : keptByHead;
      produced = Math.max(0, capped.length - keptActive.length);
      replaced = priorInternal.length - keptActive.length;
      preserved = keptActive.length;
      const overflow = Math.max(0, keptByHead.length - capped.length);
      overflowTotal += overflow;
      const next = dedupeByKey([...external, ...capped]);
      if (next.length === 0) empty[module] = projectionHasData(novel, module) ? "no synthesizable state" : "no state";
      if (module === "adventure_advice") manifest.adventure_advice.scenario_starters = next;
      else manifest[module] = next;
      per_module.push({ module, produced, preserved, replaced, total: next.length, overflow });
      continue;
    }
    per_module.push({ module, produced, preserved, replaced, total: live.length, overflow: 0 });
  }

  manifest.collected_at = new Date().toISOString();
  manifest._fingerprint = fingerprint;
  manifest._module_hashes = module_hashes;
  manifest._empty = empty;
  return { manifest, up_to_date: false, fingerprint, module_hashes, per_module, empty, overflow: overflowTotal };
}

function projectionHasData(novel: any, module: SynthesisModule): boolean {
  const projection = synthesisProjection(novel) as unknown as Record<string, unknown>;
  return MODULE_SOURCE_KEYS[module].some((key) => {
    const value = projection[key];
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.values(value).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
    return false;
  });
}

// The Novel-side store (§11.3 "stored in the Novel JSON under a `synthesis`
// key"): internal items only, plus the hashes that make re-runs cheap. Vendor
// and ruleset content is build output and never enters this shape (REQ-080).
export function persistedSynthesis(manifest: any): any {
  if (!manifest) return null;
  const modules: Record<string, any[]> = {};
  for (const module of SYNTHESIS_MODULES) modules[module] = moduleArray(manifest, module).filter(isInternalSynthesisItem);
  return {
    fingerprint: manifest._fingerprint ?? null,
    module_hashes: manifest._module_hashes ?? {},
    empty: manifest._empty ?? {},
    collected_at: manifest.collected_at ?? null,
    modules,
  };
}

// Hydration and merge order: rebuild the build-time tier first (vendor content
// is current by definition), then re-merge the persisted internal items. Vendor
// items are never read back from the Novel, so a ruleset bind cannot be
// shadowed by a stale persisted copy.
export function hydrateSynthesisManifest(novel: any): { manifest: any; enriched: boolean } {
  const stored = novel?.synthesis;
  if (!stored) return { manifest: null, enriched: false };
  const manifest: any = withWisdomKeys(DEFAULT_WISDOM);
  manifest._fingerprint = stored.fingerprint ?? null;
  manifest._module_hashes = stored.module_hashes ?? {};
  manifest._empty = stored.empty ?? {};
  if (stored.collected_at) manifest.collected_at = stored.collected_at;
  for (const module of SYNTHESIS_MODULES) {
    const persisted = Array.isArray(stored.modules?.[module]) ? stored.modules[module].filter(isInternalSynthesisItem) : [];
    if (persisted.length === 0) continue;
    const live = moduleArray(manifest, module);
    const external = live.filter((entry) => !isInternalSynthesisItem(entry));
    const next = dedupeByKey([...external, ...persisted]);
    if (module === "adventure_advice") manifest.adventure_advice.scenario_starters = next;
    else manifest[module] = next;
  }
  return { manifest, enriched: true };
}

// REQ-129c — the synthesis group's count, maximum and overflow, plus the
// per-module detail the §11.3 budgets need.
export function synthesisCapStatus(manifest: any): { count: number; max: number; overflow: boolean; modules: Record<string, { count: number; max: number; overflow: boolean }> } {
  const storage = groupCaps().synthesis.max;
  const modules: Record<string, { count: number; max: number; overflow: boolean }> = {};
  let count = 0;
  let max = 0;
  let overflow = false;
  for (const module of SYNTHESIS_MODULES) {
    const n = manifest ? moduleArray(manifest, module).filter(isInternalSynthesisItem).length : 0;
    const cap = effectiveTotalCap(module);
    const over = cap > 0 && n >= cap;
    modules[module] = { count: n, max: cap, overflow: over };
    count += n;
    max += cap;
    overflow = overflow || over;
  }
  return { count, max: storage <= 0 ? 0 : max, overflow: overflow || (storage <= 0 && count > 0), modules };
}
