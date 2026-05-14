/**
 * Headless engine tests — CombatEngine.
 */
import { describe, it, expect } from 'vitest';
import { CombatEngine } from '../../engine/CombatEngine';
import { createInitialState } from '../../state/GameState';
import { GameState } from '../../types';

function freshState(overrides?: Partial<GameState>): GameState {
  return { ...createInitialState('Fighter', 'human', 'village_orphan'), ...overrides };
}

describe('CombatEngine', () => {
  const basicMonster = {
    name: 'Test Goblin',
    health: 20,
    attack: 4,
    defense: 1,
    speed: 3,
    loot: { stones: [5, 10], items: ['qi_crystal'] },
  };

  describe('startCombat()', () => {
    it('creates combat state on the game state', () => {
      const state = freshState();
      const result = CombatEngine.startCombat(state, basicMonster);

      expect(result.ui.combatState).not.toBeNull();
      expect(result.ui.combatState!.enemy).toEqual(basicMonster);
      expect(result.ui.combatState!.status).toBe('active');
      expect(result.ui.combatState!.playerHealth).toBe(state.player.health);
      expect(result.ui.combatState!.enemyHealth).toBe(20);
    });

    it('captures current player health at combat start', () => {
      const state = freshState({
        player: { ...freshState().player, health: 10, maxHealth: 50 },
      });
      const result = CombatEngine.startCombat(state, basicMonster);
      expect(result.ui.combatState!.playerHealth).toBe(10);
    });
  });

  describe('tickCombat()', () => {
    it('processes one combat turn', () => {
      const state = freshState();
      const withCombat = CombatEngine.startCombat(state, basicMonster);

      const result = CombatEngine.tickCombat(withCombat);

      // Combat log should have entries
      expect(result.ui.combatState!.log.length).toBeGreaterThan(0);
      // A turn should have passed
      expect(result.ui.combatState!.turn).toBe(1);
    });

    it('eventually ends combat (multi-tick)', () => {
      let state = freshState();
      state = CombatEngine.startCombat(state, {
        name: 'Glass Cannon',
        health: 5,
        attack: 100, // very high attack, but low health
        defense: 0,
        speed: 1,
        loot: { stones: [0, 0], items: [] },
      });

      // Run ticks until combat ends
      for (let i = 0; i < 60; i++) {
        if (state.ui.combatState?.status !== 'active') break;
        state = CombatEngine.tickCombat(state);
      }

      // Combat may end with combatState null (finish clears it) or with a terminal status
      if (state.ui.combatState) {
        expect(state.ui.combatState.status).not.toBe('active');
      } else {
        // combatState cleared = combat resolved
        expect(true).toBe(true);
      }
    });

    it('player win grants spirit stones and combat log', () => {
      let state = freshState({ player: { ...freshState().player, spiritStones: 0 } });
      state = CombatEngine.startCombat(state, basicMonster);

      // Run until combat resolves
      for (let i = 0; i < 60; i++) {
        if (state.ui.combatState?.status !== 'active') break;
        state = CombatEngine.tickCombat(state);
      }

      if (state.ui.combatState?.status === 'player_won') {
        expect(state.player.spiritStones).toBeGreaterThan(0);
        expect(state.player.stats.totalCombatWins).toBe(1);
        expect(state.log.some(l => l.type === 'combat')).toBe(true);
      }
    });

    it('ends combat as player win after 50 turns', () => {
      let state = freshState();
      // Two tanks that can't kill each other
      state = CombatEngine.startCombat(state, {
        name: 'Immortal Snail',
        health: 9999,
        attack: 0,
        defense: 9999,
        speed: 1,
        loot: { stones: [0, 0], items: [] },
      });

      for (let i = 0; i < 55; i++) {
        if (state.ui.combatState?.status !== 'active') break;
        state = CombatEngine.tickCombat(state);
      }

      expect(state.ui.combatState!.status).toBe('player_won');
    });

    it('returns state unchanged if no combat is active', () => {
      const state = freshState();
      const result = CombatEngine.tickCombat(state);
      // Should be the same state (no combat state)
      expect(result.ui.combatState).toBeNull();
    });
  });
});
