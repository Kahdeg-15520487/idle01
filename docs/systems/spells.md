# Spell System — Talismans, Formations & Divine Arts

> **Modules**: `src/systems/SpellSystem.ts`, `src/systems/TalismanCrafting.ts`, `src/systems/FormationSystem.ts`
>
> **Type**: Pure functions for spell logic; item-based for talismans; state-modifying for formations
>
> **Signature**: `(state, params?) => GameState | ActionResult<GameState>`

---

## Overview

Beyond martial techniques, cultivators wield **Daoist magic** — the esoteric arts of talisman-crafting, formation-deploying, and divine ability-wielding. Spells are distinct from martial arts: they consume resources (talismans are items, formations require setup time), are often area-affecting, and scale with comprehension rather than attack.

---

## The Three Branches of Daoist Magic

```
┌────────────────────────────────────────────────────────────┐
│                     DAOIST MAGIC                           │
│                                                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    TALISMANS     │  │  FORMATIONS  │  │   DIVINE      │  │
│  │    (Items)       │  │  (Area)      │  │   ABILITIES   │  │
│  │                  │  │              │  │   (Innate)    │  │
│  │  • Craft from    │  │  • Deploy on │  │  • Realm-gated│  │
│  │    materials     │  │    location  │  │  • No cost    │  │
│  │  • Single-use    │  │  • Duration  │  │  • Unique per │  │
│  │  • Inventory     │  │  • Combat &  │  │    cultivator │  │
│  │    based         │  │    world use │  │  • Bloodline &│  │
│  │  • Quick to use  │  │  • Slow setup│  │    origin tied│  │
│  └─────────────────┘  └──────────────┘  └──────────────┘  │
│                                                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  FORBIDDEN ARTS  │  │  DIVINATION  │  │  SUMMONING    │  │
│  │  (Dark magic)    │  │  (Info)      │  │  (Allies)     │  │
│  │                  │  │              │  │               │  │
│  │  • Powerful but  │  │  • Reveal    │  │  • Call       │  │
│  │    corrupting    │  │    hidden    │  │    spirit     │  │
│  │  • Karma cost    │  │    locations │  │    beasts     │  │
│  │  • Sect locked   │  │  • Foresee   │  │  • Temporary  │  │
│  │  • Permanent     │  │    encounters│  │    combat     │  │
│  │    consequences  │  │  • Item ID   │  │    allies     │  │
│  └─────────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 1. Talismans (符箓)

Talismans are **single-use spell items** inscribed on paper, jade, or beast hide. They're crafted from materials, stored in inventory, and activated instantly in combat or the overworld.

### Talisman Structure

```typescript
interface Talisman extends Item {
  readonly type: 'talisman';
  readonly talismanType: TalismanType;
  readonly element: Element | null;
  readonly power: number;               // 1–100, determines effect strength
  readonly charges: number;             // Usually 1, some rare ones have 2–3
  readonly effect: TalismanEffect;
  readonly craftingRecipe: CraftingRecipe;  // How it was made (for deconstruction)
  readonly crafterName?: string;        // "Made by Li Wei" — pride!
}

type TalismanType =
  | 'attack'        // Elemental attack spell
  | 'defense'       // Shield, barrier
  | 'healing'       // Restore health/qi
  | 'utility'       // Light, unlocking, message-sending
  | 'binding'       // Trap enemy, reduce speed
  | 'warding'       // Area protection against beasts
  | 'explosive'     // High damage, destroys itself
  | 'transportation'; // Teleport short distance, return to city
```

### Talisman Catalog

| Talisman | Type | Element | Power Scaling | Effect |
|----------|------|---------|---------------|--------|
| **Flame Burst Talisman** | attack | Fire | power × 5 damage | Single target fire damage |
| **Water Barrier Talisman** | defense | Water | power × 3 shield | Absorbs (power × 10) damage for 5 turns |
| **Minor Healing Talisman** | healing | Wood | power × 2 healing | Restore (power × 5) HP |
| **Binding Vine Talisman** | binding | Wood | power turns | Enemy cannot act for (power/20) turns |
| **Thunder Strike Talisman** | attack | Thunder | power × 8 damage | High damage, 30% paralyze chance |
| **Warding Talisman** | warding | Earth | power × 60 ticks | No beast encounters at current location for duration |
| **Message Talisman** | utility | Wind | — | Send message to any NPC you've met (triggers quests, calls allies) |
| **Return Talisman** | transportation | Void | — | Teleport to last safe location (city/village) |
| **Explosive Talisman** | explosive | Fire | power × 12 damage | AoE damage, destroys the talisman slot permanently |
| **Soul-Sealing Talisman** | binding | Dark | power × 3 turns | Seal enemy's techniques for duration |

### Talisman Crafting

Crafting requires: materials, a crafting location (alchemist's shop or personal crafting), comprehension, and time:

```typescript
interface CraftingRecipe {
  readonly id: string;
  readonly outputItemId: string;
  readonly materials: MaterialRequirement[];
  readonly comprehensionRequired: number;
  readonly ticksToCraft: number;         // idle crafting time
  readonly successRate: number;          // 0–1 base
  readonly locationRequired?: string;    // Must be at alchemist, own sect, etc.
  readonly minRealm?: number;
}

interface MaterialRequirement {
  itemType: string;                      // 'beast_core', 'herb', 'material', 'spirit_stone'
  quantity: number;
  element?: Element;                     // For beast cores, specific element needed
  tier?: number;                         // Minimum tier
}

function craftTalisman(
  state: GameState,
  recipeId: string
): ActionResult<GameState> {
  const recipe = RECIPES[recipeId];
  if (!recipe) return { success: false, message: 'Unknown recipe.' };

  // Check materials
  for (const req of recipe.materials) {
    const hasMaterials = countMaterials(state.player.inventory, req);
    if (!hasMaterials) return { success: false, message: `Need ${req.quantity}× ${req.itemType}.` };
  }

  // Check comprehension
  if (state.player.comprehension < recipe.comprehensionRequired) {
    return { success: false, message: `Need ${recipe.comprehensionRequired} comprehension.` };
  }

  // Check location
  if (recipe.locationRequired && state.world.currentNodeId !== recipe.locationRequired) {
    return { success: false, message: `Must be at ${recipe.locationRequired} to craft this.` };
  }

  // Consume materials
  state = consumeMaterials(state, recipe.materials);

  // Set player to crafting (idle activity)
  return produce(state, draft => {
    draft.player.action = 'crafting';
    draft.player.actionData = {
      type: 'crafting',
      recipeId,
      startedAt: draft.tick,
      totalTicks: recipe.ticksToCraft,
      progress: 0,
    };
  });
}
```

### Crafting Success

On completion, the success rate is modified by comprehension:

```typescript
function completeCrafting(state: GameState, rng: PRNG): GameState {
  const craft = state.player.actionData as CraftingData;
  const recipe = RECIPES[craft.recipeId]!;

  const comprehensionBonus = (state.player.comprehension - recipe.comprehensionRequired) * 0.01;
  const finalChance = Math.min(0.95, recipe.successRate + comprehensionBonus);

  if (rng.next() < finalChance) {
    // Success!
    const talisman = generateTalisman(recipe.outputItemId, state.player, rng);
    return produce(state, draft => {
      draft.player.inventory.push(talisman);
      draft.player.action = 'idle';
      draft.player.actionData = null;
      draft.player.stats.itemsFound += 1;
      draft.log.push({ type: 'crafting_success', data: { item: talisman.name } });

      // Crafting XP
      draft.player.skills.talismanCrafting = (draft.player.skills.talismanCrafting ?? 0) + 1;
    });
  } else {
    // Failure — materials lost, gain experience anyway
    return produce(state, draft => {
      draft.player.action = 'idle';
      draft.player.actionData = null;
      draft.log.push({ type: 'crafting_failure', data: { recipe: recipe.outputItemId } });
      draft.player.skills.talismanCrafting = (draft.player.skills.talismanCrafting ?? 0) + 0.5;
    });
  }
}
```

---

## 2. Formations (阵法)

Formations are **deployable area effects** that take time to set up but provide lasting benefits or hazards. They affect the entire location or combat arena.

### Formation Types

```typescript
interface Formation {
  readonly id: string;
  readonly name: string;
  readonly type: FormationType;
  readonly element: Element | null;
  readonly deploymentTicks: number;       // How long to set up
  readonly duration: number;              // 0 = permanent until dismantled
  readonly power: number;                 // Scales with comprehension
  readonly effects: FormationEffect[];
  readonly requirement: FormationRequirement;
}

type FormationType =
  | 'killing'       // Damages enemies entering the area
  | 'trapping'      // Prevents enemies from leaving
  | 'defensive'     // Protects allies in the area
  | 'gathering'     // Concentrates qi, boosts cultivation
  | 'concealing'    // Hides the area from detection
  | 'transporting'  // Teleportation circle
  | 'illusion';     // Creates false images, confuses enemies
```

### Formation Catalog

| Formation | Type | Deployment | Duration | Effect |
|-----------|------|-----------|----------|--------|
| **Eight Trigrams Killing Array** | killing | 300 ticks | 3600 ticks | Deals power×2 damage/turn to all enemies in location |
| **Mist Concealment Formation** | concealing | 120 ticks | Permanent | No random encounters at this location |
| **Spirit Gathering Array** | gathering | 600 ticks | Permanent | +50% cultivation speed at this location |
| **Myriad Swords Protection** | defensive | 180 ticks | Combat only | +30% defense, reflects 10% damage |
| **Trapping Net Formation** | trapping | 240 ticks | 1800 ticks | Enemies in area cannot flee |
| **Void Transfer Circle** | transporting | 900 ticks | Single use | Teleport party to any visited location |
| **Phantom Maze Array** | illusion | 300 ticks | 3600 ticks | 50% chance encounters auto-fail (enemies get lost) |

### Deploying Formations

```typescript
function deployFormation(state: GameState, formationId: string): ActionResult<GameState> {
  const formation = FORMATIONS[formationId];
  if (!formation) return { success: false, message: 'Unknown formation.' };

  // Check requirements
  if (!meetsFormationRequirements(state.player, formation.requirement)) {
    return { success: false, message: 'Cannot deploy this formation yet.' };
  }

  // Cannot deploy another formation on same location (unless replacing)
  if (state.world.activeFormation) {
    return { success: false, message: 'A formation is already active here. Dismantle it first.' };
  }

  // Check materials / formation flags
  if (!hasFormationFlags(state.player, formationId)) {
    return { success: false, message: 'Need formation flags to deploy. Craft them.' };
  }

  // Start deployment
  return produce(state, draft => {
    draft.player.action = 'deploying_formation';
    draft.player.actionData = {
      type: 'deploying_formation',
      formationId,
      startedAt: draft.tick,
      totalTicks: formation.deploymentTicks,
      progress: 0,
    };
  });
}

// Deployment can be interrupted by combat. If interrupted, progress lost.
```

### Formation Flags (Materials)

Formations require **formation flags** — crafted items placed at key points. Each flag costs materials:

| Formation Tier | Flag Cost |
|---------------|-----------|
| Basic | 5 spirit stones + 1 beast core |
| Intermediate | 20 spirit stones + 3 beast cores + 1 rare herb |
| Advanced | 100 spirit stones + 5 rare beast cores + formation blueprint (rare drop) |

---

## 3. Divine Abilities (神通)

Divine abilities are **innate supernatural powers** unlocked at cultivation milestones. They don't cost qi (usually), don't take technique slots, and represent the cultivator's unique connection to the Dao.

### Divine Ability Slots

| Realm | Abilities Unlocked |
|-------|-------------------|
| Mortal | 0 |
| Qi Condensation | 1 |
| Foundation Establishment | 2 |
| Core Formation | 3 |
| Nascent Soul | 4 |
| Spirit Severing | 5 |
| Dao Seeking | 6 |

### Divine Ability Catalog

```typescript
interface DivineAbility {
  readonly id: string;
  readonly name: string;
  readonly realmRequired: number;
  readonly description: string;
  readonly type: DivineAbilityType;
  readonly cooldownTicks: number;         // 0 = passive (always active)
  readonly effect: DivineEffect;
  readonly originExclusive?: string;      // Only for certain origins
  readonly raceExclusive?: string;        // Only for certain races
  readonly sectExclusive?: string;        // Only for certain sects
}

type DivineAbilityType =
  | 'passive'      // Always active
  | 'activated'    // Manual trigger, cooldown
  | 'reactive'     // Triggers automatically on condition
  | 'ultimate';    // Once per day, extremely powerful
```

### Ability Catalog

#### Universal (Any Origin)

| Ability | Realm | Type | Effect |
|---------|-------|------|--------|
| **Spirit Sense** | Qi Cond. | Passive | Reveal enemy stats before combat |
| **Qi Shield** | Foundation | Reactive | Auto-activates when HP < 20%, absorbs 100 damage |
| **Heaven's Eye** | Core Form. | Activated | See all hidden locations in current province (cooldown: 1 hour) |
| **Soul Projection** | Nascent Soul | Activated | Scout a distant location without traveling (cooldown: 4 hours) |
| **Dao Manifestation** | Spirit Sev. | Ultimate | For 60 ticks, all stats +100% (once per 24 hours) |
| **Immortal's Grasp** | Dao Seeking | Activated | Instantly kill any beast 2+ tiers below you (cooldown: 30 min) |

#### Origin-Exclusive

| Origin | Ability | Effect |
|--------|---------|--------|
| Village Orphan | **Hidden Dragon Rising** | When HP hits 0, revive with 30% HP (once per day). The jade pendant glows... |
| Disgraced Disciple | **Vindication Strike** | +50% damage against Cloud Sect enemies. You'll prove them wrong. |
| Merchant's Heir | **Silver Tongue** (passive) | All merchant prices permanently 20% lower |
| Foreign Wanderer | **Northern Frost Armor** | Reactive: when hit, freeze attacker for 1 turn |
| Immortal Bloodline | **Ancestor's Wrath** | Ultimate: deal (realm × 200) damage to all enemies. Heaven's gaze intensifies |
| Beast Bonded | **Pack Howl** | Call 2 spirit wolves to fight alongside you for 60 ticks |

#### Race-Exclusive

| Race | Ability |
|------|---------|
| Dragon-Blood | **Dragon's Roar**: All enemies -30% attack for 5 turns |
| Spirit Fox | **Foxfire Escape**: Guaranteed flee + teleport to adjacent location |
| Shadow Phantom | **Umbral Step**: Become untargetable for 3 turns |
| Iron Body | **Unyielding**: Immune to all status effects for 10 turns |
| Jade Spirit | **Earth Communion**: Instantly know all resources in current location |

---

## 4. Forbidden Arts (禁术)

Forbidden arts are **powerful but corrupting** spells. They're locked behind sect membership (Shadow Heaven, Blood Lotus), specific encounters, or ancient inheritances. Every use has a cost.

```typescript
interface ForbiddenArt {
  readonly id: string;
  readonly name: string;
  readonly effect: string;
  readonly cost: ForbiddenArtCost;
  readonly acquisitionMethod: string;     // How to learn it
  readonly karmaPenalty: number;          // Per use
  readonly corruptionRate: number;        // Adds to corruption meter
}
```

| Forbidden Art | Effect | Cost | Corruption |
|--------------|--------|------|------------|
| **Soul Devour** | Instantly kill wounded enemy, regain 50% HP | Permanently lose 5 max HP | +10 |
| **Blood Sacrifice** | Double all stats for 120 ticks | Lose 50% current HP | +5 |
| **Necromantic Puppetry** | Raise defeated enemy as ally for 300 ticks | The puppet may turn on you | +15 |
| **Heaven-Defying Fate Change** | Guarantee next breakthrough success | Random elemental tribulation immediately | +20 |
| **Qi Siphon** | Steal 20% of enemy's qi | Enemy's sect permanently hostile | +8 |

### Corruption Meter (0–100)

| Corruption | Effect |
|-----------|--------|
| 0–20 | No visible effect |
| 21–40 | Righteous sects suspicious (-10 standing); heavenly tribulations +10% chance |
| 41–60 | Righteous sects hostile; merchants overcharge 20%; NPCs fear you |
| 61–80 | Heavenly Court sends inspectors; cannot enter righteous territory safely |
| 81–100 | **Marked for Elimination** — immortal hunters pursue you; ascension permanently blocked |

Corruption decays **very slowly** (1 point per 10,000 ticks of NOT using forbidden arts).

---

## 5. Divination

Divination reveals hidden information — a utility branch of spells:

| Divination Art | Cost | Reveals |
|---------------|------|---------|
| **Basic Scrying** | 50 spirit stones | Item type of next encounter reward |
| **Location Divination** | 100 stones | Hidden locations in current province |
| **Fate Reading** | 200 stones | Next tribulation timing and element |
| **Enemy Analysis** | Free at Core Formation | Full stats of current combat enemy |
| **Treasure Sense** | Passive with Heaven's Eye | Rare treasures glow on the world map |

---

## 6. Summoning

Summoning calls spirit beasts or elemental spirits as temporary combat allies:

```typescript
interface Summon {
  readonly id: string;
  readonly name: string;
  readonly duration: number;           // Ticks
  readonly stats: Beast;               // Uses beast data structure
  readonly specialAbility: string;
  readonly summoningRequirement: SummonRequirement;
}

interface SummonRequirement {
  readonly talismanNeeded?: string;    // Consumes a talisman
  readonly qiCost?: number;
  readonly realmRequired: number;
  readonly elementMatch?: Element;     // Must have affinity with this element
}
```

| Summon | Requirement | Duration | Stats Scaling |
|--------|-------------|----------|---------------|
| **Flame Sparrow** | Fire affinity 30+ | 60 ticks | Scales with fire affinity |
| **Water Serpent** | Water affinity 40+ | 90 ticks | Scales with water affinity |
| **Thunder Eagle** | Thunder affinity 50+ | 45 ticks | High damage, low duration |
| **Earth Tortoise** | Earth affinity 30+ | 120 ticks | Tank, draws enemy attacks |
| **Shadow Wraith** | Dark affinity 60+ | 60 ticks | Untargetable, deals %HP damage |
| **Celestial Guardian** | Light affinity 80+ | 300 ticks | Endgame summon; requires Heavenly Decree |

---

## Spell Slots & Equipping

Unlike martial techniques (4 slots), spells use different resources:

| Spell Type | How It's "Equipped" |
|-----------|-------------------|
| Talismans | In inventory; used like consumable items |
| Formations | Deployed on location; one per location |
| Divine Abilities | Innate; auto-unlocked at realm milestones |
| Forbidden Arts | Known permanently once learned; used from ability menu |
| Divination | Activated from world map or combat |
| Summoning | Requires equipped summoning talisman + elemental affinity |

This means spells don't compete with technique slots — they're a parallel system.

---

## API

```typescript
// ─── Talismans ──────────────────────────────

function useTalisman(state: GameState, talismanId: string, target?: string): ActionResult<GameState>;
function craftTalisman(state: GameState, recipeId: string): ActionResult<GameState>;
function getAvailableRecipes(player: PlayerState): CraftingRecipe[];
function getCraftingSuccessChance(player: PlayerState, recipe: CraftingRecipe): number;
function completeCrafting(state: GameState, rng: PRNG): GameState;

// ─── Formations ─────────────────────────────

function deployFormation(state: GameState, formationId: string): ActionResult<GameState>;
function dismantleFormation(state: GameState): ActionResult<GameState>;
function getActiveFormationEffects(state: GameState): FormationEffect[];
function isFormationDeploymentInterrupted(state: GameState): boolean;

// ─── Divine Abilities ───────────────────────

function getUnlockedAbilities(player: PlayerState): DivineAbility[];
function getAvailableAbilities(player: PlayerState): DivineAbility[];
function useDivineAbility(state: GameState, abilityId: string): ActionResult<GameState>;
function checkReactiveAbilities(state: GameState): GameState; // Called on damage taken, etc.

// ─── Forbidden Arts ─────────────────────────

function learnForbiddenArt(state: GameState, artId: string): ActionResult<GameState>;
function useForbiddenArt(state: GameState, artId: string, target?: string): ActionResult<GameState>;
function getCorruptionLevel(player: PlayerState): number;
function decayCorruption(state: GameState): GameState; // Slow passive decay

// ─── Divination ─────────────────────────────

function performDivination(state: GameState, divinationId: string): ActionResult<GameState>;
function getDivinationCost(divinationId: string): number;

// ─── Summoning ──────────────────────────────

function summonEntity(state: GameState, summonId: string): ActionResult<GameState>;
function dismissSummon(state: GameState): GameState;
function tickSummons(state: GameState): GameState; // Decrement duration, resolve actions
```

---

## Testing Strategy

- Talisman use consumes item, applies correct effect
- Crafting consumes materials, respects comprehension requirement
- Formation deployment blocks second formation on same location
- Divine abilities respect cooldowns
- Forbidden arts add corruption and trigger karma penalties
- Summoned entities have correct duration and scale with affinity
- Corruption decays at correct rate

---

*See also: [Element System](./elements.md), [Martial Arts System](./martial-arts.md), [Inventory System](./inventory.md), [Combat System](./combat.md)*
