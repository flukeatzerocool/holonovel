#!/usr/bin/env node
// build-index.ts — extract structured data from D&D 5e SRD Markdown sources
import * as fs from "node:fs";
import * as path from "node:path";

const RULESET = path.resolve(process.cwd(), "ruleset");
const OUT_DIR = path.resolve(process.cwd(), "src", "generated");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Utilities ────────────────────────────────────────────────────────────

function readFile(rel: string): string {
  return fs.readFileSync(path.join(RULESET, rel), "utf-8");
}

function parsePipeTable(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split("\n");
  let headerLine = "";
  let i = 0;
  for (; i < lines.length; i++) {
    if (lines[i].startsWith("|") && lines[i].includes("-|-")) {
      headerLine = lines[i - 1] || "";
      i++;
      break;
    }
  }
  if (!headerLine) return { headers: [], rows: [] };
  const headers = headerLine.split("|").map(h => h.trim()).filter(h => h.length > 0);
  const rows: string[][] = [];
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;
    const cells = line.split("|").map(c => c.trim());
    const entry = cells.slice(1, -1); // strip leading/trailing empty from pipe splits
    if (entry.every(c => c === "" || c === "-")) continue;
    if (entry.some(c => c.startsWith("**") && c.endsWith("**") && entry.filter(x => x !== "").length <= 2)) continue; // section header row
    rows.push(entry);
  }
  return { headers, rows };
}

function stripBold(s: string): string {
  return s.replace(/^\*\*/, "").replace(/\*\*$/, "");
}

// ─── Weapons ──────────────────────────────────────────────────────────────

function extractWeapons(): Record<string, any>[] {
  const text = readFile("04_Equipment/Weapons.md");
  const { headers, rows } = parsePipeTable(text);
  const weapons: Record<string, any>[] = [];
  for (const row of rows) {
    if (row.length < 5) continue;
    const name = row[0]?.replace(/^\*\*/, "").replace(/\*\*$/, "") || "";
    if (!name || name === "Name") continue;
    const damageCell = (row[2] || "").trim();
    const dmgMatch = damageCell.match(/^(\d+d\d+)\s+(.+)$/);
    weapons.push({
      name,
      cost: row[1] || "",
      damage: dmgMatch ? dmgMatch[1] : damageCell,
      damageType: dmgMatch ? dmgMatch[2] : "",
      weight: row[3] || "",
      properties: (row[4] || "").split(",").map(p => p.trim().toLowerCase()).filter(p => p && p !== "-"),
    });
  }
  return weapons;
}

// ─── Armor ────────────────────────────────────────────────────────────────

function extractArmor(): Record<string, any>[] {
  const text = readFile("04_Equipment/Armor.md");
  const { rows } = parsePipeTable(text);
  const armor: Record<string, any>[] = [];
  for (const row of rows) {
    if (row.length < 6) continue;
    const name = row[0]?.replace(/^\*\*/, "").replace(/\*\*$/, "") || "";
    if (!name || name.startsWith("**")) continue;
    armor.push({
      name,
      cost: row[1] || "",
      armorClass: row[2] || "",
      strength: row[3] || "",
      stealth: row[4] || "",
      weight: row[5] || "",
    });
  }
  return armor;
}

// ─── Spells ───────────────────────────────────────────────────────────────

function extractSpells(): Record<string, any>[] {
  const dir = path.join(RULESET, "07_Spells", "Spells_Each");
  const spells: Record<string, any>[] = [];
  if (!fs.existsSync(dir)) return spells;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const text = fs.readFileSync(path.join(dir, file), "utf-8");
    const lines = text.split("\n");
    const spell: Record<string, any> = {};
    const name = lines[0]?.replace(/^#+\s*/, "").trim();
    if (!name) continue;
    spell.name = name;
    spell.level = "";
    spell.school = "";
    let descStart = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const italicMatch = line.match(/^\*(\d.+?)\*$/);
      if (italicMatch && !spell.level) {
        const parts = italicMatch[1].split(/\s+/);
        spell.level = parts[0] || "";
        spell.school = parts.slice(1).join(" ");
        continue;
      }
      const fieldMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
      if (fieldMatch) {
        const key = fieldMatch[1].toLowerCase().replace(/[^a-z]+/g, "_");
        spell[key] = fieldMatch[2].trim();
        continue;
      }
      if (line.startsWith("***At Higher Levels***")) {
        spell.higher_levels = "";
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith("***")) break;
          spell.higher_levels += (spell.higher_levels ? " " : "") + lines[j].trim();
        }
        break;
      }
      if (!descStart && !line.startsWith("#") && !line.startsWith("*")) {
        descStart = i;
      }
    }
    if (!spell.description && descStart) {
      let desc = "";
      for (let i = descStart; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("***At Higher Levels***")) break;
        if (line) desc += (desc ? " " : "") + line;
      }
      spell.description = desc;
    }
    if (!spell.description && lines.length > 2) {
      let desc = "";
      for (let i = 3; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (!line.startsWith("**") && !line.startsWith("*")) {
          desc += (desc ? " " : "") + line;
        }
      }
      spell.description = desc;
    }
    spells.push(spell);
  }
  return spells;
}

// ─── Monsters ─────────────────────────────────────────────────────────────

function extractMonsters(): Record<string, any>[] {
  const dir = path.join(RULESET, "10_Monsters", "Monsters_Each");
  const monsters: Record<string, any>[] = [];
  if (!fs.existsSync(dir)) return monsters;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const text = fs.readFileSync(path.join(dir, file), "utf-8");
    const lines = text.split("\n");
    const mon: Record<string, any> = {};
    const name = file.replace(/\.md$/, "").replace(/_/g, " ");
    mon.name = name;
    mon.size = "";
    mon.type = "";
    mon.alignment = "";

    let inActions = false;
    let actionText = "";
    let traitText = "";
    let descriptionText = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith("###")) {
        const h2m = line.match(/^##\s+(.+)/);
        if (h2m && !mon.heading_name) {
          mon.heading_name = h2m[1];
          continue;
        }
      }
      if (line.startsWith("*") && !line.startsWith("**") && !mon.size) {
        const stripped = line.replace(/\*/g, "").trim();
        const parts = stripped.split(",").map(p => p.trim());
        if (parts.length >= 2) {
          const firstWords = parts[0].split(/\s+/);
          mon.size = firstWords[0] || "";
          mon.type = firstWords.slice(1).join(" ") || "";
          mon.alignment = parts.slice(1).join(", ");
        }
        continue;
      }
      const fieldMatch = line.match(/^\*\*(.+?)\*\*\s*(.*)/);
      if (fieldMatch) {
        const key = fieldMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const val = fieldMatch[2].trim();
        // Stat table row
        if (key === "str" || key === "dex" || key === "con" || key === "int" || key === "wis" || key === "cha") {
          const statLine = lines[i + 1]?.trim() || "";
          const cells = statLine.split("|").map(c => c.trim()).filter(c => c);
          for (let s = 0; s < Math.min(cells.length, 6); s++) {
            const sn = ["str", "dex", "con", "int", "wis", "cha"][s];
            const match = cells[s]?.match(/^(\d+)/);
            mon[sn] = match ? parseInt(match[1]) : null;
          }
          i++; // skip stat row
          continue;
        }
        mon[key] = val;
        continue;
      }
      if (line === "###### Actions" || line === "### Actions" || line === "#### Actions") {
        inActions = true;
        continue;
      }
      if (inActions) {
        actionText += line + "\n";
      } else if (line.startsWith("***") && line.endsWith("***")) {
        traitText += line.replace(/\*/g, "") + ": ";
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j].trim();
          if (next.startsWith("***") || next.startsWith("######") || next.startsWith("### Action")) break;
          traitText += next + " ";
        }
        traitText = traitText.trim() + "\n\n";
      } else if (line && !line.startsWith("#") && !line.startsWith("|") && !line.startsWith("[") && !line.startsWith(">") && !line.startsWith("**")) {
        descriptionText += line + " ";
      }
    }
    mon.actions = actionText.trim();
    mon.traits = traitText.trim();
    mon.description = descriptionText.trim();
    monsters.push(mon);
  }
  return monsters;
}

// ─── Magic Items ──────────────────────────────────────────────────────────

function extractMagicItems(): Record<string, any>[] {
  const dir = path.join(RULESET, "09_Magic_Items", "Magic_Items_Each");
  const items: Record<string, any>[] = [];
  if (!fs.existsSync(dir)) return items;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const text = fs.readFileSync(path.join(dir, file), "utf-8");
    const lines = text.split("\n");
    const item: Record<string, any> = {};
    item.name = lines[0]?.replace(/^#+\s*/, "").trim() || "";
    if (!item.name) continue;
    const rest = lines.slice(1).join(" ").trim();
    const italicMatch = rest.match(/^\*(.+?)\*$/);
    if (italicMatch) {
      item.type = italicMatch[1];
      item.description = rest.substring(italicMatch[0].length).trim();
    } else {
      const boldMatch = lines[1]?.match(/^\*(.+?)\*/);
      if (boldMatch) {
        item.type = boldMatch[1];
        item.description = lines.slice(2).join(" ").trim();
      } else {
        item.type = "";
        item.description = lines.slice(1).join(" ").trim();
      }
    }
    items.push(item);
  }
  return items;
}

// ─── Tables ────────────────────────────────────────────────────────────────

function extractTables(): Record<string, any> {
  return {
    ability_modifiers: [
      [1, -5], [2, -4], [3, -3], [4, -3], [5, -3],
      [6, -2], [7, -2], [8, -1], [9, -1], [10, 0],
      [11, 0], [12, 1], [13, 1], [14, 2], [15, 2],
      [16, 3], [17, 3], [18, 4], [19, 4], [20, 5],
      [21, 5], [22, 6], [23, 6], [24, 7], [25, 7],
      [26, 8], [27, 8], [28, 9], [29, 9], [30, 10],
    ],
    difficulty_classes: [
      ["Very easy", 5], ["Easy", 10], ["Medium", 15],
      ["Hard", 20], ["Very hard", 25], ["Nearly impossible", 30],
    ],
    exhaustion: [
      [1, "Disadvantage on ability checks"],
      [2, "Speed halved"],
      [3, "Disadvantage on attack rolls and saving throws"],
      [4, "Hit point maximum halved"],
      [5, "Speed reduced to 0"],
      [6, "Death"],
    ],
    xp_thresholds: [
      [1, 0], [2, 300], [3, 900], [4, 2700], [5, 6500],
      [6, 14000], [7, 23000], [8, 34000], [9, 48000], [10, 64000],
      [11, 85000], [12, 100000], [13, 120000], [14, 140000], [15, 165000],
      [16, 195000], [17, 225000], [18, 265000], [19, 305000], [20, 355000],
    ],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log("Extracting weapons...");
const weapons = extractWeapons();
fs.writeFileSync(path.join(OUT_DIR, "weapons.json"), JSON.stringify(weapons, null, 2));
console.log(`  ${weapons.length} weapons`);

console.log("Extracting armor...");
const armor = extractArmor();
fs.writeFileSync(path.join(OUT_DIR, "armor.json"), JSON.stringify(armor, null, 2));
console.log(`  ${armor.length} armor items`);

console.log("Extracting spells...");
const spells = extractSpells();
fs.writeFileSync(path.join(OUT_DIR, "spells.json"), JSON.stringify(spells, null, 2));
console.log(`  ${spells.length} spells`);

console.log("Extracting monsters...");
const monsters = extractMonsters();
fs.writeFileSync(path.join(OUT_DIR, "monsters.json"), JSON.stringify(monsters, null, 2));
console.log(`  ${monsters.length} monsters`);

console.log("Extracting magic items...");
const magicItems = extractMagicItems();
fs.writeFileSync(path.join(OUT_DIR, "magic_items.json"), JSON.stringify(magicItems, null, 2));
console.log(`  ${magicItems.length} magic items`);

console.log("Writing tables...");
const tables = extractTables();
fs.writeFileSync(path.join(OUT_DIR, "tables.json"), JSON.stringify(tables, null, 2));

console.log("Done. Output in src/generated/");
