# Architecture — Deep Dive

> **Pattern**: Pure Functional Core + Imperative Shell
>
> **Mantra**: Game logic is pure functions. Side effects live at the boundary.

---

## Layer Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│                                                              │
│  index.html  ──  CSS styles  ──  UI Components (DOM)        │
│                                                              │
│  Responsibilities: render state to DOM, capture user input   │
│  Dependencies: reads GameState, emits PlayerAction           │
└──────────────────────────┬───────────────────────────────────┘
                           │ PlayerAction
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                      │
│                                                              │
│  GameEngine ── orchestrates tick, routes actions to systems │
│  EventBus   ── typed pub/sub for cross-cutting concerns      │
│  GameClock  ── requestAnimationFrame / setInterval driver    │
│                                                              │
│  Responsibilities: coordinate the loop, wire I/O to logic    │
│  Dependencies: Systems, SaveManager, Renderer                │
└──────────────────────────┬───────────────────────────────────┘
                           │ GameState + params
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER (Pure)                     │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Cultivation    │  │ Combat       │  │ World          │   │
│  │ System         │  │ System       │  │ System         │   │
│  │                │  │              │  │                │   │
│  │ tick()         │  │ resolve()    │  │ travel()       │   │
│  │ breakthrough() │  │ damage()     │  │ moveTo()       │   │
│  └────────────────┘  └──────────────┘  └────────────────┘   │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Encounter      │  │ Inventory    │  │ Flavor         │   │
│  │ System         │  │ System       │  │ Engine         │   │
│  │                │  │              │  │                │   │
│  │ rollTable()    │  │ equip()      │  │ generate()     │   │
│  │ resolveEvent() │  │ canEquip()   │  │ pickTemplate() │   │
│  └────────────────┘  └──────────────┘  └────────────────┘   │
│                                                              │
│  Responsibilities: ALL game rules, pure transformations      │
│  Signature: (GameState, ...params) => GameState              │
│  Dependencies: NONE (only other pure functions, data)        │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│                                                              │
│  realms.ts       locations.ts     races.ts                  │
│  templates/      flavor-templates.ts                        │
│  weapon-templates.ts  technique-templates.ts                │
│  beast-templates.ts                                         │
│                                                              │
│  Responsibilities: static data, config, templates            │
│  Dependencies: NONE (pure data)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## State Management

### Single Immutable State Tree

```typescript
// The entire game is one value.
interface GameState {
  readonly version: number;          // Schema version for migrations
  readonly tick: number;             // Monotonic tick counter
  readonly rngState: number;         // PRNG seed state
  readonly player: PlayerState;
  readonly world: WorldState;
  readonly log: GameLog;
  readonly flags: Record<string, boolean>; // One-shot event flags
}
```

### State Updates

Systems are **reducer-like** functions:

```typescript
// Every system follows this pattern:
type SystemFn<S extends GameState, P = void> = (state: S, params: P) => S;

// Example:
function cultivateTick(state: GameState, delta: number): GameState {
  if (state.player.action !== 'cultivating') return state;

  const qiGained = calculateQiGain(state.player, state.world, delta);
  const newPlayer = { ...state.player, currentQi: state.player.currentQi + qiGained };

  return { ...state, player: newPlayer };
}
```

### Immer for Readable Updates (Optional)

For deeply nested updates, Immer's `produce` makes code more readable:

```typescript
import { produce } from 'immer';

function cultivateTick(state: GameState, delta: number): GameState {
  return produce(state, draft => {
    if (draft.player.action !== 'cultivating') return;
    draft.player.currentQi += calculateQiGain(draft.player, draft.world, delta);
  });
}
```

Both patterns are testable. The choice is a team preference.

---

## Event Bus

### Why an Event Bus?

Some concerns cut across multiple systems:
- The UI needs to know when combat ends (for animation/flash)
- The save system wants to debounce saves after state changes
- Achievements check conditions after every tick

Instead of systems calling each other (tight coupling), they emit typed events. The bus routes them to subscribers.

### Typed Event Bus

```typescript
// events.ts
interface GameEventMap {
  'tick:completed': { tick: number };
  'combat:started': { enemy: Beast; player: PlayerState };
  'combat:ended': { result: CombatResult };
  'cultivation:breakthrough': { newRealm: string; newSubStage: number };
  'travel:arrived': { location: LocationNode };
  'encounter:triggered': { encounter: Encounter };
  'item:acquired': { item: Item };
  'state:changed': { state: GameState };
}

type EventBus = {
  on<K extends keyof GameEventMap>(event: K, handler: (data: GameEventMap[K]) => void): void;
  emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void;
  off<K extends keyof GameEventMap>(event: K, handler: (data: GameEventMap[K]) => void): void;
};
```

The `GameEngine` holds the bus instance and passes it to the imperative shell components. Systems do NOT access the bus — they return log events in the state, which the engine then emits.

---

## Game Loop

### Tick Flow

```
Every 1000ms (or accelerated for catch-up):

1. GameClock.tick()
   │
2. GameEngine.processTick()
   │
   ├─ Update game time: state.tick += 1; advance PRNG
   │
   ├─ Run systems IN ORDER (order matters!):
   │   ├─ WorldSystem.tick(state)       // Travel progress, arrival
   │   ├─ EncounterSystem.tick(state)   // Check for random encounters
   │   ├─ CombatSystem.tick(state)      // Resolve in-progress combat rounds
   │   ├─ CultivationSystem.tick(state) // Passive cultivation, breakthrough checks
   │   └─ CleanupSystem.tick(state)     // Expire log entries, etc.
   │
   ├─ Extract new events from state.log delta
   │
   ├─ Emit events via EventBus
   │
   ├─ Persist state (debounced, every 30s)
   │
   └─ Return new state (Renderer reads it on next frame)
```

### System Execution Order Rationale

| Order | System | Why |
|-------|--------|-----|
| 1 | World/Travel | Must process arrivals before encounters (arriving triggers encounters) |
| 2 | Encounter | Can interrupt travel/cultivation, spawns combat |
| 3 | Combat | Must resolve before cultivation (being in combat blocks cultivation) |
| 4 | Cultivation | Passive ticks only if not in combat/travel |
| 5 | Cleanup | Expire old log entries, decay temporary effects |

---

## Player Actions (Input)

Player actions are **not** directly mutating state. They are dispatched as action objects:

```typescript
type PlayerAction =
  | { type: 'TRAVEL_TO'; destinationId: string }
  | { type: 'START_CULTIVATING' }
  | { type: 'ATTEMPT_BREAKTHROUGH' }
  | { type: 'EQUIP_WEAPON'; itemId: string }
  | { type: 'UNEQUIP_WEAPON' }
  | { type: 'LEARN_TECHNIQUE'; techniqueId: string }
  | { type: 'USE_ITEM'; itemId: string }
  | { type: 'BUY_ITEM'; itemId: string; merchantId: string }
  | { type: 'SELL_ITEM'; itemId: string; merchantId: string }
  | { type: 'FLEE_COMBAT' }
  | { type: 'REST' };
```

The `GameEngine.processAction(action)` method routes the action to the appropriate system, which returns a new state (or the same state if the action is invalid).

```typescript
processAction(state: GameState, action: PlayerAction): GameState {
  switch (action.type) {
    case 'TRAVEL_TO':
      return WorldSystem.startTravel(state, action.destinationId);
    case 'ATTEMPT_BREAKTHROUGH':
      return CultivationSystem.attemptBreakthrough(state);
    // ... etc
  }
}
```

---

## Dependency Injection

### Pattern: Parameter-Based

No global singletons. Every function receives what it needs:

```typescript
// BAD: implicit global
import { currentState } from './state';
function tick() { currentState.player.qi += 1; }

// GOOD: explicit parameter
function tick(state: GameState): GameState {
  return { ...state, player: { ...state.player, qi: state.player.qi + 1 } };
}
```

### Config Injection

Game balance values (realm thresholds, drop rates, damage formulas) are passed as a `GameConfig` object:

```typescript
interface GameConfig {
  cultivation: CultivationConfig;
  combat: CombatConfig;
  world: WorldConfig;
  generation: GenerationConfig;
}

function calculateBreakthroughChance(
  player: PlayerState,
  config: CultivationConfig,
  rng: PRNG
): number {
  // Uses config.breakthroughBaseChance, config.comprehensionWeight, etc.
}
```

This enables:
- **Testing**: Pass different configs to test edge cases
- **Balancing**: Tweak numbers in one file
- **Difficulty modes**: Swap config for "hard mode"

---

## Error Handling

### Principle: Never Throw in Game Logic

Invalid player actions (equipping while in combat, traveling without enough stones) should not throw. Instead:

```typescript
type ActionResult<T> =
  | { success: true; state: T; message: string }
  | { success: false; message: string };

function equipWeapon(state: GameState, weaponId: string): ActionResult<GameState> {
  const weapon = state.player.inventory.find(i => i.id === weaponId);
  if (!weapon) return { success: false, message: "Item not found." };
  if (weapon.type !== 'weapon') return { success: false, message: "Not a weapon." };
  if (state.player.inCombat) return { success: false, message: "Cannot equip in combat!" };
  // ...
  return { success: true, state: newState, message: `Equipped ${weapon.name}.` };
}
```

The UI layer checks `success` and either updates the display or shows a toast/error.

---

## Performance Considerations

### Tick Budget
- Target: **<5ms per tick** (leaves 11ms for rendering at 60fps)
- Heavy computations (procedural generation) only happen on encounter triggers, not every tick
- Object creation is acceptable (immutable pattern creates new objects) — JavaScript GC is fast for short-lived objects

### State Size
- Keep log array capped (last 100 entries)
- Inventory capped (e.g., 50 items) — force selling/discarding
- No memory leaks: event bus listeners removed on UI teardown

### Offline Catch-Up
Don't simulate 28,800 ticks (8 hours) one-by-one. Batch compute:
- Calculate total Qi gained over elapsed time
- Sample encounters probabilistically (e.g., roll once per hour, not per second)
- Batch-resolve combat with expected-value shortcuts

---

## Module Boundaries

### What Each Module Owns

| Module | Owns | Does Not Own |
|--------|------|--------------|
| `CultivationSystem` | Qi calculation, breakthrough logic, realm data | UI rendering, saving |
| `CombatSystem` | Damage formulas, combat resolution | Encounter triggering, loot generation |
| `WorldSystem` | Location graph, travel state | Encounter tables (owned by EncounterSystem) |
| `EncounterSystem` | Encounter tables, event resolution | Combat details (delegates to CombatSystem) |
| `InventorySystem` | Item CRUD, equipment slots, carry capacity | Item generation (owned by generators) |
| `FlavorEngine` | Template interpolation, text selection | When to show flavor (owned by other systems) |
| `SaveManager` | Serialization, localStorage, migration | Game logic |

### Cross-Module Communication

Modules communicate **only through state**. If `EncounterSystem` triggers combat, it writes `player.inCombat = true` and `player.combatState = { ... }` into the state. `CombatSystem.tick()` sees this and resolves it on the next tick. No direct function calls between systems.

---

*See also: [Data Models](./data-models.md), [Testing Strategy](./testing-strategy.md)*
