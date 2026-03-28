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
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#080a0e',
        color: '#c9d1d9',
        fontFamily: "'Space Mono', 'Courier New', monospace",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 16px',
          borderBottom: '1px solid #1e2530',
          background: '#0d1117',
          flexShrink: 0,
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.12em', color: '#e8ff3c', textTransform: 'uppercase' }}>
            ⬡ Entropy
          </span>
          <span style={{ fontSize: '9px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            5yr Horizon
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>
            Y<span style={{ color: '#e8ff3c', fontWeight: 700 }}>{metrics.simYear.toFixed(1)}</span>{' '}
            D<span style={{ color: '#e8ff3c', fontWeight: 700 }}>{metrics.simDay}</span>
          </span>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>
            <span style={{ color: '#e8ff3c', fontWeight: 700 }}>{mins}:{secs.toString().padStart(2, '0')}</span>
          </span>
          <button
            onClick={handleStartPause}
            style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: status === 'running' ? '#ff3c3c' : '#e8ff3c',
              border: `1px solid ${status === 'running' ? '#ff3c3c' : '#e8ff3c'}`,
              padding: '6px 14px',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {btnLabel}
          </button>

          {/* Build/Maintain slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '8px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>BLD</span>
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
              style={{ width: '80px', accentColor: '#e8ff3c', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '8px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>MTN</span>
            <span style={{ fontSize: '9px', color: '#e8ff3c', fontWeight: 700, minWidth: 28, textAlign: 'center' }}>
              {sliderValue}%
            </span>
          </div>
        </div>
      </header>

      {/* ── Content: flex column, graph takes remaining space ───────────── */}
      <div className="sim-layout">
        {/* Graph canvas — flex:1, fills all remaining space */}
        <div className="sim-graph" style={{ background: '#0d1117' }}>
          <div style={{ position: 'absolute', top: 8, left: 10, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568', zIndex: 2, pointerEvents: 'none' }}>
            NODE GRAPH
          </div>
          <GraphCanvas ref={graphRef} getState={getState} running={status === 'running'} />
          <PhaseBanner onRegister={onPhaseBanner} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { color: '#3cb8ff', label: 'New' },
              { color: '#3cff8a', label: 'Healthy' },
              { color: '#e8ff3c', label: 'Debt' },
              { color: '#ff8c3c', label: 'High' },
              { color: '#ff3c3c', label: 'Crit' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#4a5568' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics — always a compact horizontal strip */}
        <MetricsPanel metrics={metrics} />

        {/* Charts — 3 equal columns, fixed height */}
        <div className="chart-row">
          <MiniChart
            title="Value vs Entropy"
            datasets={[
              { data: history.value, color: '#3cff8a' },
              { data: history.entropy, color: '#ff8c3c' },
            ]}
            crossoverLabel="CROSSOVER"
          />
          <MiniChart
            title="ROI"
            datasets={[{ data: history.roi, color: '#3cb8ff' }]}
            showBreakevenLine
          />
          <MiniChart
            title="Burden %"
            datasets={[{ data: history.burden, color: '#ff3c3c' }]}
            yMax={100}
            warningLineY={50}
          />
        </div>

        {/* Event log — fixed height, scrollable */}
        <EventLog entries={logs} />
      </div>

      {/* ── References (collapsed by default) ──────────────────────────── */}
      <div style={{ background: '#0d1117', borderTop: '1px solid #1e2530', flexShrink: 0 }}>
        <button
          onClick={() => setShowRefs(r => !r)}
          style={{
            width: '100%',
            padding: '4px 16px',
            background: 'transparent',
            border: 'none',
            color: '#4a5568',
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'monospace',
          }}
        >
          {showRefs ? '▾' : '▸'} Refs
        </button>
        {showRefs && (
          <div style={{
            padding: '8px 16px 12px',
            background: '#18181b',
            borderTop: '1px solid #27272a',
            fontSize: '10px',
            lineHeight: 1.6,
            color: '#a1a1aa',
          }}>
            <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8ff3c', marginBottom: 6 }}>
              DATA-DRIVEN SIMULATION
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyleType: 'disc' }}>
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

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          padding: '4px 16px',
          borderTop: '1px solid #1e2530',
          background: '#0d1117',
          fontSize: '8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        <StatusItem dot={status === 'running' ? 'active' : status === 'paused' ? 'warn' : 'idle'} label={status.toUpperCase()} />
        <StatusItem dot={roiDot} label={`ROI ${metrics.roi.toFixed(1)}x`} />
        <StatusItem dot={entropyDot} label={`BURDEN ${metrics.burden.toFixed(0)}%`} />
        <span style={{ marginLeft: 'auto', color: '#4a5568' }}>v{process.env.NEXT_PUBLIC_APP_VERSION ?? '?'}</span>
      </div>
    </main>
  );
}

function StatusItem({ dot, label }: { dot: string; label: string }) {
  const color = dot === 'active' ? '#3cff8a' : dot === 'warn' ? '#ff8c3c' : dot === 'crit' ? '#ff3c3c' : '#4a5568';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4a5568' }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: color,
        boxShadow: dot !== 'idle' ? `0 0 5px ${color}` : 'none',
      }} />
      <span>{label}</span>
    </div>
  );
}
