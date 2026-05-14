/**
 * State tests — GameState factory.
 */
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../state/GameState';

describe('createInitialState', () => {
  it('creates a valid GameState with version 1', () => {
    const state = createInitialState('Li Wei', 'human', 'village_orphan');
    expect(state.version).toBe(1);
    expect(state.tick).toBe(0);
    expect(state.eventsEnabled).toBe(true);
  });

  it('sets player name correctly', () => {
    const state = createInitialState('Zhao Yun', 'human', 'village_orphan');
    expect(state.player.name).toBe('Zhao Yun');
  });

  describe('human + village_orphan', () => {
    const state = createInitialState('Li Wei', 'human', 'village_orphan');

    it('starts at azure_cloud_village', () => {
      expect(state.world.currentNodeId).toBe('azure_cloud_village');
    });

    it('has correct base stats with modifiers', () => {
      // Base: atk 5, def 3, spd 5, comp 10+2+3=15, luck 5
      expect(state.player.attack).toBe(5);
      expect(state.player.defense).toBe(3);
      expect(state.player.speed).toBe(5);
      expect(state.player.comprehension).toBe(15);
      expect(state.player.luck).toBe(5);
    });

    it('starts with rusty iron sword equipped (not in inventory)', () => {
      expect(state.player.equippedWeapon).not.toBeNull();
      expect(state.player.equippedWeapon!.id).toBe('rusty_iron_sword');
      expect(state.player.equippedWeapon!.statBonus?.attack).toBe(2);
      // Equipped weapon should NOT also be in inventory
      expect(state.player.inventory.some(i => i.id === 'rusty_iron_sword')).toBe(false);
    });

    it('starts at tier 0 with 0/10 shen', () => {
      expect(state.player.tier).toBe(0);
      expect(state.player.shen).toBe(0);
      expect(state.player.maxShen).toBe(10);
    });

    it('starts with 50 HP', () => {
      expect(state.player.health).toBe(50);
      expect(state.player.maxHealth).toBe(50);
    });

    it('has no path chosen', () => {
      expect(state.player.path).toBeNull();
    });

    it('initializes UI state correctly', () => {
      expect(state.ui.activeTab).toBe('event');
      expect(state.ui.currentEvent).toBeNull();
      expect(state.ui.combatState).toBeNull();
    });
  });

  describe('spirit_fox + village_orphan', () => {
    const state = createInitialState('Hu Li', 'spirit_fox', 'village_orphan');

    it('has fox race bonuses', () => {
      // Base spd 5 + 2 race = 7, base luck 5 + 2 race = 7
      expect(state.player.speed).toBe(7);
      expect(state.player.luck).toBe(7);
    });
  });

  describe('human + disgraced_disciple', () => {
    const state = createInitialState('Chen Wei', 'human', 'disgraced_disciple');

    it('starts at green_jade_city', () => {
      expect(state.world.currentNodeId).toBe('green_jade_city');
    });

    it('starts at Tier 1', () => {
      expect(state.player.tier).toBe(1);
      expect(state.player.maxShen).toBe(100);
      expect(state.player.shen).toBe(5);
    });

    it('has combat bonuses from origin', () => {
      // Base atk 5 + 3 origin = 8
      expect(state.player.attack).toBe(8);
      expect(state.player.defense).toBe(5);
    });

    it('starts with spirit stones', () => {
      expect(state.player.spiritStones).toBe(50);
    });

    it('starts with iron saber equipped', () => {
      expect(state.player.equippedWeapon).not.toBeNull();
      expect(state.player.equippedWeapon!.id).toBe('iron_saber');
      expect(state.player.equippedWeapon!.statBonus?.attack).toBe(4);
    });
  });

  describe('spirit_fox + disgraced_disciple', () => {
    const state = createInitialState('Xiao Hu', 'spirit_fox', 'disgraced_disciple');

    it('combines race and origin bonuses', () => {
      expect(state.player.speed).toBe(7);  // 5 base + 2 race
      expect(state.player.luck).toBe(7);    // 5 base + 2 race
      expect(state.player.attack).toBe(8);  // 5 base + 3 origin
      expect(state.player.defense).toBe(5); // 3 base + 2 origin
    });
  });
});
