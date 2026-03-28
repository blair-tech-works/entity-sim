'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useSimulation } from './hooks/useSimulation';
import GraphCanvas, { type GraphCanvasHandle } from './components/simulation/GraphCanvas';
import MetricsPanel from './components/simulation/MetricsPanel';
import MiniChart from './components/simulation/MiniChart';
import EventLog from './components/simulation/EventLog';
import PhaseBanner from './components/simulation/PhaseBanner';
import { DEFAULT_CONFIG } from './lib/constants';

export default function HomePage() {
  const { status, metrics, logs, history, start, pause, getState, onPhaseBanner, maintainRatio, setMaintainRatio } = useSimulation(DEFAULT_CONFIG);
  const graphRef = useRef<GraphCanvasHandle>(null);
  const [realElapsed, setRealElapsed] = useState(0);
  const realStartRef = useRef<number>(0);
  const [sliderValue, setSliderValue] = useState(Math.round(maintainRatio * 100));
  const [showRefs, setShowRefs] = useState(false);

  useEffect(() => {
    if (status === 'running') {
      if (realStartRef.current === 0) realStartRef.current = Date.now();
      const interval = setInterval(() => {
        setRealElapsed(Math.floor((Date.now() - realStartRef.current) / 1000));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleStartPause = useCallback(() => {
    if (status === 'idle' || status === 'complete') {
      realStartRef.current = Date.now();
      setRealElapsed(0);
      const size = graphRef.current?.getSize() ?? { width: 800, height: 500 };
      start(size.width, size.height);
    } else {
      pause();
    }
  }, [status, start, pause]);

  const btnLabel =
    status === 'idle' ? '▶ RUN SIMULATION' :
    status === 'running' ? '⏸ PAUSE' :
    status === 'paused' ? '▶ RESUME' :
    '↺ RESTART';

  const mins = Math.floor(realElapsed / 60);
  const secs = realElapsed % 60;

  const roiDot = metrics.roi >= 1.5 ? 'active' : metrics.roi >= 1.0 ? 'warn' : 'crit';
  const entropyDot = metrics.burden < 30 ? 'active' : metrics.burden < 60 ? 'warn' : 'crit';

  return (
    <main
      className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden"
      style={{
        background: '#080a0e',
        color: '#c9d1d9',
        fontFamily: "'Space Mono', 'Courier New', monospace",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between flex-shrink-0 gap-2 px-4 lg:px-6 py-3"
        style={{ borderBottom: '1px solid #1e2530', background: '#0d1117' }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '0.12em', color: '#e8ff3c', textTransform: 'uppercase' }}>
            ⬡ Entropy
          </span>
          <span className="hidden sm:inline" style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Software Complexity Simulation — 5yr Horizon
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:gap-x-6">
          <span style={{ fontSize: '11px', color: '#4a5568' }}>
            SIM: <span style={{ color: '#e8ff3c', fontWeight: 700 }}>Y{metrics.simYear.toFixed(1)} D{metrics.simDay}</span>
          </span>
          <span style={{ fontSize: '11px', color: '#4a5568' }}>
            REAL: <span style={{ color: '#e8ff3c', fontWeight: 700 }}>{mins}:{secs.toString().padStart(2, '0')}</span>
          </span>
          <button
            onClick={handleStartPause}
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: status === 'running' ? '#ff3c3c' : '#e8ff3c',
              border: `1px solid ${status === 'running' ? '#ff3c3c' : '#e8ff3c'}`,
              padding: '8px 18px',
              cursor: 'pointer',
              minHeight: '40px',
              touchAction: 'manipulation',
            }}
          >
            {btnLabel}
          </button>

          {/* Build/Maintain slider — full width on mobile */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span style={{ fontSize: '9px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              BUILD
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSliderValue(v);
                setMaintainRatio(v / 100);
              }}
              className="flex-1 lg:w-24"
              style={{ accentColor: '#e8ff3c', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '9px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              MAINTAIN
            </span>
            <span style={{ fontSize: '10px', color: '#e8ff3c', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
              {sliderValue}%
            </span>
          </div>
        </div>
      </header>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="sim-layout">
        {/* Graph canvas */}
        <div className="sim-graph" style={{ background: '#0d1117' }}>
          <div style={{ position: 'absolute', top: 12, left: 14, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568', zIndex: 2, pointerEvents: 'none' }}>
            NODE GRAPH — SOFTWARE COMPONENTS
          </div>
          <GraphCanvas ref={graphRef} getState={getState} running={status === 'running'} />
          <PhaseBanner onRegister={onPhaseBanner} />
          <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { color: '#3cb8ff', label: 'New Component' },
              { color: '#3cff8a', label: 'Healthy' },
              { color: '#e8ff3c', label: 'Moderate Debt' },
              { color: '#ff8c3c', label: 'High Entropy' },
              { color: '#ff3c3c', label: 'Critical' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9, color: '#4a5568' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics panel */}
        <div style={{ background: '#0d1117', overflow: 'hidden' }}>
          <MetricsPanel metrics={metrics} />
        </div>

        {/* Mini charts — horizontal scroll on mobile, grid on desktop */}
        <div className="minichart-row">
          <MiniChart
            title="Value vs Entropy Over Time"
            datasets={[
              { data: history.value, color: '#3cff8a' },
              { data: history.entropy, color: '#ff8c3c' },
            ]}
            crossoverLabel="CROSSOVER"
          />
          <MiniChart
            title="ROI Curve"
            datasets={[{ data: history.roi, color: '#3cb8ff' }]}
            showBreakevenLine
          />
          <MiniChart
            title="Maintenance Burden %"
            datasets={[{ data: history.burden, color: '#ff3c3c' }]}
            yMax={100}
            warningLineY={50}
          />
        </div>

        {/* Event log */}
        <EventLog entries={logs} />
      </div>

      {/* ── References panel ──────────────────────────────────────────────── */}
      <div style={{ background: '#0d1117', borderTop: '1px solid #1e2530', flexShrink: 0 }}>
        <button
          onClick={() => setShowRefs(r => !r)}
          style={{
            width: '100%',
            padding: '8px 24px',
            background: 'transparent',
            border: 'none',
            color: '#4a5568',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'monospace',
          }}
        >
          {showRefs ? '▾' : '▸'} Research References
        </button>
        {showRefs && (
          <div style={{
            padding: '12px 24px 16px',
            background: '#18181b',
            borderTop: '1px solid #27272a',
            fontSize: '11px',
            lineHeight: 1.7,
            color: '#a1a1aa',
          }}>
            <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8ff3c', marginBottom: 10 }}>
              DATA-DRIVEN SIMULATION
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
              <li><strong style={{ color: '#c9d1d9' }}>Defect rates:</strong> Capers Jones — 0.5 bugs/feature, 7% fix regression</li>
              <li><strong style={{ color: '#c9d1d9' }}>Maintenance:</strong> Gartner — grows from 15% to 35% over lifecycle</li>
              <li><strong style={{ color: '#c9d1d9' }}>Productivity:</strong> Chalmers University (Besker et al., 2019) — 23% loss to tech debt</li>
              <li><strong style={{ color: '#c9d1d9' }}>Code growth:</strong> Herraiz et al. — codebases double every 42 months</li>
              <li><strong style={{ color: '#c9d1d9' }}>Defect density:</strong> IEEE (109 OSS projects) — 7.47 defects/KLOC mean</li>
              <li><strong style={{ color: '#c9d1d9' }}>Entropy:</strong> ArXiv 2504.18511 — 0.54 correlation entropy↔defects</li>
              <li><strong style={{ color: '#c9d1d9' }}>Performance:</strong> DORA/Accelerate — elite: &lt;5% vs low: 46-60% failure rate</li>
              <li><strong style={{ color: '#c9d1d9' }}>Datasets:</strong> SmartSHARK (38+ Apache projects), Public JIRA (2.7M issues)</li>
              <li><strong style={{ color: '#c9d1d9' }}>Time allocation:</strong> Stripe Developer Coefficient — 42% on tech debt</li>
            </ul>
          </div>
        )}
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 lg:px-6 py-2 flex-shrink-0"
        style={{
          borderTop: '1px solid #1e2530',
          background: '#0d1117',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <StatusItem dot={status === 'running' ? 'active' : status === 'paused' ? 'warn' : 'idle'} label={status.toUpperCase()} />
        <StatusItem dot={roiDot} label={`ROI: ${metrics.roi >= 1.5 ? 'POSITIVE' : metrics.roi >= 1.0 ? 'MARGINAL' : 'NEGATIVE'} (${metrics.roi.toFixed(1)}x)`} />
        <StatusItem dot={entropyDot} label={`ENTROPY: ${metrics.burden < 30 ? 'NOMINAL' : metrics.burden < 60 ? 'ELEVATED' : 'CRITICAL'}`} />
        <span className="hidden lg:inline" style={{ marginLeft: 'auto', color: '#4a5568' }}>ENTROPY SIMULATION v{process.env.NEXT_PUBLIC_APP_VERSION ?? '?'} — SOFTWARE ENTROPY MODEL</span>
      </div>
    </main>
  );
}

function StatusItem({ dot, label }: { dot: string; label: string }) {
  const color = dot === 'active' ? '#3cff8a' : dot === 'warn' ? '#ff8c3c' : dot === 'crit' ? '#ff3c3c' : '#4a5568';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4a5568' }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color,
        boxShadow: dot !== 'idle' ? `0 0 6px ${color}` : 'none',
      }} />
      <span>{label}</span>
    </div>
  );
}
