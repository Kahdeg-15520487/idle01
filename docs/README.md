# Idle Cultivation Sect — Master Design Document

> **A zero-to-hero idle game with wuxia cultivation theme**
>
> Simple web app. Open world feel. Procedural everything. Flavor text everywhere.

---

## Table of Contents

1. [Vision & Scope](#vision--scope)
2. [Game Design Overview](#game-design-overview)
3. [Architecture (High-Level)](#architecture-high-level)
4. [Subsystem Documents](#subsystem-documents)
5. [Technical Stack](#technical-stack)
6. [Development Roadmap](#development-roadmap)
7. [Design Principles](#design-principles)

---

## Vision & Scope

### Elevator Pitch
A mortal enters the cultivation world. Through idle progression, open-world travel, random encounters, and procedurally generated martial arts and treasures, they ascend from Qi Condensation to Immortality — all in a browser tab.

### Core Experience
- **Idle-forward**: The world ticks relentlessly. Progress happens while you plan your next move.
- **Open-world feel**: A graph of locations with travel times, unique encounters, and escalating danger. Sect territories shape where it's safe to travel.
- **Living world**: Four great sects with politics, alliances, and blood feuds. Your reputation with each faction changes encounters, services, and safety.
- **Varied origins**: Six starting origins (village orphan, disgraced disciple, merchant heir, wanderer, immortal bloodline, beast bonded) — each with unique perks, penalties, and narrative hooks.
- **Procedural depth**: Every weapon, technique, and beast is generated — no two runs are identical.
- **Narrative immersion**: Every action produces contextual flavor text in the wuxia/xianxia tradition. The world has 10,000 years of history that NPCs reference.

### Out of Scope (v1)
- Multiplayer / leaderboards
- Microtransactions
- Manual combat (auto-resolve only)
- 3D or canvas graphics (text + CSS only)
- Mobile app packaging (web-only, responsive)

---

## Game Design Overview

### The Core Loop

```
     ┌──────────────────────────────────────────┐
     │                                          │
     ▼                                          │
┌─────────┐   travel    ┌────────────┐   win    ┌──────────┐
│  TRAVEL  │───────────▶│  ENCOUNTER  │─────────▶│  REWARD  │
│ (world   │            │ (combat,    │          │ (loot,   │
│  map)    │◀───────────│  treasure,  │          │  stones, │
└─────────┘   flee/     │  NPC)       │          │  qi)     │
     │        lose      └────────────┘          └──────────┘
     │                                                     │
     │                                                     ▼
     │                                              ┌──────────────┐
     └──────────────────────────────────────────────│  CULTIVATE   │
           stronger → travel further                │ (accumulate  │
                                                    │  qi, break   │
                                                    │  through)    │
                                                    └──────────────┘
```

### Player Progression Axes

| Axis | Mechanism | Gates |
|------|-----------|-------|
| **Cultivation** | Accumulate Qi → Breakthrough | Realm bottlenecks, tribulation |
| **Equipment** | Loot from encounters → Equip | Rarity tiers, stat requirements |
| **Techniques** | Discover/learn scrolls → Equip | Comprehension stat, mastery level, sect exclusives |
| **World** | Travel to new locations | Danger level, travel resources, territory control |
| **Resources** | Spirit stones, pills, materials | Economy, crafting, purchases |
| **Faction** | Join a sect, earn reputation | Standing, contributions, missions, alignment |
| **Identity** | Origin story + sect choice + karma | Unlocks unique encounters, NPC reactions, endings |

### Cultivation Realms

| # | Realm | Sub-stages | Flavor |
|---|-------|------------|--------|
| 0 | Mortal | — | Starting point, no cultivation |
| 1 | Qi Condensation | 1–9 | Sense and gather ambient qi |
| 2 | Foundation Establishment | 1–9 | Forge your spiritual foundation |
| 3 | Core Formation | 1–9 | Condense a Golden Core |
| 4 | Nascent Soul | 1–9 | Birth the soul infant |
| 5 | Spirit Severing | 1–9 | Cut mortal attachments |
| 6 | Dao Seeking | 1–9 | Comprehend the Great Dao |
| 7 | Immortal Ascension | — | Transcend mortality (win state) |

Each realm gates: accessible locations, equippable gear tiers, encounter difficulty, and breakthrough requirements.

---

## Architecture (High-Level)

### Architectural Pattern: **Entity-Component-System (ECS) variant + Pure Functional Core**

The game is structured as a **pure functional core** (all game logic is stateless, deterministic functions) surrounded by an **imperative shell** (clock, UI, persistence).

```
┌─────────────────────────────────────────────────────┐
│                  IMPERATIVE SHELL                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ GameClock│  │  Renderer│  │  SaveManager     │  │
│  │(setIntv) │  │  (DOM)   │  │  (localStorage)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │             │                │              │
│       ▼             ▼                ▼              │
│  ┌──────────────────────────────────────────────┐   │
│  │              EVENT BUS (pub/sub)             │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
└─────────────────────────┼───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  PURE FUNCTIONAL CORE                │
│                                                      │
│  GameState ──▶ CultivationSystem.tick(state) ──▶ NewState │
│            ──▶ CombatSystem.resolve(state, seed)──▶ NewState │
│            ──▶ WorldSystem.travel(state) ────────▶ NewState  │
│            ──▶ EncounterSystem.roll(state, rng)──▶ NewState │
│                                                      │
│  Every system: (GameState, params) => GameState      │
│  Zero side effects. Fully testable.                  │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Immutable state**: `GameState` is a readonly object. Every system returns a *new* `GameState`. Enables time-travel debugging, save/load as snapshot, and trivial testing.

2. **Dependency injection via parameters**: Systems receive their dependencies (RNG seed, config, clock delta) as explicit parameters — never import global state. Makes every function testable in isolation.

3. **Seeded RNG**: All randomness flows through a single `PRNG` instance that is part of the game state. Given the same initial seed + same actions, the game is fully deterministic. Tests can replay exact scenarios.

4. **Event log, not callbacks**: Systems append `GameEvent` objects to a `log` array in state rather than calling UI directly. The UI reads the log and renders. Decouples logic from presentation.

5. **Stateless systems**: `CultivationSystem`, `CombatSystem`, etc. are collections of pure functions — no `this`, no internal state. They are modules, not classes where possible.

---

## Subsystem Documents

Each subsystem has a detailed specification document:

| Document | Description |
|----------|-------------|
| [MVP Specification](./mvp.md) | **What ships first** — scoped-down story generator, 25 hand-authored events, single HTML file, 2 weeks to build |
| [Project Structure](./project-structure.md) | File/folder layout, module organization, build config (post-MVP) |
| [Architecture](./architecture.md) | Deep dive: event flow, state management, ECS pattern |
| [Data Models](./data-models.md) | All TypeScript interfaces and types |
| [World Building](./world-building.md) | **Lore, history, Nine Provinces, sects, origins, politics** |
| [World Factions](./world-factions.md) | **Six first-rate sects (one per path), second/third-rate sects, guilds, pacts, legendary loners** |
| [Cultivation System](./systems/cultivation.md) | Qi accumulation, breakthrough, tribulation, bottlenecks |
| [Cultivation Paths](./systems/cultivation-paths.md) | **The Six Paths**: Body, Qi, Spirit, Tech, Faith, Beast — choose at Foundation Establishment |
| [Path Gameplay](./systems/path-gameplay.md) | **Each path is a different game genre**: Rhythm (Qi), Clicker (Body), Colony (Spirit), Factory (Tech), Civilization (Faith), Monster tamer (Beast) |
| [Element System](./systems/elements.md) | Five Phases, elemental affinity, qi types, interactions, tribulations |
| [Martial Arts System](./systems/martial-arts.md) | Styles, stances, internal/external arts, mastery, combos, weapon arts |
| [Spell System](./systems/spells.md) | Talismans, formations, divine abilities, forbidden arts, summoning |
| [Combat System](./systems/combat.md) | Auto-resolve, damage formulas, elemental advantages |
| [World & Travel](./systems/world.md) | Location graph, travel mechanics, danger scaling, territory safety |
| [Sect & Faction System](./systems/sect-faction.md) | Joining sects, reputation, missions, political events, territory control |
| [Encounter System](./systems/encounters.md) | Random encounter tables, weighted rolls, special events |
| [Dialogue System](./systems/dialogue.md) | Structured dialogue trees, charisma-gated options, LLM free dialogue at max charisma |
| [Procedural Generation](./systems/procedural-generation.md) | PRNG, name generation, weapon/technique/beast generation |
| [Flavor Engine](./systems/flavor-engine.md) | Template system, contextual text generation |
| [Inventory & Equipment](./systems/inventory.md) | Item management, equipment slots, rarity, crafting, merchants |
| [Save System](./systems/save-system.md) | Persistence, offline catch-up, migration |
| [Testing Strategy](./testing-strategy.md) | Unit, integration, snapshot, property-based testing |
| [Player Experience](./player-experience.md) | Complete walkthrough — character creation to ascension, showing all systems in action |

---

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript 5.x (strict mode) | Type safety, excellent tooling |
| **Build** | Vite (vanilla-ts template) | Fast HMR, zero-config TS, bundling |
| **Test Runner** | Vitest | Native ESM, TS-first, fast |
| **Lint/Format** | ESLint + Prettier | Consistency |
| **Runtime** | Browser (no Node.js runtime deps) | Target: modern browsers (ES2020+) |
| **State** | Plain TS objects + Immer (optional) | Immutable updates with readable syntax |
| **Persistence** | `localStorage` | Offline, no server needed |
| **Styling** | CSS Modules or plain CSS | Scoped styles, no runtime cost |
| **UI** | Vanilla DOM (no framework) | Minimize dependencies; or Lit for Web Components |

---

## Development Roadmap

### Phase 1: Foundation (the skeleton runs)
- [ ] Project scaffolding (Vite + TS + Vitest)
- [ ] Core types (`GameState`, `Player`, all interfaces)
- [ ] `GameClock` — the 1-second tick loop
- [ ] `StateManager` — immutable state creation and update
- [ ] `EventBus` — typed pub/sub
- [ ] `SaveManager` — load/save to localStorage
- [ ] Basic UI shell (tabbed layout, displays stats)
- [ ] **Milestone**: App boots, state ticks, shows changing numbers

### Phase 2: Core Gameplay Loop
- [ ] `CultivationSystem` — Qi accumulation, realm/sub-stage advancement
- [ ] `CultivationPaths` — Six cultivation paths with unique mechanics (Body/Qi/Spirit/Tech/Faith/Beast)
- [ ] Path selection event at Foundation Establishment
- [ ] `WorldSystem` — location graph, travel initiation
- [ ] `TravelSystem` — travel timer, encounter triggers
- [ ] `EncounterSystem` — roll encounter type
- [ ] `CombatSystem` — basic auto-resolve (attack vs defense)
- [ ] Simple beast definitions (static, hand-crafted)
- [ ] **Milestone**: Can cultivate, travel between 3 locations, fight basic beasts

### Phase 3: Elements, Martial Arts & Spells
- [ ] `ElementSystem` — Wu Xing matrix, player affinity, elemental qi
- [ ] `MartialArtsSystem` — styles (6 orthodox + 4 unorthodox), stances (8), internal arts, external arts, combos
- [ ] `SpellSystem` — talisman crafting, formation deployment, divine abilities, forbidden arts
- [ ] `TechniqueGenerator` — martial arts with random effects, elemental alignment
- [ ] `BeastGenerator` — beasts scaled to location danger, elemental typing, drop tables for beast path
- [ ] Race system — player race selection with stat modifiers and elemental affinities
- [ ] `InventorySystem` — equip/unequip, inventory management, talisman slots
- [ ] **Milestone**: Combat is deep; every player has a unique martial identity

### Phase 4: World Building & Factions
- [ ] Character origin selection (6 origins with unique starts)
- [ ] `CharismaSystem` — charisma stat, XP, tier unlocks
- [ ] `DialogueSystem` — structured dialogue trees for all encounter types
- [ ] Dialogue option gating: stats, items, reputation, techniques, realm
- [ ] Sect definitions & relationship matrix
- [ ] `SectSystem` — join/leave sects, reputation, ranks, missions
- [ ] Territory control mechanics (safe/hostile zones)
- [ ] Political event scheduler (tournaments, beast tides, raids)
- [ ] `FlavorEngine` — template interpolation system
- [ ] Flavor templates for all actions (cultivation, combat, travel, encounters, NPC dialogue)
- [ ] NPC merchants — buy/sell with generated inventory
- [ ] Pills & alchemy — combine beast cores + herbs into pills
- [ ] Karma system — choices accumulate, alignment gates sect eligibility
- [ ] Location descriptions with historical lore references
- [ ] **Milestone**: World feels alive; player identity matters

### Phase 5: LLM Dialogue (stretch goal)
- [ ] `LLMDialogueService` — API integration for max-charisma players
- [ ] System prompt engineering for wuxia NPCs
- [ ] Response parsing with whitelist-validated mechanical effects
- [ ] Response caching (SHA-256 hash of input + context)
- [ ] Rate limiting & cooldown enforcement
- [ ] Graceful fallback when LLM unavailable
- [ ] **Milestone**: Free-form dialogue for dedicated players

### Phase 6: Polish & Balance
- [ ] `OfflineCatchup` — simulate elapsed time on load
- [ ] Achievement system
- [ ] CSS polish: wuxia theme (ink-wash aesthetic, color palette)
- [ ] Responsive layout testing (mobile-first)
- [ ] Balance pass: progression speed, drop rates, combat difficulty
- [ ] **Milestone**: Shippable v1.0

### Phase 7: Post-Launch
- [ ] Prestige / Reincarnation system
- [ ] Faction/sect joining mechanics
- [ ] More locations, realms, content
- [ ] Sound effects (Web Audio API)
- [ ] Export/import save files

---

## Design Principles

1. **Modularity above all**: Every system is a self-contained module that can be tested, replaced, or removed independently.

2. **Pure functions for logic**: Game rules live in pure functions. Side effects (DOM, storage, timers) are pushed to the edges.

3. **TypeScript strict mode**: No `any` (except well-documented escape hatches). Exhaustive switch checks. Discriminated unions for all variant types.

4. **Explicit over implicit**: Nothing happens "magically." Dependencies are passed as parameters. State transformations are explicit function calls.

5. **Test-first for systems**: Every system's behavior is specified in tests before implementation. RNG-seeded tests ensure determinism.

6. **Flavor text is data, not code**: All narrative text lives in template data files, editable by non-programmers. The engine just interpolates variables.

7. **The player is never blocked**: If stuck (can't beat a beast, can't afford travel), there's always a fallback action (cultivate in place, grind lower area).

8. **Idle means idle**: The game progresses without interaction. Active play gives agency (where to go, what to equip, when to breakthrough) but isn't required for advancement.

---

## Inspirations

- **Idle Games**: *Cookie Clicker*, *NGU Idle*, *Idle Champions*
- **Xianxia/Cultivation**: *I Shall Seal the Heavens*, *A Will Eternal*, *Tale of Immortal* (game)
- **Procedural Generation**: *Diablo* (loot), *No Man's Sky* (names), *Dwarf Fortress* (text generation)
- **Architecture**: *Redux* (single state tree), *Entity-Component-System* (data-driven design)

---

*Last updated: 2026-05-11*
