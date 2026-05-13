# Testing Strategy

> **Test Runner**: Vitest
>
> **Philosophy**: Pure functions make testing trivial. Test behavior, not implementation. Deterministic PRNG for reproducibility.

---

## Testing Principles

1. **Every pure function in `systems/` and `generation/` must have unit tests.**
2. **Tests use seeded PRNG** — given the same seed, outputs are identical.
3. **No mocking of game logic** — systems are pure functions, just call them with test state.
4. **Snapshot tests for generated content** — ensures generation doesn't silently change.
5. **Integration tests for cross-system interactions** — travel → encounter → combat → loot → inventory.
6. **Property-based tests for invariants** — "breakthrough chance is always between 0 and 1."

---

## Test Structure

```
tests/
├── unit/
│   ├── systems/
│   │   ├── CultivationSystem.test.ts
│   │   ├── CombatSystem.test.ts
│   │   ├── WorldSystem.test.ts
│   │   ├── TravelSystem.test.ts
│   │   ├── EncounterSystem.test.ts
│   │   ├── InventorySystem.test.ts
│   │   ├── MerchantSystem.test.ts
│   │   └── FlavorEngine.test.ts
│   ├── generation/
│   │   ├── PRNG.test.ts
│   │   ├── NameGenerator.test.ts
│   │   ├── WeaponGenerator.test.ts
│   │   ├── TechniqueGenerator.test.ts
│   │   ├── BeastGenerator.test.ts
│   │   └── ItemGenerator.test.ts
│   └── persistence/
│       ├── SaveManager.test.ts
│       ├── Serializer.test.ts
│       └── OfflineCatchUp.test.ts
├── integration/
│   ├── GameLoop.test.ts
│   ├── TravelAndEncounter.test.ts
│   └── FullCultivationCycle.test.ts
├── fixtures/
│   ├── state-fixtures.ts
│   ├── beast-fixtures.ts
│   ├── item-fixtures.ts
│   ├── location-fixtures.ts
│   └── seed-fixtures.ts
└── utils/
    └── test-helpers.ts
```

---

## Test Helpers

```typescript
// tests/utils/test-helpers.ts
import { PRNG } from '@generation/PRNG';
import { GameState, PlayerState } from '@core/types';
import { createInitialState } from '@state/GameState';
import { defaultConfig } from '@data/config';

/** Fixed seed for deterministic tests */
export const TEST_SEED = 12345;

/** Create a fresh game state for testing */
export function createTestState(overrides?: Partial<PlayerState>): GameState {
  const state = createInitialState(defaultConfig);
  if (overrides) {
    state.player = { ...state.player, ...overrides };
  }
  return state;
}

/** Create a PRNG with the test seed */
export function createTestRNG(seed: number = TEST_SEED): PRNG {
  return new PRNG(seed);
}

/** Create a player at a specific cultivation level */
export function createPlayerAtRealm(realm: number, subStage: number = 1): PlayerState {
  const state = createTestState();
  return {
    ...state.player,
    realm,
    subStage,
    currentQi: 999999, // Enough for any breakthrough
  };
}

/** Assert two game states are deeply equal (ignoring tick/timestamp) */
export function assertStateEqual(actual: GameState, expected: GameState, message?: string): void {
  // Strip volatile fields
  const strip = (s: GameState) => ({ ...s, tick: 0, rngState: 0 });
  expect(strip(actual)).toEqual(strip(expected));
}

/** Run a function N times with fresh RNG each time, collect results */
export function runMultipleTimes<T>(
  fn: (rng: PRNG) => T,
  count: number = 1000
): T[] {
  const results: T[] = [];
  for (let i = 0; i < count; i++) {
    results.push(fn(new PRNG(i)));
  }
  return results;
}
```

---

## Unit Test Examples

### CultivationSystem.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { CultivationSystem } from '@systems/CultivationSystem';
import { createTestState, createTestRNG } from '../utils/test-helpers';

describe('CultivationSystem', () => {
  describe('tick', () => {
    it('accumulates Qi when cultivating', () => {
      const state = createTestState({ action: 'cultivating' });
      const newState = CultivationSystem.tick(state, defaultConfig.cultivation);

      expect(newState.player.currentQi).toBeGreaterThan(state.player.currentQi);
    });

    it('does NOT accumulate Qi when in combat', () => {
      const state = createTestState({
        action: 'in_combat',
        currentQi: 50,
      });
      const newState = CultivationSystem.tick(state, defaultConfig.cultivation);

      expect(newState.player.currentQi).toBe(50);
    });

    it('applies location qi density bonus', () => {
      // Set up state at a high-qi-density location
      const state = createTestState({ action: 'cultivating' });
      state.world.currentNodeId = 'misty_peaks'; // qiDensity = 45

      const stateLowQi = createTestState({ action: 'cultivating' });
      stateLowQi.world.currentNodeId = 'azure_cloud_village'; // qiDensity = 10

      const gainHigh = CultivationSystem.tick(state, defaultConfig.cultivation).player.currentQi;
      const gainLow = CultivationSystem.tick(stateLowQi, defaultConfig.cultivation).player.currentQi;

      expect(gainHigh).toBeGreaterThan(gainLow);
    });
  });

  describe('attemptBreakthrough', () => {
    it('succeeds when RNG favors and Qi is sufficient', () => {
      const rng = createTestRNG(99999); // Known seed that produces success
      const state = createTestState({
        realm: 0,
        subStage: 1,
        currentQi: 1000, // More than enough for Qi Condensation
        comprehension: 100,
      });

      const newState = CultivationSystem.attemptBreakthrough(state, rng, defaultConfig.cultivation);

      // Should have advanced sub-stage
      expect(newState.player.subStage).toBeGreaterThan(state.player.subStage);
    });

    it('fails when Qi is below capacity', () => {
      const state = createTestState({
        realm: 0,
        currentQi: 5, // Way too low
      });

      const result = CultivationSystem.attemptBreakthrough(state, createTestRNG(), defaultConfig.cultivation);

      // State should be unchanged
      expect(result.player.realm).toBe(state.player.realm);
      expect(result.player.subStage).toBe(state.player.subStage);
    });

    it('is deterministic with same seed', () => {
      const run1 = CultivationSystem.attemptBreakthrough(
        createTestState({ currentQi: 1000 }),
        createTestRNG(42),
        defaultConfig.cultivation
      );
      const run2 = CultivationSystem.attemptBreakthrough(
        createTestState({ currentQi: 1000 }),
        createTestRNG(42),
        defaultConfig.cultivation
      );

      expect(run1.player.realm).toBe(run2.player.realm);
      expect(run1.player.subStage).toBe(run2.player.subStage);
    });
  });

  describe('calculateBreakthroughChance', () => {
    it('returns 0–1 for all reasonable inputs', () => {
      for (let realm = 0; realm < 7; realm++) {
        for (let comp = 0; comp <= 100; comp += 10) {
          const player = createPlayerAtRealm(realm);
          player.comprehension = comp;
          const chance = CultivationSystem.calculateBreakthroughChance(player, defaultConfig.cultivation);
          expect(chance).toBeGreaterThanOrEqual(0);
          expect(chance).toBeLessThanOrEqual(1);
        }
      }
    });

    it('increases with higher comprehension', () => {
      const lowComp = { ...createPlayerAtRealm(1), comprehension: 5 };
      const highComp = { ...createPlayerAtRealm(1), comprehension: 50 };

      const lowChance = CultivationSystem.calculateBreakthroughChance(lowComp, defaultConfig.cultivation);
      const highChance = CultivationSystem.calculateBreakthroughChance(highComp, defaultConfig.cultivation);

      expect(highChance).toBeGreaterThan(lowChance);
    });
  });
});
```

### CombatSystem.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { CombatSystem } from '@systems/CombatSystem';
import { createTestState, createTestRNG } from '../utils/test-helpers';
import { createBeast } from '../fixtures/beast-fixtures';

describe('CombatSystem', () => {
  describe('calculateDamage', () => {
    it('deals at least 1 damage when attack > defense', () => {
      const input = {
        attackerAttack: 20,
        defenderDefense: 5,
        techniqueMultiplier: 1.0,
        elementalAdvantage: 1.0,
        critChance: 0,
        critMultiplier: 2.0,
        dodgeChance: 0,
        speedDiff: 0,
      };

      const result = CombatSystem.calculateDamage(input, createTestRNG());
      expect(result.actualDamage).toBeGreaterThanOrEqual(1);
    });

    it('crit doubles damage', () => {
      const rng = createTestRNG(77777); // Known seed that crits
      const input = {
        attackerAttack: 20,
        defenderDefense: 0,
        techniqueMultiplier: 1.0,
        elementalAdvantage: 1.0,
        critChance: 1.0, // Always crit
        critMultiplier: 2.0,
        dodgeChance: 0,
        speedDiff: 0,
      };

      const result = CombatSystem.calculateDamage(input, rng);
      expect(result.isCrit).toBe(true);
      expect(result.actualDamage).toBeGreaterThanOrEqual(40); // 20 * 2.0
    });

    it('dodge results in 0 damage', () => {
      const input = {
        attackerAttack: 100,
        defenderDefense: 0,
        techniqueMultiplier: 5.0,
        elementalAdvantage: 1.0,
        critChance: 0,
        critMultiplier: 2.0,
        dodgeChance: 1.0, // Always dodge
        speedDiff: 0,
      };

      const result = CombatSystem.calculateDamage(input, createTestRNG());
      expect(result.isDodge).toBe(true);
      expect(result.actualDamage).toBe(0);
    });
  });

  describe('elementalAdvantage', () => {
    it('fire beats metal', () => {
      const result = CombatSystem.getElementalAdvantage('fire', 'metal');
      expect(result).toBe(1.5);
    });

    it('metal is weak to fire', () => {
      const result = CombatSystem.getElementalAdvantage('metal', 'fire');
      expect(result).toBe(0.75);
    });

    it('neutral when no elements', () => {
      const result = CombatSystem.getElementalAdvantage(null, null);
      expect(result).toBe(1.0);
    });
  });

  describe('full combat simulation', () => {
    it('player defeats weaker beast', () => {
      const state = createTestState({
        attack: 50,
        defense: 20,
        health: 500,
        maxHealth: 500,
        speed: 15,
      });
      const beast = createBeast({ tier: 1, health: 30, attack: 3 });

      let combatState = CombatSystem.initiateCombat(state, beast);
      const rng = createTestRNG();

      // Resolve until end
      for (let i = 0; i < 50; i++) {
        if (combatState.player.combatState?.status !== 'active') break;
        combatState = CombatSystem.tickCombat(combatState, rng, defaultConfig.combat);
      }

      expect(combatState.player.combatState?.status).toBe('player_won');
      expect(combatState.player.inCombat).toBe(false);
    });

    it('beast defeats weaker player', () => {
      const state = createTestState({
        attack: 3,
        defense: 2,
        health: 20,
        maxHealth: 20,
        speed: 1,
      });
      const beast = createBeast({ tier: 10, health: 500, attack: 50 });

      let combatState = CombatSystem.initiateCombat(state, beast);
      const rng = createTestRNG();

      for (let i = 0; i < 50; i++) {
        if (combatState.player.combatState?.status !== 'active') break;
        combatState = CombatSystem.tickCombat(combatState, rng, defaultConfig.combat);
      }

      expect(combatState.player.combatState?.status).toBe('enemy_won');
    });
  });
});
```

---

## Snapshot Testing

Use Vitest's `toMatchSnapshot()` for generated content:

```typescript
describe('WeaponGenerator', () => {
  it('produces consistent weapons with same seed', () => {
    const rng = createTestRNG(42);
    const weapon = WeaponGenerator.generate({ tier: 5 }, rng);

    // Snapshot the entire weapon object
    expect(weapon).toMatchSnapshot();
    // If generation logic changes, snapshot will fail — review and update intentionally
  });

  it('generates valid weapon names', () => {
    const names = runMultipleTimes(rng => {
      return WeaponGenerator.generate({ tier: 3 }, rng).name;
    }, 100);

    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
      expect(name.length).toBeLessThan(50); // No absurdly long names
      expect(name).not.toContain('undefined');
      expect(name).not.toContain('null');
      expect(name).not.toContain('${');   // No un-interpolated placeholders
    }
  });
});
```

---

## Property-Based Testing

For invariants that must always hold:

```typescript
describe('property-based', () => {
  it('breakthroughChance is always in [0, 1]', () => {
    // Generate random player states and verify
    // (Can use fast-check library or simple loops)
    for (let seed = 0; seed < 1000; seed++) {
      const rng = new PRNG(seed);
      const realm = rng.nextInt(0, 6);
      const player = createPlayerAtRealm(realm);
      player.comprehension = rng.nextInt(0, 100);
      player.luck = rng.nextInt(0, 50);

      const chance = CultivationSystem.calculateBreakthroughChance(player, defaultConfig.cultivation);
      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(1);
    }
  });

  it('combat damage is never negative', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const rng = new PRNG(seed);
      const input = {
        attackerAttack: rng.nextInt(0, 500),
        defenderDefense: rng.nextInt(0, 500),
        techniqueMultiplier: rng.next() * 5,
        elementalAdvantage: rng.nextFrom([0.75, 1.0, 1.5]),
        critChance: rng.next(),
        critMultiplier: 1.5 + rng.next(),
        dodgeChance: rng.next(),
        speedDiff: rng.nextInt(-20, 20),
      };

      const result = CombatSystem.calculateDamage(input, rng);
      expect(result.actualDamage).toBeGreaterThanOrEqual(0);
    }
  });
});
```

---

## Integration Tests

Test multiple systems working together:

```typescript
describe('Travel → Encounter → Combat → Loot cycle', () => {
  it('completes full cycle', () => {
    let state = createTestState();
    const rng = createTestRNG();

    // Start travel
    const travelResult = TravelSystem.startTravel(state, 'green_jade_city');
    expect(travelResult.success).toBe(true);
    state = travelResult.state!;

    // Simulate travel ticks
    for (let i = 0; i < 3600; i++) { // 1 hour of ticks
      state = TravelSystem.tickTravel(state);

      // Check for encounter
      if (state.tick % 60 === 0) {
        state = EncounterSystem.tickEncounters(state, rng, defaultConfig.world);
      }

      // If combat started, resolve it
      if (state.player.inCombat) {
        while (state.player.combatState?.status === 'active') {
          state = CombatSystem.tickCombat(state, rng, defaultConfig.combat);
        }

        if (state.player.combatState?.status === 'player_won') {
          expect(state.player.inventory.length).toBeGreaterThan(0); // Got loot
          expect(state.player.spiritStones).toBeGreaterThan(0);
        }
      }
    }

    // Should have arrived (3600s travel time)
    expect(state.world.currentNodeId).toBe('green_jade_city');
    expect(state.world.travelState).toBeNull();
  });
});
```

---

## Fixture Files

Pre-built data for consistent tests:

```typescript
// tests/fixtures/state-fixtures.ts
import { GameState } from '@core/types';

export const freshStartState: GameState = createInitialState(defaultConfig);

export const midGameState: GameState = createInitialState(defaultConfig);
midGameState.player.realm = 2; // Foundation Establishment
midGameState.player.subStage = 5;
midGameState.player.currentQi = 500;
midGameState.player.spiritStones = 200;
midGameState.player.attack = 30;
midGameState.player.defense = 15;

// ... more presets

// tests/fixtures/seed-fixtures.ts
export const SEEDS = {
  alwaysCrit: 77777,
  alwaysDodge: 88888,
  breakthroughSuccess: 99999,
  breakthroughFail: 11111,
  rareDrop: 44444,
  bossEncounter: 55555,
  ancientInheritance: 66666,
};
```

---

## Running Tests

```bash
# All tests
npm test

# Watch mode (dev)
npm run test:watch

# Coverage
npm run test:coverage

# Single file
npx vitest tests/unit/systems/CultivationSystem.test.ts

# Specific test
npx vitest -t "accumulates Qi when cultivating"
```

---

## Coverage Goals

| Area | Target |
|------|--------|
| `systems/` | >95% line coverage |
| `generation/` | >90% line coverage |
| `persistence/` | >85% line coverage |
| `core/` (engine) | >70% line coverage (I/O-heavy) |
| `ui/` | Manual testing (DOM is hard to unit test) |
| **Overall** | >85% line coverage |

---

## Continuous Integration

Future: GitHub Actions to run tests on push:

```yaml
# .github/workflows/test.yml (future)
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --coverage
```

---

*See also: [Architecture](../architecture.md), [Project Structure](../project-structure.md)*
