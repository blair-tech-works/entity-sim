import type { SimNode, SimEdge, SimWorker, SimState, SimConfig } from '../types/simulation';
import { COMPONENT_NAMES, WORKER_NAMES, DEFAULT_CONFIG, PHASE_THRESHOLDS, INITIAL_FEATURES_MIN, INITIAL_FEATURES_MAX, MAINTAIN_RATIO_DEFAULT } from './constants';

// ─── Factory functions ────────────────────────────────────────────────────────

export function createNode(
  id: number,
  x: number,
  y: number,
  name: string
): SimNode {
  const initFeats = INITIAL_FEATURES_MIN + Math.floor(Math.random() * (INITIAL_FEATURES_MAX - INITIAL_FEATURES_MIN + 1));
  const initEntropy = initFeats * 0.5;
  const initRadius = 14 + Math.sqrt(initFeats) * 4;
  return {
    id,
    x, y,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    name,
    features: initFeats,
    entropy: initEntropy,
    value: initFeats * 6,
    age: 0,
    radius: initRadius,
    targetRadius: initRadius,
    pulsePhase: Math.random() * Math.PI * 2,
    connections: 0,
    worker: null,
    lastActivity: 0,
    issues: 0,
  };
}

export function createWorker(
  id: number,
  nodeId: number,
  node: SimNode
): SimWorker {
  return {
    id,
    name: WORKER_NAMES[id % WORKER_NAMES.length],
    nodeId,
    x: node.x,
    y: node.y,
    color: `hsl(${Math.random() * 360},70%,60%)`,
    busy: false,
    busyFor: 0,
  };
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function buildInitialState(
  canvasWidth: number,
  canvasHeight: number,
  config: SimConfig = DEFAULT_CONFIG
): SimState {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const nodes: SimNode[] = [];
  const edges: SimEdge[] = [];
  const workers: SimWorker[] = [];
  let nextNodeId = 0;
  let nextWorkerId = 0;

  let seedTotalValue = 0;
  let seedTotalEntropy = 0;

  for (let i = 0; i < config.initialNodes; i++) {
    const angle = (i / config.initialNodes) * Math.PI * 2;
    const r = Math.min(canvasWidth, canvasHeight) * 0.22;
    const n = createNode(
      nextNodeId++,
      cx + Math.cos(angle) * r,
      cy + Math.sin(angle) * r,
      COMPONENT_NAMES[i]
    );
    // Start with 3–4 features already shipped on each core component
    n.features = 3 + Math.floor(Math.random() * 2);
    n.value = n.features * config.valuePerFeature;
    // Partial entropy — components are established but not yet heavily degraded
    n.entropy = n.features * config.entropyPerFeature * 0.5;
    n.radius = 14 + Math.sqrt(n.features) * 4;
    n.targetRadius = n.radius;
    seedTotalValue += n.value;
    seedTotalEntropy += n.entropy;
    nodes.push(n);
  }

  edges.push({ a: 0, b: 1, strength: 0.8 });
  edges.push({ a: 1, b: 2, strength: 0.8 });
  edges.push({ a: 0, b: 2, strength: 0.5 });

  for (let i = 0; i < config.initialWorkers; i++) {
    const target = nodes[i % nodes.length];
    const w = createWorker(nextWorkerId++, target.id, target);
    target.worker = w.id;
    workers.push(w);
  }

  return {
    running: true,
    paused: false,
    tick: 0,
    nodes,
    edges,
    workers,
    history: { time: [], value: [], entropy: [], roi: [], burden: [] },
    totalValue: seedTotalValue,
    totalEntropy: seedTotalEntropy,
    totalCost: Math.max(1, seedTotalValue * 0.7),
    phase: 0,
    realStart: Date.now(),
    pausedElapsed: 0,
    nextNodeId,
    nextWorkerId,
    maintainRatio: MAINTAIN_RATIO_DEFAULT,
  };
}

// ─── Phase detection ──────────────────────────────────────────────────────────

export function detectPhase(simYear: number): number {
  if (simYear < PHASE_THRESHOLDS[0]) return 0;
  if (simYear < PHASE_THRESHOLDS[1]) return 1;
  if (simYear < PHASE_THRESHOLDS[2]) return 2;
  return 3;
}

// ─── Physics ──────────────────────────────────────────────────────────────────

export function applyPhysics(
  nodes: SimNode[],
  edges: SimEdge[],
  canvasWidth: number,
  canvasHeight: number
): void {
  const repulsion = 1800;
  const attraction = 0.004;
  const damping = 0.85;
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = repulsion / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx -= fx; a.vy -= fy;
      b.vx += fx; b.vy += fy;
    }
  }

  edges.forEach(e => {
    const a = nodes.find(n => n.id === e.a);
    const b = nodes.find(n => n.id === e.b);
    if (!a || !b) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const targetDist = 120 + (a.radius + b.radius);
    const force = (dist - targetDist) * attraction;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx; a.vy += fy;
    b.vx -= fx; b.vy -= fy;
  });

  nodes.forEach(n => {
    n.vx += (cx - n.x) * 0.0002;
    n.vy += (cy - n.y) * 0.0002;
    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx;
    n.y += n.vy;
    n.x = Math.max(n.radius + 10, Math.min(canvasWidth - n.radius - 10, n.x));
    n.y = Math.max(n.radius + 10, Math.min(canvasHeight - n.radius - 10, n.y));
    n.radius += (n.targetRadius - n.radius) * 0.05;
    n.pulsePhase += 0.03;
    n.age++;
  });
}

// ─── Node color by entropy ratio ──────────────────────────────────────────────

export function nodeColor(node: SimNode): string {
  const ratio = node.entropy / Math.max(1, node.value);
  if (ratio < 0.3) return '#3cb8ff';
  if (ratio < 0.6) return '#3cff8a';
  if (ratio < 1.0) return '#e8ff3c';
  if (ratio < 1.8) return '#ff8c3c';
  return '#ff3c3c';
}

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '255,255,255';
}

// ─── Derived metrics ──────────────────────────────────────────────────────────

export function calcROI(totalValue: number, totalCost: number): number {
  return totalValue / Math.max(1, totalCost);
}

export function calcBurden(totalEntropy: number, totalValue: number): number {
  return Math.min(95, (totalEntropy / Math.max(1, totalValue)) * 15);
}

// ─── Spawn helpers ────────────────────────────────────────────────────────────

export function spawnNode(
  nodes: SimNode[],
  edges: SimEdge[],
  nextNodeId: number,
  canvasWidth: number,
  canvasHeight: number
): { node: SimNode; newEdges: SimEdge[]; nextNodeId: number } {
  const margin = 80;
  const parent = nodes[Math.floor(Math.random() * nodes.length)];
  const angle = Math.random() * Math.PI * 2;
  const dist = 80 + Math.random() * 100;
  const x = Math.max(margin, Math.min(canvasWidth - margin, parent.x + Math.cos(angle) * dist));
  const y = Math.max(margin, Math.min(canvasHeight - margin, parent.y + Math.sin(angle) * dist));

  const nameIdx = nextNodeId % COMPONENT_NAMES.length;
  const node = createNode(nextNodeId, x, y, COMPONENT_NAMES[nameIdx]);
  const newEdges: SimEdge[] = [{ a: parent.id, b: node.id, strength: 0.4 + Math.random() * 0.6 }];

  parent.connections++;
  node.connections++;

  if (nodes.length > 3 && Math.random() < 0.4) {
    const other = nodes[Math.floor(Math.random() * (nodes.length - 1))];
    if (other.id !== parent.id && other.id !== node.id) {
      newEdges.push({ a: other.id, b: node.id, strength: 0.3 });
      other.connections++;
      node.connections++;
    }
  }

  return { node, newEdges, nextNodeId: nextNodeId + 1 };
}
