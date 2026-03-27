'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { SimState } from '../../types/simulation';
import { nodeColor, hexToRgb } from '../../lib/engine';

interface GraphCanvasProps {
  getState: () => SimState | null;
  running: boolean;
}

export interface GraphCanvasHandle {
  getSize: () => { width: number; height: number };
}

const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  function GraphCanvas({ getState, running }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      getSize: () => ({
        width: canvasRef.current?.width ?? 800,
        height: canvasRef.current?.height ?? 500,
      }),
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        const state = getState();
        if (!state) {
          drawIdle(ctx, canvas.width, canvas.height);
        } else {
          drawGraph(ctx, state, canvas.width, canvas.height);
        }
        rafRef.current = requestAnimationFrame(draw);
      };

      rafRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(rafRef.current);
    }, [getState, running]);

    return (
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    );
  }
);

export default GraphCanvas;

// ─── Draw idle state ──────────────────────────────────────────────────────────

function drawIdle(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  drawGrid(ctx, W, H);
  ctx.fillStyle = 'rgba(232,255,60,0.15)';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRESS RUN SIMULATION TO BEGIN', W / 2, H / 2);
}

// ─── Draw graph ───────────────────────────────────────────────────────────────

function drawGraph(ctx: CanvasRenderingContext2D, state: SimState, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  drawGrid(ctx, W, H);

  const simYear = state.tick / 1; // computed externally but we can derive it approximately
  const { nodes, edges, workers } = state;

  // Edges
  edges.forEach(e => {
    const a = nodes.find(n => n.id === e.a);
    const b = nodes.find(n => n.id === e.b);
    if (!a || !b) return;
    const entropyAvg = (a.entropy + b.entropy) / 2;
    const alpha = Math.min(0.8, 0.15 + e.strength * 0.5);
    const heat = Math.min(1, entropyAvg / 100);
    const r = Math.floor(60 + heat * 195);
    const g = Math.floor(180 - heat * 150);
    const bl = Math.floor(200 - heat * 170);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
    ctx.lineWidth = e.strength * 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  // Nodes
  nodes.forEach(n => {
    const col = nodeColor(n);
    const r = n.radius;

    // Glow
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(col)},0.05)`;
    ctx.fill();

    // Fill background
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Entropy fill arc
    const fillRatio = Math.min(1, n.entropy / Math.max(1, n.value + n.entropy));
    if (fillRatio > 0) {
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.arc(n.x, n.y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fillRatio);
      ctx.closePath();
      ctx.fillStyle = `rgba(${hexToRgb(col)},0.18)`;
      ctx.fill();
    }

    // Feature count label
    ctx.fillStyle = col;
    ctx.font = `bold ${Math.max(8, Math.min(13, r * 0.7))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n.features), n.x, n.y);

    // Name label
    if (r > 18) {
      ctx.fillStyle = 'rgba(180,190,200,0.7)';
      ctx.font = '8px monospace';
      ctx.fillText(n.name.slice(0, 10), n.x, n.y + r + 10);
    }

    // Bug badge
    if (n.issues > 0) {
      ctx.fillStyle = '#ff3c3c';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`⚠${n.issues}`, n.x + r * 0.7, n.y - r * 0.7);
    }
  });

  // Workers
  workers.forEach(w => {
    ctx.beginPath();
    ctx.arc(w.x, w.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = w.busyFor > 0 ? '#e8ff3c' : 'rgba(200,200,200,0.4)';
    ctx.fill();

    if (w.busyFor > 0) {
      ctx.beginPath();
      ctx.arc(w.x, w.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(232,255,60,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Year watermark
  ctx.fillStyle = 'rgba(232,255,60,0.06)';
  ctx.font = 'bold 100px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const yr = (state.tick / (180 * 1000 / 50 / 5)).toFixed(1);
  ctx.fillText(`Y${yr}`, W - 20, H - 10);
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.strokeStyle = 'rgba(30,37,48,0.6)';
  ctx.lineWidth = 1;
  const gs = 40;
  for (let x = 0; x < W; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}
