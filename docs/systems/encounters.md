# Encounter System

> **Module**: `src/systems/EncounterSystem.ts`
>
> **Type**: Pure functions + data-driven encounter tables
>
> **Signature**: `(state: GameState, rng: PRNG) => GameState`

---

## Overview

The Encounter System rolls for random events during travel and while idling at locations. Encounters are the primary source of combat, loot, NPCs, and special opportunities. The system uses **weighted tables** that vary by location, realm, and player flags.

---

## Core Mechanics

### 1. Encounter Trigger

Encounters are checked every `encounterTickInterval` ticks (default: every 60 seconds) when:
- **Traveling**: chance modified by danger level
- **Idling at location**: lower base chance, but still possible

```typescript
function tickEncounters(state: GameState, rng: PRNG, config: WorldConfig): GameState {
  // Only roll if cooldown expired
  if (state.tick % config.encounterTickInterval !== 0) return state;

  const location = getLocation(state.world.currentNodeId);
  if (!location) return state;

  // Calculate encounter chance
  const baseChance = config.encounterBaseChance;
  const dangerBonus = location.dangerLevel * config.dangerToEncounterChance;
  const travelBonus = state.player.action === 'traveling' ? 0.1 : 0;
  const totalChance = Math.min(0.9, baseChance + dangerBonus + travelBonus);

  if (rng.next() >= totalChance) return state; // No encounter

  // Roll on the encounter table
  const table = getEncounterTable(location.encounterTable);
  return resolveEncounter(state, table, rng);
}
```

### 2. Encounter Table Structure

```typescript
// src/data/encounters.ts

const ENCOUNTER_TABLES: Record<string, EncounterTable> = {
  peaceful_valley: {
    id: 'peaceful_valley',
    locationIds: ['azure_cloud_village'],
    entries: [
      { type: 'beast_combat',     weight: 30 },
      { type: 'peaceful_moment',  weight: 30 },
      { type: 'treasure',         weight: 15 },
      { type: 'merchant',         weight: 15 },
      { type: 'rare_herb',        weight: 10 },
    ],
  },

  mountain_wilds: {
    id: 'mountain_wilds',
    locationIds: ['misty_peaks', 'demon_beast_mountain'],
    entries: [
      { type: 'beast_combat',         weight: 40 },
      { type: 'treasure',             weight: 15 },
      { type: 'rare_herb',            weight: 15 },
      { type: 'wandering_elder',      weight: 10, minRealm: 2 },
      { type: 'ancient_inheritance',  weight: 5,  minRealm: 3 },
      { type: 'tribulation',          weight: 3,  minRealm: 4 },
      { type: 'peaceful_moment',      weight: 12 },
    ],
  },

  boss_encounter: {
    id: 'boss_encounter',
    locationIds: [], // Added by special features
    entries: [
      { type: 'beast_combat', weight: 100 }, // Always a boss-tier beast
    ],
  },

  // ... more tables
};
```

### 3. Encounter Resolution

```typescript
function resolveEncounter(
  state: GameState,
  table: EncounterTable,
  rng: PRNG
): GameState {
  // Filter entries by conditions (realm, flags, items)
  const validEntries = table.entries.filter(entry => {
    if (entry.minRealm && state.player.realm < entry.minRealm) return false;
    if (entry.maxRealm && state.player.realm > entry.maxRealm) return false;
    if (entry.conditions) {
      return entry.conditions.every(c => checkCondition(state, c));
    }
    return true;
  });

  // Weighted random pick
  const picked = weightedPick(validEntries, rng);
  if (!picked) return state;

  // Resolve based on type
  switch (picked.type) {
    case 'beast_combat':
      return resolveBeastCombat(state, rng);
    case 'rogue_cultivator':
      return resolveRogueCultivator(state, rng);
    case 'treasure':
      return resolveTreasure(state, rng);
    case 'merchant':
      return resolveMerchant(state, rng);
    case 'ancient_inheritance':
      return resolveAncientInheritance(state, rng);
    case 'tribulation':
      return CultivationSystem.resolveTribulation(state, rng);
    case 'peaceful_moment':
      return resolvePeacefulMoment(state, rng);
    case 'rare_herb':
      return resolveRareHerb(state, rng);
    case 'wandering_elder':
      return resolveWanderingElder(state, rng);
    default:
      return state;
  }
}
```

---

## Encounter Type Details

### Beast Combat

```typescript
function resolveBeastCombat(state: GameState, rng: PRNG): GameState {
  const location = getLocation(state.world.currentNodeId)!;
  const beast = BeastGenerator.generate({
    tier: location.dangerLevel + rng.nextInt(-1, 2),  // ±1 variance
    isBoss: rng.next() < 0.05,  // 5% boss chance
  }, rng);

  // Interrupt travel if traveling
  if (state.player.action === 'traveling') {
    state = TravelSystem.interruptTravel(state, 'beast_ambush');
  }

  // Initiate combat
  return CombatSystem.initiateCombat(state, beast);
}
```

### Rogue Cultivator

A hostile NPC cultivator. Similar to beast combat but with generated human opponent and more narrative options:

```typescript
interface RogueCultivator {
  name: string;
  realm: number;
  subStage: number;
  attack: number;
  defense: number;
  speed: number;
  reason: string;  // "They demand your spirit stones!" / "A blood feud!"
}

function resolveRogueCultivator(state: GameState, rng: PRNG): GameState {
  const rogue = generateRogueCultivator(state.player.realm, rng);

  // Present choices: Fight, Bribe (spirit stones), Flee, Intimidate (karma check)
  const encounter: ResolvedEncounter = {
    id: generateId(),
    type: 'rogue_cultivator',
    title: `Rogue Cultivator: ${rogue.name}`,
    description: `A ${rogue.realmName} cultivator blocks your path. "${rogue.reason}"`,
    choices: [
      {
        id: 'fight',
        text: 'Fight!',
        outcome: { type: 'combat', beast: rogueToBeast(rogue) },
      },
      {
        id: 'bribe',
        text: `Offer ${rogue.bribeAmount} spirit stones to pass`,
        outcome: { type: 'nothing', message: 'They take the stones and sneer.' },
        requirement: { spiritStones: rogue.bribeAmount },
      },
      {
        id: 'intimidate',
        text: 'Intimidate with your cultivation aura',
        outcome: state.player.karma > 0
          ? { type: 'nothing', message: 'They flee before your righteous aura!' }
          : { type: 'combat', beast: rogueToBeast(rogue) },
        requirement: { karmaMin: 20 },
      },
      {
        id: 'flee',
        text: 'Attempt to flee',
        outcome: { type: 'combat', beast: rogueToBeast(rogue) },  // Flee handled in combat
      },
    ],
  };

  return presentEncounter(state, encounter);
}
```

### Treasure

Find loot without combat:

```typescript
function resolveTreasure(state: GameState, rng: PRNG): GameState {
  const rarityRoll = rng.next();
  let rarity: Rarity;
  if (rarityRoll < 0.50) rarity = 'common';
  else if (rarityRoll < 0.80) rarity = 'uncommon';
  else if (rarityRoll < 0.94) rarity = 'rare';
  else if (rarityRoll < 0.99) rarity = 'epic';
  else rarity = 'legendary';

  const item = rng.next() < 0.5
    ? WeaponGenerator.generate({ rarity, tier: state.player.realm }, rng)
    : ItemGenerator.generateTreasure({ rarity }, rng);

  const stones = Math.floor(10 * (state.player.realm + 1) * rarityWeight(rarity));

  return produce(state, draft => {
    draft.player.inventory.push(item);
    draft.player.spiritStones += stones;
    draft.log.push({
      type: 'encounter_treasure',
      tick: draft.tick,
      data: { item, spiritStones: stones },
    });
  });
}
```

### Merchant

Generates a wandering merchant with randomized inventory:

```typescript
function resolveMerchant(state: GameState, rng: PRNG): GameState {
  const merchant = generateMerchant(state.player.realm, rng);

  // Set player to trading mode
  return produce(state, draft => {
    draft.player.action = 'trading';
    draft.player.actionData = { type: 'trading', merchantId: merchant.id };
    // Merchant stored in a temporary encounter state
    draft.world.activeMerchant = merchant;
    draft.log.push({
      type: 'encounter_merchant',
      tick: draft.tick,
      data: { merchantName: merchant.name },
    });
  });
}
```

### Ancient Inheritance

Rare, powerful event. Grants major permanent bonuses:

```typescript
function resolveAncientInheritance(state: GameState, rng: PRNG): GameState {
  const inheritances = [
    { stat: 'comprehension', amount: 5,  text: 'Ancient wisdom floods your mind...' },
    { stat: 'attack',        amount: 10, text: 'A battle-hardened soul fragment merges with yours...' },
    { stat: 'luck',          amount: 3,  text: 'Fortune\'s favor is woven into your destiny...' },
    { stat: 'baseQi',        amount: 50, text: 'A dormant dantian awakens within you...' },
  ];

  const picked = rng.nextFrom(inheritances);

  // Sometimes grants a unique technique instead
  if (rng.next() < 0.3) {
    const technique = TechniqueGenerator.generate({
      rarity: 'legendary',
      tier: state.player.realm + 2, // Above current tier
    }, rng);
    // ...
  }

  return produce(state, draft => {
    draft.player[picked.stat] += picked.amount;
    draft.log.push({
      type: 'ancient_inheritance',
      tick: draft.tick,
      data: { stat: picked.stat, amount: picked.amount, text: picked.text },
    });
  });
}
```

### Wandering Elder

Random NPC who offers training, a quest hook, or cryptic advice:

```typescript
function resolveWanderingElder(state: GameState, rng: PRNG): GameState {
  const elderActions = [
    {
      text: '"Young cultivator, your foundation is shaky. Let me guide you."',
      effect: () => ({ type: 'statGain', stat: 'comprehension', amount: 2 }),
    },
    {
      text: '"I sense a bottleneck in your future. Take this."',
      effect: () => ({ type: 'loot', items: [generateBreakthroughPill(rng)], spiritStones: 0 }),
    },
    {
      text: '"The answers you seek lie in the Forbidden Valley."',
      effect: () => ({ type: 'flag', flag: 'elder_hint_forbidden_valley' }),
    },
  ];
  // ...
}
```

---

## Encounter with Player Choice

Some encounters present choices to the player (not auto-resolved). These create a "pause" in idle progression until the player decides:

```typescript
interface PendingEncounter {
  encounter: ResolvedEncounter;
  timestamp: number;
}

// When an encounter requires player choice — and is a dialogue-capable type
// (rogue cultivator, merchant, elder, sect patrol, assassin) — the encounter
// opens a dialogue tree instead of a simple choice menu.
// See Dialogue System: docs/systems/dialogue.md
function presentEncounter(state: GameState, encounter: ResolvedEncounter): GameState {
  return produce(state, draft => {
    // Attach dialogue tree for dialogue-capable encounter types
    if (isDialogueEncounter(encounter.type)) {
      draft.ui.activeDialogue = getDialogueTree(encounter.type, encounter.npcId);
    }
    draft.ui.pendingEncounter = encounter;
    // Auto-travel/cultivation timers continue; player is paused on dialogue
  });
}

// When player chooses:
function resolvePlayerChoice(
  state: GameState,
  encounterId: string,
  choiceId: string
): GameState {
  const encounter = state.ui.pendingEncounter;
  if (!encounter || encounter.id !== encounterId) return state;

  const choice = encounter.choices.find(c => c.id === choiceId);
  if (!choice) return state;

  // Validate requirements
  if (choice.requirement) {
    if (!meetsRequirement(state.player, choice.requirement)) {
      return state; // Choice not available
    }
  }

  // Apply outcome
  state = applyOutcome(state, choice.outcome);

  // Clear pending encounter
  return produce(state, draft => {
    draft.ui.pendingEncounter = null;
  });
}
```

---

## Encounter Cooldown

After an encounter resolves, a cooldown prevents back-to-back encounters:

```typescript
const ENCOUNTER_COOLDOWN = 120; // 2 minutes minimum between encounters
```

---

## API

```typescript
// ─── Main tick ──────────────────────────────

function tickEncounters(state: GameState, rng: PRNG, config: WorldConfig): GameState;

// ─── Encounter Resolution ───────────────────

function resolveEncounter(state: GameState, table: EncounterTable, rng: PRNG): GameState;
function resolveBeastCombat(state: GameState, rng: PRNG): GameState;
function resolveRogueCultivator(state: GameState, rng: PRNG): GameState;
function resolveTreasure(state: GameState, rng: PRNG): GameState;
function resolveMerchant(state: GameState, rng: PRNG): GameState;
function resolveAncientInheritance(state: GameState, rng: PRNG): GameState;
function resolvePeacefulMoment(state: GameState, rng: PRNG): GameState;
function resolveRareHerb(state: GameState, rng: PRNG): GameState;
function resolveWanderingElder(state: GameState, rng: PRNG): GameState;

// ─── Player Choice ──────────────────────────

function presentEncounter(state: GameState, encounter: ResolvedEncounter): GameState;
function resolvePlayerChoice(state: GameState, encounterId: string, choiceId: string): GameState;

// ─── Helpers ────────────────────────────────

function getEncounterTable(tableId: string): EncounterTable;
function weightedPick<T extends WeightedEncounter>(entries: T[], rng: PRNG): T | null;
function meetsRequirement(player: PlayerState, req: ChoiceRequirement): boolean;
```

---

## Testing Strategy

### Unit Tests
- Encounter roll respects cooldown interval
- Encounter chance increases with danger level
- Weighted pick respects weights (statistical test over 10000 rolls)
- Condition filtering excludes invalid entries (realm too low, etc.)
- Each encounter type produces correct state changes
- Beast combat correctly interrupts travel
- Treasure rarity distribution matches expected weights
- Merchant inventory is generated
- Player choice validation rejects insufficient spirit stones

### Integration Tests
- Full encounter → choice → outcome cycle
- Encounter during travel pauses travel, combat resolves, travel resumes
- Ancient inheritance permanently modifies stats
- Wandering elder bottleneck pill actually resolves bottleneck

### Snapshot Tests
- Fixed seed + state produces deterministic encounter
- Encounter description text is fully resolved

---

*See also: [Combat System](./combat.md), [World System](./world.md), [Dialogue System](./dialogue.md), [Procedural Generation](./procedural-generation.md)*
