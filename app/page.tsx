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
    <main style={{
      background: '#080a0e',
      color: '#c9d1d9',
      fontFamily: "'Space Mono', 'Courier New', monospace",
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #1e2530',
        background: '#0d1117',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          <span style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '0.12em', color: '#e8ff3c', textTransform: 'uppercase' }}>
            ⬡ Entropy
          </span>
          <span style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Software Complexity Simulation — 5yr Horizon
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '11px', color: '#4a5568' }}>
            SIMULATED TIME: <span style={{ color: '#e8ff3c', fontWeight: 700 }}>Year {metrics.simYear.toFixed(1)}, Day {metrics.simDay}</span>
          </span>
          <span style={{ fontSize: '11px', color: '#4a5568' }}>
            REAL TIME: <span style={{ color: '#e8ff3c', fontWeight: 700 }}>{mins}:{secs.toString().padStart(2, '0')}</span>
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
              padding: '6px 18px',
              cursor: 'pointer',
            }}
          >
            {btnLabel}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              style={{
                width: 100,
                accentColor: '#e8ff3c',
                cursor: 'pointer',
              }}
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

      <div className="sim-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gridTemplateRows: '1fr 160px',
        gap: '1px',
        flex: 1,
        minHeight: 0,
        background: '#1e2530',
        overflow: 'hidden',
      }}>
        <div style={{ background: '#0d1117', position: 'relative', overflow: 'hidden' }}>
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

        <div style={{ background: '#0d1117', overflow: 'hidden' }}>
          <MetricsPanel metrics={metrics} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#1e2530' }}>
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

        <EventLog entries={logs} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '6px 24px',
        borderTop: '1px solid #1e2530',
        background: '#0d1117',
        flexShrink: 0,
        fontSize: '9px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        <StatusItem dot={status === 'running' ? 'active' : status === 'paused' ? 'warn' : 'idle'} label={status.toUpperCase()} />
        <StatusItem dot={roiDot} label={`ROI: ${metrics.roi >= 1.5 ? 'POSITIVE' : metrics.roi >= 1.0 ? 'MARGINAL' : 'NEGATIVE'} (${metrics.roi.toFixed(1)}x)`} />
        <StatusItem dot={entropyDot} label={`ENTROPY: ${metrics.burden < 30 ? 'NOMINAL' : metrics.burden < 60 ? 'ELEVATED' : 'CRITICAL'}`} />
        <span style={{ marginLeft: 'auto', color: '#4a5568' }}>ENTROPY SIMULATION v1.0 — SOFTWARE ENTROPY MODEL</span>
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
