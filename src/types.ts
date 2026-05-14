// ─── Player ───────────────────────────────────────────

export interface PlayerState {
  name: string;
  race: RaceId;
  origin: OriginId;
  attack: number;
  defense: number;
  speed: number;
  comprehension: number;
  luck: number;
  karma: number;
  spiritStones: number;
  health: number;
  maxHealth: number;
  /** Total shén accumulated (current bar value) */
  shen: number;
  /** Maximum shén capacity */
  maxShen: number;
  /** Current tier (0-3 for MVP) */
  tier: number;
  /** Sub-stage within tier: early | mid | late | peak */
  subStage: SubStage;
  /** Whether meditation is active */
  meditating: boolean;
  /** Equipment */
  equippedWeapon: Item | null;
  techniqueSlots: (Item | null)[];
  /** Inventory */
  inventory: Item[];
  /** Path chosen at Tier 3 (null until then) */
  path: 'qi' | 'body' | null;
  /** Stats tracking */
  stats: PlayerStats;
}

export interface PlayerStats {
  totalShenGained: number;
  totalEventsResolved: number;
  totalCombatWins: number;
  totalCombatLosses: number;
  totalStonesEarned: number;
}

export type RaceId = 'human' | 'spirit_fox';
export type OriginId = 'village_orphan' | 'disgraced_disciple';
export type SubStage = 'early' | 'mid' | 'late' | 'peak';

// ─── Items ————————————————————————————————————————

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  flavorText?: string;
  /** Spirit stone value */
  value: number;
  /** Whether items of this type stack */
  stackable: boolean;
  quantity: number;
  /** Shén contained (for vessels) — absorb to add to bar */
  shenContained?: number;
  /** Equipment stats */
  statBonus?: Partial<Record<string, number>>;
}

export type ItemType =
  | 'weapon'
  | 'technique_scroll'
  | 'shen_vessel'
  | 'container'
  | 'herb'
  | 'key_item';

// ─── Events ─────────────────────────────────────────

export interface StoryEvent {
  id: string;
  title: string;
  locationId: string;
  category: EventCategory;
  description: string;
  choices: EventChoice[];
  trigger: EventTrigger;
  chainId?: string;
  chainStage?: number;
}

export type EventCategory =
  | 'story'
  | 'encounter'
  | 'breakthrough'
  | 'discovery';

export interface EventChoice {
  id: string;
  text: string;
  tooltip?: string;
  requires?: ChoiceRequirement;
  outcome: EventOutcome;
}

export interface ChoiceRequirement {
  stat?: { name: string; min: number };
  item?: string;
  karma?: { min?: number; max?: number };
  race?: string;
  flag?: string;
}

export interface EventOutcome {
  flavorText: string;
  itemsGained?: string[];
  itemsLost?: string[];
  spiritStones?: number;
  statChanges?: Record<string, number>;
  karmaChange?: number;
  healthChange?: number;
  shenChange?: number;
  flagsSet?: Record<string, boolean>;
  nextEventId?: string;
  combat?: MonsterDef;
  travelTo?: string;
}

export interface MonsterDef {
  name: string;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  loot: {
    stones: [number, number];
    items: string[];
  };
}

export type EventTrigger =
  | { type: 'location'; locationId: string }
  | { type: 'tier'; min: number }
  | { type: 'flag'; flag: string }
  | { type: 'shenThreshold'; min: number }
  | { type: 'chain'; chainId: string; stage: number }
  | { type: 'travel' };

// ─── World ──────────────────────────────────────────

export interface LocationDef {
  id: string;
  name: string;
  description: string;
  danger: number;
  /** Shén density multiplier for meditation (1.0 = baseline) */
  shenDensity: number;
  neighbors: Record<string, number>;
  services: ServiceType[];
  minTier: number;
}

export type ServiceType = 'inn' | 'merchant' | 'alchemist';

// ─── Combat ─────────────────────────────────────────

export interface CombatState {
  enemy: MonsterDef;
  playerHealth: number;
  enemyHealth: number;
  turn: number;
  status: 'active' | 'player_won' | 'enemy_won' | 'fled';
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  turn: number;
  text: string;
  damage: number;
  isCrit: boolean;
  isDodge: boolean;
}

// ─── UI State (transient, not saved) ────────────────

export interface UIState {
  activeTab: TabId;
  currentEvent: StoryEvent | null;
  combatState: CombatState | null;
  offlinesummary: OfflineSummary | null;
  notifications: string[];
}

export type TabId = 'event' | 'cultivate' | 'self' | 'world' | 'log';

export interface OfflineSummary {
  ticksElapsed: number;
  shenGained: number;
  itemsGained: string[];
}

// ─── Game State (root) ─────────────────────────────

export interface GameState {
  version: number;
  tick: number;
  player: PlayerState;
  world: WorldState;
  ui: UIState;
  log: LogEntry[];
  flags: Record<string, boolean>;
  eventsEnabled: boolean;
}

export interface WorldState {
  currentNodeId: string;
  visitedNodes: string[];
  travelState: TravelState | null;
}

export interface TravelState {
  fromId: string;
  toId: string;
  totalDuration: number;
  elapsed: number;
}

export interface LogEntry {
  type: 'event' | 'combat' | 'breakthrough' | 'item' | 'travel' | 'system';
  tick: number;
  text: string;
}
