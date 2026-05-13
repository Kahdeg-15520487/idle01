# Sect & Faction System

> **Module**: `src/systems/SectSystem.ts` (pure functions), `src/data/sects.ts` (sect definitions)
>
> **Type**: Pure functions on state, data-driven faction config
>
> **Signature**: `(state: GameState, params?) => ActionResult<GameState>`

---

## Overview

The sect/faction system manages the player's relationship with the world's power structures. It governs: joining and leaving sects, faction reputation (per-sect standing), rank progression, sect missions, political events, and the consequences of allegiance.

This is **not cosmetic flavor** — it directly controls access to techniques, services, safe travel, and encounters.

---

## Core Data Structures

### Sect Definition

```typescript
interface Sect {
  readonly id: string;
  readonly name: string;
  readonly alignment: SectAlignment;
  readonly philosophy: string;
  readonly territoryIds: string[];           // Locations they control
  readonly headquartersId: string;           // Main sect location
  readonly symbol: string;                   // Emoji/icon
  readonly color: string;                    // UI color

  // Relationships with other sects
  readonly relationships: Record<string, SectRelationship>;

  // Progression
  readonly ranks: SectRank[];

  // Content
  readonly exclusiveTechniques: string[];    // Technique template IDs
  readonly exclusiveItems: string[];         // Item template IDs
  readonly services: SectService[];          // Available services by rank

  // Encounter modifiers
  readonly patrolEncounterId: string;        // Added to tables when allied
  readonly ambushEncounterId: string;        // Added to rival territory when hostile

  // Requirements
  readonly joinRequirements: SectJoinRequirement;
  readonly rankRequirements: Record<string, SectRankRequirement>;
}

type SectAlignment = 'righteous' | 'neutral' | 'demonic' | 'scholarly';

interface SectRelationship {
  readonly stance: 'allied' | 'friendly' | 'neutral' | 'uneasy' | 'hostile' | 'blood_feud';
  readonly description: string;              // "Centuries-old blood feud"
  readonly effects: SectRelationEffects;
}

interface SectRelationEffects {
  sharePatrols: boolean;                     // Allies protect each other's territory
  shareServices: boolean;                    // Allies allow use of sect services
  ambushInTerritory: boolean;                // Hostile sects actively attack
  tradeBonus: number;                        // Merchant discount (−1 to 1)
  techniqueSharing: boolean;                 // Can learn each other's techniques
}
```

### Player Faction State

```typescript
interface FactionState {
  readonly currentSectId: string | null;     // Currently joined sect (or null = rogue)
  readonly reputations: Record<string, SectReputation>;
  readonly completedMissions: string[];      // Mission IDs completed
  readonly politicalFlags: Record<string, boolean>; // "betrayed_cloud_sect", etc.
  readonly sectCooldowns: Record<string, number>; // Ticks until can rejoin after leaving
}

interface SectReputation {
  readonly standing: number;                 // -100 to +100
  readonly rank: string;                     // Current rank ID within sect
  readonly contributions: number;            // Contribution points (earned, spent)
  readonly joinedAt: number;                 // Tick when joined (for seniority)
}
```

---

## Reputation & Standing

### Standing Scale

| Range | Label | Effect |
|-------|-------|--------|
| 91–100 | **Revered** | 20% discount at sect services, NPCs praise you, unique encounters open |
| 61–90 | **Honored** | 10% discount, inner disciple eligibility |
| 31–60 | **Respected** | Access to sect grounds, outer disciple eligibility |
| 1–30 | **Accepted** | Can speak to sect NPCs, guest rank unlocked |
| 0 | **Neutral** | Default. Sect acknowledges your existence |
| -1 to -30 | **Suspicious** | Sect guards watch you. No services |
| -31 to -60 | **Hostile** | Attacked on sight in sect territory. Ambush encounters added |
| -61 to -90 | **Despised** | Bounty on your head. Sect assassins hunt you |
| -91 to -100 | **Blood Enemy** | Permanent war. Sect elders personally hunt you |

### Changing Standing

```typescript
function modifyStanding(
  state: GameState,
  sectId: string,
  delta: number,
  reason: string
): GameState {
  return produce(state, draft => {
    const rep = draft.player.faction.reputations[sectId];
    if (!rep) {
      draft.player.faction.reputations[sectId] = {
        standing: Math.max(-100, Math.min(100, delta)),
        rank: 'outsider',
        contributions: 0,
        joinedAt: 0,
      };
      return;
    }

    rep.standing = Math.max(-100, Math.min(100, rep.standing + delta));

    // Log the change
    draft.log.push({
      type: 'reputation_change',
      tick: draft.tick,
      data: { sectId, delta, newStanding: rep.standing, reason },
    });
  });
}
```

### Standing Change Sources

| Action | Standing Change |
|--------|----------------|
| Complete sect mission | +5 to +20 |
| Kill sect member (in combat) | -20 to -50 |
| Kill sect enemy | +10 with sect, -10 with enemy sect |
| Donate spirit stones (100 per point) | +1 per 100 stones |
| Defend sect territory during beast tide | +15 |
| Betray the sect (leave for rival) | -40, flag as traitor |
| Help wandering elder from that sect | +5 |
| Trade with sect merchant (per 1000 stones) | +1 |
| Win sect tournament round | +10 |
| Lose sect tournament round | -5 |
| Spread rumors (dialogue choice) | ±10 depending on truth |

---

## Joining & Leaving Sects

### Join Requirements

```typescript
interface SectJoinRequirement {
  minRealm: number;                // Minimum cultivation realm
  minStanding: number;             // Minimum standing with the sect
  forbiddenOrigin?: string[];      // Origins that cannot join
  requiresQuest?: string;          // Must complete a specific quest first
  alignmentMatch?: SectAlignment;  // Must match sect alignment (for righteous sects)
}

// Example: Cloud Soaring Sect
const cloudSoaringRequirements: SectJoinRequirement = {
  minRealm: 1,                     // Qi Condensation minimum
  minStanding: 10,                  // At least "Accepted"
  alignmentMatch: 'righteous',     // Player must have positive karma
  requiresQuest: 'cloud_sect_trial', // Pass the entrance trial
};
```

### Join Flow

```typescript
function joinSect(state: GameState, sectId: string): ActionResult<GameState> {
  const sect = SECTS[sectId];
  if (!sect) return { success: false, message: 'Unknown sect.' };

  // Check cooldown (can't rejoin within 10000 ticks of leaving)
  const cooldown = state.player.faction.sectCooldowns[sectId] ?? 0;
  if (cooldown > state.tick) {
    return { success: false, message: `Cannot rejoin yet. ${formatTicks(cooldown - state.tick)} remaining.` };
  }

  // Already in this sect?
  if (state.player.faction.currentSectId === sectId) {
    return { success: false, message: 'Already a member of this sect.' };
  }

  // Check requirements
  const reqs = sect.joinRequirements;
  if (state.player.realm < reqs.minRealm) {
    return { success: false, message: `Requires ${REALMS[reqs.minRealm].name} realm.` };
  }

  const rep = state.player.faction.reputations[sectId];
  if (!rep || rep.standing < reqs.minStanding) {
    return { success: false, message: `Not enough standing with ${sect.name}. Need ${reqs.minStanding}.` };
  }

  if (reqs.alignmentMatch) {
    const playerAlignment = getPlayerAlignment(state.player);
    if (playerAlignment !== reqs.alignmentMatch) {
      return { success: false, message: `${sect.name} does not accept cultivators of ${playerAlignment} alignment.` };
    }
  }

  // If currently in a sect, handle defection
  if (state.player.faction.currentSectId) {
    const oldSectId = state.player.faction.currentSectId;
    const oldSect = SECTS[oldSectId]!;

    // Apply defection penalties
    state = modifyStanding(state, oldSectId, -40, `Defected to ${sect.name}`);
    state = produce(state, draft => {
      draft.player.faction.politicalFlags[`betrayed_${oldSectId}`] = true;
      draft.player.faction.sectCooldowns[oldSectId] = draft.tick + 50000; // Long cooldown
    });

    // Old sect's enemies become friendlier
    for (const [otherId, rel] of Object.entries(oldSect.relationships)) {
      if (rel.stance === 'hostile' || rel.stance === 'blood_feud') {
        state = modifyStanding(state, otherId, 15, `Betrayed our enemy, ${oldSect.name}`);
      }
    }
  }

  // Apply join effects
  return produce(state, draft => {
    draft.player.faction.currentSectId = sectId;
    const rep = draft.player.faction.reputations[sectId]!;
    rep.rank = 'outer_disciple'; // Entry rank
    rep.joinedAt = draft.tick;

    // Sect's enemies become hostile
    for (const [otherId, rel] of Object.entries(sect.relationships)) {
      if (rel.stance === 'hostile' || rel.stance === 'blood_feud') {
        modifyStanding(draft, otherId, -30, `Joined ${sect.name}`);
      }
    }

    draft.log.push({
      type: 'sect_joined',
      tick: draft.tick,
      data: { sectId, sectName: sect.name, rank: 'Outer Disciple' },
    });
  });

  return { success: true, state, message: `You have joined ${sect.name} as an Outer Disciple!` };
}
```

### Leaving a Sect

```typescript
function leaveSect(state: GameState): ActionResult<GameState> {
  const sectId = state.player.faction.currentSectId;
  if (!sectId) return { success: false, message: 'Not currently in a sect.' };

  const sect = SECTS[sectId]!;

  return produce(state, draft => {
    // Penalty for leaving
    const rep = draft.player.faction.reputations[sectId]!;
    rep.standing -= 20;
    rep.rank = 'outsider';

    // Mark as former member
    draft.player.faction.currentSectId = null;
    draft.player.faction.sectCooldowns[sectId] = draft.tick + 10000;

    draft.log.push({
      type: 'sect_left',
      tick: draft.tick,
      data: { sectName: sect.name },
    });

    // If left on good terms (standing still positive), no additional penalties
    // If left on bad terms (standing negative after penalty), old allies may turn cold
  });

  return { success: true, state, message: `You have left ${sect.name}.` };
}
```

---

## Rank Progression

### Ranks (Generic Template — Each Sect Has Its Own)

```typescript
interface SectRank {
  readonly id: string;                // 'outer_disciple', 'inner_disciple', etc.
  readonly name: string;              // "Outer Disciple"
  readonly contributionsRequired: number;
  readonly standingRequired: number;
  readonly realmRequired: number;
  readonly benefits: SectRankBenefits;
}

interface SectRankBenefits {
  stipendPerTick: number;             // Spirit stones per tick (0 for low ranks)
  serviceAccess: string[];            // Which services unlock
  techniqueAccess: number;            // How many sect techniques you can learn
  cultivationBonus: number;           // Bonus cultivation speed in sect territory
  patrolAccess: boolean;              // Can join sect patrols (special encounters)
  elderProtection: boolean;           // Elders protect you from assassination
  title: string;                      // Honorific: "Disciple Li", "Elder Li"
}
```

### Rank-Up

```typescript
function attemptRankUp(state: GameState): ActionResult<GameState> {
  const sectId = state.player.faction.currentSectId;
  if (!sectId) return { success: false, message: 'Not in a sect.' };

  const sect = SECTS[sectId]!;
  const rep = state.player.faction.reputations[sectId]!;

  // Find next rank
  const currentRankIdx = sect.ranks.findIndex(r => r.id === rep.rank);
  const nextRank = sect.ranks[currentRankIdx + 1];
  if (!nextRank) return { success: false, message: 'Already at highest rank.' };

  // Check requirements
  if (rep.contributions < nextRank.contributionsRequired) {
    return { success: false, message: `Need ${nextRank.contributionsRequired} contributions. Have ${rep.contributions}.` };
  }
  if (rep.standing < nextRank.standingRequired) {
    return { success: false, message: `Need ${nextRank.standingRequired} standing. Have ${rep.standing}.` };
  }
  if (state.player.realm < nextRank.realmRequired) {
    return { success: false, message: `Need ${REALMS[nextRank.realmRequired].name} realm.` };
  }

  return produce(state, draft => {
    const rep = draft.player.faction.reputations[sectId]!;
    rep.rank = nextRank.id;

    draft.log.push({
      type: 'sect_rank_up',
      tick: draft.tick,
      data: { sectName: sect.name, newRank: nextRank.name },
    });
  });

  return { success: true, state, message: `Promoted to ${nextRank.name} of ${sect.name}!` };
}
```

---

## Sect Missions

Missions are the primary way to earn contributions and standing. They appear as encounters or location services.

### Mission Types

```typescript
interface SectMission {
  readonly id: string;
  readonly sectId: string;
  readonly title: string;
  readonly description: string;
  readonly type: MissionType;
  readonly requirements: MissionRequirement;
  readonly rewards: MissionReward;
  readonly isRepeatable: boolean;
  readonly cooldownTicks: number;
}

type MissionType =
  | 'slay_beasts'          // Kill N beasts in a specific location
  | 'gather_herbs'         // Collect N herbs
  | 'deliver_item'         // Transport item to another location
  | 'scout_area'           // Travel to a dangerous location and return
  | 'defend_territory'     // During beast tide: kill beasts at sect territory
  | 'eliminate_rival'      // Kill a specific NPC cultivator from rival sect
  | 'escort_npc'           // Travel with an NPC (they slow travel, guaranteed ambush)
  | 'craft_pills'          // Deliver N pills to sect
  | 'tournament_fight'     // Win a sect tournament match
  | 'teach_disciples';     // Spend time at sect grounds (ticks) training juniors

interface MissionReward {
  contributions: number;
  standingDelta: number;
  spiritStones: number;
  items?: Item[];
  techniqueScroll?: Technique;
}
```

### Mission Board (UI)

When at a sect headquarters, the player can view available missions:

```
┌──────────────────────────────────────────────┐
│  CLOUD SOARING SECT — MISSION BOARD          │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │ 🐺 Slay Shadow Wolves               │     │
│  │ Kill 5 Shadow Wolves in Misty Peaks │     │
│  │ Progress: 2/5                       │     │
│  │ Reward: +10 contrib, +5 standing    │     │
│  │ [Accept]                            │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │ 🌿 Gather Moondew Herbs             │     │
│  │ Collect 3 Moondew from Whispering   │     │
│  │ Forest                              │     │
│  │ Reward: +8 contrib, 3 healing pills │     │
│  │ [Accept]                            │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │ ⚔️ Eliminate Rogue Cultivator       │     │
│  │ A traitor fled to Black Wind Gorge  │     │
│  │ Reward: +25 contrib, rare weapon    │     │
│  │ Requires: Inner Disciple rank       │     │
│  │ [Locked]                            │     │
│  └─────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

Missions auto-track progress. Killing beasts in the target location automatically counts toward "Slay Shadow Wolves."

---

## Political Events System

### Event Scheduler

```typescript
interface PoliticalEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly trigger: PoliticalEventTrigger;
  readonly duration: number;            // Ticks (0 = instant)
  readonly effects: PoliticalEventEffect[];
  readonly flavorTemplate: string;
}

type PoliticalEventTrigger =
  | { type: 'interval'; ticks: number }           // Every N ticks
  | { type: 'playerAction'; action: string }       // When player does something
  | { type: 'standingThreshold'; sectId: string; standing: number }
  | { type: 'realmReached'; realm: number }
  | { type: 'random'; chance: number; minInterval: number };
```

### Example Events

```typescript
const POLITICAL_EVENTS: PoliticalEvent[] = [
  {
    id: 'sect_tournament',
    title: 'Centennial Sect Tournament',
    description: 'Cloud Soaring Sect hosts the grand tournament. Cultivators from all sects compete for glory and rare treasures.',
    trigger: { type: 'interval', ticks: 100000 }, // ~28 hours
    duration: 3600, // 1 hour
    effects: [
      { type: 'enableService', locationId: 'cloud_sect', service: 'tournament_arena' },
      { type: 'globalStandingMultiplier', multiplier: 2.0 }, // Double rep gains
      { type: 'encounterTableAdd', tableId: 'cloud_sect', entry: 'tournament_encounter' },
    ],
    flavorTemplate: 'tournament_announcement',
  },

  {
    id: 'beast_tide',
    title: 'Beast Tide from Demon Beast Mountain',
    description: 'A surge of spirit beasts floods from Demon Beast Mountain. Adjacent locations are overrun.',
    trigger: { type: 'random', chance: 0.0001, minInterval: 50000 }, // ~1% per 1000 ticks
    duration: 7200, // 2 hours
    effects: [
      { type: 'locationDangerModifier', locationIds: ['misty_peaks', 'black_wind_gorge', 'green_jade_city'], modifier: +3 },
      { type: 'encounterTableReplace', locationId: 'misty_peaks', tableId: 'beast_tide' },
      { type: 'merchantPriceMultiplier', itemType: 'beast_core', multiplier: 3.0 }, // Beast cores worth 3x
    ],
    flavorTemplate: 'beast_tide_warning',
  },

  {
    id: 'shadow_raid',
    title: 'Shadow Heaven Raid',
    description: 'Shadow Heaven Sect launches a surprise attack on Cloud Sect territory.',
    trigger: {
      type: 'standingThreshold',
      sectId: 'shadow_heaven',
      standing: -50, // Player is too hated by Shadow Heaven
    },
    duration: 0, // Instant: adds permanent encounter
    effects: [
      { type: 'encounterTableAddPermanent', tableId: 'all_cloud_territory', entry: 'shadow_assassin' },
      { type: 'notification', message: 'Shadow Heaven has marked you for death!' },
    ],
    flavorTemplate: 'assassin_marked',
  },
];
```

---

## Territory Control

Each location belongs to a sect's territory. This affects:

```typescript
function getTerritoryController(locationId: string): string | null {
  for (const sect of Object.values(SECTS)) {
    if (sect.territoryIds.includes(locationId)) return sect.id;
  }
  return null; // Neutral territory
}

function isSafeLocation(state: GameState, locationId: string): boolean {
  const controller = getTerritoryController(locationId);

  // Neutral territory = always safe (but wild encounters)
  if (!controller) return true;

  const sect = SECTS[controller]!;
  const rep = state.player.faction.reputations[controller];
  const standing = rep?.standing ?? 0;

  // Allied sect territory = safe
  if (state.player.faction.currentSectId === controller) {
    return true; // Your own sect protects you
  }

  // Check relationship between your sect and controller
  if (state.player.faction.currentSectId) {
    const relationship = sect.relationships[state.player.faction.currentSectId];
    if (relationship) {
      if (relationship.stance === 'allied' || relationship.stance === 'friendly') {
        return true;
      }
      if (relationship.stance === 'hostile' || relationship.stance === 'blood_feud') {
        return false; // Always dangerous
      }
    }
  }

  // Rogue cultivator: safe if standing >= 0
  return standing >= 0;
}
```

When in hostile territory:
- Encounter chance doubled
- Ambush encounters added to table
- Services unavailable
- Flavor text reflects tension: *"You move quietly through Shadow Heaven territory, every shadow concealing a potential blade."*

---

## API

```typescript
// ─── Sect Management ───────────────────────

function joinSect(state: GameState, sectId: string): ActionResult<GameState>;
function leaveSect(state: GameState): ActionResult<GameState>;
function attemptRankUp(state: GameState): ActionResult<GameState>;

// ─── Reputation ────────────────────────────

function modifyStanding(state: GameState, sectId: string, delta: number, reason: string): GameState;
function getStanding(state: GameState, sectId: string): number;
function getReputation(state: GameState, sectId: string): SectReputation | null;
function getPlayerAlignment(player: PlayerState): SectAlignment;

// ─── Missions ──────────────────────────────

function getAvailableMissions(state: GameState): SectMission[];
function acceptMission(state: GameState, missionId: string): ActionResult<GameState>;
function checkMissionProgress(state: GameState): GameState;  // Called each tick
function completeMission(state: GameState, missionId: string): ActionResult<GameState>;

// ─── Territory ─────────────────────────────

function getTerritoryController(locationId: string): string | null;
function isSafeLocation(state: GameState, locationId: string): boolean;
function getTerritoryEffects(state: GameState, locationId: string): TerritoryEffect[];

// ─── Political Events ──────────────────────

function tickPoliticalEvents(state: GameState, rng: PRNG): GameState;
function getActiveEvents(state: GameState): PoliticalEventInstance[];
function resolveEvent(state: GameState, eventId: string): GameState;

// ─── Services ──────────────────────────────

function getSectServices(state: GameState, locationId: string): SectService[];
function useSectService(state: GameState, serviceId: string): ActionResult<GameState>;
```

---

## Data Flow Example: Joining Cloud Soaring Sect

```
1. Player travels to Cloud Sect headquarters
2. Views "Join Sect" option (shows requirements)
3. Player meets requirements:
   - Realm: Qi Condensation (✓)
   - Standing: 15 (gained by helping sect patrols + donating) (✓)
   - Alignment: Righteous (karma > 0) (✓)
4. Player clicks "Join"
5. joinSect() executes:
   ├── Check requirements → pass
   ├── Apply join effects:
   │   ├── Set currentSectId = 'cloud_soaring'
   │   ├── Set rank = 'outer_disciple'
   │   ├── Add "Cloud Step" technique to learnable list
   │   ├── Shadow Heaven standing -30 (enemy of my sect is my enemy)
   │   └── Blood Lotus standing -10 (rival over territory)
   ├── Log: "You have joined Cloud Soaring Sect as an Outer Disciple!"
   └── Return new state
6. World updates:
   ├── Misty Peaks now shows "Safe Territory (Cloud Sect)"
   ├── Black Wind Gorge shows "Hostile Territory (Shadow Heaven)"
   ├── Mission Board becomes available at Cloud Sect
   └── Sect merchant offers exclusive items
```

---

## Testing Strategy

### Unit Tests
- `joinSect` enforces all requirements
- `joinSect` applies correct standing changes to enemy sects
- `leaveSect` resets rank, applies cooldown
- `attemptRankUp` checks contributions, standing, realm
- `modifyStanding` clamps to [-100, 100]
- `isSafeLocation` correctly handles allied/hostile/neutral territory
- Mission progress increments on relevant kills/travel
- Political events trigger on schedule

### Integration Tests
- Join sect → complete mission → rank up → unlock new technique
- Defect to rival sect → old sect sends assassins (encounter added)
- Beast tide event → location danger increases → beast cores sell for more
- Tournament event → participate → win → gain rare technique

---

*See also: [World Building](../world-building.md), [World System](./world.md), [Encounter System](./encounters.md)*
