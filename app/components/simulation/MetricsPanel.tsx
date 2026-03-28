'use client';

import type { SimMetrics } from '../../hooks/useSimulation';
import { PHASE_LABELS } from '../../lib/constants';

interface MetricsPanelProps {
  metrics: SimMetrics;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const { totalValue, totalEntropy, roi, burden, nodeCount, workerCount, phase } = metrics;

  const roiColor = roi >= 1.5 ? '#3cff8a' : roi >= 1.0 ? '#e8ff3c' : '#ff3c3c';
  const burdenColor = burden < 30 ? '#3cff8a' : burden < 60 ? '#ff8c3c' : '#ff3c3c';
  const valueMax = 5000;

  return (
    <div className="metrics-panel lg:h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      <MetricBlock
        label="Value"
        value={Math.floor(totalValue).toLocaleString()}
        sub="story points delivered"
        color="#3cff8a"
        barWidth={Math.min(100, (totalValue / valueMax) * 100)}
      />
      <MetricBlock
        label="Entropy"
        value={Math.floor(totalEntropy).toLocaleString()}
        sub="complexity units"
        color="#ff8c3c"
        barWidth={Math.min(100, (totalEntropy / valueMax) * 100)}
      />
      <MetricBlock
        label="ROI"
        value={`${roi.toFixed(2)}x`}
        sub="breakeven at 1.0"
        color={roiColor}
        barWidth={Math.min(100, (roi / 3) * 100)}
      />
      <MetricBlock
        label="Burden"
        value={`${burden.toFixed(1)}%`}
        sub="eng capacity consumed"
        color={burdenColor}
        barWidth={burden}
      />
      <MetricBlock
        label="Nodes / Eng"
        value={`${nodeCount} / ${workerCount}`}
        sub={`Phase: ${PHASE_LABELS[phase]}`}
        color="#c9d1d9"
        barWidth={0}
        noBar
      />
    </div>
  );
}

interface MetricBlockProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  barWidth: number;
  noBar?: boolean;
}

function MetricBlock({ label, value, sub, color, barWidth, noBar }: MetricBlockProps) {
  return (
    <div className="metric-block" style={{
      flex: '1 0 auto',
      padding: '14px 18px',
      borderBottom: '1px solid #1e2530',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div className="metric-label" style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568', marginBottom: '6px' }}>
        {label}
      </div>
      <div className="metric-value" style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1, color, fontFamily: 'sans-serif' }}>
        {value}
      </div>
      <div className="metric-sub" style={{ fontSize: '9px', color: '#4a5568', marginTop: '4px' }}>{sub}</div>
      {!noBar && (
        <div className="metric-bar" style={{ height: '3px', background: '#1e2530', marginTop: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${barWidth}%`,
            background: color,
            transition: 'width 0.4s ease',
            position: 'absolute',
            left: 0,
            top: 0,
          }} />
        </div>
      )}
    </div>
  );
}
