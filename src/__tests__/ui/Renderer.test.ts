/**
 * UI / Renderer tests — DOM-based rendering and interaction.
 * Uses jsdom to simulate browser environment.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Renderer } from '../../ui/Renderer';
import { GameEngine } from '../../engine/GameEngine';
import { createInitialState } from '../../state/GameState';
import { GameState, TabId } from '../../types';

describe('Renderer', () => {
  let appEl: HTMLElement;
  let engine: GameEngine;
  let renderer: Renderer;
  let state: GameState;

  beforeEach(() => {
    // Setup DOM
    appEl = document.createElement('div');
    appEl.id = 'app';
    document.body.appendChild(appEl);

    engine = new GameEngine();
    renderer = new Renderer(appEl, engine);
    state = createInitialState('TestPlayer', 'human', 'village_orphan');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('initial render', () => {
    it('renders the app skeleton (header, tabs, main-content, status-bar)', () => {
      renderer.update(state);

      expect(document.getElementById('header')).not.toBeNull();
      expect(document.getElementById('tabs')).not.toBeNull();
      expect(document.getElementById('main-content')).not.toBeNull();
      expect(document.getElementById('status-bar')).not.toBeNull();
    });

    it('renders the title in header', () => {
      renderer.update(state);
      const title = document.getElementById('title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toContain('Idle Cultivation Sect');
    });

    it('renders player info in header', () => {
      renderer.update(state);
      const info = document.getElementById('player-info');
      expect(info).not.toBeNull();
      expect(info!.textContent).toContain('TestPlayer');
    });
  });

  describe('tab navigation', () => {
    it('has 5 tabs: Event, Cultivate, Self, World, Log', () => {
      renderer.update(state);
      const tabs = document.querySelectorAll('.tab-btn');
      expect(tabs).toHaveLength(5);

      const tabTexts = Array.from(tabs).map(t => t.textContent?.trim());
      expect(tabTexts).toEqual(['Event', 'Cultivate', 'Self', 'World', 'Log']);
    });

    it('active tab has "active" class', () => {
      renderer.update(state);
      const activeTab = document.querySelector('.tab-btn.active');
      expect(activeTab).not.toBeNull();
      expect(activeTab!.textContent?.trim()).toBe('Event');
    });

    it('clicking a tab changes activeTab in state via callback', () => {
      let capturedState: GameState | null = null;
      renderer.setStateUpdateCallback((newState) => {
        capturedState = newState;
      });
      renderer.update(state);

      // Click the "Cultivate" tab
      const cultivateBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.textContent?.trim() === 'Cultivate');
      expect(cultivateBtn).toBeDefined();
      (cultivateBtn as HTMLElement).click();

      expect(capturedState).not.toBeNull();
      expect(capturedState!.ui.activeTab).toBe('cultivate');
    });
  });

  describe('status bar', () => {
    it('displays shen, HP, spirit stones, tier, and meditation status', () => {
      renderer.update(state);

      expect(document.getElementById('status-shen')).not.toBeNull();
      expect(document.getElementById('status-hp')).not.toBeNull();
      expect(document.getElementById('status-stones')).not.toBeNull();
      expect(document.getElementById('status-tier')).not.toBeNull();
      expect(document.getElementById('status-meditation')).not.toBeNull();
    });

    it('shows meditation status as Off initially', () => {
      renderer.update(state);
      const medEl = document.getElementById('status-meditation');
      expect(medEl!.textContent).toContain('Off');
    });

    it('shows correct HP values', () => {
      renderer.update(state);
      const hpEl = document.getElementById('status-hp');
      expect(hpEl!.textContent).toContain('50/50');
    });
  });

  describe('event tab rendering', () => {
    it('shows placeholder when no event is active', () => {
      renderer.update(state);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('Waiting for events');
    });

    it('renders event card when event is active', () => {
      const eventState: GameState = {
        ...state,
        ui: {
          ...state.ui,
          currentEvent: {
            id: 'test',
            title: 'Test Event Title',
            locationId: 'azure_cloud_village',
            category: 'story',
            description: 'This is a test event.',
            choices: [
              {
                id: 'choice1',
                text: 'Do something',
                outcome: { flavorText: 'Done.' },
              },
            ],
            trigger: { type: 'location', locationId: 'azure_cloud_village' },
          },
        },
      };

      renderer.update(eventState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('Test Event Title');
      expect(content!.innerHTML).toContain('This is a test event.');
    });

    it('renders choice buttons', () => {
      const eventState: GameState = {
        ...state,
        ui: {
          ...state.ui,
          currentEvent: {
            id: 'test',
            title: 'Test Event',
            locationId: 'azure_cloud_village',
            category: 'story',
            description: 'Desc.',
            choices: [
              {
                id: 'choice1',
                text: 'Choice A',
                outcome: { flavorText: 'A' },
              },
              {
                id: 'choice2',
                text: 'Choice B',
                outcome: { flavorText: 'B' },
              },
            ],
            trigger: { type: 'location', locationId: 'azure_cloud_village' },
          },
        },
      };

      renderer.update(eventState);
      const buttons = document.querySelectorAll('.choice-btn');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]!.textContent).toContain('Choice A');
      expect(buttons[1]!.textContent).toContain('Choice B');
    });

    it('disables locked choices and shows lock reason', () => {
      const eventState: GameState = {
        ...state,
        player: { ...state.player, comprehension: 5 },
        ui: {
          ...state.ui,
          currentEvent: {
            id: 'test',
            title: 'Test',
            locationId: 'a',
            category: 'story',
            description: '...',
            choices: [
              {
                id: 'locked_choice',
                text: 'Need smarts',
                requires: { stat: { name: 'comprehension', min: 10 } },
                outcome: { flavorText: 'ok' },
              },
              {
                id: 'free_choice',
                text: 'Free choice',
                outcome: { flavorText: 'ok' },
              },
            ],
            trigger: { type: 'location', locationId: 'a' },
          },
        },
      };

      renderer.update(eventState);
      const lockedBtn = document.querySelector('.choice-btn.locked') as HTMLButtonElement;
      expect(lockedBtn).not.toBeNull();
      expect(lockedBtn!.disabled).toBe(true);
      expect(lockedBtn!.textContent).toContain('Requires');

      const freeBtn = document.querySelector('.choice-btn:not(.locked)');
      expect(freeBtn).not.toBeNull();
    });

    it('clicking a choice button dispatches CHOOSE_EVENT action', () => {
      let capturedAction: any = null;

      // We spy by intercepting the state update callback
      renderer.setStateUpdateCallback((newState) => {
        capturedAction = newState;
      });

      // Set the lastState on the renderer so it has a reference
      renderer.update(state);

      const eventState: GameState = {
        ...state,
        ui: {
          ...state.ui,
          currentEvent: {
            id: 'test',
            title: 'Test',
            locationId: 'azure_cloud_village',
            category: 'story',
            description: 'Desc.',
            choices: [
              {
                id: 'my_choice',
                text: 'Pick me',
                outcome: { flavorText: 'done', spiritStones: 5 },
              },
            ],
            trigger: { type: 'location', locationId: 'azure_cloud_village' },
          },
        },
      };

      renderer.update(eventState);

      const btn = document.querySelector('.choice-btn') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      btn.click();

      // The callback should have been called with the updated state
      expect(capturedAction).not.toBeNull();
      // After choosing, spirit stones should have increased
      expect(capturedAction!.player.spiritStones).toBe(5);
    });
  });

  describe('cultivate tab rendering', () => {
    it('renders meditation panel when cultivate tab is active', () => {
      const cultivateState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'cultivate' },
      };

      renderer.update(cultivateState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('Meditation');
      expect(content!.innerHTML).toContain('shen-bar');
    });

    it('renders the meditate button', () => {
      const cultivateState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'cultivate' },
      };

      renderer.update(cultivateState);
      const btn = document.getElementById('meditate-btn');
      expect(btn).not.toBeNull();
      expect(btn!.textContent?.trim()).toContain('Start Meditating');
    });

    it('meditate button shows "Stop Meditating" when already meditating', () => {
      const cultivateState: GameState = {
        ...state,
        player: { ...state.player, meditating: true },
        ui: { ...state.ui, activeTab: 'cultivate' },
      };

      renderer.update(cultivateState);
      const btn = document.getElementById('meditate-btn');
      expect(btn!.textContent?.trim()).toContain('Stop Meditating');
      expect(btn!.classList.contains('active')).toBe(true);
    });

    it('clicking meditate button dispatches START_MEDITATION', () => {
      let capturedState: GameState | null = null;
      renderer.setStateUpdateCallback((newState) => {
        capturedState = newState;
      });
      renderer.update(state);

      const cultivateState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'cultivate' },
      };
      renderer.update(cultivateState);

      const btn = document.getElementById('meditate-btn');
      btn!.click();

      expect(capturedState).not.toBeNull();
      expect(capturedState!.player.meditating).toBe(true);
    });
  });

  describe('self tab rendering', () => {
    it('renders stats table', () => {
      const selfState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'self' },
      };

      renderer.update(selfState);

      expect(document.getElementById('stat-name')!.textContent).toBe('TestPlayer');
      expect(document.getElementById('stat-race')!.textContent).toBe('Human');
      expect(document.getElementById('stat-atk')).not.toBeNull();
      expect(document.getElementById('stat-def')).not.toBeNull();
      expect(document.getElementById('stat-spd')).not.toBeNull();
      expect(document.getElementById('stat-comp')).not.toBeNull();
      expect(document.getElementById('stat-luck')).not.toBeNull();
    });

    it('renders equipped weapon info', () => {
      const selfState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'self' },
      };

      renderer.update(selfState);
      const weaponEl = document.getElementById('equipped-weapon');
      expect(weaponEl).not.toBeNull();
      expect(weaponEl!.textContent).toContain('Rusty Iron Sword');
    });

    it('renders inventory items', () => {
      const selfState: GameState = {
        ...state,
        player: {
          ...state.player,
          inventory: [
            {
              id: 'qi_crystal',
              name: 'Qi Crystal',
              type: 'shen_vessel',
              description: 'test',
              value: 5,
              stackable: true,
              quantity: 3,
              shenContained: 0.5,
            },
          ],
        },
        ui: { ...state.ui, activeTab: 'self' },
      };

      renderer.update(selfState);
      const invItems = document.querySelectorAll('.inv-item');
      expect(invItems).toHaveLength(1);
      expect(invItems[0]!.textContent).toContain('Qi Crystal');
      expect(invItems[0]!.textContent).toContain('×3');
    });

    it('absorb button in inventory dispatches ABSORB_ITEM', () => {
      let capturedState: GameState | null = null;
      renderer.setStateUpdateCallback((newState) => {
        capturedState = newState;
      });
      renderer.update(state);

      const selfState: GameState = {
        ...state,
        player: {
          ...state.player,
          shen: 0,
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
        ui: { ...state.ui, activeTab: 'self' },
      };

      renderer.update(selfState);
      const absorbBtn = document.querySelector('.absorb-btn') as HTMLButtonElement;
      expect(absorbBtn).not.toBeNull();
      absorbBtn.click();

      expect(capturedState).not.toBeNull();
      expect(capturedState!.player.shen).toBe(0.5);
      expect(capturedState!.player.inventory).toHaveLength(0);
    });
  });

  describe('world tab rendering', () => {
    it('renders current location info', () => {
      const worldState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'world' },
      };

      renderer.update(worldState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('Azure Cloud Village');
    });

    it('renders travel buttons for neighbors', () => {
      const worldState: GameState = {
        ...state,
        ui: { ...state.ui, activeTab: 'world' },
      };

      renderer.update(worldState);
      const buttons = document.querySelectorAll('.travel-btn');
      expect(buttons.length).toBeGreaterThanOrEqual(1);

      const btnTexts = Array.from(buttons).map(b => b.textContent);
      expect(btnTexts.some(t => t!.includes('Whispering Forest'))).toBe(true);
    });

    it('renders travel progress bar when traveling', () => {
      const worldState: GameState = {
        ...state,
        world: {
          ...state.world,
          travelState: {
            fromId: 'azure_cloud_village',
            toId: 'whispering_forest',
            totalDuration: 900,
            elapsed: 450,
          },
        },
        ui: { ...state.ui, activeTab: 'world' },
      };

      renderer.update(worldState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('Traveling');
      expect(content!.innerHTML).toContain('shen-bar'); // progress bar
      expect(content!.innerHTML).toContain('remaining');
    });
  });

  describe('log tab rendering', () => {
    it('renders log entries in reverse chronological order', () => {
      const logState: GameState = {
        ...state,
        log: [
          { type: 'event', tick: 1, text: 'First event' },
          { type: 'combat', tick: 2, text: 'Fought wolf' },
          { type: 'breakthrough', tick: 3, text: 'Broke through!' },
        ],
        ui: { ...state.ui, activeTab: 'log' },
      };

      renderer.update(logState);
      const entries = document.querySelectorAll('.log-entry');
      expect(entries).toHaveLength(3);
      // Reverse order: latest first
      expect(entries[0]!.textContent).toContain('Broke through!');
      expect(entries[1]!.textContent).toContain('Fought wolf');
      expect(entries[2]!.textContent).toContain('First event');
    });

    it('applies correct CSS class based on log type', () => {
      const logState: GameState = {
        ...state,
        log: [
          { type: 'breakthrough', tick: 1, text: 'Breakthrough!' },
        ],
        ui: { ...state.ui, activeTab: 'log' },
      };

      renderer.update(logState);
      const entry = document.querySelector('.log-entry');
      expect(entry!.classList.contains('breakthrough')).toBe(true);
    });
  });

  describe('combat rendering', () => {
    it('renders combat view when combat is active', () => {
      const combatState: GameState = {
        ...state,
        ui: {
          ...state.ui,
          combatState: {
            enemy: { name: 'Shadow Wolf', health: 30, attack: 5, defense: 2, speed: 6, loot: { stones: [5, 10], items: [] } },
            playerHealth: 50,
            enemyHealth: 30,
            turn: 0,
            status: 'active',
            log: [{ turn: 0, text: 'Combat started!', damage: 0, isCrit: false, isDodge: false }],
          },
        },
      };

      renderer.update(combatState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('Shadow Wolf');
      expect(content!.innerHTML).toContain('HP');
      expect(content!.innerHTML).toContain('Next Turn');
      expect(content!.innerHTML).toContain('Attempt Flee');
    });

    it('renders victory result when player won', () => {
      const winState: GameState = {
        ...state,
        ui: {
          ...state.ui,
          combatState: {
            enemy: { name: 'Wolf', health: 0, attack: 5, defense: 2, speed: 6, loot: { stones: [5, 10], items: [] } },
            playerHealth: 40,
            enemyHealth: 0,
            turn: 3,
            status: 'player_won',
            log: [{ turn: 3, text: 'Player wins!', damage: 10, isCrit: false, isDodge: false }],
          },
        },
      };

      renderer.update(winState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('VICTORY');
      expect(content!.innerHTML).toContain('Continue');
      // Should not show Next Turn button
      expect(content!.innerHTML).not.toContain('Next Turn');
    });

    it('renders defeat result when enemy won', () => {
      const loseState: GameState = {
        ...state,
        ui: {
          ...state.ui,
          combatState: {
            enemy: { name: 'Boss', health: 50, attack: 10, defense: 5, speed: 10, loot: { stones: [10, 20], items: [] } },
            playerHealth: 0,
            enemyHealth: 50,
            turn: 5,
            status: 'enemy_won',
            log: [{ turn: 5, text: 'Enemy wins...', damage: 15, isCrit: false, isDodge: false }],
          },
        },
      };

      renderer.update(loseState);
      const content = document.getElementById('main-content');
      expect(content!.innerHTML).toContain('DEFEAT');
      expect(content!.innerHTML).toContain('Continue');
    });
  });

  describe('meditation status bar updates', () => {
    it('shows "On" when meditating', () => {
      const medState: GameState = {
        ...state,
        player: { ...state.player, meditating: true },
      };

      renderer.update(medState);
      const medEl = document.getElementById('status-meditation');
      expect(medEl!.textContent).toContain('On');
    });
  });
});
