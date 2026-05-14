import { CombatState, MonsterDef, GameState, CombatLogEntry } from '../types';

export class CombatEngine {
  static startCombat(state: GameState, monster: MonsterDef): GameState {
    const combatState: CombatState = {
      enemy: monster,
      playerHealth: state.player.health,
      enemyHealth: monster.health,
      turn: 0,
      status: 'active',
      log: [],
    };
    return { ...state, ui: { ...state.ui, combatState } };
  }

  static tickCombat(state: GameState): GameState {
    const cs = state.ui.combatState;
    if (!cs || cs.status !== 'active') return state;

    const p = state.player;
    const playerAtk = p.attack + (p.equippedWeapon?.statBonus?.attack ?? 0);
    const playerDef = p.defense;
    const e = cs.enemy;

    cs.turn++;
    const playerFirst = p.speed >= e.speed;
    const logs: CombatLogEntry[] = [];

    const resolveAttack = (
      atk: number, def: number, isCritCheck: boolean,
      attackerName: string, defenderName: string
    ): CombatLogEntry => {
      const dodgeChance = 0.05 + (def - atk) * 0.005;
      if (Math.random() < Math.max(0.05, Math.min(0.3, dodgeChance))) {
        return { turn: cs.turn, text: `${defenderName} dodges ${attackerName}'s attack!`, damage: 0, isCrit: false, isDodge: true };
      }
      let damage = Math.max(1, Math.floor(atk - def * 0.4));
      const isCrit = isCritCheck && Math.random() < 0.1;
      if (isCrit) damage = Math.floor(damage * 2);
      damage = Math.max(1, Math.floor(damage * (0.9 + Math.random() * 0.2)));
      const critText = isCrit ? ' CRITICAL!' : '';
      return { turn: cs.turn, text: `${attackerName} strikes ${defenderName} for ${damage} damage${critText}!`, damage, isCrit, isDodge: false };
    };

    if (playerFirst) {
      const a = resolveAttack(playerAtk, e.defense, true, p.name, e.name);
      logs.push(a);
      cs.enemyHealth -= a.damage;
      if (cs.enemyHealth <= 0) { cs.status = 'player_won'; cs.log.push(...logs); return finish(state, cs); }
      const b = resolveAttack(e.attack, playerDef, false, e.name, p.name);
      logs.push(b);
      cs.playerHealth -= b.damage;
      if (cs.playerHealth <= 0) { cs.status = 'enemy_won'; cs.log.push(...logs); return finish(state, cs); }
    } else {
      const a = resolveAttack(e.attack, playerDef, false, e.name, p.name);
      logs.push(a);
      cs.playerHealth -= a.damage;
      if (cs.playerHealth <= 0) { cs.status = 'enemy_won'; cs.log.push(...logs); return finish(state, cs); }
      const b = resolveAttack(playerAtk, e.defense, true, p.name, e.name);
      logs.push(b);
      cs.enemyHealth -= b.damage;
      if (cs.enemyHealth <= 0) { cs.status = 'player_won'; cs.log.push(...logs); return finish(state, cs); }
    }

    if (cs.turn >= 50) { cs.status = 'player_won'; }
    cs.log.push(...logs);
    return { ...state, ui: { ...state.ui, combatState: cs } };
  }
}

function finish(state: GameState, cs: CombatState): GameState {
  if (cs.status === 'player_won') {
    const stones = cs.enemy.loot.stones[0] + Math.floor(Math.random() * (cs.enemy.loot.stones[1] - cs.enemy.loot.stones[0] + 1));
    return {
      ...state,
      player: {
        ...state.player,
        spiritStones: state.player.spiritStones + stones,
        health: cs.playerHealth,
        stats: { ...state.player.stats, totalCombatWins: state.player.stats.totalCombatWins + 1, totalStonesEarned: state.player.stats.totalStonesEarned + stones },
      },
      ui: { ...state.ui, combatState: null, currentEvent: null },
      log: [...state.log, { type: 'combat' as const, tick: state.tick, text: `Defeated ${cs.enemy.name}! Gained ${stones} stones.` }],
    };
  }
  const penaltyStones = Math.floor((cs.enemy.loot.stones[0] + cs.enemy.loot.stones[1]) / 2);
  const stonesLost = Math.min(state.player.spiritStones, penaltyStones);
  return {
    ...state,
    player: {
      ...state.player,
      spiritStones: state.player.spiritStones - stonesLost,
      health: Math.max(1, Math.floor(state.player.maxHealth * 0.3)),
      stats: { ...state.player.stats, totalCombatLosses: state.player.stats.totalCombatLosses + 1 },
    },
    world: { ...state.world, currentNodeId: 'azure_cloud_village', travelState: null },
    ui: { ...state.ui, combatState: null, currentEvent: null },
    log: [...state.log, { type: 'combat' as const, tick: state.tick, text: `Defeated by ${cs.enemy.name}. Lost ${stonesLost} stones. Respawned.` }],
  };
}
