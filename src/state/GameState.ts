import { GameState, PlayerState, RaceId, OriginId, WorldState, UIState } from '../types';

export function createInitialState(playerName: string, race: RaceId, origin: OriginId): GameState {
  const player = createPlayer(playerName, race, origin);
  const world = createWorld(playerName, origin);
  const ui = createUI();

  return {
    version: 1,
    tick: 0,
    player,
    world,
    ui,
    log: [],
    flags: {},
    eventsEnabled: true,
  };
}

function createPlayer(name: string, race: RaceId, origin: OriginId): PlayerState {
  // Base stats
  const base: PlayerState = {
    name,
    race,
    origin,
    attack: 5,
    defense: 3,
    speed: 5,
    comprehension: 10,
    luck: 5,
    karma: 0,
    spiritStones: 0,
    health: 50,
    maxHealth: 50,
    shen: 0,
    maxShen: 10,
    tier: 0,
    subStage: 'early',
    meditating: false,
    equippedWeapon: null,
    techniqueSlots: [null, null],
    inventory: [],
    path: null,
    stats: {
      totalShenGained: 0,
      totalEventsResolved: 0,
      totalCombatWins: 0,
      totalCombatLosses: 0,
      totalStonesEarned: 0,
    },
  };

  // Race modifiers
  switch (race) {
    case 'human':
      base.comprehension += 2;
      break;
    case 'spirit_fox':
      base.speed += 2;
      base.luck += 2;
      break;
  }

  // Origin modifiers
  switch (origin) {
    case 'village_orphan': {
      base.comprehension += 3;
      const rustySword = {
        id: 'rusty_iron_sword',
        name: 'Rusty Iron Sword',
        type: 'weapon' as const,
        description: 'A worn sword that has seen better decades.',
        value: 5,
        stackable: false,
        quantity: 1,
        statBonus: { attack: 2 },
      };
      base.equippedWeapon = rustySword;
      break;
    }
    case 'disgraced_disciple': {
      base.tier = 1;
      base.subStage = 'early';
      base.shen = 5;
      base.maxShen = 100;
      base.attack += 3;
      base.defense += 2;
      base.spiritStones = 50;
      base.comprehension -= 1;
      const ironSaber = {
        id: 'iron_saber',
        name: 'Iron Saber',
        type: 'weapon' as const,
        description: 'A serviceable blade. You took it when you left.',
        value: 15,
        stackable: false,
        quantity: 1,
        statBonus: { attack: 4 },
      };
      base.equippedWeapon = ironSaber;
      break;
    }
  }

  return base;
}

function createWorld(playerName: string, origin: OriginId): WorldState {
  return {
    currentNodeId: origin === 'disgraced_disciple' ? 'green_jade_city' : 'azure_cloud_village',
    visitedNodes: [],
    travelState: null,
  };
}

function createUI(): UIState {
  return {
    activeTab: 'event',
    currentEvent: null,
    combatState: null,
    offlinesummary: null,
    notifications: [],
  };
}
