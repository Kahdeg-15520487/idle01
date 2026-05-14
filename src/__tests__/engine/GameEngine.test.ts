/**
 * Headless engine tests — GameEngine.
 * These run without DOM / browser, pure logic.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../engine/GameEngine';
import { createInitialState } from '../../state/GameState';
import { GameState } from '../../types';
import { LOCATIONS } from '../../data/locations';

function freshState(overrides?: Partial<GameState>): GameState {
  return { ...createInitialState('TestCultivator', 'human', 'village_orphan'), ...overrides };
}

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('creates an engine instance', () => {
    expect(engine).toBeDefined();
  });

  describe('tick()', () => {
    it('increments tick counter each second', () => {
      const state = freshState();
      const next = engine.tick(state);
      expect(next.tick).toBe(state.tick + 1);
    });

    it('does not accumulate shen when not meditating', () => {
      const state = freshState({ player: { ...freshState().player, meditating: false, shen: 0 } });
      const next = engine.tick(state);
      expect(next.player.shen).toBe(0);
    });

    it('accumulates shen when meditating', () => {
      const state = freshState({
        player: { ...freshState().player, meditating: true, shen: 0, maxShen: 10, tier: 0 },
      });
      // Rate: 0.01 * (1 + 0*0.5) * 1.0 = 0.01 per tick
      const next = engine.tick(state);
      expect(next.player.shen).toBeGreaterThan(0);
      expect(next.player.stats.totalShenGained).toBeGreaterThan(0);
    });

    it('caps shen at maxShen', () => {
      const state = freshState({
        player: { ...freshState().player, meditating: true, shen: 9.995, maxShen: 10, tier: 0 },
      });
      const next = engine.tick(state);
      expect(next.player.shen).toBeLessThanOrEqual(next.player.maxShen);
    });

    it('advances travel progress', () => {
      const state = freshState({
        world: {
          ...freshState().world,
          travelState: {
            fromId: 'azure_cloud_village',
            toId: 'whispering_forest',
            totalDuration: 900,
            elapsed: 898,
          },
        },
      });
      // Two ticks: 899, then 900→arrive
      let s = engine.tick(state);
      expect(s.world.travelState).not.toBeNull();
      expect(s.world.travelState!.elapsed).toBe(899);

      s = engine.tick(s);
      expect(s.world.travelState).toBeNull();
      expect(s.world.currentNodeId).toBe('whispering_forest');
      expect(s.world.visitedNodes).toContain('whispering_forest');
      expect(s.log.some(l => l.type === 'travel')).toBe(true);
    });

    it('does not fire events when combat is active', () => {
      const state = freshState({
        ui: {
          ...freshState().ui,
          combatState: {
            enemy: { name: 'Test Beast', health: 30, attack: 5, defense: 2, speed: 6, loot: { stones: [0, 0], items: [] } },
            playerHealth: 50,
            enemyHealth: 30,
            turn: 0,
            status: 'active',
            log: [],
          },
        },
      });
      const next = engine.tick(state);
      expect(next.ui.currentEvent).toBeNull();
    });
  });

  describe('processAction()', () => {
    it('START_MEDITATION sets meditating to true', () => {
      const state = freshState({ player: { ...freshState().player, meditating: false } });
      const next = engine.processAction(state, { type: 'START_MEDITATION' });
      expect(next.player.meditating).toBe(true);
    });

    it('STOP_MEDITATION sets meditating to false', () => {
      const state = freshState({ player: { ...freshState().player, meditating: true } });
      const next = engine.processAction(state, { type: 'STOP_MEDITATION' });
      expect(next.player.meditating).toBe(false);
    });

    it('ABSORB_ITEM transfers shen from vessel to player', () => {
      const state = freshState({
        player: {
          ...freshState().player,
          shen: 0,
          maxShen: 10,
          inventory: [
            {
              id: 'qi_crystal',
              name: 'Qi Crystal',
              type: 'shen_vessel',
              description: 'test',
              value: 5,
              stackable: true,
              quantity: 1,
              shenContained: 0.5,
            },
          ],
        },
      });
      const next = engine.processAction(state, { type: 'ABSORB_ITEM', itemId: 'qi_crystal' });
      expect(next.player.shen).toBe(0.5);
      expect(next.player.inventory).toHaveLength(0);
      expect(next.player.stats.totalShenGained).toBe(0.5);
    });

    it('ABSORB_ITEM ignores items without shenContained', () => {
      const state = freshState({
        player: {
          ...freshState().player,
          shen: 0,
          inventory: [
            {
              id: 'jade_token',
              name: 'Jade Token',
              type: 'key_item',
              description: 'test',
              value: 0,
              stackable: false,
              quantity: 1,
            },
          ],
        },
      });
      const next = engine.processAction(state, { type: 'ABSORB_ITEM', itemId: 'jade_token' });
      expect(next.player.shen).toBe(0);
      expect(next.player.inventory).toHaveLength(1);
    });

    it('EQUIP_WEAPON moves weapon from inventory to equipped slot', () => {
      const state = freshState({
        player: {
          ...freshState().player,
          equippedWeapon: null,
          inventory: [
            {
              id: 'iron_saber',
              name: 'Iron Saber',
              type: 'weapon',
              description: 'test',
              value: 15,
              stackable: false,
              quantity: 1,
              statBonus: { attack: 4 },
            },
          ],
        },
      });
      const next = engine.processAction(state, { type: 'EQUIP_WEAPON', itemId: 'iron_saber' });
      expect(next.player.equippedWeapon).not.toBeNull();
      expect(next.player.equippedWeapon!.id).toBe('iron_saber');
      expect(next.player.inventory).toHaveLength(0);
    });

    it('UNEQUIP_WEAPON moves weapon back to inventory', () => {
      const weapon = {
        id: 'iron_saber',
        name: 'Iron Saber',
        type: 'weapon' as const,
        description: 'test',
        value: 15,
        stackable: false,
        quantity: 1,
        statBonus: { attack: 4 },
      };
      const state = freshState({
        player: {
          ...freshState().player,
          equippedWeapon: weapon,
          inventory: [],
        },
      });
      const next = engine.processAction(state, { type: 'UNEQUIP_WEAPON' });
      expect(next.player.equippedWeapon).toBeNull();
      expect(next.player.inventory).toHaveLength(1);
      expect(next.player.inventory[0]!.id).toBe('iron_saber');
    });

    it('TRAVEL_TO starts travel to valid neighbor', () => {
      const state = freshState(); // starts at azure_cloud_village
      const next = engine.processAction(state, { type: 'TRAVEL_TO', locationId: 'whispering_forest' });
      expect(next.world.travelState).not.toBeNull();
      expect(next.world.travelState!.toId).toBe('whispering_forest');
      expect(next.world.travelState!.totalDuration).toBe(900);
      expect(next.log.some(l => l.text.includes('Traveling'))).toBe(true);
    });

    it('TRAVEL_TO blocked by tier requirement', () => {
      const state = freshState(); // tier 0, at azure_cloud_village
      // misty_peaks requires tier 1
      const next = engine.processAction(state, { type: 'TRAVEL_TO', locationId: 'misty_peaks' });
      expect(next.world.travelState).toBeNull(); // no travel started
    });

    it('TRAVEL_TO blocked when already traveling', () => {
      const state = freshState({
        world: {
          ...freshState().world,
          travelState: { fromId: 'a', toId: 'b', totalDuration: 100, elapsed: 50 },
        },
      });
      const next = engine.processAction(state, { type: 'TRAVEL_TO', locationId: 'whispering_forest' });
      expect(next.world.travelState).not.toBeNull(); // unchanged
      expect(next.world.travelState!.toId).toBe('b');
    });

    it('TRAVEL_TO blocked by combat', () => {
      const state = freshState({
        ui: {
          ...freshState().ui,
          combatState: {
            enemy: { name: 'Beast', health: 10, attack: 3, defense: 1, speed: 5, loot: { stones: [0, 0], items: [] } },
            playerHealth: 50,
            enemyHealth: 10,
            turn: 0,
            status: 'active',
            log: [],
          },
        },
      });
      const next = engine.processAction(state, { type: 'TRAVEL_TO', locationId: 'whispering_forest' });
      expect(next.world.travelState).toBeNull();
    });

    it('CHOOSE_EVENT processes choice outcomes correctly', () => {
      // Manually inject an event with a simple choice
      // Use JSON round-trip for deep copy to avoid mutation issues
      const baseState = freshState({
        ui: {
          ...freshState().ui,
          currentEvent: {
            id: 'test_event',
            title: 'Test Event',
            locationId: 'azure_cloud_village',
            category: 'story',
            description: 'A test.',
            choices: [
              {
                id: 'gift',
                text: 'Take the gift',
                outcome: {
                  flavorText: 'You took it.',
                  spiritStones: 10,
                  shenChange: 5,
                  itemsGained: ['qi_crystal'],
                  flagsSet: { took_gift: true },
                },
              },
            ],
            trigger: { type: 'location', locationId: 'azure_cloud_village' },
          },
        },
      });

      const initialStones = baseState.player.spiritStones;
      const next = engine.processAction(JSON.parse(JSON.stringify(baseState)), { type: 'CHOOSE_EVENT', choiceId: 'gift' });

      expect(next.player.spiritStones).toBe(initialStones + 10);
      expect(next.player.shen).toBe(5);
      expect(next.player.inventory.some(i => i.id === 'qi_crystal')).toBe(true);
      expect(next.flags.took_gift).toBe(true);
      expect(next.ui.currentEvent).toBeNull();
      expect(next.player.stats.totalEventsResolved).toBe(1);
    });
  });

  describe('meditation rates', () => {
    it('higher tier cultivators gain shen faster', () => {
      const tier0 = freshState({
        player: { ...freshState().player, meditating: true, tier: 0, shen: 0, maxShen: 100 },
      });
      const tier1 = freshState({
        player: { ...freshState().player, meditating: true, tier: 1, shen: 0, maxShen: 100 },
      });

      const t0after = engine.tick(tier0);
      const t1after = engine.tick(tier1);

      // Tier 1 rate: 0.01 * (1 + 1*0.5) = 0.015 > Tier 0 rate: 0.01
      expect(t1after.player.shen).toBeGreaterThan(t0after.player.shen);
    });
  });
});
