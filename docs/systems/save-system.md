# Save System

> **Modules**: `src/persistence/SaveManager.ts`, `src/persistence/OfflineCatchUp.ts`, `src/persistence/Serializer.ts`
>
> **Type**: Imperative shell (localStorage I/O) + pure catch-up logic
>
> **Signature**: Varies — persistence layer wraps pure functions

---

## Overview

The save system provides:
1. **Persistence**: Save/load game state to `localStorage`
2. **Offline Catch-Up**: Simulate elapsed time when player returns
3. **Schema Migration**: Handle version changes in save data format
4. **Auto-Save**: Periodic saves without player action
5. **Export/Import**: (Future) shareable save files

---

## 1. Save Format

### Storage Key

```typescript
const SAVE_KEY = 'idle_cultivation_sect_save';
const SAVE_BACKUP_KEY = 'idle_cultivation_sect_save_backup';
const SETTINGS_KEY = 'idle_cultivation_sect_settings';
```

### Serialized Data (SaveData)

```typescript
interface SaveData {
  version: number;                // Schema version
  timestamp: number;              // Date.now() at save time
  tick: number;                   // Game tick counter
  rngState: number;               // PRNG seed state
  player: PlayerState;
  world: WorldState;              // Excludes UIState (transient)
  flags: Record<string, boolean>;
  achievements: string[];
  stats: PlayerStats;
  flavorState: FlavorState;
}
```

### What is NOT saved

- `UIState` — rebuilt fresh on load (active tab, selected items, etc.)
- `GameConfig` — loaded from static config (but version-checked)
- Temporary combat state — combat is resolved or abandoned on save

---

## 2. Save Manager

```typescript
// src/persistence/SaveManager.ts

export class SaveManager {
  private lastSaveTime: number = 0;
  private autoSaveInterval: number;

  constructor(autoSaveInterval: number = 30) {  // 30 ticks = 30 seconds
    this.autoSaveInterval = autoSaveInterval;
  }

  /** Serialize and write state to localStorage */
  save(state: GameState): boolean {
    try {
      const data: SaveData = Serializer.toSaveData(state);
      const json = JSON.stringify(data);

      // Backup previous save before overwriting
      const previous = localStorage.getItem(SAVE_KEY);
      if (previous) {
        localStorage.setItem(SAVE_BACKUP_KEY, previous);
      }

      localStorage.setItem(SAVE_KEY, json);
      this.lastSaveTime = Date.now();
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      // Attempt to restore backup
      const backup = localStorage.getItem(SAVE_BACKUP_KEY);
      if (backup) {
        localStorage.setItem(SAVE_KEY, backup);
      }
      return false;
    }
  }

  /** Load and deserialize state from localStorage */
  load(): GameState | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;

      const data: SaveData = JSON.parse(json);

      // Migrate if necessary
      const migrated = MigrationRunner.migrate(data);

      this.lastSaveTime = data.timestamp;
      return Serializer.fromSaveData(migrated);
    } catch (err) {
      console.error('Load failed:', err);

      // Try backup
      const backup = localStorage.getItem(SAVE_BACKUP_KEY);
      if (backup) {
        try {
          const data = JSON.parse(backup);
          this.lastSaveTime = data.timestamp;
          return Serializer.fromSaveData(data);
        } catch {
          // Both failed
        }
      }
      return null;
    }
  }

  /** Delete save data */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVE_BACKUP_KEY);
  }

  /** Check if save exists */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /** Get time since last save (for offline catch-up) */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /** Should we auto-save on this tick? */
  shouldAutoSave(tick: number): boolean {
    return tick % this.autoSaveInterval === 0;
  }

  /** Export save as downloadable JSON string */
  exportSave(state: GameState): string {
    const data = Serializer.toSaveData(state);
    return JSON.stringify(data, null, 2);
  }

  /** Import save from JSON string */
  importSave(json: string): GameState | null {
    try {
      const data = JSON.parse(json);
      const migrated = MigrationRunner.migrate(data);
      this.lastSaveTime = data.timestamp;
      return Serializer.fromSaveData(migrated);
    } catch {
      return null;
    }
  }
}
```

---

## 3. Serializer

Converts between runtime `GameState` and serializable `SaveData`:

```typescript
// src/persistence/Serializer.ts

export class Serializer {
  /** Convert runtime GameState to serializable SaveData */
  static toSaveData(state: GameState): SaveData {
    return {
      version: state.version,
      timestamp: Date.now(),
      tick: state.tick,
      rngState: state.rngState,
      player: state.player,
      world: state.world,
      flags: state.flags,
      achievements: state.player.achievements,
      stats: state.player.stats,
      flavorState: state.flavorState,
    };
  }

  /** Restore runtime GameState from SaveData */
  static fromSaveData(data: SaveData, config?: GameConfig): GameState {
    const configToUse = config ?? loadDefaultConfig();

    return {
      version: data.version,
      tick: data.tick,
      rngState: data.rngState,
      player: data.player,
      world: data.world,
      ui: createDefaultUIState(),       // Fresh UI state
      log: [],                          // Fresh log
      flags: data.flags ?? {},
      config: configToUse,
      flavorState: data.flavorState ?? createDefaultFlavorState(),
      // Rebuild available nodes
      world: {
        ...data.world,
        availableNodes: Object.keys(LOCATIONS[data.world.currentNodeId]?.neighbors ?? {}),
      },
    };
  }
}
```

### Serialization Concerns

- **Circular references**: None by design. State tree is a DAG.
- **Functions**: None in state. All systems are pure functions, not stored.
- **Date objects**: Use numbers (timestamp). No `Date` in state.
- **Maps/Sets**: Not used in serializable state. Use arrays and plain objects.
- **Undefined values**: Avoid. Use `null` or explicit optional fields.

---

## 4. Offline Catch-Up

When the player returns after being away, the system simulates the elapsed time.

```typescript
// src/persistence/OfflineCatchUp.ts

export class OfflineCatchUp {
  /**
   * Compute offline catch-up.
   * @param state - The game state as last saved
   * @param lastSaveTimestamp - Date.now() of last save
   * @param now - Current time (injectable for testing)
   * @param config - Game config
   */
  static compute(
    state: GameState,
    lastSaveTimestamp: number,
    now: number = Date.now(),
    config: GameConfig = state.config
  ): OfflineCatchUpResult {
    const elapsedMs = now - lastSaveTimestamp;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // Cap to max
    const cappedSeconds = Math.min(elapsedSeconds, config.offline.maxCatchUpSeconds);

    if (cappedSeconds <= 0) {
      return {
        ticksSimulated: 0,
        summary: createEmptySummary(),
        newState: state,
      };
    }

    // Batch simulate
    const rng = new PRNG(state.rngState);
    let simState = { ...state };

    // For performance: batch cultivation, then sample encounters probabilistically
    simState = catchUpCultivation(simState, cappedSeconds, config);
    simState = catchUpTravel(simState, cappedSeconds, config);
    simState = catchUpEncounters(simState, cappedSeconds, rng, config);

    // Update tick and RNG state
    simState.tick += cappedSeconds;
    simState.rngState = rng.getState();

    const summary = buildSummary(state, simState, cappedSeconds);

    return {
      ticksSimulated: cappedSeconds,
      summary,
      newState: simState,
    };
  }
}
```

### Batch Cultivation Catch-Up

Instead of ticking second-by-second, compute the total Qi gained:

```typescript
function catchUpCultivation(state: GameState, seconds: number, config: GameConfig): GameState {
  return produce(state, draft => {
    const p = draft.player;
    const location = getLocation(draft.world.currentNodeId)!;

    // Only if player was cultivating or idling
    if (p.action !== 'cultivating' && p.action !== 'idle') return;

    const qiPerTick = CultivationSystem.calculateQiPerTick(p, location, config.cultivation);
    const totalQiGained = qiPerTick * seconds;

    p.currentQi = Math.min(
      p.currentQi + totalQiGained,
      CultivationSystem.calculateQiCapacity(p, REALMS) * 1.5  // Allow slight overcap
    );
    p.stats.totalQiGathered += totalQiGained;
  });
}
```

### Batch Travel Catch-Up

```typescript
function catchUpTravel(state: GameState, seconds: number, config: GameConfig): GameState {
  const ts = state.world.travelState;
  if (!ts) return state;

  const remaining = ts.totalDuration - ts.elapsed;
  const simulated = Math.min(remaining, seconds);

  return produce(state, draft => {
    const travel = draft.world.travelState!;
    travel.elapsed += simulated;

    if (travel.elapsed >= travel.totalDuration) {
      // Arrived
      draft.world.currentNodeId = travel.toId;
      draft.world.travelState = null;
      draft.player.action = 'idle';
      draft.player.stats.totalTravelDistance += travel.totalDuration;
    } else {
      // Still traveling; tick counter adjusted
      draft.player.stats.totalTravelDistance += simulated;
    }
  });
}
```

### Batch Encounter Catch-Up

Roll encounters probabilistically based on expected encounter rate:

```typescript
function catchUpEncounters(
  state: GameState,
  seconds: number,
  rng: PRNG,
  config: GameConfig
): GameState {
  const encounterInterval = config.world.encounterTickInterval;
  const expectedEncounters = seconds / encounterInterval;
  const encounterChance = calculateEncounterChance(state, config);

  let result = state;
  // Poisson-like: roll for each potential encounter window
  for (let i = 0; i < Math.ceil(expectedEncounters); i++) {
    if (rng.next() < encounterChance) {
      result = EncounterSystem.resolveEncounter(
        result,
        getEncounterTableForLocation(result),
        rng
      );
      // If combat was triggered, resolve it (approximate)
      if (result.player.inCombat) {
        result = approximateCombatResolution(result, rng, config);
      }
    }
  }

  return result;
}

function approximateCombatResolution(
  state: GameState,
  rng: PRNG,
  config: GameConfig
): GameState {
  // Quick approximation: compare power levels
  const playerPower = calculatePlayerPower(state.player);
  const enemyPower = calculateBeastPower(state.player.combatState!.enemy);

  if (playerPower > enemyPower * 1.2) {
    // Likely victory
    return CombatSystem.onVictory(state, state.player.combatState!.enemy, rng);
  } else if (playerPower < enemyPower * 0.8) {
    // Likely defeat
    return CombatSystem.onDefeat(state, DEFAULT_DEFEAT_PENALTY);
  } else {
    // Close fight — resolve properly with combat simulation
    return CombatSystem.tickCombat(state, rng, config.combat);
  }
}
```

### Catch-Up Summary

```typescript
interface OfflineSummary {
  timeAway: string;                   // "2h 34m"
  qiGained: number;
  spiritStonesFound: number;
  encountersTriggered: number;
  combatVictories: number;
  combatDefeats: number;
  itemsFound: Item[];
  breakthroughs: BreakthroughResult[];
  travelCompleted: boolean;
  destinationReached: string | null;
  isAlive: boolean;
}
```

The UI displays this as a modal: *"While you were away for 3 hours..."*

---

## 5. Schema Migrations

When save data format changes, migrations transform old saves to new format.

```typescript
// src/state/migrations/index.ts

interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

const MIGRATIONS: Migration[] = [
  // Future migrations go here
  // {
  //   fromVersion: 1,
  //   toVersion: 2,
  //   migrate: (data) => {
  //     // Add new field with default
  //     return { ...data, newField: 'default', version: 2 };
  //   },
  // },
];

export class MigrationRunner {
  static migrate(data: Record<string, unknown>): Record<string, unknown> {
    const currentVersion = (data.version as number) ?? 0;

    if (currentVersion >= CURRENT_SAVE_VERSION) return data;

    let result = { ...data };
    for (const migration of MIGRATIONS) {
      if (result.version === migration.fromVersion) {
        result = migration.migrate(result);
      }
    }

    return result;
  }
}

const CURRENT_SAVE_VERSION = 1;
```

---

## 6. Settings Persistence

Separate from save data — player preferences:

```typescript
interface GameSettings {
  autoSaveInterval: number;         // Ticks (default 30)
  autoBreakthrough: boolean;        // Auto-attempt breakthrough (default false)
  notificationsEnabled: boolean;
  soundEnabled: boolean;            // Future
  textSpeed: 'slow' | 'normal' | 'fast';
  theme: 'dark' | 'light' | 'ink';
}

function loadSettings(): GameSettings { /* ... */ }
function saveSettings(settings: GameSettings): void { /* ... */ }
```

---

## API

```typescript
// ─── SaveManager ─────────────────────────────

class SaveManager {
  constructor(autoSaveInterval?: number);
  save(state: GameState): boolean;
  load(): GameState | null;
  deleteSave(): void;
  hasSave(): boolean;
  getLastSaveTime(): number;
  shouldAutoSave(tick: number): boolean;
  exportSave(state: GameState): string;
  importSave(json: string): GameState | null;
}

// ─── OfflineCatchUp ──────────────────────────

class OfflineCatchUp {
  static compute(
    state: GameState,
    lastSaveTimestamp: number,
    now?: number,
    config?: GameConfig
  ): OfflineCatchUpResult;
}

// ─── Serializer ──────────────────────────────

class Serializer {
  static toSaveData(state: GameState): SaveData;
  static fromSaveData(data: SaveData, config?: GameConfig): GameState;
}

// ─── MigrationRunner ─────────────────────────

class MigrationRunner {
  static migrate(data: Record<string, unknown>): Record<string, unknown>;
}

// ─── Settings ────────────────────────────────

function loadSettings(): GameSettings;
function saveSettings(settings: GameSettings): void;
function getDefaultSettings(): GameSettings;
```

---

## Testing Strategy

### Unit Tests
- `Serializer.toSaveData` produces valid `SaveData`
- `Serializer.fromSaveData` restores equivalent `GameState`
- Round-trip: `fromSaveData(toSaveData(state))` equals original state (except UI)
- `SaveManager.save` writes to localStorage
- `SaveManager.load` reads from localStorage
- `SaveManager.load` returns null when no save exists
- `SaveManager.load` restores from backup on corruption
- `MigrationRunner` applies migrations in order
- `MigrationRunner` handles already-current version (no-op)
- `OfflineCatchUp.compute` with 0 elapsed returns original state
- `OfflineCatchUp.compute` with 1 hour produces correct Qi gain
- `OfflineCatchUp.compute` caps at maxCatchUpSeconds
- `OfflineCatchUp.compute` completes travel if elapsed > remaining time

### Integration Tests
- Save → modify state → load → modifications lost (persisted correctly)
- Save → close app → open → load → offline catch-up applied
- 8-hour offline → Qi gained, encounters rolled, summary accurate
- Version upgrade → old save migrates → loads successfully

### Manual Tests
- Export save → copy to another browser → import → same state
- Clear localStorage → game starts fresh

---

*See also: [Architecture](../architecture.md), [Data Models](../data-models.md)*
