# Flavor Engine

> **Module**: `src/systems/FlavorEngine.ts`
>
> **Type**: Pure function, data-driven
>
> **Signature**: `(category: FlavorCategory, context: FlavorContext, rng: PRNG) => string`

---

## Overview

The Flavor Engine transforms game events into immersive, wuxia-styled narrative text. It uses a **template interpolation system** with context variables and conditional template selection. All templates live in data files — the engine just picks and fills them.

---

## Design Philosophy

1. **Templates are data, not code.** Writers (or anyone) can add flavor text without touching game logic.
2. **Contextual richness.** The same event (e.g., breakthrough) feels different based on realm, location, equipped weapon, and even time of day.
3. **Variety.** Multiple templates per category, with conditions to narrow selection, prevent repetition.
4. **Wuxia authenticity.** Templates draw from xianxia tropes: flowery descriptions, dramatic exclamations, Chinese idiom-like phrasing.

---

## Template Structure

```typescript
// src/data/flavor-templates.ts

interface FlavorTemplate {
  id: string;
  category: FlavorCategory;
  templates: string[];
  conditions?: FlavorCondition[];
  weight?: number;           // Higher = more likely (default 1)
  cooldown?: number;         // How many times before this template can repeat
}

type FlavorCategory =
  // Cultivation
  | 'cultivation_start'
  | 'cultivation_progress'
  | 'breakthrough_success'
  | 'breakthrough_failure'
  | 'breakthrough_perfect'
  | 'tribulation_lightning'
  | 'tribulation_inner_demon'
  | 'qi_deviation'

  // Combat
  | 'combat_start'
  | 'combat_hit_player'
  | 'combat_hit_enemy'
  | 'combat_crit'
  | 'combat_dodge'
  | 'combat_technique_used'
  | 'combat_victory'
  | 'combat_defeat'
  | 'combat_flee_success'
  | 'combat_flee_fail'

  // Travel
  | 'travel_start'
  | 'travel_progress'
  | 'travel_arrival'
  | 'travel_interrupted'

  // Encounters
  | 'encounter_beast'
  | 'encounter_rogue_cultivator'
  | 'encounter_treasure'
  | 'encounter_merchant'
  | 'encounter_ancient_inheritance'
  | 'encounter_peaceful'
  | 'encounter_rare_herb'
  | 'encounter_wandering_elder'

  // Items
  | 'item_found_weapon'
  | 'item_found_technique'
  | 'item_found_treasure'
  | 'item_equipped'
  | 'technique_learned'

  // World
  | 'location_discovery'
  | 'location_description'
  | 'danger_warning'

  // Meta
  | 'idle'
  | 'death'
  | 'achievement';

interface FlavorCondition {
  field: keyof FlavorContext;          // Which context field to check
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
}
```

---

## Template Examples

### Cultivation

```typescript
const cultivationStartTemplates: FlavorTemplate[] = [
  {
    id: 'cult_start_generic',
    category: 'cultivation_start',
    templates: [
      'You settle into a lotus position, breathing in the faint qi of ${locationName}.',
      'Closing your eyes, you begin to circulate the spiritual energy around you.',
      'The ${locationDescription} fades from your senses as you turn inward to your dantian.',
    ],
    weight: 3,
  },
  {
    id: 'cult_start_location_cave',
    category: 'cultivation_start',
    templates: [
      'The darkness of the cave wraps around you like a cocoon. Qi flows thick and rich here.',
      'Stalactites drip with condensed spiritual water. An excellent place to cultivate.',
    ],
    conditions: [{ field: 'terrainType', operator: '==', value: 'cave' }],
    weight: 1,
  },
  {
    id: 'cult_start_high_realm',
    category: 'cultivation_start',
    templates: [
      'With the mere thought, your ${playerRealm} cultivation base roars to life. Qi surges through your meridians like a raging river.',
    ],
    conditions: [{ field: 'playerRealmIndex', operator: '>=', value: 4 }],
    weight: 1,
  },
];
```

### Breakthrough

```typescript
const breakthroughSuccessTemplates: FlavorTemplate[] = [
  {
    id: 'breakthrough_success_standard',
    category: 'breakthrough_success',
    templates: [
      'BOOM! The walls of your dantian shake as ${qiGained} units of qi crystallize into pure power. You have broken through!',
      'A surge of strength floods your body. Your ${playerRealm} cultivation has advanced!',
      'The bottleneck shatters like ice before a spring flood. You step forward on the path of cultivation!',
      'Heaven and earth seem to pause for a breath as your aura expands. ${playerName} has broken through!',
    ],
    weight: 3,
  },
  {
    id: 'breakthrough_success_major_realm',
    category: 'breakthrough_success',
    templates: [
      'The heavens themselves take notice! Thunder rumbles across ${locationName} as ${playerName} ascends to the ${playerRealm} realm!',
      'A pillar of golden light erupts from your body, piercing the clouds! The ${playerRealm} realm welcomes a new cultivator!',
      'Every cultivator within a hundred li feels the shockwave. A new ${playerRealm} expert has been born!',
    ],
    conditions: [{ field: 'playerSubStage', operator: '==', value: 1 }], // Just entered new realm
    weight: 1,
  },
];
```

### Combat

```typescript
const combatTemplates: FlavorTemplate[] = [
  {
    id: 'combat_hit_player',
    category: 'combat_hit_player',
    templates: [
      '${enemyTitle} strikes with brutal force! You take ${damageTaken} damage.',
      'The ${enemySpecies}\'s attack lands true, rattling your bones.',
      'You barely manage to raise your guard, but still suffer ${damageTaken} damage.',
    ],
  },
  {
    id: 'combat_crit',
    category: 'combat_crit',
    templates: [
      'CRITICAL HIT! Your ${currentTechniqueName} strikes a vital point for ${damageDealt} damage!',
      'The ${equippedWeaponName} finds a flaw in ${enemyName}\'s defense, dealing devastating damage!',
    ],
  },
  {
    id: 'combat_victory_epic',
    category: 'combat_victory',
    templates: [
      'With a final, heaven-shaking strike, ${enemyName} collapses! The ${enemySpecies} is no match for your ${playerRealm} cultivation.',
    ],
    conditions: [{ field: 'playerRealmIndex', operator: '>=', value: 3 }],
  },
];
```

### Travel

```typescript
const travelProgressTemplates: FlavorTemplate[] = [
  {
    id: 'travel_progress_generic',
    category: 'travel_progress',
    templates: [
      'Walking through the ${locationDescription}, the wind carries whispers of ancient cultivators.',
      'The path winds onward. ${destinationName} is still ${travelTime} away.',
      'You pass a weathered stone tablet, its inscriptions faded by centuries of rain.',
    ],
  },
  {
    id: 'travel_progress_night',
    category: 'travel_progress',
    templates: [
      'Under the starry sky, the world seems boundless. You continue toward ${destinationName}.',
      'The moon casts silver shadows on the path. Somewhere in the darkness, a spirit beast howls.',
      'Night cultivates its own stillness. Your footsteps echo in the silence.',
    ],
    conditions: [{ field: 'currentHour', operator: '>=', value: 20 }],
  },
];
```

---

## Template Interpolation

The engine replaces `${variable}` placeholders with context values:

```typescript
function interpolate(template: string, context: FlavorContext): string {
  return template.replace(/\$\{(\w+)\}/g, (match, key: string) => {
    const value = (context as Record<string, unknown>)[key];
    if (value === undefined || value === null) return match; // Keep placeholder
    return String(value);
  });
}
```

### Context Construction

Before calling the flavor engine, the caller builds a `FlavorContext` from the current game state:

```typescript
function buildContext(state: GameState, extra: Partial<FlavorContext> = {}): FlavorContext {
  const p = state.player;
  const w = state.world;
  const location = getLocation(w.currentNodeId)!;

  return {
    playerName: p.name,
    playerRealm: REALMS[p.realm].name,
    playerRealmIndex: p.realm,
    playerSubStage: p.subStage,
    playerRace: p.race.name,
    equippedWeaponName: p.equippedWeapon?.name ?? 'bare hands',
    currentTechniqueName: p.equippedTechniques[0]?.name ?? 'basic attack',

    locationName: location.name,
    locationDescription: location.description,
    destinationName: w.travelState ? getLocation(w.travelState.toId)!.name : '',
    terrainType: location.terrain,

    enemyName: p.combatState?.enemy.name ?? '',
    enemySpecies: p.combatState?.enemy.species ?? '',
    enemyTitle: p.combatState?.enemy.title ?? '',
    damageDealt: extra.damageDealt ?? 0,
    damageTaken: extra.damageTaken ?? 0,
    techniqueUsed: extra.techniqueUsed ?? '',
    isCrit: extra.isCrit ?? false,

    itemName: extra.itemName ?? '',
    itemRarity: extra.itemRarity ?? '',
    itemType: extra.itemType ?? '',
    spiritStonesFound: extra.spiritStonesFound ?? 0,
    qiGained: extra.qiGained ?? 0,

    travelTime: extra.travelTime ?? '',
    currentHour: new Date().getHours(),
  };
}
```

---

## Template Selection Algorithm

```typescript
function pickFlavor(
  category: FlavorCategory,
  context: FlavorContext,
  recentlyUsed: Set<string>,  // IDs of recently used templates (avoid repeats)
  rng: PRNG
): string {
  // 1. Filter templates by category
  let candidates = FLAVOR_TEMPLATES.filter(t => t.category === category);

  // 2. Filter by conditions (all conditions must pass)
  candidates = candidates.filter(t => {
    if (!t.conditions) return true;
    return t.conditions.every(c => evaluateCondition(c, context));
  });

  // If no candidates match conditions, fall back to unconditional templates
  if (candidates.length === 0) {
    candidates = FLAVOR_TEMPLATES.filter(t =>
      t.category === category && !t.conditions
    );
  }

  // 3. Remove recently used (if alternatives exist)
  const freshCandidates = candidates.filter(t => !recentlyUsed.has(t.id));
  if (freshCandidates.length > 0) candidates = freshCandidates;

  // 4. Weighted pick
  const entries = candidates.map(t => [t, t.weight ?? 1] as const);
  const picked = rng.nextWeighted(entries);

  // 5. Pick a random template string from the template
  const rawTemplate = rng.nextFrom(picked.templates);

  // 6. Interpolate
  return interpolate(rawTemplate, context);
}
```

---

## Condition Evaluation

```typescript
function evaluateCondition(condition: FlavorCondition, context: FlavorContext): boolean {
  const fieldValue = context[condition.field];
  if (fieldValue === undefined) return false;

  switch (condition.operator) {
    case '>':  return Number(fieldValue) >  Number(condition.value);
    case '<':  return Number(fieldValue) <  Number(condition.value);
    case '>=': return Number(fieldValue) >= Number(condition.value);
    case '<=': return Number(fieldValue) <= Number(condition.value);
    case '==': return fieldValue === condition.value;
    case '!=': return fieldValue !== condition.value;
    default:   return false;
  }
}
```

---

## Recently Used Tracking

To avoid repetitive flavor text, the engine tracks recently used template IDs. This is stored in the game state:

```typescript
// In GameState:
interface GameState {
  // ...
  flavorState: FlavorState;
}

interface FlavorState {
  recentlyUsed: Record<FlavorCategory, string[]>;  // Last N template IDs per category
  maxRecent: number;  // How many to track (default 3)
}

function markUsed(state: GameState, category: FlavorCategory, templateId: string): GameState {
  return produce(state, draft => {
    const recent = draft.flavorState.recentlyUsed[category] ?? [];
    recent.unshift(templateId);
    if (recent.length > draft.flavorState.maxRecent) {
      recent.pop();
    }
    draft.flavorState.recentlyUsed[category] = recent;
  });
}
```

---

## Flavor for Generated Items

Items (weapons, techniques) have their own flavor text generated at creation time:

```typescript
function generateWeaponFlavor(
  weaponType: WeaponType,
  element: Element | null,
  rarity: Rarity,
  rng: PRNG
): string {
  const templates = WEAPON_FLAVOR_TEMPLATES[weaponType];
  const template = rng.nextFrom(templates);
  return interpolate(template, {
    weaponType,
    element: element ?? 'none',
    rarity,
  });
}

// Example templates:
const WEAPON_FLAVOR_TEMPLATES: Record<WeaponType, string[]> = {
  sword: [
    'Forged in the heart of a dying star, this blade thirsts for the blood of immortals.',
    'The edge gleams with a cold light that seems to cut through reality itself.',
    'Ancient runes pulse along the blade, whispering forgotten sword arts.',
  ],
  // ...
};
```

---

## API

```typescript
// ─── Main Flavor Engine ─────────────────────

function pickFlavor(
  category: FlavorCategory,
  context: FlavorContext,
  recentlyUsed: Set<string>,
  rng: PRNG
): string;

function generateFlavor(
  state: GameState,
  category: FlavorCategory,
  extra?: Partial<FlavorContext>,
  rng?: PRNG
): { text: string; state: GameState };  // Returns text AND updated state (marks used)

// ─── Context Building ──────────────────────

function buildContext(state: GameState, extra?: Partial<FlavorContext>): FlavorContext;

// ─── Item Flavor ───────────────────────────

function generateWeaponFlavor(weaponType: WeaponType, element: Element | null, rarity: Rarity, rng: PRNG): string;
function generateTechniqueFlavor(techniqueType: TechniqueType, element: Element | null, rarity: Rarity, rng: PRNG): string;
function generateBeastDescription(species: string, element: Element | null, tier: number, rng: PRNG): string;

// ─── Template Helpers ──────────────────────

function interpolate(template: string, context: Record<string, unknown>): string;
function evaluateCondition(condition: FlavorCondition, context: FlavorContext): boolean;
```

---

## Data File Structure

```
src/data/flavor-templates.ts
  └── FLAVOR_TEMPLATES: FlavorTemplate[]    // All templates, organized by category

src/data/flavor/
  ├── cultivation.ts                        // Cultivation flavor templates
  ├── combat.ts                             // Combat flavor templates
  ├── travel.ts                             // Travel flavor templates
  ├── encounters.ts                         // Encounter flavor templates
  ├── items.ts                              // Item flavor templates
  └── world.ts                              // World description templates
```

Split into separate files for maintainability, re-exported from `flavor-templates.ts`.

---

## Testing Strategy

### Unit Tests
- `interpolate` replaces all `${var}` placeholders
- `interpolate` leaves unknown variables as-is (graceful degradation)
- `evaluateCondition` correctly handles all operators
- `pickFlavor` returns a string for every category
- Template conditions correctly filter candidates
- Recently-used tracking prevents immediate repeats

### Snapshot Tests
- Given fixed state + seed, `pickFlavor` returns deterministic text
- All templates compile without residual placeholders (integration check)

### Content Validation (Script)
- Every template string has balanced `${}` braces
- Every variable used in templates exists in `FlavorContext`
- Every category has at least 3 templates

---

*See also: [Data Models](../data-models.md), [Procedural Generation](./procedural-generation.md)*
