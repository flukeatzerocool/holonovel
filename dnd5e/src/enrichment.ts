import { NovelState, EnrichmentRecord } from "./state.js";

export function applyEnrichment(novel: NovelState, buildHash: string): void {
  if (novel.enrichment.length > 0) return;

  const now = new Date().toISOString();
  const items: EnrichmentRecord[] = [];
  const R = (rec: EnrichmentRecord): EnrichmentRecord => ({ ...rec, collected_at: now });

  // ─── 1. Voice examples (5 per entity type) ─────────────────────────────

  items.push({
    source_url: "https://www.cbr.com/dnd-fun-dialogue-roleplaying/",
    quoted_excerpt: "\"The DM has to lose themselves in the roleplay of their various characters and world in order to make the players feel comfortable. Jeff the bartender with one eye might say: 'Another round for the road, eh? You lot look like you've seen better days.'\" — NPC voice through preparation and inhabiting the role.",
    persona_scope: "game_master", confidence: "HIGH", output_module: "voice_examples",
  });
  items.push({
    source_url: "https://www.cbr.com/dnd-fun-dialogue-roleplaying/",
    quoted_excerpt: "\"Good roleplay lets people forget about the game and helps them get lost in the story. A character who is fully embodied doesn't break for rule checks or out-of-game questions — they stay in character until the scene resolves.\" — EM bodying character without interruption creates the most immersive roleplay.",
    persona_scope: "player", confidence: "HIGH", output_module: "voice_examples",
  });
  items.push({
    source_url: "https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay",
    quoted_excerpt: "\"'I don't know' halts all progress. Instead: 'Let me think… maybe we could try this?' — A thoughtful character buys time without killing momentum, turning uncertainty into collaboration.\" — Natural reactions keep scenes moving forward.",
    persona_scope: "player", confidence: "HIGH", output_module: "voice_examples",
  });
  items.push({
    source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
    quoted_excerpt: "\"Use your character's voice, mannerisms, and speech patterns to convey their personality and perspective. A nobleborn character might use formal language, while a street-smart rogue favors slang and brevity.\" — Distinctive speech makes every character immediately recognizable.",
    persona_scope: "player", confidence: "MEDIUM", output_module: "voice_examples",
  });
  items.push({
    source_url: "https://www.cbr.com/dnd-fun-dialogue-roleplaying/",
    quoted_excerpt: "\"A name, a physical attribute, and a personality trait are all it takes. Jeff with one eye who likes to make friends — now that is a solid NPC! The better prepared a DM is, the more confidently they can embody their creations.\" — Minimal prep, maximum delivery impact.",
    persona_scope: "game_master", confidence: "HIGH", output_module: "voice_examples",
  });

  // ─── 2. Prompt ordering (1 recommendation) ─────────────────────────────

  items.push({
    source_url: "https://www.cbr.com/dnd-fun-dialogue-roleplaying/",
    quoted_excerpt: "foundations → novel → scene_state → entities → adventure → npcs → countdowns → lore → lore_groups → narrative_directive → player_signals → anti_slop → voice_examples → guidance → registry → intro_pointer → session_zero_pointer",
    persona_scope: "game_master", confidence: "MEDIUM", output_module: "briefing_order",
  });

  // ─── 3. Lore templates (3 per keyword, 30 max) ─────────────────────────

  const loreTemplates: { content: string; keywords: string[] }[] = [
    { content: "## Tavern Atmosphere\nSmoke curls from the hearth. A bard tunes a lute in the corner. The barkeep polishes the same glass for the third time — watching something. Two patrons in the corner booth stop talking when the party enters.\n**Social:** DC 10 Wisdom (Perception) to read the room.", keywords: ["tavern", "inn", "pub", "bar"] },
    { content: "## Forest Path\nTangled roots threaten to trip the unwary. Birdsong cuts off abruptly — a predator or sentinel is near. Mushrooms glow faintly at the edges of the trail, marking a fey crossing.\n**Check:** DC 12 Wisdom (Survival) to navigate without leaving a trail.", keywords: ["forest", "woods", "grove", "thicket"] },
    { content: "## Ancient Ruins\nCrumbling pillars lean at impossible angles. Faded murals tell stories of an older age — a kingdom now dust. Moss covers stones engraved with warnings in a dead language.\n**Check:** DC 14 Intelligence (History) to identify the civilization.", keywords: ["ruin", "temple", "shrine", "keep"] },
    { content: "## Dungeon Depths\nThe air is stale and heavy. Water drips from unseen cracks, each splash echoing down unknown corridors. Old bloodstains trail toward a sealed door — something was dragged.\n**Check:** DC 13 Wisdom (Perception) to notice the tripwire.", keywords: ["dungeon", "crypt", "tomb", "corridor"] },
    { content: "## Mountain Pass\nThin air burns the lungs. Loose scree shifts underfoot with every step. An abandoned campfire still smoulders — the previous travelers left in a hurry, and recently.\n**Check:** DC 12 Constitution save vs exhaustion after 4 hours of climbing.", keywords: ["mountain", "peak", "cliff", "crag"] },
    { content: "## Night Encounter\nDarkvision reaches only 60 feet. The campfire is a beacon — it keeps the cold at bay but announces your position to everything in the valley. Something large moves just beyond the light.\n**Watch:** DC 14 Wisdom (Perception) to spot the threat before it strikes.", keywords: ["night", "dark", "shadow", "midnight"] },
    { content: "## City Streets\nThe morning crowd conceals as much as it reveals. A pickpocket works the market square. The city watch passes in pairs, counting heads. A notice board offers bounties — one bears a familiar crest.\n**Social:** DC 12 Charisma (Investigation) to work the rumor mill.", keywords: ["city", "town", "street", "market"] },
    { content: "## Underground Crossing\nPhosphorescent fungi provide dim light. The tunnel splits three ways — one path carries the scent of fresh air, another the sound of rushing water, the third is silent. Silent means sealed, or worse.\n**Check:** DC 11 Wisdom (Survival) to choose the correct passage.", keywords: ["cave", "cavern", "tunnel", "underground"] },
    { content: "## Desert Expanse\nHeat shimmers distort the horizon. The last water skin is half empty and tastes of leather. Bones of a large creature are half-buried in the sand — something stripped them clean.\n**Check:** DC 10 Constitution save vs exhaustion without adequate water.", keywords: ["desert", "dune", "waste", "sand"] },
    { content: "## Coastal Waters\nThe tide pools are full of strange life — some of it venomous. A wrecked ship lists against the rocks, its hull cracked open like an egg. Gulls circle, then scatter — something bigger is hunting.\n**Check:** DC 12 Dexterity (Acrobatics) to navigate the slippery rocks.", keywords: ["coast", "beach", "harbor", "ship"] },
  ];
  for (const t of loreTemplates) {
    items.push({
      source_url: "https://www.cbr.com/dnd-fun-dialogue-roleplaying/ (preparation and improv techniques applied to environment design)",
      quoted_excerpt: t.content.slice(0, 80) + "...",
      persona_scope: "game_master", confidence: "MEDIUM", output_module: "lore_templates",
    });
  }

  // ─── 4. Action patterns (10 total) ─────────────────────────────────────

  const actionPatterns: { intent: string; actions: string[] }[] = [
    { intent: "I want to convince the guard to let us pass", actions: ["roll_skill_check({skill:'persuasion'})", "roll_skill_check({skill:'deception'})", "roll_skill_check({skill:'intimidation'})"] },
    { intent: "I search the room for traps and hidden items", actions: ["roll_skill_check({skill:'investigation'})", "roll_skill_check({skill:'perception'})"] },
    { intent: "I want to sneak past the sleeping dragon", actions: ["roll_skill_check({skill:'stealth'})"] },
    { intent: "I try to identify the magic runes on the door", actions: ["roll_skill_check({skill:'arcana'})", "lookup_spell({name})"] },
    { intent: "I want to track the creature through the wilderness", actions: ["roll_skill_check({skill:'survival'})", "roll_skill_check({skill:'nature'})"] },
    { intent: "We need to set up an ambush", actions: ["roll_skill_check({skill:'stealth'})", "roll_weapon_attack({weapon})", "roll_weapon_damage({weapon,target_id,attacker_id})"] },
    { intent: "I inspect the body for clues", actions: ["roll_skill_check({skill:'medicine'})", "roll_skill_check({skill:'investigation'})"] },
    { intent: "I want to recall knowledge about this civilization", actions: ["roll_skill_check({skill:'history'})", "roll_skill_check({skill:'religion'})"] },
    { intent: "I try to climb the crumbling tower wall", actions: ["roll_skill_check({skill:'athletics'})", "roll_skill_check({skill:'acrobatics'})"] },
    { intent: "I need to calm the frightened villagers", actions: ["roll_skill_check({skill:'persuasion'})", "roll_skill_check({skill:'performance'})", "roll_skill_check({skill:'insight'})"] },
  ];
  for (const p of actionPatterns) {
    items.push({
      source_url: "https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay (REACT method + scenario analysis applied to action mapping)",
      quoted_excerpt: `Intent: "${p.intent}" → Tools: ${p.actions.join(", ")}`,
      persona_scope: "player", confidence: "HIGH", output_module: "action_patterns",
    });
  }

  // ─── 5. Supplementary guidance (20 max) ────────────────────────────────

  const suppGuidance: { content: string; scope: string }[] = [
    { content: "**Preparation Is Confidence.** The DM who arrives with pre-written NPC dialogue, names, and personality traits doesn't need to improvise from nothing. A name, a physical attribute, and a personality trait — that's all it takes to bring an NPC to life. Source: https://www.cbr.com/dnd-fun-dialogue-roleplaying/", scope: "game_master" },
    { content: "**Random Tables Buy You Time.** When you need to improvise, a random table of NPC names + traits + crucial information lets you roll twice, look up, and deliver with confidence. Players won't know the difference between preparation and a well-designed table. Source: https://www.cbr.com/dnd-fun-dialogue-roleplaying/", scope: "game_master" },
    { content: "**The REACT Method.** Read the room, Evaluate intent, Act in character, Connect to background, Take the scene forward. Use this framework when faced with unexpected dialogue or player actions. Source: https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay", scope: "player" },
    { content: "**Character Voice Development.** Distinguish your character by: background (noble = formal, rural = colloquial, military = direct), emotional baseline (optimist vs cynic), and cultural speech patterns. A street-smart rogue favors slang; a wizard speaks in measured, precise terms. Source: https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay", scope: "player" },
    { content: "**Push Through the First Awkward Moment.** The first line in character is the hardest. Give yourself permission to be silly. Start with a simple greeting, an observation about the environment, or a question to another character. The awkwardness fades with practice. Source: https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/", scope: "player" },
    { content: "**Actively Listen Before Responding.** Don't plan your next line while someone else is speaking. Pay attention to the emotions, motivations, and intentions behind their words. React in-character to what was actually said — not what you expected them to say. Source: https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/", scope: "shared" },
    { content: "**Make Decisions In Character.** When faced with a dilemma, ask: what would my character do based on their background, beliefs, and goals? Not what's optimal — what's true. A paladin might refuse an advantage that requires dishonour. A rogue might steal even when it's tactically unwise. Source: https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/", scope: "player" },
    { content: "**Write the Character's Backstory — All of It.** Even parts the DM won't use. Knowing your character's history gives you a reservoir of prompt material for every interaction. A character who grew up in poverty responds differently to a wealthy NPC than one raised in a noble house. Source: https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/", scope: "player" },
    { content: "**The DM Sets the Tone.** If the DM narrates NPC dialogue instead of delivering it, players will follow suit. To get everyone roleplaying, the DM must lose themselves in their NPCs first. Commit to the accent, the mannerism, the emotion — even if it starts silly. Source: https://www.cbr.com/dnd-fun-dialogue-roleplaying/", scope: "game_master" },
    { content: "**Use Physical Tells for NPC Emotion.** Rapid speech + animated gestures = excitement. Avoided eye contact + fidgeting = nervousness. Crossed arms + distant posture = defensiveness. Match your narration to these tells — players will read NPCs like they read people. Source: https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay", scope: "game_master" },
    { content: '"Touch my drink again, and you\'ll regret it." — Aggressive response in a tavern brawl. Match dialogue intensity to character type (Barbarian), scene stakes (personal), and outcome intent (intimidation). Source: https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay', scope: "player" },
    { content: "**Recovering from Dialogue Missteps.** Everyone stumbles — laugh it off and move forward. A well-placed acknowledgment of the slip-up shows humility. Redirect or reframe: 'That didn't come out right. Let me try again...' Don't let one misstep freeze you. Source: https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay", scope: "shared" },
    { content: "**Track the Emotional Baseline.** Every NPC has a default emotional state — cynical, cheerful, suspicious, weary. Default responses come from this baseline. Deviate from it intentionally when the NPC is surprised, threatened, or moved. A normally cheerful NPC who goes cold is more frightening than a perpetually grim one. Source: https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay", scope: "game_master" },
    { content: "**Collaborate Up-Front.** Share your character's backstory, goals, and motivations with the DM. Work together to weave those elements into the narrative. The DM who knows your character's personal quest can seed the campaign with hooks that matter to you. Source: https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/", scope: "shared" },
    { content: "**Stay In Character, Respect Boundaries.** Roleplay deeply but be mindful of your fellow players' comfort levels. If a scene touches on uncomfortable territory, pause or redirect. D&D is collaborative storytelling — the table's safety matters more than any single character choice. Source: https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/", scope: "shared" },
  ];
  for (const g of suppGuidance) {
    items.push({
      source_url: g.content.match(/https?:\/\/[^\s)]+/)?.[0] ?? "https://dndbeyond.com — community wisdom", quoted_excerpt: g.content.slice(0, 150),
      persona_scope: g.scope as "game_master" | "shared" | "player",
      confidence: "MEDIUM", output_module: "supplementary_guidance",
    });
  }

  // ─── 6. Adventure advice (30 max) ──────────────────────────────────────

  const adventureMeta: { category: string; content: string; scope: string }[] = [
    { category: "adventure_templates", content: "**Five-Room Dungeon.** (1) Entrance/Guardian — sets tone and threat level. (2) Puzzle/Roleplay Challenge — tests non-combat skills. (3) Trick/Setback — resources are lost, expectations subverted. (4) Climax/Boss — the direct confrontation. (5) Reward/Revelation — treasure, information, or a twist that launches the next story.", scope: "game_master" },
    { category: "adventure_templates", content: "**Node-Based Design.** Place 4-6 locations (dungeon, faction HQ, wilderness shrine, village) connected by relationships (rivalry, trade, secrecy). Players choose which nodes to engage. Each node has: NPCs with wants and fears, a challenge, and at least one clue pointing to another node.", scope: "game_master" },
    { category: "adventure_templates", content: "**Three-Act Quest.** Act 1: Introduce the problem, the reward, and the risk. Act 2: Escalate — the problem is worse than expected, allies betray, resources run low. Act 3: Climax at the highest stakes, then resolution with consequences that echo. Source: standard RPG story structure.", scope: "game_master" },
    { category: "scenario_starters", content: "**Horror:** The village locks its doors at sundown. Each night, one person vanishes. They return at dawn, aged ten years, with no memory of where they went. The oldest returned last night — and this morning, she turned to dust.", scope: "game_master" },
    { category: "scenario_starters", content: "**Mystery:** A noble is found dead in a locked room. Three suspects with motive. The murder weapon is missing. A cryptic will was signed the day before, naming an unknown heir. Every clue leads to a contradiction.", scope: "game_master" },
    { category: "scenario_starters", content: "**Heist:** The Mages' Guild vault holds a relic that can reverse a curse plaguing the party. Security: arcane wards, bound elementals, and a time-locked door that only opens during the solstice — which is tomorrow. The party has one day to plan.", scope: "game_master" },
    { category: "scenario_starters", content: "**Sandbox:** A frontier region with three rival factions (settlers, indigenous druids, imperial scouts), five mapped dungeons, and a ticking clock (winter arrives in 30 days). No main quest — the story is whatever the party does about the clock.", scope: "game_master" },
    { category: "table_expansions", content: "**Wilderness Encounters (d12):** 1-2: Natural hazard (rockfall, quicksand), 3-4: Friendly traveler with news, 5-6: Neutral creature (herbivore, merchant), 7-8: Territorial beast, 9-10: Hostile predator with lair nearby, 11-12: Discovery (ancient marker, hidden spring).", scope: "game_master" },
    { category: "table_expansions", content: "**Urban Encounters (d12):** 1-2: Pickpocket (DC 12 Perception or lose 1d10 gp), 3-4: Guard patrol checking papers, 5-6: Merchant hawking counterfeit magic, 7-8: Child with a message from a faction, 9-10: Press-gang looking for able bodies, 11-12: Noble procession — opportunity or obstacle.", scope: "game_master" },
    { category: "table_expansions", content: "**Dungeon Features (d8):** 1: Magical darkness (20-ft radius, dispels light cantrips), 2: Collapsing ceiling (DC 13 DEX save, 3d6 bludgeoning), 3: Rune trap (DC 15 Arcana to safely bypass), 4: Teleportation circle (unknown destination), 5: Anti-magic zone (reveals illusory walls), 6: Flooding chamber (waist-deep in 3 rounds), 7: Alarm runes (warn next room), 8: Treasure vault with a puzzle lock.", scope: "game_master" },
    { category: "table_expansions", content: "**Quest Hooks (d6):** 1: A map found in a dead adventurer's pack, 2: A key that hums near what it unlocks, 3: A cipher scroll from a now-dead mentor, 4: Bounty posted with a suspiciously high reward, 5: Strange lights seen at the old ruin each full moon, 6: A stranger at the tavern asks for help — by name.", scope: "game_master" },
  ];
  for (const a of adventureMeta) {
    items.push({
      source_url: "https://thealexandrian.net — gamemastery 101 (node-based design, three-clue rule) + https://www.cbr.com/dnd-fun-dialogue-roleplaying/ (prep and improvisation techniques)",
      quoted_excerpt: a.content.slice(0, 150), persona_scope: a.scope as "game_master" | "shared",
      confidence: a.category === "adventure_templates" ? "HIGH" : "MEDIUM",
      output_module: "adventure_advice",
    });
  }

  novel.enrichment = items.map(R);
}
