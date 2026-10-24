// prompt-composition.ts — build-time prompt inputs and invocation-time prompt
// assembly. [library]
//
// REQ-078a, REQ-023a, REQ-063, REQ-127a, §6.4.1 — ruleset-specific prompt
// prose is derived at Package time into `model.prompt_inputs`; the host
// assembles each prompt from those inputs plus live state. With no inputs the
// composers return the ruleset-free bodies verbatim, so a world-model-only
// server behaves exactly as before.
//
// Pure: no state, registry, filesystem, or clock access. Callers supply every
// live value.

export interface CreationCategory {
  label: string;
  options: string[];
  meaning?: string;
}

export interface PersonalityConstruct {
  name: string;
  field: string;
  description?: string;
}

export interface PromptInputs {
  display_name?: string;
  tagline?: string;
  core_mechanic?: string;
  sourcebooks?: string[];
  creation_categories?: CreationCategory[];
  personality_constructs?: PersonalityConstruct[];
  example_of_play?: string;
  narrative_tone?: string[];
}

export interface IntroContext {
  inputs?: PromptInputs | null;
  library: string;
  specRepoUrl: string;
}

export interface SessionZeroContext {
  inputs?: PromptInputs | null;
  rosterCount?: number;
  adventure?: {
    premise?: string;
    factions?: string[];
    npcs?: string[];
    opening?: string;
  } | null;
}

export interface NovelSetupContext {
  inputs?: PromptInputs | null;
  steps: {
    adventure: string;
    characters: string;
    sessionZero: string;
    rosterCount: number;
  };
  authoring: string;
}

export interface ToolCategory {
  category: string;
  tools: string[];
}

export interface RunWorkflowContext {
  inputs?: PromptInputs | null;
  rulesetBound: boolean;
  toolNames: string[];
  categories?: ToolCategory[];
}

function listOr(value: string[] | undefined, fallback: string): string {
  if (!value || value.length === 0) return fallback;
  return value.join(", ");
}

function modelName(inputs: PromptInputs | null | undefined): string {
  return inputs?.display_name?.trim() || "Holonovel";
}

function modelTagline(inputs: PromptInputs | null | undefined): string {
  const name = modelName(inputs);
  return inputs?.tagline?.trim() || `${name} — a tabletop roleplay ruleset.`;
}

export function composeIntro(ctx: IntroContext): string {
  const { inputs, library, specRepoUrl } = ctx;
  const opening = inputs
    ? `${modelTagline(inputs)}

${modelName(inputs)} runs tabletop roleplay with a real, persistent world. Every
scene, character, and object lives on the server — not in a chat window — so
your campaign survives restarts, breaks, and even rebuilds.${inputs.core_mechanic ? ` The core mechanic is ${inputs.core_mechanic}.` : ""}
${inputs.sourcebooks && inputs.sourcebooks.length > 0 ? `Sourcebooks in this build: ${listOr(inputs.sourcebooks, "")}.` : "This server is world-model-only: no sourcebook is loaded, so the world model carries play."}`
    : `This server runs tabletop roleplay with a real, persistent world. Every scene,
character, and object lives on the server — not in a chat window — so your
campaign survives restarts, breaks, and even rebuilds. Your campaign is the
program you step into; the rules are whatever you bring to the table.`;

  return `# Welcome to ${inputs ? modelName(inputs) : "Holonovel"}

${opening}
${library}

## Getting started
1. Create a world for your campaign, or resume one from the list above.
2. Run the setup guide to add characters, choose a story source, and agree on
   tone before play.
3. Choose your role — player, game master, or observer.
4. Enter the story and begin your first scene.

For the latest specification, see ${specRepoUrl}.`;
}

export function composeSessionZero(ctx: SessionZeroContext = {}): string {
  const inputs = ctx.inputs ?? null;
  if (!inputs) return rulesetFreeSessionZero();
  return modelSessionZero(inputs, ctx);
}

function rulesetFreeSessionZero(): string {
  return `# Session Zero

Before the story begins, this guide helps you and the game master agree on the
shape of the adventure. It is a creative check and a safety check — the choices
you make here shape the narration for the whole story. Nothing needs to be final.

## 1. Welcome and safety
This is where you set expectations. You can change any of this later. If a topic
is off-limits, say so now — the server remembers and keeps it out of the story.

## 2. Tone, difficulty, pace, focus, and boundaries
Each of these is a dial you can set. Here is what each one does.

Tone — the mood of the story.
- Bright heroics: clear victories, warm allies, hope at the end of every scene.
- Gritty realism: hard choices, scarce resources, consequences that stick.
- Dark and ominous: creeping dread, fragile safety, victory at a cost.
- Whimsical: playful logic, absurd coincidences, charm over threat.
- Melancholic: quiet loss, bittersweet resolutions, emotional weight.

Difficulty — how much the world pushes back.
- Gentle: the world gives you room to succeed; stakes are low.
- Balanced: fair odds, real risk, meaningful choices.
- Relentless: the world is hostile; every step costs something.
- Brutal: survival itself is an achievement; loss is common.

Pace — how fast the story moves.
- Slow: rich description, long scenes, time to linger.
- Balanced: scenes move when they should.
- Fast: cut to the action, little downtime, quick scene changes.

Focus — what the story centers on.
- Exploration: discovery, maps, unknown places.
- Combat: tactics, battles, escalating threats.
- Social: dialogue, intrigue, relationships.
- Mystery: clues, hidden truths, revelation.
- Mixed: all of the above, in balance.

Boundaries — what stays out of the story.
Name any topics that should never be narrated, implied, or introduced. They are
kept out of every scene, every scene description, and every choice.

## 3. Character introductions
Three ways to introduce a character, from quickest to most detailed.
- Quick: "A grizzled ranger who trusts no one." A single line is enough to play.
- Full: three paragraphs — first appearance and mannerisms, then personality and
  voice, then backstory and motivation.
- Media short-hand: "Like Samwise, but hardened by a decade in the arena — loyal,
  kind, and quietly ruthless when pushed." Name a known character, then say what
  to change or emphasize.

## 4. Character creation
Your world's rules define how characters are built. Every mechanical choice —
ancestry, class, background, ability scores, equipment — is described in plain
English, and each option's meaning for your character's abilities is explained.
If the world has a roster, those characters are available to import directly.

## 5. Adventure confirmation
If an adventure is loaded, here is its premise, its factions and their tensions,
its key characters, and its opening scene. You can accept it as-is or describe
what to change. If you are building from scratch, describe the setting and the
game master will shape it around you.

## 6. What the game master can do
During play the game master can set scenes, introduce characters, run world
events, offer you choices, and pace tension. Each is described in plain English
with examples of what you would say — no commands, no jargon.

## 7. Quick start
Everything is ready. The first scene begins when the game master sets it, and
you describe what your character does. You can refine anything here at any time.

## 8. Between stories
Characters can grow between sessions — refine personality, voice, dialogue, and
advancement when your rules provide it. The world you build is kept for the next
session.`;
}

function modelSessionZero(inputs: PromptInputs, ctx: SessionZeroContext): string {
  const sections = rulesetFreeSessionZero().split("\n## ");
  const head = sections[0];
  const body = sections.slice(1);

  const constructs = (inputs.personality_constructs ?? []).map((c) =>
    `- ${c.name}: ${c.description ?? `maps to the Holonovel ${c.field} field.`}`);
  const section3 = constructs.length > 0
    ? `3. Character introductions
Three ways to introduce a character, from quickest to most detailed.
- Quick: "A grizzled ranger who trusts no one." A single line is enough to play.
- Full: three paragraphs — first appearance and mannerisms, then personality and
  voice, then backstory and motivation.
- Media short-hand: "Like Samwise, but hardened by a decade in the arena — loyal,
  kind, and quietly ruthless when pushed." Name a known character, then say what
  to change or emphasize.

This world names its own character terms. Use them when you describe your
character:
${constructs.join("\n")}`
    : body[2];

  const categoryLines = (inputs.creation_categories ?? []).map((c) => {
    const options = c.options.length > 0 ? c.options.join(", ") : "as described by your rules";
    return `- ${c.label}: ${options}${c.meaning ? ` — ${c.meaning}` : ""}`;
  });
  const section4 = categoryLines.length > 0
    ? `4. Character creation
Your world's rules define how characters are built. Every mechanical choice is
described in plain English, and each option's meaning for your character's
abilities is explained.
${categoryLines.join("\n")}
${ctx.rosterCount && ctx.rosterCount > 0 ? `The roster already holds ${ctx.rosterCount} ${ctx.rosterCount === 1 ? "character" : "characters"} available to import.` : "If the world has a roster, those characters are available to import directly."}`
    : body[3];

  const adventure = ctx.adventure;
  const section5 = adventure && (adventure.premise || adventure.opening)
    ? `5. Adventure confirmation
Here is the loaded adventure. You can accept it as-is or describe what to change.
${adventure.premise ? `\nPremise: ${adventure.premise}` : ""}${adventure.factions && adventure.factions.length > 0 ? `\nFactions and tensions: ${adventure.factions.join("; ")}` : ""}${adventure.npcs && adventure.npcs.length > 0 ? `\nKey characters: ${adventure.npcs.join(", ")}` : ""}${adventure.opening ? `\nOpening scene: ${adventure.opening}` : ""}`
    : body[4];

  const example = inputs.example_of_play?.trim();
  const section6 = example
    ? `${body[5]}\n\nAn excerpt from this ruleset's own play shows the rhythm:\n${example}`
    : body[5];

  return [head, body[0], body[1], section3, section4, section5, section6, body[6], body[7]].join("\n## ");
}

export function composeNovelSetup(ctx: NovelSetupContext): string {
  const { inputs, steps, authoring } = ctx;
  const categories = inputs?.creation_categories ?? [];
  const choiceLine = categories.length > 0
    ? `Character creation choices in this world: ${categories.map((c) => c.label).join(", ")}. Each is described in plain English.`
    : "Character creation choices are described in plain English.";

  return `# Novel Setup

A guided setup for your world. Complete each step in order; the markers show
where you are.

## Step 1 — Story source   ${steps.adventure}
Choose where the story begins: load a written adventure, generate one from a
premise, generate a random encounter, or build from scratch. Each option is
explained in terms of what you get narratively.

Community-sourced play advice tailored to your adventure's themes is available
for this world — voice examples, lore ideas, and scene advice. You can run
synthesis now or proceed without it.

## Step 2 — Author the world   ${authoring}
The story source is only a starting point. Look at what the world already has,
then list what is still empty and fill it in from the ground up — places and
creatures before fine detail, lore before relationships, relationships before
clocks. Work down the list with the author, confirming each surface as it is
populated. A world is ready to play once it has enough structure to begin; the
rest is optional and can be added at any time. Because characters come next,
leave anything that depends on them for later.

## Step 3 — Characters   ${steps.characters}
You have ${steps.rosterCount} ${steps.rosterCount === 1 ? "character" : "characters"} in your roster.
Would you like to import one, create a new one, or move on? ${choiceLine}

## Step 4 — Session zero   ${steps.sessionZero}
Run the session zero guide to agree on tone, difficulty, pace, focus, and
boundaries, and to confirm the opening scene.

When the tracked steps show [✓], the world is ready. A summary follows
describing what is ready and how to begin your first scene.`;
}

export function composeRunWorkflow(ctx: RunWorkflowContext): string {
  const { inputs, rulesetBound, toolNames, categories } = ctx;
  if (!categories || categories.length === 0) {
    const catalog = (names: string[]) => names.filter((n) => toolNames.includes(n)).join(", ");
    return `# Run Workflow

Map natural-language intent to the registered tool catalog. Derive associations
from the live registry, not hardcoded strings.

## Intent to Tool Mapping

- **Spatial / movement / inspection**: ${rulesetBound ? catalog(["run_command"]) || "run_command (action: resolve), run_command (GM)" : "run_command (parser)"}
- **Character creation / advancement**: ${catalog(["manage_character"]) || "character (create/import/sheet/set_active)"}
- **Combat**: ${catalog(["manage_combat"]) || "combat (init/advance/end)"}
- **World building**: ${catalog(["manage_world"]) || "world (create_room/create_thing/create_exit/convert)"}
- **Narrative / scene**: ${[catalog(["manage_scene"]), catalog(["manage_story"])].filter(Boolean).join(", ") || "manage_scene (set/directive), manage_story (record)"}
- **Lookup**: ${[catalog(["manage_ruleset"]), catalog(["manage_session"]), catalog(["run_command"])].filter(Boolean).join(", ") || "ruleset (search), session (health), command (suggest)"}

Select the tool whose registered action classification matches the intent.`;
  }

  const mapping = categories
    .filter((c) => c.tools.length > 0)
    .map((c) => `- **${c.category}**: ${c.tools.join(", ")}`)
    .join("\n");
  const mechanic = inputs?.core_mechanic ? `\nThis world resolves actions through ${inputs.core_mechanic}.` : "";
  return `# Run Workflow

Map natural-language intent to the registered tool catalog. Associations below
are derived from the live registry's action classifications, not hardcoded
strings.${mechanic}

## Intent to Tool Mapping

${mapping}

Select the tool whose registered action classification matches the intent.`;
}

export function composeBadgeOrientation(profile: string, loopRole: string): string {
  return profile === "lean"
    ? "**Play loop:** State, then tools, then narration."
    : loopRole === "player"
      ? "**Play loop:** Read the current state, resolve mechanics through tools, then act in character once the engine validates the result."
      : "**Play loop:** Read the current state, resolve mechanics through tools, then narrate the validated result to the table.";
}

export function composeNarrativeTone(inputs: PromptInputs | null | undefined): string {
  const samples = inputs?.narrative_tone?.filter((s) => s.trim().length > 0) ?? [];
  if (samples.length === 0) {
    return "[narrative-tone] Describe the world through grounded, sensory detail. Let consequences follow from the fiction — every mechanical outcome lands in the scene you narrate.";
  }
  return samples.map((s) => `[narrative-tone] ${s}`).join("\n");
}
