#!/usr/bin/env node
// extract-thundercats.mjs — Extract ThunderCats collections from the frozen
// annotated Markdown (Build workflow, §6.3-6.4). [build tool]
//
// Reads supplemental-md/thundercats-campaign.md and thundercats-adventures.md,
// tracks a section-anchor context (the books use the same display size for a
// section and its entities), and emits index entries plus typed collections.
// Content merges into the host's existing collections where the entity type is
// shared with D&D 2024 (classes, species, feats, spells, magic_items,
// conditions, monsters); ThunderCats-only types get new collections.
//
// Usage: node extract-thundercats.mjs
// Output: extract-thundercats.json  { index, model, counts }
//
// Exit codes: 0 = written, 1 = extraction failure, 2 = fatal.

import * as fs from "node:fs";
import * as path from "node:path";

const HERE = import.meta.dirname;
const MD = path.join(HERE, "supplemental-md");

const SOURCES = [
  { file: "thundercats-campaign.md", label: "supplements/ThunderCats-Campaign.md" },
  { file: "thundercats-adventures.md", label: "supplements/ThunderCats-Adventures.md" },
];

// Anchor heading -> collection. Anchors switch the current collection; other
// headings become entries in it.
const ANCHORS = new Map([
  ["classes", "classes"],
  ["subclasses", "classes"],
  ["species", "species"],
  ["feats", "feats"],
  ["spells", "spells"],
  ["magic items", "magic_items"],
  ["conditions", "conditions"],
  ["characters of note", "monsters"],
  ["other allies and enemies (npcs)", "monsters"],
  ["other allies and enemies", "monsters"],
  ["creatures of third earth and beyond", "monsters"],
  ["vehicles", "vehicles"],
  ["adventuring gear", "equipment"],
  ["thundrillium devices", "equipment"],
  ["scientific inventions", "equipment"],
  ["ancient spirits", "spirits"],
  ["space", "locations"],
  ["thundera", "locations"],
  ["third earth", "locations"],
  ["new thundera", "locations"],
  ["planets of interest", "locations"],
  ["other dimensions", "locations"],
]);

// Headings that are structural/features, not entities.

const ALLOW = {
  classes: new Set([
    "mechanist","builder","engineer","magi-technician",
    "path of collision (barbarian)","college of omens (bard)","ancient spirits domain (cleric)",
    "circle of the croft (druid)","operator (fighter)","warrior of the claw (monk)",
    "oath of destiny (paladin)","evil-chaser (ranger)","heckler (rogue)",
    "metamorphosis sorcery (sorcerer)","mongor patron (warlock)","magician (wizard)",
  ]),
  species: new Set(["human","thunderian","snarf","berbil","snowfolk","tuska","mu'tant","mu’tant"]),
  conditions: new Set(["empowered","pacified","weakened"]),
};
const SKIP = /^(level \d|features$|spellcasting|ability score|becoming|class features|functions$|feat list|origin feats|general feats|fighting style feats|geography|history|points of interest|stat blocks|traps|adventure hook|traits$|mechanist subclass|becoming a|in combat|vehicles in combat|functions$|subclasses$|class features$|what is|using this book|the thunderCats|of thundera|chronicles of the|code of thundera|pre-thundera|eye of thundera|war with|sword of|premonitions|exodus|plun-darr|reclamation|banishment|return to thundera|mumm-ra lives|thundercats, ho|friends and foes|eras of|thunderguard|league of|currency|artwork|credits|dynamite|design & writing)/i;

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const keyify = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const strip = (s) => String(s || "").replace(/\s+/g, " ").trim();

function parseSections(text, label) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^(#{1,4})\s+(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const level = m[1].length;
    const heading = strip(m[2]);
    const body = [];
    let j = i + 1;
    while (j < lines.length && !/^#{1,4}\s+/.test(lines[j])) {
      if (lines[j].trim()) body.push(lines[j].trim());
      j++;
    }
    out.push({ level, heading, body: body.join(" "), label });
    i = j;
  }
  return out;
}

const index = [];
const model = {
  classes: {},
  species: {},
  feats: {},
  spells: {},
  magic_items: {},
  conditions: {},
  monsters: {},
  vehicles: {},
  equipment: {},
  spirits: {},
  locations: {},
  adventures: {},
};
const seen = new Map();
let current = null;

function addEntry(coll, section) {
  const key = keyify(section.heading);
  if (ALLOW[coll] && !ALLOW[coll].has(key)) return;
  if (!key || key.length < 2) return;
  const id = slugify(section.heading);
  const n = (seen.get(coll + ":" + key) || 0) + 1;
  seen.set(coll + ":" + key, n);
  const unique = n === 1 ? key : `${key} (${n})`;
  const content = strip(section.body).slice(0, 2000);
  model[coll][unique] = {
    name: section.heading,
    source_file: section.label,
    anchor: id,
    confidence: "MEDIUM",
    description: content,
  };
}

for (const src of SOURCES) {
  const text = fs.readFileSync(path.join(MD, src.file), "utf-8");
  for (const sec of parseSections(text, src.label)) {
    const h = sec.heading.toLowerCase();
    // index entry for every heading
    const id = slugify(sec.heading) || `section_${index.length + 1}`;
    index.push({
      id,
      anchor: id,
      source_file: src.label,
      content: strip(sec.body).slice(0, 1400),
      category: sec.level <= 2 ? "concept" : "guidance",
      confidence: "MEDIUM",
    });
    if (sec.level === 2) {
      current = null;
      // adventure chapters become adventure entries
      const adv = src.label.includes("Adventures") && sec.heading.match(/^chapter \d+:\s*(.+)$/i);
      if (adv) {
        const key = keyify(adv[1]);
        model.adventures[key] = {
          name: sec.heading,
          source_file: src.label,
          anchor: id,
          confidence: "MEDIUM",
          description: strip(sec.body).slice(0, 2000),
        };
        current = null;
      }
      continue;
    }
    if (sec.level === 3 && ANCHORS.has(h)) {
      current = ANCHORS.get(h);
      continue;
    }
    if (!current || SKIP.test(sec.heading) || /^level \d/i.test(sec.heading)) continue;
    if (sec.heading.length > 60) continue;
    addEntry(current, sec);
  }
}

const counts = Object.fromEntries(Object.entries(model).map(([k, v]) => [k, Object.keys(v).length]));
counts.anchor = index.length;
fs.writeFileSync(path.join(HERE, "extract-thundercats.json"), JSON.stringify({ index, model, counts }, null, 2) + "\n");
console.log("[extract] collections:", JSON.stringify(counts));
console.log(`[extract] index entries: ${index.length}`);
process.exit(0);
