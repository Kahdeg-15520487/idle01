# Data Models — TypeScript Interfaces & Types

> All core types. The single source of truth for the game's data shapes.
>
> **File**: `src/core/types.ts`

---

## Core State

```typescript
// ─── Game State ───────────────────────────────────

interface GameState {
  readonly version: number;
  readonly tick: number;                // Monotonic, increments each second
  readonly rngState: number;            // PRNG internal state (seed)
  readonly player: PlayerState;
  readonly world: WorldState;
  readonly ui: UIState;                 // Transient UI-only state (not persisted)
  readonly log: GameLogEntry[];
  readonly flags: Record<string, boolean>;
  readonly config: GameConfig;          // Immutable config reference
}

// ─── Player State ─────────────────────────────────

interface PlayerState {
  // Identity
  readonly name: string;
  readonly race: Race;

  // Cultivation
  readonly realm: number;               // Index into REALMS array
  readonly subStage: number;            // 1–9 within realm
  readonly currentQi: number;
  readonly baseQi: number;              // Max Qi capacity (grows with realm)
  readonly comprehension: number;
  readonly cultivationSpeed: number;    // Base Qi per tick

  // Combat Stats
  readonly health: number;
  readonly maxHealth: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;

  // Derived Attributes
  readonly luck: number;
  readonly karma: number;

  // Current Action
  readonly action: PlayerActionType;
  readonly actionData: ActionData | null;

  // Equipment
  readonly equippedWeapon: Weapon | null;
  readonly equippedTechniques: Technique[];  // Max 4

  // Inventory
  readonly inventory: Item[];
  readonly spiritStones: number;

  // Combat State
  readonly inCombat: boolean;
  readonly combatState: CombatState | null;

  // Meta
  readonly achievements: string[];
  readonly stats: PlayerStats;          // Lifetime counters
}

// ─── Player Action ────────────────────────────────

type PlayerActionType =
  | 'idle'
  | 'cultivating'
  | 'traveling'
  | 'in_combat'
  | 'resting'
  | 'trading';

interface ActionData {
  // Discriminated union based on PlayerActionType
}

interface CultivatingData {
  readonly type: 'cultivating';
  readonly startedAt: number;           // tick when started
}

interface TravelingData {
  readonly type: 'traveling';
  readonly fromLocationId: string;
  readonly toLocationId: string;
  readonly startedAt: number;
  readonly totalDuration: number;       // seconds
  readonly progress: number;            // seconds elapsed
}

interface TradingData {
  readonly type: 'trading';
  readonly merchantId: string;
}

// ─── Player Stats (lifetime counters) ─────────────

interface PlayerStats {
  totalTicks: number;
  totalKills: number;
  totalQiGathered: number;
  totalBreakthroughs: number;
  totalDeaths: number;
  totalTravelDistance: number;
  itemsFound: number;
  techniquesLearned: number;
}

// ─── Race ─────────────────────────────────────────

interface Race {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly statModifiers: Partial<RaceStatModifiers>;
  readonly startingBonus: StartingBonus;
}

interface RaceStatModifiers {
  attack: number;
  defense: number;
  speed: number;
  comprehension: number;
  luck: number;
  maxHealth: number;
  cultivationSpeed: number;
  baseQi: number;
}

type StartingBonus =
  | { type: 'weapon'; weaponId: string }
  | { type: 'technique'; techniqueId: string }
  | { type: 'spiritStones'; amount: number }
  | { type: 'statBoost'; stat: keyof RaceStatModifiers; amount: number };
```

---

## Cultivation

```typescript
// ─── Realm ────────────────────────────────────────

interface Realm {
  readonly id: number;
  readonly name: string;
  readonly subStages: number;           // Usually 9, 1 for Mortal/Immortal
  readonly qiCapacityBase: number;      // Base Qi needed to reach next realm
  readonly qiPerSubStage: number;       // Qi needed per sub-stage
  readonly breakthroughChance: number;  // Base % (0–1)
  readonly statBonus: StatBonus;
  readonly color: string;               // CSS color for UI
  readonly flavorTitle: string;         // e.g., "Qi Condensation Disciple"
}

interface StatBonus {
  attack: number;
  defense: number;
  speed: number;
  maxHealth: number;
}

// ─── Breakthrough ─────────────────────────────────

interface BreakthroughResult {
  readonly success: boolean;
  readonly newRealm: number;
  readonly newSubStage: number;
  readonly tribulation: TribulationEvent | null;
  readonly message: string;
  readonly statGains: StatBonus;
}

interface TribulationEvent {
  readonly type: 'lightning' | 'inner_demon' | 'heavenly_trial';
  readonly difficulty: number;
  readonly survived: boolean;
  readonly damage: number;
}

// ─── Cultivation Config ───────────────────────────

interface CultivationConfig {
  baseSpeedPerTick: number;             // Qi gained per tick at Mortal
  realmSpeedMultiplier: number[];       // Multiplier per realm index
  locationSpeedBonus: number;           // Max bonus from location qi density
  comprehensionWeight: number;          // How much comprehension affects breakthrough
  luckWeight: number;
  tribulationChance: number;            // Base chance per breakthrough
  bottleneckChance: number;             // Chance breakthrough is blocked (need opportunity)
}
```

---

## Combat

```typescript
// ─── Combat State ─────────────────────────────────

interface CombatState {
  readonly enemy: Beast;
  readonly turn: number;
  readonly playerHealth: number;
  readonly enemyHealth: number;
  readonly log: CombatLogEntry[];
  readonly status: 'active' | 'player_won' | 'enemy_won' | 'fled';
}

interface CombatLogEntry {
  readonly turn: number;
  readonly actor: 'player' | 'enemy';
  readonly action: string;              // Technique name or 'basic attack'
  readonly damage: number;
  readonly flavorText: string;
  readonly isCrit: boolean;
  readonly isDodge: boolean;
}

type CombatResult =
  | { outcome: 'victory'; loot: LootTable; xp: number }
  | { outcome: 'defeat'; penalty: DefeatPenalty }
  | { outcome: 'fled'; escaped: boolean };

interface DefeatPenalty {
  spiritStonesLost: number;
  healthLost: number;
  cultivationSetback: number;           // Qi lost
}

interface LootTable {
  spiritStones: [number, number];       // [min, max]
  beastCoreChance: number;              // 0–1
  itemDropChance: number;
  rarityTable: RarityWeights;
}

// ─── Damage Calculation ───────────────────────────

interface DamageInput {
  attackerAttack: number;
  defenderDefense: number;
  techniqueMultiplier: number;          // 1.0 for basic attack
  elementalAdvantage: number;           // 1.0 neutral, 1.5 advantage, 0.75 disadvantage
  critChance: number;
  critMultiplier: number;
  dodgeChance: number;
  speedDiff: number;                    // Affects turn order and dodge
}

interface DamageOutput {
  damage: number;
  isCrit: boolean;
  isDodge: boolean;
  actualDamage: number;                 // After defense reduction
}

// ─── Combat Config ────────────────────────────────

interface CombatConfig {
  baseDefenseReduction: number;         // e.g., 0.5 = 50% damage reduction from defense
  critBaseChance: number;
  critMultiplier: number;
  dodgeBaseChance: number;
  speedToDodgeWeight: number;
  elementalAdvantageMultiplier: number;
  maxTurns: number;                     // Auto-flee after this many
  fleeChance: number;
}
```

---

## World & Travel

```typescript
// ─── World State ──────────────────────────────────

interface WorldState {
  readonly currentNodeId: string;
  readonly visitedNodes: string[];      // IDs of discovered locations
  readonly availableNodes: string[];   // IDs of reachable (adjacent) locations
  readonly travelState: TravelState | null;
}

interface TravelState {
  readonly fromId: string;
  readonly toId: string;
  readonly totalDuration: number;       // Seconds
  readonly elapsed: number;
  readonly encounterCooldown: number;   // Ticks until next possible encounter
}

// ─── Location Node ────────────────────────────────

interface LocationNode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly dangerLevel: number;         // 1–10, gates beast tiers
  readonly qiDensity: number;           // 0–100, affects cultivation speed
  readonly terrain: TerrainType;
  readonly specialFeatures: SpecialFeature[];
  readonly neighbors: Record<string, number>; // locationId -> travel time (seconds)
  readonly services: Service[];         // Merchant, trainer, etc.
  readonly encounterTable: string;      // References which encounter table to use
  readonly minRealm: number;            // Minimum realm to survive here
}

type TerrainType =
  | 'village'
  | 'city'
  | 'forest'
  | 'mountain'
  | 'cave'
  | 'desert'
  | 'swamp'
  | 'ruins'
  | 'sect_grounds'
  | 'forbidden_zone';

interface SpecialFeature {
  readonly type: 'cultivation_spot' | 'treasure_vault' | 'ancient_formation' | 'beast_lair';
  readonly name: string;
  readonly description: string;
  readonly effect: FeatureEffect;
}

type FeatureEffect =
  | { type: 'cultivation_boost'; amount: number }
  | { type: 'encounter_modifier'; table: string; weight: number }
  | { type: 'stat_bonus'; stat: string; amount: number };

type Service = 'merchant' | 'trainer' | 'alchemist' | 'inn' | 'blacksmith';

// ─── World Config ─────────────────────────────────

interface WorldConfig {
  travelBaseSpeed: number;              // Seconds per "distance unit"
  encounterTickInterval: number;        // Ticks between encounter rolls
  encounterBaseChance: number;
  dangerToEncounterChance: number;      // How much danger increases encounter rate
  travelInterruptionChance: number;     // Chance encounter interrupts travel
}
```

---

## Encounters

```typescript
// ─── Encounter Types ──────────────────────────────

type EncounterType =
  | 'beast_combat'
  | 'rogue_cultivator'
  | 'treasure'
  | 'merchant'
  | 'ancient_inheritance'
  | 'tribulation'
  | 'peaceful_moment'
  | 'rare_herb'
  | 'wandering_elder';

interface EncounterTable {
  readonly id: string;
  readonly entries: WeightedEncounter[];
  readonly locationIds: string[];       // Which locations use this table
}

interface WeightedEncounter {
  readonly type: EncounterType;
  readonly weight: number;
  readonly minRealm?: number;          // Only appears at this realm+
  readonly maxRealm?: number;
  readonly minDanger?: number;
  readonly conditions?: EncounterCondition[];
}

type EncounterCondition =
  | { type: 'hasItem'; itemId: string }
  | { type: 'karmaAbove'; amount: number }
  | { type: 'karmaBelow'; amount: number }
  | { type: 'flagSet'; flag: string }
  | { type: 'realmAtLeast'; realm: number };

// ─── Resolved Encounter ──────────────────────────

interface ResolvedEncounter {
  readonly id: string;                  // Generated unique ID
  readonly type: EncounterType;
  readonly title: string;
  readonly description: string;
  readonly choices: EncounterChoice[];
  readonly autoResolve?: boolean;      // If true, auto-pick best choice
}

interface EncounterChoice {
  readonly id: string;
  readonly text: string;
  readonly outcome: EncounterOutcome;
  readonly requirement?: ChoiceRequirement;
}

interface ChoiceRequirement {
  readonly minRealm?: number;
  readonly spiritStones?: number;
  readonly hasItem?: string;
  readonly karmaMin?: number;
}

type EncounterOutcome =
  | { type: 'combat'; beast: Beast }
  | { type: 'loot'; items: Item[]; spiritStones: number }
  | { type: 'statGain'; stat: string; amount: number }
  | { type: 'qiGain'; amount: number }
  | { type: 'learnTechnique'; technique: Technique }
  | { type: 'nothing'; message: string }
  | { type: 'shop'; merchant: Merchant }
  | { type: 'tribulation'; difficulty: number }
  | { type: 'flag'; flag: string };

// ─── Merchant ─────────────────────────────────────

interface Merchant {
  readonly id: string;
  readonly name: string;
  readonly title: string;               // "Wandering Alchemist", "Weapon Peddler"
  readonly inventory: Item[];
  readonly buyMultiplier: number;       // Price markup
  readonly sellMultiplier: number;      // Price reduction
  readonly specializesIn: ItemType[];
}
```

---

## Items & Equipment

```typescript
// ─── Item ─────────────────────────────────────────

interface Item {
  readonly id: string;
  readonly name: string;
  readonly type: ItemType;
  readonly rarity: Rarity;
  readonly description: string;
  readonly flavorText: string;
  readonly value: number;               // Base spirit stone value
  readonly stackable: boolean;
  readonly quantity: number;
  readonly modifiers: ItemModifier[];
  readonly requirements: ItemRequirement | null;
}

type ItemType =
  | 'weapon'
  | 'technique_scroll'
  | 'pill'
  | 'herb'
  | 'beast_core'
  | 'material'
  | 'treasure'
  | 'consumable';

type Rarity =
  | 'common'      // White
  | 'uncommon'    // Green
  | 'rare'        // Blue
  | 'epic'        // Purple
  | 'legendary'   // Orange
  | 'mythic';     // Red

interface ItemModifier {
  readonly stat: string;
  readonly value: number;
  readonly prefix?: string;             // "Flaming", "Frozen", etc.
}

interface ItemRequirement {
  readonly minRealm?: number;
  readonly minComprehension?: number;
  readonly minStat?: { stat: string; value: number };
}

// ─── Weapon (extends Item) ────────────────────────

interface Weapon extends Item {
  readonly type: 'weapon';
  readonly weaponType: WeaponType;
  readonly baseAttack: number;
  readonly elementalAffinity: Element | null;
  readonly specialEffect: WeaponEffect | null;
}

type WeaponType = 'sword' | 'saber' | 'spear' | 'staff' | 'dagger' | 'fan' | 'flyswatter' | 'halberd' | 'whip' | 'chakram';

type Element = 'fire' | 'water' | 'wood' | 'metal' | 'earth' | 'thunder' | 'wind' | 'ice' | 'dark' | 'light';

interface WeaponEffect {
  readonly type: 'lifesteal' | 'qiBurn' | 'armorPierce' | 'aoe' | 'stun' | 'poison';
  readonly potency: number;             // 0–1, effect strength
  readonly description: string;
}

// ─── Technique ────────────────────────────────────

interface Technique {
  readonly id: string;
  readonly name: string;
  readonly type: 'technique';
  readonly rarity: Rarity;
  readonly description: string;
  readonly techniqueType: TechniqueType;
  readonly element: Element | null;
  readonly qiCost: number;
  readonly cooldown: number;            // Ticks between uses
  readonly damageMultiplier: number;
  readonly effects: TechniqueEffect[];
  readonly mastery: number;             // 0–100, grows with use
  readonly maxMastery: number;
}

type TechniqueType = 'attack' | 'defense' | 'movement' | 'support' | 'forbidden';

interface TechniqueEffect {
  readonly type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield' | 'teleport';
  readonly stat?: string;
  readonly amount: number;
  readonly duration: number;            // Ticks (0 = instant)
  readonly description: string;
}

// ─── Pill ─────────────────────────────────────────

interface Pill extends Item {
  readonly type: 'pill';
  readonly pillType: PillType;
  readonly effect: PillEffect;
  readonly toxicity: number;            // 0–100, high toxicity = side effects
}

type PillType = 'healing' | 'qi_restore' | 'cultivation_boost' | 'breakthrough_aid' | 'stat_boost' | 'antidote';

interface PillEffect {
  readonly stat?: string;
  readonly amount: number;
  readonly duration: number;            // Ticks (0 = instant/permanent)
  readonly description: string;
}
```

---

## Procedural Generation

```typescript
// ─── PRNG ─────────────────────────────────────────

interface PRNG {
  next(): number;                       // [0, 1)
  nextInt(min: number, max: number): number; // [min, max]
  nextFrom<T>(array: T[]): T;           // Pick random element
  nextWeighted<T>(entries: [T, number][]): T; // Weighted pick
  nextShuffled<T>(array: T[]): T[];     // Fisher-Yates
  clone(): PRNG;                        // Fork the RNG (for deterministic branches)
  getState(): number;                   // For serialization
}

// ─── Name Generation ──────────────────────────────

interface NameTemplate {
  readonly parts: NamePart[];           // Templates for name generation
}

type NamePart =
  | { type: 'literal'; text: string }
  | { type: 'pick'; options: string[] }
  | { type: 'generated'; generator: string }; // Delegates to another generator

// ─── Beast ────────────────────────────────────────

interface Beast {
  readonly id: string;
  readonly name: string;
  readonly species: string;
  readonly title: string;
  readonly tier: number;                // 1–10, scales with danger
  readonly element: Element | null;
  readonly health: number;
  readonly maxHealth: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly abilities: BeastAbility[];
  readonly lootTable: LootTable;
  readonly description: string;
  readonly isBoss: boolean;
}

interface BeastAbility {
  readonly name: string;
  readonly description: string;
  readonly effect: BeastEffect;
  readonly cooldown: number;
  readonly currentCooldown: number;
}

type BeastEffect =
  | { type: 'attack_buff'; amount: number; duration: number }
  | { type: 'defense_buff'; amount: number; duration: number }
  | { type: 'heal'; amount: number }
  | { type: 'special_attack'; multiplier: number; element: Element }
  | { type: 'flee' };

// ─── Generation Config ────────────────────────────

interface GenerationConfig {
  weaponNameTemplates: NameTemplate[];
  techniqueNameTemplates: NameTemplate[];
  beastNameTemplates: NameTemplate[];
  modifierPool: ItemModifier[];         // All possible modifiers by rarity
  rarityWeights: Record<Rarity, number>;
  affixByElement: Record<Element, { prefix: string; stat: string; amount: number }>;
}
```

---

## Flavor Engine

```typescript
// ─── Flavor Template ──────────────────────────────

interface FlavorTemplate {
  readonly id: string;
  readonly category: FlavorCategory;
  readonly templates: string[];         // ${variable} placeholders
  readonly conditions?: FlavorCondition[];
}

type FlavorCategory =
  | 'cultivation_start'
  | 'cultivation_progress'
  | 'breakthrough_success'
  | 'breakthrough_failure'
  | 'tribulation'
  | 'combat_start'
  | 'combat_hit'
  | 'combat_crit'
  | 'combat_victory'
  | 'combat_defeat'
  | 'travel_start'
  | 'travel_progress'
  | 'travel_arrival'
  | 'encounter_beast'
  | 'encounter_treasure'
  | 'encounter_merchant'
  | 'encounter_inheritance'
  | 'item_found'
  | 'technique_learned'
  | 'location_discovery'
  | 'death'
  | 'idle';

interface FlavorCondition {
  readonly field: string;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | string;
}

// ─── Flavor Context ───────────────────────────────

interface FlavorContext {
  // Player variables
  readonly playerName: string;
  readonly playerRealm: string;
  readonly playerRealmIndex: number;
  readonly playerSubStage: number;
  readonly playerRace: string;
  readonly equippedWeaponName: string;
  readonly currentTechniqueName: string;

  // World variables
  readonly locationName: string;
  readonly locationDescription: string;
  readonly destinationName: string;
  readonly terrainType: string;

  // Combat variables
  readonly enemyName: string;
  readonly enemySpecies: string;
  readonly enemyTitle: string;
  readonly damageDealt: number;
  readonly damageTaken: number;
  readonly techniqueUsed: string;
  readonly isCrit: boolean;

  // Item variables
  readonly itemName: string;
  readonly itemRarity: string;
  readonly itemType: string;
  readonly spiritStonesFound: number;
  readonly qiGained: number;

  // Misc
  readonly travelTime: string;          // Formatted e.g., "2h 30m"
  readonly currentHour: number;         // For time-of-day flavor
}
```

---

## Persistence

```typescript
// ─── Save Data ────────────────────────────────────

interface SaveData {
  readonly version: number;
  readonly timestamp: number;           // Date.now() when saved
  readonly tick: number;
  readonly rngState: number;
  readonly player: PlayerState;
  readonly world: Omit<WorldState, 'travelState'> & { travelState: TravelState | null };
  readonly flags: Record<string, boolean>;
  readonly achievements: string[];
  readonly stats: PlayerStats;
}

// ─── Offline Catch-Up ─────────────────────────────

interface OfflineCatchUpResult {
  readonly ticksSimulated: number;
  readonly summary: OfflineSummary;
  readonly newState: GameState;
}

interface OfflineSummary {
  readonly timeAway: number;            // Seconds
  readonly qiGained: number;
  readonly spiritStonesFound: number;
  readonly encountersTriggered: number;
  readonly combatVictories: number;
  readonly combatDefeats: number;
  readonly itemsFound: Item[];
  readonly breakthroughs: BreakthroughResult[];
  readonly isAlive: boolean;
}

// ─── Save Migration ───────────────────────────────

interface Migration {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}
```

---

## UI State

```typescript
// ─── UI State (not persisted) ─────────────────────

interface UIState {
  readonly activeTab: TabId;
  readonly selectedLocationId: string | null;
  readonly selectedItemId: string | null;
  readonly combatLogExpanded: boolean;
  readonly isCatchUpModalOpen: boolean;
  readonly notifications: UINotification[];
  readonly lastTickTimestamp: number;
  readonly fps: number;
}

type TabId = 'world' | 'cultivation' | 'inventory' | 'combat' | 'log';

interface UINotification {
  readonly id: string;
  readonly message: string;
  readonly type: 'info' | 'success' | 'warning' | 'error' | 'loot' | 'breakthrough';
  readonly timestamp: number;
  readonly duration: number;            // 0 = until dismissed
}
```

---

## Config (Aggregate)

```typescript
interface GameConfig {
  readonly version: string;
  readonly gameName: string;
  readonly cultivation: CultivationConfig;
  readonly combat: CombatConfig;
  readonly world: WorldConfig;
  readonly generation: GenerationConfig;
  readonly offline: OfflineConfig;
  readonly ui: UIConfig;
}

interface OfflineConfig {
  readonly maxCatchUpSeconds: number;   // e.g., 28800 (8 hours)
  readonly batchSize: number;           // Ticks to batch-compute at once
}

interface UIConfig {
  readonly tickRate: number;            // ms between ticks (1000)
  readonly autoSaveInterval: number;    // ticks between auto-saves (30)
  readonly logMaxEntries: number;       // Max log entries to keep (100)
  readonly inventoryMaxSize: number;    // Max inventory slots (50)
}
```

---

*See also: [Architecture](./architecture.md), [Project Structure](./project-structure.md)*

---

## Dialogue & Charisma

```typescript
// ─── Charisma ───────────────────────────────────

interface CharismaState {
  value: number;                    // 0–100
  experience: number;               // Hidden XP toward next point
  maxValue: number;                 // Always 100
  breakdown: CharismaBreakdown;
}

interface CharismaBreakdown {
  base: number;                     // From realm (1 per realm)
  equipmentBonus: number;
  techniqueBonus: number;
  reputationBonus: number;          // +1 per 20 total sect standing
  deedBonus: number;                // Permanent gains from achievements
  titleBonus: number;               // "Elder" = +5
}

type CharismaTier = 1 | 2 | 3 | 4;
// Tier 1: 0–39 (Basic)
// Tier 2: 40–79 (Silver Tongue)
// Tier 3: 80–99 (Golden Words)
// Tier 4: 100   (Heaven's Voice — LLM unlocked)

// ─── Dialogue Tree ─────────────────────────────

interface DialogueTree {
  readonly id: string;
  readonly encounterType: string;
  readonly nodes: Record<string, DialogueNode>;
  readonly startNodeId: string;
}

interface DialogueNode {
  readonly id: string;
  readonly speaker: 'npc' | 'player_inner' | 'narrator';
  readonly text: string;
  readonly emotion?: NPCMotion;
  readonly choices: DialogueChoice[];
  readonly isTerminal?: boolean;
  readonly onEnter?: DialogueEffect[];
}

type NPCMotion =
  | 'neutral' | 'angry' | 'fearful' | 'impressed'
  | 'amused' | 'suspicious' | 'respectful' | 'greedy'
  | 'desperate' | 'arrogant' | 'grateful';

interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly tooltip?: string;
  readonly requirements: DialogueRequirement[];
  readonly visibilityCharisma: number;
  readonly leadsTo: string;
  readonly onSelect?: DialogueEffect[];
}

interface DialogueRequirement {
  readonly type: 'stat' | 'item' | 'reputation' | 'skill' | 'technique' | 'realm' | 'karma' | 'flag';
  readonly key: string;
  readonly operator: '>=' | '<=' | '==' | '!=' | 'has' | 'not_has';
  readonly value: number | string;
  readonly charismaDiscount: number;
}

// ─── Dialogue Effects ──────────────────────────

type DialogueEffect =
  | { type: 'nothing' }
  | { type: 'startCombat'; enemy: string }
  | { type: 'attemptFlee' }
  | { type: 'giveItem'; itemTemplate: string; rarity?: Rarity }
  | { type: 'removeItem'; itemId: string }
  | { type: 'giveSpiritStones'; amount: number }
  | { type: 'removeSpiritStones'; amount: number }
  | { type: 'modifyReputation'; sectId: string; delta: number }
  | { type: 'modifyKarma'; delta: number }
  | { type: 'modifyStat'; stat: string; amount: number }
  | { type: 'gainCharismaXP'; amount: number }
  | { type: 'recruitAlly'; npcId: string }
  | { type: 'revealLocation'; locationId: string }
  | { type: 'setFlag'; flag: string; value?: boolean }
  | { type: 'log'; text: string }
  | { type: 'openFreeDialogue'; context: string };

// ─── LLM Dialogue ──────────────────────────────

interface LLMDialogueContext {
  npcName: string;
  npcDescription: string;
  npcPersonality: string;
  npcGoals: string;
  locationName: string;
  locationDescription: string;
  playerTitle: string;
  playerName: string;
  playerRealm: string;
  playerSect: string;
  playerRace: string;
  playerOrigin: string;
  playerKarma: string;
  playerTechniques: string;
  playerNotableItems: string;
  playerStats: string;
  playerReputations: string;
  playerAllies: string;
  recentHistory: string;
  encounterContext: string;
  npcKnownSecrets: string[];
  npcKnownLocations: string[];
}

interface LLMDialogueResponse {
  text: string;
  effects: DialogueEffect[];
}

interface LLMState {
  lastRequestTick: number;
  cooldownTicks: number;
  requestCount: number;
  cache: Record<string, LLMDialogueResponse>;
}

interface LockedChoice {
  readonly choice: DialogueChoice;
  readonly failedRequirements: {
    requirement: DialogueRequirement;
    reason: string;
  }[];
}

interface DialogueResult {
  readonly newNode: DialogueNode;
  readonly state: GameState;
  readonly effectsApplied: DialogueEffect[];
}
```

---

## Elements

```typescript
// ─── Elements ──────────────────────────────────

type Element =
  | 'fire' | 'water' | 'wood' | 'metal' | 'earth'
  | 'thunder' | 'wind' | 'ice' | 'dark' | 'light' | 'void';

type CultivationPath =
  | 'monocle'       // Single element focus
  | 'dual'          // Two compatible elements
  | 'five_phase'    // All five standard in harmony
  | 'transcendent'; // Special elements only

interface ElementalAffinity {
  readonly primary: Element;
  readonly primaryStrength: number;    // 1–100
  readonly secondary: Element | null;
  readonly secondaryStrength: number;
  readonly resistances: Partial<Record<Element, number>>;     // 0–100
  readonly vulnerabilities: Partial<Record<Element, number>>; // 0–100
  readonly path: CultivationPath;
}

interface ElementalQi {
  fire: number;
  water: number;
  wood: number;
  metal: number;
  earth: number;
  thunder: number;
  wind: number;
  ice: number;
  dark: number;
  light: number;
}
```

---

## Martial Arts

```typescript
// ─── Styles ────────────────────────────────────

interface MartialStyle {
  readonly id: string;
  readonly name: string;
  readonly philosophy: string;
  readonly primaryStat: string;
  readonly elementAffinity: Element | null;
  readonly weaponPreferences: WeaponType[];
  readonly passiveBonuses: StyleBonus[];
  readonly masteryLevels: StyleMasteryLevel[];
  readonly forbidden: boolean;
}

interface StyleBonus {
  readonly stat: string;
  readonly value: number;
  readonly condition?: string;
}

interface StyleMasteryLevel {
  readonly level: number;
  readonly masteryRequired: number;
  readonly unlocks: string[];
}

// ─── Stances ───────────────────────────────────

interface Stance {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly bonuses: Record<string, number>;
  readonly penalties: Record<string, number>;
  readonly minTurnDuration: number;
  readonly specialEffect?: StanceEffect;
}

interface StanceEffect {
  readonly trigger: 'on_enter' | 'on_exit' | 'per_turn' | 'on_hit' | 'on_hit_taken';
  readonly description: string;
  readonly effect: DialogueEffect;
}

// ─── Internal Arts ─────────────────────────────

interface InternalArt {
  readonly id: string;
  readonly name: string;
  readonly type: InternalArtType;
  readonly rarity: Rarity;
  readonly realmRequirement: number;
  readonly masteryLevel: number;
  readonly maxMastery: number;
  readonly passiveEffects: PassiveEffect[];
  readonly masteryMilestones: MasteryMilestone[];
}

type InternalArtType =
  | 'qi_circulation' | 'meridian_opening' | 'dantian_expansion'
  | 'soul_nurturing' | 'life_extension' | 'sensory' | 'spirit_bonding';

interface PassiveEffect {
  readonly stat: string;
  readonly value: number;
  readonly scalesWithMastery: boolean;
}

interface MasteryMilestone {
  readonly masteryRequired: number;
  readonly bonus: string;
}

// ─── External Arts (Body Tempering) ────────────

interface BodyTemperingStage {
  readonly id: string;
  readonly name: string;
  readonly realmRequired: number;
  readonly statBonuses: Record<string, number>;
  readonly specialUnlock: string;
  readonly drawback?: string;
}

// ─── Combos ────────────────────────────────────

interface ComboState {
  currentChain: string[];
  momentum: number;          // 0–100
  multiplier: number;
  chainBreakReason?: string;
}

// ─── Weapon Arts ───────────────────────────────

interface WeaponArt {
  readonly weaponType: WeaponType;
  readonly passiveAt50: string;
  readonly passiveAt100: string;
  readonly techniqueBonus: string;
}

// ─── Movement Arts ─────────────────────────────

interface MovementArt {
  readonly id: string;
  readonly name: string;
  readonly travelSpeedBonus: number;   // 0–1 multiplier
  readonly combatBonus: string;
  readonly special: string;
}
```

---

## Spells

```typescript
// ─── Talismans ─────────────────────────────────

interface Talisman extends Item {
  readonly type: 'talisman';
  readonly talismanType: TalismanType;
  readonly element: Element | null;
  readonly power: number;
  readonly charges: number;
  readonly effect: TalismanEffect;
  readonly craftingRecipe: CraftingRecipe;
  readonly crafterName?: string;
}

type TalismanType =
  | 'attack' | 'defense' | 'healing' | 'utility'
  | 'binding' | 'warding' | 'explosive' | 'transportation';

interface TalismanEffect {
  readonly description: string;
  readonly damageMultiplier?: number;
  readonly shieldAmount?: number;
  readonly healAmount?: number;
  readonly bindDuration?: number;
  readonly wardDuration?: number;
}

interface CraftingRecipe {
  readonly id: string;
  readonly outputItemId: string;
  readonly materials: MaterialRequirement[];
  readonly comprehensionRequired: number;
  readonly ticksToCraft: number;
  readonly successRate: number;
  readonly locationRequired?: string;
  readonly minRealm?: number;
}

interface MaterialRequirement {
  itemType: string;
  quantity: number;
  element?: Element;
  tier?: number;
}

// ─── Formations ────────────────────────────────

interface Formation {
  readonly id: string;
  readonly name: string;
  readonly type: FormationType;
  readonly element: Element | null;
  readonly deploymentTicks: number;
  readonly duration: number;
  readonly power: number;
  readonly effects: FormationEffect[];
  readonly requirement: FormationRequirement;
}

type FormationType =
  | 'killing' | 'trapping' | 'defensive' | 'gathering'
  | 'concealing' | 'transporting' | 'illusion';

interface FormationEffect {
  readonly type: string;
  readonly value: number;
  readonly description: string;
}

interface FormationRequirement {
  readonly minRealm: number;
  readonly comprehensionRequired: number;
  readonly flagCost: number;
}

// ─── Divine Abilities ──────────────────────────

interface DivineAbility {
  readonly id: string;
  readonly name: string;
  readonly realmRequired: number;
  readonly description: string;
  readonly type: DivineAbilityType;
  readonly cooldownTicks: number;
  readonly effect: DivineEffect;
  readonly originExclusive?: string;
  readonly raceExclusive?: string;
  readonly sectExclusive?: string;
}

type DivineAbilityType = 'passive' | 'activated' | 'reactive' | 'ultimate';

interface DivineEffect {
  readonly statBonus?: Record<string, number>;
  readonly damageMultiplier?: number;
  readonly healAmount?: number;
  readonly duration?: number;
  readonly special?: string;
}

// ─── Forbidden Arts ────────────────────────────

interface ForbiddenArt {
  readonly id: string;
  readonly name: string;
  readonly effect: string;
  readonly cost: ForbiddenArtCost;
  readonly karmaPenalty: number;
  readonly corruptionRate: number;
}

interface ForbiddenArtCost {
  readonly healthPercent?: number;
  readonly qiPercent?: number;
  readonly permanentHPLoss?: number;
  readonly spiritStones?: number;
  readonly cooldownTicks: number;
}

// ─── Summons ───────────────────────────────────

interface Summon {
  readonly id: string;
  readonly name: string;
  readonly duration: number;
  readonly stats: Beast;
  readonly specialAbility: string;
  readonly summoningRequirement: SummonRequirement;
}

interface SummonRequirement {
  readonly talismanNeeded?: string;
  readonly qiCost?: number;
  readonly realmRequired: number;
  readonly elementMatch?: Element;
}

// ─── Skills ────────────────────────────────────

interface PlayerSkills {
  talismanCrafting: number;          // 0–100
  formationMastery: number;
  alchemy: number;
  beastTaming: number;
  divination: number;
  weaponMastery: Record<WeaponType, number>;
  styleMastery: Record<string, number>;
}
```

---

## Story Engine — Hidden State

```typescript
// ─── Hidden World State (never displayed to player) ──

interface HiddenWorldState {
  // Weighted tendencies (0–100)
  beastHostility: number;
  sectTensions: Record<string, number>;    // Per sect-pair
  shadowAwareness: number;                 // How much the "shadow" entity notices you
  netherBleed: number;                     // Global veil thinning

  // Ecological state
  beastPopulations: Record<string, number>; // Per species, per location
  herbAvailability: Record<string, number>;

  // Rumor mill
  knownDeeds: DeedRecord[];

  // Personal echoes
  mercyMemory: number;
  crueltyMemory: number;
  curiosityMemory: number;

  // Silent relationships
  unspokenGratitude: Record<string, number>;
  unspokenGrudges: Record<string, number>;
}

interface DeedRecord {
  readonly type: string;
  readonly npcId?: string;
  readonly locationId: string;
  readonly tick: number;
  readonly visibility: 'public' | 'private' | 'rumor';
}

// ─── Event Chain ─────────────────────────────────

interface EventChain {
  readonly id: string;
  readonly title: string;
  readonly stages: EventChainStage[];
  readonly currentStage: number;
  readonly requirements: EventChainRequirement[];
  readonly isActive: boolean;
  readonly isCompleted: boolean;
}

interface EventChainStage {
  readonly eventId: string;
  readonly triggerCondition: EventTrigger;
  readonly leadsTo: number;              // Next stage index, or -1 for terminal
}

type EventTrigger =
  | { type: 'immediate' }
  | { type: 'location'; locationId: string }
  | { type: 'timeElapsed'; ticks: number }
  | { type: 'flagSet'; flag: string }
  | { type: 'hiddenWeight'; weight: string; threshold: number }
  | { type: 'npcAvailable'; npcId: string }
  | { type: 'playerRealm'; realm: number };

// ─── Game Event ──────────────────────────────────

interface GameEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;           // Flavor text, NPC dialogue
  readonly category: EventCategory;
  readonly choices: EventChoice[];
  readonly isUrgent: boolean;             // True = blocks travel/progress
  readonly decayTicks: number;            // 0 = permanent until resolved
  readonly priority: number;              // Higher = shown first in queue
}

type EventCategory =
  | 'encounter'       // Travel-triggered
  | 'story'           // Chain-driven narrative
  | 'breakthrough'    // Cultivation milestone
  | 'relationship'    // NPC-driven
  | 'world_event'     // Political, environmental
  | 'discovery'       // Exploration-triggered
  | 'echo'            // Consequence of past choice
  | 'legacy';         // Long-delayed consequence

interface EventChoice {
  readonly id: string;
  readonly text: string;
  readonly tooltip?: string;
  readonly requirements: DialogueRequirement[];
  readonly immediateEffects: EventEffect[];     // What happens NOW
  readonly delayedEffects: DelayedEffect[];     // What happens LATER
  readonly flags: Record<string, boolean>;       // Flags to set
  readonly hiddenShifts: HiddenShift[];          // Hidden weight changes
  readonly leadsTo?: string;                     // Next event ID in chain
}

interface EventEffect {
  readonly description: string;           // Shown to player
  readonly qiGain?: number;
  readonly itemGain?: string[];
  readonly itemLoss?: string[];
  readonly spiritStones?: number;
  readonly statChange?: Record<string, number>;
  readonly reputationChange?: Record<string, number>;
  readonly karmaChange?: number;
  readonly locationReveal?: string;
  readonly relationshipChange?: Record<string, number>;
}

// Delayed effects are NOT shown to the player when they make the choice.
// They are stored and fired later when conditions are met.

interface DelayedEffect {
  readonly id: string;
  readonly trigger: EventTrigger;
  readonly eventId: string;               // Event to fire when triggered
  readonly description?: string;          // Internal note, never shown
}

interface HiddenShift {
  readonly weight: keyof HiddenWorldState;
  readonly delta: number;
  readonly subKey?: string;               // For Record-type weights
}
```
