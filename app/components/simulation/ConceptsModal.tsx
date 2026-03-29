'use client';

import { useEffect } from 'react';
import {
  PHASE_CONFIG, PHASE_LABELS,
  MAINTENANCE_ENTROPY_REDUCTION, BUGS_PER_FEATURE, BUG_FIX_REGRESSION_RATE,
  TECH_DEBT_PRODUCTIVITY_LOSS,
  MAINTENANCE_BURDEN_EARLY, MAINTENANCE_BURDEN_MID, MAINTENANCE_BURDEN_LATE,
} from '../../lib/constants';

interface ConceptsModalProps {
  open: boolean;
  onClose: () => void;
  currentPhase: number;
}

const PHASE_COLORS = ['#3cff8a', '#e8ff3c', '#ff8c3c', '#ff3c3c'];
const PHASE_YEARS  = ['0 – 1.2 yr', '1.2 – 2.5 yr', '2.5 – 4.0 yr', '4.0 – 5.0 yr'];
const PHASE_DESCS  = [
  `90%+ capacity on features; entropy effects minimal; worker action rate ~${((PHASE_CONFIG[0].featureProb / 10) * 0.7 * 100).toFixed(1)}%/tick`,
  `Velocity declining; bugs accumulate faster; entropy ${PHASE_CONFIG[1].entropyMult}× baseline`,
  `${(TECH_DEBT_PRODUCTIVITY_LOSS * 100).toFixed(0)}% productivity loss; entropy ${PHASE_CONFIG[2].entropyMult}× baseline; workers act 3× slower`,
  `Velocity collapse; entropy ${PHASE_CONFIG[3].entropyMult}× baseline; workers act at 15% of growth-phase rate`,
];

export default function ConceptsModal({ open, onClose, currentPhase }: ConceptsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Space Mono', 'Courier New', monospace",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1117',
          border: '1px solid #1e2530',
          maxWidth: 660,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '24px 28px',
          position: 'relative',
          color: '#c9d1d9',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e8ff3c' }}>
            ⬡ CONCEPTS &amp; FORMULAS
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
          >
            ✕
          </button>
        </div>

        {/* ── SECTION: The 4 Phases ── */}
        <Section title="THE 4 PHASES">
          <PhaseTimeline currentPhase={currentPhase} />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PHASE_LABELS.map((label, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: currentPhase === i ? 1 : 0.55, transition: 'opacity 0.2s' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PHASE_COLORS[i], flexShrink: 0, marginTop: 3 }} />
                <div>
                  <span style={{ color: PHASE_COLORS[i], fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>{label}</span>
                  <span style={{ color: '#4a5568', fontSize: 10 }}> · {PHASE_YEARS[i]}</span>
                  {currentPhase === i && <span style={{ color: '#e8ff3c', fontSize: 9, marginLeft: 6 }}>← YOU ARE HERE</span>}
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{PHASE_DESCS[i]}</div>
                  <div style={{ fontSize: 9, color: '#374151', marginTop: 2, letterSpacing: '0.04em' }}>
                    featureProb={PHASE_CONFIG[i].featureProb}
                    {' · '}entropyMult={PHASE_CONFIG[i].entropyMult}×
                    {' · '}valueMult={PHASE_CONFIG[i].valueMult}×
                    {PHASE_CONFIG[i].productivityLoss > 0 && ` · −${(PHASE_CONFIG[i].productivityLoss * 100).toFixed(0)}% productivity`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION: Entropy Growth Formula ── */}
        <Section title="ENTROPY GROWTH (per tick, per component)">
          <div style={{ background: '#111827', border: '1px solid #1e2530', padding: '10px 14px', marginBottom: 10, fontSize: 12, lineHeight: 1.8, letterSpacing: '0.02em' }}>
            ΔEntropy ={' '}
            <Var c="#ff8c3c">base</Var> × <Var c="#3cb8ff">features</Var> × <Var c="#c084fc">coupling</Var> × <Var c="#e8ff3c">phaseMult</Var> × <Var c="#ff6b6b">deficitMult</Var>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <tbody>
              <ParamRow name="base" color="#ff8c3c" value="0.002" desc="baseline entropy rate per feature per tick — always running, cannot be stopped" />
              <ParamRow name="features" color="#3cb8ff" value="n.features" desc="features shipped to this component; grows with each build action" />
              <ParamRow name="coupling" color="#c084fc" value="1 + connections × 0.06" desc="inter-component coupling amplifier — connected components amplify each other's entropy" />
              <ParamRow name="phaseMult" color="#e8ff3c" value="1× → 1.5× → 2.5× → 4×" desc="per-phase multiplier; in crisis, each feature generates 4× more entropy than at launch" />
              <ParamRow name="deficitMult" color="#ff6b6b" value="1 + max(0, naturalRatio − yours) × 2" desc={`penalty when your maintenance % is below the phase's natural rate (${(MAINTENANCE_BURDEN_EARLY*100).toFixed(0)}% / ${(MAINTENANCE_BURDEN_MID*100).toFixed(0)}% / ${(MAINTENANCE_BURDEN_LATE*100).toFixed(0)}%)`} />
            </tbody>
          </table>
          <Note>Entropy growth runs every tick and scales with both the number of features and phase. It is not gated by worker activity — it never pauses.</Note>
        </Section>

        {/* ── SECTION: Build vs Maintain ── */}
        <Section title="BUILD vs MAINTAIN — TIMING IS EVERYTHING">
          <TimingChart currentPhase={currentPhase} />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InfoRow label="BUILD action" value={`+1 feature, +value, +${BUGS_PER_FEATURE*100}% chance of bug (+3–8 entropy)`} color="#3cb8ff" />
            <InfoRow label="MAINTAIN action" value={`entropy −${MAINTENANCE_ENTROPY_REDUCTION}×features; ${(BUG_FIX_REGRESSION_RATE*100).toFixed(0)}% regression risk`} color="#3cff8a" />
            <InfoRow label="Worker gate" value="Both actions are gated by featureProb — workers rarely act in later phases" color="#ff8c3c" />
            <InfoRow label="Background growth" value="Runs continuously every tick regardless of workers or slider position" color="#ff3c3c" />
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { phase: 'GROWTH',       color: '#3cff8a', verdict: '✓ Highly effective',  reason: 'Low phaseMult, high worker rate — early maintenance compoundingly prevents debt' },
              { phase: 'INFLECTION',   color: '#e8ff3c', verdict: '⚠ Still effective',   reason: 'Can slow the curve; recommend ≥25% before this phase ends' },
              { phase: 'TECH DEBT',    color: '#ff8c3c', verdict: '△ Marginal',           reason: '23% productivity loss + 2.5× entropy mult; maintenance buys time, not recovery' },
              { phase: 'CRISIS',       color: '#ff3c3c', verdict: '✗ Too late',           reason: '4× entropy mult, workers 85% slower — entropy outpaces maintenance by ~25×' },
            ] as const).map(({ phase, color, verdict, reason }) => (
              <div key={phase} style={{ background: '#111827', border: `1px solid ${color}30`, padding: '8px 10px' }}>
                <div style={{ color, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>{phase}</div>
                <div style={{ color: '#c9d1d9', fontSize: 10, marginTop: 3 }}>{verdict}</div>
                <div style={{ color: '#4a5568', fontSize: 9, marginTop: 3, lineHeight: 1.5 }}>{reason}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION: Maintenance Efficiency Formula ── */}
        <Section title="IS YOUR MAINTENANCE KEEPING UP?">
          <div style={{ background: '#111827', border: '1px solid #1e2530', padding: '10px 14px', marginBottom: 10, fontSize: 11, lineHeight: 1.8 }}>
            Effective if:{' '}
            <Var c="#3cff8a">maintenanceRate</Var>
            <span style={{ color: '#4a5568' }}> {'>'} </span>
            <Var c="#ff8c3c">entropyGrowthRate</Var>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <tbody>
              <ParamRow name="maintenanceRate" color="#3cff8a" value="slider% × actionRate × 0.3 × avgFeatures" desc="entropy removed per tick; actionRate collapses in late phases due to tech debt slowdown" />
              <ParamRow name="entropyGrowthRate" color="#ff8c3c" value="0.002 × totalFeatures × coupling × phaseMult" desc="entropy added per tick across all components — grows super-linearly with codebase size" />
            </tbody>
          </table>
          <Note>The ENTROPY TREND indicator (next to the slider) shows the live balance between these two rates. DECLINING means maintenance is winning; ACCELERATING means entropy is dominating.</Note>
        </Section>

        {/* ── SECTION: ROI & Burden ── */}
        <Section title="KEY METRICS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            <div style={{ background: '#111827', border: '1px solid #1e2530', padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: '#4a5568', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>ROI</div>
              <div style={{ fontSize: 11, color: '#3cb8ff', marginBottom: 4 }}>totalValue / totalCost</div>
              <div style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.5 }}>
                Breakeven at 1.0×. Entropy raises cost via the Burden penalty each tick.
              </div>
            </div>
            <div style={{ background: '#111827', border: '1px solid #1e2530', padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: '#4a5568', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>BURDEN</div>
              <div style={{ fontSize: 11, color: '#ff8c3c', marginBottom: 4 }}>totalEntropy / totalValue × 100%</div>
              <div style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.5 }}>
                Fraction of delivered value consumed by entropy. Drives ROI decay.
              </div>
            </div>
          </div>
          <BurdenScale />
        </Section>

        {/* ── SECTION: References ── */}
        <Section title="RESEARCH REFERENCES" last>
          {([
            { label: 'Bug/feature rate',         cite: 'Capers Jones',                         detail: `${BUGS_PER_FEATURE} bugs per function point; ${(BUG_FIX_REGRESSION_RATE*100).toFixed(0)}% of bug fixes introduce a regression` },
            { label: 'Productivity loss',         cite: 'Besker et al., 2019 — Chalmers Univ.', detail: `${(TECH_DEBT_PRODUCTIVITY_LOSS*100).toFixed(0)}% of engineering capacity lost to tech debt on average` },
            { label: 'Maintenance growth',        cite: 'Gartner lifecycle research',           detail: `Grows from ${(MAINTENANCE_BURDEN_EARLY*100).toFixed(0)}% to ${(MAINTENANCE_BURDEN_LATE*100).toFixed(0)}% of capacity over product lifecycle` },
            { label: 'Codebase growth rate',      cite: 'Herraiz et al.',                       detail: 'Evolving software doubles in size every ~42 months' },
            { label: 'Defect density',            cite: 'IEEE (109 OSS projects)',              detail: '7.47 defects/KLOC mean, 4.3 median across studied projects' },
            { label: 'Entropy–defect correlation',cite: 'ArXiv 2504.18511',                    detail: 'Pearson r = 0.54 between code entropy metrics and defect count' },
            { label: 'Delivery performance',      cite: 'DORA / Accelerate',                   detail: 'Elite teams: <5% change failure rate; Low performers: 46–60%' },
            { label: 'Tech debt time tax',        cite: 'Stripe Developer Coefficient 2018',   detail: '42% of developer time spent managing technical debt' },
          ] as const).map(({ label, cite, detail }) => (
            <div key={label} style={{ padding: '7px 0', borderBottom: '1px solid #1e2530' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: '#c9d1d9', fontSize: 10, fontWeight: 700 }}>{label}</span>
                <span style={{ color: '#4a5568', fontSize: 9 }}>— {cite}</span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 9, marginTop: 2, lineHeight: 1.5 }}>{detail}</div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 28 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#4a5568', borderBottom: '1px solid #1e2530', paddingBottom: 6, marginBottom: 12,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Var({ c, children }: { c: string; children: React.ReactNode }) {
  return <span style={{ color: c, fontWeight: 700 }}>{children}</span>;
}

function ParamRow({ name, color, value, desc }: { name: string; color: string; value?: string; desc: string }) {
  return (
    <tr style={{ borderBottom: '1px solid #1e2530' }}>
      <td style={{ padding: '5px 8px 5px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
        <span style={{ color, fontWeight: 700, fontSize: 9 }}>{name}</span>
      </td>
      {value && (
        <td style={{ padding: '5px 12px 5px 0', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 9 }}>
          {value}
        </td>
      )}
      <td style={{ padding: '5px 0', verticalAlign: 'top', color: '#4a5568', fontSize: 9, lineHeight: 1.5 }}>
        {desc}
      </td>
    </tr>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 9 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
      <div>
        <span style={{ color: '#c9d1d9', fontWeight: 700 }}>{label}:</span>
        <span style={{ color: '#6b7280', marginLeft: 6 }}>{value}</span>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 10, padding: '7px 10px',
      background: '#0a0f18', border: '1px solid #1e2530',
      fontSize: 9, color: '#6b7280', lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

function BurdenScale() {
  const thresholds = [
    { label: '< 30%',   color: '#3cff8a', desc: 'Healthy — entropy under control' },
    { label: '30–60%',  color: '#ff8c3c', desc: 'Elevated — maintenance demand growing' },
    { label: '> 60%',   color: '#ff3c3c', desc: 'Critical — entropy consuming eng capacity' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {thresholds.map(({ label, color, desc }) => (
        <div key={label} style={{ flex: 1, background: '#111827', border: `1px solid ${color}30`, padding: '7px 9px' }}>
          <div style={{ color, fontSize: 10, fontWeight: 700, marginBottom: 3 }}>{label}</div>
          <div style={{ color: '#4a5568', fontSize: 9, lineHeight: 1.5 }}>{desc}</div>
        </div>
      ))}
    </div>
  );
}

// ── SVG Charts ────────────────────────────────────────────────────────────────

function PhaseTimeline({ currentPhase }: { currentPhase: number }) {
  // Phase durations in sim-years: 1.2, 1.3, 1.5, 1.0 (total 5)
  const totalW = 256;
  const phases = [
    { w: Math.round(totalW * 1.2 / 5), color: '#3cff8a', label: 'GROWTH',    short: '0–1.2' },
    { w: Math.round(totalW * 1.3 / 5), color: '#e8ff3c', label: 'INFLECTION',short: '1.2–2.5' },
    { w: Math.round(totalW * 1.5 / 5), color: '#ff8c3c', label: 'TECH DEBT', short: '2.5–4.0' },
    { w: Math.round(totalW * 1.0 / 5), color: '#ff3c3c', label: 'CRISIS',    short: '4.0–5.0' },
  ];
  const GAP = 2;
  let x = 0;
  const elements: React.ReactNode[] = [];

  phases.forEach((p, i) => {
    const active = i === currentPhase;
    elements.push(
      <g key={i}>
        <rect x={x} y={0} width={p.w - GAP} height={22}
          fill={active ? p.color + '28' : p.color + '0e'}
          stroke={p.color} strokeWidth={active ? 1.5 : 0.5} strokeOpacity={active ? 1 : 0.35} />
        <text x={x + (p.w - GAP) / 2} y={14} textAnchor="middle"
          fill={p.color} fontSize={active ? 7.5 : 6.5}
          fontWeight={active ? 'bold' : 'normal'} opacity={active ? 1 : 0.45}
          fontFamily="monospace">
          {p.label}
        </text>
        <text x={x + (p.w - GAP) / 2} y={34} textAnchor="middle"
          fill="#4a5568" fontSize={6} fontFamily="monospace">
          {p.short} yr
        </text>
        {active && (
          <polygon
            points={`${x + (p.w - GAP) / 2 - 4},37 ${x + (p.w - GAP) / 2 + 4},37 ${x + (p.w - GAP) / 2},43`}
            fill={p.color} />
        )}
      </g>
    );
    x += p.w;
  });

  return (
    <svg viewBox="0 0 258 44" style={{ width: '100%', display: 'block', maxHeight: 52 }}>
      {elements}
    </svg>
  );
}

function TimingChart({ currentPhase }: { currentPhase: number }) {
  // X: 0–280, phase boundaries at x=67 (yr1.2), x=134 (yr2.5), x=201 (yr4.0)
  // Y: 0=top (max entropy), 82=bottom (zero)
  const phaseX = [0, 67, 134, 201, 280];
  const phaseColors = ['#3cff8a', '#e8ff3c', '#ff8c3c', '#ff3c3c'];

  // Illustrative entropy curves (normalised, y=82 is zero, y=0 is max)
  // 0% maintenance: accelerates steeply
  const curve0   = 'M 0,82 C 30,81 60,80 67,79 C 90,74 115,62 134,48 C 160,28 200,12 280,3';
  // 50% early maintenance (started from beginning): stays much flatter
  const curveEarly = 'M 0,82 C 30,81 60,81 67,80 C 90,78 115,75 134,72 C 160,68 200,63 280,60';
  // 50% maintenance started at Phase 2 (x=134): follows 0% until then, barely diverges
  const curveLate  = 'M 0,82 C 30,81 60,80 67,79 C 90,74 115,62 134,48 C 160,36 200,24 280,16';

  // Current phase X position for "you are here" marker
  const nowX = currentPhase < 4 ? (phaseX[currentPhase] + phaseX[currentPhase + 1]) / 2 : 280;

  return (
    <div>
      <svg viewBox="0 0 280 92" style={{ width: '100%', display: 'block', maxHeight: 100 }}>
        {/* Phase background bands */}
        {phaseColors.map((c, i) => (
          <rect key={i} x={phaseX[i]} y={0} width={phaseX[i + 1] - phaseX[i]} height={82}
            fill={c} fillOpacity={0.04} />
        ))}
        {/* Phase dividers */}
        {[1, 2, 3].map(i => (
          <line key={i} x1={phaseX[i]} y1={0} x2={phaseX[i]} y2={82}
            stroke={phaseColors[i]} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="3,3" />
        ))}

        {/* Effectiveness window shading (phases 0–1) */}
        <rect x={0} y={0} width={134} height={82} fill="#3cff8a" fillOpacity={0.04} />

        {/* Curves */}
        <path d={curve0}    stroke="#ff3c3c" strokeWidth={1.5} fill="none" />
        <path d={curveEarly} stroke="#3cff8a" strokeWidth={1.5} fill="none" strokeDasharray="5,3" />
        <path d={curveLate}  stroke="#ff8c3c" strokeWidth={1}   fill="none" strokeDasharray="3,3" />

        {/* X-axis */}
        <line x1={0} y1={82} x2={280} y2={82} stroke="#1e2530" strokeWidth={1} />

        {/* Phase year labels */}
        {['0', '1.2', '2.5', '4.0', '5.0'].map((yr, i) => (
          <text key={i} x={phaseX[i]} y={91} textAnchor={i === 4 ? 'end' : 'middle'}
            fill="#374151" fontSize={6} fontFamily="monospace">{yr}yr</text>
        ))}

        {/* "Window" annotation */}
        <text x={67} y={10} textAnchor="middle" fill="#3cff8a" fontSize={6.5} fontFamily="monospace" opacity={0.7}>
          ← MAX EFFECT WINDOW →
        </text>

        {/* "Too late" annotation */}
        <text x={207} y={10} textAnchor="middle" fill="#ff3c3c" fontSize={6.5} fontFamily="monospace" opacity={0.7}>
          TOO LATE
        </text>

        {/* You are here marker */}
        {currentPhase < 4 && (
          <g>
            <line x1={nowX} y1={0} x2={nowX} y2={82} stroke="#e8ff3c" strokeWidth={1} strokeDasharray="2,2" />
            <text x={nowX} y={7} textAnchor="middle" fill="#e8ff3c" fontSize={6} fontFamily="monospace">NOW</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
        {[
          { color: '#ff3c3c', dash: false, label: '0% maintain' },
          { color: '#3cff8a', dash: true,  label: '50% maintain (early)' },
          { color: '#ff8c3c', dash: true,  label: '50% maintain (Phase 2+)' },
        ].map(({ color, dash, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#4a5568' }}>
            <svg width={18} height={8}>
              <line x1={0} y1={4} x2={18} y2={4} stroke={color} strokeWidth={1.5}
                strokeDasharray={dash ? '4,2' : 'none'} />
            </svg>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
