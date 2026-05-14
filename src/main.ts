import './ui/styles.css';
import { GameEngine } from './engine/GameEngine';
import { Renderer } from './ui/Renderer';
import { createInitialState } from './state/GameState';
import { GameState } from './types';

function bootstrap(initialState?: GameState): void {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  const engine = new GameEngine();
  let state: GameState;

  if (initialState) {
    state = initialState;
  } else {
    // Try loading saved state
    const saved = localStorage.getItem('idle_cultivation_sect_save');
    if (saved) {
      try {
        state = JSON.parse(saved) as GameState;
        if (state.version !== 1) throw new Error('Version mismatch');
      } catch {
        showCharacterCreation();
        return;
      }
    } else {
      showCharacterCreation();
      return;
    }
  }

  startGame(appEl, engine, state);
}

function startGame(appEl: HTMLElement, engine: GameEngine, state: GameState): void {
  const renderer = new Renderer(appEl, engine);
  let currentState = state;

  // Auto-save every 30 seconds
  const saveInterval = setInterval(() => {
    localStorage.setItem('idle_cultivation_sect_save', JSON.stringify(currentState));
  }, 30000);

  // Game loop: tick every 1 second
  const gameInterval = setInterval(() => {
    currentState = engine.tick(currentState);
    renderer.update(currentState);
  }, 1000);

  // State updates from player actions
  renderer.setStateUpdateCallback((newState) => {
    currentState = newState;
    renderer.update(currentState);
  });

  // Save on tab close
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('idle_cultivation_sect_save', JSON.stringify(currentState));
    clearInterval(saveInterval);
    clearInterval(gameInterval);
  });

  // Initial render
  renderer.update(currentState);
}

function showCharacterCreation(): void {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  appEl.innerHTML = `
    <div id="creation-screen">
      <h1>⛩️ Idle Cultivation Sect</h1>
      <div class="creation-section">
        <label>Name your cultivator:</label>
        <input type="text" id="name-input" placeholder="Li Wei" value="Li Wei" />
      </div>
      <div class="creation-section">
        <label>Choose your race:</label>
        <div class="creation-choices">
          <label class="radio-card"><input type="radio" name="race" value="human" checked />
            <strong>Human</strong> — Balanced. +2 Comprehension.
          </label>
          <label class="radio-card"><input type="radio" name="race" value="spirit_fox" />
            <strong>Spirit Fox</strong> — Quick and lucky. +2 Speed, +2 Luck.
          </label>
        </div>
      </div>
      <div class="creation-section">
        <label>Choose your origin:</label>
        <div class="creation-choices">
          <label class="radio-card"><input type="radio" name="origin" value="village_orphan" checked />
            <strong>Village Orphan</strong> — +3 Comprehension. Rusty sword. Start at Azure Cloud Village.
          </label>
          <label class="radio-card"><input type="radio" name="origin" value="disgraced_disciple" />
            <strong>Disgraced Disciple</strong> — Already Tier 1. +3 Atk, +2 Def. Start at Green Jade City.
          </label>
        </div>
      </div>
      <button id="begin-btn">Begin Your Journey</button>
    </div>
  `;

  document.getElementById('begin-btn')?.addEventListener('click', () => {
    const name = (document.getElementById('name-input') as HTMLInputElement)?.value || 'Li Wei';
    const raceEl = document.querySelector('input[name="race"]:checked') as HTMLInputElement;
    const originEl = document.querySelector('input[name="origin"]:checked') as HTMLInputElement;
    const race = (raceEl?.value as 'human' | 'spirit_fox') || 'human';
    const origin = (originEl?.value as 'village_orphan' | 'disgraced_disciple') || 'village_orphan';

    const state = createInitialState(name, race, origin);
    startGame(appEl!, new GameEngine(), state);
  });
}

document.addEventListener('DOMContentLoaded', () => bootstrap());
