# Procedural Generation System

> **Modules**: `src/generation/PRNG.ts`, `src/generation/NameGenerator.ts`, `src/generation/WeaponGenerator.ts`, `src/generation/TechniqueGenerator.ts`, `src/generation/BeastGenerator.ts`
>
> **Type**: Pure functions, deterministic given a seed
>
> **Signature**: `(params: GenParams, rng: PRNG) => GeneratedType`

---

## Overview

The generation system creates all randomized content: weapons, techniques, beasts, items, and names. Everything is **seeded** — given the same PRNG state, generation is fully deterministic. This enables:
- Reproducible tests
- Save file compatibility (only the seed is stored)
- "Seeded run" mode for sharing

---

## 1. PRNG (Pseudo-Random Number Generator)

### Algorithm: mulberry32

A fast, high-quality 32-bit PRNG. State is a single 32-bit integer.

```typescript
// src/generation/PRNG.ts

export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Pick a random element from an array */
  nextFrom<T>(array: readonly T[]): T {
    return array[this.nextInt(0, array.length - 1)]!;
  }

  /** Weighted random pick */
  nextWeighted<T>(entries: readonly (readonly [T, number])[]): T {
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.next() * totalWeight;
    for (const [item, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return item;
    }
    return entries[entries.length - 1]![0]; // Fallback
  }

  /** Fisher-Yates shuffle (returns new array) */
  nextShuffled<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  /** Clone the PRNG (forks the sequence) */
  clone(): PRNG {
    return new PRNG(this.state);
  }

  /** Get current state for serialization */
  getState(): number {
    return this.state;
  }
}
```

### Seeding Strategy

The initial seed is derived from `Date.now()` at game creation. The PRNG state is stored in `GameState.rngState` and persisted in save files. Every tick, the PRNG is advanced only when randomness is needed — not on a fixed schedule. This keeps the save state small and prevents unnecessary RNG consumption.

---

## 2. Name Generator

Template-based name generation combining components from data pools.

### Architecture

```typescript
// src/generation/NameGenerator.ts

interface NameTemplate {
  parts: NamePart[];
}

type NamePart =
  | { type: 'literal'; text: string }
  | { type: 'pick'; pool: string }
  | { type: 'optional'; part: NamePart; chance: number };

// Data pools (src/generation/data/weapon-parts.ts):
const POOLS = {
  materials: ['Iron', 'Jade', 'Crimson Steel', 'Thunder-Forged', 'Soul', 'Shadow', 'Meteoric', 'Frost', 'Spirit', 'Demon'],
  weaponType: ['Sword', 'Saber', 'Spear', 'Dagger', 'Staff', 'Fan', 'Halberd', 'Whip', 'Chakram', 'Flyswatter'],
  suffixes: ['of Desolation', 'of the Nine Heavens', 'Serpent Fang', 'Tiger Claw', 'Phoenix Wing', 'Dragon Tail', 'of Eternal Frost', 'of the Void'],
  elements: ['Flaming', 'Frozen', 'Thundering', 'Venomous', 'Shadow', 'Radiant', 'Cyclonic', 'Earthen'],
  // ...
};

function generateName(template: NameTemplate, rng: PRNG): string {
  return template.parts.map(part => {
    switch (part.type) {
      case 'literal':
        return part.text;
      case 'pick':
        return rng.nextFrom(POOLS[part.pool]);
      case 'optional':
        return rng.next() < part.chance ? generateName({ parts: [part.part] }, rng) : '';
    }
  }).join('').trim();
}
```

### Name Templates by Category

```typescript
const WEAPON_NAME_TEMPLATES: NameTemplate[] = [
  // "[Material] [Type] [Suffix]" — "Crimson Jade Serpent Fang Sword"
  { parts: [
    { type: 'pick', pool: 'materials' },
    { type: 'literal', text: ' ' },
    { type: 'pick', pool: 'suffixes' },
    { type: 'literal', text: ' ' },
    { type: 'pick', pool: 'weaponType' },
  ]},
  // "[Element] [Type] of [Concept]" — "Flaming Saber of the Nine Heavens"
  { parts: [
    { type: 'pick', pool: 'elements' },
    { type: 'literal', text: ' ' },
    { type: 'pick', pool: 'weaponType' },
    { type: 'literal', text: ' of ' },
    { type: 'pick', pool: 'concepts' },
  ]},
  // More templates...
];

const TECHNIQUE_NAME_TEMPLATES: NameTemplate[] = [
  // "[Number] [Concept] [Form]" — "Nine Heavens Annihilation Palm"
  { parts: [
    { type: 'pick', pool: 'numbers' },
    { type: 'literal', text: ' ' },
    { type: 'pick', pool: 'concepts' },
    { type: 'literal', text: ' ' },
    { type: 'pick', pool: 'forms' },
  ]},
  // ...
];

const BEAST_NAME_TEMPLATES: NameTemplate[] = [
  // "[Adjective] [Species] [Title]" — "Three-Eyed Thunder Serpent King"
  { parts: [
    { type: 'optional', chance: 0.4, part: { type: 'pick', pool: 'beast_adjective' } },
    { type: 'pick', pool: 'beast_species' },
    { type: 'literal', text: ' ' },
    { type: 'pick', pool: 'beast_title' },
  ]},
  // ...
];
```

---

## 3. Weapon Generator

### Generation Parameters

```typescript
interface WeaponGenParams {
  tier: number;             // 1–10, scales stats
  rarity?: Rarity;          // Override random rarity
  element?: Element | null; // Force element or random
  seed?: number;            // Override PRNG seed
}
```

### Generation Flow

```typescript
function generateWeapon(params: WeaponGenParams, rng: PRNG): Weapon {
  // 1. Determine rarity
  const rarity = params.rarity ?? rollRarity(params.tier, rng);

  // 2. Pick weapon type
  const weaponType = rng.nextFrom(WEAPON_TYPES);

  // 3. Pick element (weighted, can be null)
  const element = params.element ?? rollElement(rng);

  // 4. Generate base stats
  const baseAttack = calculateBaseAttack(params.tier, rarity);

  // 5. Generate modifiers (more mods for higher rarity)
  const modCount = MODIFIER_COUNT_BY_RARITY[rarity];
  const modifiers = generateModifiers(modCount, rarity, element, rng);

  // 6. Generate special effect (legendary+)
  const specialEffect = rarity === 'legendary' || rarity === 'mythic'
    ? generateSpecialEffect(rng)
    : null;

  // 7. Generate name
  const nameTemplate = rng.nextFrom(WEAPON_NAME_TEMPLATES);
  let name = generateName(nameTemplate, rng);

  // 8. Generate flavor text
  const flavorText = generateWeaponFlavor(weaponType, element, rarity, rng);

  return {
    id: generateId('weapon'),
    name,
    type: 'weapon',
    weaponType,
    rarity,
    element,
    baseAttack,
    modifiers,
    specialEffect,
    description: buildDescription(modifiers, specialEffect),
    flavorText,
    value: calculateValue(baseAttack, rarity),
    stackable: false,
    quantity: 1,
    requirements: rarity === 'legendary' || rarity === 'mythic'
      ? { minRealm: Math.max(0, params.tier - 1) }
      : null,
  };
}
```

### Rarity Distribution

```typescript
const RARITY_WEIGHTS_BY_TIER: Record<number, Record<Rarity, number>> = {
  // Tier 1: mostly common
  1:  { common: 70, uncommon: 25, rare: 4, epic: 1, legendary: 0, mythic: 0 },
  // Tier 5: more rares
  5:  { common: 30, uncommon: 35, rare: 20, epic: 10, legendary: 4, mythic: 1 },
  // Tier 10: endgame drops
  10: { common: 10, uncommon: 20, rare: 30, epic: 25, legendary: 10, mythic: 5 },
};
```

### Modifier Generation

```typescript
interface ModifierTemplate {
  stat: string;
  minValue: number;
  maxValue: number;
  prefix: string;     // e.g., "Sharp" → "Sharp Crimson Sword"
  rarity: Rarity;
}

const MODIFIER_POOL: ModifierTemplate[] = [
  { stat: 'attack',    minValue: 2, maxValue: 5,  prefix: 'Sharp',      rarity: 'common' },
  { stat: 'attack',    minValue: 6, maxValue: 12, prefix: 'Deadly',     rarity: 'uncommon' },
  { stat: 'attack',    minValue: 13, maxValue: 25, prefix: 'Soul-Seeking', rarity: 'rare' },
  { stat: 'speed',     minValue: 1, maxValue: 3,  prefix: 'Swift',      rarity: 'common' },
  { stat: 'comprehension', minValue: 1, maxValue: 2, prefix: 'Enlightened', rarity: 'rare' },
  { stat: 'luck',      minValue: 1, maxValue: 3,  prefix: 'Fortunate',  rarity: 'epic' },
  { stat: 'lifesteal', minValue: 1, maxValue: 5,  prefix: 'Vampiric',   rarity: 'rare' },
  // ...
];

function generateModifiers(
  count: number,
  maxRarity: Rarity,
  element: Element | null,
  rng: PRNG
): ItemModifier[] {
  const pool = MODIFIER_POOL.filter(m =>
    RARITY_ORDER[m.rarity] <= RARITY_ORDER[maxRarity]
  );
  const picked: ItemModifier[] = [];

  // Always add element affix if element present
  if (element) {
    picked.push(generateElementAffix(element));
  }

  // Pick random modifiers (no duplicates on same stat)
  const usedStats = new Set(picked.map(m => m.stat));
  while (picked.length < count && pool.length > 0) {
    const available = pool.filter(m => !usedStats.has(m.stat));
    if (available.length === 0) break;
    const template = rng.nextFrom(available);
    picked.push({
      stat: template.stat,
      value: rng.nextInt(template.minValue, template.maxValue),
      prefix: template.prefix,
    });
    usedStats.add(template.stat);
  }

  return picked;
}
```

### Special Effects (Legendary+)

```typescript
const SPECIAL_EFFECTS: WeaponEffect[] = [
  { type: 'lifesteal',     potency: 0.15, description: 'Heals you for 15% of damage dealt.' },
  { type: 'armorPierce',   potency: 0.30, description: 'Ignores 30% of enemy defense.' },
  { type: 'qiBurn',        potency: 0.10, description: 'Burns 10% of enemy Qi on hit.' },
  { type: 'aoe',           potency: 0.50, description: 'Deals 50% splash damage to nearby enemies.' },
  { type: 'stun',          potency: 0.20, description: '20% chance to stun enemy for 1 turn.' },
  { type: 'poison',        potency: 0.05, description: 'Deals 5% max HP as poison damage per turn.' },
];
```

---

## 4. Technique Generator

Similar structure to weapons, but generates martial arts techniques.

### Technique Archetypes

```typescript
const TECHNIQUE_ARCHETYPES: Record<TechniqueType, {
  damageMultiplierRange: [number, number];
  qiCostRange: [number, number];
  cooldownRange: [number, number];
  possibleEffects: TechniqueEffectType[];
}> = {
  attack:    { damageRange: [1.5, 4.0], qiCost: [10, 50], cooldown: [0, 5],  effects: ['damage', 'debuff'] },
  defense:   { damageRange: [0, 0.5],   qiCost: [5, 30],  cooldown: [3, 10], effects: ['shield', 'buff'] },
  movement:  { damageRange: [0, 1.0],   qiCost: [15, 40], cooldown: [2, 8],  effects: ['teleport', 'buff'] },
  support:   { damageRange: [0, 0],     qiCost: [20, 60], cooldown: [5, 15], effects: ['heal', 'buff'] },
  forbidden: { damageRange: [3.0, 8.0], qiCost: [50, 120], cooldown: [10, 30], effects: ['damage', 'debuff'] },
};
```

---

## 5. Beast Generator

Beasts scale with tier (danger level) and have procedural names, stats, and abilities.

### Base Stats by Tier

```typescript
function calculateBeastStats(tier: number, isBoss: boolean): BeastStats {
  const base = {
    health:    20 + tier * 15,
    attack:    3  + tier * 3,
    defense:   1  + tier * 2,
    speed:     2  + tier * 2,
  };

  if (isBoss) {
    base.health  *= 3;
    base.attack  *= 2;
    base.defense *= 1.5;
  }

  // Add variance (±20%)
  return base;
}
```

### Beast Species Pool

```typescript
const BEAST_SPECIES = [
  'Serpent', 'Tiger', 'Phoenix', 'Dragon', 'Wolf', 'Bear', 'Eagle',
  'Turtle', 'Fox', 'Spider', 'Ape', 'Crocodile', 'Scorpion', 'Toad',
  'Centipede', 'Mantis', 'Crane', 'Panther', 'Boar', 'Bat',
];

const BEAST_ADJECTIVES = [
  'Three-Eyed', 'Crimson', 'Shadow', 'Golden', 'Frozen',
  'Thunder', 'Venomous', 'Spectral', 'Ancient', 'Demonic',
  'Celestial', 'Infernal', 'Jade', 'Blood', 'Iron',
];

const BEAST_TITLES = [
  'King', 'Emperor', 'Overlord', 'Tyrant', 'Sovereign',
  'Devourer', 'Guardian', 'Herald', 'Avatar', 'Ancestor',
  '', '', '', // Sometimes no title (common beasts)
];
```

### Beast Abilities

Beasts get 0–3 abilities based on tier and boss status:

```typescript
const BEAST_ABILITY_POOL: BeastAbilityTemplate[] = [
  {
    name: 'Feral Roar',
    description: 'A terrifying roar that shakes the spirit.',
    effect: { type: 'attack_buff', amount: 1.5, duration: 3 },
    cooldown: 5,
    minTier: 1,
  },
  {
    name: 'Qi Devour',
    description: 'Devours ambient qi to heal wounds.',
    effect: { type: 'heal', amount: 20 },
    cooldown: 8,
    minTier: 3,
  },
  {
    name: 'Heavenly Charge',
    description: 'Charges with elemental fury.',
    effect: { type: 'special_attack', multiplier: 2.5, element: 'thunder' },
    cooldown: 6,
    minTier: 5,
  },
  // ...
];
```

---

## 6. Item Generator (Generic)

For generating pills, materials, treasures, etc:

```typescript
function generatePill(params: { tier: number; pillType?: PillType }, rng: PRNG): Pill;
function generateBeastCore(tier: number, element: Element | null, rng: PRNG): Item;
function generateMaterial(tier: number, rng: PRNG): Item;
function generateTreasure(params: { rarity: Rarity }, rng: PRNG): Item;
```

---

## API

```typescript
// ─── PRNG ────────────────────────────────────

class PRNG {
  constructor(seed: number);
  next(): number;
  nextInt(min: number, max: number): number;
  nextFrom<T>(array: readonly T[]): T;
  nextWeighted<T>(entries: readonly (readonly [T, number])[]): T;
  nextShuffled<T>(array: readonly T[]): T[];
  clone(): PRNG;
  getState(): number;
}

// ─── Name Generator ──────────────────────────

function generateName(template: NameTemplate, rng: PRNG): string;
function generateWeaponName(rng: PRNG, element?: Element | null): string;
function generateTechniqueName(rng: PRNG, techniqueType: TechniqueType): string;
function generateBeastName(rng: PRNG): string;

// ─── Weapon Generator ────────────────────────

function generateWeapon(params: WeaponGenParams, rng: PRNG): Weapon;
function rollRarity(tier: number, rng: PRNG): Rarity;
function calculateBaseAttack(tier: number, rarity: Rarity): number;
function generateModifiers(count: number, maxRarity: Rarity, element: Element | null, rng: PRNG): ItemModifier[];

// ─── Technique Generator ─────────────────────

function generateTechnique(params: TechniqueGenParams, rng: PRNG): Technique;
function getTechniqueArchetype(type: TechniqueType): TechniqueArchetype;

// ─── Beast Generator ─────────────────────────

function generateBeast(params: BeastGenParams, rng: PRNG): Beast;
function calculateBeastStats(tier: number, isBoss: boolean): BeastStats;
function pickBeastAbilities(tier: number, isBoss: boolean, rng: PRNG): BeastAbility[];

// ─── Item Generator ──────────────────────────

function generatePill(params: PillGenParams, rng: PRNG): Pill;
function generateBeastCore(tier: number, element: Element | null, rng: PRNG): Item;
function generateTreasure(params: { rarity: Rarity }, rng: PRNG): Item;
function generateMaterial(tier: number, rng: PRNG): Item;
```

---

## Testing Strategy

### PRNG Tests
- Same seed produces identical sequence
- Distribution is uniform (chi-squared test)
- `nextInt` bounds are respected
- `nextFrom` never returns out-of-bounds
- `nextWeighted` respects weights (statistical)
- `clone` produces independent sequences

### Generator Tests (Snapshot)
- Given fixed seed, `generateWeapon` produces identical weapon
- Given fixed seed, `generateBeast` produces identical beast
- All generated names are non-empty strings
- Generated stats are within expected ranges for tier
- Rarity distribution over 1000 generations matches expected weights (±5%)
- No duplicate modifier stats on same weapon

### Generator Tests (Property-Based)
- All generated weapons have `id`, `name`, `type: 'weapon'`
- All generated techniques have valid `techniqueType`
- All generated beasts have positive HP
- Rarity influences stat magnitude (legendary > epic > rare > uncommon > common)
- Boss beasts are significantly stronger than normal beasts of same tier

### Integration Tests
- Beast generated at tier 1 can be defeated by starting player (eventually)
- Weapon stats + player base stats produce expected combat outcomes

---

*See also: [Data Models](../data-models.md), [Combat System](./combat.md), [Inventory System](./inventory.md)*
