# Path Gameplay — Each Path Is A Different Game

> **Principle**: The event engine (story generator) is the universal shell. But what the player *does* between events — the gameplay loop they return to — is completely different for each path.
>
> Choosing a path at Foundation Establishment is choosing a **genre**.

---

## The Universal Shell — What All Paths Share

Every path shares these elements:

| Element | What It Means |
|---------|--------------|
| **Story Generator** | Events appear. Player reads and resolves them. Consequences ripple. |
| **World Map** | Locations exist. Travel triggers events. NPCs react to your choices. |
| **Energy Tiers** | All paths use shén to measure power, with the same exponential curve. |
| **Dao Comprehension** | All paths need to understand the nine Daos to break through high tiers. |
| **Combat** | All paths can fight — but HOW they fight differs wildly. |
| **Dialogue & Charisma** | All paths interact with NPCs. Charisma gates options regardless of path. |

And then, branching from the universal shell, each path has its own **primary gameplay loop** — the thing the player spends most of their time doing when they're not resolving events.

---

## Qi Path (气修) — Meridian Rhythm Game

> **Genre**: Rhythm / Timing

The Qi cultivator's core loop is cycling qi through their meridians — a network of energy channels in the body. This is not passive. The player must **actively guide qi flow** through a rhythmic interface.

### How It Works

The player sees a simplified meridian map — a branching path of nodes connected by channels. Qi pulses through the channels. The player taps nodes **in rhythm** with the pulse to clear blockages, redirect flow, and absorb ambient qi.

```
┌──────────────────────────────────────────────────────────┐
│  🧘 MERIDIAN CYCLING — Morning Pulse (Tier 2)             │
│                                                          │
│  ┌─── Heart Meridian ──────────────────────────────┐     │
│  │                                                   │     │
│  │        ● (7) ←━━━ ● (6) ←━━━ ● (5)               │     │
│  │        ╲             ╲           ╲                 │     │
│  │         ● (Dantian)  ● (4) →━━━ ● (3) →━━━ ● (2) │     │
│  │        ╱                                        ╱      │
│  │       ● (8)                              ● (1)        │
│  │       ╲                               ╱               │
│  │        ● (9) —━━━ ● (10) ←━━━ ● (11)                │     │
│  │                                                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                          │
│  ⏱ Pulse: ████████░░░░██░░████░░██░░████░░              │
│  Rhythm:   ♩ ♩ ♩ ♫ ♩ ♩ ♩ ♫ ♩ ♩ ♩ ♫                     │
│                                                          │
│  Your qi circulates through the Heart Meridian. Tap on   │
│  each node as the pulse reaches it to maintain flow.     │
│                                                          │
│  Current streak: 8 perfect | Missed: 0 | Shén: +3 S/tick│
│                                                          │
│  [ Auto-circulate (-50% efficiency) ]                     │
└──────────────────────────────────────────────────────────┘
```

### Mechanics

| Mechanic | How It Works |
|----------|-------------|
| **Meridian Maps** | Each tier unlocks a new meridian map (more nodes, faster tempo, branching routes). Tier 1 has a single loop of 6 nodes. Tier 7 has a complex web of 36+ nodes. |
| **Rhythm** | Nodes pulse in sequence. Tap exactly on the pulse for "perfect" (+1× shén). Tap close for "good" (+0.5×). Miss = no shén, minor qi deviation risk. Tap at the wrong time = blockage (-shén from bar). |
| **Combo Streak** | Perfect taps chain into a combo. 10 perfects in a row = ×2 shén for the rest of the cycle. 50 perfects = ×5. One miss resets to ×1. |
| **Auto-Circulate** | The player can toggle auto-circulate: qi cycles automatically at 50% efficiency. No gameplay. Useful when the player wants to focus on something else, but they advance slower. |
| **Breakthrough Events** | Qi cultivators get unique breakthrough events where they must maintain a rhythm while narratively challenged (e.g., fighting an inner demon through perfect timing). |
| **Combat** | Qi cultivators in combat can execute techniques by tapping as part of their attack rhythm. A perfectly-timed strike deals ×1.5 damage. A mistimed technique fizzles. |

### Progression Feeling

- **Tier 0–1**: Single meridian, slow tempo, 6 nodes. Learn the rhythm game basics.
- **Tier 2–3**: Two concurrent meridians. Manage left-hand/right-hand rhythm. This is where skill matters.
- **Tier 4–5**: Branching meridian webs. Choose which path to optimize for each session (speed vs power vs efficiency).
- **Tier 6**: Meridian fusion. Multiple rhythms layer into polyrhythms.
- **Tier 7**: Internalized rhythm no longer needs visualization — the cultivator IS the rhythm, shén flows without thought.

---

## Body Path (体修) — Training Clicker & Resistance Gauntlet

> **Genre**: Incremental / Clicker / Rage game

The Body cultivator doesn't meditate. They **train**. The core loop is physical — click, tap, hold, drag through training exercises that build kinetic shén through strain.

### How It Works

The player sees a training environment (training yard, gravity chamber, volcanic forge). Exercises appear as mini-games. The player performs them to build shén. Each exercise has a risk/reward: push harder = more shén but potential injury.

```
┌──────────────────────────────────────────────────────────┐
│  💪 GRAVITY CHAMBER TRAINING — Iron Mountain Style        │
│                                                          │
│  ⚙️ Gravity: 3.2× Earth normal                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                    │    │
│  │           🪨  "Hold the boulder"                    │    │
│  │                                                    │    │
│  │  Progress: ████████████░░░░░░░░░░ 45%              │    │
│  │  Strain: ████████████████████████ 92% ⚠️ DANGER    │    │
│  │                                                    │    │
│  │  [ HOLD your tap to keep lifting ]                 │    │
│  │                                                    │    │
│  │  The boulder presses down. Your arms shake.         │    │
│  │  Release too early: partial progress.               │    │
│  │  Hold too long: injury (HP -20%).                   │    │
│  │  Release at peak: MAXIMUM GAIN (+2× kinetic shén)  │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Session progress: 4/10 exercises completed              │
│  Kinetic shén gained this session: +22 S                 │
│                                                          │
│  [ Rest (heal 10% HP, -60s cooldown) ]                   │
│  [ Auto-train (-70% efficiency, no risk) ]              │
└──────────────────────────────────────────────────────────┘
```

### Mechanics

| Mechanic | How It Works |
|----------|-------------|
| **Training Exercises** | Each tier unlocks harder exercises. Tier 1: push-ups, pull-ups, stone lifting. Tier 4: carry a boulder up a mountain. Tier 7: hold a collapsing dimension open with your bare hands. |
| **Strain Gauge** | Every exercise has a strain meter. Higher strain = more shén when you complete. But exceeding 100% strain causes injury (HP loss, temporary stat debuff). Knowing when to release is the skill. |
| **Scar System** | Surviving injuries leaves scars. Scars give permanent minor bonuses ("The Bite That Didn't Kill Me" — +3 defense against wolf-type beasts). Body cultivators wear their scars like medals. |
| **Extreme Environments** | Each location type provides different training bonuses. Gravity caves (+kinetic), volcanic vents (+fire resist), freezing peaks (+HP). Body cultivators travel to train. |
| **Auto-Train** | The player can set a training regimen and let it run at low efficiency. No active gameplay needed. But they miss the risk/reward bonuses and scar opportunities. |
| **Combat** | Body cultivators in combat have a "strain mode" — they can push their body beyond safe limits for a burst of power, with consequences after combat. |

---

## Spirit Path (灵修) — Spirit Colony Manager

> **Genre**: Colony management / City-building / Automation

The Spirit cultivator's power comes from their bound spirits. The core loop is managing a **spirit colony** — a pocket of the Spirit Realm that the cultivator has claimed. Spirits are workers. The colony produces soul pearls, researches abilities, and grows in population and complexity.

### How It Works

The player sees their spirit colony — a small territory in the Spirit Realm. Bound spirits appear as inhabitant units with roles, needs, and tasks. The player assigns them to structures, manages resources, and expands territory.

```
┌──────────────────────────────────────────────────────────┐
│  👻 SPIRIT COLONY — The Veil's Edge                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                    │    │
│  │  🏚️ Accumulator ── (3 spirits assigned)            │    │
│  │      Produces: 3 Soul Pearls / 100 ticks           │    │
│  │      Efficiency: 78% (-22% due to overcrowding)    │    │
│  │                                                    │    │
│  │  🗼 Watchtower ── (1 spirit assigned)                │    │
│  │      Alerts: 2 hostile spirits approaching          │    │
│  │                                                    │    │
│  │  🕯️ Shrine ── (unstaffed)                           │    │
│  │      ⚠️ Attracts wandering souls — assign a         │    │
│  │         spirit here to convert them to residents    │    │
│  │                                                    │    │
│  │  🌫️ [ Expand territory — costs 5 Soul Pearls ]     │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  🏘️ Colony: 12 spirits, 4 structures, 3 Soul Pearls/tick│
│  Neighborhood satisfaction: 😊 Happy (no issues)         │
│                                                          │
│  [ Manage Colony ]  [ Visit Spirit Realm ]  [ Return ]   │
└──────────────────────────────────────────────────────────┘
```

### Mechanics

| Mechanic | How It Works |
|----------|-------------|
| **Spirit Workers** | Bound spirits are assigned to structures. Each has a type (gatherer, guard, researcher, builder) and a satisfaction level. Unhappy spirits leave. |
| **Colony Structures** | Build structures that produce resources, provide defense, or enable research. Accumulators (produce soul pearls), Watchtowers (detect threats), Shrines (recruit new spirits), Forges (refine spirit energy). |
| **Territory Expansion** | The colony can be expanded into neighboring Spirit Realm territory. Each expansion costs resources and may trigger hostile spirits. |
| **Spirit Needs** | Spirits need: offerings (paid in shén), rest (periods of no tasks), purpose (varied assignments). Neglecting needs causes spirits to rebel or leave. |
| **Hostile Incursions** | The Spirit Realm has predators — soul-eaters, vengeful ghosts, void wraiths. The colony must defend itself. Assign spirits to guard duty or build defensive structures. |
| **Residual Generation** | While the player is away, spirits continue producing. Colony accumulates resources. Hostile incursions may have happened that need resolving when the player returns. |
| **Combat** | Spirit cultivators in combat can summon bound spirits in battle formations. Each spirit assigned to combat decreases colony efficiency but provides a combat ally. |

---

## Tech Path (工修) — Factory Builder

> **Genre**: Automation / Factory building (Factorio-lite)

The Tech cultivator builds **production chains**. Raw materials enter. Refined shén vessels exit. The core loop is designing, building, and optimizing factories that automate the extraction and refinement of shén.

### How It Works

The player sees a workshop grid (2D top-down). They place machines on the grid, connect them with conveyor belts or qi conduits, and watch the chain run. Each machine type has inputs and outputs. The challenge is routing materials efficiently.

```
┌──────────────────────────────────────────────────────────┐
│  🔧 WORKSHOP — Eternal Mechanism Pattern Loom             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                    │    │
│  │  ⛏️ Mine ── (Iron Ore: +3/tick)                    │    │
│  │       │                                             │    │
│  │       ▼                                             │    │
│  │  🔥 Smelter ── (Iron Ingot: +2/tick)                │    │
│  │       │                                             │    │
│  │       ▼                                             │    │
│  │  ⚙️ Assembler ── (Formation Flag: +1/tick)          │    │
│  │       │                                             │    │
│  │       ▼                                             │    │
│  │  📦 Storage ── (36/100 Formation Flags stored)      │    │
│  │                                                    │    │
│  │  ⚠️ Alert: Mine efficiency at 30% — vein depleted!  │    │
│  │     [ Build Prospector ] or [ Relocate Mine ]       │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Production: 1 Radiant Shén Stone / 50 ticks             │
│  Power: 80% (Smelter underpowered — add generator)       │
│  Raw mats: Iron 12, Coal 8, Spirit Residue 3            │
│                                                          │
│  [ Build ]  [ Research ]  [ Auto-Optimize ]  [ Return ]  │
└──────────────────────────────────────────────────────────┘
```

### Mechanics

| Mechanic | How It Works |
|----------|-------------|
| **Workshop Grid** | A 2D grid where machines are placed. Each machine occupies 1–4 tiles. Conveyors and conduits transfer materials between them. |
| **Machine Types** | Mines (extract raw materials), Smelters (refine raw→processed), Assemblers (build items), Generators (power machines), Storages (hold output). |
| **Research Tree** | Spend crafted items to unlock new schematics — better machines, faster production, new material types. Each tier of the Tech path unlocks a new tech tier. |
| **Supply Chains** | A machine without input stops. A mine without output fills up and stops. The player must manage flow — bottlenecks reduce efficiency. |
| **Blueprint System** | Players can save and share factory layouts. Blueprints can be copied, sold, or traded. The Eternal Mechanism Pavilion has a blueprint library. |
| **Factory Automation** | Endgame tech allows for fully automated factories that detect bottlenecks, relocate mines, and expand themselves. A Tier 6 Tech cultivator's workshop runs itself. |
| **Offline Accumulation** | Factories continue running while the player is away. Storage fills up. Return to collect the output and redesign bottlenecks. |
| **Combat** | Tech cultivators deploy constructed war machines in combat — turrets, golems, disposable attack drones. They don't fight personally; their factory fights for them. |

---

## Faith Path (信修) — Civilization Expansion

> **Genre**: Map-based strategy / Territory control / Civilization-lite

The Faith cultivator expands their influence across the world map. The core loop is managing **followers, temples, and territory** — converting new populations, defending existing ones, and competing with rival faiths.

### How It Works

The player sees an overlay of the world map. Settlements, cities, and regions have a "faith percentage" showing how many followers they have in that location. The player sends missionaries, builds temples, and manages clergy.

```
┌──────────────────────────────────────────────────────────┐
│  🙏 FAITH MAP — Temple of Ten Thousand Lights              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                    │    │
│  │  🏘️ Azure Cloud Village: ████████░░ 80% faithful │    │
│  │      Shrine: active (4 pilgrims/day)               │    │
│  │      [Build Temple — 500 S, 100 followers]         │    │
│  │                                                    │    │
│  │  🏛️ Green Jade City: ██░░░░░░░░ 24% faithful       │    │
│  │      ⚠️ Celestial Chantry influence growing        │    │
│  │      Competing faith: Temple of Ten Thousand Lights│    │
│  │      [ Send Missionary — 50 S, +5%]               │    │
│  │      [ Build Shrine — 100 S, +3%/tick]            │    │
│  │                                                    │    │
│  │  🏚️ Whispering Forest: ░░░░░░░░░░ 0%              │    │
│  │      No settlement — cannot spread faith here      │    │
│  │                                                    │    │
│  │  ⛰️ Misty Peaks: ██████░░░░ 55% faithful           │    │
│  │      Temple: active (12 pilgrims/day)              │    │
│  │      ❗ Sect dispute: Cloud Soaring wants this     │    │
│  │         territory. Negotiate or resist?            │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  📊 TOTAL: 3 locations, ~1,450 followers                 │
│  Faith income: +12 S/tick (active), +3 S/tick (idle)    │
│  Events pending: 1 (a Celestial Chantry preacher was     │
│                    seen in Green Jade City...)           │
│                                                          │
│  [ Send Missionary ]  [ Build Temple ]  [ Manage Clergy ]│
└──────────────────────────────────────────────────────────┘
```

### Mechanics

| Mechanic | How It Works |
|----------|-------------|
| **Faith Map** | World map overlay showing faith percentage per location. Faith determines income — more followers = more faith shén. |
| **Conversion** | Convert locations by sending missionaries (costs shén, takes time). Success depends on location population, existing faith strength, and player karma. |
| **Temples & Shrines** | Shrines provide passive faith generation. Temples amplify it and attract pilgrims. Temples need protection — they become targets for rival faiths. |
| **Rival Faiths** | The Celestial Chantry competes with the Temple. Locations with competing faiths have a conversion tug-of-war. This can escalate to holy war. |
| **Clergy Management** | Assign clergy (NPC followers who become minor cultivators) to manage temples, train new missionaries, or provide buffs to followers. |
| **Inquisitions** | At high karma (positive or negative), the player can purge non-believers. This gives a short-term faith boost but long-term reputation damage with other sects. |
| **Pilgrimage Events** | Followers sometimes undertake pilgrimages — walking to a distant temple. The player can protect or exploit these events for faith bonuses. |
| **Offline Growth** | Faith continues converting while away — slower but steady. Returning sees updated map with new followers, new temples, and possibly rivals encroaching. |
| **Combat** | Faith cultivators fight with holy (or unholy) power — blessings buff allies, curses debuff enemies, miracles can instantly resolve encounters. The better their faith infrastructure, the more combat power they have. |

---

## Beast Path (兽修) — Beast Battler & Breeder

> **Genre**: Creature collection / Breeding / Monster battling

The Beast cultivator awakens bloodlines — not just within themselves, but within the beasts they command. The core loop is **capturing, training, breeding, and battling** beasts. The cultivator can transform, but their true power lies in their stable of bonded beasts.

### How It Works

The player sees a beast stable — a collection of captured beasts. Each beast has stats, abilities, bloodline purity, and a mood. The player takes beasts into battle, breeds them for better traits, and sends them on autonomous missions.

```
┌──────────────────────────────────────────────────────────┐
│  🐾 BEAST STABLE — Crimson Fang Pack Outpost               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  🐺 Stormclaw (Active Party)                      │    │
│  │  Wolf bloodline | Tier 4 | Purity: 78%             │    │
│  │  HP: 340/340 | Atk: 64 | Def: 38 | Spd: 82       │    │
│  │  Abilities: Pack Howl, Shadow Bite, Tracking       │    │
│  │  Mood: Eager (ready to fight)                      │    │
│  │                                                    │    │
│  │  🦅 Skyfeather (Reserve)                            │    │
│  │  Phoenix bloodline | Tier 3 | Purity: 45%          │    │
│  │  Trained: +12% fire ability this week              │    │
│  │  ⏳ On mission: scouting Demon Beast Mountain      │    │
│  │      Returns in: 270 ticks (~4 min)               │    │
│  │                                                    │    │
│  │  🥚 3 eggs incubating:                             │    │
│  │    Wolf × Tiger (15% purity, may combine)          │    │
│  │    Phoenix × Wolf (??? — first cross attempt)     │    │
│  │    Shadow Panther (pure — for trade)               │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Breeding: 3 pairs available | Mutation rate: 2%         │
│  Beast shén income: +1 S/tick per active beast           │
│                                                          │
│  [ Hunt ]  [ Battle ]  [ Breed ]  [ Send on Mission ]    │
└──────────────────────────────────────────────────────────┘
```

### Mechanics

| Mechanic | How It Works |
|----------|-------------|
| **Capture** | Weaken a wild beast → use a binding item → chance of capture. Higher-tier beasts are harder to capture. Some beasts can only be found in specific locations. |
| **Bloodline Purity** | Purity 0–100%. Higher purity = stronger abilities, better stat growth, more loyalty. Purity increases by consuming matching bloodline cores. Cross-breeding reduces purity. |
| **Training** | Beasts gain XP from combat and missions. Leveling up improves stats and unlocks new abilities. Each beast has a level cap based on bloodline purity. |
| **Breeding** | Pair two beasts → produce an egg → egg hatches into a new beast with combined traits. Offspring inherits stats based on parents. Rare mutations can produce unique beast types. |
| **Missions** | Send beasts on autonomous missions (scouting, hunting, guarding, gathering). They return after a set number of ticks with loot and XP. |
| **Transformation** | The cultivator can transform using their primary bloodline (the beast they have bonded with most). Transformation uses the beast's stats alongside the player's. |
| **Beast Mood** | Beasts have moods (Eager, Content, Bored, Angry, Depressed). Mood affects performance. Bored beasts need battles. Angry beasts may refuse commands. Bonding activities improve mood. |
| **Offline** | Beasts continue missions while the player is away. Stables need to be checked — eggs may hatch, missions may complete, mood may degrade. |
| **Combat** | Beast path combat is a **2v2** system — the cultivator fights alongside their active beast. They can issue commands (attack, defend, special ability) or fight independently while the beast acts autonomously. |

---

## Path Comparison — What The Player Actually Does

| Path | Primary Gameplay | Secondary Gameplay | When Idle |
|------|-----------------|-------------------|-----------|
| **Qi** | Rhythm game — tap meridian nodes in time with pulse | Combat timing mini-game on technique execution | Auto-circulates at 50% efficiency |
| **Body** | Clicker / resistance — hold/tap through training exercises | Scar system — survive injuries for permanent bonuses | Auto-trains at 70% efficiency, no scar opportunities |
| **Spirit** | Colony manager — assign spirits, build structures, expand | Spirit diplomacy — negotiate with hostile spirits, befriend powerful ones | Colony runs autonomously, may need intervention on return |
| **Tech** | Factory builder — design production chains, optimize layouts | Research tree — unlock new schematics, upgrade machines | Factories run offline, storage fills up, veins deplete |
| **Faith** | Civilization expansion — convert locations, manage clergy | Holy wars — compete with rival faiths, defend your followers | Slow conversion continues, rivals encroach |
| **Beast** | Beast battler/breeder — capture, train, breed, battle | Transformation — become the beast yourself for direct combat | Beasts continue missions, eggs hatch, mood degrades |

---

## Architecture Implications

Each path's gameplay is a **separate module** that plugs into the shared event engine:

```
src/
├── systems/
│   ├── CultivationPaths.ts          # Path selection, shared mechanics
│   ├── QiPath.ts                    # Meridian rhythm engine
│   ├── BodyPath.ts                  # Training clicker engine
│   ├── SpiritPath.ts                # Spirit colony manager
│   ├── TechPath.ts                  # Factory builder engine
│   ├── FaithPath.ts                 # Faith map & conversion engine
│   └── BeastPath.ts                 # Beast capture & breeding engine
├── ui/
│   ├── components/
│   │   ├── MeridianUI.tsx           # Qi path UI
│   │   ├── TrainingUI.tsx           # Body path UI
│   │   ├── SpiritColonyUI.tsx       # Spirit path UI
│   │   ├── FactoryUI.tsx            # Tech path UI
│   │   ├── FaithMapUI.tsx           # Faith path UI
│   │   └── BeastStableUI.tsx        # Beast path UI
```

The event engine fires regardless of path. The path module determines what the player sees on their "cultivation" tab and how they generate shén. The two systems interact — resolving a story event might give a Tech player a new schematic or a Beast player a rare beast egg.

---

*See also: [Cultivation Paths](./cultivation-paths.md), [Energy Tiers](./energy-tiers.md), [Realms Lore](../realms-lore.md)*
