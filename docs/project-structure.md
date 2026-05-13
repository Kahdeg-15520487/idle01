# Project Structure

> Directory layout, module organization, naming conventions, and build configuration.

---

## Directory Tree

```
idle_cultivation_sect/
│
├── docs/                              # Design documentation (this folder)
│   ├── README.md                      # Master design doc
│   ├── architecture.md                # Architecture deep dive
│   ├── data-models.md                 # TypeScript interfaces
│   ├── project-structure.md           # This file
│   ├── testing-strategy.md            # Testing approach
│   └── systems/                       # Subsystem specs
│       ├── cultivation.md
│       ├── combat.md
│       ├── world.md
│       ├── encounters.md
│       ├── procedural-generation.md
│       ├── flavor-engine.md
│       ├── inventory.md
│       └── save-system.md
│
├── src/                               # Source code
│   ├── main.ts                        # Entry point: bootstrap everything
│   │
│   ├── core/                          # Engine & orchestration
│   │   ├── GameEngine.ts              # Main orchestrator, tick processor
│   │   ├── GameClock.ts               # setInterval / RAF driver
│   │   ├── EventBus.ts                # Typed pub/sub
│   │   └── types.ts                   # All core types (imported everywhere)
│   │
│   ├── state/                         # State management
│   │   ├── GameState.ts               # Factory functions (createInitialState, etc.)
│   │   ├── StateManager.ts            # Immutable state update helpers
│   │   └── migrations/               # Save data migrations
│   │       ├── index.ts
│   │       ├── v1_to_v2.ts
│   │       └── v2_to_v3.ts
│   │
│   ├── systems/                       # Game logic (pure functions)
│   │   ├── CultivationSystem.ts       # Qi, breakthrough, tribulation
│   │   ├── CombatSystem.ts            # Auto-resolve, damage formulas
│   │   ├── WorldSystem.ts             # Location graph, movement validation
│   │   ├── TravelSystem.ts            # Travel progress, arrival
│   │   ├── EncounterSystem.ts         # Encounter tables, event resolution
│   │   ├── InventorySystem.ts         # Item CRUD, equip logic
│   │   ├── MerchantSystem.ts          # Buy/sell logic
│   │   ├── AchievementSystem.ts       # Achievement checks
│   │   └── FlavorEngine.ts            # Template interpolation
│   │
│   ├── generation/                    # Procedural content generation
│   │   ├── PRNG.ts                    # Seeded PRNG (mulberry32)
│   │   ├── NameGenerator.ts           # Template-based name gen
│   │   ├── WeaponGenerator.ts         # Weapon creation
│   │   ├── TechniqueGenerator.ts      # Martial arts creation
│   │   ├── BeastGenerator.ts          # Beast creation
│   │   ├── ItemGenerator.ts           # Generic item/loot creation
│   │   └── data/                      # Generation templates & pools
│   │       ├── weapon-parts.ts        # Weapon name components
│   │       ├── technique-parts.ts     # Technique name components
│   │       ├── beast-parts.ts         # Beast name components
│   │       ├── modifier-pool.ts       # Possible affixes & modifiers
│   │       └── element-affixes.ts     # Elemental prefixes & effects
│   │
│   ├── data/                          # Static game data
│   │   ├── realms.ts                  # Realm definitions & config
│   │   ├── locations.ts               # World map graph
│   │   ├── races.ts                   # Player races
│   │   ├── beasts.ts                  # Beast templates (for tier scaling)
│   │   ├── techniques.ts              # Technique archetypes
│   │   ├── items.ts                   # Base item templates
│   │   ├── encounters.ts              # Encounter table definitions
│   │   ├── flavor-templates.ts        # All flavor text templates
│   │   └── config.ts                  # GameConfig defaults
│   │
│   ├── persistence/                   # Save/Load
│   │   ├── SaveManager.ts             # localStorage read/write
│   │   ├── OfflineCatchUp.ts          # Offline simulation
│   │   └── Serializer.ts              # State ↔ JSON conversion
│   │
│   └── ui/                            # Presentation layer
│       ├── Renderer.ts                # Main UI orchestrator
│       ├── components/                # UI component modules
│       │   ├── WorldMap.ts            # Location graph visualization
│       │   ├── CultivationPanel.ts    # Cultivation status & controls
│       │   ├── CombatLog.ts           # Combat log display
│       │   ├── InventoryPanel.ts      # Inventory grid
│       │   ├── EquipmentSlots.ts      # Equipped items display
│       │   ├── StatusBar.ts           # Bottom status bar
│       │   ├── Header.ts              # Top bar (realm, name, stones)
│       │   ├── TabNav.ts              # Tab navigation
│       │   ├── NotificationToast.ts   # Popup notifications
│       │   ├── LogPanel.ts            # Full event log
│       │   └── Modal.ts               # Generic modal (catch-up, confirmations)
│       ├── styles/                    # CSS
│       │   ├── main.css               # Global styles, variables, reset
│       │   ├── tabs.css               # Tab layout
│       │   ├── world.css              # World map styles
│       │   ├── cultivation.css        # Cultivation panel styles
│       │   ├── combat.css             # Combat log styles
│       │   ├── inventory.css          # Inventory styles
│       │   ├── components.css         # Shared component styles
│       │   └── theme.css              # Color palette, typography
│       └── utils/
│           ├── dom.ts                 # DOM helpers (createElement, etc.)
│           └── format.ts              # Number/date formatting
│
├── tests/                             # Test suite
│   ├── unit/                          # Unit tests (one per module)
│   │   ├── systems/
│   │   │   ├── CultivationSystem.test.ts
│   │   │   ├── CombatSystem.test.ts
│   │   │   ├── WorldSystem.test.ts
│   │   │   ├── TravelSystem.test.ts
│   │   │   ├── EncounterSystem.test.ts
│   │   │   ├── InventorySystem.test.ts
│   │   │   └── FlavorEngine.test.ts
│   │   ├── generation/
│   │   │   ├── PRNG.test.ts
│   │   │   ├── NameGenerator.test.ts
│   │   │   ├── WeaponGenerator.test.ts
│   │   │   ├── TechniqueGenerator.test.ts
│   │   │   └── BeastGenerator.test.ts
│   │   └── persistence/
│   │       ├── SaveManager.test.ts
│   │       └── OfflineCatchUp.test.ts
│   ├── integration/                   # Cross-system tests
│   │   ├── GameLoop.test.ts           # Full tick with all systems
│   │   ├── TravelAndEncounter.test.ts
│   │   └── CultivationAndCombat.test.ts
│   ├── fixtures/                      # Test data
│   │   ├── state-fixtures.ts          # Pre-built GameState objects
│   │   ├── beast-fixtures.ts
│   │   ├── item-fixtures.ts
│   │   └── seed-fixtures.ts           # Seeds that produce specific outputs
│   └── utils/
│       └── test-helpers.ts            # createTestState(), assertStateEqual(), etc.
│
├── index.html                         # Single HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
└── .gitignore
```

---

## Module Conventions

### File Naming

| Convention | Example |
|------------|---------|
| **Systems**: PascalCase, `System` suffix | `CultivationSystem.ts` |
| **Generators**: PascalCase, `Generator` suffix | `WeaponGenerator.ts` |
| **Data files**: kebab-case | `flavor-templates.ts` |
| **Types**: Centralized in `core/types.ts` | (no per-file type files) |
| **Components**: PascalCase | `WorldMap.ts` |
| **Tests**: `*.test.ts` mirroring `src/` | `CultivationSystem.test.ts` |
| **Fixtures**: kebab-case, `-fixtures` suffix | `state-fixtures.ts` |

### Import Order (ESLint enforced)

1. External dependencies (if any)
2. Core types (`@core/types`)
3. Systems (`@systems/*`)
4. Data (`@data/*`)
5. Generation (`@generation/*`)
6. UI (`@ui/*`)
7. Relative imports (within same directory)

### Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/core/*"],
      "@systems/*": ["./src/systems/*"],
      "@generation/*": ["./src/generation/*"],
      "@data/*": ["./src/data/*"],
      "@persistence/*": ["./src/persistence/*"],
      "@ui/*": ["./src/ui/*"],
      "@state/*": ["./src/state/*"]
    }
  }
}
```

---

## Module Responsibility Matrix

| Module | Exports | Imports From | Side Effects? |
|--------|---------|--------------|---------------|
| `GameEngine.ts` | `GameEngine` class | Systems, EventBus, SaveManager | Yes (wires I/O) |
| `GameClock.ts` | `startClock`, `stopClock` | Nothing | Yes (setInterval) |
| `EventBus.ts` | `createEventBus()` | Nothing | No (pure utility) |
| `CultivationSystem.ts` | Pure functions | `core/types`, `data/realms`, `data/config` | **No** |
| `CombatSystem.ts` | Pure functions | `core/types`, `data/config` | **No** |
| `WorldSystem.ts` | Pure functions | `core/types`, `data/locations` | **No** |
| `TravelSystem.ts` | Pure functions | `core/types`, `data/config` | **No** |
| `EncounterSystem.ts` | Pure functions + encounter tables | `core/types`, `data/encounters`, `generation/*` | **No** |
| `InventorySystem.ts` | Pure functions | `core/types` | **No** |
| `FlavorEngine.ts` | Pure function | `core/types`, `data/flavor-templates` | **No** |
| `PRNG.ts` | `PRNG` class (mutable seed) | Nothing | No (self-contained) |
| `*Generator.ts` | Pure functions | `core/types`, `generation/PRNG`, `generation/data/*` | **No** |
| `SaveManager.ts` | `save`, `load`, `migrate` | `persistence/Serializer`, `state/migrations` | Yes (localStorage) |
| `Renderer.ts` | `updateUI(state)` | `ui/components/*`, `ui/utils/*` | Yes (DOM) |

**The rule**: Everything in `systems/`, `generation/`, and `data/` is **side-effect free**. Only `core/` (engine/clock), `persistence/` (storage), and `ui/` (DOM) may have side effects.

---

## TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@systems/*": ["src/systems/*"],
      "@generation/*": ["src/generation/*"],
      "@data/*": ["src/data/*"],
      "@persistence/*": ["src/persistence/*"],
      "@ui/*": ["src/ui/*"],
      "@state/*": ["src/state/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@generation': path.resolve(__dirname, 'src/generation'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@persistence': path.resolve(__dirname, 'src/persistence'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@state': path.resolve(__dirname, 'src/state'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

---

## Package.json

```jsonc
{
  "name": "idle-cultivation-sect",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/ tests/",
    "format": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  },
  "dependencies": {
    // None! Vanilla TS. Optionally: immer (for state updates)
  }
}
```

---

## Dependency Philosophy

**Goal: Zero runtime dependencies for v1.** 

The game logic is pure TypeScript. DOM manipulation uses vanilla APIs. CSS is hand-written. No React, no lodash, no jQuery.

**Allowed dev dependencies**: TypeScript, Vite, Vitest, ESLint, Prettier.

**Possible future additions**:
- `immer` — If immutable state updates become too verbose
- `zod` — If we add runtime validation of save data
- `idb` — If we outgrow localStorage and want IndexedDB

---

## Index.html (Template)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#1a1a2e" />
  <title>Idle Cultivation Sect</title>
  <link rel="stylesheet" href="/src/ui/styles/main.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

---

## Entry Point (main.ts)

```typescript
// src/main.ts
import { GameEngine } from '@core/GameEngine';
import { EventBus, createEventBus } from '@core/EventBus';
import { Renderer } from '@ui/Renderer';
import { SaveManager } from '@persistence/SaveManager';
import { createInitialState } from '@state/GameState';
import { OfflineCatchUp } from '@persistence/OfflineCatchUp';
import { defaultConfig } from '@data/config';

function bootstrap(): void {
  // 1. Create event bus (typed pub/sub)
  const bus = createEventBus();

  // 2. Load or create state
  const saveManager = new SaveManager();
  let state = saveManager.load() ?? createInitialState(defaultConfig);

  // 3. Run offline catch-up if needed
  const catchUpResult = OfflineCatchUp.compute(state, saveManager.getLastSaveTime());
  if (catchUpResult.ticksSimulated > 0) {
    state = catchUpResult.newState;
    // Show catch-up summary modal
  }

  // 4. Create renderer (reads state, writes DOM)
  const renderer = new Renderer(document.getElementById('app')!, bus);

  // 5. Create engine (orchestrates everything)
  const engine = new GameEngine(state, bus, saveManager, defaultConfig);

  // 6. Wire renderer to engine state changes
  bus.on('state:changed', ({ state }) => renderer.update(state));

  // 7. Start the clock
  engine.start();

  // 8. Initial render
  renderer.update(engine.getState());

  // 9. Handle page visibility (pause/resume)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) engine.pause();
    else engine.resume();
  });
}

bootstrap();
```

---

*See also: [Architecture](./architecture.md), [Testing Strategy](./testing-strategy.md)*
