// Adventure module structure extraction (REQ-247b1, REQ-247b2, REQ-248, REQ-249)
// and generated-adventure world synthesis (REQ-132c, REQ-132d). Pure: one
// parser feeds load, the catalog, the overview/navigation and per-anchor
// resources, search, and the build-time index so the surfaces cannot drift.

import { deriveAnchor } from "./anchors.js";

export type AdventureConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface AdventureSection {
  heading: string;
  anchor: string;
  depth: number;
  gm_only: boolean;
  body: string;
  /** 1-based source line of the heading and of the last body line. */
  line: number;
  endLine: number;
}

export interface AdventureNpc {
  name: string;
  description?: string;
  role?: string;
  confidence: AdventureConfidence;
  notes?: string;
  gm_only?: boolean;
}

export interface AdventureLocation {
  name: string;
  anchor: string;
  description: string;
  gm_only: boolean;
}

export interface AdventureFaction {
  name: string;
  goals?: string;
  description?: string;
  gm_only?: boolean;
}

export interface AdventureMalformedEntry {
  convention: string;
  disposition: "skipped" | "partial";
}

export interface AdventureStructure {
  slug: string;
  title: string;
  premise: string;
  overview: string;
  hooks: string[];
  preview: string | null;
  player_visible: boolean;
  toc: Array<{ heading: string; anchor: string; depth: number; gm_only: boolean }>;
  sections: AdventureSection[];
  locations: AdventureLocation[];
  npcs: AdventureNpc[];
  factions: AdventureFaction[];
  malformed: AdventureMalformedEntry[];
}

const RULE_KEYWORDS = /\b(roll|rolls|check|checks|save|saves|attack|attacks|damage|dc)\b/i;
const ORG_TERM = /\b(guild|fleet|council|company|syndicate|order|house|clan|tribe|cult|league|circle|conclave|cabal)\b/i;
const STAT_VALUE = /\b\d+\s*(?:hp|h\.p\.|ac|hit points?)\b|\bpage\s*\d+|\bcr\s*\d|(?:^|\s)\d*d\d+\b/i;
const SPATIAL_PREMISE = /\b(dungeon|tower|keep|crypt|station|temple|cave|castle|ruin|ruins|harbor|harbour|mansion|ship|lab|laboratory|tomb|vault|sewer|forest|island|fort|mine|tunnel|catacomb|palace|manor|chapel|shrine|outpost|colony|bunker)\b/i;

/** Strip role-scoping emphasis markers from display text (REQ-194). */
function stripMarkers(text: string): string {
  return text
    .replace(/\*[^*]*\*/g, " ")
    .replace(/_[^_]*_/g, " ")
    .replace(/\{#([^}]+)\}/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s—–:\-]+|[\s—–:\-]+$/g, "")
    .trim();
}

/** True when a heading or line carries a role-scoping marker ending in "only". */
function isGmOnly(text: string): boolean {
  const star = text.match(/\*([^*]+)\*/g) ?? [];
  const under = text.match(/_([^_]+)_/g) ?? [];
  return [...star, ...under].some((m) => /(^|[\s_-])only\b/i.test(m.replace(/^[*_]|[*_]$/g, "")));
}

function firstParagraph(body: string): string {
  return body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.length > 0) ?? "";
}

function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const m = clean.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : clean).trim();
}

function articleFree(name: string): string {
  return name.replace(/^(the|a|an)\s+/i, "").trim();
}

/** Append `-1`, `-2`, … for a duplicate derived anchor (GFM convention). */
function uniqueAnchor(heading: string, used: Set<string>): string {
  let anchor = deriveAnchor(heading);
  if (!used.has(anchor)) {
    used.add(anchor);
    return anchor;
  }
  let n = 1;
  while (used.has(`${anchor}-${n}`)) n++;
  anchor = `${anchor}-${n}`;
  used.add(anchor);
  return anchor;
}

/** Parse a front-matter-free marker: <!-- player_visible: true --> (REQ-292b). */
function readsPlayerVisible(content: string): boolean {
  return /<!--\s*player_visible\s*:\s*(?:true|yes|1)\s*-->/i.test(content);
}

/**
 * Extract an adventure module's structure: title, premise/hook, ToC, scenes,
 * NPC references, factions, and Appendix K validation findings.
 */
export function extractAdventureStructure(content: string, slug: string): AdventureStructure {
  const player_visible = readsPlayerVisible(content);
  // The marker is not prose; strip it before parsing sections.
  const body = content.replace(/<!--\s*player_visible\s*:\s*(?:true|yes|1)\s*-->/gi, "");
  const lines = body.split("\n");

  const titleLine = lines.find((l) => /^#\s+/.test(l));
  const title = titleLine ? stripMarkers(titleLine.replace(/^#\s+/, "")) : "";

  const used = new Set<string>();
  const sections: AdventureSection[] = [];
  let current: AdventureSection | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      if (current) { current.endLine = i; sections.push(current); }
      const rawHeading = m[2].trim();
      current = {
        heading: stripMarkers(rawHeading),
        anchor: uniqueAnchor(rawHeading, used),
        depth: m[1].length,
        gm_only: isGmOnly(rawHeading),
        body: "",
        line: i + 1,
        endLine: i + 1,
      };
      continue;
    }
    if (current) { current.body += `${line}\n`; current.endLine = i + 1; }
  }
  if (current) sections.push(current);

  const find = (name: RegExp): AdventureSection | undefined =>
    sections.find((s) => name.test(s.heading));
  const overviewSection = find(/^overview$/i);
  const hookSection = find(/^adventure hook$/i);
  const premiseSection = find(/^premise$/i);
  const previewSection = find(/^preview$/i);

  const premise = (premiseSection?.body ?? "").trim() || firstParagraph(overviewSection?.body ?? "") || "";
  const overview = (overviewSection?.body ?? "").trim();
  const hooks = hookSection && hookSection.body.trim() ? [hookSection.body.trim()] : [];
  const preview = previewSection && previewSection.body.trim() ? firstParagraph(previewSection.body) : null;

  // NPC references (REQ-247b1): bolded name with a stat value, role noun, or page
  // reference; plus explicit @npc(Name, Room) directives (REQ-079g).
  const npcs: AdventureNpc[] = [];
  const seenNpc = new Set<string>();
  for (const section of sections) {
    const inNpcSection = /^(npcs?|characters?)$/i.test(section.heading);
    const bodyLines = section.body.split("\n");
    for (let li = 0; li < bodyLines.length; li++) {
      const raw = bodyLines[li];
      const bold = /^\s*(?:[-*]\s*)?\*\*([^*]{1,60})\*\*\s*[:—–-]?\s*(.*)$/.exec(raw);
      if (!bold) continue;
      const name = stripMarkers(bold[1]);
      if (!name || /^(premise|overview|adventure hook|world|scenes?|lore|seeds?|encounters?|traps?|factions?|npcs?)$/i.test(name)) continue;
      const next = bodyLines.slice(li + 1).find((l) => l.trim()) ?? "";
      const rest = bold[2].trim() || next.trim();
      const key = name.toLowerCase();
      if (seenNpc.has(key)) continue;
      seenNpc.add(key);
      const hasStats = STAT_VALUE.test(bold[2]) || STAT_VALUE.test(next);
      const confidence: AdventureConfidence = hasStats ? "HIGH" : inNpcSection ? "MEDIUM" : "LOW";
      npcs.push({
        name,
        description: rest || undefined,
        role: rest ? firstSentence(rest) : "NPC",
        confidence,
        gm_only: section.gm_only || undefined,
      });
    }
  }

  // Locations/scenes (REQ-247b2): a depth-3 heading with descriptive prose and
  // no rule/action keywords.
  const locations: AdventureLocation[] = [];
  for (const section of sections) {
    if (section.depth !== 3) continue;
    if (RULE_KEYWORDS.test(section.heading)) continue;
    const prose = firstParagraph(section.body);
    if (!prose) continue;
    locations.push({ name: section.heading, anchor: section.anchor, description: prose, gm_only: section.gm_only });
  }

  // Factions (REQ-247b2): an organization term with a goal/resource sentence.
  const factions: AdventureFaction[] = [];
  const seenFaction = new Set<string>();
  for (const section of sections) {
    const inFactionSection = /^factions?$/i.test(section.heading);
    for (const raw of section.body.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || line.startsWith("@")) continue;
      if (!ORG_TERM.test(section.heading) && !inFactionSection && !ORG_TERM.test(line)) continue;
      if (!inFactionSection && !ORG_TERM.test(line) && !ORG_TERM.test(section.heading)) continue;
      const bolded = /^\s*(?:[-*]\s*)?\*\*([^*]{1,60})\*\*\s*[:—–-]?\s*(.*)$/.exec(line);
      const name = stripMarkers(bolded ? bolded[1] : (line.split(/[—–:]/)[0] ?? line));
      if (!name || name.length > 80) continue;
      const key = name.toLowerCase();
      if (seenFaction.has(key)) continue;
      seenFaction.add(key);
      const rest = (bolded ? bolded[2] : line.slice(name.length + 1)).trim();
      factions.push({
        name,
        goals: rest || undefined,
        description: rest || undefined,
        gm_only: section.gm_only || undefined,
      });
    }
  }

  // Appendix K validation (REQ-171a): H1, ## Overview, ## Adventure Hook, and
  // well-formed role markers. A structurally non-Appendix-K module that still
  // carries the three required headings is not malformed.
  const malformed: AdventureMalformedEntry[] = [];
  if (!title) malformed.push({ convention: "H1 title", disposition: "skipped" });
  if (!overviewSection) malformed.push({ convention: "## Overview", disposition: "partial" });
  if (!hookSection) malformed.push({ convention: "## Adventure Hook", disposition: "partial" });
  const badMarker = sections.some((s) => {
    const raw = lines.find((l) => /^#{2,3}\s+/.test(l) && stripMarkers(l) === s.heading) ?? "";
    return (raw.match(/\*/g)?.length ?? 0) % 2 === 1 || (raw.match(/_/g)?.length ?? 0) % 2 === 1;
  });
  if (badMarker) malformed.push({ convention: "role-scoping marker", disposition: "partial" });

  return {
    slug,
    title: title || slug,
    premise,
    overview,
    hooks,
    preview,
    player_visible: player_visible || hooks.length > 0,
    toc: sections.map((s) => ({ heading: s.heading, anchor: s.anchor, depth: s.depth, gm_only: s.gm_only })),
    sections,
    locations,
    npcs,
    factions,
    malformed,
  };
}

/** REQ-132c: does the premise suggest spatial content? */
export function isSpatialPremise(premise: string): boolean {
  return SPATIAL_PREMISE.test(premise);
}

/**
 * REQ-132d: the generated `## World` section — one room per generated
 * location with a reciprocal chain of exits between consecutive locations.
 */
export function adventureWorldSection(locations: Array<{ heading: string; flavor: string }>): string {
  const rooms = locations.map((l) => ({
    name: l.heading.replace(/^Location\s+\d+\s*:\s*/i, "").trim() || l.heading,
    description: l.flavor,
  }));
  if (rooms.length === 0) return "";
  const dirs = ["north", "east", "south", "west", "up", "down"];
  const out: string[] = [`The ${rooms[0].name} is a room. "${rooms[0].description}"`];
  for (let i = 1; i < rooms.length; i++) {
    out.push(`The ${rooms[i].name} is a room. "${rooms[i].description}"`);
  }
  for (let i = 1; i < rooms.length; i++) {
    out.push(`${dirs[(i - 1) % dirs.length]} of ${rooms[i - 1].name} is ${rooms[i].name}.`);
  }
  return out.join("\n");
}

/** Article-free lookup key for a location heading (REQ-079d). */
export function adventureKey(name: string): string {
  return articleFree(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
