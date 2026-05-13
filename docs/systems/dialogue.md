# Dialogue System

> **Modules**: `src/systems/DialogueSystem.ts`, `src/systems/CharismaSystem.ts`, `src/systems/LLMDialogue.ts`
>
> **Type**: Pure functions for structured dialogue; imperative shell for LLM API calls
>
> **Signature**: Varies — structured dialogue is pure; LLM dialogue wraps an async API

---

## Overview

The Dialogue System transforms encounters from simple "pick A or B" into **rich, branching conversations** where the player's stats, skills, items, and reputation unlock additional options. At the pinnacle — **100 Charisma** — the player unlocks **free-form dialogue powered by an LLM**, allowing them to type anything and receive contextual, in-character responses that can produce real mechanical outcomes.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Charisma System](#charisma-system)
3. [Structured Dialogue Trees](#structured-dialogue-trees)
4. [Dialogue Option Gating](#dialogue-option-gating)
5. [LLM-Powered Free Dialogue](#llm-powered-free-dialogue)
6. [Integration with Encounter System](#integration-with-encounter-system)
7. [API](#api)
8. [Testing Strategy](#testing-strategy)

---

## Design Philosophy

### Three Tiers of Dialogue

```
┌────────────────────────────────────────────────────────────┐
│  TIER 1: Basic Dialogue (Charisma 0–39)                    │
│  ─────────────────────────────────────                     │
│  2–3 simple choices per encounter                          │
│  "Fight" / "Flee" / "Accept"                               │
│  No stat checks beyond obvious ones                         │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  TIER 2: Skilled Dialogue (Charisma 40–79)                 │
│  ─────────────────────────────────────                     │
│  4–6 choices, some gated behind stat/item checks            │
│  "Intimidate (requires Attack 50+)"                         │
│  "Bargain (requires spirit stones 200+)"                   │
│  "Share knowledge (requires Comprehension 30+)"            │
│  "Invoke sect authority (requires Cloud Sect Inner Disciple)"│
│                                                            │
├────────────────────────────────────────────────────────────┤
│  TIER 3: Silver Tongue (Charisma 80–99)                    │
│  ─────────────────────────────────────                     │
│  6–8 choices, some unique to this tier                      │
│  "Persuade peacefully" (bypasses combat entirely)           │
│  "Recruit as ally" (NPC joins temporarily)                  │
│  "Extract secret" (learn hidden location/technique)         │
│  All stat requirements reduced by 20%                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  TIER 4: Heaven's Voice (Charisma 100)                     │
│  ─────────────────────────────────────                     │
│  ALL structured choices from tiers 1–3 always available     │
│  PLUS: ✨ "Speak Freely..." option at the bottom            │
│  Free text input → LLM-powered NPC response                │
│  No stat/item gates — charisma alone is the key             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Why an LLM?

At 100 Charisma, the player has mastered social interaction within the cultivation world. The structured options become too limiting — the player *should* be able to attempt anything. The LLM:
- Provides **unbounded roleplay** for the most dedicated players
- Rewards the long grind to 100 Charisma with a genuinely unique feature
- Can produce mechanical outcomes (reputation changes, items, combat avoidance) that the game interprets
- Is entirely optional — structured choices remain available

### Safety & Cost

- LLM feature is **locked behind max Charisma** (rare achievement, <5% of players)
- Free-form input has a **cooldown** (1 message per 60 seconds)
- Responses are **cached** (same encounter + same input = same response)
- **No PII is sent** — only game state context (stats, NPC name, location)
- System prompt is **immutable server-side** (or hardcoded client-side if using a local model)
- Fallback: if LLM is unavailable, structured options still work

---

## Charisma System

### What Is Charisma?

Charisma represents the player's social presence, force of personality, and ability to influence others through words, aura, and bearing. In cultivation terms: *the weight of one's Dao pressing upon the world*.

### Stat Properties

```typescript
interface CharismaState {
  value: number;                    // 0–100
  experience: number;               // Hidden XP toward next point
  maxValue: number;                 // Always 100
  breakdown: CharismaBreakdown;     // Sources of charisma (for UI tooltip)
}

interface CharismaBreakdown {
  base: number;                     // From realm (1 per realm)
  equipmentBonus: number;           // From equipped items
  techniqueBonus: number;           // From passive technique effects
  reputationBonus: number;          // +1 per 20 total sect standing
  deedBonus: number;                // Permanent gains from achievements
  titleBonus: number;               // "Elder of Cloud Sect" = +5
}
```

### Gaining Charisma

| Source | Charisma XP Gained |
|--------|-------------------|
| Successful peaceful encounter resolution | 10–50 XP |
| Persuade an NPC (gated dialogue success) | 20–30 XP |
| Recruit an ally | 50 XP |
| Defuse combat through dialogue | 30 XP |
| Complete a sect diplomatic mission | 25–50 XP |
| Win a tournament with dialogue option | 20 XP |
| Help a wandering elder | 15 XP |
| Bribe successfully | 5 XP |
| Intimidate successfully | 10 XP (less — fear ≠ charisma) |
| Bargain a discount >20% | 10 XP |
| Reach a new realm | 20 XP (natural presence increase) |
| Become sect elder | 100 XP (one-time) |
| Be spared by a stronger enemy via words | 50 XP |

**XP per level**: Scales exponentially. Early levels are fast; 90→100 is a long grind.

```typescript
function charismaXPForLevel(level: number): number {
  // Level 1: 100 XP, Level 50: 2500 XP, Level 100: 10000 XP
  return Math.floor(100 + level * level * 0.9);
}
```

### Charisma Tier Effects (Passive)

| Charisma | Effect |
|----------|--------|
| 1–39 | No passive effects |
| 40–79 | **Silver Tongue**: 10% merchant discount, +1 dialogue option slot |
| 80–99 | **Golden Words**: 20% merchant discount, +2 dialogue option slots, 20% lower stat requirements on dialogue checks, peaceful resolution chance vs beasts |
| 100 | **Heaven's Voice**: 30% merchant discount, all dialogue options unlocked, **LLM free dialogue enabled**, NPCs occasionally gift items unprompted, rogue cultivators may surrender without fighting |

---

## Structured Dialogue Trees

### Dialogue Node Structure

```typescript
interface DialogueTree {
  readonly id: string;
  readonly encounterType: EncounterType;
  readonly nodes: Record<string, DialogueNode>;
  readonly startNodeId: string;
}

interface DialogueNode {
  readonly id: string;
  readonly speaker: 'npc' | 'player_inner' | 'narrator';
  readonly text: string;                    // NPC dialogue (supports ${variable} interpolation)
  readonly emotion?: NPCMotion;            // Visual/tonal cue
  readonly choices: DialogueChoice[];
  readonly isTerminal?: boolean;           // Ends dialogue (no choices)
  readonly onEnter?: DialogueEffect[];     // Effects applied when this node is reached
}

type NPCMotion =
  | 'neutral' | 'angry' | 'fearful' | 'impressed'
  | 'amused' | 'suspicious' | 'respectful' | 'greedy'
  | 'desperate' | 'arrogant' | 'grateful';

interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly tooltip?: string;               // Why this option exists ("Your high attack impresses them")
  readonly requirements: DialogueRequirement[];
  readonly visibilityCharisma: number;     // Minimum charisma to SEE this option
  readonly leadsTo: string;                // Target node ID
  readonly onSelect?: DialogueEffect[];
}

interface DialogueRequirement {
  readonly type: 'stat' | 'item' | 'reputation' | 'skill' | 'technique' | 'realm' | 'karma' | 'flag';
  readonly key: string;                    // Stat name, item ID, sect ID, etc.
  readonly operator: '>=' | '<=' | '==' | '!=' | 'has' | 'not_has';
  readonly value: number | string;
  readonly charismaDiscount: number;       // How much charisma lowers this requirement (0-1)
}
```

### Example: Rogue Cultivator Encounter

```typescript
const rogueCultivatorDialogue: DialogueTree = {
  id: 'rogue_cultivator_ambush',
  encounterType: 'rogue_cultivator',
  startNodeId: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: 'npc',
      text: '"Halt! Hand over your spirit stones, and I might let you keep your life. This road belongs to Iron Palm Chen!"',
      emotion: 'arrogant',
      choices: [
        // ── TIER 1: Always visible ─────────────────
        {
          id: 'fight',
          text: 'Draw your weapon. "You chose the wrong cultivator to rob."',
          visibilityCharisma: 0,
          requirements: [],
          leadsTo: 'combat',
          onSelect: [{ type: 'startCombat', enemy: 'iron_palm_chen' }],
        },
        {
          id: 'flee',
          text: 'Turn and run.',
          visibilityCharisma: 0,
          requirements: [],
          leadsTo: 'flee_attempt',
          onSelect: [{ type: 'attemptFlee' }],
        },
        {
          id: 'bribe',
          text: '"Take 50 spirit stones and let us both walk away."',
          tooltip: 'You have enough spirit stones to pay him off.',
          visibilityCharisma: 0,
          requirements: [
            { type: 'stat', key: 'spiritStones', operator: '>=', value: 50, charismaDiscount: 0 },
          ],
          leadsTo: 'bribe_accepted',
          onSelect: [
            { type: 'removeSpiritStones', amount: 50 },
            { type: 'modifyReputation', sect: 'rogues', delta: 5 },
          ],
        },

        // ── TIER 2: Charisma 40+ ──────────────────
        {
          id: 'intimidate',
          text: 'Release your killing intent. "Do you know who I am?"',
          tooltip: 'Your cultivation realm far exceeds his.',
          visibilityCharisma: 40,
          requirements: [
            { type: 'stat', key: 'attack', operator: '>=', value: 30, charismaDiscount: 0.2 },
            { type: 'realm', key: 'realm', operator: '>=', value: 2, charismaDiscount: 0.2 },
          ],
          leadsTo: 'intimidated',
          onSelect: [
            { type: 'modifyReputation', sect: 'rogues', delta: 15 },
            { type: 'gainCharismaXP', amount: 15 },
            { type: 'log', text: 'Iron Palm Chen pales and stumbles backward.' },
          ],
        },

        // ── TIER 3: Charisma 80+ ──────────────────
        {
          id: 'persuade_join',
          text: '"Why rob travelers when you could cultivate under my guidance? Join me."',
          tooltip: 'Your charisma can turn enemies into allies.',
          visibilityCharisma: 80,
          requirements: [
            { type: 'reputation', key: 'cloud_soaring', operator: '>=', value: 50, charismaDiscount: 0.2 },
          ],
          leadsTo: 'recruited',
          onSelect: [
            { type: 'recruitAlly', npcId: 'iron_palm_chen' },
            { type: 'gainCharismaXP', amount: 50 },
            { type: 'log', text: 'Iron Palm Chen kneels. "This Chen... will follow you, Senior!"' },
          ],
        },

        // ── TIER 4: Charisma 100 ──────────────────
        {
          id: 'free_dialogue',
          text: '✨ Speak freely...',
          tooltip: 'Heaven\'s Voice: say anything you wish.',
          visibilityCharisma: 100,
          requirements: [],  // No gates — charisma is the key
          leadsTo: 'free_dialogue',
          onSelect: [{ type: 'openFreeDialogue', context: 'rogue_cultivator_ambush' }],
        },
      ],
    },

    // ── Response nodes ────────────────────────────

    intimidated: {
      id: 'intimidated',
      speaker: 'npc',
      text: '"S-senior! This humble one was blind! Please, spare me!" Iron Palm Chen drops to his knees, spirit stones scattering from his pouch.',
      emotion: 'fearful',
      choices: [
        {
          id: 'spare',
          text: '"Go. Rob travelers again and I won\'t be merciful."',
          visibilityCharisma: 0,
          requirements: [],
          leadsTo: 'end_spared',
          onSelect: [
            { type: 'pickupSpiritStones', amount: 30 },
            { type: 'gainCharismaXP', amount: 10 },
            { type: 'modifyKarma', delta: 5 },
          ],
        },
        {
          id: 'kill_anyway',
          text: '"Too late for apologies." Strike him down.',
          visibilityCharisma: 0,
          requirements: [],
          leadsTo: 'combat_weakened',
          onSelect: [
            { type: 'startCombat', enemy: 'iron_palm_chen_terrified', advantage: 'first_strike' },
            { type: 'modifyKarma', delta: -10 },
          ],
        },
        // Charisma 60+ option:
        {
          id: 'reform',
          text: '"Your skills are wasted on banditry. Take these stones and seek the Cloud Sect. Tell them I sent you."',
          visibilityCharisma: 60,
          requirements: [
            { type: 'reputation', key: 'cloud_soaring', operator: '>=', value: 30, charismaDiscount: 0.3 },
            { type: 'stat', key: 'spiritStones', operator: '>=', value: 100, charismaDiscount: 0.3 },
          ],
          leadsTo: 'reformed',
          onSelect: [
            { type: 'removeSpiritStones', amount: 100 },
            { type: 'modifyReputation', sect: 'cloud_soaring', delta: 15 },
            { type: 'gainCharismaXP', amount: 30 },
            { type: 'setFlag', flag: 'reformed_iron_palm_chen' },
            { type: 'log', text: 'Chen\'s eyes glisten. "Senior... you would do this for a wretch like me?"' },
          ],
        },
      ],
    },

    recruited: {
      id: 'recruited',
      speaker: 'npc',
      text: '"Senior... truly? You would accept this worthless Chen?" He stares at the ground, then looks up with burning determination.',
      emotion: 'grateful',
      choices: [
        {
          id: 'accept',
          text: '"Rise, Junior Brother Chen."',
          visibilityCharisma: 0,
          requirements: [],
          leadsTo: 'end_recruited',
          onSelect: [
            { type: 'addAlly', npc: 'iron_palm_chen_ally' },
            { type: 'gainCharismaXP', amount: 40 },
            { type: 'log', text: 'Iron Palm Chen becomes your companion. (+10% combat damage, +5 inventory slots)' },
          ],
        },
      ],
    },

    bribe_accepted: {
      id: 'bribe_accepted',
      speaker: 'npc',
      text: 'Chen snatches the stones. "Smart cultivator. Get lost before I change my mind."',
      emotion: 'greedy',
      isTerminal: true,
      onEnter: [
        { type: 'modifyReputation', sect: 'rogues', delta: 3 },
        { type: 'log', text: 'He let you pass — this time.' },
      ],
    },

    // Terminal nodes
    end_spared: { id: 'end_spared', speaker: 'narrator', text: 'Chen scrambles away into the underbrush.', isTerminal: true },
    end_recruited: { id: 'end_recruited', speaker: 'narrator', text: 'You continue your journey, a new ally at your side.', isTerminal: true },
    combat: { id: 'combat', speaker: 'narrator', text: 'Steel sings as you draw your weapon.', isTerminal: true },
    combat_weakened: { id: 'combat_weakened', speaker: 'narrator', text: 'Chen is already broken. This will be quick.', isTerminal: true },
    flee_attempt: { id: 'flee_attempt', speaker: 'narrator', text: 'You turn and dash into the trees...', isTerminal: true },
  },
};
```

---

## Dialogue Option Gating

### How Requirements Are Evaluated

```typescript
function evaluateDialogueRequirement(
  state: GameState,
  req: DialogueRequirement
): boolean {
  const effectiveRequirement = applyCharismaDiscount(req, state.player.charisma);

  switch (req.type) {
    case 'stat': {
      const playerValue = getPlayerStat(state.player, req.key);
      return compareValues(playerValue, req.operator, effectiveRequirement);
    }
    case 'item': {
      const hasItem = state.player.inventory.some(i =>
        i.id === req.key || i.type === req.key
      );
      return req.operator === 'has' ? hasItem : !hasItem;
    }
    case 'reputation': {
      const standing = state.player.faction.reputations[req.key]?.standing ?? 0;
      return compareValues(standing, req.operator, effectiveRequirement);
    }
    case 'skill': {
      // Skills: 'alchemy', 'formation_mastery', 'beast_taming', etc.
      const skillLevel = state.player.skills[req.key] ?? 0;
      return compareValues(skillLevel, req.operator, effectiveRequirement);
    }
    case 'technique': {
      const knowsTechnique = state.player.equippedTechniques.some(t =>
        t.id === req.key || t.name.includes(req.key as string)
      );
      return req.operator === 'has' ? knowsTechnique : !knowsTechnique;
    }
    case 'realm': {
      return compareValues(state.player.realm, req.operator, effectiveRequirement);
    }
    case 'karma': {
      return compareValues(state.player.karma, req.operator, effectiveRequirement);
    }
    case 'flag': {
      const flagSet = state.flags[req.key] ?? false;
      return req.operator === 'has' ? flagSet : !flagSet;
    }
  }
}

/** Charisma reduces numeric requirements */
function applyCharismaDiscount(
  req: DialogueRequirement,
  charisma: number
): number {
  if (typeof req.value !== 'number') return req.value;
  if (req.charismaDiscount === 0) return req.value;

  const discount = Math.min(0.5, charisma / 100 * req.charismaDiscount * 2);
  return Math.floor(req.value * (1 - discount));
}
```

### How Options Are Filtered for Display

```typescript
function getAvailableChoices(
  state: GameState,
  node: DialogueNode
): DialogueChoice[] {
  return node.choices.filter(choice => {
    // 1. Charisma visibility check
    if (state.player.charisma < choice.visibilityCharisma) {
      return false; // Player cannot even see this option
    }

    // 2. Requirement check
    for (const req of choice.requirements) {
      if (!evaluateDialogueRequirement(state, req)) {
        return false;
      }
    }

    return true;
  });
}
```

### The Player Sees

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  Iron Palm Chen blocks the road.                 │
│  "Hand over your spirit stones!"                 │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ ⚔️ Draw your weapon.                     │    │
│  │ "You chose the wrong cultivator to rob." │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ 🏃 Turn and run.                         │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ 💰 "Take 50 spirit stones."              │    │
│  │ (You have 234 stones)                    │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ 😤 Release killing intent.               │    │ ◄── Unlocked at Charisma 40
│  │ "Do you know who I am?"                  │    │
│  │ (Requires: Attack 30+, Realm 2+)         │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ 🤝 "Join me instead."                    │    │ ◄── Unlocked at Charisma 80
│  │ (Requires: Cloud Sect standing 50+)      │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ ✨ Speak freely...                        │    │ ◄── Unlocked at Charisma 100
│  └──────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

Options are rendered with:
- **Emoji indicator** for the action type
- **Tooltip** explaining why the option exists
- **Locked options shown grayed out** with requirement text (player knows what they're missing)
- **Charisma-gated options** show the charisma threshold if not met

---

## LLM-Powered Free Dialogue

### Unlock Condition

```typescript
function canUseFreeDialogue(state: GameState): boolean {
  return state.player.charisma >= 100;
}
```

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                     CLIENT SIDE                       │
│                                                      │
│  Player types: "Tell me about the ancient ruins       │
│                 nearby. I have a jade pendant..."     │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │        LLMDialogueService.ts                 │    │
│  │                                              │    │
│  │  1. Build context (game state, NPC, history) │    │
│  │  2. Build system prompt + user message        │    │
│  │  3. Check cache (hash of input + context)     │    │
│  │  4. Send to LLM API                          │    │
│  │  5. Parse response for mechanical effects     │    │
│  │  6. Return response text + effects            │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                             │
└─────────────────────────┼─────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                 LLM API (server-side)                 │
│                                                      │
│  System prompt: "You are a character in a wuxia       │
│  cultivation world. Respond in character..."          │
│                                                      │
│  Context: { playerRealm, location, NPC, items... }    │
│                                                      │
│  Response: { text, effects[] }                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### System Prompt (Immutable, Server-Side)

```
You are an NPC in a wuxia cultivation game called "Idle Cultivation Sect."

CURRENT CONTEXT:
- You are: {npcName}, {npcDescription}
- Your personality: {npcPersonality}
- Your goals: {npcGoals}
- Location: {locationName} — {locationDescription}
- The player: {playerTitle} {playerName}, {playerRealm} realm, {playerSect} sect
- Player's known techniques: {playerTechniques}
- Player's notable items: {playerNotableItems}
- Player's reputation: {playerReputations}
- Recent history: {recentHistory}

RULES:
1. Stay in character. Respond as the NPC would.
2. Your response MUST be 1-3 paragraphs.
3. If the player's request would have a mechanical effect in the game, include it
   in a JSON block at the end: ```effects\n[{ "type": "...", ... }]\n```
4. Available effects: giveItem, removeItem, modifyReputation, revealLocation,
   startCombat, avoidCombat, shareKnowledge (unlocks technique hint),
   modifyKarma, grantQuest, tellSecret (lore), nothing
5. Do NOT break character to explain the effects block.
6. Do NOT reveal information the NPC wouldn't know.
7. If the player asks something impossible or metagaming, have the NPC react
   with confusion or irritation in-character.

EXAMPLES:
Player: "Give me all your spirit stones!"
Bad: "I cannot do that. There is no mechanic for it."
Good: "Chen laughs bitterly. 'Senior jests! If I had stones, would I be robbing travelers on this dusty road?'"
```effects
[{ "type": "nothing" }]
```

Player: "Tell me about the ancient ruins nearby. I have a jade pendant I found in the village."
Good: "Chen's eyes narrow at the pendant. 'That symbol... I've seen it carved into the walls of the Sunken Monastery, deep in the Whispering Forest. The elders say it was a sect that defied heaven itself. If you seek their legacy... follow the eastern stream until the trees grow silent.'"
```effects
[{ "type": "revealLocation", "locationId": "sunken_monastery" }, { "type": "tellSecret", "secret": "jade_pendant_origin" }]
```

### Building the Context

```typescript
interface LLMDialogueContext {
  // NPC info
  npcName: string;
  npcDescription: string;
  npcPersonality: string;
  npcGoals: string;

  // Location
  locationName: string;
  locationDescription: string;

  // Player info
  playerTitle: string;            // "Outer Disciple Li Wei"
  playerName: string;
  playerRealm: string;            // "Nascent Soul, Layer 5"
  playerSect: string;             // "Cloud Soaring Sect" or "Rogue Cultivator"
  playerRace: string;
  playerOrigin: string;           // "Village Orphan"
  playerKarma: string;            // "Righteous (65)"

  // Player capabilities
  playerTechniques: string;       // "Nine Heavens Sword, Cloud Step"
  playerNotableItems: string;     // "Thunder-Forged Serpent Sword (Legendary), Ancient Jade Pendant"
  playerStats: string;            // "Attack: 120, Defense: 80, Comprehension: 45"

  // Social standing
  playerReputations: string;      // "Cloud Soaring: Honored (75), Shadow Heaven: Hostile (-45)"
  playerAllies: string;           // "Iron Palm Chen (companion)"

  // History
  recentHistory: string;          // Last 5 significant events
  encounterContext: string;       // Why this dialogue is happening

  // Secrets the NPC might know
  npcKnownSecrets: string[];      // World secrets this NPC could reveal
  npcKnownLocations: string[];    // Hidden locations this NPC knows about
}
```

### Building the User Message

```typescript
function buildUserMessage(
  playerInput: string,
  context: LLMDialogueContext
): string {
  return `PLAYER INPUT: ${playerInput}

IMPORTANT: The player has Heaven's Voice (max charisma). They can attempt
anything through dialogue. Evaluate if their request is reasonable given:
- The NPC's personality and knowledge
- The game world's logic
- The player's actual capabilities (realm, items, reputation)

Respond in character. Include effects if appropriate.`;
}
```

### Parsing the Response

```typescript
interface LLMDialogueResponse {
  text: string;                     // The NPC's in-character response
  effects: DialogueEffect[];        // Parsed mechanical effects
}

function parseLLMResponse(rawResponse: string): LLMDialogueResponse {
  // Extract effects block if present
  const effectsMatch = rawResponse.match(/```effects\n([\s\S]*?)\n```/);

  let effects: DialogueEffect[] = [];
  if (effectsMatch) {
    try {
      effects = JSON.parse(effectsMatch[1]);
      // Validate effects against allowed list
      effects = validateAndSanitizeEffects(effects);
    } catch {
      // Invalid JSON — ignore effects, just show text
      effects = [{ type: 'nothing' }];
    }
  }

  // Remove the effects block from display text
  const text = rawResponse.replace(/```effects\n[\s\S]*?\n```/, '').trim();

  return { text, effects };
}
```

### Allowed Effects (Whitelist)

```typescript
type DialogueEffect =
  | { type: 'nothing' }
  | { type: 'giveItem'; itemTemplate: string; rarity?: Rarity }
  | { type: 'removeSpiritStones'; amount: number }
  | { type: 'giveSpiritStones'; amount: number }
  | { type: 'modifyReputation'; sectId: string; delta: number }
  | { type: 'modifyKarma'; delta: number }
  | { type: 'revealLocation'; locationId: string }
  | { type: 'startCombat'; enemyTemplate: string }
  | { type: 'avoidCombat' }
  | { type: 'shareKnowledge'; hint: string }
  | { type: 'grantQuest'; questId: string }
  | { type: 'tellSecret'; secretId: string }
  | { type: 'recruitAlly'; npcId: string }
  | { type: 'giveTechniqueHint'; techniqueId: string };
```

### Validate and Sanitize

```typescript
function validateAndSanitizeEffects(raw: unknown[]): DialogueEffect[] {
  const sanitized: DialogueEffect[] = [];

  for (const effect of raw) {
    if (!effect || typeof effect !== 'object') continue;

    const e = effect as Record<string, unknown>;

    // Whitelist check
    if (!ALLOWED_EFFECT_TYPES.includes(e.type as string)) continue;

    // Clamp numeric values
    if (e.type === 'modifyReputation' || e.type === 'modifyKarma') {
      e.delta = Math.max(-50, Math.min(50, Number(e.delta) || 0));
    }
    if (e.type === 'giveSpiritStones' || e.type === 'removeSpiritStones') {
      e.amount = Math.max(0, Math.min(1000, Number(e.amount) || 0));
    }
    // Validate sectId, locationId, etc. against known data
    if (e.type === 'modifyReputation' && !SECTS[e.sectId as string]) continue;
    if (e.type === 'revealLocation' && !LOCATIONS[e.locationId as string]) continue;

    sanitized.push(e as DialogueEffect);
  }

  return sanitized;
}
```

### Cooldown & Rate Limiting

```typescript
interface LLMState {
  lastRequestTick: number;
  cooldownTicks: number;           // 60 ticks = 60 seconds
  requestCount: number;            // Total requests (for analytics)
  cache: Map<string, LLMDialogueResponse>;  // Input hash → response
}

function canMakeLLMRequest(state: GameState): boolean {
  const llm = state.player.llmState;
  if (state.tick - llm.lastRequestTick < llm.cooldownTicks) {
    return false;
  }
  return true;
}

function getCachedOrFetch(
  state: GameState,
  input: string,
  context: LLMDialogueContext
): LLMDialogueResponse | null {
  const hash = hashInput(input, context);
  const cached = state.player.llmState.cache.get(hash);
  if (cached) return cached;

  // Not cached — need API call
  return null; // Caller sends to API
}
```

### Caching Strategy

- Cache key = `SHA256(playerInput + npcId + playerRealm + locationId)`
- Cache stored in `localStorage` alongside save data
- Max 50 cached responses (LRU eviction)
- Prevents duplicate API calls for repeated dialogue attempts
- Makes the game playable offline for previously-seen dialogues

### When LLM Is Unavailable

```typescript
const LLM_FALLBACK_MESSAGES: Record<string, string[]> = {
  rogue_cultivator: [
    '"Heh. Words are cheap, cultivator. Show me your strength or your stones."',
    '"You speak well, but I\'ve heard sweeter lies from prettier tongues."',
    'The rogue eyes you warily but says nothing more.',
  ],
  merchant: [
    '"I\'m afraid I don\'t have time for idle chatter. Buy something or move along."',
    '"Interesting... but not interesting enough to lower my prices."',
  ],
  wandering_elder: [
    '"The Dao speaks through silence as much as words, young one."',
    '"Some answers cannot be given. They must be lived."',
  ],
  // ...
};

function getFallbackResponse(npcType: string, rng: PRNG): string {
  const messages = LLM_FALLBACK_MESSAGES[npcType] ?? LLM_FALLBACK_MESSAGES['default'];
  return rng.nextFrom(messages);
}
```

---

## Integration with Encounter System

### Modified Encounter Flow

```
Encounter triggers
    │
    ▼
┌─────────────────────────────────────────────┐
│ Is this a dialogue-capable encounter?        │
│ (rogue cultivator, merchant, elder, etc.)    │
│                                              │
│ YES → Show dialogue tree                     │
│  ├── Display NPC text & emotion              │
│  ├── Show available choices (filtered)       │
│  ├── Show locked choices (grayed, with reqs) │
│  ├── If charisma 100: show "Speak Freely"    │
│  └── Player picks or types                   │
│                                              │
│ NO (beast, treasure, etc.) → auto-resolve    │
└─────────────────────────────────────────────┘
```

### Encounter Type → Dialogue Mapping

| Encounter Type | Has Dialogue? | Dialogue Tree ID |
|---------------|---------------|-----------------|
| `beast_combat` | No | — (auto-combat) |
| `rogue_cultivator` | **Yes** | `rogue_cultivator_ambush` |
| `treasure` | No | — (auto-loot) |
| `merchant` | **Yes** | `merchant_encounter` |
| `ancient_inheritance` | **Yes** (limited) | `inheritance_vision` |
| `tribulation` | No | — (auto-resolve) |
| `peaceful_moment` | No | — (flavor only) |
| `rare_herb` | No | — (auto-loot) |
| `wandering_elder` | **Yes** | `wandering_elder_encounter` |
| `sect_patrol` | **Yes** | `sect_patrol_encounter` |
| `shadow_assassin` | **Yes** | `assassin_confrontation` |

---

## API

```typescript
// ─── Charisma System ────────────────────────

function getCharisma(player: PlayerState): number;
function gainCharismaXP(state: GameState, amount: number): GameState;
function getCharismaTier(charisma: number): 1 | 2 | 3 | 4;
function getCharismaPassives(charisma: number): CharismaPassive[];
function recalculateCharisma(player: PlayerState): number;

// ─── Structured Dialogue ─────────────────────

function getDialogueTree(encounterType: EncounterType, npcId?: string): DialogueTree | null;
function getAvailableChoices(state: GameState, node: DialogueNode): DialogueChoice[];
function getLockedChoices(state: GameState, node: DialogueNode): LockedChoice[];
function selectChoice(state: GameState, choice: DialogueChoice): DialogueResult;
function applyDialogueEffects(state: GameState, effects: DialogueEffect[]): GameState;

// ─── Requirement Evaluation ──────────────────

function evaluateDialogueRequirement(state: GameState, req: DialogueRequirement): boolean;
function applyCharismaDiscount(req: DialogueRequirement, charisma: number): number;
function getRequirementDescription(req: DialogueRequirement): string;

// ─── LLM Free Dialogue ───────────────────────

function canUseFreeDialogue(state: GameState): boolean;
function canMakeLLMRequest(state: GameState): boolean;
function buildLLMContext(state: GameState, encounterType: string, npcId: string): LLMDialogueContext;
function buildUserMessage(playerInput: string, context: LLMDialogueContext): string;
function parseLLMResponse(rawResponse: string): LLMDialogueResponse;
function validateAndSanitizeEffects(raw: unknown[]): DialogueEffect[];
function getCachedOrFetch(state: GameState, input: string, context: LLMDialogueContext): LLMDialogueResponse | null;

// ─── LLM Service (async, imperative shell) ────

async function sendLLMRequest(
  systemPrompt: string,
  userMessage: string,
  apiConfig: LLMAPIConfig
): Promise<string>;

// ─── Dialogue UI ──────────────────────────────

function renderDialogueNode(node: DialogueNode, choices: DialogueChoice[], locked: LockedChoice[]): void;
function renderFreeDialogueInput(state: GameState, context: LLMDialogueContext): void;
```

---

## Data Flow: LLM Dialogue Request

```
1. Player reaches charisma 100
2. Encounter triggers (e.g., Wandering Elder)
3. UI shows structured choices + ✨ "Speak Freely..." option
4. Player clicks "Speak Freely..."
5. UI opens text input with character context summary
6. Player types: "Tell me about the ancient ruins. I have this jade pendant..."
7. System checks:
   ├── Cooldown OK? (>60s since last request)
   ├── Cache hit? → Show cached response immediately
   └── Cache miss → Proceed
8. Build LLMDialogueContext from game state
9. Build system prompt + user message
10. Send to LLM API (with loading indicator)
11. Parse response:
    ├── Extract effects block
    ├── Validate effects against whitelist
    ├── Cache response
    └── Return { text, effects }
12. Display NPC response text with typing animation
13. Apply mechanical effects to game state
14. Log the interaction
15. Player can continue dialogue or end encounter
```

---

## Testing Strategy

### Unit Tests
- `evaluateDialogueRequirement` correctly checks all requirement types
- `applyCharismaDiscount` reduces numeric requirements proportionally
- `getAvailableChoices` filters by charisma visibility AND requirements
- `getLockedChoices` shows options that fail requirements with reason text
- `parseLLMResponse` extracts effects block correctly
- `parseLLMResponse` handles missing/malformed effects gracefully
- `validateAndSanitizeEffects` rejects unknown effect types
- `validateAndSanitizeEffects` clamps numeric values
- `gainCharismaXP` properly levels up and triggers tier changes
- `canUseFreeDialogue` is true only at charisma 100
- `canMakeLLMRequest` respects cooldown

### Integration Tests
- Full dialogue tree: encounter → node → choice → effect → next node → terminal
- Charisma 40 player sees more options than charisma 10 player
- Charisma 100 player sees "Speak Freely" option
- LLM response with valid effects → effects applied to state
- LLM response with invalid effects → effects ignored, text shown
- LLM unavailable → fallback message shown

### Snapshot Tests
- Given fixed game state, `getAvailableChoices` returns deterministic list
- Dialogue tree for each encounter type is valid (no broken links, all nodes reachable)

### Mocked LLM Tests
- Mock API returns known response → verify parsing
- Mock API times out → verify fallback
- Mock API returns non-JSON effects → verify graceful handling

---

*See also: [Encounter System](./encounters.md), [Sect & Faction System](./sect-faction.md), [Data Models](../data-models.md)*
