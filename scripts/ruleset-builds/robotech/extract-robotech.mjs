#!/usr/bin/env node
// extract-robotech.mjs — Discovery extraction for the `robotech` ruleset. [build tool]
//
// Role: deterministic-first extraction (Build workflow §6.3, REQ-015/REQ-209).
// Reads the Convert output (`converted/*.md`) and emits the semantic model plus
// the full-text search index consumed by the Package step (§6.4.2, REQ-389).
//
// Deterministic sources: heading anchors (index), pipe tables (lookup and
// generation per REQ-215), bold-labeled vehicle/weapon stat blocks, O.C.C.
// sections, and the categorized skill list. Model inference is reserved for
// the core resolution mechanic, character creation, and role terms, which are
// authored below and cited to their source anchors.
//
// Usage: node build/extract-robotech.mjs [--src <dir>] [--out <dir>]
// Outputs: build/extract-robotech.json, build/RULESET_MODEL.md
//
// Exit codes: 0 = extracted, 1 = failure, 2 = fatal.

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.dirname(import.meta.dirname);
// Canonical converted sources live in the Robotech content pipeline; override
// with ROBOTECH_CONTENT_DIR when they move.
const CONTENT_ROOT = process.env.ROBOTECH_CONTENT_DIR ?? "/home/fluke/Documents/Robotech-TTRPG";
const DEFAULT_SRC = path.join(CONTENT_ROOT, "converted");
const DEFAULT_OUT = path.join(CONTENT_ROOT, "build");

function parseArgs(argv) {
  const o = { src: DEFAULT_SRC, out: DEFAULT_OUT, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--src") o.src = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "-h" || a === "--help") o.help = true;
    else { console.error(`extract-robotech: unknown flag '${a}'`); process.exit(1); }
  }
  return o;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log("Usage: node build/extract-robotech.mjs [--src <dir>] [--out <dir>]");
  process.exit(0);
}

const WS = /[ \t\u00a0]+/g;
const norm = (s) => String(s).replace(WS, " ").trim();
const cleanHeading = (h) =>
  h
    .replace(/\*\*/g, "")
    .replace(/^[*_]+|[*_]+$/g, "")
    .replace(/^#+\s*/, "")
    .trim();
const slugify = (s) =>
  norm(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "x";
const isPageNumber = (h) => /^\d+$/.test(h.replace(/[*_]/g, "").trim());
// Front-matter / colophon headings (editors, artists, printing dates, ISBN,
// publisher credits) are not ruleset content; indexing them pollutes the
// concept collection with author names and dates (REQ-558b discovering).
const NOISE_HEADING = /\b(editor|senior editor|artist|typography|printing|print|copyright|credits?|dedication|acknowledg|illustrat|writer|designer|layout|cover|siembieda|marciniszyn|wujcik|vancleave|barrel dealing|palladium books|isbn|staff)\b/i;
const validHeading = (h) => {
  const s = String(h).replace(/[*_#]/g, "").trim();
  const letters = (s.match(/[A-Za-z]/g) ?? []).length;
  if (NOISE_HEADING.test(s)) return false;
  return s.length >= 3 && letters >= 2 && !/^[•\-–—\d.() ]+$/.test(s);
};

const CATEGORY_RULES = [
  ["classes", /\b(o\.?\s?c\.?\s?c|occupational character class|character class)\b/i],
  ["mecha", /\b(veritech|destroid|battloid|guardian|mecha|tank|fighter|jet|helicopter|power armor|battle ?pod|officer'?s pod|scout pod|recon pod|spaceship|cruiser|carrier|sdf|ref|alpha|beta|cyclone|hovertank|hover ?cat|vehicle|aircraft|shuttle|lander|ship)\b/i],
  ["creatures", /\b(zentraedi|invid|alien|creature|monster|enemy|micronian|haydonite|robotech master|tiresian)\b/i],
  ["weapons", /\b(weapon|missile|gun ?pod|laser|cannon|rifle|beam|warhead|torpedo|bomb|pistol|revolver|submachine|explosive)\b/i],
  ["equipment", /\b(equipment|body armor|armor|sensor|radio|helmet|gear|supply|kit|device|instrument)\b/i],
  ["skills", /\b(skill|skills|w\.p\.|weapon proficienc)\b/i],
  ["tables", /\b(table|chart|random|roll on)\b/i],
  ["adventure", /\b(adventure|scenario|campaign|module|episode)\b/i],
  ["resolution", /\b(combat|strike|dodge|parry|initiative|damage|attack|melee|percentile|die roll|saving throw|bonus)\b/i],
  ["guidance", /\b(game master|g\.m\.|gm\b|tips|advice|how to|playing|guidelines|example of play)\b/i],
];

function classify(text) {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) return cat;
  return "concepts";
}

function parseSections(text, file) {
  const lines = text.split("\n");
  const sections = [];
  const stack = [];
  let page = null;
  let cur = { level: 0, heading: file.replace(/\.md$/, ""), page: null, ancestors: [], body: [] };
  for (const line of lines) {
    const pm = line.match(/<!--\s*source:\s*page\s*(\d+)\s*-->/i);
    if (pm) { page = Number(pm[1]); continue; }
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      sections.push(cur);
      const level = hm[1].length;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const ancestors = stack.map((x) => x.heading);
      cur = { level, heading: cleanHeading(hm[2]), page, ancestors, body: [] };
      stack.push(cur);
    } else {
      cur.body.push(line);
    }
  }
  sections.push(cur);
  return sections.filter((s) => s.heading && !isPageNumber(s.heading) && validHeading(s.heading));
}

function parseTables(lines, file) {
  const tables = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*\|/.test(lines[i])) {
      const block = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
      if (block.length >= 2 && /^\s*\|[\s:|-]+\|?\s*$/.test(block[1])) {
        const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => norm(c));
        const headers = cells(block[0]);
        const rows = block.slice(2).map(cells);
        if (rows.length) tables.push({ file, headers, rows });
      }
    } else i++;
  }
  return tables;
}

const DICE_RANGE = /^(d\d+|d%|\d{1,3}\s*[-–]\s*\d{1,3})$/i;
function tableType(headers, rows) {
  const first = rows.map((r) => (r[0] ?? "").trim()).filter(Boolean);
  return first.some((c) => DICE_RANGE.test(c)) ? "generation" : "lookup";
}

const LABEL_RE = /^\s*\**\s*([A-Za-z][A-Za-z. ]{2,30}?)\s*\**\s*:\s*(.*)$/;
const isLabelLine = (l) => LABEL_RE.test(l) || /^\s*\**\s*M\.?D\.?C\.? by Location/i.test(l);
const stripMarks = (s) => norm(String(s).replace(/\*+/g, ""));

function fieldMap(bodyText, labels) {
  const out = {};
  const lines = bodyText.split("\n");
  const wanted = new Map(labels.map((l) => [l.toLowerCase(), l]));
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(LABEL_RE);
    if (!m) continue;
    const canonical = wanted.get(m[1].trim().replace(/\s+/g, " ").toLowerCase());
    if (!canonical || out[canonical] !== undefined) continue;
    let val = m[2];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() && !isLabelLine(lines[j]) && !/^#/.test(lines[j])) { val += " " + lines[j].trim(); j++; }
    out[canonical] = stripMarks(val);
  }
  const mdc = bodyText.match(/\**\s*M\.?D\.?C\.?\s*by\s*Location\**\s*:?\s*\n([\s\S]*?)(?:\n\s*\n|\n\*\*|\n#)/i);
  if (mdc) out["M.D.C. by Location"] = stripMarks(mdc[1].replace(/\n+/g, "; "));
  return out;
}

const MECHA_RE = /\b(veritech|destroid|battloid|guardian|mecha|tank|fighter|jet|helicopter|power armor|battle ?pod|officer'?s pod|scout pod|recon pod|cruiser|carrier|sdf|ref|alpha|beta|cyclone|hovertank|hover ?cat|vehicle|aircraft|shuttle|lander)\b/i;
const MECHA_LABELS = ["Vehicle Type", "Crew", "Speed", "Max. Range", "Height", "Weight", "Length", "Width", "M.D.C. by Location"];

function extractMecha(sections, file) {
  const out = {};
  for (const s of sections) {
    const blob = `${s.heading}\n${s.body.join("\n")}`;
    if (!MECHA_RE.test(s.heading)) continue;
    if (!/Vehicle Type|M\.?D\.?C\.?|Main Body/i.test(blob)) continue;
    const fields = fieldMap(s.body.join("\n"), MECHA_LABELS);
    if (!fields["Vehicle Type"] && !fields["M.D.C. by Location"] && !/Main Body/i.test(blob)) continue;
    const name = s.heading.replace(/\s+/g, " ").trim();
    const key = slugify(name);
    const val = (k) => (fields[k] && fields[k].length ? fields[k] : null);
    out[key] = {
      name,
      source_file: file,
      page: s.page,
      vehicle_type: val("Vehicle Type"),
      crew: val("Crew"),
      speed: val("Speed"),
      range: val("Max. Range"),
      height: val("Height"),
      weight: val("Weight"),
      length: val("Length"),
      width: val("Width"),
      mdc: val("M.D.C. by Location"),
    };
  }
  return out;
}

const HEADER_BLACK = /^(weapon systems?|weapon system|note|range|rate of fire|payload|mega-?damage|damage|primary purpose|type|weight|bonus|penalt|combat|strike|s\.?d\.?c|m\.?d\.?c|launcher|turret|systems?)$/i;
function looksLikeName(t) {
  const s = String(t).replace(/[.;,:]+$/, "").trim();
  if (s.length < 3 || s.length > 70 || !/[A-Za-z]/.test(s)) return false;
  if (/^\d+\)?$/.test(s) || /[•]/.test(s)) return false;
  if (HEADER_BLACK.test(s)) return false;
  if (!/[A-Z]{2,}|[a-z]{3,}/.test(s)) return false;
  return true;
}
function nearestName(lines, i) {
  for (let j = i - 1; j >= Math.max(0, i - 8); j--) {
    const bolds = lines[j].match(/\*\*([^*]+)\*\*/g);
    if (bolds) for (const tok of bolds) {
      const t = cleanHeading(tok);
      if (looksLikeName(t)) return t.replace(/[.;,:]+$/, "").trim();
    }
  }
  return null;
}
function extractWeapons(sections, file) {
  const out = {};
  for (const s of sections) {
    const lines = s.body;
    const chain = [...s.ancestors, s.heading].filter(validHeading);
    const mount = [...chain].reverse().find((h) => MECHA_RE.test(h)) || chain[chain.length - 1] || s.heading;
    if (!validHeading(mount)) continue;
    let seq = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!/Primary Purpose\s*:/i.test(lines[i])) continue;
      seq++;
      const label = nearestName(lines, i);
      const name = label ?? `${mount.replace(/\s+/g, " ").trim()} — weapon ${seq}`;
      const window = lines.slice(i, i + 14).join("\n");
      const grab = (label) => {
        const m = window.match(new RegExp(`${label}\\s*:?\\s*([^\\n]+)`, "i"));
        return m ? norm(m[1]) : null;
      };
      const purpose = grab("Primary Purpose");
      const dmg = grab("Mega-?Damage") ?? grab("Damage");
      const range = grab("Range");
      const rof = grab("Rate of Fire");
      const payload = grab("Payload");
      if (!purpose && !dmg) continue;
      const base = slugify(`${mount}-${name}-${seq}`);
      if (!out[base]) {
        out[base] = {
          name,
          label: label ?? null,
          source_file: file,
          page: s.page,
          purpose: purpose ?? null,
          damage: dmg ?? null,
          range: range ?? null,
          rate_of_fire: rof ?? null,
          payload: payload ?? null,
          mounted_on: mount,
        };
      }
    }
  }
  return out;
}

const CLASS_WORD = /\b(pilot|engineer|scientist|specialist|soldier|officer|spy|scout|technician|mechanic|medic|communi|veritech|destroid|mecha|micronian|zentraedi|invid|ref|rdf|asc)\b/i;
function isClassName(h) {
  if (!/\bo\.?\s?c\.?\s?c\.?|occupational character class/i.test(h)) return false;
  if (/\b(available to|of the|following|selecting|experience levels|the o\.?\s?c\.?\s?c)/i.test(h)) return false;
  return /o\.?\s?c\.?\s?c\.?\s*$/i.test(h.trim()) || CLASS_WORD.test(h);
}
function extractClasses(sections, file) {
  const out = {};
  for (const s of sections) {
    if (!isClassName(s.heading)) continue;
    if (s.level > 3) continue;
    const name = s.heading.replace(/\s+/g, " ").trim();
    out[slugify(name)] = {
      name,
      source_file: file,
      page: s.page,
      excerpt: norm(s.body.join(" ")).slice(0, 600),
    };
  }
  return out;
}

function extractSkills(sections, file) {
  const out = {};
  let category = null;
  for (const s of sections) {
    if (/skills listed by category/i.test(s.heading)) {
      for (const raw of s.body) {
        const line = raw.trim();
        if (!line) continue;
        const cat = line.match(/^\*\*([A-Z][A-Z0-9 /&().,'-]{3,})\*\*$/);
        if (cat) { category = cleanHeading(cat[1]); continue; }
        if (/^\*\*Note/i.test(line) || /^#/.test(line) || /^<!--/.test(line)) continue;
        if (/^[A-Z]/.test(line) && line.length < 60 && !/[.:]$/.test(line)) {
          out[slugify(line)] = { name: cleanHeading(line), source_file: file, page: s.page, category };
        }
      }
    }
    if (/skill descriptions/i.test(s.heading)) {
      let cur = null;
      for (const raw of s.body) {
        const line = raw.trim();
        if (!line) continue;
        const h = line.match(/^\*\*([A-Z][A-Za-z0-9 /&().,'%-]{2,})\*\*$/);
        if (h && !/^Note/i.test(h[1])) { cur = cleanHeading(h[1]); continue; }
        if (cur) {
          const key = slugify(cur);
          if (!out[key]) out[key] = { name: cur, source_file: file, page: s.page, category: "description" };
          out[key].description = norm(`${out[key].description ?? ""} ${line}`).slice(0, 400);
        }
      }
    }
  }
  return out;
}

function extractAdventures(sections, file) {
  const out = {};
  for (const s of sections) {
    if (!/\b(adventure|scenario|campaign|module|episode)\b/i.test(s.heading)) continue;
    if (s.level > 3) continue;
    const name = s.heading.replace(/\s+/g, " ").trim();
    out[slugify(name)] = { name, source_file: file, page: s.page, excerpt: norm(s.body.join(" ")).slice(0, 500) };
  }
  return out;
}

function extractGuidance(sections, file) {
  const out = {};
  for (const s of sections) {
    const blob = norm(s.body.join(" "));
    if (/\b(game master|g\.m\.|gm\b|advice|tips|how to|guidelines)\b/i.test(`${s.heading} ${blob}`)) {
      const key = slugify(`guidance-${file}-${s.heading}`);
      out[key] = {
        name: s.heading,
        source_file: file,
        page: s.page,
        text: blob.slice(0, 600),
        tag: /example/i.test(blob) ? "[narrative-tone]" : "[ruleset]",
      };
    }
  }
  return out;
}

function extractCreatures(sections, file) {
  const out = {};
  const CREATURE_RE = /\b(zentraedi|invid|alien|creature|monster|enemy|micronian|haydonite|robotech master|tiresian)\b/i;
  for (const s of sections) {
    if (!CREATURE_RE.test(s.heading)) continue;
    if (s.level > 3) continue;
    const name = s.heading.replace(/\s+/g, " ").trim();
    out[slugify(name)] = { name, source_file: file, page: s.page, excerpt: norm(s.body.join(" ")).slice(0, 400) };
  }
  return out;
}

// Skill names also appear in O.C.C. skill-program lists as `Name (bonus)` or
// `Name NN% ...` lines, which the categorized-list scan (extractSkills) does not
// cover. Capture those mentions so common skills resolve by name (REQ-558b).
const SKILL_LINE_RE = /^([A-Z][A-Za-z0-9 '&/.+-]{2,40}?)\s*(?:\(([^)]{0,40})\))?\s*(?:(\d{1,3})%|[+\-]\s?\d+%)/;
function extractSkillMentions(sections, file) {
  const out = {};
  for (const s of sections) {
    for (const raw of s.body) {
      const line = stripMarks(raw);
      const m = line.match(SKILL_LINE_RE);
      if (!m) continue;
      const name = cleanHeading(m[1]);
      if (name.length < 3 || /^(select|choose|any|all|other|mandatory|note|skills?)\b/i.test(name)) continue;
      const key = slugify(name);
      if (!out[key]) out[key] = { name, source_file: file, page: s.page, category: "skill-program" };
    }
  }
  return out;
}

// REQ-558b — natural-name aliases for entries whose extraction key is a heading
// slug. Names are matched case-insensitively by the host lookup resolver.
const ALIASES = {
  mecha: {
    "the-veritech-fighters-2": ["VF-1A Veritech Fighter", "VF-1J Veritech Fighter", "VF-1S Veritech Fighter", "VT-1D Veritech", "VF-1A", "VF-1J", "VF-1S", "VT-1D", "Veritech Fighter", "Veritech"],
    "the-super-veritech-2": ["Super Veritech", "Super VF-1"],
    "the-armored-veritech": ["Armored Veritech", "Armored VF-1"],
  },
  skills: {
    "pilot-veritech-fighter": ["Pilot Veritech", "Pilot Veritech Combat", "Veritech Pilot"],
    "mecha-combat": ["Mecha Combat", "Robot Combat"],
  },
};

// REQ-558b/d — human-readable names + aliases for extracted tables, which would
// otherwise carry only generated `${file}-${headers}-${rowcount}` keys.
function tableAliases(entry) {
  const h = (entry.headers ?? []).join(" ").toLowerCase();
  if (/hit location/.test(h)) return { name: "Random Hit Location", aliases: ["hit location", "random hit location", "random hit location table"] };
  if (/missile/.test(h)) return { name: "Missile Type", aliases: ["missile", "missile type", "missile table"] };
  if (/miles per (hour|minute)/.test(h)) return { name: "Vehicle Speed", aliases: ["speed", "vehicle speed", "speed table"] };
  const label = (entry.headers ?? []).filter(Boolean).slice(-1)[0];
  return label ? { name: `Table — ${label}`, aliases: [label] } : {};
}

function applyOverlays(model) {
  for (const coll of ["mecha", "weapons", "skills", "classes", "creatures"]) {
    for (const [k, v] of Object.entries(model[coll] ?? {})) {
      if (v && typeof v === "object" && v.name !== undefined) {
        v.name = cleanHeading(v.name);
        const extra = ALIASES[coll]?.[k];
        if (extra) v.aliases = [...new Set([...(v.aliases ?? []), ...extra])];
      }
    }
  }
  for (const coll of ["tables", "generation_tables"]) {
    for (const [k, v] of Object.entries(model[coll] ?? {})) {
      if (!v || typeof v !== "object") continue;
      const meta = tableAliases(v);
      if (meta.name) { v.name = meta.name; v.aliases = [...new Set([...(v.aliases ?? []), ...(meta.aliases ?? [])])]; }
    }
  }
}


// Authored model blocks (§6.3 character-creation extraction; REQ-151a, REQ-399).
const RESOLUTION = {
  name: "Palladium d20 / d100 resolution",
  dice: "d20 for combat, d100 for skills",
  stat_associations: {
    strike: "d20 + P.P. bonus + W.P. bonus + level bonus",
    dodge: "d20 + P.P. bonus + skill bonus",
    parry: "d20 + P.P. bonus + skill bonus",
    initiative: "d20 + bonus",
    skill: "d100 roll-under skill percentage",
  },
  result_bands: [
    { band: "critical", rule: "natural 20 to strike", outcome: "automatic hit; roll damage twice" },
    { band: "fumble", rule: "natural 1 to strike", outcome: "miss" },
    { band: "skill-success", rule: "roll <= skill %", outcome: "skill succeeds" },
  ],
  damage_types: ["S.D.C. (Structural Damage Capacity)", "Hit Points", "M.D.C. (Mega-Damage Capacity)"],
  source_file: "Robotech - Book 1 - Macross (Main Book).md",
  confidence: "MEDIUM",
};

const CHARACTER_CREATION = {
  steps: [
    "Roll the eight attributes",
    "Determine hit points and S.D.C.",
    "Select an O.C.C. (Occupational Character Class)",
    "Select skills",
    "Determine alignment and experience level",
    "Buy starting equipment",
  ],
  ability_names: ["I.Q.", "M.E.", "M.A.", "P.S.", "P.P.", "P.E.", "P.B.", "Spd"],
  stat_methods: [
    { name: "3d6", detail: "roll three six-sided dice per attribute" },
    { name: "exceptional", detail: "a 16, 17, or 18 grants one additional d6 added to the attribute" },
  ],
  derived_stats: [
    { key: "hit_points", formula: "base + P.E. bonus, advanced per O.C.C. and level", description: "physical resilience; zero means unconscious/dead" },
    { key: "sdc", formula: "O.C.C. base + skill bonuses", description: "Structural Damage Capacity; personal armor pool" },
    { key: "mdc", formula: "vehicle stat block", description: "Mega-Damage Capacity; mecha/vehicle armor pool" },
    { key: "is_psionic", formula: "none", description: "psionic potential (major/minor), where defined" },
  ],
  default_ability_scores: { "I.Q.": 10, "M.E.": 10, "M.A.": 10, "P.S.": 10, "P.P.": 10, "P.E.": 10, "P.B.": 10, Spd: 10 },
  classes_source: "Robotech - Book 1 - Macross (Main Book).md",
  confidence: "MEDIUM",
};

const ROLES = {
  player: { name: "Player", description: "controls a player character (RDF/REF/ASC pilot, soldier, or specialist)" },
  game_master: { name: "Game Master", description: "runs the world, mecha opponents, and adventures" },
};

function main() {
  const src = opts.src;
  const outDir = opts.out;
  if (!fs.existsSync(src)) throw new Error(`source directory not found: ${src}`);
  const files = fs.readdirSync(src).filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_")).sort();
  if (!files.length) throw new Error(`no .md sources in ${src}`);

  const index = [];
  const ids = new Set();
  const model = {
    concepts: {}, entities: {}, actions: {}, tables: {}, resolution: RESOLUTION,
    roles: ROLES, guidance: {}, generation_tables: {}, character_creation: CHARACTER_CREATION,
    mecha: {}, weapons: {}, equipment: {}, skills: {}, classes: {}, creatures: {}, adventures: {},
    info: {},
  };
  const defects = [];
  const counts = {};

  for (const file of files) {
    const text = fs.readFileSync(path.join(src, file), "utf-8");
    const lines = text.split("\n");
    const sections = parseSections(text, file);

    for (const s of sections) {
      const content = norm(s.body.join(" "));
      if (!content || content.length < 15) continue;
      const cat = classify(`${s.heading} ${content}`);
      let id = slugify(s.heading);
      if (ids.has(id)) { let n = 2; while (ids.has(`${id}-${n}`)) n++; id = `${id}-${n}`; }
      ids.add(id);
      index.push({
        id,
        anchor: s.heading,
        source_file: file,
        content: content.slice(0, 600),
        category: cat,
        confidence: /Southern Cross|Invid Invasion|Return of the Masters|Strike Force|Sentinels|REF Field Guide/i.test(file) ? "MEDIUM" : "HIGH",
      });
    }

    for (const t of parseTables(lines, file)) {
      const type = tableType(t.headers, t.rows);
      const key = slugify(`${file}-${t.headers.join("-")}-${t.rows.length}`);
      const entry = { source_file: file, type, headers: t.headers, rows: t.rows, dice: type === "generation" ? "percentile/dice" : null };
      if (type === "generation") model.generation_tables[key] = entry;
      else model.tables[key] = entry;
    }

    Object.assign(model.mecha, extractMecha(sections, file));
    Object.assign(model.weapons, extractWeapons(sections, file));
    Object.assign(model.classes, extractClasses(sections, file));
    Object.assign(model.skills, extractSkills(sections, file));
    Object.assign(model.adventures, extractAdventures(sections, file));
    Object.assign(model.guidance, extractGuidance(sections, file));
    Object.assign(model.creatures, extractCreatures(sections, file));
    for (const [k, v] of Object.entries(extractSkillMentions(sections, file))) if (!model.skills[k]) model.skills[k] = v;
  }

  applyOverlays(model);
  // REQ-558a — the core mechanic must be an explicit model entry so the
  // info-kind `core_mechanic` tool resolves it instead of echoing its own
  // description.
  model.info.core_mechanic = {
    name: RESOLUTION.name,
    content: "Combat resolves on a d20: roll 1d20 plus modifiers to strike, dodge, parry, or for initiative; a natural 20 to strike is a critical hit (roll the damage dice twice) and a natural 1 always misses. Skills resolve on percentile dice: roll d100 and compare to the skill percentage — a roll equal to or under the percentage succeeds. Damage is tracked as S.D.C. (Structural Damage Capacity) and Hit Points for characters, and M.D.C. (Mega-Damage Capacity) for mecha and vehicles.",
    source_file: RESOLUTION.source_file,
    anchor: RESOLUTION.name,
    confidence: RESOLUTION.confidence,
  };

  for (const [key, v] of Object.entries(model.mecha)) model.entities[key] = { name: v.name, kind: "mecha", source_file: v.source_file, page: v.page };
  for (const [key, v] of Object.entries(model.weapons)) model.entities[key] = { name: v.name, kind: "weapon", source_file: v.source_file, page: v.page };
  for (const [key, v] of Object.entries(model.classes)) model.entities[key] = { name: v.name, kind: "class", source_file: v.source_file, page: v.page };

  model.concepts = Object.fromEntries(
    index.filter((e) => e.category === "concepts").slice(0, 400).map((e) => [e.id, { name: e.anchor, source_file: e.source_file, confidence: e.confidence, excerpt: e.content.slice(0, 200) }]),
  );

  const colls = ["concepts", "entities", "actions", "tables", "resolution", "roles", "guidance", "generation_tables", "character_creation", "mecha", "weapons", "equipment", "skills", "classes", "creatures", "adventures", "info"];
  for (const c of colls) counts[c] = Array.isArray(model[c]) ? model[c].length : Object.keys(model[c] ?? {}).length;
  counts.anchor = index.length;

  if (!Object.keys(model.mecha).length) defects.push({ severity: "MEDIUM", note: "no mecha stat blocks extracted" });
  if (!Object.keys(model.generation_tables).length) defects.push({ severity: "LOW", note: "no generation tables detected" });
  if (files.includes("Macross II - Sourcebook 01.md")) defects.push({ severity: "MEDIUM", note: "Macross II Sourcebook OCR noise: Convert recorded cross-converter Jaccard 0.0%; headings and weapon labels from this source are MEDIUM confidence" });
  defects.push({ severity: "LOW", note: "scan-derived books (Southern Cross, Invid Invasion, Return of the Masters, Strike Force, Sentinels, REF Field Guide) carry OCR text; entries labelled MEDIUM confidence" });

  const result = { source_dir: src, files, index, model, counts, defects, extracted_at: new Date().toISOString() };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "extract-robotech.json"), JSON.stringify(result, null, 2) + "\n");

  const md = [];
  md.push("# RULESET_MODEL.md — Robotech (Palladium Books)");
  md.push("");
  md.push(`Source: \`${src}\` — ${files.length} converted books.`);
  md.push("");
  md.push("## Counts");
  md.push("");
  md.push("| Collection | Count |");
  md.push("| --- | --- |");
  for (const c of ["anchor", ...colls]) md.push(`| ${c} | ${counts[c]} |`);
  md.push("");
  md.push("## Samples");
  md.push("");
  for (const [coll, sample] of [["mecha", model.mecha], ["weapons", model.weapons], ["classes", model.classes], ["skills", model.skills]]) {
    const first = Object.values(sample)[0];
    if (first) md.push(`- **${coll}** e.g. ${first.name} (${first.source_file})`);
  }
  md.push("");
  md.push("## Defect log");
  md.push("");
  if (!defects.length) md.push("- none");
  for (const d of defects) md.push(`- [${d.severity}] ${d.note}`);
  md.push("");
  fs.writeFileSync(path.join(outDir, "RULESET_MODEL.md"), md.join("\n") + "\n");

  console.log(`extract-robotech — ${files.length} books`);
  console.log(`  index entries: ${counts.anchor}`);
  console.log(`  mecha: ${counts.mecha}, weapons: ${counts.weapons}, classes: ${counts.classes}, skills: ${counts.skills}`);
  console.log(`  tables: ${counts.tables}, generation_tables: ${counts.generation_tables}, guidance: ${counts.guidance}`);
  console.log(`  defects: ${defects.length}`);
}

try {
  main();
  process.exit(0);
} catch (e) {
  console.error(`extract-robotech: ${e.message}`);
  process.exit(1);
}
