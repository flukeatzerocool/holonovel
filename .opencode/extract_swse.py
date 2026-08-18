#!/usr/bin/env python3
"""Deterministic SWSE sourcebook extractor + merger.

Reads the 15 supplement Markdown books and merges them into the existing
declarative package at the install dir. Guarantees:
  * normalized lowercase model keys (no Title-Case keys)
  * no null values anywhere
  * exhaustive heading index (one entry per ## and ### heading)
  * content_hash recomputed exactly per the host algorithm
  * idempotent merge (dedupe by normalized key; core rulebook wins)

Run: python3 extract_swse.py
"""

import json, hashlib, os, datetime, re, sys

INSTALL = "/home/fluke/Holonovel-deployed/holonovel/.holonovel-state/rulesets/swse"
SRC_DIR = "/home/fluke/Documents/SWSE/ruleset/SWSE"
HOST_VERSION = "2026.08.18"
SLUG = "swse"

# Books 02..16 (book 01 is the already-extracted core rulebook).
BOOKS = [
    "02_starships_of_the_galaxy.md",
    "03_threats_of_the_galaxy.md",
    "04_knights_of_the_old_republic_campaign_guide.md",
    "05_force_unleashed_campaign_guide.md",
    "06_scum_and_villainy.md",
    "07_clone_wars_campaign_guide.md",
    "08_legacy_era_campaign_guide.md",
    "09_jedi_academy_training_manual.md",
    "10_rebellion_era_campaign_guide.md",
    "11_galaxy_at_war.md",
    "12_scavengers_guide_to_droids.md",
    "13_galaxy_of_intrigue.md",
    "14_unknown_regions_campaign_guide.md",
    "15_dawn_of_defiance.md",
    "16_web_enhancements.md",
]

# Collection classification: heading-text patterns -> collection key.
# Order matters — earlier rules win for a given heading.
COLLECTION_RULES = [
    ("starships", re.compile(r"(starfighter|freighter|transport|capital ship|space ship|starship|cruiser|frigate|corvette|interceptor|bomber|shuttle|fighter craft|patrol ship|battle station|dreadnought|carrier)\b.*(statistics|\(cl |combat|capabilities)|\bstarship statistics\b|^[a-z0-9 -]*(class )?(star)?fighter\b", re.I)),
    ("creatures", re.compile(r"(creature|beast|animal|monster|vermin|plant|raptor|wampa|rancor|bantha|tauntaun|nexu|acklay|sarlaac|sarlacc|vornskr|mynock|exogorth|dianoga|ronto|dewback|nerf)\b.*(statistics|\(cl |encounter|species traits)|\bcreature\b.*(cl \d+)|\bbeast\b.*statistics", re.I)),
    ("droids", re.compile(r"\bdroid\b|battle droid|protocol droid|astromech|super battle droid|droideka|probe droid|\bdroids\b", re.I)),
    ("force_powers", re.compile(r"^force |\bforce (power|technique|secret|tradition)\b|force powers?\b", re.I)),
    ("talents", re.compile(r"talent tree|talents?\b|core talents|additional talents|great talent|dark side talent", re.I)),
    ("feats", re.compile(r"feats?\b|bonus feat|galactic achievement", re.I)),
    ("prestige_classes", re.compile(r"prestige class|forces tradition|advanced classes?\b|elite trooper|bounty hunter|crime lord|force adept|force disciple|droid commander|fringer|gun runner|military engineer|outlaw |ace pilot|martial artist|monk|sith |jedi (master|knight|archivist)|force warrior", re.I)),
    ("equipment", re.compile(r"\b(weapon|armor|equipment|gear|gadget|vehicle upgrade|device|item|enhancement|template|droid accessories|starship accessory|weapon systems?|riot|grenade|blaster|lightsaber)\b", re.I)),
    ("organizations", re.compile(r"\b(organization|guild|bureau|ministry|order|academy|faction|company|cartel|syndicate|society|conglomerate|corporation|bounty hunters? guild|jedi council|empire|republic)\b", re.I)),
    ("concepts", re.compile(r"\b(rules?|mechanics?|combat|condition track|destiny points?|force points?|skills?|defenses?|damage threshold|attack|hazard|encounter|challenge|era|campaign|galaxy|system|phenomenon|planet|region)\b", re.I)),
]


def norm_key(s):
    return re.sub(r"\s+", " ", s).strip().lower()


def canonical(o):
    return json.dumps(json.loads(json.dumps(o)), separators=(",", ":"), ensure_ascii=False)


def load(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def classify_heading(title, prev_h2=None):
    """Return a collection name or None."""
    text = title
    for name, rx in COLLECTION_RULES:
        if rx.search(text):
            return name
    return None


def read_book(filename):
    path = os.path.join(SRC_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
    headings = []
    i = 0
    cur_h2 = None
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^#{1,6}\s+(.*)$", line)
        if m:
            level = len(line) - len(line.lstrip("#"))
            title = m.group(1).strip()
            title = re.sub(r"^#{1,6}\s*", "", title).strip()
            if 2 <= level <= 3:
                # collect following paragraph(s) until next heading/blanks
                body = []
                j = i + 1
                while j < len(lines) and not re.match(r"^#{1,6}\s", lines[j]):
                    s = lines[j].strip()
                    if s:
                        body.append(s)
                    j += 1
                content = " ".join(body)[:400]
                if level == 2:
                    cur_h2 = title
                headings.append({
                    "level": level,
                    "title": title,
                    "h2": cur_h2,
                    "content": content,
                    "line": i + 1,
                })
                i = j
                continue
        i += 1
    return headings


def anchor_slug(title, line):
    a = title.lower()
    a = re.sub(r"[^a-z0-9]+", "-", a).strip("-")
    return a


LOOKUP_TOOLS = [
    ("lookup_feat", "Look Up Feat", "Look up a feat by name.", "feats"),
    ("lookup_talent", "Look Up Talent", "Look up a talent by name.", "talents"),
    ("lookup_force_power", "Look Up Force Power", "Look up a Force power by name.", "force_powers"),
    ("lookup_starship", "Look Up Starship", "Look up a starship or vehicle by name.", "starships"),
    ("lookup_creature", "Look Up Creature", "Look up a creature or beast by name.", "creatures"),
    ("lookup_droid", "Look Up Droid", "Look up a droid by name.", "droids"),
    ("lookup_equipment", "Look Up Equipment", "Look up equipment, weapons, armor, or a device by name.", "equipment"),
    ("lookup_prestige_class", "Look Up Prestige Class", "Look up a prestige class by name.", "prestige_classes"),
]


def ensure_lookup_tools(tools):
    names = {t["name"] for t in tools}
    for name, title, desc, coll in LOOKUP_TOOLS:
        if name in names:
            continue
        tools.append({
            "name": name,
            "title": title,
            "description": desc,
            "kind": "lookup",
            "collection": coll,
            "inputSchema": {
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "Normalized entry name to look up."}
                },
                "required": ["key"],
            },
        })


def main():
    index = load(os.path.join(INSTALL, "index.json"))
    model = load(os.path.join(INSTALL, "model.json"))
    tools = load(os.path.join(INSTALL, "tools.json"))
    resources = load(os.path.join(INSTALL, "resources.json"))
    prompts = load(os.path.join(INSTALL, "prompts.json"))

    # Ensure baseline collections exist.
    for c in ["feats", "talents", "force_powers", "equipment", "starships",
              "creatures", "droids", "prestige_classes", "organizations"]:
        model.setdefault(c, {})

    ensure_lookup_tools(tools)

    existing_ids = {e["id"] for e in index}
    added_index = 0
    added_model = 0

    for book in BOOKS:
        print(f"--- {book} ---", file=sys.stderr)
        headings = read_book(book)
        for h in headings:
            title = h["title"]
            slug = anchor_slug(title, h["line"])
            fname = book

            # INDEX: exhaustive heading coverage (dedupe by id).
            eid = f"{slug}-{h['line']}"
            if eid in existing_ids:
                continue
            cat = classify_heading(title) or (
                "entity" if h["level"] == 2 else "concept")
            index.append({
                "id": eid,
                "anchor": title,
                "source_file": fname,
                "content": h["content"] or title,
                "category": cat,
                "confidence": "MEDIUM",
            })
            existing_ids.add(eid)
            added_index += 1

            # MODEL: only add H2 headings that classify cleanly into a
            # mechanical collection; store name + description (never null).
            coll = classify_heading(title) or classify_heading(h["h2"] or "")
            if h["level"] == 2 and coll and coll not in ("concepts",):
                key = norm_key(title)
                if key and key not in model[coll]:
                    model[coll][key] = {
                        "name": title,
                        "category": coll,
                        "confidence": "MEDIUM",
                        "source_anchor": f"{fname}#{slug}",
                        "description": h["content"] or title,
                    }
                    added_model += 1

    # Rebuild the index sorted deterministically by source_file then line.
    def sort_key(e):
        m = re.search(r"(\d+)$", e["id"] or "")
        return (e.get("source_file", ""), int(m.group(1)) if m else 0)

    index.sort(key=sort_key)

    # Recompute hash.
    h = hashlib.sha256()
    for obj in (index, model, tools, resources, prompts):
        h.update(canonical(obj).encode("utf-8"))
    content_hash = h.hexdigest()

    manifest = load(os.path.join(INSTALL, "manifest.json"))
    manifest["content_hash"] = content_hash
    manifest["built_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    manifest["counts"] = {
        "anchor": len(index),
    }
    for c, entries in model.items():
        manifest["counts"][c] = len(entries)

    def write(name, obj):
        with open(os.path.join(INSTALL, name), "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2, ensure_ascii=False)
            f.write("\n")

    write("index.json", index)
    write("model.json", model)
    write("tools.json", tools)
    write("resources.json", resources)
    write("prompts.json", prompts)
    write("manifest.json", manifest)

    print(f"index: {len(index)} entries (+{added_index})")
    print(f"model collections: { {k: len(v) for k, v in model.items()} } (+{added_model})")
    print(f"content_hash: {content_hash}")


if __name__ == "__main__":
    main()
