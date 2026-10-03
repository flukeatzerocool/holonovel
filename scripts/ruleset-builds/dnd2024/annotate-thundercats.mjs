#!/usr/bin/env node
// annotate-thundercats.mjs — Convert the ThunderCats PDFs to heading-annotated
// Markdown. [build tool]
//
// Hybrid conversion (Convert workflow, Appendix G). The books are two-column,
// InDesign-generated, and carry a hidden OCR text layer:
//   * body text + reading order come from poppler `pdftotext` (plain), which is
//     clean and column-ordered;
//   * heading positions come from poppler `pdftohtml -xml -hidden`, whose font
//     metadata identifies headings (`-hidden` is required; without it body text
//     is dropped on many pages, and PyMuPDF double-reads the layer).
// Headings are matched back into the pdftotext stream by normalized text.
// Chapter display titles come from the books' own table of contents.
//
// Heading levels:
//   #     book title
//   ##    chapter (TOC) / INTRODUCTION / FOREWORD
//   ###   major section      (RevueStd >= 24 in pdftohtml scale)
//   ####  entity / subsection (RevueStd 10-23, RevueStd-SC700, MyriadPro)
//
// Usage: node annotate-thundercats.mjs <campaign|adventures>
//   The Adventures PDF is AES copy-protected; it is re-distilled through
//   Ghostscript to a temp copy first.
//
// Exit codes: 0 = written, 1 = conversion failure, 2 = fatal.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HERE = import.meta.dirname;
const OUT = path.join(HERE, "supplemental-md");
const SOURCE_DIR = process.env.TC_SOURCE_DIR ?? "/home/fluke/Documents/Thundercats";

const BOOKS = {
  campaign: {
    pdf: "/home/fluke/Documents/Thundercats/ThunderCats_5.5E_RPG_Campaign_and_Setting_Guide__DIGITAL__Compressed_204m.pdf",
    title: "ThunderCats 5.5E RPG — Campaign and Setting Guide",
    offset: 1,
    skipPages: [6],
    chapters: [
      [4, "Foreword"],
      [8, "Feel the Magic, Hear the Roar"],
      [30, "Chapter 1: Character Options"],
      [94, "Chapter 2: Third Earth and Beyond"],
      [138, "Chapter 3: Equipment and Vehicles"],
      [178, "Chapter 4: Friends and Foes"],
      [250, "Chapter 5: Thundrillium Quest"],
    ],
    out: "thundercats-campaign.md",
  },
  adventures: {
    pdf: "/home/fluke/Documents/Thundercats/ThunderCats Adventures (DIGITAL).pdf",
    title: "ThunderCats 5.5E RPG — Adventures",
    offset: 1,
    skipPages: [4],
    chapters: [
      [5, "Introduction"],
      [8, "Chapter 1: The Welcome Party"],
      [30, "Chapter 2: Don't Thorburn Your Bridges"],
      [52, "Chapter 3: Capture The Flag"],
      [78, "Chapter 4: Berserker Rage"],
      [92, "Chapter 5: Mumm-Ra Must Die!"],
    ],
    out: "thundercats-adventures.md",
  },
};

const FURNITURE_FONTS = ["BCRebeccaS", "BCRebeccaG", "BaskervillePro", "BerlinSansFBDemi", "NodestoCaps"];
const BODY_FONTS = ["HelveticaNeueLTStd"];

function fail(msg, code = 1) {
  console.error(`annotate-thundercats: ${msg}`);
  process.exit(code);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) fail(`${cmd} failed: ${(r.stderr || "").slice(0, 200)}`);
  return r.stdout;
}

function ensurePdf(cfg) {
  const info = run("pdfinfo", [cfg.pdf]);
  if (!/Encrypted:\s+yes/.test(info)) return cfg.pdf;
  const tmp = path.join(os.tmpdir(), `tc-${path.basename(cfg.pdf, ".pdf")}.dec.pdf`);
  if (!fs.existsSync(tmp)) run("gs", ["-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite", `-sOutputFile=${tmp}`, cfg.pdf]);
  return tmp;
}

function bodyPages(pdf) {
  return run("pdftotext", [pdf, "-"]).split("\f");
}

function headingPages(pdf) {
  const xml = run("pdftohtml", ["-xml", "-hidden", "-i", "-stdout", pdf]);
  const fonts = new Map();
  for (const m of xml.matchAll(/<fontspec id="(\d+)" size="(\d+)" family="([^"]+)"/g)) {
    fonts.set(m[1], { size: Number(m[2]), family: m[3].split("+").pop() });
  }
  const pages = [];
  for (const pm of xml.matchAll(/<page[^>]*>([\s\S]*?)<\/page>/g)) {
    const items = [];
    const seen = new Set();
    for (const m of pm[1].matchAll(/<text top="(-?\d+)" left="(-?\d+)"[^>]*font="(\d+)">([\s\S]*?)<\/text>/g)) {
      const top = Number(m[1]);
      const left = Number(m[2]);
      const font = fonts.get(m[3]) ?? { size: 0, family: "?" };
      const text = m[4].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!text || text.length < 2) continue;
      if (FURNITURE_FONTS.some((f) => font.family.startsWith(f))) continue;
      if (BODY_FONTS.some((f) => font.family.startsWith(f))) continue;
      const level = font.family.startsWith("RevueStd") ? (font.size >= 24 ? 3 : 4) : font.family.startsWith("MyriadPro") ? 4 : null;
      if (level == null) continue;
      const key = `${top}:${text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ top, left, text, level });
    }
    items.sort((a, b) => a.top - b.top || a.left - b.left);
    pages.push(items);
  }
  return pages;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

function render(book) {
  const cfg = BOOKS[book];
  const pages = bodyPages(cfg.pdf); // original: pdftotext reads the clean layer even when copy-protected
  const headings = headingPages(ensurePdf(cfg)); // pdftohtml needs the decrypted copy
  const skip = new Set(cfg.skipPages);

  const out = ["# " + cfg.title, ""];
  let para = [];
  const flush = () => {
    if (para.length) {
      out.push(para.join(" ").replace(/\s+/g, " ").trim(), "");
      para = [];
    }
  };
  const pushBody = (line) => {
    const t = line.trim();
    if (!t) return;
    if (para.length && /-$/.test(para[para.length - 1]) && /^[a-z]/.test(t)) {
      para[para.length - 1] = para[para.length - 1].slice(0, -1) + t;
    } else {
      para.push(t);
    }
  };

  const chapterPages = new Map(cfg.chapters);

  for (let p = 0; p < pages.length; p++) {
    const pno = p + 1;
    const firstLine = pages[p].split("\n").map((l) => l.trim()).find((l) => l);
    if (skip.has(pno) || /^table of contents$/i.test(firstLine ?? "")) continue;
    if (chapterPages.has(pno)) {
      flush();
      out.push("## " + chapterPages.get(pno), "");
    }
    const pageNum = pno - cfg.offset;
    const lines = pages[p].split("\n").map((l) => l.trim());
    const hs = (headings[p] ?? []).map((h) => ({ ...h, used: false, n: norm(h.text) }));
    let cursor = 0;
    let skipChapterTitle = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (line === String(pageNum)) continue; // running page number
      // suppress the raw CHAPTER N / title lines (chapter heading comes from the TOC)
      if (/^CHAPTER\s+\d+\s*$/i.test(line)) {
        skipChapterTitle = true;
        continue;
      }
      if (skipChapterTitle) {
        skipChapterTitle = false;
        continue;
      }
      // heading matched from pdftohtml font metadata
      const nl = norm(line);
      const h = hs.find((x) => !x.used && x.n && (nl === x.n || nl.startsWith(x.n) || (x.n.startsWith(nl) && nl.length >= 4)));
      if (h) {
        h.used = true;
        cursor = i;
        flush();
        out.push("#".repeat(h.level) + " " + h.text, "");
        continue;
      }
      pushBody(line);
    }
    flush();
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const book = process.argv[2];
if (!BOOKS[book]) fail("usage: node annotate-thundercats.mjs <campaign|adventures>", 2);
fs.mkdirSync(OUT, { recursive: true });
const md = render(book);
fs.writeFileSync(path.join(OUT, BOOKS[book].out), md);
const headings = (md.match(/^#{1,4} /gm) ?? []).length;
console.log(`[annotate] ${book}: wrote ${path.join(OUT, BOOKS[book].out)}`);
console.log(`[annotate] ${md.length.toLocaleString()} chars, ${headings} headings`);
process.exit(0);
