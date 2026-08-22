# Ironsworn: Starforged SRD — Vendor Enrichment

Source: Shawn Tomkin, CC-BY 4.0
URL: https://ironswornrpg.com
Confidence: HIGH (curated, licensed SRD)

## Module: narrative_voices (3 items)

### `is-vow-swearing` — HIGH

Vow-swearing is a sacred act in the Ironsworn setting. Characters bind themselves to
quests through solemn oaths, and the narrative weight of a vow creates stakes that
persist across scenes. Progress tracks model the journey, not the destination.

Source anchor: Ironsworn: Starforged SRD, Vows

### `is-oracle-driven` — HIGH

When narrative momentum stalls, roll on oracle tables to inject unpredictability. The
Ask the Oracle move resolves yes/no questions with likelihood modifiers: almost certain
(90%), likely (70%), even (50%), unlikely (30%), small chance (10%). Oracle results are
interpreted narratively — they suggest direction, not dictate outcome.

Source anchor: Ironsworn: Starforged SRD, Ask the Oracle

### `is-progress-narrative` — HIGH

Progress tracks measure narrative advancement rather than time or effort. Each move
contributes progress proportional to its outcome: strong hits advance two ticks, weak
hits advance one, misses advance none. The Progress Roll resolves the track — a success
means the goal is achieved; a failure introduces a dramatic complication.

Source anchor: Ironsworn: Starforged SRD, Progress Tracks

## Module: action_patterns (4 items)

### `is-swear-an-iron-vow` — HIGH
Intent: "I swear to achieve a goal"
Suggested actions: set_vow
Rationale: Formalize a narrative goal into a tracked vow per REQ-289.

### `is-ask-the-oracle` — HIGH
Intent: "What happens next?" / "Is the door locked?"
Suggested actions: ask_oracle
Rationale: Resolve uncertainty with a d100 roll per likelihood bands.

### `is-secure-an-advantage` — HIGH
Intent: "I prepare for what's coming" / "I set up an ambush"
Suggested actions: roll_skill_check, set_scene_state, set_lore_entry
Rationale: Preparation moves improve position before the main challenge.

### `is-face-danger` — HIGH
Intent: "I try to avoid the threat" / "I push through the hazard"
Suggested actions: roll_save, roll_skill_check
Rationale: Reactive move for dangerous situations — choose save type based on fiction.

## Module: adventure_advice (4 items)

### `is-quest-framing` — HIGH
Category: adventure_templates
Content: Structure adventures as vow chains. An inciting vow links to milestones that
each reveal a new vow. This creates natural narrative escalation without pre-planned
plots. The starting sector oracle tables provide setting-appropriate hooks.

### `is-milestone-tracking` — HIGH
Category: adventure_templates
Content: Use milestone marking as pacing guides. Each milestone should correspond to a
significant narrative beat — discovering a clue, winning an ally, navigating a hazard,
defeating a guardian. The number of milestones is set by difficulty: troublesome (10),
dangerous (20), formidable (30), extreme (40), epic (50).

### `is-oracle-tables` — HIGH
Category: table_expansions
Content: Oracle tables for action/theme (50 entries each), location descriptors, character
role archetypes, settlement naming, and sector generation. These supplement the ruleset's
random tables for narrative generation.

### `is-settlement-builder` — HIGH
Category: scenario_starters
Content: Use settlement trouble tables to seed adventure premises: "Authority is
corrupt," "Resource is scarce," "Vengeful faction plots." Each entry combines a location
descriptor with a conflict axis to generate immediate hooks.

## Module: supplementary_guidance (3 items)

### `is-solo-narrative-loops` — MEDIUM
Core gameplay loop for solo/GM-less play: set scene → make a move that triggers fiction
→ consult oracle when uncertain → record outcome → advance progress → mark milestone.
This loop maps to Holonovel's scene state, dice resolution, player choices, and progress
tracking.

### `is-vow-scoping` — HIGH
Difficulty tiers map to narrative scope: troublesome (single-scene obstacle), dangerous
(adventure-spanning goal), formidable (multi-session quest), extreme (campaign climax),
epic (world-changing deed). A vow should match the table's session commitment — do not
assign an epic vow to a one-shot.

### `is-co-op-structure` — MEDIUM
Cooperative play distributes narrative authority. Players jointly decide scene
framing, trade off move resolutions, and veto oracle results by consensus. This maps
to Holonovel's multi-entity support and shared-scope content gating per REQ-308.
