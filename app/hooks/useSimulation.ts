'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { SimState, SimConfig, LogEntry } from '../types/simulation';
import {
  DEFAULT_CONFIG, WORKER_NAMES, PHASE_LABELS, MAINTAIN_RATIO_DEFAULT, MAINTENANCE_ENTROPY_REDUCTION,
  BUGS_PER_FEATURE, BUG_FIX_REGRESSION_RATE, TECH_DEBT_PRODUCTIVITY_LOSS, PHASE_CONFIG,
} from '../lib/constants';
import {
  buildInitialState,
  detectPhase,
  applyPhysics,
  calcROI,
  calcBurden,
  spawnNode,
  createWorker,
} from '../lib/engine';

const TICKS_PER_SIM_YEAR = (config: SimConfig) =>
  (config.simRealDuration * 1000 / config.tickMs) / config.simYears;

export type SimStatus = 'idle' | 'running' | 'paused' | 'complete';

export interface SimMetrics {
  simYear: number;
  simDay: number;
  totalValue: number;
  totalEntropy: number;
  totalCost: number;
  roi: number;
  burden: number;
  nodeCount: number;
  workerCount: number;
  phase: number;
}

export function useSimulation(config: SimConfig = DEFAULT_CONFIG) {
  const stateRef = useRef<SimState | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasSizeRef = useRef({ width: 800, height: 500 });
  const logIdRef = useRef(0);
  const phaseBannerCallbackRef = useRef<((phase: number) => void) | null>(null);
  const maintainRatioRef = useRef(MAINTAIN_RATIO_DEFAULT); // 0 = all build, 1 = all maintain

  const [status, setStatus] = useState<SimStatus>('idle');
  const [metrics, setMetrics] = useState<SimMetrics>({
    simYear: 0, simDay: 0, totalValue: 0, totalEntropy: 0,
    totalCost: 1, roi: 0, burden: 0, nodeCount: 0, workerCount: 0, phase: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState(stateRef.current?.history ?? {
    time: [], value: [], entropy: [], roi: [], burden: [],
  });

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const simYear = stateRef.current
      ? (stateRef.current.tick / TICKS_PER_SIM_YEAR(config)).toFixed(1)
      : '0.0';
    setLogs(prev => [{
      id: logIdRef.current++,
      year: simYear,
      message,
      level,
    }, ...prev].slice(0, 80));
  }, [config]);

  const onPhaseBanner = useCallback((cb: (phase: number) => void) => {
    phaseBannerCallbackRef.current = cb;
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;

    s.tick++;
    const ticksPerYear = TICKS_PER_SIM_YEAR(config);
    const simYear = s.tick / ticksPerYear;
    const simDay = Math.floor((simYear % 1) * 365);

    // Phase transition
    const newPhase = detectPhase(simYear);
    if (newPhase !== s.phase) {
      s.phase = newPhase;
      phaseBannerCallbackRef.current?.(newPhase);
      addLog(`━━ PHASE: ${PHASE_LABELS[newPhase]} ━━ Year ${simYear.toFixed(1)}`,
        newPhase === 3 ? 'crit' : 'warn');
    }

    // Worker actions
    s.workers.forEach(w => {
      const node = s.nodes.find(n => n.id === w.nodeId);
      if (!node) return;

      const dx = node.x - w.x;
      const dy = node.y - w.y;
      w.x += dx * 0.08;
      w.y += dy * 0.08;

      w.busyFor = Math.max(0, w.busyFor - 1);
      if (w.busyFor > 0) return;

      // addProb: base probability a worker acts; uses empirical PHASE_CONFIG featureProb
      const phaseConf = PHASE_CONFIG[s.phase] ?? PHASE_CONFIG[0];
      const addProb = (phaseConf.featureProb / 10) * 0.7; // scaled to per-tick probability
      if (Math.random() < addProb) {
        const maintainRatio = maintainRatioRef.current;
        if (Math.random() >= maintainRatio) {
          // BUILD: ship a new feature (using empirical phase config)
          node.features++;
          const featureValue = config.valuePerFeature * phaseConf.valueMult;
          const featureEntropy = config.entropyPerFeature * phaseConf.entropyMult;
          node.value += featureValue;
          node.entropy += featureEntropy;
          node.targetRadius = 14 + Math.sqrt(node.features) * 4;
          s.totalValue += featureValue;
          s.totalCost += featureValue * 0.7;
          // Tech debt slows velocity in later phases (Besker et al., 2019)
          const debtSlowdown = s.phase >= 2 ? (1 + TECH_DEBT_PRODUCTIVITY_LOSS) : 1;
          w.busyFor = (30 + Math.random() * 60) * debtSlowdown;
          w.busy = true;
          node.lastActivity = s.tick;
          if (Math.random() < 0.08) {
            addLog(
              `${w.name} shipped feature on [${node.name}] (+${featureValue.toFixed(0)} val, +${featureEntropy.toFixed(1)} entropy)`,
              'good'
            );
          }
          // Bug introduction: Capers Jones — 0.5 bugs per feature
          if (Math.random() < BUGS_PER_FEATURE) {
            const bugTarget = s.nodes[Math.floor(Math.random() * s.nodes.length)];
            const bugEntropy = 3 + Math.random() * 6;
            bugTarget.entropy += bugEntropy;
            bugTarget.issues++;
            s.totalEntropy += bugEntropy;
            if (Math.random() < 0.15) {
              addLog(`BUG introduced in [${bugTarget.name}] from [${node.name}] change (+${bugEntropy.toFixed(1)} entropy)`, 'warn');
            }
          }
        } else {
          // MAINTAIN: pick a random node and reduce its entropy
          const targetNode = s.nodes[Math.floor(Math.random() * s.nodes.length)];
          // Bug fix regression: Capers Jones — 7% of fixes introduce new bugs
          if (Math.random() < BUG_FIX_REGRESSION_RATE) {
            const regressionEntropy = 2 + Math.random() * 4;
            targetNode.entropy += regressionEntropy;
            s.totalEntropy += regressionEntropy;
            targetNode.issues++;
            if (Math.random() < 0.3) {
              addLog(`REGRESSION: ${w.name} fix on [${targetNode.name}] introduced new bug (+${regressionEntropy.toFixed(1)} entropy)`, 'warn');
            }
          } else {
            const reduction = MAINTENANCE_ENTROPY_REDUCTION * targetNode.features;
            const actualReduction = Math.min(targetNode.entropy, reduction);
            targetNode.entropy -= actualReduction;
            s.totalEntropy -= actualReduction;
            if (Math.random() < 0.06) {
              addLog(
                `${w.name} maintained [${targetNode.name}] (-${actualReduction.toFixed(1)} entropy)`,
                'info'
              );
            }
          }
          // Tech debt slows maintenance too in later phases
          const maintDebtSlowdown = s.phase >= 2 ? (1 + TECH_DEBT_PRODUCTIVITY_LOSS) : 1;
          w.busyFor = (30 + Math.random() * 60) * maintDebtSlowdown;
          w.busy = true;
          targetNode.lastActivity = s.tick;
        }
      } else {
        w.busy = false;
      }

      // Migration
      if (Math.random() < 0.004) {
        const candidates = s.nodes.filter(n => n.id !== w.nodeId && n.worker === null);
        if (candidates.length > 0) {
          const dest = candidates[Math.floor(Math.random() * candidates.length)];
          if (node.worker === w.id) node.worker = null;
          w.nodeId = dest.id;
          dest.worker = w.id;
        }
      }
    });

    // Node entropy decay
    s.nodes.forEach(n => {
      const couplingFactor = 1 + n.connections * config.couplingEntropyMult * 0.1;
      const entropyGrowth = config.entropyRateBase * n.features * couplingFactor * (1 + s.phase * 0.3);
      n.entropy += entropyGrowth;
      s.totalEntropy += entropyGrowth;

      if (n.entropy > 60 && Math.random() < 0.001) {
        n.issues++;
        const burst = 5 + Math.random() * 10;
        n.entropy += burst;
        s.totalEntropy += burst;
        addLog(`BUG in [${n.name}] — entropy spike +${burst.toFixed(0)} (issues: ${n.issues})`, 'warn');
      }

      if (n.entropy > 120 && Math.random() < 0.0005) {
        addLog(`CRITICAL: [${n.name}] approaching entropy collapse! (${n.features} feats, ${n.issues} bugs)`, 'crit');
      }
    });

    // Spawn node
    const nodeSpawnProb = 0.0015 * (1 + simYear * 0.3);
    if (s.nodes.length < config.maxNodes && Math.random() < nodeSpawnProb) {
      const { node, newEdges, nextNodeId } = spawnNode(
        s.nodes, s.edges, s.nextNodeId,
        canvasSizeRef.current.width, canvasSizeRef.current.height
      );
      s.nodes.push(node);
      s.edges.push(...newEdges);
      s.nextNodeId = nextNodeId;
      addLog(`New component: [${node.name}] (Y${simYear.toFixed(1)})`);
    }

    // Spawn worker
    const workerSpawnProb = simYear < 2 ? 0.0008 : 0.0003;
    if (s.workers.length < config.maxWorkers && Math.random() < workerSpawnProb) {
      const target = s.nodes[Math.floor(Math.random() * s.nodes.length)];
      const w = createWorker(s.nextWorkerId++, target.id, target);
      w.x = target.x + (Math.random() - 0.5) * 20;
      w.y = target.y + (Math.random() - 0.5) * 20;
      s.workers.push(w);
      addLog(`Engineer hired: ${w.name} → [${target.name}]`);
    }

    // Physics
    applyPhysics(s.nodes, s.edges, canvasSizeRef.current.width, canvasSizeRef.current.height);

    // Maintenance cost
    const burden = calcBurden(s.totalEntropy, s.totalValue);
    s.totalCost += (burden / 100) * 2;

    // History (every 20 ticks)
    if (s.tick % 20 === 0) {
      const roi = calcROI(s.totalValue, s.totalCost);
      s.history.time.push(simYear);
      s.history.value.push(s.totalValue);
      s.history.entropy.push(s.totalEntropy);
      s.history.roi.push(roi);
      s.history.burden.push(burden);
      setHistory({ ...s.history });
    }

    // Update metrics
    setMetrics({
      simYear,
      simDay,
      totalValue: s.totalValue,
      totalEntropy: s.totalEntropy,
      totalCost: s.totalCost,
      roi: calcROI(s.totalValue, s.totalCost),
      burden: calcBurden(s.totalEntropy, s.totalValue),
      nodeCount: s.nodes.length,
      workerCount: s.workers.length,
      phase: s.phase,
    });

    // End check
    if (simYear >= config.simYears) {
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus('complete');
      const roi = calcROI(s.totalValue, s.totalCost);
      addLog(`━━ SIMULATION COMPLETE ━━`, 'crit');
      addLog(`${s.nodes.length} components, ${s.workers.length} engineers`, 'good');
      addLog(`ROI: ${roi.toFixed(2)}x | Burden: ${calcBurden(s.totalEntropy, s.totalValue).toFixed(1)}%`,
        roi >= 1 ? 'good' : 'crit');
    }
  }, [config, addLog]);

  const start = useCallback((canvasWidth: number, canvasHeight: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    canvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
    stateRef.current = buildInitialState(canvasWidth, canvasHeight, config);
    setLogs([]);
    setHistory({ time: [], value: [], entropy: [], roi: [], burden: [] });
    setStatus('running');
    addLog('Simulation started. Initial team: 4 engineers. 3 core components.', 'good');
    addLog('Entropy model: O(n·f·c) — nodes × features × coupling');
    timerRef.current = setInterval(tick, config.tickMs);
  }, [config, tick, addLog]);

  const pause = useCallback(() => {
    if (!stateRef.current) return;
    if (status === 'running') {
      if (timerRef.current) clearInterval(timerRef.current);
      stateRef.current.pausedElapsed = Date.now() - stateRef.current.realStart;
      setStatus('paused');
    } else if (status === 'paused') {
      stateRef.current.realStart = Date.now() - stateRef.current.pausedElapsed;
      timerRef.current = setInterval(tick, config.tickMs);
      setStatus('running');
    }
  }, [status, config.tickMs, tick]);

  const getState = useCallback(() => stateRef.current, []);

  const maintainRatio = maintainRatioRef.current;
  const setMaintainRatio = useCallback((value: number) => {
    maintainRatioRef.current = Math.max(0, Math.min(1, value));
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { status, metrics, logs, history, start, pause, getState, onPhaseBanner, maintainRatio, setMaintainRatio };
}
