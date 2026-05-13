# Martial Arts System

> **Modules**: `src/systems/MartialArtsSystem.ts`, `src/data/styles.ts`, `src/data/stances.ts`
>
> **Type**: Pure functions — style selection, stance effects, technique mastery, combo logic
>
> **Signature**: `(state, params?) => GameState | computed value`

---

## Overview

Martial arts in the cultivation world are more than techniques — they are **complete systems of combat philosophy**. A martial artist's power comes from: the **style** they follow, the **stance** they adopt, their **internal and external arts**, the **techniques** they've mastered, **weapon arts** they've honed, and the **combos** they chain.

---

## The Five Pillars of Martial Arts

```
┌─────────────────────────────────────────────────────────────┐
│                      MARTIAL ARTS                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  STYLE   │  │ STANCE   │  │INTERNAL  │  │  EXTERNAL  │ │
│  │ (School) │  │(Posture) │  │  ARTS    │  │   ARTS     │ │
│  │          │  │          │  │(Qi flow) │  │(Body temp) │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │             │             │              │          │
│       └─────────────┴─────────────┴──────────────┘          │
│                          │                                   │
│                          ▼                                   │
│                   ┌──────────────┐                           │
│                   │  TECHNIQUES  │                           │
│                   │ (Active use) │                           │
│                   └──────┬───────┘                           │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐          │
│  │  WEAPON    │  │  MOVEMENT  │  │   COMBOS     │          │
│  │   ARTS     │  │   ARTS     │  │ (Sequences)  │          │
│  └────────────┘  └────────────┘  └──────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Styles (Schools)

A style is a complete martial philosophy. Choosing a style is like choosing a class — it defines your combat identity.

### Core Styles

```typescript
interface MartialStyle {
  readonly id: string;
  readonly name: string;
  readonly philosophy: string;
  readonly primaryStat: keyof PlayerStats;    // Which stat this style emphasizes
  readonly elementAffinity: Element | null;   // Preferred element
  readonly weaponPreferences: WeaponType[];   // Favored weapons
  readonly passiveBonuses: StyleBonus[];
  readonly masteryBonuses: StyleMasteryLevel[];
  readonly forbidden: boolean;                // Is this a forbidden/demonic style?
  readonly originRestrictions?: string[];     // Only available to certain origins
}

interface StyleBonus {
  readonly stat: string;
  readonly value: number;
  readonly condition?: string;               // "when using favored weapon", "below 50% HP"
}

interface StyleMasteryLevel {
  readonly level: number;                     // 1–10
  readonly masteryRequired: number;           // Total mastery points needed
  readonly unlocks: (StyleUnlock | Technique)[];
}
```

### Style Catalog

#### Orthodox Styles

| Style | Philosophy | Primary Stat | Element | Favored Weapons |
|-------|-----------|-------------|---------|-----------------|
| **Azure Cloud Sword** | Swift, precise, overwhelming offense | Speed | Wind | Sword, Saber |
| **Iron Mountain Body** | Impenetrable defense, counter-attacks | Defense | Earth | Staff, Halberd, Fists |
| **Verdant Serpent Coils** | Control, entanglement, wearing down | Health | Wood | Whip, Dagger |
| **Thunder God's Fist** | Explosive power, stunning strikes | Attack | Thunder | Fists, no weapon |
| **Flowing Water Mirror** | Adaptability, redirection, defense | Comprehension | Water | Fan, Sword |
| **Crimson Phoenix Wing** | Aggressive, sacrificial, healing | Attack | Fire | Sword, Spear |

#### Unorthodox / Demonic Styles

| Style | Philosophy | Restrictions |
|-------|-----------|-------------|
| **Shadow Reaping Blade** | Stealth, assassination, first-strike | Demonic-aligned only; righteous sects hostile |
| **Blood Demon Body** | Sacrifice health for power, lifesteal | Blood Lotus Sect or rogue only |
| **Soul-Severing Palm** | Attacks the enemy's cultivation base | Shadow Heaven exclusive; -20 karma per use |
| **Void Oblivion Arts** | Embrace nothingness, negate all elements | Dao Seeking realm; extremely rare |

### Style Switching

Players can learn multiple styles but only **one is active** at a time. Switching costs:
- **10 ticks** of "meditation" (no cultivation progress)
- Cannot switch during combat
- After switching, new style bonuses ramp up over 60 ticks (0% → 100%)

At **Core Formation realm**, unlocks **Dual Style** — two styles active simultaneously (bonuses averaged).

At **Dao Seeking realm**, unlocks **Style Synthesis** — create a personal style by combining two mastered styles.

### Style Mastery

Using techniques from your active style builds mastery:

```typescript
function gainStyleMastery(state: GameState, amount: number): GameState {
  return produce(state, draft => {
    const activeStyle = draft.player.activeStyle;
    if (!activeStyle) return;

    activeStyle.mastery += amount;

    // Check for level-up
    const nextLevel = activeStyle.masteryLevels
      .find(ml => ml.masteryRequired > activeStyle.mastery);

    if (nextLevel && activeStyle.currentLevel < nextLevel.level) {
      activeStyle.currentLevel = nextLevel.level;
      // Unlock new techniques, bonuses
      applyStyleLevelUp(draft.player, nextLevel);
    }
  });
}
```

---

## 2. Stances (Combat Posture)

Stances are **moment-to-moment tactical choices** that modify combat behavior. Unlike styles (long-term), stances can change every few turns.

### Stance Types

```typescript
interface Stance {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly bonuses: Record<string, number>;
  readonly penalties: Record<string, number>;
  readonly minTurnDuration: number;     // Must stay in stance for N turns before switching
  readonly specialEffect?: StanceEffect;
}

interface StanceEffect {
  readonly trigger: 'on_enter' | 'on_exit' | 'per_turn' | 'on_hit' | 'on_hit_taken';
  readonly description: string;
  readonly effect: DialogueEffect;
}
```

### Core Stances

| Stance | Bonuses | Penalties | Special Effect |
|--------|---------|-----------|----------------|
| **Offensive** 攻 | +30% attack, +20% crit | -20% defense, -10% dodge | On hit: 10% chance to break enemy stance |
| **Defensive** 守 | +40% defense, +20% dodge | -30% attack | On hit taken: reflect 15% damage |
| **Balanced** 衡 | +10% all stats | None | No special — consistent |
| **Qi Gathering** 聚 | +50% qi recovery, +20% technique damage | -40% speed, cannot basic attack | Per turn: heal 5% max qi |
| **Flowing** 流 | +30% dodge, +20% speed | -15% attack, -15% defense | On dodge: counter-attack for 50% damage |
| **Rooted** 根 | +50% defense, immune to knockback | Cannot move (no flee, no movement arts) | Per turn: heal 2% max health |
| **Berserk** 狂 | +60% attack, +30% speed | -50% defense, lose 3% HP per turn | On kill: heal 20% max health |
| **Meditative** 冥 | Qi costs -30%, +50% comprehension to technique mastery gain | Cannot basic attack | Per turn: 5% chance to enlighten technique |

### Stance Switching

```typescript
function switchStance(state: GameState, newStanceId: string): ActionResult<GameState> {
  if (state.player.inCombat && state.player.combatState!.turn < state.player.activeStance.minTurnDuration) {
    return { success: false, message: `Must remain in current stance for ${state.player.activeStance.minTurnDuration} turns.` };
  }

  const stance = STANCES[newStanceId];
  if (!stance) return { success: false, message: 'Unknown stance.' };

  return produce(state, draft => {
    // Exit effects of old stance
    if (draft.player.activeStance?.specialEffect?.trigger === 'on_exit') {
      applyEffect(draft, draft.player.activeStance.specialEffect.effect);
    }

    draft.player.activeStance = stance;

    // Enter effects of new stance
    if (stance.specialEffect?.trigger === 'on_enter') {
      applyEffect(draft, stance.specialEffect.effect);
    }
  });
}
```

---

## 3. Internal Arts (Qi Cultivation Methods)

Internal arts are **passive qi circulation methods** that permanently enhance the cultivator. Unlike techniques (active combat skills), internal arts run continuously.

### Internal Art Types

```typescript
interface InternalArt {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: InternalArtType;
  readonly rarity: Rarity;
  readonly realmRequirement: number;
  readonly masteryLevel: number;         // 1–100
  readonly maxMastery: number;
  readonly passiveEffects: PassiveEffect[];
  readonly masteryMilestones: MasteryMilestone[];
}

type InternalArtType =
  | 'qi_circulation'       // Increases cultivation speed, qi capacity
  | 'meridian_opening'     // Opens meridians, increases technique slots
  | 'dantian_expansion'    // Increases qi capacity dramatically
  | 'soul_nurturing'       // Increases comprehension, resists soul attacks
  | 'life_extension'       // Increases max health, health regen
  | 'sensory'              // Increases luck, reveals hidden encounters
  | 'spirit_bonding';      // Strengthens beast companions
```

### Example Internal Arts

| Art | Type | Rarity | Effects at Mastery 50 |
|-----|------|--------|----------------------|
| **Azure Cloud Circulation** | qi_circulation | Common | +25% cultivation speed |
| **Nine Heavens Meridian Map** | meridian_opening | Epic | +1 technique slot, +10% qi recovery |
| **Primordial Dantian Method** | dantian_expansion | Legendary | +100% qi capacity |
| **Soul-Nurturing Scripture** | soul_nurturing | Rare | +15 comprehension, soul attack immunity |
| **Tortoise Longevity Art** | life_extension | Uncommon | +50% max health, +2 HP/tick regen |
| **Heaven's Eye Method** | sensory | Rare | +15 luck, hidden encounters always revealed |
| **Beast Soul Integration** | spirit_bonding | Epic | Companion gains +30% all stats |

### Internal Art Slots

A cultivator has limited "meridian capacity" for internal arts:

| Realm | Internal Art Slots |
|-------|-------------------|
| Mortal | 0 |
| Qi Condensation | 1 |
| Foundation Establishment | 2 |
| Core Formation | 3 |
| Nascent Soul | 4 |
| Spirit Severing | 5 |
| Dao Seeking | 6 |

Internal arts can be swapped, but the new art starts at mastery 0.

---

## 4. External Arts (Body Tempering)

External arts strengthen the physical body through brutal training. They provide permanent stat bonuses but often have drawbacks.

### Body Tempering Stages

```typescript
interface BodyTemperingStage {
  readonly id: string;
  readonly name: string;
  readonly realmRequired: number;
  readonly statBonuses: Record<string, number>;
  readonly specialUnlock: string;
  readonly drawback?: string;
  readonly trainingMethod: string;      // Flavor: "Stand under waterfall for 1000 ticks"
}
```

### Body Tempering Path

| Stage | Realm | Bonuses | Unlocks | Drawback |
|-------|-------|---------|---------|----------|
| **Iron Skin** | Foundation | Def +20 | Immune to bleeding | -5 speed |
| **Steel Bones** | Foundation L5 | HP +100, Def +30 | Unarmed attacks deal weapon damage | -10 dodge |
| **Jade Body** | Core Formation | All stats +15 | Elemental resistance +20% | Slower cultivation (-10%) |
| **Diamond Meridians** | Core Formation L5 | Qi capacity +50% | Can overchannel (spend HP for Qi) | Takes damage when overchanneling |
| **Golden Core Physique** | Nascent Soul | Atk +40, Def +40 | Auto-regen 5% HP/tick | Qi deviation risk doubled |
| **Immortal Flesh** | Spirit Severing | HP +500 | Survive one fatal blow per day | — |
| **Indestructible Body** | Dao Seeking | All stats +50 | 10% chance to ignore any damage | Cultivation speed -30% |

---

## 5. Movement Arts

Separate from combat techniques, movement arts are for travel speed, evasion, and positioning.

| Art | Effect |
|-----|--------|
| **Cloud-Stepping** | Travel speed +30%, can cross mountains |
| **Shadow Step** | +50% flee chance, can enter hostile territory undetected |
| **Water-Walking** | Cross water locations, +20% speed in water qi areas |
| **Thunder Flash** | Combat: first strike always, travel: instant short hops |
| **Void-Blink** | Can teleport between visited locations (cooldown: 1 hour) |

Movement arts are **equipped** in their own slot (separate from combat techniques).

---

## 6. Technique Mastery & Enlightenment

### Technique Mastery (0–100)

Every technique gains mastery through use:

```typescript
function gainTechniqueMastery(
  state: GameState,
  techniqueId: string,
  amount: number
): GameState {
  return produce(state, draft => {
    const tech = draft.player.equippedTechniques.find(t => t.id === techniqueId);
    if (!tech) return;

    tech.mastery = Math.min(tech.maxMastery, tech.mastery + amount);

    // Mastery bonuses (linear interpolation)
    // At mastery 50: damage ×1.25, qi cost ×0.85, cooldown −1
    // At mastery 100: damage ×1.5, qi cost ×0.7, cooldown −2
  });
}
```

### Enlightenment (Random Breakthrough)

At any moment, a technique can undergo **enlightenment** — a spontaneous upgrade:

```typescript
function checkEnlightenment(state: GameState, rng: PRNG): GameState {
  const baseChance = 0.001; // 0.1% per tick
  const comprehensionBonus = state.player.comprehension * 0.0001;
  const masteryBonus = 0; // Mastered techniques don't enlighten further
  const stanceBonus = state.player.activeStance?.id === 'meditative' ? 0.005 : 0;

  const totalChance = baseChance + comprehensionBonus + stanceBonus;

  if (rng.next() < totalChance) {
    return triggerEnlightenment(state, rng);
  }
  return state;
}

function triggerEnlightenment(state: GameState, rng: PRNG): GameState {
  // Pick a random equippped technique below max mastery
  const candidates = state.player.equippedTechniques.filter(t => t.mastery < t.maxMastery);
  if (candidates.length === 0) return state;

  const technique = rng.nextFrom(candidates);

  return produce(state, draft => {
    // Enlightenment can:
    const event = rng.nextFrom(['mastery_boost', 'damage_up', 'cost_down', 'evolve']);

    switch (event) {
      case 'mastery_boost':
        technique.mastery += 20;
        draft.log.push({ type: 'enlightenment', data: { tech: technique.name, effect: 'Mastery surged by 20!' } });
        break;
      case 'damage_up':
        technique.damageMultiplier *= 1.1;
        draft.log.push({ type: 'enlightenment', data: { tech: technique.name, effect: 'Damage improved!' } });
        break;
      case 'evolve':
        // Technique evolves into its "True" form
        const evolved = evolveTechnique(technique, rng);
        const idx = draft.player.equippedTechniques.indexOf(technique);
        draft.player.equippedTechniques[idx] = evolved;
        draft.log.push({ type: 'enlightenment', data: { tech: evolved.name, effect: 'Technique evolved!' } });
        break;
    }
  });
}
```

---

## 7. Combo System

Chaining techniques of the same element or style builds **combo momentum**:

```typescript
interface ComboState {
  currentChain: string[];          // Technique IDs in current chain
  momentum: number;                // 0–100, decays when chain breaks
  multiplier: number;              // Damage multiplier for next technique in chain
  chainBreakReason?: string;       // Why the last chain broke
}
```

### Combo Rules

| Action | Effect on Combo |
|--------|----------------|
| Use technique of same style | +15 momentum, multiplier +0.1 |
| Use technique of same element | +10 momentum, multiplier +0.05 |
| Use technique of both same style AND element | +25 momentum, multiplier +0.2 |
| Use technique of different style/element | Chain breaks, momentum resets |
| Take damage | -10 momentum |
| Switch stance | Chain breaks |
| Enemy dodges | -5 momentum |
| Basic attack | Chain continues but no bonus |

### Combo Finishers

At 100 momentum, the next technique becomes a **Combo Finisher**:
- Guaranteed critical hit
- 50% chance to apply elemental status even if resisted
- Special flavor text: *"The Nine Heavens Sword reaches its crescendo!"*

---

## 8. Weapon Arts

Each weapon type has its own **weapon art** — a unique passive that grows with weapon mastery:

```typescript
interface WeaponArt {
  readonly weaponType: WeaponType;
  readonly passiveAt50: string;
  readonly passiveAt100: string;
  readonly techniqueBonus: string;        // Unique technique only for this weapon type
}
```

| Weapon | 50 Mastery | 100 Mastery | Signature Technique |
|--------|-----------|-------------|-------------------|
| Sword | +10% crit | Double crit damage | "Sword Intent — One Flash" |
| Saber | +15% attack | Attacks cleave (hit 2 targets) | "Saber Intent — Mountain Splitter" |
| Spear | +1 range (strike first) | +30% damage to beasts | "Dragon Thrust" |
| Staff | +20% defense | 30% chance to deflect | "Ruyi Strikes" |
| Dagger | +20% crit vs unaware | First strike always crits | "Assassin's Kiss" |
| Fan | +15% dodge | Wind techniques cost 0 qi | "Typhoon Waltz" |
| Fists | +25% unarmed damage | Counters on dodge | "Iron Fist Shatters Heaven" |

Weapon mastery grows by dealing damage with that weapon type (1 mastery per 100 damage dealt).

---

## API

```typescript
// ─── Styles ─────────────────────────────────

function learnStyle(state: GameState, styleId: string): ActionResult<GameState>;
function switchStyle(state: GameState, styleId: string): ActionResult<GameState>;
function gainStyleMastery(state: GameState, amount: number): GameState;
function getActiveStyleBonuses(player: PlayerState): StyleBonus[];

// ─── Stances ────────────────────────────────

function switchStance(state: GameState, stanceId: string): ActionResult<GameState>;
function getStanceBonuses(stance: Stance): Record<string, number>;
function getStancePenalties(stance: Stance): Record<string, number>;
function processStancePerTurnEffects(state: GameState): GameState;

// ─── Internal Arts ──────────────────────────

function learnInternalArt(state: GameState, artId: string): ActionResult<GameState>;
function equipInternalArt(state: GameState, artId: string, slotIndex: number): ActionResult<GameState>;
function advanceInternalArtMastery(state: GameState): GameState; // Passive tick

// ─── External Arts ──────────────────────────

function attemptBodyTempering(state: GameState, stageId: string): ActionResult<GameState>;
function getBodyTemperingBonuses(player: PlayerState): Record<string, number>;

// ─── Technique Mastery ──────────────────────

function gainTechniqueMastery(state: GameState, techniqueId: string, amount: number): GameState;
function checkEnlightenment(state: GameState, rng: PRNG): GameState;
function evolveTechnique(technique: Technique, rng: PRNG): Technique;

// ─── Combos ─────────────────────────────────

function processComboAction(state: GameState, techniqueId: string, isBasicAttack: boolean): GameState;
function getComboMultiplier(comboState: ComboState): number;
function isComboFinisher(comboState: ComboState): boolean;

// ─── Weapon Arts ────────────────────────────

function gainWeaponMastery(state: GameState, weaponType: WeaponType, amount: number): GameState;
function getWeaponArtBonus(player: PlayerState): WeaponArtBonus[];
```

---

*See also: [Element System](./elements.md), [Spell System](./spells.md), [Combat System](./combat.md), [Procedural Generation](./procedural-generation.md)*
