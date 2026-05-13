# The Six Cultivation Paths

> **Module**: `src/systems/CultivationPaths.ts`, `src/data/paths.ts`
>
> **Type**: Pure functions — path selection, progression, ability unlocking
>
> **Signature**: `(state, params?) => GameState | ActionResult<GameState>`

---

## Overview

At **Foundation Establishment**, every cultivator must choose a **Path** — the fundamental approach to cultivation that defines their relationship with power. The Six Paths are not just "builds" — they are philosophies, lifestyles, and identities that the world **reacts to**. A body cultivator walks through the world differently than a spirit cultivator. NPCs treat them differently. Different locations are sacred or hostile to different paths.

---

## The Six Paths

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE SIX CULTIVATION PATHS                        │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   BODY   │  │    QI    │  │  SPIRIT  │  │   TECH   │          │
│  │  体修    │  │   气修   │  │  灵修    │  │  工修    │          │
│  │          │  │          │  │          │  │          │          │
│  │ Physical │  │ Energy   │  │ Soul     │  │ Knowledge│          │
│  │ Flesh    │  │ Cosmic   │  │ Death    │  │ Rules    │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │              │               │
│  ┌────┴──────────────┴──────────────┴──────────────┴─────┐        │
│  │                                                       │        │
│  │  ┌──────────┐                         ┌──────────┐   │        │
│  │  │  FAITH   │                         │  BEAST   │   │        │
│  │  │  信修    │                         │  兽修    │   │        │
│  │  │          │                         │          │   │        │
│  │  │ Belief   │                         │ Bloodline│   │        │
│  │  │ Karma    │                         │ Ancient  │   │        │
│  │  └──────────┘                         └──────────┘   │        │
│  │                                                       │        │
│  └───────────────────────────────────────────────────────┘        │
│                                                                     │
│  Choose ONE at Foundation Establishment.                            │
│  Hybrid paths unlock at Spirit Severing realm.                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Body Cultivation — 体修 (Ti Xiu)

> *"The flesh is the first heaven. Master it, and you master all heavens."*

### Philosophy
The body is not a vessel for qi — the body **is** the Dao. Through relentless physical tempering, the body cultivator transforms their flesh into a weapon that needs no qi, no technique, no artifact. At the highest level, the body cultivator's fist **shatters the boundary between realms**.

### Progression Stages

| Stage | Realm Gate | Breakthrough Requires | Unlocks |
|-------|-----------|----------------------|---------|
| **Iron Skin** 铁皮 | Foundation Est. | Survive 1000 physical attacks | +50 Defense, immune to bleeding |
| **Steel Bones** 钢骨 | Foundation L5 | Lift a mountain boulder (atk 80+ check) | +100 HP, unarmed deals weapon damage |
| **Jade Body** 玉体 | Core Formation | Forge body in volcanic fire (survive fire damage) | +30 all stats, elemental resist +20% |
| **Diamond Meridians** 钻脉 | Nascent Soul | Overchannel body beyond limit (HP to 1%) | Qi capacity +50%, HP regen 3%/tick |
| **Golden Body** 金身 | Spirit Severing | Defeat 100 enemies with unarmed strikes | Atk +60, Def +60, 10% dmg reflect |
| **Indestructible Flesh** 不灭体 | Dao Seeking | Survive a fatal blow and stand again | Survive 1 death/day, HP +500 |
| **Realm-Shattering Fist** 碎界拳 | Immortal | Punch through a dimensional barrier | **Bypass formations, break pocket dimensions, punch through reality** |

### Core Mechanics

```typescript
interface BodyPathState {
  stage: BodyStage;
  temperingProgress: number;        // 0–100 toward next stage
  unarmedMastery: number;           // 0–100, replaces weapon mastery
  physicalResistance: number;       // Flat damage reduction
  regenerationRate: number;         // HP per tick passively
  scars: Scar[];                    // Cosmetic + minor bonuses from survived injuries
}

interface Scar {
  source: string;                   // "Survived Dragon's Bite"
  location: string;                 // "Left arm"
  bonus: string;                    // "+5 defense against dragons"
}
```

### Path-Specific Cultivation

Body cultivators don't meditate — they **train**:
- **Gravity Tempering**: Cultivate in high-gravity zones (+50% progress, constant HP drain)
- **Extreme Exposure**: Volcanic vents, frozen peaks, acid pools
- **Combat Baptism**: Progress from taking damage in battle
- **Body-Refining Pills**: Special pills that accelerate physical tempering (crafted by alchemists)

### Unique Abilities

| Ability | Stage Unlock | Effect |
|---------|-------------|--------|
| **Iron Wall** | Iron Skin | Auto-block first attack in combat |
| **Mountain Thrower** | Steel Bones | Throw enemies into other enemies (AoE) |
| **Body Fortress** | Jade Body | Become immovable for 5 turns (+200% def, -100% speed) |
| **Diamond Overchannel** | Diamond Meridians | Spend HP for Qi at 1:2 ratio |
| **Golden Aegis** | Golden Body | Reflect 30% of incoming damage |
| **Death Defiance** | Indestructible | When killed, revive at 1 HP (once/day) |
| **Realm Breaker** | Realm-Shattering Fist | Instantly destroy any formation, barrier, or domain |

### Social Standing
- **Common folk**: Awe. "That man stopped a landslide with his chest."
- **Qi cultivators**: Condescension. "Crude. No refinement."
- **Sects**: Mixed. Cloud Soaring respects their strength; Verdant Lotus finds them barbaric.
- **Beast cultivators**: Kinship. Both are ostracized. Natural allies.

### Path-Exclusive Locations

| Location | Benefit |
|----------|---------|
| **Gravity Cave** | +100% body tempering speed, -5% HP/tick |
| **Ironwood Forest** | Combat gives 2× progress |
| **Volcanic Caldera** | Unlocks Jade Body attempt |
| **Thunder Peak** | +50% tempering, paralyzed randomly |

---

## 2. Qi Cultivation — 气修 (Qi Xiu)

> *"Qi is the breath of stars. The sun grants power. The moon grants wisdom. The earth grants life. Absorb them all."*

### Philosophy
Qi cultivation is the **classical path** — absorbing and refining the fundamental energy of the universe. But true masters don't just absorb ambient qi; they draw from the **Three Celestial Sources**: the Sun (Yang), the Moon (Yin), and the Earth (Neutral). Balancing these three is the key to stable, powerful cultivation.

### Progression Stages (Standard Realms)

| Stage | Qi Source Focus | Breakthrough Requires |
|-------|----------------|----------------------|
| **Qi Condensation** 凝气 | Earth qi primarily | Sense and gather qi |
| **Foundation Establishment** 筑基 | Balance Earth + one Celestial | Solidify dantian |
| **Core Formation** 结丹 | All three sources | Form Golden Core from balanced qi |
| **Nascent Soul** 元婴 | Soul nurtured by celestial qi | Birth the soul infant |
| **Spirit Severing** 化神 | Sever attachment to physical qi | Cut mortal tethers |
| **Dao Seeking** 合体 | Comprehend qi's cosmic nature | Understand the Dao of Qi |
| **Immortal Ascension** 渡劫 | Transcend all sources | Become a source yourself |

### The Three Celestial Qi Sources

```typescript
interface CelestialQiState {
  sunQi: number;         // Yang — Aggressive, hot, expansive
  moonQi: number;        // Yin — Receptive, cool, contractive
  earthQi: number;       // Neutral — Stable, grounding, nourishing
  balance: number;       // 0–100, how well balanced (100 = perfect harmony)
}

type CelestialQiType = 'sun' | 'moon' | 'earth';
```

| Source | Cultivates Best At | Boosts | Risk of Overdose |
|--------|-------------------|--------|-----------------|
| **Sun** ☀️ | Daytime, mountain peaks, deserts | Attack, fire/light techniques, speed | Qi Deviation (burning), aggression |
| **Moon** 🌙 | Nighttime, lakes, high altitudes | Comprehension, water/ice techniques, healing | Qi Deviation (freezing), detachment from reality |
| **Earth** ⛰️ | Caves, forests, valleys | Defense, wood/earth techniques, HP | Qi stagnation, slow breakthrough |

### Qi Gathering Mechanics

```typescript
function gatherQi(state: GameState, source: CelestialQiType): GameState {
  const effectiveness = getSourceEffectiveness(state, source);
  // Sun: only daytime, ×1.5 on mountains, ×0.3 underground
  // Moon: only nighttime, ×1.5 near water, ×0.3 at noon
  // Earth: always available, ×1.5 in caves, ×1.0 in cities

  const amount = baseGathering * effectiveness * cultivationSpeed;

  return produce(state, draft => {
    draft.player.paths.qi.celestialQi[source] += amount;

    // Balance check: if one source is >2× others, imbalance penalty
    draft.player.paths.qi.balance = calculateBalance(draft.player.paths.qi.celestialQi);

    if (draft.player.paths.qi.balance < 50) {
      // Qi deviation risk
      draft.player.paths.qi.deviationRisk += (50 - draft.player.paths.qi.balance) * 0.01;
    }
  });
}
```

### Qi Deviation

When celestial qi is imbalanced, the cultivator risks **Qi Deviation** — a violent backlash:

| Imbalance | Deviation Type | Effect |
|-----------|---------------|--------|
| Sun overdose | **Yang Flare** | Lose 30% current Qi, take fire damage, 10 ticks of -50% defense |
| Moon overdose | **Yin Freeze** | Lose 30% current Qi, take ice damage, 10 ticks frozen |
| Earth overdose | **Stagnation** | Cultivation speed -80% for 50 ticks, cannot breakthrough |
| Sun-Moon imbalance | **Polarity Shock** | Lose 50% Qi, random elemental damage, unconscious (skip 30 ticks) |

### Unique Abilities

| Ability | Realm Unlock | Effect |
|---------|-------------|--------|
| **Sunfist** | Foundation | Next attack is 2× sun-fire damage |
| **Moonveil** | Foundation | Become untargetable for 2 turns |
| **Earthroot** | Foundation | Heal 20% HP, cannot be moved |
| **Solar Flare** | Core Formation | AoE sun damage, blinds enemies |
| **Lunar Reflection** | Core Formation | Copy last enemy technique used against you |
| **Celestial Domain** | Nascent Soul | Create a zone of chosen celestial qi (buffs allies, debuffs enemies) |
| **Three Lights Unity** | Dao Seeking | All three celestial sources harmonize: +100% all stats for 10 turns |

### Social Standing
- **Everyone**: The default. The standard. "A proper cultivator."
- **Other paths**: Vary. Body cultivators think they're fragile. Tech cultivators respect their balanced approach.
- **Sects**: All sects practice qi cultivation as their foundation, even if they specialize.

---

## 3. Spirit Cultivation — 灵修 (Ling Xiu)

> *"Every soul that ever lived left a trace. I walk where the dead whisper, and they teach me what the living have forgotten."*

### Philosophy
The soul is eternal; the body is temporary. Spirit cultivators access the **Spirit Realm** — an alternate dimension layered over the physical world where souls reside after death. They communicate with ancestors, weave residual spirit energy from death sites into power, and can project their own soul beyond their body.

### Progression Stages

| Stage | Unlock | Breakthrough Requires |
|-------|--------|----------------------|
| **Soul Awakening** 觉魂 | Sense spirit energy | Witness a death (any death) |
| **Spirit Sense** 灵感 | See spirits, spirit sight | Meditate at a death site for 500 ticks |
| **Soul Projection** 出魂 | Project soul beyond body | Enter a trance state (vulnerable for 100 ticks) |
| **Spirit Realm Entry** 入灵 | Physically enter Spirit Realm | Find a realm rift (hidden encounter) |
| **Soul Dominion** 掌魂 | Command lesser spirits | Subdue a hostile spirit in combat |
| **Reincarnation Memory** 宿慧 | Recall past life memories | Survive a soul tribulation |
| **Eternal Soul** 永魂 | Soul cannot be destroyed | Die and return (must die once and resurrect) |

### Core Mechanics

```typescript
interface SpiritPathState {
  stage: SpiritStage;
  spiritEnergy: number;             // Like Qi but for spirit arts
  maxSpiritEnergy: number;
  boundSpirits: BoundSpirit[];      // Spirits the player has befriended/dominated
  spiritSightActive: boolean;       // Can see hidden things
  currentlyProjecting: boolean;     // Soul is outside body
  pastLifeMemories: PastLife[];     // Unlocked past life fragments
  veilThickness: number;            // How thin the veil is at current location (0–100)
}

interface BoundSpirit {
  id: string;
  name: string;
  type: 'ancestor' | 'wandering_soul' | 'beast_spirit' | 'ancient_hero' | 'vengeful_ghost';
  power: number;
  abilities: SpiritAbility[];
  relationship: 'bound' | 'allied' | 'friendly' | 'hostile_pacified';
}
```

### The Spirit Realm & Veil

Every location has a **veil thickness** — how separated it is from the Spirit Realm:

| Veil | Location Types | Spirit Activity |
|------|---------------|-----------------|
| 0–20 | Graveyards, ancient battlefields, execution grounds | Spirits everywhere, easy to contact |
| 21–40 | Old ruins, abandoned villages, deep caves | Spirits visible to spirit sense |
| 41–60 | Cities, villages, forests | Occasional spirits |
| 61–80 | Sect grounds (warded), temples (consecrated) | Spirits repelled |
| 81–100 | Holy ground, active temples, Heavenly Peak | Spirit Realm nearly inaccessible |

### Gathering Spirit Energy

Spirit energy is gathered from:
- **Death sites**: Residual energy from the deceased (more at thin-veil locations)
- **Bound spirits**: They generate energy over time
- **Soul absorption**: Rare and dark — absorbing spirits directly (gives power but attracts vengeful ghosts)
- **Ancestral offerings**: Leaving offerings at shrines (costs spirit stones, gives steady energy)

```typescript
function gatherSpiritEnergy(state: GameState): GameState {
  const veil = getVeilThickness(state.world.currentNodeId);
  const gatheringRate = (100 - veil) * 0.1; // 10/sec at thinnest veil

  let totalGain = gatheringRate;

  // Bound spirits contribute
  for (const spirit of state.player.paths.spirit.boundSpirits) {
    totalGain += spirit.power * 0.5;
  }

  return produce(state, draft => {
    draft.player.paths.spirit.spiritEnergy = Math.min(
      draft.player.paths.spirit.maxSpiritEnergy,
      draft.player.paths.spirit.spiritEnergy + totalGain
    );
  });
}
```

### Spirit Abilities

| Ability | Stage | Effect |
|---------|-------|--------|
| **Spirit Sight** | Spirit Sense | See hidden encounters, invisible enemies, spirit NPCs |
| **Commune with Dead** | Spirit Sense | Speak with named NPCs after they die |
| **Soul Projection** | Soul Projection | Scout locations without traveling (body stays behind, vulnerable) |
| **Spirit Weaver** | Spirit Realm Entry | Craft "spirit items" from spirit energy (unique equipment) |
| **Ancestral Guidance** | Spirit Realm Entry | Once/day: +50% success on next breakthrough |
| **Raise Spirit Ally** | Soul Dominion | Bind a defeated enemy's spirit as temporary ally |
| **Life-Death Cycle** | Reincarnation Memory | Convert death energy to healing (revive fallen ally once/day) |
| **Eternal Return** | Eternal Soul | On death, respawn at last death site with 50% resources retained |

### Spirit Realm Encounters (Unique to Spirit Cultivators)

Spirit cultivators can trigger encounters others never see:
- **Ancestor's Memory**: Relive a past event, gain permanent comprehension
- **Ghost Market**: Trade with dead merchants (spirit stones for rare items)
- **Spirit Beast**: Special spirit-realm beasts that drop soul materials
- **Vengeful Ghost**: Combat encounter with a spirit (requires spirit energy to damage)
- **Realm Rift**: Portal to enter the Spirit Realm physically (dungeon equivalent)

### Social Standing
- **Common folk**: Terrified. "They talk to the dead!"
- **Qi cultivators**: Uneasy respect. "Useful but... unnatural."
- **Sects**: Shadow Heaven wants to recruit them. Verdant Lotus studies them. Cloud Soaring tolerates them.
- **Body cultivators**: Mutual incomprehension. "You're a GHOST?!"

---

## 4. Technology Cultivation — 工修 (Gong Xiu)

> *"The Dao is not a mystery. It is a mechanism. Discover the gears, and you can turn the universe."*

### Philosophy
The universe operates on **rules**. Technology cultivators — also called Artificers, Formation Masters, or Dao Engineers — study these rules through experimentation and reason. They craft artifacts that rival divine treasures, deploy formations in seconds that take others hours, and at the highest level can **rewrite local reality** by adjusting the underlying principles.

### Progression Stages

| Stage | Title | Breakthrough Requires |
|-------|-------|----------------------|
| **Apprentice** 学徒 | Learn basic crafting | Craft 10 items successfully |
| **Journeyman** 工匠 | Independent crafting | Design and craft a rare-tier item from scratch |
| **Master Artificer** 大师 | Complex artifacts | Craft an epic-tier artifact |
| **Grandmaster** 宗师 | Formation mastery | Deploy 3 formations simultaneously |
| **Sage of Mechanisms** 机圣 | Create automaton | Build a self-operating artifact |
| **Dao Architect** 道匠 | Manipulate local rules | Modify a location's natural laws |
| **World Smith** 铸界 | Create pocket dimension | Forge a stable sub-realm |

### Core Mechanics

```typescript
interface TechPathState {
  stage: TechStage;
  schematics: Schematic[];            // Known blueprints
  materialKnowledge: MaterialKnowledge[]; // Discovered material properties
  activeProjects: Project[];          // Current crafting projects (up to 3 concurrent)
  automatonSlots: number;             // How many automatons can be active
  activeAutomatons: Automaton[];      // Crafted assistants
  formationLibrary: Formation[];      // Known formations (faster deployment than others)
  insights: string[];                 // Discovered world rules (permanent bonuses)
}

interface Schematic {
  id: string;
  name: string;
  outputType: 'weapon' | 'talisman' | 'formation_flag' | 'automaton' | 'artifact';
  materials: MaterialRequirement[];
  ticksToCraft: number;
  comprehensionRequired: number;
  rarity: Rarity;
  isExperimental: boolean;            // Experimental = can fail but may create unique item
}

interface Automaton {
  id: string;
  name: string;
  type: 'combat' | 'gathering' | 'defense' | 'messenger';
  durability: number;
  maxDurability: number;
  abilities: AutomatonAbility[];
}
```

### World Rules & Insights

Tech cultivators discover **hidden rules** of the world:

```typescript
interface Insight {
  id: string;
  name: string;
  description: string;              // "You discovered that fire qi resonates with volcanic stone at 847 Hz"
  effect: InsightEffect;
}

type InsightEffect =
  | { type: 'craftingBonus'; itemType: string; bonus: number }
  | { type: 'formationSpeed'; multiplier: number }
  | { type: 'materialEfficiency'; materialType: string; savedPercent: number }
  | { type: 'damageRevelation'; element: Element; multiplier: number }
  | { type: 'locationRule'; locationId: string; effect: string }
  | { type: 'automatonUpgrade'; upgrade: string };
```

Insights are gained by:
- Studying at libraries and ancient ruins
- Reverse-engineering found artifacts
- Meditation in high-comprehension zones
- Completing tech-path breakthrough trials

### Unique Abilities

| Ability | Stage | Effect |
|---------|-------|--------|
| **Rapid Assembly** | Apprentice | Craft items 30% faster |
| **Material Sense** | Journeyman | Identify all materials in current location |
| **Overcharge Artifact** | Master | Next talisman use has 2× power (destroys talisman) |
| **Formation Mastery** | Grandmaster | Deploy formations in 50% of normal time |
| **Automaton Commander** | Sage | Automatons fight independently in combat (extra action per turn) |
| **Rule Manipulation** | Dao Architect | Choose one rule to modify at current location (e.g., "fire damage +50%" or "enemy speed -30%") — lasts until departure |
| **Pocket Forge** | World Smith | Create a personal sub-dimension with customizable rules (permanent base) |

### Automatons

Tech cultivators can build mechanical or golem-like assistants:

| Automaton | Stage Required | Function |
|-----------|---------------|----------|
| **Gatherer Golem** | Master | Automatically collects materials at current location |
| **Guardian Puppet** | Master | Absorbs 30% of damage taken in combat |
| **Messenger Falcon** | Grandmaster | Delivers items to merchants in other cities (remote selling) |
| **Combat Golem** | Grandmaster | Fights alongside you (scales with your comprehension) |
| **Forge Servitor** | Sage | Passive crafting while you travel (+1 concurrent project) |
| **Dimensional Spider** | Dao Architect | Weaves formation flags automatically from ambient qi |

### Social Standing
- **Common folk**: Amazement. "They made a bird out of metal that FLIES!"
- **Qi cultivators**: Condescending. "Toys. True power comes from within."
- **Sects**: **Highly valued.** Every sect wants a tech cultivator. They're the backbone of sect infrastructure. Verdant Lotus reveres them.
- **Faith cultivators**: Philosophical rivals. "You trust gears. I trust heaven."

---

## 5. Faith Cultivation — 信修 (Xin Xiu)

> *"When a thousand mortals whisper your name in prayer, heaven itself bends to listen."*

### Philosophy
Power does not only come from within — it flows from the belief of others. Faith cultivators — whether monks, priests, or dark cult leaders — gather power from the **faith of mortals** and the **karma of their deeds**. A saint with a million devotees can challenge an immortal.

### Progression Stages

| Stage | Title | Breakthrough Requires |
|-------|-------|----------------------|
| **Acolyte** 信徒 | Devote to a faith | Build a shrine (100 spirit stones) |
| **Preacher** 传道者 | Spread the word | Gain 50 followers |
| **Priest** 祭司 | Formal authority | Gain 500 followers + build a temple |
| **High Priest** 大祭司 | Regional power | Gain 5,000 followers + perform a miracle |
| **Saint / Demon Saint** 圣者 | Karma apex | Reach karma ±100 + 50,000 followers |
| **Living Buddha / Demon King** 活佛/魔王 | Embodiment | 500,000 followers or legendary karma deed |
| **Ascended Deity** 飞升神 | Transcend mortality | Convert an entire city or be worshipped for 100,000 ticks |

### Core Mechanics

```typescript
interface FaithPathState {
  stage: FaithStage;
  faith: number;                      // Accumulated prayer energy (spendable)
  faithPerTick: number;               // Faith generation rate
  followers: number;                  // Total devotees
  followerLocations: Record<string, number>; // Followers per location
  karma: number;                      // -100 (pure evil) to +100 (pure saint)
  karmaDeeds: KarmaDeed[];            // Record of major deeds
  shrines: Shrine[];                  // Built shrines (generate passive faith)
  temples: Temple[];                  // Built temples (major faith generation)
  miracles: Miracle[];                // Miracles performed (cooldowns tracked)
  title: string;                      // "The Merciful", "The Terrible", etc.
}

interface Shrine {
  locationId: string;
  faithPerTick: number;               // Based on location population
  builtAt: number;                    // Tick when built
}

interface Temple {
  locationId: string;
  faithPerTick: number;               // 10× a shrine
  services: TempleService[];          // Healing, blessing, etc.
  priests: number;                    // NPC priests (generates extra faith)
  builtAt: number;
}

interface KarmaDeed {
  type: 'charity' | 'protection' | 'miracle' | 'judgment' | 'curse' | 'sacrifice' | 'betrayal' | 'massacre';
  description: string;
  karmaDelta: number;
  tick: number;
}

interface Miracle {
  id: string;
  name: string;
  faithCost: number;
  karmaRequired: number;              // Positive for saint miracles, negative for demon miracles
  cooldownTicks: number;
  effect: MiracleEffect;
}
```

### Faith Generation

```typescript
function generateFaith(state: GameState): GameState {
  let faithGained = 0;

  // Passive from followers
  faithGained += state.player.paths.faith.followers * 0.001; // 1 faith per 1000 followers per tick

  // Active from shrines
  for (const shrine of state.player.paths.faith.shrines) {
    faithGained += shrine.faithPerTick;
  }

  // Active from temples
  for (const temple of state.player.paths.faith.temples) {
    faithGained += temple.faithPerTick;
  }

  // Karma multiplier: high karma = more faith (people believe in you more)
  const karmaMultiplier = 1 + (Math.abs(state.player.paths.faith.karma) / 200);
  faithGained *= karmaMultiplier;

  return produce(state, draft => {
    draft.player.paths.faith.faith += faithGained;
  });
}
```

### Growing Followers

Followers grow through:
- **Building shrines/temples**: Each generates passive follower growth
- **Performing miracles**: Large one-time follower gains
- **Completing karmic deeds**: Witnessed good/evil deeds attract followers
- **Dialogue choices**: Charismatic characters can convert NPCs
- **Saving villages from beast tides**: Massive follower spike
- **Cursing enemies**: Fear-based following (evil path)

### Miracle Catalog

#### Saint Path (Positive Karma)

| Miracle | Faith Cost | Karma | Effect |
|---------|-----------|-------|--------|
| **Healing Light** | 50 | +30 | Heal entire location's NPCs (+followers) |
| **Bountiful Harvest** | 200 | +10 | Location merchant prices -30% for 5000 ticks |
| **Divine Protection** | 500 | +5 | Location immune to beast tide for 10000 ticks |
| **Raise the Worthy** | 1000 | +5 | Resurrect a named NPC you befriended |
| **Heaven's Ark** | 5000 | +5 | Teleport all followers in a city to safety |

#### Demon Path (Negative Karma)

| Miracle | Faith Cost | Karma | Effect |
|---------|-----------|-------|--------|
| **Withering Curse** | 50 | -30 | Target enemy: -20% all stats for 3600 ticks |
| **Plague of Locusts** | 200 | -10 | Target location: merchant prices +50% for 5000 ticks |
| **Dark Benediction** | 500 | -5 | Buff yourself: +50% damage for 600 ticks, followers terrified |
| **Soul Tithe** | 1000 | -5 | Instantly kill wounded enemies, gain their spirit energy |
| **Hell's Gate** | 5000 | -5 | Open a Nether Realm portal at location (demons fight for you) |

### Karma & Reputation Synergy

Faith cultivators have a unique relationship with sects:
- High positive karma: Righteous sects (Cloud Soaring, Verdant Lotus) give +50% standing
- High negative karma: Demonic sects (Shadow Heaven) give +50% standing
- Neutral karma: Seen as "uncommitted" — no sect bonuses

### Social Standing
- **Common folk**: Love or fear, depending on karma. "The Saint healed my daughter!" / "The Demon King burned our village."
- **Qi cultivators**: Dismissive. "Borrowed power from ignorant peasants."
- **Sects**: Wary. Faith cultivators are **outside the sect system** — they answer to their followers, not sect elders. This makes them unpredictable.
- **Spirit cultivators**: Fascinated. Faith shapes the spirit realm.

---

## 6. Beast & Bloodline Cultivation — 兽修 (Shou Xiu)

> *"Ten thousand years ago, my ancestor devoured a dragon's heart. Today, that dragon roars in my blood."*

### Philosophy
Ancient beasts held power that predates cultivation itself. By awakening dormant beast genes in one's bloodline — whether inherited from ancestors or acquired through consuming beast essence — the beast cultivator gains abilities no pure human can match. The world calls them **impure**, **mongrels**, **blood-tainted**. They call themselves **evolved**.

### Progression Stages

| Stage | Transformation | Breakthrough Requires |
|-------|---------------|----------------------|
| **Blood Awakening** 觉血 | Sense the beast within | Consume a beast core of tier 3+ |
| **Beast Mark** 兽纹 | Physical marks appear | Kill and consume a tier 5+ beast |
| **Partial Transformation** 半化 | Transform specific body parts | Meditate at an ancient beast's corpse |
| **Full Transformation** 全化 | Full beast form (temporary) | Survive a beast rampage (lose control, must recover) |
| **Ancient Blood** 古血 | Awaken the ancient lineage | Consume a legendary-tier beast core |
| **Primordial Beast** 原兽 | Become the beast | Hunt and devour a boss-tier ancient beast |
| **Beast Progenitor** 兽祖 | Create new bloodlines | Sire/blood-bond a new generation |

### Core Mechanics

```typescript
interface BeastPathState {
  stage: BeastStage;
  bloodlines: Bloodline[];            // Awakened bloodlines
  activeBloodline: string | null;     // Currently dominant bloodline
  transformationLevel: number;        // 0 (human) to 100 (full beast)
  transformationControl: number;      // 0–100, ability to control transformations
  bestialRage: number;                // 0–100, builds during combat
  consumedBeasts: ConsumedBeast[];    // Record of consumed beasts
  beastMarks: BeastMark[];            // Visible mutations
  primalInstincts: PrimalInstinct[];  // Passive beast abilities
  humanity: number;                   // 0–100. Low = more powerful but less human
}

interface Bloodline {
  id: string;
  source: string;                     // "Azure Dragon", "Vermilion Phoenix", "White Tiger", "Black Tortoise"
  purity: number;                     // 0–100
  abilities: BloodlineAbility[];
  transformationForm: BeastForm;
  weakness: Element;                  // Element the bloodline is weak to
}

interface BeastMark {
  type: 'scales' | 'claws' | 'wings' | 'tail' | 'horns' | 'eyes' | 'aura';
  bloodline: string;
  visibility: number;                 // 0 = hidden, 100 = obvious even to mortals
  statBonus: Partial<Record<string, number>>;
}

interface ConsumedBeast {
  beastId: string;
  name: string;
  tier: number;
  element: Element;
  essenceAbsorbed: number;            // How much power gained
}

interface PrimalInstinct {
  name: string;                       // "Predator's Gaze", "Pack Howl", "Territorial Rage"
  trigger: string;                    // "When below 30% HP", "When facing multiple enemies"
  effect: string;
}
```

### Bloodline Catalog

| Bloodline | Source | Grants | Weakness | Rarity |
|-----------|--------|--------|----------|--------|
| **Azure Dragon** | Eastern dragon ancestor | Thunder breath, scales (+Def), flight (wings) | Metal | Legendary |
| **Vermilion Phoenix** | Fire bird ancestor | Fire immunity, rebirth (1/day), flame aura | Water | Legendary |
| **White Tiger** | Metal beast ancestor | +50% attack, roar (AoE stun), claws | Fire | Epic |
| **Black Tortoise** | Water/earth ancestor | +100% defense, water breathing, shell shield | Wood | Epic |
| **Qilin Blood** | Celestial chimera | +20 all stats, luck aura, herb detection | Dark | Mythic |
| **Nine-Tailed Fox** | Spirit fox ancestor | Illusions, charm, transformation disguise | Light | Rare |
| **Shadow Panther** | Stealth predator | Invisibility, +50% first strike, night vision | Thunder | Uncommon |
| **Ironhide Rhino** | Physical beast | +200% HP, charge attack, trample | Ice | Common |

### The Transformation Mechanic

```typescript
function tickTransformation(state: GameState): GameState {
  const bp = state.player.paths.beast;

  // Bestial rage builds during combat
  if (state.player.inCombat) {
    bp.bestialRage = Math.min(100, bp.bestialRage + 1);

    // At high rage and low control, lose control
    if (bp.bestialRage > 80 && bp.transformationControl < 40 && Math.random() < 0.05) {
      return triggerBerserkRampage(state);
    }
  }

  // Rage decays outside combat
  if (!state.player.inCombat) {
    bp.bestialRage = Math.max(0, bp.bestialRage - 2);
  }

  // Transformation level moves toward resting state
  const restingLevel = bp.transformationControl > 50 ? 0 : bp.stage * 10;
  if (bp.transformationLevel < restingLevel) {
    bp.transformationLevel += 0.1;
  } else if (bp.transformationLevel > restingLevel) {
    bp.transformationLevel -= 0.5;
  }

  // Humanity decays when consuming beasts
  // Humanity recovers through meditation, human interaction, faith
  bp.humanity = Math.max(0, Math.min(100, bp.humanity));
}
```

### Transformation Levels & Effects

| Level | State | Visual | Effects |
|-------|-------|--------|---------|
| 0 | Pure human | Normal | No bonuses, no social penalties |
| 1–30 | Subtle marks | Slightly inhuman eyes, faint scale patterns | +10% physical stats, -10% social reputation |
| 31–60 | Hybrid | Obvious marks, claws, partial scales | +30% physical stats, full beast abilities, -40% social rep |
| 61–90 | Near-beast | Mostly beast, can still speak | +60% physical stats, all abilities empowered, -70% social rep, NPCs flee |
| 91–100 | Full beast form | Complete transformation | +100% physical stats, primal abilities, cannot speak, NPCs attack on sight |

### Berserk Rampage

When control is lost:
```typescript
function triggerBerserkRampage(state: GameState): GameState {
  // Player loses control — attacks EVERYTHING (enemies AND allies)
  // Deals bonus damage, takes reduced damage
  // Lasts until combat ends or HP < 10%
  // After rampage: -10 standing with all sects at location
  // NPCs at location may die (permanent consequences)

  return produce(state, draft => {
    draft.player.paths.beast.transformationLevel = 100;
    draft.player.paths.beast.transformationControl -= 5;
    draft.player.paths.beast.bestialRage = 100;
    draft.log.push({ type: 'berserk_rampage', data: { location: draft.world.currentNodeId } });
  });
}
```

### Humanity vs Power

This is the beast cultivator's central tension:

| Humanity | Benefits | Penalties |
|----------|----------|-----------|
| 81–100 | Social acceptance, can join most sects | -30% beast ability effectiveness |
| 51–80 | Balanced, most sects wary but tolerant | No penalty |
| 21–50 | Powerful beast abilities, some sects hostile | Can only join Blood Lotus Sect |
| 0–20 | Maximum beast power, primal instincts dominate | Hunted by beast-slaying sects, cannot enter cities, NPCs attack |

### Social Standing
- **Common folk**: Horror. "A MONSTER! Call the guards!"
- **Qi cultivators**: Disgust. "You've defiled your humanity."
- **Body cultivators**: Kinship. "You chose power over approval. Respect."
- **Sects**: **Ostracized.** Blood Lotus Sect accepts them. Cloud Soaring hunts them. Shadow Heaven experiments on them.
- **Beast companions**: The beast-bonded origin player has a unique kinship with beast cultivators.

---

## Path Selection & Hybridization

### Choosing at Foundation Establishment

When the player reaches Foundation Establishment, a one-time event fires:

> *"Your foundation is solid. Now you must choose: what form shall your Dao take?"*

The player picks one of the Six Paths. This choice is **permanent** (with partial hybridization later).

### Hybrid Paths (Spirit Severing Realm)

At Spirit Severing, the cultivator can adopt a **secondary path** at 50% effectiveness:

```typescript
type PathCombination = {
  primary: CultivationPath;
  secondary: CultivationPath | null;
};

function getHybridBonuses(combo: PathCombination): HybridBonus[] {
  // Certain combos have special synergy names and bonuses
}

const HYBRID_NAMES: Record<string, Record<string, string>> = {
  body: {
    beast: 'Primal Juggernaut',    // Body + Beast = ultimate physical warrior
    qi: 'Battle Sage',             // Body + Qi = balanced warrior-mage
    spirit: 'Ancestral Guardian',  // Body + Spirit = protect the living and dead
    tech: 'Forged Flesh',          // Body + Tech = cyborg cultivator (body mods)
    faith: 'Living Idol',          // Body + Faith = worshipped physical god
  },
  qi: {
    spirit: 'Soul-Qi Unity',       // Qi + Spirit = soul and energy as one
    tech: 'Arcane Engineer',       // Qi + Tech = power artifacts with qi
    faith: 'Divine Mandate',       // Qi + Faith = qi empowered by prayer
  },
  spirit: {
    tech: 'Necrotechnician',       // Spirit + Tech = spirit-powered machines
    faith: 'Death Priest',         // Spirit + Faith = god of the dead
  },
  tech: {
    faith: 'Miracle Engine',       // Tech + Faith = faith-powered artifacts
  },
};
```

### Path Respec (Extremely Rare)

Changing paths requires a **Dao Rebirth** — a legendary encounter that resets cultivation to Foundation Establishment but retains stats and knowledge. Only available at Forbidden Valley (rare encounter).

---

## Path-Specific Locations

| Path | Optimal Locations | Dangerous Locations |
|------|------------------|-------------------|
| Body | Gravity Cave, Volcanic Caldera, Thunder Peak | None (body cultivators thrive in danger) |
| Qi | Mountain peaks (sun), lakes (moon), caves (earth) | Nether Rift (qi is corrupted) |
| Spirit | Graveyards, ancient battlefields, ghost cities | Consecrated ground, Heavenly Peak |
| Tech | Libraries, ruins, crafting workshops, sect forges | Wilderness (no materials) |
| Faith | Temples, shrines, cities (many mortals) | Forbidden zones (no followers) |
| Beast | Beast lairs, primordial forests, ancient corpses | Cities, sect grounds (hostile NPCs) |

---

## API

```typescript
// ─── Path Management ────────────────────────

function choosePath(state: GameState, pathId: CultivationPath): ActionResult<GameState>;
function getPath(state: GameState): CultivationPath | null;
function getPathStage(state: GameState): number;
function attemptPathBreakthrough(state: GameState, rng: PRNG): ActionResult<GameState>;

// ─── Path-Specific Mechanics ─────────────────

// Body
function trainBody(state: GameState, method: BodyTrainingMethod): GameState;
function getBodyTemperingProgress(state: GameState): number;

// Qi
function gatherCelestialQi(state: GameState, source: CelestialQiType): GameState;
function checkQiDeviation(state: GameState): QiDeviation | null;

// Spirit
function gatherSpiritEnergy(state: GameState): GameState;
function bindSpirit(state: GameState, spiritId: string): ActionResult<GameState>;
function enterSpiritRealm(state: GameState): ActionResult<GameState>;

// Tech
function startProject(state: GameState, schematicId: string): ActionResult<GameState>;
function completeProject(state: GameState, projectId: string): ActionResult<GameState>;
function discoverInsight(state: GameState, rng: PRNG): ActionResult<GameState>;

// Faith
function buildShrine(state: GameState, locationId: string): ActionResult<GameState>;
function performMiracle(state: GameState, miracleId: string): ActionResult<GameState>;
function calculateKarma(player: PlayerState): number;

// Beast
function consumeBeast(state: GameState, beastId: string): ActionResult<GameState>;
function transform(state: GameState, level: number): ActionResult<GameState>;
function controlRampage(state: GameState): ActionResult<GameState>;

// ─── Hybridization ────────────────────────────

function canHybridize(state: GameState): boolean;
function adoptSecondaryPath(state: GameState, pathId: CultivationPath): ActionResult<GameState>;
function getHybridBonuses(state: GameState): HybridBonus[];
```

---

## Testing Strategy

- Path selection at Foundation Establishment is permanent
- Each path's unique resource (spirit energy, faith, bestial rage) ticks correctly
- Qi deviation triggers on imbalance
- Spirit sight reveals hidden encounters
- Tech projects complete in correct number of ticks
- Faith scales with follower count
- Beast transformation applies correct stat bonuses at each level
- Berserk rampage triggers at correct thresholds
- Hybrid bonuses apply at Spirit Severing

---

*See also: [Cultivation System](./cultivation.md), [Element System](./elements.md), [Martial Arts System](./martial-arts.md), [Spell System](./spells.md), [World Building](../world-building.md)*
