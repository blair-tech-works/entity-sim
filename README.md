# ⬡ Entropy — Software Complexity Simulation

A real-time interactive simulation showing how software entropy compounds over time as teams add features, hire engineers, and grow codebases — until maintenance costs exceed value delivered.

Built with Next.js 15 (App Router), TypeScript, and Canvas2D.

---

## Concept

The simulation models a software organization across a **simulated 5-year horizon** (runs in ~3 minutes real time). It demonstrates:

- **Value** grows as engineers ship features
- **Entropy** grows faster than value — proportional to node count × feature count × coupling
- **ROI** peaks early and degrades as the maintenance burden consumes more engineering capacity
- **Phase transitions** mark inflection points: Growth → Inflection → Tech Debt → Entropy Crisis

The entropy model is `O(n · f · c)` where:
- `n` = number of components (nodes)
- `f` = features per component
- `c` = coupling factor (number of edges)

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and press **▶ RUN SIMULATION**.

---

## Project Structure

```
app/
├── page.tsx                          # Main simulation page
├── layout.tsx                        # HTML shell + font imports
├── types/
│   └── simulation.ts                 # All TypeScript interfaces
├── lib/
│   ├── constants.ts                  # Config, name lists, phase thresholds
│   └── engine.ts                     # Pure simulation functions (no React)
├── hooks/
│   └── useSimulation.ts              # State machine, tick loop, metrics
└── components/simulation/
    ├── GraphCanvas.tsx               # Canvas2D node graph (RAF loop)
    ├── MetricsPanel.tsx              # Live metrics sidebar
    ├── MiniChart.tsx                 # Reusable line chart
    ├── EventLog.tsx                  # Event log panel
    └── PhaseBanner.tsx               # Phase transition overlay
```

---

## Architecture Notes

### Simulation Engine (`app/lib/engine.ts`)
Pure functions, no React dependencies. Independently unit-testable.

Key exports:
- `buildInitialState(w, h, config)` — creates initial nodes/edges/workers
- `applyPhysics(nodes, edges, w, h)` — force-directed layout
- `spawnNode(nodes, edges, nextId, w, h)` — spawns component with edges
- `nodeColor(node)` — hex color from entropy/value ratio
- `calcROI(value, cost)`, `calcBurden(entropy, value)`

### Simulation Hook (`app/hooks/useSimulation.ts`)
Owns mutable sim state via `useRef<SimState>`. React state updates only for:
- `metrics` (every tick) — drives MetricsPanel
- `history` (every 20 ticks) — drives MiniCharts
- `logs` (on events) — drives EventLog
- `status` (start/pause/complete)

This keeps React re-renders minimal while the canvas runs at 60fps independently.

### Canvas Renderer (`app/components/simulation/GraphCanvas.tsx`)
- `forwardRef` + `useImperativeHandle` exposes `getSize()` to parent
- Own RAF loop reads from `getState()` ref each frame
- Completely decoupled from React render cycles

### MiniChart (`app/components/simulation/MiniChart.tsx`)
Accepts `datasets: { data: number[], color: string }[]`. Supports:
- Multi-line with fill
- Breakeven dashed line at y=1 (`showBreakevenLine`)
- Crossover marker between datasets (`crossoverLabel`)
- Warning horizontal line (`warningLineY`)

---

## Configuration (`app/lib/constants.ts`)

```ts
export const DEFAULT_CONFIG: SimConfig = {
  simRealDuration: 180,    // seconds real time
  simYears: 5,             // simulated years
  tickMs: 50,              // ms per tick
  initialWorkers: 4,
  maxWorkers: 18,
  initialNodes: 3,
  maxNodes: 40,
  entropyRateBase: 0.002,
  valuePerFeature: 8,
  entropyPerFeature: 3.5,
  couplingEntropyMult: 0.6,
};
```

Phase boundaries: `PHASE_THRESHOLDS = [1.2, 2.5, 4.0]` (simYear).

---

## Simulation Phases

| Phase | Name            | SimYear | Description                                          |
|-------|-----------------|---------|------------------------------------------------------|
| 0     | GROWTH          | 0–1.2   | Healthy productivity, entropy accumulates slowly     |
| 1     | INFLECTION      | 1.2–2.5 | Growth slows, entropy begins compounding             |
| 2     | TECH DEBT       | 2.5–4.0 | Maintenance >40% capacity, features slow             |
| 3     | ENTROPY CRISIS  | 4.0–5.0 | ROI inverted, system approaching collapse            |

---

## Node Color Encoding

| Color  | Ratio (entropy/value) | Meaning                        |
|--------|----------------------|--------------------------------|
| Blue   | < 0.3                | New / recently created         |
| Green  | 0.3–0.6              | Healthy                        |
| Yellow | 0.6–1.0              | Moderate technical debt        |
| Orange | 1.0–1.8              | High entropy                   |
| Red    | > 1.8                | Critical                       |

Node radius scales with `sqrt(features)`. Feature count shown inside node. Bug count shows as `⚠N` badge. Workers are small yellow dots, brightening when actively shipping.

---

## Data Flow

```
useSimulation
  └─ setInterval(tickMs)
       └─ tick()
            ├─ worker actions (ship features, migrate)
            ├─ node entropy decay + bug events
            ├─ spawn nodes / workers
            ├─ applyPhysics() [engine.ts]
            ├─ mutate stateRef (no re-render)
            └─ setMetrics / setHistory / setLogs → React re-render

GraphCanvas
  └─ requestAnimationFrame loop
       └─ getState() → reads stateRef → Canvas2D draw

page.tsx
  └─ MetricsPanel, MiniChart×3, EventLog, PhaseBanner
       all from React state in useSimulation
```

---

## Suggested Next Features

### New Simulations
- Microservices entropy — cascading failure probability across service calls
- Org chart entropy — Brooks's Law communication overhead model
- Infrastructure entropy — server configs, drift, and config debt

### Controls & Interactivity
- Speed slider (1x / 2x / 5x / 10x real time)
- Config panel to tune entropy rates live
- Click node to inspect full stats (features, age, issues, connections)
- "Refactor" action — pay cost to reduce a node's entropy
- "Hire engineers" / "Tech debt sprint" buttons mid-simulation

### Visualization
- Heatmap overlay (entropy density)
- Manual node dragging (force-directed vs free)
- Node clustering by domain (auth, data, infra, etc.)
- Simulation replay from exported JSON

### Data & Export
- CSV export of `history` arrays
- End-of-sim summary report card
- Side-by-side config comparison mode

### Architecture
- Move tick loop to a Web Worker (off main thread)
- URL param persistence for config
- Preset scenarios (startup vs enterprise, greenfield vs legacy)

---

## Tech Stack

- **Next.js 15** — App Router, `'use client'` at component level
- **TypeScript** — strict mode
- **Canvas2D** — no rendering libraries
- **Tailwind CSS** — available but minimal use (inline styles for dynamic values)

No simulation-specific dependencies. Everything runs in the browser.
