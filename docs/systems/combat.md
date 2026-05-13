# Combat System

> **Module**: `src/systems/CombatSystem.ts`
>
> **Type**: Pure functions, no side effects
>
> **Signature**: `(state: GameState, params?) => GameState`

---

## Overview

Combat is **auto-resolved** on a per-tick basis. When the player enters combat (via encounter or action), the combat loop runs each tick: the player and enemy exchange blows until one side falls or the player flees. The player sees a turn-by-turn log with flavor text but makes no tactical decisions during combat.

---

## Core Mechanics

### 1. Combat Initiation

Combat begins when:
- A beast encounter triggers during travel
- A rogue cultivator encounter is chosen with "fight" option
- A tribulation manifests as combat
- Player attacks a location (future feature)

```typescript
function initiateCombat(state: GameState, enemy: Beast): GameState {
  return produce(state, draft => {
    draft.player.inCombat = true;
    draft.player.combatState = {
      enemy,
      turn: 0,
      playerHealth: draft.player.health,
      enemyHealth: enemy.health,
      log: [],
      status: 'active',
    };
    draft.player.action = 'in_combat';
  });
}
```

### 2. Combat Tick

Each tick, one turn resolves:

```
1. Determine turn order (higher speed goes first)
2. Attacker selects action:
   - Player: highest-damage equipped technique (off cooldown) or basic attack
   - Enemy: random ability or basic attack
3. Calculate damage:
   damage = (attackerAttack × techniqueMultiplier × elementalAdvantage)
          - (defenderDefense × defenseReduction)
4. Check crit (random, based on technique + speed diff)
5. Check dodge (random, based on speed diff)
6. Apply damage to defender
7. Log the action with flavor text
8. Check win/loss conditions
9. Switch turns
```

### 3. Damage Formula

```typescript
function calculateDamage(input: DamageInput, rng: PRNG): DamageOutput {
  // Dodge check (before damage calc)
  const dodgeRoll = rng.next();
  if (dodgeRoll < input.dodgeChance) {
    return { damage: 0, isCrit: false, isDodge: true, actualDamage: 0 };
  }

  // Base damage
  let rawDamage = input.attackerAttack * input.techniqueMultiplier * input.elementalAdvantage;

  // Defense reduction
  const defenseReduction = input.defenderDefense * COMBAT_CONFIG.baseDefenseReduction;
  rawDamage = Math.max(1, rawDamage - defenseReduction); // Minimum 1 damage

  // Crit check
  const critRoll = rng.next();
  const isCrit = critRoll < input.critChance;
  if (isCrit) {
    rawDamage *= input.critMultiplier;
  }

  // Variance (±10%)
  const variance = 0.9 + rng.next() * 0.2; // 0.9 to 1.1
  const actualDamage = Math.round(rawDamage * variance);

  return { damage: rawDamage, isCrit, isDodge: false, actualDamage };
}
```

### 4. Technique Selection (Player)

The player auto-uses their best available technique each turn:

```typescript
function selectPlayerAction(player: PlayerState): Technique | 'basic_attack' {
  const available = player.equippedTechniques.filter(t => t.currentCooldown <= 0);
  if (available.length === 0) return 'basic_attack';

  // Pick highest damage multiplier technique
  available.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
  return available[0];
}
```

**Basic attack**: `damageMultiplier = 1.0`, no qi cost, no cooldown.

### 5. Technique Effects

When a technique is used, its effects apply:

| Effect Type | Resolution |
|-------------|------------|
| `damage` | Additional flat damage |
| `heal` | Heal player by amount |
| `buff` | Temporary stat increase for duration ticks |
| `debuff` | Temporary stat decrease on enemy |
| `shield` | Absorb damage for duration |
| `teleport` | Guaranteed dodge this turn + flee chance boost |

Effects with `duration > 0` create temporary status effects tracked in `CombatState`.

### 6. Enemy AI

Enemies have simple behavior:

```typescript
function selectEnemyAction(enemy: Beast, rng: PRNG): BeastAbility | 'basic_attack' {
  const available = enemy.abilities.filter(a => a.currentCooldown <= 0);

  // Bosses use abilities more aggressively
  const abilityChance = enemy.isBoss ? 0.8 : 0.4;

  if (available.length > 0 && rng.next() < abilityChance) {
    return rng.nextFrom(available);
  }
  return 'basic_attack';
}
```

### 7. Combat End Conditions

| Condition | Result |
|-----------|--------|
| `enemyHealth ≤ 0` | **Victory** — loot drops, XP gained, combat log saved |
| `playerHealth ≤ 0` | **Defeat** — lose spirit stones, cultivation setback, respawn at last safe location |
| `turn ≥ maxTurns` | **Stalemate** — combat ends, no loot (or enemy flees) |
| Player uses `FLEE` action | **Flee attempt** — success based on speed diff + luck |

### 8. Fleeing

```typescript
function attemptFlee(state: GameState, rng: PRNG): GameState {
  const speedDiff = state.player.speed - state.player.combatState!.enemy.speed;
  const fleeChance = Math.min(0.9, Math.max(0.1,
    COMBAT_CONFIG.fleeBaseChance + (speedDiff * 0.05)
  ));

  if (rng.next() < fleeChance) {
    return endCombat(state, 'fled');
  } else {
    // Failed to flee; enemy gets a free attack
    return enemyAttack(state, rng);
  }
}
```

---

## Elemental Advantage System

### Elemental Advantage System

See the full 11×11 interaction matrix in [Element System](./elements.md#elemental-combat-interactions). Summary of the Five Phases cycle:

```
Fire  → beats → Metal
Metal → beats → Wood
Wood  → beats → Earth
Earth → beats → Water
Water → beats → Fire
```

Plus special elements:

```
Thunder → beats → Water, Metal
Wind    → beats → Earth, Wood
Ice     → beats → Fire, Wind
Dark    → neutral to all, bonus vs Light
Light   → neutral to all, bonus vs Dark
```

### Advantage Multiplier

| Relationship | Multiplier |
|--------------|------------|
| Attacker has advantage | ×1.5 |
| Neutral | ×1.0 |
| Attacker has disadvantage | ×0.75 |

Element of attack is determined by:
- **Player**: Element of equipped weapon (if any) or element of technique used
- **Enemy**: Element of the beast

---

## Post-Combat

### Victory

```typescript
function onVictory(state: GameState, enemy: Beast, rng: PRNG): GameState {
  return produce(state, draft => {
    // Generate loot
    const loot = generateLoot(enemy.lootTable, rng);
    draft.player.spiritStones += loot.spiritStones;
    draft.player.inventory.push(...loot.items);

    // Stat gains (small permanent growth from combat experience)
    draft.player.attack += Math.ceil(enemy.tier * 0.1);
    draft.player.defense += Math.ceil(enemy.tier * 0.05);

    // Mastery gain for techniques used
    // (techniques gain mastery, increasing their effectiveness)

    // Clear combat
    draft.player.inCombat = false;
    draft.player.combatState = null;
    draft.player.action = 'idle';

    // Log victory
    draft.log.push({
      type: 'combat_victory',
      tick: draft.tick,
      data: { enemy: enemy.name, loot }
    });
  });
}
```

### Defeat

```typescript
function onDefeat(state: GameState, penalty: DefeatPenalty): GameState {
  return produce(state, draft => {
    draft.player.spiritStones = Math.max(0, draft.player.spiritStones - penalty.spiritStonesLost);
    draft.player.currentQi = Math.max(0, draft.player.currentQi - penalty.cultivationSetback);
    draft.player.health = Math.max(1, Math.round(draft.player.maxHealth * 0.3));

    // Respawn at nearest safe location (village/city)
    const safeLocation = findNearestSafeLocation(draft.world.currentNodeId);
    draft.world.currentNodeId = safeLocation.id;
    draft.world.travelState = null;

    draft.player.inCombat = false;
    draft.player.combatState = null;
    draft.player.action = 'idle';

    draft.player.stats.totalDeaths += 1;
  });
}
```

---

## API

```typescript
// ─── Combat Lifecycle ──────────────────────

function initiateCombat(state: GameState, enemy: Beast): GameState;
function tickCombat(state: GameState, rng: PRNG, config: CombatConfig): GameState;
function attemptFlee(state: GameState, rng: PRNG, config: CombatConfig): GameState;
function endCombat(state: GameState, result: CombatResult): GameState;

// ─── Damage Calculation ────────────────────

function calculateDamage(input: DamageInput, rng: PRNG): DamageOutput;
function getElementalAdvantage(attackElement: Element | null, defendElement: Element | null): number;

// ─── Action Selection ──────────────────────

function selectPlayerAction(player: PlayerState): Technique | 'basic_attack';
function selectEnemyAction(enemy: Beast, rng: PRNG): BeastAbility | 'basic_attack';

// ─── Loot ──────────────────────────────────

function generateLoot(lootTable: LootTable, rng: PRNG): LootResult;
```

---

## Combat Config

```typescript
interface CombatConfig {
  baseDefenseReduction: number;         // 0.5 — 50% of defense reduces damage
  critBaseChance: number;               // 0.05 — 5% base crit
  critMultiplier: number;               // 2.0 — Double damage on crit
  dodgeBaseChance: number;              // 0.03 — 3% base dodge
  speedToDodgeWeight: number;           // 0.01 — Per point of speed diff
  speedToTurnOrderWeight: number;       // 0.02 — Higher speed = go first more often
  elementalAdvantageMultiplier: number; // 1.5
  elementalDisadvantageMultiplier: number; // 0.75
  maxTurns: number;                     // 50 — Auto-flee after this
  fleeBaseChance: number;               // 0.4
  damageVariance: number;               // 0.1 — ±10% variance
  minDamage: number;                    // 1 — Minimum damage per hit
}
```

---

## Testing Strategy

### Unit Tests
- Damage calculation with known inputs produces expected range
- Elemental advantage lookup returns correct multipliers
- Crit/dodge checks with seeded RNG are deterministic
- Combat tick alternates turns correctly
- Victory triggers when enemy HP ≤ 0
- Defeat triggers when player HP ≤ 0
- Flee success/failure works with speed diff
- Loot generation respects loot table weights
- Technique cooldowns decrement each turn
- Player selects highest-damage available technique

### Integration Tests
- Full combat: initiate → auto-resolve 10 turns → check log
- Boss combat uses abilities more aggressively
- Elemental advantage affects damage output measurably
- Post-combat stat gains are applied

### Snapshot Tests
- Given a fixed seed and state, combat resolves identically
- Combat log text is deterministic

---

*See also: [Data Models](../data-models.md), [Encounter System](./encounters.md), [Element System](./elements.md), [Martial Arts System](./martial-arts.md), [Spell System](./spells.md), [Procedural Generation](./procedural-generation.md)*
