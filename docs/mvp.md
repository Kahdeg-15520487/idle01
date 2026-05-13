# MVP Specification — Idle Cultivation Sect

> **Principle**: Ship the story generator loop. Cut everything else. Hand-author what procedural generation would eventually replace. One path, one cultivation style, minimal stats. Prove the core experience in <2 weeks of development.

---

## MVP Scope — What Ships

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   The MVP is a TEXT-DRIVEN STORY GENERATOR              │
│   where cultivation is the consequence of choices.      │
│                                                         │
│   • Events appear                                       │
│   • Player reads, chooses                               │
│   • Outcomes play out with consequences                 │
│   • Cultivation advances as a result                    │
│   • Events queue up while the player is away             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## The MVP Core Loop (3 minutes to learn)

```
      ┌──────────────────────┐
      │   EVENT APPEARS       │
      │   (situation + flavor) │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   PLAYER SEES         │
      │   2–4 CHOICES         │
      │   (some locked by     │
      │    stat/item checks)  │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   PLAYER CHOOSES      │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   OUTCOME PLAYS       │
      │   • Flavor text       │
      │   • Qi +/-            │
      │   • Items +/-         │
      │   • Stats +/-         │
      │   • Flags set         │
      │   • New event chained │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   NEXT EVENT          │
      │   (or travel to find  │
      │    new events)        │
      └──────────────────────┘
```

**There is no "cultivate" button.** Qi comes from resolving events. Breakthrough is itself an event that fires when Qi crosses a threshold.

---

## What's In — The Full List

### Player
- Name input
- 2 races: Human (balanced), Spirit Fox (+speed, +luck, dark affinity in flavor)
- 2 origins: Village Orphan (starts in village, +comprehension), Disgraced Disciple (starts in city, already Qi Condensation L1)
- 5 stats: Attack, Defense, Speed, Comprehension, Luck
- Qi (current / capacity)
- Karma (-100 to +100, simplified)
- Spirit stones (currency)
- Realm + sub-stage (Mortal → Qi Condensation L1–9)
- Health (current / max)

### Equipment
- 1 weapon slot
- Up to 2 technique slots
- Inventory: 20 item slots (stackable where appropriate)

### World
- 5 locations in a line/star graph:
  - **Azure Cloud Village** (starter, safe, low qi)
  - **Whispering Forest** (low danger, herbs, beasts)
  - **Green Jade City** (hub, merchant, services)
  - **Misty Peaks** (medium danger, high qi, cultivation bonus)
  - **Black Wind Gorge** (high danger, rare loot, dark qi)
- Travel: select destination → event may fire en route → arrival

### Events (Hand-Authored, ~25 Total)
- 5 **story chain events** (the Wei Liang / shadow seal arc)
- 5 **beast encounters** (combat or avoid, 1 per location)
- 3 **treasure/discovery events** (find items, learn lore)
- 3 **NPC interaction events** (merchant, elder, rogue)
- 2 **breakthrough events** (Mortal→Qi, Qi L1→L2+)
- 2 **travel events** (road encounters, peaceful moments)
- 3 **idle return events** (catch-up summary, world changes)
- 2 **milestone events** (first breakthrough, first city visit)

### Event Choice Gating
- Stats gate choices: e.g., Comprehension 10+ → examine the cultivator
- Items gate choices: e.g., have healing herb → heal NPC
- Karma gates choices: e.g., Karma > 0 → NPC trusts you
- Race gates choices: e.g., Spirit Fox → sense danger early
- Past flags gate choices: e.g., met Wei Liang → mention him to Elder

### Combat (Auto-Resolve, Simplified)
- Attack vs Defense → damage
- Speed determines who strikes first
- No elements, no stances, no combos
- Health pools: player vs enemy
- Victory: loot (stones, cores, items)
- Defeat: lose some stones, return to last safe location
- Flee: speed check

### Breakthrough
- Fires as an event when Qi ≥ capacity
- Player chooses approach (steady, risky, guided)
- Success chance based on comprehension + luck + choice
- Success: realm up, stats up, new locations, new event chains
- Failure: Qi halved, wait for next breakthrough event

### Idle / Offline
- While away: time passes
- On return: summary screen — "While you were away..."
- Events accumulate in a queue (capped at 5)
- Qi gains from time passed (based on realm)
- World state may shift (beast populations, NPC movements)

### Save / Load
- Auto-save on every event resolution
- Manual save from menu
- One save slot (localStorage)
- On load: check elapsed time, generate offline summary

### UI
- Single screen, mobile-first
- Event card dominates the view
- Bottom bar: Qi, HP, stones, pending event count
- Tab bar: Event | Self | World | Log
- Choice buttons at bottom of event card
- Locked choices shown grayed with requirement text

---

## What's OUT — Deferred to Post-MVP

| Deferred | Why |
|----------|-----|
| Six cultivation paths | One path (Qi) is enough to prove the loop |
| Element system (Wu Xing, affinity, qi types) | Flavor-only for MVP |
| Martial arts styles/stances/combos | Techniques are simple items with +stats |
| Spell system (talismans, formations, divine abilities) | Items-only for MVP |
| Sect joining/ranks/missions | NPCs exist but no faction membership |
| Full dialogue trees with charisma tiers | 2–4 choices per event, no branching dialogue |
| Procedural generation (weapons, beasts, names) | All hand-authored |
| LLM free dialogue | Post-MVP stretch |
| Hidden world state (ecology, rumor mill) | Simplified flags only |
| Political events (tournaments, beast tides) | Post-MVP |
| Territory control | Post-MVP |
| 6 origins, 6 races | 2 each for MVP |
| 20+ locations | 5 for MVP |
| Combo system, weapon arts, internal/external arts | Post-MVP |
| Achievements | Post-MVP |
| Crafting (pills, talismans) | Post-MVP |
| Multiple save slots, export/import | Post-MVP |

---

## MVP Event Format (Hand-Authored JSON)

```typescript
// Each event is a static JSON object. No procedural generation.

interface MVPEvent {
  id: string;
  title: string;                    // "The Dying Cultivator"
  locationId: string;               // Where it fires (or "any", "travel")
  category: 'story' | 'encounter' | 'breakthrough' | 'discovery' | 'return';
  
  // Narrative
  description: string;              // Flavor text, NPC dialogue, scene-setting
  
  // Choices
  choices: MVPChoice[];
  
  // Triggers — when does this event become available?
  trigger: MVPEventTrigger;
  
  // Chaining
  chainId?: string;                 // Belongs to a story chain
  chainStage?: number;              // Position in chain
}

interface MVPChoice {
  id: string;
  text: string;                     // "Examine the cultivator's wound."
  tooltip?: string;                 // "Your comprehension lets you assess his condition."
  
  // Gates — what's required to pick this?
  requires?: {
    stat?: { name: string; min: number };
    item?: string;                  // Item ID must be in inventory
    karma?: { min?: number; max?: number };
    race?: string;
    flag?: string;                  // Past event flag must be set
  };
  
  // Outcome
  outcome: {
    flavorText: string;             // What happens narratively
    qiChange?: number;
    spiritStones?: number;
    itemsGained?: string[];         // Item IDs
    itemsLost?: string[];
    statChanges?: Record<string, number>;
    karmaChange?: number;
    healthChange?: number;
    flagsSet?: Record<string, boolean>;
    nextEventId?: string;           // Chain to another event
    combat?: MVPMonster;            // If choice leads to combat
    travelTo?: string;              // If choice involves travel
  };
}

interface MVPMonster {
  name: string;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  loot: {
    stones: [number, number];
    items: string[];
  };
}

type MVPEventTrigger =
  | { type: 'location'; locationId: string }
  | { type: 'realm'; minRealm: number }
  | { type: 'flag'; flag: string }
  | { type: 'qiThreshold'; min: number }
  | { type: 'chain'; chainId: string; stage: number }
  | { type: 'return'; minTicksAway: number }
  | { type: 'travel' };
```

---

## Example MVP Events

### Event 1: The Dying Cultivator (Location: Azure Cloud Village, Realm: Mortal)

```json
{
  "id": "dying_cultivator",
  "title": "The Dying Cultivator",
  "locationId": "azure_cloud_village",
  "category": "story",
  "trigger": { "type": "location", "locationId": "azure_cloud_village" },
  "chainId": "shadow_beneath_peaks",
  "chainStage": 1,
  "description": "Old Guo, the village gatekeeper, hobbles toward you across the temple courtyard. His face is tight with worry.\n\n\"Li Wei! A wandering cultivator collapsed at the east gate. He's burning with fever, muttering about 'the shadow in the pass.' The headman wants him gone. The healer says he'll die without a spirit herb from the Whispering Forest.\"\n\nOld Guo looks at you expectantly. \"What should we do?\"",
  "choices": [
    {
      "id": "find_herb",
      "text": "\"I'll go to the forest and find the herb.\"",
      "tooltip": "Travel to Whispering Forest. May involve danger.",
      "outcome": {
        "flavorText": "You nod. \"Keep him alive until I return.\"\n\nOld Guo grips your shoulder. \"Be careful, child. The forest has teeth.\"\n\nYou gather your things and head for the east gate.",
        "qiChange": 5,
        "flagsSet": { "accepted_herb_quest": true },
        "travelTo": "whispering_forest",
        "nextEventId": "herb_hunt"
      }
    },
    {
      "id": "examine",
      "text": "\"Let me examine him first.\"",
      "tooltip": "Requires: Comprehension 10+",
      "requires": { "stat": { "name": "comprehension", "min": 10 } },
      "outcome": {
        "flavorText": "You kneel beside the stranger. His robes are travel-worn but finely made. A faded emblem on his collar — a white crane against azure sky.\n\nYour knowledge of sect symbols serves you: Cloud Soaring Sect. This man was important.\n\nHis eyes flicker open. \"You... you have the sight. The fox blood. Go to the pass. Before it's too late.\"\n\nHis eyes close. He's alive, but barely.\n\n+8 Qi. New knowledge: Cloud Soaring Sect. New location noted: Cloud Soaring Sect (distant).",
        "qiChange": 8,
        "statChanges": { "comprehension": 1 },
        "flagsSet": { "examined_cultivator": true, "knows_cloud_sect": true, "accepted_herb_quest": true },
        "nextEventId": "herb_hunt"
      }
    },
    {
      "id": "refuse",
      "text": "\"Let the headman handle it. Not our problem.\"",
      "outcome": {
        "flavorText": "Old Guo's face falls. \"I understand. You're just a sweeper. It's not your burden.\"\n\nHe turns and walks away slowly. The cultivator will be expelled by nightfall. Whatever warning he carried will die with him.\n\n+2 Qi. Karma -5. The village loses something it didn't know it had.",
        "qiChange": 2,
        "karmaChange": -5,
        "flagsSet": { "refused_cultivator": true }
      }
    }
  ]
}
```

### Event 2: The Herb Hunt (Location: Whispering Forest, Trigger: flag "accepted_herb_quest")

```json
{
  "id": "herb_hunt",
  "title": "The Herb Hunt",
  "locationId": "whispering_forest",
  "category": "story",
  "trigger": { "type": "flag", "flag": "accepted_herb_quest" },
  "chainId": "shadow_beneath_peaks",
  "chainStage": 2,
  "description": "You've reached the Whispering Forest in search of a Moondew Bloom — the herb that might save the dying cultivator.\n\nAfter an hour of searching, you find it: a pale blue flower growing on a rocky outcrop, glowing faintly in the forest gloom.\n\nBut a Shadow-Touched Wolf guards it, gnawing on deer bones. It hasn't seen you yet. The herb is 30 paces away.",
  "choices": [
    {
      "id": "fight",
      "text": "\"Fight the wolf. The herb is worth the risk.\"",
      "outcome": {
        "flavorText": "You draw your weapon and step into the clearing.\n\nThe wolf's head snaps up. It snarls — a sound that resonates with something deep in your chest.\n\nCombat begins.",
        "qiChange": 3,
        "combat": {
          "name": "Shadow-Touched Wolf",
          "health": 30,
          "attack": 5,
          "defense": 2,
          "speed": 6,
          "loot": { "stones": [5, 10], "items": ["beast_core_dark_t1"] }
        },
        "flagsSet": { "killed_shadow_wolf": true, "got_moondew": true },
        "nextEventId": "return_with_herb"
      }
    },
    {
      "id": "stealth",
      "text": "\"Wait until dark. Move quietly.\"",
      "requires": { "race": "spirit_fox" },
      "tooltip": "Your fox blood makes you naturally stealthy in forests.",
      "outcome": {
        "flavorText": "You circle upwind, fox-blood instincts sharpening your senses. A thrown stone distracts the wolf. You dart forward, snatch the Moondew Bloom, and retreat.\n\nNo combat. No injury.\n\nThe wolf never knew you were there.",
        "qiChange": 10,
        "flagsSet": { "spared_shadow_wolf": true, "got_moondew": true },
        "nextEventId": "return_with_herb"
      }
    },
    {
      "id": "retreat",
      "text": "\"Forget the herb. Return to the village.\"",
      "outcome": {
        "flavorText": "You watch the wolf for a long moment. Then turn back.\n\nThe cultivator will die without the herb. Whatever warning he carried will never reach its destination. The village headman will be relieved — one less problem.\n\nYou tell yourself it was the smart choice.",
        "qiChange": 1,
        "karmaChange": -3,
        "flagsSet": { "abandoned_cultivator": true }
      }
    }
  ]
}
```

### Event 3: Breakthrough to Qi Condensation (Trigger: Qi at capacity)

```json
{
  "id": "breakthrough_mortal_to_qi",
  "title": "The First Breakthrough",
  "locationId": "any",
  "category": "breakthrough",
  "trigger": { "type": "qiThreshold", "min": 10 },
  "description": "The qi you've gathered from your experiences swirls in your dantian. The walls of your spirit press outward — something wants to break free.\n\nYou sit on the temple steps where you've swept a thousand times. Tonight is different. Tonight, you feel the Dao for the first time.\n\nA breakthrough is imminent.",
  "choices": [
    {
      "id": "steady",
      "text": "\"Meditate calmly. Let the qi settle naturally.\"",
      "tooltip": "Standard breakthrough. 75% success chance.",
      "outcome": {
        "flavorText": "You breathe. The qi stills. And then — like ice cracking in spring — the walls of your dantian expand.\n\nQI CONDENSATION, LAYER 1.\n\nThe world sharpens. Colors are brighter. The mountains seem to breathe.\n\n+5 Attack, +5 Defense, +20 Max HP, +20 Qi capacity.",
        "statChanges": { "attack": 5, "defense": 5 },
        "flagsSet": { "reached_qi_condensation": true }
      }
    },
    {
      "id": "force",
      "text": "\"Force it. Ride the momentum of everything that's happened.\"",
      "tooltip": "+15% success chance. But failure is worse.",
      "outcome": {
        "flavorText": "You seize the qi and PUSH.\n\nThe walls shatter — not gently, but gloriously. Golden light erupts from your dantian, visible for a hundred paces. Old Guo looks up from his post, eyes wide.\n\nQI CONDENSATION, LAYER 1.\n\n+7 Attack, +3 Defense, +20 Max HP, +25 Qi capacity.\nBut the backlash lingers: -5 HP from the strain.",
        "statChanges": { "attack": 7, "defense": 3 },
        "healthChange": -5,
        "flagsSet": { "reached_qi_condensation": true, "forceful_breakthrough": true }
      }
    },
    {
      "id": "guided",
      "text": "\"Ask Mother Shen to guide me.\"",
      "requires": { "karma": { "min": 3 } },
      "tooltip": "The healer's wisdom stabilizes the process.",
      "outcome": {
        "flavorText": "Mother Shen places a weathered hand on your back. \"Breathe, child. The qi is like water — don't fight it. Guide it.\"\n\nHer voice steadies you. The qi flows where she directs. The breakthrough is gentle, almost peaceful.\n\nQI CONDENSATION, LAYER 1.\n\n+5 Attack, +5 Defense, +20 Max HP, +20 Qi capacity.\n+3 Comprehension (Mother Shen's teaching).",
        "statChanges": { "attack": 5, "defense": 5, "comprehension": 3 },
        "flagsSet": { "reached_qi_condensation": true, "mother_shen_guided": true }
      }
    }
  ]
}
```

---

## Technical Architecture (MVP)

```
idle_cultivation_sect/
├── index.html                  # Entry point, imports src/main.ts
├── package.json                # Vite + TypeScript dev deps only
├── tsconfig.json               # Strict mode, ES2020 target
├── vite.config.ts              # Path aliases, build config
│
└── src/
    ├── main.ts                 # Bootstrap: create state, start engine, mount UI
    ├── types.ts                # All MVP interfaces (GameState, Event, Choice, Monster)
    │
    ├── engine/
    │   ├── GameEngine.ts        # Orchestrates tick, processes events
    │   ├── EventEngine.ts       # Loads events, checks triggers, resolves choices
    │   ├── CombatEngine.ts      # Auto-resolve combat, damage formula
    │   └── BreakthroughEngine.ts # Breakthrough chance, resolution
    │
    ├── state/
    │   ├── GameState.ts         # Factory: createInitialState(), state mutators
    │   └── SaveManager.ts       # localStorage load/save with offline catch-up
    │
    ├── data/
    │   └── events.ts            # 25 hand-authored events as typed objects
    │
    └── ui/
        ├── Renderer.ts          # DOM updates: event card, tabs, status bar
        ├── EventCard.ts         # Render event description + choices
        ├── SelfTab.ts           # Stats, inventory, equipment display
        ├── WorldTab.ts          # Location map, travel controls
        ├── LogTab.ts            # Event history
        └── styles.css           # Dark theme, mobile-first
```

**Dev deps only**: `typescript`, `vite`. Zero runtime dependencies. Four commands:

```bash
npm install           # Install TypeScript + Vite
npm run dev           # Dev server with hot reload on localhost:3000
npm run build         # Bundle to dist/ (single HTML + JS + CSS)
npm run typecheck     # tsc --noEmit for type validation
```

### Why TypeScript from the Start

| Concern | Answer |
|---------|--------|
| Type safety for events | 25 hand-authored events. A typo in `qiChange` vs `qiCahnge` breaks the game. TypeScript catches this at compile time. |
| Refactoring to full design | Post-MVP adds 6 paths, elements, sects, etc. Having interfaces from day 1 means splitting into modules is mechanical, not risky. |
| Developer experience | Autocomplete on `state.player.` — know what fields exist without referencing docs. |
| Build overhead? | `vite dev` starts in <1 second. Hot reload is instant. No perceptible overhead on modern hardware. |
| Termux compatibility? | Node.js runs on Termux. Vite works. Development is `npm run dev` then open browser. |

---

## MVP UI Mockup

```
┌──────────────────────────────────────────────────────────┐
│  ⛩️ Li Wei — Mortal                    [+2 events]        │
├──────────────────────────────────────────────────────────┤
│  [ Event ]  [ Self ]  [ World ]  [ Log ]                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  📍 Azure Cloud Village                              ║ │
│  ║                                                      ║ │
│  ║  Old Guo hobbles toward you. His face is tight       ║ │
│  ║  with worry.                                         ║ │
│  ║                                                      ║ │
│  ║  "A cultivator collapsed at the east gate. He's      ║ │
│  ║   burning with fever. The headman wants him gone.    ║ │
│  ║   The healer says he'll die without a herb from      ║ │
│  ║   the Whispering Forest."                             ║ │
│  ║                                                      ║ │
│  ║  "What should we do?"                                ║ │
│  ║                                                      ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  🌿 Go to the forest. Find the herb.              │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │  🔍 Examine him first.                            │    │
│  │     🔒 Requires: Comprehension 10                  │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │  🏛️ Let the headman handle it. Not our problem.   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Qi: 15/20  │  HP: 45/45  │  💎 8  │  Karma: 0          │
└──────────────────────────────────────────────────────────┘
```

---

## MVP Development Phases

### Phase M1: Skeleton (2–3 days)
- `npm init`, install `typescript` + `vite`, configure `tsconfig.json`
- `index.html` entry point, `src/main.ts` bootstrap
- `src/types.ts` — all MVP interfaces (GameState, MVPEvent, MVPChoice, MVPMonster, etc.)
- `src/state/GameState.ts` — `createInitialState()` factory function
- `src/engine/EventEngine.ts` — load events, filter by trigger, present choices
- `src/ui/Renderer.ts` + `src/ui/EventCard.ts` — DOM rendering
- `src/ui/styles.css` — dark theme, tab layout, mobile-first
- One hardcoded event that always fires
- **Milestone**: `npm run dev` → browser opens → event appears → click choice → outcome text displays. TypeScript compiles with zero errors.

### Phase M2: Game Loop (2–3 days)
- Event resolution applies effects (Qi, items, stats, flags)
- Next event triggers based on flags/location/triggers
- 5 events hand-authored (the Wei Liang chain)
- Combat resolver for beast encounters
- Breakthrough event fires on Qi threshold
- **Milestone**: Can play through the Wei Liang chain: dying cultivator → herb hunt → return → breakthrough.

### Phase M3: World & Travel (1–2 days)
- 5 locations on world tab with descriptions
- Travel mechanic: select destination, travel time counts down
- Travel events (encounters during travel)
- Location unlocks based on realm/events
- **Milestone**: Can travel between all 5 locations. Encounters fire en route.

### Phase M4: Content & Persistence (2–3 days)
- All 25 events authored
- Save/load with localStorage
- Offline catch-up: calculate elapsed time, generate event queue
- Return summary screen
- **Milestone**: Close tab, reopen 2 hours later, see "while you were away" with events queued.

### Phase M5: Polish (1–2 days)
- Flavor text pass on all events
- CSS dark theme, mobile layout
- Locked choice display (grayed with requirement text)
- Stat display on Self tab
- Inventory display (weapon, items)
- **Milestone**: Feels like a real game. Ship it.

---

## What MVP Proves

| Question | How MVP Answers It |
|----------|-------------------|
| Is the story-generator loop compelling? | Playtesters resolve events, want to see what happens next |
| Do delayed consequences feel magical? | Spared wolf → later event fires. Player says "wait, was that because...?" |
| Is idle meaningful? | Return after 2h, see event queue, feel like the world continued |
| Is combat satisfying in auto-resolve? | Flavor text makes fights dramatic even without gameplay |
| Do stats-as-gate feel good? | "I need 10 Comprehension for that option — better find a way to raise it" |
| Is the MVP fun for 1 hour? | Playtesters reach Qi Condensation L3, have met NPCs, want to continue |

---

## Post-MVP — What Comes Next

After MVP ships and the core loop is validated:

1. **Split into modules** (TypeScript, Vite, proper architecture)
2. **Add cultivation paths** (6 paths, path choice event at Foundation)
3. **Add elements** (Wu Xing, affinity, elemental qi)
4. **Add sects** (join, reputation, missions)
5. **Add martial arts** (styles, stances, combos)
6. **Add spells** (talismans, formations)
7. **Add dialogue system** (charisma tiers, branching trees)
8. **Add procedural generation** (replace hand-authored with generated)
9. **Add LLM dialogue** (charisma 100 unlock)
10. **Add more locations, events, content**

Each post-MVP phase adds a system from the full design docs, validated against the MVP's proven core loop.

---

*See also: [Immediate Gameplay](./immediate-gameplay.md), [Full Player Experience](./player-experience.md), [Master Design Doc](./README.md)*
