# World & Travel System

> **Modules**: `src/systems/WorldSystem.ts`, `src/systems/TravelSystem.ts`
>
> **Type**: Pure functions, no side effects
>
> **Signature**: `(state: GameState, params?) => GameState`

---

## Overview

The world is a **graph of location nodes**. The player travels between adjacent nodes over time. Each location has unique properties (danger level, qi density, services, encounters) that affect gameplay. Travel is the primary way the player experiences the "open world" — choosing where to go and what to do.

---

## World Graph

### Data Structure

```typescript
// src/data/locations.ts

const GRAND_CONTINENT: Record<string, LocationNode> = {
  // ─── Tier 1: Starter Zone ─────────────────
  azure_cloud_village: {
    id: 'azure_cloud_village',
    name: 'Azure Cloud Village',
    description: 'A peaceful village nestled at the foot of the Cloud-Touching Mountains. The air is faint with spiritual qi, just enough for a mortal to sense the path of cultivation.',
    dangerLevel: 1,
    qiDensity: 10,
    terrain: 'village',
    specialFeatures: [],
    neighbors: {
      green_jade_city: 3600,      // 1 hour
      whispering_forest: 1800,    // 30 min
    },
    services: ['inn'],
    encounterTable: 'peaceful_valley',
    minRealm: 0,
  },

  green_jade_city: {
    id: 'green_jade_city',
    name: 'Green Jade City',
    description: 'A bustling trade city built around a massive jade deposit. Cultivators from minor sects gather here to trade spirit stones, pills, and techniques.',
    dangerLevel: 2,
    qiDensity: 20,
    terrain: 'city',
    specialFeatures: [],
    neighbors: {
      azure_cloud_village: 3600,
      misty_peaks: 10800,         // 3 hours
      black_wind_gorge: 14400,    // 4 hours
    },
    services: ['merchant', 'alchemist', 'blacksmith', 'inn'],
    encounterTable: 'city_outskirts',
    minRealm: 0,
  },

  // ─── Tier 2: Intermediate ─────────────────
  misty_peaks: {
    id: 'misty_peaks',
    name: 'Misty Peaks',
    description: 'Jagged mountains perpetually shrouded in mist. Ancient cultivators carved meditation caves into the cliffs. The qi here is thick but unstable.',
    dangerLevel: 4,
    qiDensity: 45,
    terrain: 'mountain',
    specialFeatures: [
      {
        type: 'cultivation_spot',
        name: 'Ancient Meditation Cave',
        description: 'A cave covered in faded formation runes. Cultivating here doubles your speed.',
        effect: { type: 'cultivation_boost', amount: 2.0 },
      },
    ],
    neighbors: {
      green_jade_city: 10800,
      cloud_sect: 7200,
      demon_beast_mountain: 21600, // 6 hours
    },
    services: [],
    encounterTable: 'mountain_wilds',
    minRealm: 1,  // Qi Condensation required
  },

  black_wind_gorge: {
    id: 'black_wind_gorge',
    name: 'Black Wind Gorge',
    description: 'A narrow canyon where the wind howls like vengeful spirits. Dark cultivators are rumored to refine forbidden techniques in the shadows.',
    dangerLevel: 5,
    qiDensity: 35,
    terrain: 'cave',
    specialFeatures: [
      {
        type: 'treasure_vault',
        name: 'Forgotten Treasury',
        description: 'A sealed chamber from a fallen sect. Requires a Formation Key to open.',
        effect: { type: 'encounter_modifier', table: 'treasure_vault', weight: 1.0 },
      },
    ],
    neighbors: {
      green_jade_city: 14400,
      demon_beast_mountain: 18000,
    },
    services: [],
    encounterTable: 'dark_gorge',
    minRealm: 2,  // Foundation Establishment recommended
  },

  // ─── Tier 3: Advanced ────────────────────
  cloud_sect: {
    id: 'cloud_sect',
    name: 'Cloud Soaring Sect',
    description: 'A righteous sect perched on a floating mountain. Their library holds ten thousand techniques. Disciples train in the arts of wind and thunder.',
    dangerLevel: 3,
    qiDensity: 60,
    terrain: 'sect_grounds',
    specialFeatures: [
      {
        type: 'cultivation_spot',
        name: 'Sect Library',
        description: 'Study ancient texts to boost comprehension.',
        effect: { type: 'stat_bonus', stat: 'comprehension', amount: 5 },
      },
    ],
    neighbors: {
      misty_peaks: 7200,
      heavenly_peak: 36000,      // 10 hours
    },
    services: ['trainer', 'merchant'],
    encounterTable: 'sect_grounds',
    minRealm: 1,
  },

  demon_beast_mountain: {
    id: 'demon_beast_mountain',
    name: 'Demon Beast Mountain',
    description: 'A cursed mountain crawling with spirit beasts mutated by ancient demonic qi. Only the strongest cultivators dare venture here.',
    dangerLevel: 7,
    qiDensity: 40,
    terrain: 'mountain',
    specialFeatures: [
      {
        type: 'beast_lair',
        name: 'Thunder Serpent Nest',
        description: 'A Thunder Serpent King guards a treasure of immense value.',
        effect: { type: 'encounter_modifier', table: 'boss_encounter', weight: 0.3 },
      },
    ],
    neighbors: {
      misty_peaks: 21600,
      black_wind_gorge: 18000,
      forbidden_valley: 28800,
    },
    services: [],
    encounterTable: 'demon_mountain',
    minRealm: 3,  // Core Formation required
  },

  // ─── Tier 4: Endgame ──────────────────────
  heavenly_peak: {
    id: 'heavenly_peak',
    name: 'Heavenly Ascension Peak',
    description: 'The highest mountain in the realm, where the mortal world touches the heavens. Here, cultivators attempt the final step to immortality.',
    dangerLevel: 10,
    qiDensity: 100,
    terrain: 'forbidden_zone',
    specialFeatures: [
      {
        type: 'ancient_formation',
        name: 'Ascension Altar',
        description: 'The legendary formation that opens the path to immortality.',
        effect: { type: 'cultivation_boost', amount: 5.0 },
      },
    ],
    neighbors: {
      cloud_sect: 36000,
      forbidden_valley: 43200,
    },
    services: [],
    encounterTable: 'heavenly_trials',
    minRealm: 6,  // Dao Seeking required
  },

  forbidden_valley: {
    id: 'forbidden_valley',
    name: 'Valley of Forgotten Immortals',
    description: 'A valley where fallen immortals are entombed. Their remnants still radiate power beyond mortal comprehension.',
    dangerLevel: 9,
    qiDensity: 85,
    terrain: 'ruins',
    specialFeatures: [
      {
        type: 'ancient_formation',
        name: 'Immortal\'s Legacy',
        description: 'The inheritance of an ancient immortal slumbers here.',
        effect: { type: 'encounter_modifier', table: 'legendary_encounter', weight: 0.5 },
      },
    ],
    neighbors: {
      demon_beast_mountain: 28800,
      heavenly_peak: 43200,
    },
    services: [],
    encounterTable: 'forbidden_zone',
    minRealm: 5,
  },

  // (More locations would be added for density)
};
```

---

## Travel Mechanics

### Starting Travel

```typescript
function startTravel(state: GameState, destinationId: string): ActionResult<GameState> {
  // Validate: is destination adjacent?
  const currentNode = LOCATIONS[state.world.currentNodeId];
  const travelTime = currentNode.neighbors[destinationId];
  if (travelTime === undefined) {
    return { success: false, message: 'Cannot travel there directly.' };
  }

  // Validate: can afford? (optional — travel costs spirit stones or supplies)
  // Validate: not already traveling
  if (state.world.travelState) {
    return { success: false, message: 'Already traveling.' };
  }

  // Validate: not in combat
  if (state.player.inCombat) {
    return { success: false, message: 'Cannot travel while in combat.' };
  }

  return {
    success: true,
    state: produce(state, draft => {
      draft.player.action = 'traveling';
      draft.world.travelState = {
        fromId: state.world.currentNodeId,
        toId: destinationId,
        totalDuration: travelTime,
        elapsed: 0,
        encounterCooldown: TRAVEL_CONFIG.initialEncounterDelay,
      };
    }),
    message: `Beginning journey to ${LOCATIONS[destinationId].name}...`,
  };
}
```

### Travel Tick

Each tick, advance travel progress:

```typescript
function tickTravel(state: GameState): GameState {
  const ts = state.world.travelState;
  if (!ts) return state;

  return produce(state, draft => {
    const newTravel = draft.world.travelState!;
    newTravel.elapsed += 1; // 1 tick = 1 second

    // Check arrival
    if (newTravel.elapsed >= newTravel.totalDuration) {
      arriveAtDestination(draft);
      return;
    }

    // Check for random encounter (only on cooldown expiry)
    newTravel.encounterCooldown -= 1;
  });
}

function arriveAtDestination(state: GameState): GameState {
  const ts = state.world.travelState!;
  return produce(state, draft => {
    draft.world.currentNodeId = ts.toId;
    draft.world.travelState = null;
    draft.player.action = 'idle';
    draft.player.stats.totalTravelDistance += ts.totalDuration;

    // Mark as visited
    if (!draft.world.visitedNodes.includes(ts.toId)) {
      draft.world.visitedNodes.push(ts.toId);
    }

    // Update available nodes
    draft.world.availableNodes = Object.keys(LOCATIONS[ts.toId].neighbors);

    // Log arrival
    draft.log.push({
      type: 'travel_arrive',
      tick: draft.tick,
      data: { locationId: ts.toId, locationName: LOCATIONS[ts.toId].name },
    });
  });
}
```

### Travel Interruption (Encounter)

Travel can be interrupted by encounters (handled by EncounterSystem — see [Encounters](./encounters.md)):

```typescript
function interruptTravel(state: GameState, encounter: ResolvedEncounter): GameState {
  return produce(state, draft => {
    // Save travel progress
    const ts = draft.world.travelState;
    if (!ts) return;

    // Pause travel; will resume after encounter resolves
    draft.player.action = encounter.type === 'beast_combat' ? 'in_combat' : 'idle';
    // Travel state persists but won't tick while action != 'traveling'
  });
}
```

---

## Location Services

When the player is at a location, services are available:

| Service | Action |
|---------|--------|
| `merchant` | Opens buy/sell interface with generated merchant |
| `alchemist` | Craft pills from beast cores + herbs |
| `blacksmith` | Upgrade/repair weapons (future) |
| `trainer` | Pay spirit stones for temporary stat boost |
| `inn` | Rest: heal to full, cost spirit stones |

---

## Danger Level & Gating

### Danger Scaling

| Danger Level | Typical Beast Tier | Recommended Realm |
|-------------|-------------------|-------------------|
| 1–2 | 1–2 | Mortal – Qi Condensation early |
| 3–4 | 3–4 | Qi Condensation late – Foundation early |
| 5–6 | 5–6 | Foundation late – Core Formation |
| 7–8 | 7–8 | Core Formation late – Nascent Soul |
| 9–10 | 9–10 | Spirit Severing – Dao Seeking |

### Soft Gating vs Hard Gating

- **Soft gating**: Player can attempt dangerous areas but will likely die. Creates tension.
- **Hard gating**: `minRealm` attribute prevents travel unless realm ≥ requirement. Must be explicitly overridden (with warning).

```typescript
function canTravelTo(player: PlayerState, destination: LocationNode): boolean {
  if (player.realm < destination.minRealm) {
    // Soft gate: allow but warn, OR hard gate: block
    return HARD_GATE_ENABLED ? false : true;
  }
  return true;
}
```

---

## Special Features

Location special features are permanent buffs/debuffs while the player is at that location. They are applied whenever the player is at the node:

| Feature Type | Effect |
|-------------|--------|
| `cultivation_spot` | Multiplier to cultivation speed |
| `treasure_vault` | Adds special encounter to the location's table |
| `ancient_formation` | Permanent stat boost while present |
| `beast_lair` | Boss encounter chance |

---

## World Map Visualization

The UI renders an interactive node graph. See [UI Components](#) (TODO).

Requirements:
- Show current location (highlighted)
- Show adjacent (reachable) locations with travel time
- Show visited locations (different color)
- Show locked locations (grayed out, shows minRealm requirement)
- Click adjacent location to start travel (with confirmation for dangerous areas)

---

## API

```typescript
// ─── World ──────────────────────────────────

function getLocation(id: string): LocationNode | undefined;
function getAdjacentLocations(currentId: string): LocationNode[];
function getReachableLocations(player: PlayerState, currentId: string): LocationNode[];
function canTravelTo(player: PlayerState, destination: LocationNode, hardGate: boolean): boolean;

// ─── Travel ─────────────────────────────────

function startTravel(state: GameState, destinationId: string): ActionResult<GameState>;
function tickTravel(state: GameState): GameState;
function cancelTravel(state: GameState): GameState;          // Return to origin
function arriveAtDestination(state: GameState): GameState;
function interruptTravel(state: GameState, reason: string): GameState;
function resumeTravel(state: GameState): GameState;

// ─── Services ───────────────────────────────

function getServices(locationId: string): Service[];
function useInn(state: GameState): ActionResult<GameState>;  // Rest, heal
function getQiDensityBonus(locationId: string): number;      // 0–1
```

---

## World Config

```typescript
interface WorldConfig {
  travelBaseSpeed: number;              // 1 = real-time seconds
  encounterTickInterval: number;        // 60 — Roll for encounter every 60 ticks
  encounterBaseChance: number;          // 0.15 — Base chance per roll
  dangerToEncounterChance: number;      // 0.03 — Additional chance per danger level
  travelInterruptionChance: number;     // 0.7 — Chance encounter pauses travel
  hardGatingEnabled: boolean;           // false — Allow dangerous travel with warning
  innCostPerHealthPercent: number;      // 2 — Spirit stones per 1% health restored
  servicePriceMultiplier: number;       // 1.0 — Global service cost modifier
}
```

---

## Testing Strategy

### Unit Tests
- `startTravel` returns error for non-adjacent destination
- `startTravel` returns error when already traveling
- `startTravel` returns error when in combat
- `tickTravel` increments elapsed correctly
- `tickTravel` triggers arrival when elapsed ≥ duration
- `arriveAtDestination` updates currentNodeId and clears travelState
- `arriveAtDestination` marks location as visited
- `canTravelTo` respects minRealm when hard gating
- `getAdjacentLocations` returns correct neighbors
- Qi density bonus calculation is correct

### Integration Tests
- Full travel cycle: start → tick N times → arrive → verify state
- Travel interrupted by encounter → combat → resume travel → arrive
- Visiting new location unlocks adjacent locations
- Danger gating warns but allows when soft gate enabled

---

*See also: [Data Models](../data-models.md), [Encounter System](./encounters.md)*
