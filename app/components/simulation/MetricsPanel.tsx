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

  return (
    <div className="metrics-strip">
      <Cell label="VALUE" value={Math.floor(totalValue).toLocaleString()} color="#3cff8a" />
      <Cell label="ENTROPY" value={Math.floor(totalEntropy).toLocaleString()} color="#ff8c3c" />
      <Cell label="ROI" value={`${roi.toFixed(2)}x`} color={roiColor} />
      <Cell label="BURDEN" value={`${burden.toFixed(1)}%`} color={burdenColor} />
      <Cell label={PHASE_LABELS[phase] ?? 'GROWTH'} value={`${nodeCount}/${workerCount}`} color="#c9d1d9" />
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="metric-cell">
      <div style={{ fontSize: '7px', letterSpacing: '0.12em', color: '#4a5568', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 800, lineHeight: 1.2, color, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  );
}
