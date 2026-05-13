# Element System — The Five Phases & Beyond

> **Module**: `src/systems/ElementSystem.ts`, `src/data/elements.ts`
>
> **Type**: Pure functions — elemental affinity, interaction resolution, qi typing
>
> **Signature**: `(state, params?) => GameState | computed value`

---

## Overview

Elements are the fundamental forces of the cultivation world. Every cultivator, beast, technique, weapon, and location has elemental properties. Understanding and mastering elements is a core path to power — a fire cultivator and a water cultivator are fundamentally different in their strengths, weaknesses, and available techniques.

---

## The Elemental Cosmology

### The Five Phases (Wu Xing) — Standard Cycle

```
                    GENERATING CYCLE (生)
                    ─────────────────────
                         Fire
                        (burns)│
                           ▼
               Wood ◄───────────► Earth
              (feeds)▲         │(bears)
                      │         ▼
                     Water ◄── Metal
                           (collects)


                    OVERCOMING CYCLE (克)
                    ─────────────────────
                         Fire
                        (melts)│
                           ▼
               Wood ◄───────────► Metal
              (parts)▲         │(chops)
                      │         ▼
                     Earth ◄── Water
                           (dams)
```

| Phase | Essence | Cultivation Style | Body Part | Emotion | Direction |
|-------|---------|-------------------|-----------|---------|-----------|
| **Fire** 火 | Heat, passion, destruction | Aggressive, fast breakthrough | Heart | Joy | South |
| **Earth** 土 | Stability, nurturing, patience | Slow but steady, high defense | Spleen | Contemplation | Center |
| **Metal** 金 | Sharpness, precision, judgment | Sword arts, decisive strikes | Lungs | Grief | West |
| **Water** 水 | Adaptability, depth, wisdom | Flowing combat, high comprehension | Kidneys | Fear | North |
| **Wood** 木 | Growth, vitality, flexibility | Rapid cultivation, healing | Liver | Anger | East |

### The Transcendent Elements — Beyond the Cycle

These exist outside the Five Phases, rare and powerful:

| Element | Nature | Source | Counters | Countered By |
|---------|--------|--------|----------|--------------|
| **Thunder** 雷 | Heaven's judgment, speed, penetration | Tribulation, celestial events | Water, Metal | Earth (grounding) |
| **Wind** 风 | Freedom, evasion, ranged attacks | Mountain peaks, open plains | Earth, Wood | Metal (cutting wind) |
| **Ice** 冰 | Stillness, preservation, absolute cold | Northern wastes, deep caves | Fire, Wind | Thunder (shattering) |
| **Dark** 暗 | Shadow, absorption, corruption | Nether Realm, Shadow Heaven Sect | Light | Light |
| **Light** 光 | Illumination, purification, revelation | Heavenly Realm, righteous sects | Dark | Dark |
| **Void** 空 | Nothingness, negation, transcendence | The Dao itself | All elements equally | None |

---

## Player Elemental Affinity

### Innate Affinity

At character creation, every player has an **innate elemental affinity** — the element their spirit roots naturally align with:

```typescript
interface ElementalAffinity {
  readonly primary: Element;             // Main affinity (100% power)
  readonly primaryStrength: number;      // 1–100, grows with realm
  readonly secondary: Element | null;    // Secondary affinity (75% power), rare
  readonly resistances: Record<Element, number>;  // 0–100% resistance
  readonly vulnerabilities: Record<Element, number>; // 0–100% vulnerability
}
```

### Affinity by Origin

| Origin | Primary Affinity | Rationale |
|--------|-----------------|-----------|
| Village Orphan | Random (balanced spirit roots) | Untapped potential |
| Disgraced Disciple | Wind (Cloud Sect default) | Sect training |
| Merchant's Heir | Metal (sharp mind for business) | Family trait |
| Foreign Wanderer | Ice (Northern origin) | Wasteland heritage |
| Immortal Bloodline | Thunder (Heaven's mark) | Cursed blood |
| Beast Bonded | Wood (connection to wild) | Forest upbringing |

### Affinity by Race

| Race | Primary Affinity |
|------|-----------------|
| Human | Random (adaptable) |
| Spirit Fox | Dark (shadow nature) |
| Dragon-Blood | Fire (dragon breath) |
| Jade Spirit | Earth (born of stone) |
| Shadow Phantom | Dark (shadow essence) |
| Iron Body | Metal (forged flesh) |

### Growing Affinity

Affinity strength grows as the player:
- Uses elemental techniques (+0.1 per use in combat)
- Cultivates in elemental locations (+1 per hour in matching qi area)
- Absorbs elemental beast cores (+5 per core of matching element)
- Studies elemental scriptures (rare items, +10–20)
- Undergoes elemental tribulation (major jump, +30 if survived)

```typescript
function growAffinity(state: GameState, element: Element, amount: number): GameState {
  return produce(state, draft => {
    const aff = draft.player.elementalAffinity;
    if (aff.primary === element) {
      aff.primaryStrength = Math.min(100, aff.primaryStrength + amount);
    } else if (aff.secondary === element) {
      // Secondary grows at 50% rate
      aff.primaryStrength = Math.min(100, aff.primaryStrength + amount * 0.3);
    }
    // Cross-training: using non-affinity elements slightly boosts comprehension
    else {
      draft.player.comprehension += amount * 0.01;
    }
  });
}
```

---

## Elemental Qi

### Qi Has Types

Not all Qi is the same. The ambient qi in a location has elemental composition:

```typescript
interface ElementalQi {
  fire: number;     // 0–100 percentage
  water: number;
  wood: number;
  metal: number;
  earth: number;
  thunder: number;
  wind: number;
  ice: number;
  dark: number;
  light: number;
  // Total always sums to 100
}
```

### Location Qi Profiles

```typescript
// Example location qi compositions
const LOCATION_QI: Record<string, ElementalQi> = {
  azure_cloud_village:  { fire: 15, water: 15, wood: 20, metal: 10, earth: 30, thunder: 5, wind: 3, ice: 0, dark: 1, light: 1 },
  misty_peaks:          { fire: 5,  water: 25, wood: 10, metal: 15, earth: 20, thunder: 10, wind: 10, ice: 5, dark: 0, light: 0 },
  demon_beast_mountain: { fire: 30, water: 5,  wood: 10, metal: 10, earth: 15, thunder: 15, wind: 5, ice: 0, dark: 10, light: 0 },
  black_wind_gorge:     { fire: 5,  water: 10, wood: 5,  metal: 10, earth: 10, thunder: 5, wind: 20, ice: 5, dark: 25, light: 5 },
  heavenly_peak:        { fire: 10, water: 10, wood: 10, metal: 10, earth: 10, thunder: 15, wind: 10, ice: 10, dark: 5, light: 10 },
};
```

### Cultivation Bonus from Affinity Match

When cultivating in an area rich in your affinity element:

```typescript
function getElementalCultivationBonus(player: PlayerState, location: LocationNode): number {
  const aff = player.elementalAffinity;
  const qi = getLocationQi(location.id);

  // Primary affinity: qi percentage × affinity strength
  const primaryBonus = (qi[aff.primary] / 100) * (aff.primaryStrength / 100);

  // Secondary affinity (if present): half effect
  const secondaryBonus = aff.secondary
    ? (qi[aff.secondary] / 100) * (aff.primaryStrength / 100) * 0.5
    : 0;

  return 1 + primaryBonus + secondaryBonus; // Multiplier on cultivation speed
}
```

A Fire-primary cultivator in Demon Beast Mountain (30% fire qi) with 80 affinity strength gets:
`1 + (0.30 × 0.80) = 1.24× cultivation speed` — a significant bonus.

---

## Elemental Combat Interactions

### The Full Interaction Matrix

```
ATTACKER → DEFENDER

           Fire Water Wood Metal Earth Thunder Wind Ice Dark Light Void
Fire       1.0  0.75  1.5  1.5   1.0   1.0   1.0  1.5  1.0  1.0  1.0
Water      1.5  1.0  0.75  1.0   1.5   0.75  1.0  1.0  1.0  1.0  1.0
Wood       0.75 1.5  1.0  0.75  1.5   1.0   0.75 1.0  1.0  1.0  1.0
Metal      0.75 1.0  1.5  1.0   0.75  1.0   1.5  1.0  1.0  1.0  1.0
Earth      1.0  0.75  0.75  1.5   1.0   1.5   0.75 1.0  1.0  1.0  1.0
Thunder    1.0  1.5  1.0  1.5   0.75  1.0   1.0  1.0  1.0  1.0  1.0
Wind       1.0  1.0  1.5  0.75  1.5   1.0   1.0  1.0  1.0  1.0  1.0
Ice        0.75 1.0  1.0  1.0   1.0   0.75  1.5  1.0  1.0  1.0  1.0
Dark       1.0  1.0  1.0  1.0   1.0   1.0   1.0  1.0  1.0  0.5  1.0
Light      1.0  1.0  1.0  1.0   1.0   1.0   1.0  1.0  0.5  1.0  1.0
Void       1.0  1.0  1.0  1.0   1.0   1.0   1.0  1.0  1.0  1.0  1.0

1.5 = Advantage  |  0.75 = Disadvantage  |  1.0 = Neutral
```

### Elemental Resistance

The defender's elemental resistance reduces damage from that element:

```typescript
function calculateElementalDamage(
  baseDamage: number,
  attackElement: Element,
  defenderResistances: Record<Element, number>,
  affinityMatch: number             // Attacker's affinity strength / 100
): number {
  // Interaction multiplier
  const interaction = ELEMENTAL_MATRIX[attackElement] ?? 1.0;

  // Resistance reduces damage
  const resistance = (defenderResistances[attackElement] ?? 0) / 100;
  const resistanceMultiplier = 1 - resistance;

  // Affinity bonus: using your own element deals extra damage
  const affinityBonus = 1 + (affinityMatch * 0.5); // Up to 50% bonus at max affinity

  return Math.round(baseDamage * interaction * resistanceMultiplier * affinityBonus);
}
```

### Elemental Status Effects

Hitting with elemental attacks can apply status effects:

| Element | Status Effect | Duration | Debuff |
|---------|--------------|----------|--------|
| Fire | **Burning** | 3 turns | -5% HP per turn |
| Water | **Soaked** | 2 turns | -20% speed |
| Wood | **Entangled** | 3 turns | Cannot flee |
| Metal | **Rended** | 2 turns | -30% defense |
| Earth | **Petrified** | 1 turn | Skip next turn |
| Thunder | **Paralyzed** | 2 turns | 50% chance to skip turn |
| Wind | **Disoriented** | 3 turns | -30% accuracy |
| Ice | **Frozen** | 2 turns | Skip turns, +50% defense |
| Dark | **Cursed** | 4 turns | -10% all stats |
| Light | **Blinded** | 2 turns | -50% accuracy |

Status chance = `techniquePotency × (1 - defenderResistance/100)`

---

## Elemental Cultivation Paths

### Monocle Path (Single Element)

Focus entirely on one element. Benefits:
- Affinity grows 50% faster
- That element's techniques deal +25% damage
- Immune to that element's status effect at 100 affinity
- **Drawback**: Double damage from overcoming element

### Dual Path (Two Compatible Elements)

Cultivate two elements that don't overcome each other:
- Access to **Fusion Techniques** (combined element arts)
- Example: Fire + Wood = "Blazing Vine Arts" (Fire-Wood technique)
- Wider technique pool, but each element grows slower

### Five Phase Harmony (All Five)

The hardest path — balance all five standard elements:
- No elemental weaknesses (all interactions normalized toward 1.0)
- Access to **Primordial Chaos Arts** (void-adjacent techniques)
- Requires equal affinity in all five (minimum 50 each)
- Unlocks at Nascent Soul realm
- Special breakthrough: "Five Phase Unity" tribulation

### Transcendent Path (Special Elements)

Focus on Thunder, Ice, Dark, Light, or Void:
- Rarest techniques, hardest to find
- Void path is the hardest overall — requires abandoning all other elements

---

## Elemental Tribulations

At certain realm breakthroughs, elemental tribulations test the cultivator:

| Realm | Tribulation | Requirement |
|-------|------------|-------------|
| Qi Condensation → Foundation | Minor elemental trial | Affinity 20+ in one element |
| Foundation → Core Formation | Elemental core condensation | Affinity 50+ in primary element |
| Core Formation → Nascent Soul | Elemental soul manifestation | Affinity 70+ or dual 50+ |
| Nascent Soul → Spirit Severing | Elemental severing | Choose to keep or abandon elements |
| Spirit Severing → Dao Seeking | Elemental Dao comprehension | Affinity 90+ or Five Phase Harmony |
| Dao Seeking → Immortal | Heavenly elemental tribulation | Full mastery of chosen path |

Surviving an elemental tribulation grants permanent bonuses to that element's affinity and resistances.

---

## Elemental Locations

Some locations have extreme elemental qi — dangerous but rewarding:

| Location | Dominant Element | Special Effect |
|----------|-----------------|----------------|
| **Volcanic Caldera** | Fire (70%) | Cultivation speed +50% for fire cultivators; constant fire damage for others |
| **Abyssal Trench** | Water (65%) | Underwater cultivation; can discover water-element treasures |
| **Ancient Ironwood Forest** | Wood (60%) | Trees that fight back; wood-element techniques +30% damage |
| **Thunder Peak** | Thunder (50%) | Random tribulation lightning strikes; thunder cultivation +50% |
| **Nether Rift** | Dark (80%) | Shadow Sect territory; light cultivators take constant damage |

---

## API

```typescript
// ─── Elemental Affinity ─────────────────────

function getAffinity(player: PlayerState, element: Element): number;
function growAffinity(state: GameState, element: Element, amount: number): GameState;
function setPrimaryAffinity(state: GameState, element: Element): GameState;
function getAffinityBonus(player: PlayerState, element: Element): number; // 0-1 multiplier

// ─── Elemental Interaction ──────────────────

function getElementalAdvantage(attackElement: Element, defendElement: Element): number;
function calculateElementalDamage(baseDamage: number, attackElement: Element, defender: CombatEntity): number;
function getElementalStatusEffect(element: Element): StatusEffect | null;
function rollStatusApplication(potency: number, resistance: number, rng: PRNG): boolean;

// ─── Elemental Qi ───────────────────────────

function getLocationQi(locationId: string): ElementalQi;
function getElementalCultivationBonus(player: PlayerState, location: LocationNode): number;
function getQiComposition(locationId: string): ElementalQi;

// ─── Elemental Cultivation Paths ────────────

function getCultivationPath(player: PlayerState): CultivationPath;
function canLearnTechnique(player: PlayerState, technique: Technique): boolean;
function getAvailableFusionTechniques(player: PlayerState): Technique[];

// ─── Elemental Tribulations ─────────────────

function checkElementalTribulation(state: GameState): TribulationEvent | null;
function resolveElementalTribulation(state: GameState, rng: PRNG): GameState;
```

---

## Testing Strategy

- Interaction matrix returns correct multipliers for all 121 element pairs
- Affinity growth respects primary/secondary/non-affinity rates
- Status effect application respects resistance
- Cultivation bonus calculation correct for mixed qi locations
- Elemental tribulation triggers at correct realm thresholds

---

*See also: [Martial Arts System](./martial-arts.md), [Spell System](./spells.md), [Combat System](./combat.md)*
