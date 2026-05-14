import { GameState, TabId, EventChoice } from '../types';
import { LOCATIONS } from '../data/locations';
import { ITEMS } from '../data/items';
// Renderer.ts — DOM rendering for all game views
import { GameEngine, GameAction } from '../engine/GameEngine';
import { CombatEngine } from '../engine/CombatEngine';

const APP_HTML = `
<div id="header">
  <span id="title">⛩️ Idle Cultivation Sect</span>
  <span id="player-info"></span>
</div>
<div id="tabs">
  <button class="tab-btn active" data-tab="event">Event</button>
  <button class="tab-btn" data-tab="cultivate">Cultivate</button>
  <button class="tab-btn" data-tab="self">Self</button>
  <button class="tab-btn" data-tab="world">World</button>
  <button class="tab-btn" data-tab="log">Log</button>
</div>
<div id="main-content"></div>
<div id="status-bar">
  <span id="status-shen">Shén: 0/0</span>
  <span id="status-hp">HP: 0/0</span>
  <span id="status-stones">💎 0</span>
  <span id="status-tier">Tier 0</span>
  <span id="status-meditation">🧘 Off</span>
</div>
`;

const SELF_HTML = `
<div id="self-stats">
  <h3>Stats</h3>
  <table>
    <tr><td>Name:</td><td id="stat-name"></td><td>Race:</td><td id="stat-race"></td></tr>
    <tr><td>Origin:</td><td id="stat-origin"></td><td>Karma:</td><td id="stat-karma"></td></tr>
    <tr><td>Attack:</td><td id="stat-atk"></td><td>Defense:</td><td id="stat-def"></td></tr>
    <tr><td>Speed:</td><td id="stat-spd"></td><td>Comprehension:</td><td id="stat-comp"></td></tr>
    <tr><td>Luck:</td><td id="stat-luck"></td><td>Path:</td><td id="stat-path"></td></tr>
  </table>
</div>
<div id="self-equipment">
  <h3>Equipment</h3>
  <div id="equipped-weapon"></div>
  <div id="equip-actions"></div>
</div>
<div id="self-inventory">
  <h3>Inventory</h3>
  <div id="inventory-list"></div>
</div>
`;

export class Renderer {
  private app: HTMLElement;
  private engine: GameEngine;

  constructor(appEl: HTMLElement, engine: GameEngine) {
    this.app = appEl;
    this.engine = engine;
    this.app.innerHTML = APP_HTML;
    this.bindTabs();
    this.bindCultivateControls();
  }

  update(state: GameState): void {
    // Keep lastState in sync so external state mutations are reflected
    this.lastState = state;
    this.initialized = true;
    this.updateHeader(state);
    this.updateStatusBar(state);

    const tab = state.ui.activeTab;
    const content = document.getElementById('main-content');
    if (!content) return;

    // Combat view takes priority
    if (state.ui.combatState && tab !== 'log') {
      this.renderCombat(state, content);
      return;
    }

    switch (tab) {
      case 'event':
        this.renderEvent(state, content);
        break;
      case 'cultivate':
        this.renderCultivate(state, content);
        break;
      case 'self':
        this.renderSelf(state, content);
        break;
      case 'world':
        this.renderWorld(state, content);
        break;
      case 'log':
        this.renderLog(state, content);
        break;
    }
  }

  private updateHeader(state: GameState): void {
    const el = document.getElementById('player-info');
    if (!el) return;
    const tierNames = ['Mortal', 'Initiate', 'Practitioner', 'Adept'];
    el.textContent = `${state.player.name} — ${tierNames[state.player.tier] ?? 'Tier ' + state.player.tier}`;
  }

  private updateStatusBar(state: GameState): void {
    setText('status-shen', `Shén: ${fmtShen(state.player.shen)} / ${fmtShen(state.player.maxShen)}`);
    setText('status-hp', `HP: ${Math.floor(state.player.health)}/${Math.floor(state.player.maxHealth)}`);
    setText('status-stones', `💎 ${state.player.spiritStones}`);
    setText('status-tier', `Tier ${state.player.tier}`);
    setText('status-meditation', state.player.meditating ? '🧘 On' : '🧘 Off');
  }

  // ─── Event Tab ──────────────────────────────

  private renderEvent(state: GameState, el: HTMLElement): void {
    const event = state.ui.currentEvent;
    if (!event) {
      el.innerHTML = `<div class="placeholder">Waiting for events...<br><small>Meditate or travel to find new situations.</small></div>`;
      return;
    }

    let html = `<div class="event-card">`;
    html += `<div class="event-title">${event.title}</div>`;
    html += `<div class="event-location">📍 ${LOCATIONS[event.locationId]?.name ?? event.locationId}</div>`;
    html += `<div class="event-description">${event.description.replace(/\n/g, '<br>')}</div>`;
    html += `<div class="event-choices">`;

    for (const choice of event.choices) {
      const locked = this.isChoiceLocked(state, choice);
      html += `<button class="choice-btn ${locked ? 'locked' : ''}" data-choice="${choice.id}" ${locked ? 'disabled' : ''}>
        ${choice.text}${locked ? `\n<span class="lock-reason">${locked}</span>` : ''}
        ${choice.tooltip ? `<span class="choice-tip">${choice.tooltip}</span>` : ''}
      </button>`;
    }

    html += `</div></div>`;
    el.innerHTML = html;

    // Bind choice buttons
    el.querySelectorAll('.choice-btn:not(.locked)').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceId = (btn as HTMLElement).dataset.choice;
        if (choiceId) {
          this.dispatch({ type: 'CHOOSE_EVENT', choiceId });
        }
      });
    });
  }

  private isChoiceLocked(state: GameState, choice: EventChoice): string | null {
    const req = choice.requires;
    if (!req) return null;

    if (req.stat) {
      const p = state.player as unknown as Record<string, number>;
      const val = p[req.stat.name] ?? 0;
      if (val < req.stat.min) return `Requires: ${req.stat.name} ${req.stat.min}+ (${val})`;
    }
    if (req.item) {
      if (!state.player.inventory.some(i => i.id === req.item)) return `Requires: ${ITEMS[req.item]?.name ?? req.item}`;
    }
    if (req.karma) {
      if (req.karma.min !== undefined && state.player.karma < req.karma.min) return `Requires: Karma ${req.karma.min}+ (${state.player.karma})`;
      if (req.karma.max !== undefined && state.player.karma > req.karma.max) return `Requires: Karma ≤ ${req.karma.max} (${state.player.karma})`;
    }
    if (req.race && state.player.race !== req.race) return `Requires: ${req.race}`;
    if (req.flag && !state.flags[req.flag]) return `Requires: Special condition`;

    return null;
  }

  // ─── Cultivate Tab ─────────────────────────

  private renderCultivate(state: GameState, el: HTMLElement): void {
    const tierNames = ['Mortal', 'Initiate', 'Practitioner', 'Adept'];
    const p = state.player;
    const progress = (p.shen / p.maxShen) * 100;
    const shenBarWidth = Math.min(100, Math.max(0, progress));

    el.innerHTML = `
      <div class="cultivate-panel">
        <h3>🧘 Meditation</h3>
        <div class="shen-bar-container">
          <div class="shen-bar" style="width: ${shenBarWidth}%"></div>
        </div>
        <div class="shen-label">${fmtShen(p.shen)} / ${fmtShen(p.maxShen)} (${Math.floor(progress)}%)</div>
        <button id="meditate-btn" class="${p.meditating ? 'active' : ''}">
          ${p.meditating ? '⏹ Stop Meditating' : '▶ Start Meditating'}
        </button>
        <div class="cultivate-info">
          <div>Realm: ${tierNames[p.tier] ?? 'Tier ' + p.tier}</div>
          <div>Sub-stage: ${p.subStage}</div>
          <div>Next tier: ${getNextTierRequirement(p.tier)} shén</div>
        </div>
        <div class="shen-vessels">
          <h4>💎 Shén Vessels in Inventory</h4>
          ${this.renderVesselList(state)}
        </div>
      </div>
    `;

    const btn = document.getElementById('meditate-btn');
    if (btn) {
      btn.onclick = () => {
        this.dispatch(state.player.meditating ? { type: 'STOP_MEDITATION' } : { type: 'START_MEDITATION' });
      };
    }
  }

  private renderVesselList(state: GameState): string {
    const vessels = state.player.inventory.filter(i => i.shenContained && i.shenContained > 0);
    if (vessels.length === 0) return '<div class="empty">No shén vessels. Find some through events!</div>';

    return vessels.map(v => `
      <div class="vessel-item">
        <span>${v.name} ×${v.quantity}</span>
        <span class="vessel-shen">+${v.shenContained} S</span>
        <button class="absorb-btn" data-item="${v.id}">Absorb</button>
      </div>
    `).join('');
  }

  // ─── Self Tab ──────────────────────────────

  private renderSelf(state: GameState, el: HTMLElement): void {
    el.innerHTML = SELF_HTML;
    const p = state.player;

    setText('stat-name', p.name);
    setText('stat-race', p.race === 'spirit_fox' ? 'Spirit Fox' : 'Human');
    setText('stat-origin', p.origin === 'village_orphan' ? 'Village Orphan' : 'Disgraced Disciple');
    setText('stat-karma', String(p.karma));
    setText('stat-atk', String(p.attack));
    setText('stat-def', String(p.defense));
    setText('stat-spd', String(p.speed));
    setText('stat-comp', String(p.comprehension));
    setText('stat-luck', String(p.luck));
    setText('stat-path', p.path ? p.path.toUpperCase() : 'Not chosen (Tier 3)');

    const weapon = p.equippedWeapon;
    const weaponEl = document.getElementById('equipped-weapon');
    if (weaponEl) {
      weaponEl.innerHTML = weapon
        ? `Equipped: <strong>${weapon.name}</strong> (Atk +${weapon.statBonus?.attack ?? 0})`
        : 'Equipped: <em>None (unarmed)</em>';
    }

    const actionsEl = document.getElementById('equip-actions');
    if (actionsEl) {
      const unequipBtn = weapon ? '<button id="unequip-btn">Unequip</button>' : '';
      const weapons = p.inventory.filter(i => i.type === 'weapon');
      const weaponBtns = weapons.map(w => `<button class="equip-btn" data-item="${w.id}">Equip ${w.name}</button>`).join('');
      actionsEl.innerHTML = unequipBtn + weaponBtns;

      if (weapon) {
        document.getElementById('unequip-btn')?.addEventListener('click', () => this.dispatch({ type: 'UNEQUIP_WEAPON' }));
      }
      actionsEl.querySelectorAll('.equip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.item;
          if (id) this.dispatch({ type: 'EQUIP_WEAPON', itemId: id });
        });
      });
    }

    const invEl = document.getElementById('inventory-list');
    if (invEl) {
      if (p.inventory.length === 0) {
        invEl.innerHTML = '<div class="empty">Empty.</div>';
      } else {
        invEl.innerHTML = p.inventory.map(i => `
          <div class="inv-item">
            <span>${i.name} ${i.quantity > 1 ? `×${i.quantity}` : ''}</span>
            <span class="inv-type">${i.type}</span>
            ${i.shenContained ? `<button class="absorb-btn" data-item="${i.id}">Absorb</button>` : ''}
          </div>
        `).join('');
        invEl.querySelectorAll('.absorb-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.item;
            if (id) this.dispatch({ type: 'ABSORB_ITEM', itemId: id });
          });
        });
      }
    }
  }

  // ─── World Tab ─────────────────────────────

  private renderWorld(state: GameState, el: HTMLElement): void {
    const current = LOCATIONS[state.world.currentNodeId];
    if (!current) { el.innerHTML = '<div>Unknown location.</div>'; return; }

    let html = `<div class="world-panel">
      <h3>📍 ${current.name}</h3>
      <p>${current.description}</p>
      <p><small>Danger: ${current.danger}/5 | Shén Density: ×${current.shenDensity}</small></p>`;

    if (state.world.travelState) {
      const ts = state.world.travelState;
      const dest = LOCATIONS[ts.toId];
      const progress = Math.floor((ts.elapsed / ts.totalDuration) * 100);
      html += `<div class="travel-progress">
        <div>🚶 Traveling to ${dest?.name ?? ts.toId}...</div>
        <div class="shen-bar-container"><div class="shen-bar" style="width:${progress}%"></div></div>
        <div>${fmtTime(ts.totalDuration - ts.elapsed)} remaining</div>
      </div>`;
    } else {
      html += `<div class="neighbors">`;
      const neighbors = Object.entries(current.neighbors)
        .filter(([id]) => LOCATIONS[id] && state.player.tier >= (LOCATIONS[id]?.minTier ?? 0));

      for (const [id, travelTime] of neighbors) {
        const loc = LOCATIONS[id]!;
        html += `<button class="travel-btn" data-location="${id}">
          🚶 ${loc.name} — ${fmtTime(travelTime)}${loc.minTier > state.player.tier ? ' 🔒' : ''}
        </button>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
    el.innerHTML = html;

    el.querySelectorAll('.travel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const loc = (btn as HTMLElement).dataset.location;
        if (loc) this.dispatch({ type: 'TRAVEL_TO', locationId: loc });
      });
    });
  }

  // ─── Log Tab ───────────────────────────────

  private renderLog(state: GameState, el: HTMLElement): void {
    el.innerHTML = `<h3>📜 Event Log</h3><div id="log-entries">${
      [...state.log].reverse().slice(0, 50).map(l =>
        `<div class="log-entry ${l.type}">[${l.tick}] ${l.text}</div>`
      ).join('')
    }</div>`;
  }

  // ─── Combat View ──────────────────────────

  private renderCombat(state: GameState, el: HTMLElement): void {
    const cs = state.ui.combatState;
    if (!cs) { this.renderEvent(state, el); return; }

    let html = `<div class="combat-view">
      <h3>⚔️ ${cs.enemy.name}</h3>
      <div class="combat-hp">
        <div>${state.player.name}: HP ${Math.floor(cs.playerHealth)}/${Math.floor(state.player.maxHealth)}</div>
        <div>${cs.enemy.name}: HP ${Math.floor(cs.enemyHealth)}/${cs.enemy.health}</div>
      </div>
      <div class="combat-log">
        ${cs.log.slice(-10).map(l => `<div class="combat-line">${l.text}</div>`).join('')}
      </div>`;

    if (cs.status === 'active') {
      html += `<button id="combat-tick-btn">Next Turn</button>
        <button id="combat-flee-btn">Attempt Flee</button>`;
    } else if (cs.status === 'player_won') {
      html += `<div class="combat-result victory">✦ VICTORY!</div>
        <button id="combat-dismiss">Continue</button>`;
    } else if (cs.status === 'enemy_won') {
      html += `<div class="combat-result defeat">✖ DEFEAT</div>
        <button id="combat-dismiss">Continue</button>`;
    }

    html += `</div>`;
    el.innerHTML = html;

    document.getElementById('combat-tick-btn')?.addEventListener('click', () => {
      const newState = CombatEngine.tickCombat(state);
      this.engine['eventEngine']; // access to event engine for tick
      // We just update the state via the render cycle
      this.dispatchAndRefresh(state);
    });

    document.getElementById('combat-flee-btn')?.addEventListener('click', () => {
      const fled = Math.random() < 0.4 + state.player.speed * 0.01;
      if (fled) {
        const newCs = { ...cs, status: 'player_won' as const };
        const newState = { ...state, ui: { ...state.ui, combatState: null, currentEvent: null } };
        this.emitStateUpdate(newState);
      } else {
        // Flee failed, enemy gets a free turn
        this.dispatchAndRefresh(state);
      }
    });

    document.getElementById('combat-dismiss')?.addEventListener('click', () => {
      this.dispatchAndRefresh(state);
    });
  }

  // ─── Helpers ──────────────────────────────

  private bindTabs(): void {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as import('../types').TabId;
        if (tab) this.emitStateUpdate({ ...this.lastState, ui: { ...this.lastState.ui, activeTab: tab } });
      });
    });
  }

  private bindCultivateControls(): void {
    // Absorb buttons are bound dynamically in render
  }

  private dispatch(action: GameAction): void {
    const newState = this.engine.processAction(this.lastState, action);
    this.emitStateUpdate(newState);
  }

  private dispatchAndRefresh(state: GameState): void {
    this.emitStateUpdate(this.engine.tick(state));
  }

  private lastState!: GameState;
  private onStateUpdate: ((state: GameState) => void) | null = null;
  private initialized = false;

  setStateUpdateCallback(cb: (state: GameState) => void): void {
    this.onStateUpdate = cb;
  }

  private emitStateUpdate(state: GameState): void {
    this.lastState = state;
    if (this.onStateUpdate) this.onStateUpdate(state);
  }
}

// ─── Utility Functions ──────────────────────

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function fmtShen(s: number): string {
  if (s >= 1_000_000) return (s / 1_000_000).toFixed(2) + ' MS';
  if (s >= 1_000) return (s / 1_000).toFixed(1) + ' kS';
  return Math.floor(s) + ' S';
}

function fmtTime(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getNextTierRequirement(tier: number): string {
  const thresholds: number[] = [10, 1000, 100000, 10000000];
  const val = tier < thresholds.length ? thresholds[tier]! : thresholds[thresholds.length - 1]!;
  return fmtShen(val);
}

