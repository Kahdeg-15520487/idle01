# MVP Specification — Idle Cultivation Sect

> **Principle**: Ship the story generator loop with two paths (Qi and Body). Hand-author everything. Prove the core experience — events → choices → consequences → shén → breakthrough → path choice — in ~3 weeks.

---

## MVP Scope — What Ships

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   The MVP is a TEXT-DRIVEN STORY GENERATOR              │
│   where cultivation is the consequence of choices,       │
│   and Foundation Establishment is the final milestone    │
│   where the player chooses their path.                  │
│                                                         │
│   • Events appear — situations that demand resolution    │
│   • Player reads, chooses — options gated by stats/items│
│   • Outcomes produce items (shén vessels) — absorb or   │
│     hoard, trade or refine                              │
│   • Cultivation advances — meditation fills your dantian│
│     items supplement it                                 │
│   • Path choice at Foundation (Tier 3) — Qi or Body     │
│   • Events queue up while the player is away            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## The MVP Core Loop

```
      ┌──────────────────────────────┐
      │   EVENT APPEARS               │
      │   (situation + flavor text)    │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │   PLAYER SEES 2–4 CHOICES     │
      │   • Always available          │
      │   • 🔒 Stat-gated (grayed)   │
      │   • 🔓 Race/flag/item-gated  │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │   OUTCOME PLAYS               │
      │   • Flavor text               │
      │   • Items gained/lost         │
      │   • Stats changed             │
      │   • Flags set                 │
      │   • New event chained         │
      │   • Shén vessels added to inv │
      └──────────┬───────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌────────────┐   ┌──────────────┐
  │  MEDITATE   │   │  ABSORB ITEMS │
  │ (internal  │   │  (from inv)   │
  │  flow —    │   │  choose what  │
  │  direct    │   │  to consume)  │
  │  dantian)  │   └──────┬───────┘
  └─────┬──────┘          │
        │                 │
        └─────┬───────────┘
              ▼
      ┌──────────────────────────────┐
      │   SHÉN BAR FILLS              │
      │   → Tier breakthrough event   │
      │   → Path choice at Tier 3     │
      └──────────────────────────────┘
```

**Meditation is the only internal flow source.** Everything else (beast cores, spirit herbs, found items) produces a shén vessel that must be **absorbed from inventory** — a deliberate choice. You can hoard, sell, or refine for better yield.

---

## What's In — The Full List

### Player
- Name input
- 2 races: **Human** (balanced, +5% cultivation speed), **Spirit Fox** (+2 speed, +2 luck, dark affinity)
- 2 origins: **Village Orphan** (starts in Azure Cloud Village, +3 comprehension, rusty iron sword), **Disgraced Disciple** (starts in Green Jade City, already Qi Condensation L1, +1 technique)
- 5 stats: **Attack, Defense, Speed, Comprehension, Luck**
- Karma (-100 to +100, simplified)
- Spirit stones (currency)
- Shén bar (current / capacity) — measured in shén (S), kilo shén (kS)
- Tier (0→3) + sub-stage (Early/Mid/Late/Peak)
- **Path**: unset until Tier 3 → choose Qi or Body
- Health (current / max)

### Shén Vessels & Economy
Items that contain shén. Player decides whether to absorb, hoard, sell, or refine.

| Item | Shén | Found In |
|------|------|----------|
| Spirit Stone | 0.01 S | Currency, loot everywhere |
| Qi Crystal (crude) | 0.5 S | Meditation (Tier 1+) |
| Beast Core (low) | 0.2 S | Weak beast kills |
| Spirit Herb | 0.1 S | Exploration |
| Storage Jade (container) | +5 S capacity | Found, trade |

**Spirit stones double as currency AND shén vessels.** Absorbing one for shén destroys it. Using it as currency keeps it.

### Meditation
Players can **meditate** (toggle on/off). While meditating, shén flows into the dantian at a fixed rate: Tier 0 → 0.01 S/tick, Tier 1+ → scales. Produces **no item** — internal flow bypasses extraction.

### Equipment
- 1 weapon slot
- Up to 2 technique slots
- Inventory: 20 item slots (stackable where appropriate)

### World
- 5 locations:
  - **Azure Cloud Village** (starter, safe, low shén density)
  - **Whispering Forest** (low danger, herbs, beasts)
  - **Green Jade City** (hub, merchant, services)
  - **Misty Peaks** (medium danger, high qi density, cultivation bonus)
  - **Black Wind Gorge** (high danger, rare loot, dark qi)
- Travel: select destination → time ticks down → events may fire en route → arrival

### Sects (Flavor Only — No Joining)
- Cloud Soaring Sect (mentioned in events, appears in flavor text)
- Shadow Heaven Sect (mentioned in events, appears as antagonists)
- NPCs reference them. The Wei Liang chain involves Cloud Soaring. No join mechanics.

### Event Choice Gating
- **Stats**: Comprehension 10+ → examine the cultivator
- **Items**: Have healing herb → heal NPC
- **Karma**: Karma > 0 → NPC trusts you
- **Race**: Spirit Fox → sense danger early, stealth options
- **Past flags**: Met Wei Liang → mention him to Elder

### Combat (Auto-Resolve, Simplified)
- Attack vs Defense → damage
- Speed determines turn order
- Health pools: player vs enemy
- Victory: loot (spirit stones, beast cores, items)
- Defeat: lose some stones, return to last safe location
- Flee: speed check, chance

### Breakthroughs & Path Choice
Breakthrough fires as an **event** when shén bar reaches tier threshold:

| Tier | Threshold | Event | Milestone |
|------|-----------|-------|-----------|
| 0→1 | 10 S | Awaken your dantian. First breakthrough. | Reach Qi Condensation L1 (Qi realm name) |
| 1→2 | 1 kS | Deepen your foundation. | Reach Qi Condensation L4 |
| 2→3 | 100 kS | Foundation Establishment — **CHOOSE PATH**. | Pick Qi or Body cultivation |

At Tier 3, the player chooses their path. The game stores this choice. Post-MVP content will branch from here.

### Idle / Offline
- When away, the player enters **secluded meditation** — no events fire, world pauses
- Meditation continues at normal rate
- On return: summary screen showing time elapsed and shén gained
- No event queue. No backlog of choices.
- The tradeoff: you gain shén but don't progress the story while away

### Save / Load
- Auto-save on every event resolution
- Manual save from menu
- One save slot (localStorage)
- On load: check elapsed time, generate offline summary

### UI
- Single screen, mobile-first
- Event card dominates the view
- Status bar: Shén, HP, stones, tier, meditation indicator
- Tab bar: **Event | Cultivate | Self | World | Log**
- Cultivate tab shows meditation toggle + shén bar
- Choice buttons at bottom of event card
- Locked choices shown grayed with requirement text

---

## The MVP Event Format

```typescript
interface MVPEvent {
  id: string;
  title: string;
  locationId: string;
  category: 'story' | 'encounter' | 'breakthrough' | 'discovery';
  description: string;
  choices: MVPChoice[];
  trigger: MVPEventTrigger;
  chainId?: string;
  chainStage?: number;
}

interface MVPChoice {
  id: string;
  text: string;
  tooltip?: string;
  requires?: {
    stat?: { name: string; min: number };
    item?: string;
    karma?: { min?: number; max?: number };
    race?: string;
    flag?: string;
  };
  outcome: {
    flavorText: string;
    // Items instead of direct Qi:
    itemsGained?: string[];         // Shén vessels, equipment, etc.
    itemsLost?: string[];           // Items consumed by this choice
    spiritStones?: number;
    statChanges?: Record<string, number>;
    karmaChange?: number;
    healthChange?: number;
    flagsSet?: Record<string, boolean>;
    nextEventId?: string;
    combat?: MVPMonster;
    travelTo?: string;
    // Only meditation and breakthrough grant shén directly:
    shénDirect?: number;            // Rare — only for breakthrough events
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
  | { type: 'tier'; min: number }
  | { type: 'flag'; flag: string }
  | { type: 'shénThreshold'; min: number }
  | { type: 'chain'; chainId: string; stage: number }
  | { type: 'travel' };
```

---

## Example MVP Events

### Event 1: The Dying Cultivator (Starter)

```json
{
  "id": "dying_cultivator",
  "title": "The Dying Cultivator",
  "locationId": "azure_cloud_village",
  "category": "story",
  "trigger": { "type": "location", "locationId": "azure_cloud_village" },
  "chainId": "shadow_beneath_peaks",
  "chainStage": 1,
  "description": "Old Guo, the village gatekeeper, hobbles toward you across the temple courtyard. His face is tight with worry.\n\n\"Li Wei! A wandering cultivator collapsed at the east gate. He's burning with fever, muttering about 'the shadow in the pass.' The headman wants him gone. The healer says he'll die without a Moondew Bloom from the Whispering Forest.\"\n\nOld Guo looks at you expectantly. \"What should we do?\"",
  "choices": [
    {
      "id": "find_herb",
      "text": "\"I'll go to the forest and find the herb.\"",
      "tooltip": "Travel to Whispering Forest. Danger possible.",
      "outcome": {
        "flavorText": "You nod. \"Keep him alive until I return.\"\n\nOld Guo grips your shoulder. \"Be careful, child. The forest has teeth.\"\n\nYou gather your things and head for the east gate.",
        "itemsGained": ["spirit_herb_moondew"],
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
        "flavorText": "You kneel beside the stranger. His robes are travel-worn but finely made. A faded emblem — a white crane against azure sky.\n\nYour knowledge serves you: Cloud Soaring Sect.\n\nHis eyes flicker open. \"You... you have the sight. The fox blood. Go to the pass. Before it's too late.\"\n\nHis eyes close again. He's alive, but barely.\n\n+1 Comprehension (permanent). New knowledge: Cloud Soaring Sect. The Moondew Bloom will still be needed.",
        "statChanges": { "comprehension": 1 },
        "itemsGained": ["spirit_herb_moondew"],
        "flagsSet": { "examined_cultivator": true, "knows_cloud_sect": true, "accepted_herb_quest": true },
        "travelTo": "whispering_forest",
        "nextEventId": "herb_hunt"
      }
    },
    {
      "id": "refuse",
      "text": "\"Let the headman handle it. Not our problem.\"",
      "outcome": {
        "flavorText": "Old Guo's face falls. \"I understand. You're just a sweeper. It's not your burden.\"\n\nHe turns and walks away. The cultivator will be expelled by nightfall. Whatever warning he carried will die with him.\n\nThe village goes back to sleep.",
        "karmaChange": -5,
        "flagsSet": { "refused_cultivator": true }
      }
    }
  ]
}
```

### Event 2: Breakthrough to Tier 1 (Trigger: Shén ≥ 10 S)

```json
{
  "id": "breakthrough_tier_1",
  "title": "The First Breakthrough",
  "locationId": "any",
  "category": "breakthrough",
  "trigger": { "type": "shénThreshold", "min": 10 },
  "description": "The shén you've gathered swirls in your dantian. Your experiences — the dying cultivator, the wolf in the forest, every choice you've made — have accumulated into pressure.\n\nThe walls of your dantian creak.\n\nA breakthrough is imminent.",
  "choices": [
    {
      "id": "steady",
      "text": "\"Meditate calmly. Let it settle naturally.\"",
      "tooltip": "Standard breakthrough. 75% chance.",
      "outcome": {
        "flavorText": "You breathe. The shén stills. Then — like ice cracking in spring — the walls of your dantian expand.\n\nTIER 1 REACHED. The world sharpens.\n\n+5 Attack, +5 Defense, +20 Max HP.\nYour shén capacity increases. Qi Condensation. You are now an Initiate.",
        "statChanges": { "attack": 5, "defense": 5 },
        "shénDirect": 1,
        "flagsSet": { "reached_tier_1": true }
      }
    },
    {
      "id": "force",
      "text": "\"Force it. I've earned this.\"",
      "tooltip": "+15% chance. But failure hurts more.",
      "outcome": {
        "flavorText": "You seize the shén and PUSH.\n\nThe walls shatter not gently but gloriously. A pulse of energy visible for a hundred paces.\n\nTIER 1 REACHED.\n\n+7 Attack, +3 Defense, +20 Max HP.\nBut the strain costs you: -5 HP.",
        "statChanges": { "attack": 7, "defense": 3 },
        "healthChange": -5,
        "shénDirect": 1,
        "flagsSet": { "reached_tier_1": true, "forceful_breakthrough": true }
      }
    },
    {
      "id": "guided",
      "text": "\"Ask the village healer to guide me.\"",
      "requires": { "karma": { "min": 3 } },
      "tooltip": "Karma 3+. Mother Shen's wisdom steadies the process.",
      "outcome": {
        "flavorText": "Mother Shen places a weathered hand on your back. \"Breathe, child. The shén is like water — don't fight it. Guide it.\"\n\nHer voice steadies you. The breakthrough is gentle, almost peaceful.\n\nTIER 1 REACHED.\n\n+5 Attack, +5 Defense, +20 Max HP.\n+3 Comprehension from Mother Shen's teaching.",
        "statChanges": { "attack": 5, "defense": 5, "comprehension": 3 },
        "shénDirect": 1,
        "flagsSet": { "reached_tier_1": true, "mother_shen_guided": true }
      }
    }
  ]
}
```

### Event 3: Path Choice (Trigger: Tier 3 — Foundation Establishment)

```json
{
  "id": "choose_path",
  "title": "The Fork in the Dao",
  "locationId": "any",
  "category": "breakthrough",
  "trigger": { "type": "tier", "min": 3 },
  "description": "Your shén has reached 100 kS — the threshold of Foundation Establishment. Your dantian can expand further, but only if you choose a direction.\n\nThe Dao is not one road. It is a vast plain with many trails.\n\nTwo paths stretch before you.",
  "choices": [
    {
      "id": "qi_path",
      "text": "🧘 **Qi Path** — \"I will cultivate the energy of heaven, earth, and stars. The rhythm of the universe flows through my meridians.\"\n\nCycles of meditation, meridian flow, and elemental balance. A rhythm-based cultivation of internal energy.",
      "outcome": {
        "flavorText": "You sit at the edge of a cliff and face the setting sun. The shén within you takes on the quality of the wind — flowing, searching, connecting.\n\nYour meridians open. The meridian rhythm game awakens within you.\n\nQI PATH CHOSEN.\n\n+10 max shén capacity. Unlocks: Meridian Meditation, Sun/Moon Essence cycling, elemental affinity growth.",
        "statChanges": { "comprehension": 3 },
        "shénDirect": 5,
        "flagsSet": { "path_chosen": true, "path_qi": true }
      }
    },
    {
      "id": "body_path",
      "text": "💪 **Body Path** — \"I will temper my flesh until it transcends mortal limits. My body is my weapon, my temple, my truth.\"\n\nTraining, strain, and endurance — a clicker-based cultivation of the physical form.",
      "outcome": {
        "flavorText": "You walk into the wilderness, strip to the waist, and find the heaviest rock you can lift. You lift it until your arms fail. Then you lift it again.\n\nYour muscles tear and rebuild. The training clicker system awakens within you.\n\nBODY PATH CHOSEN.\n\n+10 max HP. Unlocks: Training Exercises, Strain Gauge, Scar System.",
        "statChanges": { "attack": 5, "defense": 3 },
        "healthChange": 10,
        "shénDirect": 5,
        "flagsSet": { "path_chosen": true, "path_body": true }
      }
    }
  ]
}
```

---

## What's OUT — Deferred to Post-MVP

| Deferred | Why Out |
|----------|---------|
| Six cultivation paths | Only Qi and Body in MVP. Spirit, Tech, Faith, Beast post-MVP. |
| Full rhythm game (Qi path) | Placeholder: auto-circulate for MVP. The rhythmic mini-game posts. |
| Full clicker training (Body path) | Placeholder: auto-train for MVP. The full strain gauge posts. |
| Element system | Flavor-only in MVP. Full wu xing matrix post-MVP. |
| Martial arts styles/stances/combos | Techniques are simple stat items for MVP. |
| Spell system | None in MVP. |
| Sect joining/ranks/missions | Sects exist as flavor only. Full sect system post-MVP. |
| Full dialogue trees with charisma tiers | 2–4 choices per event, simple stat gates. |
| Procedural generation | All events hand-authored (25 total). |
| LLM free dialogue | Post-MVP stretch goal. |
| Hidden world state | Simplified flags only. No ecology, no rumor mill. |
| Political events | Post-MVP. |
| Territory control | Post-MVP. |
| 6 origins, 6 races | 2 each for MVP. |
| 20+ locations | 5 for MVP. |
| Crafting (refinement, alchemy) | Shén vessels are consumable as-is. No crafting. |
| Beast breeding / colony management / factory builder | These are path-specific post-MVP gameplay systems. |
| Achievements | Post-MVP. |
| Multiple save slots | One slot for MVP. |

---

## MVP Development Phases

### Phase M1: Skeleton (2–3 days)
- `npm init`, install `typescript` + `vite`, configure `tsconfig.json`
- `src/types.ts` — all MVP interfaces
- `src/state/GameState.ts` — factory, shén bar, tier, sub-stage
- `src/engine/EventEngine.ts` — load events, filter triggers, present choices
- `src/ui/Renderer.ts` + `src/ui/EventCard.ts`
- `src/ui/styles.css` — dark theme, tab layout, mobile-first
- One hardcoded event
- **Milestone**: Event appears → click choice → outcome text displays. Zero type errors.

### Phase M2: Meditation & Shén Economy (2–3 days)
- Meditation toggle: shén flows into bar while active
- Shén vessels from events: add to inventory
- Absorb button: consume vessel → add shén to bar
- Shén bar display (current / capacity, tier progress percentage)
- First breakthrough event triggers at 10 S
- **Milestone**: Meditate → fill bar → breakthrough event → Tier 1.

### Phase M3: World & Travel (2–3 days)
- World tab with 5 locations
- Travel: select destination → timer → arrival
- Travel events fire en route
- Location-based event triggering
- **Milestone**: Travel between locations, events fire en route.

### Phase M4: Content (3–4 days)
- All 25 events authored
- The Wei Liang story chain (5 events)
- Beast encounters (5 events)
- Treasure/discovery (3 events)
- NPC interactions (3 events)
- Breakthrough events (Tier 1, Tier 2, Tier 3)
- Travel events (5 events)
- Path choice event at Tier 3
- **Milestone**: Full playthrough: start → events → Tier 3 → choose Qi or Body → end of MVP content.

### Phase M5: Persistence & Polish (2–3 days)
- Save/load (localStorage)
- Offline catch-up with return summary
- Locked choice display (grayed, requirement shown)
- Status bar, tab navigation refinement
- Flavor text pass on all events
- **Milestone**: Close tab, reopen, see "while you were away," continue playing.

---

## Technical Architecture

```
idle_cultivation_sect/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
│
└── src/
    ├── main.ts                    # Bootstrap
    ├── types.ts                   # All interfaces
    │
    ├── engine/
    │   ├── GameEngine.ts          # Tick, meditation, shén accumulation
    │   ├── EventEngine.ts         # Load, filter, present, resolve
    │   ├── CombatEngine.ts        # Auto-resolve
    │   └── BreakthroughEngine.ts  # Tier threshold checks
    │
    ├── state/
    │   ├── GameState.ts           # Factory + mutators
    │   └── SaveManager.ts         # localStorage + offline
    │
    ├── data/
    │   ├── events.ts              # 25 hand-authored events
    │   ├── locations.ts           # 5 location definitions
    │   └── items.ts               # Shén vessel definitions
    │
    └── ui/
        ├── Renderer.ts            # Orchestrates all DOM updates
        ├── EventCard.ts           # Event display + choices
        ├── MeditateTab.ts         # Meditation toggle + shén bar
        ├── SelfTab.ts             # Stats, inventory, equipment
        ├── WorldTab.ts            # Location map + travel
        └── styles.css
```

---

## What MVP Proves

| Question | How MVP Answers It |
|----------|-------------------|
| Is the story-generator loop compelling? | Playtesters resolve events, want to see what happens next |
| Does the shén economy feel tactile? | Finding a beast core and choosing to absorb or keep it feels real |
| Is meditation enough as the core idle action? | Toggle it on, do other things, come back to a fuller bar |
| Do locked choices motivate stat growth? | "Need Comprehension 10 — time to meditate and make smart choices" |
| Does the path choice feel meaningful? | Two very different paths presented at Tier 3 — player anticipates the gameplay shift |
| Does offline catch-up feel rewarding? | Return to a clean summary of shén gained. No backlog anxiety. |
| Is the MVP fun for 2+ hours? | Playtesters reach Tier 3, choose a path, want to see what comes next |

---

## MVP File Count Estimate

| Category | Files | Lines |
|----------|-------|-------|
| Config | 4 | ~50 |
| Types | 1 | ~150 |
| Engine | 4 | ~400 |
| State | 2 | ~200 |
| Data | 3 | ~600 |
| UI | 6 | ~500 |
| **Total** | **20** | **~1,900** |

---

*See also: [Immediate Gameplay](./immediate-gameplay.md), [Energy Tiers](./systems/energy-tiers.md), [Path Gameplay](./systems/path-gameplay.md)*
