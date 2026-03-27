'use client';

import { useEffect, useRef } from 'react';

interface Dataset {
  data: number[];
  color: string;
}

interface MiniChartProps {
  datasets: Dataset[];
  yMax?: number;
  showBreakevenLine?: boolean;
  crossoverLabel?: string;
  warningLineY?: number;
  title: string;
}

export default function MiniChart({
  datasets,
  yMax,
  showBreakevenLine,
  crossoverLabel,
  warningLineY,
  title,
}: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const allValues = datasets.flatMap(d => d.data);
    const maxVal = yMax ?? Math.max(...allValues, 1) * 1.1;
    const n = datasets[0]?.data.length ?? 0;

    // Grid
    ctx.strokeStyle = 'rgba(30,37,48,0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = H - (i / 4) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (n < 2) return;

    datasets.forEach(ds => {
      // Line
      ctx.beginPath();
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 1.5;
      ds.data.forEach((v, i) => {
        const x = (i / (n - 1)) * W;
        const y = H - (v / maxVal) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill
      ctx.beginPath();
      ds.data.forEach((v, i) => {
        const x = (i / (n - 1)) * W;
        const y = H - (v / maxVal) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const rgb = hexToRgb(ds.color);
      ctx.fillStyle = `rgba(${rgb},0.07)`;
      ctx.fill();
    });

    // Breakeven line at y=1
    if (showBreakevenLine) {
      const breakY = H - (1 / maxVal) * H;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(232,255,60,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, breakY); ctx.lineTo(W, breakY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(232,255,60,0.7)';
      ctx.font = '7px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('breakeven', 2, breakY - 3);
    }

    // Warning horizontal line
    if (warningLineY !== undefined) {
      const wy = H - (warningLineY / maxVal) * H;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,140,60,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(W, wy); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Crossover marker (value/entropy intersection)
    if (crossoverLabel && datasets.length >= 2) {
      for (let i = 1; i < n; i++) {
        const a = datasets[0].data[i], b = datasets[1].data[i];
        const ap = datasets[0].data[i - 1], bp = datasets[1].data[i - 1];
        if (b >= a && bp < ap) {
          const x = (i / (n - 1)) * W;
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = 'rgba(255,60,60,0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#ff3c3c';
          ctx.font = '7px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(crossoverLabel, x + 3, 11);
          break;
        }
      }
    }
  });

  return (
    <div style={{ background: '#0d1117', padding: '10px', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a5568', marginBottom: '6px' }}>
        {title}
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={120}
        style={{ width: '100%', height: 'calc(100% - 24px)', display: 'block' }}
      />
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '255,255,255';
}
