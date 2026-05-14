import { GameState, LogEntry } from '../types';
import { EventEngine } from './EventEngine';
import { CombatEngine } from './CombatEngine';
import { LOCATIONS } from '../data/locations';
import { ITEMS } from '../data/items';

/** Deep-clone a GameState so mutations don't affect the original. */
function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export type GameAction =
  | { type: 'START_MEDITATION' }
  | { type: 'STOP_MEDITATION' }
  | { type: 'CHOOSE_EVENT'; choiceId: string }
  | { type: 'TRAVEL_TO'; locationId: string }
  | { type: 'ABSORB_ITEM'; itemId: string }
  | { type: 'EQUIP_WEAPON'; itemId: string }
  | { type: 'UNEQUIP_WEAPON' };

export class GameEngine {
  private eventEngine: EventEngine;

  constructor() {
    this.eventEngine = new EventEngine();
  }

  /** Process a single tick (1 second) */
  tick(state: GameState): GameState {
    let s = cloneState(state);
    s.tick += 1;

    // 1. Meditation: shén accumulates
    if (s.player.meditating && !s.ui.combatState) {
      const density = LOCATIONS[s.world.currentNodeId]?.shenDensity ?? 1.0;
      const rate = 0.01 * (1 + s.player.tier * 0.5) * density;
      const gained = Math.min(rate, s.player.maxShen - s.player.shen);
      s.player.shen = Math.min(s.player.maxShen, s.player.shen + gained);
      s.player.stats.totalShenGained += gained;
    }

    // 2. Travel progress
    if (s.world.travelState) {
      s.world.travelState.elapsed += 1;
      if (s.world.travelState.elapsed >= s.world.travelState.totalDuration) {
        const toId = s.world.travelState.toId;
        s.world.currentNodeId = toId;
        s.world.travelState = null;
        if (!s.world.visitedNodes.includes(toId)) {
          s.world.visitedNodes = [...s.world.visitedNodes, toId];
        }
        s.log = [...s.log, { type: 'travel' as const, tick: s.tick, text: `Arrived at ${LOCATIONS[toId]?.name ?? toId}.` }];
      }
    }

    // 3. Check for events
    if (!s.ui.combatState && !s.ui.currentEvent) {
      const nextEvent = this.eventEngine.getNextEvent(s);
      if (nextEvent) {
        this.eventEngine.markFired(nextEvent.id);
        // If chain event, mark chain progress
        if (nextEvent.chainId) {
          // Chain progress is tracked through event completion flags
        }
        s = { ...s, ui: { ...s.ui, currentEvent: nextEvent } };
      }
    }

    return s;
  }

  /** Process a player action */
  processAction(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'START_MEDITATION':
        return { ...state, player: { ...state.player, meditating: true } };

      case 'STOP_MEDITATION':
        return { ...state, player: { ...state.player, meditating: false } };

      case 'CHOOSE_EVENT': {
        const event = state.ui.currentEvent;
        if (!event) return state;

        const choice = event.choices.find(c => c.id === action.choiceId);
        if (!choice) return state;

        const outcome = choice.outcome;

        // Deep-clone state to avoid mutating the original
        let s = cloneState(state);
        
        // Apply effects
        if (outcome.spiritStones) {
          s.player.spiritStones += outcome.spiritStones;
          s.player.stats.totalStonesEarned += outcome.spiritStones;
        }
        if (outcome.shenChange) {
          const gained = Math.min(outcome.shenChange, s.player.maxShen - s.player.shen);
          s.player.shen += gained;
          s.player.stats.totalShenGained += gained;
        }
        if (outcome.healthChange) {
          s.player.health = Math.max(0, Math.min(s.player.maxHealth, s.player.health + outcome.healthChange));
        }
        if (outcome.karmaChange) {
          s.player.karma = Math.max(-100, Math.min(100, s.player.karma + outcome.karmaChange));
        }
        if (outcome.statChanges) {
          const p = s.player as unknown as Record<string, number>;
          for (const [stat, val] of Object.entries(outcome.statChanges)) {
            if (typeof p[stat] === 'number') {
              p[stat] = p[stat] + val;
            }
          }
        }

        // Items gained
        if (outcome.itemsGained) {
          for (const itemId of outcome.itemsGained) {
            const template = ITEMS[itemId];
            if (template) {
              const existing = s.player.inventory.find(i => i.id === itemId && i.stackable);
              if (existing) {
                existing.quantity += 1;
              } else {
                s.player.inventory = [...s.player.inventory, { ...template, quantity: 1 }];
              }
            }
          }
        }

        // Items lost
        if (outcome.itemsLost) {
          for (const itemId of outcome.itemsLost) {
            const idx = s.player.inventory.findIndex(i => i.id === itemId);
            if (idx >= 0) {
              const item = s.player.inventory[idx]!;
              if (item.quantity > 1) {
                item.quantity -= 1;
              } else {
                s.player.inventory = s.player.inventory.filter((_, i) => i !== idx);
              }
            }
          }
        }

        // Flags
        if (outcome.flagsSet) {
          s.flags = { ...s.flags, ...outcome.flagsSet };
        }

        // Combat
        if (outcome.combat) {
          s = CombatEngine.startCombat(s, outcome.combat);
        }

        // Travel
        if (outcome.travelTo) {
          const fromId = s.world.currentNodeId;
          const loc = LOCATIONS[outcome.travelTo];
          if (loc) {
            const travelTime = loc.neighbors[fromId] ?? Object.values(LOCATIONS[fromId]?.neighbors ?? {}).find((_, k) => Object.keys(LOCATIONS[fromId]?.neighbors ?? {})[k] === outcome.travelTo) ?? 600;
            s.world.travelState = {
              fromId,
              toId: outcome.travelTo,
              totalDuration: loc.neighbors[fromId] ?? 600,
              elapsed: 0,
            };
          }
        }

        // Mark event as done
        s.flags = { ...s.flags, [`event_${event.id}_done`]: true };

        // Log
        s.log = [...s.log, { type: 'event' as const, tick: s.tick, text: event.title }];
        s.player.stats.totalEventsResolved += 1;

        // Clear current event and check for chain continuation
        s.ui.currentEvent = null;

        // If nextEventId is set, mark that the next chain stage is ready
        if (outcome.nextEventId) {
          const nextEvent = event; // Look for the next event in the chain
          // The EventEngine will find it on the next tick
        }

        return s;
      }

      case 'TRAVEL_TO': {
        const loc = LOCATIONS[action.locationId];
        if (!loc) return state;
        const currentNode = LOCATIONS[state.world.currentNodeId];
        if (!currentNode) return state;
        const travelTime = currentNode.neighbors[action.locationId];
        if (!travelTime) return state;
        if (state.player.tier < loc.minTier) return state;
        if (state.ui.combatState) return state;
        if (state.world.travelState) return state;

        return {
          ...state,
          world: {
            ...state.world,
            travelState: {
              fromId: state.world.currentNodeId,
              toId: action.locationId,
              totalDuration: travelTime,
              elapsed: 0,
            },
          },
          log: [...state.log, { type: 'travel' as const, tick: state.tick, text: `Traveling to ${loc.name}...` }],
        };
      }

      case 'ABSORB_ITEM': {
        const idx = state.player.inventory.findIndex(i => i.id === action.itemId);
        if (idx < 0) return state;
        const item = state.player.inventory[idx]!;
        if (!item.shenContained) return state;

        const shenGain = item.shenContained;
        const newShen = Math.min(state.player.maxShen, state.player.shen + shenGain);

        const newInventory = [...state.player.inventory];
        if (item.quantity > 1) {
          newInventory[idx] = { ...item, quantity: item.quantity - 1 };
        } else {
          newInventory.splice(idx, 1);
        }

        return {
          ...state,
          player: {
            ...state.player,
            shen: newShen,
            inventory: newInventory,
            stats: {
              ...state.player.stats,
              totalShenGained: state.player.stats.totalShenGained + shenGain,
            },
          },
          log: [...state.log, { type: 'item' as const, tick: state.tick, text: `Absorbed ${item.name}. +${shenGain} shén.` }],
        };
      }

      case 'EQUIP_WEAPON': {
        const idx = state.player.inventory.findIndex(i => i.id === action.itemId && i.type === 'weapon');
        if (idx < 0) return state;
        const weapon = state.player.inventory[idx]!;

        const newInventory = state.player.inventory.filter((_, i) => i !== idx);
        if (state.player.equippedWeapon) {
          newInventory.push(state.player.equippedWeapon);
        }

        return {
          ...state,
          player: {
            ...state.player,
            equippedWeapon: weapon,
            inventory: newInventory,
          },
        };
      }

      case 'UNEQUIP_WEAPON': {
        if (!state.player.equippedWeapon) return state;
        return {
          ...state,
          player: {
            ...state.player,
            equippedWeapon: null,
            inventory: [...state.player.inventory, state.player.equippedWeapon],
          },
        };
      }

      default:
        return state;
    }
  }
}
