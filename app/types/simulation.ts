export interface SimNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  name: string;
  features: number;
  entropy: number;
  value: number;
  age: number;
  radius: number;
  targetRadius: number;
  pulsePhase: number;
  connections: number;
  worker: number | null;
  lastActivity: number;
  issues: number;
}

export interface SimEdge {
  a: number;
  b: number;
  strength: number;
}

export interface SimWorker {
  id: number;
  name: string;
  nodeId: number;
  x: number;
  y: number;
  color: string;
  busy: boolean;
  busyFor: number;
}

export interface SimHistory {
  time: number[];
  value: number[];
  entropy: number[];
  roi: number[];
  burden: number[];
}

export interface SimState {
  running: boolean;
  paused: boolean;
  tick: number;
  nodes: SimNode[];
  edges: SimEdge[];
  workers: SimWorker[];
  history: SimHistory;
  totalValue: number;
  totalEntropy: number;
  totalCost: number;
  phase: number;
  realStart: number;
  pausedElapsed: number;
  nextNodeId: number;
  nextWorkerId: number;
  maintainRatio: number; // 0-1 where 0=all build, 1=all maintain
}

export interface SimConfig {
  simRealDuration: number;  // seconds
  simYears: number;
  tickMs: number;
  initialWorkers: number;
  maxWorkers: number;
  initialNodes: number;
  maxNodes: number;
  entropyRateBase: number;
  valuePerFeature: number;
  entropyPerFeature: number;
  couplingEntropyMult: number;
}

export type LogLevel = 'info' | 'good' | 'warn' | 'crit';

export interface LogEntry {
  id: number;
  year: string;
  message: string;
  level: LogLevel;
}

export type SimPhase = 0 | 1 | 2 | 3;
