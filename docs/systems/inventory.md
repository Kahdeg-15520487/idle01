# Inventory & Equipment System

> **Module**: `src/systems/InventorySystem.ts`, `src/systems/MerchantSystem.ts`
>
> **Type**: Pure functions, no side effects
>
> **Signature**: `(state: GameState, params?) => ActionResult<GameState>`

---

## Overview

The inventory system manages the player's items: weapons, techniques, pills, materials, and treasures. It handles equipping/unequipping, using consumables, learning techniques, stacking items, and interacting with merchants.

---

## Inventory Rules

### Capacity

```typescript
const DEFAULT_INVENTORY_SIZE = 50;
```

When inventory is full, new items cannot be picked up. The player must discard or sell items.

### Item Stacking

Some item types stack (identical items share a slot with quantity):

| Item Type | Stackable | Max Stack |
|-----------|-----------|-----------|
| `weapon` | No | 1 |
| `technique_scroll` | No | 1 |
| `pill` | Yes (same type+rarity) | 99 |
| `herb` | Yes (same type) | 99 |
| `beast_core` | Yes (same tier+element) | 99 |
| `material` | Yes (same type+tier) | 99 |
| `treasure` | No | 1 |
| `consumable` | Yes (same type) | 99 |

```typescript
function addItem(state: GameState, item: Item): ActionResult<GameState> {
  if (state.player.inventory.length >= state.config.ui.inventoryMaxSize && !item.stackable) {
    return { success: false, message: 'Inventory is full!' };
  }

  return produce(state, draft => {
    if (item.stackable) {
      // Try to stack with existing item
      const existing = draft.player.inventory.find(i =>
        i.name === item.name && i.type === item.type && i.rarity === item.rarity
      );
      if (existing) {
        existing.quantity += item.quantity;
        return;
      }
    }

    // Add as new slot
    draft.player.inventory.push({ ...item });
  });

  return { success: true, state, message: `Acquired ${item.name}.` };
}

function removeItem(state: GameState, itemId: string, quantity?: number): ActionResult<GameState> {
  return produce(state, draft => {
    const idx = draft.player.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return { success: false, message: 'Item not found.' };

    const item = draft.player.inventory[idx]!;
    if (item.stackable && quantity && quantity < item.quantity) {
      item.quantity -= quantity;
    } else {
      draft.player.inventory.splice(idx, 1);
    }
  });
}
```

---

## Equipment Slots

```typescript
// Player has fixed equipment slots:
interface EquipmentSlots {
  weapon: Weapon | null;              // 1 weapon
  techniques: Technique[];            // Up to 4 techniques
  // Future expansion:
  // armor: Armor | null;
  // accessory: Accessory | null;
}
```

### Equip Weapon

```typescript
function equipWeapon(state: GameState, weaponId: string): ActionResult<GameState> {
  const weapon = state.player.inventory.find(i => i.id === weaponId && i.type === 'weapon');
  if (!weapon) return { success: false, message: 'Weapon not found in inventory.' };

  // Check requirements
  if (weapon.requirements) {
    if (weapon.requirements.minRealm && state.player.realm < weapon.requirements.minRealm) {
      return { success: false, message: `Requires ${REALMS[weapon.requirements.minRealm].name} realm or higher.` };
    }
  }

  return produce(state, draft => {
    // Unequip current weapon (moves to inventory)
    if (draft.player.equippedWeapon) {
      draft.player.inventory.push(draft.player.equippedWeapon);
    }

    // Remove weapon from inventory and equip
    const idx = draft.player.inventory.findIndex(i => i.id === weaponId);
    draft.player.equippedWeapon = draft.player.inventory[idx] as Weapon;
    draft.player.inventory.splice(idx, 1);

    // Apply weapon stats
    recalculateStats(draft.player);
  });

  return { success: true, state, message: `Equipped ${weapon.name}.` };
}

function unequipWeapon(state: GameState): ActionResult<GameState> {
  if (!state.player.equippedWeapon) {
    return { success: false, message: 'No weapon equipped.' };
  }

  return produce(state, draft => {
    draft.player.inventory.push(draft.player.equippedWeapon!);
    draft.player.equippedWeapon = null;
    recalculateStats(draft.player);
  });

  return { success: true, state, message: 'Weapon unequipped.' };
}
```

### Equip Technique

```typescript
function learnTechnique(state: GameState, scrollId: string): ActionResult<GameState> {
  const scroll = state.player.inventory.find(i => i.id === scrollId && i.type === 'technique_scroll');
  if (!scroll) return { success: false, message: 'Technique scroll not found.' };

  if (state.player.equippedTechniques.length >= 4) {
    return { success: false, message: 'Maximum techniques learned (4). Forget one first.' };
  }

  return produce(state, draft => {
    const idx = draft.player.inventory.findIndex(i => i.id === scrollId);
    const technique = draft.player.inventory[idx] as Technique;
    draft.player.equippedTechniques.push({ ...technique, mastery: 0, maxMastery: 100 });
    draft.player.inventory.splice(idx, 1);

    draft.log.push({
      type: 'technique_learned',
      tick: draft.tick,
      data: { techniqueName: technique.name },
    });

    recalculateStats(draft.player);
  });

  return { success: true, state, message: `Learned ${scroll.name}!` };
}

function forgetTechnique(state: GameState, techniqueId: string): ActionResult<GameState> {
  const idx = state.player.equippedTechniques.findIndex(t => t.id === techniqueId);
  if (idx === -1) return { success: false, message: 'Technique not equipped.' };

  return produce(state, draft => {
    const technique = draft.player.equippedTechniques[idx];
    // Forgotten techniques become scrolls (can re-learn later, or sell)
    const scroll: Item = {
      ...technique,
      type: 'technique_scroll',
      stackable: false,
      quantity: 1,
    };
    draft.player.inventory.push(scroll);
    draft.player.equippedTechniques.splice(idx, 1);
    recalculateStats(draft.player);
  });

  return { success: true, state, message: `Forgotten ${technique.name}.` };
}
```

---

## Consumable Items

### Using Pills

```typescript
function useItem(state: GameState, itemId: string): ActionResult<GameState> {
  const item = state.player.inventory.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not found.' };

  switch (item.type) {
    case 'pill':
      return usePill(state, item as Pill);
    case 'consumable':
      return useConsumable(state, item);
    default:
      return { success: false, message: 'Cannot use this item.' };
  }
}

function usePill(state: GameState, pill: Pill): ActionResult<GameState> {
  const result = produce(state, draft => {
    // Remove one pill
    const idx = draft.player.inventory.findIndex(i => i.id === pill.id);
    const invItem = draft.player.inventory[idx]!;
    if (invItem.quantity > 1) {
      invItem.quantity -= 1;
    } else {
      draft.player.inventory.splice(idx, 1);
    }

    // Apply pill effect
    applyPillEffect(draft.player, pill);

    // Apply toxicity
    draft.player.toxicity = (draft.player.toxicity ?? 0) + pill.toxicity;

    draft.log.push({
      type: 'item_used',
      tick: draft.tick,
      data: { itemName: pill.name, effect: pill.effect.description },
    });
  });

  return { success: true, state: result, message: `Used ${pill.name}. ${pill.effect.description}` };
}
```

### Toxicity Mechanic

Some pills (especially powerful ones) have toxicity. Accumulating toxicity causes debuffs:

| Toxicity Level | Effect |
|----------------|--------|
| 0–30 | None |
| 31–60 | -10% cultivation speed |
| 61–80 | -25% cultivation speed, -5% all stats |
| 81–100 | -50% cultivation speed, -15% all stats, health drain |

Toxicity decays over time (1 point per 60 ticks while not consuming pills).

---

## Stat Recalculation

Whenever equipment changes, player stats are recalculated:

```typescript
function recalculateStats(player: PlayerState): void {
  // Base stats from race + realm
  const base = getBaseStats(player);

  // Equipment bonuses
  let bonusAttack = 0;
  let bonusDefense = 0;
  // ... etc

  if (player.equippedWeapon) {
    bonusAttack += player.equippedWeapon.baseAttack;
    for (const mod of player.equippedWeapon.modifiers) {
      applyModifier(mod, bonusStats);
    }
  }

  for (const tech of player.equippedTechniques) {
    // Some techniques grant passive stat bonuses
    for (const effect of tech.effects) {
      if (effect.type === 'buff' && effect.duration === 0) {
        applyEffect(effect, bonusStats);
      }
    }
  }

  // Set final stats
  player.attack = base.attack + bonusAttack;
  player.defense = base.defense + bonusDefense;
  // ...
}
```

---

## Merchant System

Merchants appear as encounters or at location services. They buy/sell items.

### Merchant Generation

```typescript
function generateMerchant(playerRealm: number, rng: PRNG): Merchant {
  const merchantTypes = [
    { title: 'Wandering Alchemist', specializesIn: ['pill', 'herb'] },
    { title: 'Weapon Peddler', specializesIn: ['weapon'] },
    { title: 'Technique Scroll Vendor', specializesIn: ['technique_scroll'] },
    { title: 'Treasure Hunter', specializesIn: ['treasure', 'material'] },
    { title: 'General Trader', specializesIn: [] },
  ];

  const type = rng.nextFrom(merchantTypes);

  // Generate inventory (6–12 items)
  const inventorySize = rng.nextInt(6, 12);
  const inventory: Item[] = [];
  for (let i = 0; i < inventorySize; i++) {
    const itemType = type.specializesIn.length > 0
      ? rng.nextFrom(type.specializesIn)
      : rng.nextFrom(ALL_ITEM_TYPES);

    inventory.push(generateShopItem(itemType, playerRealm, rng));
  }

  return {
    id: generateId('merchant'),
    name: generateMerchantName(rng),
    title: type.title,
    inventory,
    buyMultiplier: 0.4,   // Sells at 40% of value (lowball)
    sellMultiplier: 1.5,  // Buys at 150% of value (markup)
    specializesIn: type.specializesIn,
  };
}
```

### Buy/Sell Logic

```typescript
function buyItem(state: GameState, merchant: Merchant, itemId: string): ActionResult<GameState> {
  const item = merchant.inventory.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not available.' };

  const price = Math.ceil(item.value * merchant.sellMultiplier);
  if (state.player.spiritStones < price) {
    return { success: false, message: `Not enough spirit stones. Need ${price}.` };
  }

  // Check inventory space
  if (state.player.inventory.length >= state.config.ui.inventoryMaxSize && !item.stackable) {
    return { success: false, message: 'Inventory is full!' };
  }

  return produce(state, draft => {
    draft.player.spiritStones -= price;
    draft.player.inventory.push({ ...item, id: generateId('item') }); // New unique ID
    // Remove from merchant inventory
    const mIdx = draft.world.activeMerchant!.inventory.findIndex(i => i.id === itemId);
    draft.world.activeMerchant!.inventory.splice(mIdx, 1);
  });

  return { success: true, state, message: `Bought ${item.name} for ${price} spirit stones.` };
}

function sellItem(state: GameState, merchant: Merchant, itemId: string): ActionResult<GameState> {
  const idx = state.player.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return { success: false, message: 'Item not in inventory.' };

  const item = state.player.inventory[idx]!;

  // Cannot sell equipped items
  if (state.player.equippedWeapon?.id === itemId) {
    return { success: false, message: 'Cannot sell equipped weapon.' };
  }
  if (state.player.equippedTechniques.some(t => t.id === itemId)) {
    return { success: false, message: 'Cannot sell learned technique.' };
  }

  const price = Math.floor(item.value * merchant.buyMultiplier);

  return produce(state, draft => {
    // Remove from player inventory
    const pIdx = draft.player.inventory.findIndex(i => i.id === itemId);
    draft.player.inventory.splice(pIdx, 1);
    draft.player.spiritStones += price;

    // Add to merchant inventory (they now sell it)
    draft.world.activeMerchant?.inventory.push({ ...item });
  });

  return { success: true, state, message: `Sold ${item.name} for ${price} spirit stones.` };
}
```

---

## API

```typescript
// ─── Inventory ──────────────────────────────

function addItem(state: GameState, item: Item): ActionResult<GameState>;
function removeItem(state: GameState, itemId: string, quantity?: number): ActionResult<GameState>;
function useItem(state: GameState, itemId: string): ActionResult<GameState>;
function discardItem(state: GameState, itemId: string): ActionResult<GameState>;

// ─── Equipment ──────────────────────────────

function equipWeapon(state: GameState, weaponId: string): ActionResult<GameState>;
function unequipWeapon(state: GameState): ActionResult<GameState>;
function learnTechnique(state: GameState, scrollId: string): ActionResult<GameState>;
function forgetTechnique(state: GameState, techniqueId: string): ActionResult<GameState>;

// ─── Pills ──────────────────────────────────

function usePill(state: GameState, pill: Pill): ActionResult<GameState>;
function applyPillEffect(player: PlayerState, pill: Pill): void;
function tickToxicity(state: GameState): GameState;  // Decay toxicity

// ─── Stats ──────────────────────────────────

function recalculateStats(player: PlayerState): void;
function getBaseStats(player: PlayerState): BaseStats;

// ─── Merchant ───────────────────────────────

function generateMerchant(playerRealm: number, rng: PRNG): Merchant;
function buyItem(state: GameState, merchant: Merchant, itemId: string): ActionResult<GameState>;
function sellItem(state: GameState, merchant: Merchant, itemId: string): ActionResult<GameState>;
function generateShopItem(type: ItemType, playerRealm: number, rng: PRNG): Item;
```

---

## State Restrictions

Certain actions are blocked during specific states:

| Action | Blocked During |
|--------|---------------|
| `equipWeapon` | `inCombat` |
| `unequipWeapon` | `inCombat` |
| `learnTechnique` | `inCombat` |
| `forgetTechnique` | `inCombat` |
| `useItem` | Never blocked (pills can be used in combat) |
| `buyItem` | Only when `action === 'trading'` |
| `sellItem` | Only when `action === 'trading'` |
| `discardItem` | Never blocked |

---

## Testing Strategy

### Unit Tests
- `addItem` stacks stackable items correctly
- `addItem` fails when inventory full for non-stackable items
- `equipWeapon` unequips current weapon first
- `equipWeapon` fails requirement checks
- `equipWeapon` applies stats correctly
- `unequipWeapon` returns weapon to inventory
- `learnTechnique` fails when 4 techniques already known
- `forgetTechnique` returns technique as scroll
- `usePill` consumes one from stack, applies effect
- `usePill` increases toxicity
- `buyItem` fails with insufficient spirit stones
- `sellItem` cannot sell equipped items
- `recalculateStats` computes correct totals from equipment

### Integration Tests
- Equip weapon → stats increase → combat damage increases
- Learn technique → technique available in combat
- Use breakthrough pill → breakthrough chance increases
- Buy weapon from merchant → equip → verify stat change
- Full buy/sell cycle with merchant inventory sync

---

*See also: [Data Models](../data-models.md), [Procedural Generation](./procedural-generation.md), [Combat System](./combat.md)*
