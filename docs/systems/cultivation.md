# Cultivation System

> **Module**: `src/systems/CultivationSystem.ts`
>
> **Type**: Pure functions, no side effects
>
> **Signature**: `(state: GameState, params?) => GameState`

---

## Overview

The Cultivation System is the primary progression mechanic. The player gathers Qi over time, fills their capacity, and attempts breakthroughs to advance through cultivation realms and sub-stages. This is the "idle" heart of the game — cultivation happens passively whenever the player is not in combat or traveling.

---

## Core Mechanics

### 1. Qi Accumulation

```
qiGainedPerTick = cultivationSpeed × realmMultiplier × locationBonus × activeBonus
```

Where:
- **cultivationSpeed**: Player's base stat (modified by race, equipment, pills)
- **realmMultiplier**: Increases with realm (higher realms = faster gathering)
- **locationBonus**: Based on current location's `qiDensity` (0.0 to 1.0 bonus)
- **activeBonus**: ×1.0 normally, ×1.5 if player is actively cultivating (action = `'cultivating'`)

**Default rate at Mortal**: ~1 Qi/tick in a village. At Nascent Soul in a qi-dense cave: ~50+ Qi/tick.

### 2. Qi Capacity

```
qiCapacity = baseCapacity[realm] + (subStage × qiPerSubStage[realm])
```

Each realm has a `qiCapacity`. When `currentQi ≥ qiCapacity`, the player is ready to attempt a breakthrough. Excess Qi is NOT wasted — it carries over (but see breakthrough below).

### 3. Breakthrough

**Trigger**: Player action `ATTEMPT_BREAKTHROUGH` (manual click) or auto-breakthrough if config allows.

**Formula**:
```
successChance = baseChance[realm]
              + (comprehension × comprehensionWeight)
              + (luck × luckWeight)
              + pillBonus
              - bottleneckPenalty
```

#### Breakthrough Outcomes

| Outcome | Chance | Effect |
|---------|--------|--------|
| **Perfect Breakthrough** | successChance × 0.2 | Advance 1 sub-stage, +temporary stat buff |
| **Normal Breakthrough** | successChance × 0.8 | Advance 1 sub-stage |
| **Tribulation Triggered** | tribulationChance | Mini-event: survive or regress |
| **Bottleneck** | bottleneckChance | Cannot advance until "opportunity" found |
| **Failure** | 1 - successChance | Qi reduced by 50%, cannot retry for cooldown |
| **Qi Deviation** | failureChance × 0.1 | Qi reduced to 0, health damage, temporary debuff |

#### Sub-Stage Advancement

- When sub-stage reaches max (usually 9), the next breakthrough advances to the **next realm**.
- Advancing to a new realm resets sub-stage to 1.
- Realm advancement grants permanent stat bonuses (`StatBonus` on the realm definition).

### 4. Tribulation

When tribulation triggers during breakthrough:

```typescript
function resolveTribulation(state: GameState, rng: PRNG): GameState {
  const difficulty = calculateTribulationDifficulty(state.player.realm);
  const playerPower = state.player.health + state.player.defense;
  const survived = rng.next() < (playerPower / (playerPower + difficulty));

  if (survived) {
    // Breakthrough succeeds with bonus
    return applyBreakthrough(state, { bonus: true, tribulationSurvived: true });
  } else {
    // Breakthrough fails catastrophically
    return applyQiDeviation(state);
  }
}
```

Tribulation types (flavor only, same mechanics):
- **Lightning Tribulation**: Common, raw damage check
- **Inner Demon**: Rare, comprehension check instead of health
- **Heavenly Trial**: Epic, requires both

### 5. Bottleneck System

Bottlenecks gate progression at certain realm boundaries (classic xianxia trope):

| Realm Boundary | Bottleneck Chance | Requires |
|----------------|-------------------|----------|
| Mortal → Qi Condensation | 0% | None (tutorial) |
| Qi Condensation → Foundation | 30% | Foundation Pill or special encounter |
| Foundation → Core Formation | 40% | Golden Core opportunity (rare encounter) |
| Core Formation → Nascent Soul | 50% | Soul Nurturing Treasure |
| Nascent Soul → Spirit Severing | 60% | Severing Insight (special location or technique) |
| Spirit Severing → Dao Seeking | 70% | Dao Comprehension event |
| Dao Seeking → Immortal | 80% | Heaven's Mandate (legendary encounter) |

When bottlenecked, the player receives a quest-like flag: "Seek a Foundation Establishment opportunity." Certain encounters, merchants, or locations can resolve bottlenecks.

---

## API

```typescript
// ─── Main tick ────────────────────────────

/**
 * Called every game tick. Accumulates Qi if cultivating or idling.
 * Checks for auto-breakthrough conditions if enabled.
 */
function tick(state: GameState, config: CultivationConfig): GameState;

// ─── Breakthrough ─────────────────────────

/**
 * Attempt a breakthrough. Uses RNG for success chance.
 * Returns new state with result logged.
 */
function attemptBreakthrough(state: GameState, rng: PRNG, config: CultivationConfig): GameState;

/**
 * Calculate the player's current breakthrough success chance (0–1).
 * Pure computation, no side effects. Useful for UI display.
 */
function calculateBreakthroughChance(player: PlayerState, config: CultivationConfig): number;

/**
 * Check if player is currently bottlenecked.
 */
function isBottlenecked(player: PlayerState): boolean;

/**
 * Resolve a bottleneck when player finds the required item/opportunity.
 */
function resolveBottleneck(state: GameState, opportunity: BottleneckOpportunity): GameState;

// ─── Tribulation ──────────────────────────

/**
 * Resolve a tribulation event.
 */
function resolveTribulation(state: GameState, rng: PRNG): GameState;

// ─── Qi Calculations ──────────────────────

/**
 * Calculate Qi gained per tick.
 */
function calculateQiPerTick(player: PlayerState, location: LocationNode, config: CultivationConfig): number;

/**
 * Calculate current Qi capacity.
 */
function calculateQiCapacity(player: PlayerState, realms: Realm[]): number;

/**
 * Calculate progress to next breakthrough as percentage (0–100).
 */
function getBreakthroughProgress(player: PlayerState, realms: Realm[]): number;
```

---

## State Transitions

```
IDLE ──▶ CULTIVATING (player clicks "Cultivate")
   │           │
   │           ├──▶ tick: qi += gain
   │           ├──▶ qi ≥ capacity: can attempt breakthrough
   │           ├──▶ breakthrough success: subStage++ (or realm++)
   │           ├──▶ breakthrough failure: qi halved, cooldown
   │           ├──▶ tribulation: passed or qi deviation
   │           └──▶ interrupted (combat, travel): back to IDLE
   │
   └──▶ IDLE: still gains qi at reduced rate (passive cultivation)
```

---

## Flavor Text Categories

| Category | Triggers |
|----------|----------|
| `cultivation_start` | Player begins cultivating |
| `cultivation_progress` | Every N ticks while cultivating (periodic) |
| `breakthrough_success` | Successful breakthrough |
| `breakthrough_failure` | Failed breakthrough |
| `tribulation` | Tribulation event (survived or not) |
| `bottleneck_discovery` | Finding a bottleneck resolution opportunity |
| `qi_deviation` | Qi Deviation event |

---

## Balance Levers (CultivationConfig)

```typescript
interface CultivationConfig {
  baseSpeedPerTick: number;             // 1.0 — Base Qi per tick at Mortal
  realmSpeedMultiplier: number[];       // [1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 15.0]
  locationSpeedBonus: number;           // 0.5 — Max bonus from qiDensity
  passiveMultiplier: number;            // 0.3 — Qi rate when not actively cultivating
  activeMultiplier: number;             // 1.5 — Bonus for active cultivation
  comprehensionWeight: number;          // 0.02 — Per point of comprehension
  luckWeight: number;                   // 0.01 — Per point of luck
  tribulationChance: number;            // 0.15 — Base tribulation chance
  bottleneckBaseChance: number;         // See bottleneck table
  breakthroughCooldownTicks: number;    // 30 — Ticks before can retry after failure
  qiDeviationChance: number;            // 0.10 — Chance of deviation on failure
  autoBreakthrough: boolean;            // false — Whether to auto-attempt
}
```

---

## Testing Strategy

### Unit Tests
- `tick()` increments Qi correctly based on stats
- `tick()` does NOT accumulate Qi when in combat
- `tick()` applies location bonus correctly
- `attemptBreakthrough()` with seeded RNG produces deterministic results
- `attemptBreakthrough()` fails when Qi below capacity
- `calculateBreakthroughChance()` returns correct values
- `isBottlenecked()` returns true at correct realm transitions
- `resolveBottleneck()` clears the flag
- `resolveTribulation()` correctly handles survive/die paths
- Realm advancement grants correct stat bonuses
- Qi capacity calculation correct for each realm/sub-stage

### Integration Tests
- Full cycle: cultivate → reach capacity → breakthrough → advance
- Bottleneck → find opportunity → resolve → breakthrough
- Tribulation survival grants breakthrough bonus
- Qi deviation properly damages player

### Property-Based Tests
- Qi per tick is always non-negative
- Breakthrough chance is always in [0, 1]
- Qi never exceeds capacity by more than 1 tick's gain (no overflow waste)
- Sub-stage always in [1, realm.subStages]

---

*See also: [Data Models](../data-models.md), [Cultivation Paths](./cultivation-paths.md), [Combat System](./combat.md)*
