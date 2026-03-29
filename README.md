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

---

## Research Foundations

Every tunable constant in the simulation is calibrated against published software engineering research. This section documents each source, what we took from it, and how it maps to simulation logic.

### Sources

#### 1. Capers Jones — Software Defect Economics

**Key works:**
- *Applied Software Measurement: Global Analysis of Productivity and Quality* (3rd ed., McGraw-Hill, 2008) — based on 12,000+ projects from 24 countries
- *The Economics of Software Quality* (with Olivier Bonsignour, Addison-Wesley, 2011)
- *Software Engineering Best Practices* (McGraw-Hill, 2010)
- *Software Development Patterns and Antipatterns* (CRC Press, 2021)

**Methodology:** Jones founded Software Productivity Research (SPR) in 1984 and collected data continuously from 1978 (starting at IBM). Data gathered primarily through on-site interviews with project teams using proprietary questionnaires. The database is large (12,000+ projects) but proprietary, making independent verification difficult.

**What we use:**
| Claim | Value | Constant |
|---|---|---|
| Delivered defect rate (commercial software) | 0.5 defects per function point | `BUGS_PER_FEATURE = 0.5` |
| Bug-fix regression rate (U.S. average) | ~7% of fixes introduce new defects | `BUG_FIX_REGRESSION_RATE = 0.07` |

**Important nuance on the 0.5 figure:** Jones's total *defect potential* (bugs introduced across all phases) is actually ~5.0 per FP (requirements: 1.0, design: 1.25, code: 1.75, docs: 0.6, bad fixes: 0.4). The 0.5 figure is the *delivered defect* rate — what escapes to production after ~85–90% defect removal efficiency. This varies by software type:
- Commercial software: **0.5** per FP (our chosen value)
- System software: 0.4 per FP
- Military software: 0.3 per FP
- Information systems: 1.2 per FP
- U.S. average across 68 industries: 0.46 per FP
- Best-in-class (96%+ DRE): 0.13 per FP

We chose the commercial software value (0.5) as representative of the SaaS/product organizations the sim models.

**Important nuance on the 7% figure:** The U.S. average is ~7%, but the range is dramatic — from a fraction of 1% (top engineers, low-complexity code) to 25% (novices on high-cyclomatic-complexity, error-prone modules). The rate is inversely proportional to developer experience and code quality. The concept originated at IBM circa 1965.

**How it maps to the sim:** When workers ship features, each feature has a probabilistic defect injection. Bug events trigger entropy spikes (`+5 to +15` burst). The regression rate means that even remediation work adds entropy, modeling the real-world "fix one, break one" dynamic that accelerates in later phases. In the sim's later phases, this compounds: high-entropy nodes are analogous to the high-complexity modules where Jones found regression rates approaching 25%.

---

#### 2. Besker, Martini & Bosch (2019) — Technical Debt Productivity Loss

**Full citation:** Besker, T., Martini, A., & Bosch, J. (2019). "Software Developer Productivity Loss Due to Technical Debt — A Replication and Extension Study Examining Developers' Development Work." *Journal of Systems and Software*, 156, 41–61. DOI: [10.1016/j.jss.2019.06.004](https://doi.org/10.1016/j.jss.2019.06.004)

**Original conference paper:** Besker, T., Martini, A., & Bosch, J. (2018). "Technical Debt Cripples Software Developer Productivity." *Proceedings of TechDebt 2018* (co-located with ICSE). ACM.

**What we use:**
| Claim | Value | Constant |
|---|---|---|
| Developer productivity lost to tech debt | 23% | `TECH_DEBT_PRODUCTIVITY_LOSS = 0.23` |

**Methodology:** Longitudinal study — 43 industrial software developers reported twice weekly for 7 weeks how much time they wasted due to technical debt. Supplemented by qualitative interviews with 16 practitioners. The 2019 journal paper replicated the finding with an independent dataset. Authors from Chalmers University of Technology and University of Oslo.

**Key additional findings from this study:**
- Most wasted time goes to understanding and measuring TD, not fixing it
- Complex/architectural TD generates the worst productivity effects
- Developers are frequently forced to *introduce new TD* because of existing TD (compounding)
- The extended study found up to 36% waste in some measurements

**How it maps to the sim:** The 23% loss is the basis for why feature delivery slows in later phases. As entropy accumulates, the `featureProb` in `PHASE_CONFIG` drops from 0.12 (Growth) to 0.015 (Entropy Crisis) — an 87.5% reduction in shipping probability, modeling how TD compounds beyond the baseline 23%.

---

#### 3. Gartner — Software Lifecycle Maintenance Burden

**Source:** Gartner lifecycle research (analyst reports, paywalled). Related Gartner publications include "Application Software: Maintenance and Support Guidelines" and "Estimating the Future Cost of Application Maintenance." The broader finding that maintenance constitutes 60–80% of total lifecycle costs traces to Boehm (1981) and has been reaffirmed by Gartner's ongoing research.

**What we use:**
| Claim | Value | Constants |
|---|---|---|
| Early-lifecycle maintenance burden | ~15% | `MAINTENANCE_BURDEN_EARLY = 0.15` |
| Mid-lifecycle maintenance burden | ~25% | `MAINTENANCE_BURDEN_MID = 0.25` |
| Late-lifecycle maintenance burden | ~35% | `MAINTENANCE_BURDEN_LATE = 0.35` |

**Context:** The specific 15% → 25% → 35% progression is a synthesis of Gartner's phased lifecycle cost models:
- Early phase (years 1–2): 10–25% of costs
- Mid-life phase (years 3–5): 15–30% of costs
- Mature phase (years 6+): 20–40% of costs

**How it maps to the sim:** These values directly inform the phase-based entropy multipliers. The `entropyMult` in `PHASE_CONFIG` scales from 1.0x (Growth) to 5.0x (Entropy Crisis), modeling the nonlinear cost escalation Gartner describes. The `calcBurden()` function converts the entropy/value ratio to a percentage that tracks this lifecycle curve.

---

#### 4. ArXiv 2504.18511 — Co-Change Entropy and Defect Correlation

**Full citation:** Hrishikesh, E., Kumar, A., Bhardwaj, M., & Agarwal, S. (2025). "Co-Change Graph Entropy: A New Process Metric for Defect Prediction." arXiv:2504.18511. [arxiv.org/abs/2504.18511](https://arxiv.org/abs/2504.18511)

**What we use:**
| Claim | Value | Constant |
|---|---|---|
| Pearson correlation between entropy and defects | up to 0.54 | `ENTROPY_DEFECT_CORRELATION = 0.54` |

**Methodology:**
- **Entropy definition:** Shannon entropy applied to a co-change graph. Files are nodes; edges connect files modified in the same commit. Entropy measures how dispersed changes are across the dependency network.
- **Dataset:** SmartSHARK — 8 Apache projects (Derby, ActiveMQ, PDFBox, Pig, Kafka, Maven, Struts, NiFi), each with 2,000+ defects and 5,000+ commits.
- **Classifiers:** Logistic Regression, SVM, XGBoost, Random Forest, Gradient Boosting (scikit-learn). Class imbalance handled with SMOTE.
- **Key result:** Combining co-change entropy with traditional change entropy improved defect prediction AUROC in 82.5% of configurations.

**Important nuance:** The 0.54 is the peak Pearson *r* for their novel co-change graph entropy metric. Traditional change entropy (Hassan, 2009) achieved even higher correlation (r = 0.779 on Derby). We use 0.54 as a conservative baseline.

**How it maps to the sim:** This is the core theoretical justification for the entropy model. The simulation's `O(n * f * c)` formula — where coupling (`c`, the edges) multiplies with component count and feature density — directly mirrors the co-change graph entropy concept: more coupling = more dispersed changes = higher entropy = more defects.

---

#### 5. DORA / Accelerate — DevOps Performance Metrics

**Key sources:**
- Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps*. IT Revolution Press. Research covers 23,000+ respondents from 2,000+ organizations (2014–2017).
- "2019 Accelerate State of DevOps Report." DORA/Google Cloud. [dora.dev](https://dora.dev/research/2019/dora-report/)
- "2024 DORA Report." Google Cloud. [dora.dev](https://dora.dev)

**What we use:**
| Claim | Value | Constants |
|---|---|---|
| Elite change failure rate | ~5% | `CHANGE_FAILURE_RATE_ELITE = 0.05` |
| Low-performer change failure rate | ~50% | `CHANGE_FAILURE_RATE_LOW = 0.50` |

**The four DORA metrics:** Deployment Frequency, Lead Time for Changes, Change Failure Rate, Failed Deployment Recovery Time.

**Performance tiers (2019 benchmarks):**
| Tier | Change Failure Rate |
|---|---|
| Elite | 0–15% |
| High | 16–30% |
| Medium | 31–45% |
| Low | 46–60% |

The 2024 report tightened elite to ~5% and showed low performers at 64%. Our constants use the 2024 elite threshold (5%) paired with the 2019 low-performer midpoint (50%).

**How it maps to the sim:** The 10x gap between elite (5%) and low (50%) failure rates models the phase transitions. In the Growth phase, features ship cleanly (low failure). By Entropy Crisis, the change failure rate has effectively climbed toward the low-performer tier — every change risks a bug event, entropy spike, or cascading issue.

---

#### 6. Stripe — Developer Coefficient (2018)

**Full citation:** Stripe, "The Developer Coefficient." September 2018. [stripe.com/reports/developer-coefficient-2018](https://stripe.com/reports/developer-coefficient-2018)

**Methodology:** Commissioned Harris Poll survey of 1,000+ developers and 1,000+ C-level executives across the US, UK, France, Germany, and Singapore (30+ industries).

**What we use:**
| Claim | Value | Constant |
|---|---|---|
| Developer time spent on tech debt | 42% | `TIME_ON_TECH_DEBT = 0.42` |

**The actual breakdown:** Developers reported 13.5 hours/week on technical debt + 3.8 hours/week on bad code = ~17.3 hours/week out of a 40-hour week. Stripe estimated this as $85B/year in global opportunity cost.

**How it maps to the sim:** The 42% figure validates the late-phase behavior where the maintenance burden approaches and exceeds 40%. When `calcBurden()` returns values above 40%, the simulation is reproducing what Stripe's survey found in real organizations. The build/maintain slider lets users directly allocate this split.

---

#### 7. Hatton, Spinellis & van Genuchten (2017) — Codebase Growth Rate

**Full citation:** Hatton, L., Spinellis, D., & van Genuchten, M. (2017). "The long-term growth rate of evolving software: Empirical results and implications." *Journal of Software: Evolution and Process*, 29(5), e1847. DOI: [10.1002/smr.1847](https://onlinelibrary.wiley.com/doi/abs/10.1002/smr.1847)

**Note:** This was previously attributed to "Herraiz et al." in the UI references panel. The correct source is Hatton et al.

**What we use:**
| Claim | Value |
|---|---|
| Codebases double every ~42 months | Median compound annual growth rate of 1.21 |

**Methodology:** Analyzed 404+ million lines of code across open-source and closed-source systems.

**How it maps to the sim:** The node spawn rate (`nodeSpawnProb = 0.0015 * (1 + simYear * 0.3)`) accelerates over time, modeling codebase growth. Over the 5-year simulation horizon, the system grows from 3 components to up to 40 — roughly a 13x increase in component count, which (combined with feature accumulation per node) approximates the compounding growth Hatton et al. observed.

---

#### 8. Shah, Morisio & Torchiano (2012) — Defect Density Across OSS Projects

**Full citation:** Shah, S. M. A., Morisio, M., & Torchiano, M. (2012). "An Overview of Software Defect Density: A Scoping Study." *Proceedings of the 19th Asia-Pacific Software Engineering Conference (APSEC)*, vol. 1, pp. 406–415. IEEE. DOI: [10.1109/APSEC.2012.93](https://ieeexplore.ieee.org/document/6462687/)

**What we use:**
| Claim | Value | Constant |
|---|---|---|
| Mean post-release defect density | 7.47 defects/KLOC | `DEFECT_DENSITY_MEAN = 7.47` |

**Methodology:** Scoping study aggregating 19 published papers covering 109 software projects (open and closed source). Median was 4.3 defects/KLOC with standard deviation of 7.99 — indicating enormous variance across projects.

**How it maps to the sim:** The high mean with high variance models why some nodes go critical (red) while others stay healthy (green) even at the same age. The simulation's per-node entropy accumulation has stochastic elements (random bug events, variable feature entropy) that produce this observed spread.

---

### Datasets

#### SmartSHARK

**Maintained by:** TU Clausthal (AI Engineering group) and Georg-August-University Gottingen (SE for Distributed Systems group). Key researchers: Alexander Trautsch, Fabian Trautsch, Steffen Herbold.

**Key paper:** Trautsch, A., Trautsch, F., & Herbold, S. (2021). "MSR Mining Challenge: The SmartSHARK Repository Mining Data." arXiv:2102.11540. [arxiv.org/abs/2102.11540](https://arxiv.org/abs/2102.11540)

**Contents:** Version control history, software metrics, PMD warnings, refactorings, change types, bug-fix labels, bug-inducing changes, JIRA/GitHub issue tracking, mailing lists, Travis CI data, pull requests, and code reviews. Release 1.0 covers 38 Apache projects; release 2.2 covers 107 projects.

**Role in our sim:** Primary validation dataset for the ArXiv entropy-defect correlation study (source 4). The sim's entropy model is grounded in patterns observed across these Apache projects.

#### Public JIRA Dataset

**Full citation:** Montgomery, L., Lueders, C., & Maalej, W. (2022). "An Alternative Issue Tracking Dataset of Public Jira Repositories." *Proceedings of MSR 2022*, Data and Tool Showcase Track. DOI: [10.1145/3524842.3528486](https://dl.acm.org/doi/10.1145/3524842.3528486). Also: arXiv:2201.08368.

**Contents:** 16 public JIRA repositories, 1,822 projects, 2.7 million issues, 32 million changes, 9 million comments, 1 million issue links. Available on Zenodo: DOI [10.5281/zenodo.5901804](https://zenodo.org/records/5901804).

**Role in our sim:** Provides the scale evidence that defect patterns observed in SmartSHARK generalize across thousands of real projects. The sheer volume (2.7M issues) validates that entropy-driven defect accumulation is not an artifact of small samples.

---

## Research-to-Simulation Mapping

This section traces how each research finding feeds into specific simulation mechanics.

### The Core Entropy Formula: `O(n * f * c)`

The simulation's entropy model multiplies three factors:

| Factor | Symbol | Sim variable | Research basis |
|---|---|---|---|
| Component count | `n` | `nodes.length` | Hatton et al. — codebases grow exponentially |
| Features per component | `f` | `node.features` | Jones — each feature injects ~0.5 bugs |
| Coupling factor | `c` | `node.connections * couplingEntropyMult` | ArXiv 2504.18511 — co-change graph entropy correlates with defects at r=0.54 |

This is implemented in `useSimulation.ts` line 158:
```ts
const couplingFactor = 1 + n.connections * config.couplingEntropyMult * 0.1;
const entropyGrowth = config.entropyRateBase * n.features * couplingFactor * (1 + s.phase * 0.3);
```

### Phase Behavior Calibration

| Phase | Feature prob | Entropy mult | Value mult | Research justification |
|---|---|---|---|---|
| GROWTH | 0.12 | 1.0x | 1.0x | DORA elite: <5% failure, high throughput |
| INFLECTION | 0.07 | 1.8x | 0.65x | Besker: 23% productivity loss emerging |
| TECH DEBT | 0.03 | 3.0x | 0.35x | Stripe: 42% of time on debt; Gartner: 25–35% maintenance |
| ENTROPY CRISIS | 0.015 | 5.0x | 0.12x | DORA low: 46–60% failure; Gartner: 35%+ maintenance |

### Key Mechanics and Their Research Roots

| Simulation mechanic | Code location | Research source | Empirical value |
|---|---|---|---|
| Feature ships inject entropy | `useSimulation.ts:107–109` | Capers Jones | 0.5 bugs/feature |
| Bug events cause entropy spikes | `useSimulation.ts:162–168` | Shah et al. (IEEE) | 7.47 defects/KLOC mean |
| Entropy correlates with coupling | `useSimulation.ts:157–158` | ArXiv 2504.18511 | r = 0.54 |
| Maintenance burden grows over lifecycle | `PHASE_CONFIG` | Gartner | 15% → 35% |
| Feature velocity degrades with debt | `PHASE_CONFIG.featureProb` | Besker et al. | 23% productivity loss |
| Late-phase time consumed by debt | `calcBurden()` | Stripe | 42% of dev time |
| Component count grows over time | `nodeSpawnProb` | Hatton et al. | Doubling every 42 months |
| Elite vs low performer divergence | `CHANGE_FAILURE_RATE_*` | DORA/Accelerate | 5% vs 50% |

### What the Sim Emphasizes

The simulation deliberately amplifies certain dynamics to make them visible in a 3-minute run:

1. **Coupling as a multiplier, not an additive.** The ArXiv co-change entropy research shows that coupling doesn't just add cost — it multiplies it. Every new edge in the graph increases entropy growth for *all* connected nodes. This is the mechanism that makes entropy `O(n * f * c)` rather than `O(n + f + c)`.

2. **The compounding trap.** Besker et al. found that existing TD forces developers to introduce *new* TD. The simulation models this: as phase advances, `entropyPerFeature` increases (`entropyMult` scales from 1.0x to 5.0x), meaning each new feature in a high-entropy system generates proportionally more debt than the same feature would have in a clean system.

3. **The crossover point.** The simulation is designed to always reach a point where entropy exceeds value — the ROI inversion. This reflects the convergent finding across Gartner (maintenance exceeds development), Stripe (42% on debt), and DORA (low performers have 10x the failure rate of elite) that unmanaged entropy inevitably wins.

4. **Maintenance as a lever, not a cure.** The build/maintain slider lets users allocate effort to debt reduction, but `MAINTENANCE_ENTROPY_REDUCTION = 0.3` is tuned so that even 100% maintenance allocation only *slows* entropy growth — it cannot eliminate it. This models the real-world finding (Besker et al.) that most maintenance time goes to *understanding* debt, not eliminating it.
