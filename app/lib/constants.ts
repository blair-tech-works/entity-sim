import type { SimConfig } from '../types/simulation';

// === EMPIRICALLY-CALIBRATED CONSTANTS ===
// Source: Capers Jones — 0.5 bugs per feature baseline
export const BUGS_PER_FEATURE = 0.5;
// Source: Capers Jones — 7% of bug fixes introduce new bugs
export const BUG_FIX_REGRESSION_RATE = 0.07;
// Source: Chalmers University (Besker et al., 2019) — 23% productivity loss from tech debt
export const TECH_DEBT_PRODUCTIVITY_LOSS = 0.23;
// Source: Gartner lifecycle research
export const MAINTENANCE_BURDEN_EARLY = 0.15;
export const MAINTENANCE_BURDEN_MID = 0.25;
export const MAINTENANCE_BURDEN_LATE = 0.35;
// Source: IEEE 109 OSS projects study — defects per KLOC
export const DEFECT_DENSITY_MEAN = 7.47;
// Source: ArXiv 2504.18511 — entropy-defect Pearson correlation
export const ENTROPY_DEFECT_CORRELATION = 0.54;
// Source: DORA/Accelerate
export const CHANGE_FAILURE_RATE_ELITE = 0.05;
export const CHANGE_FAILURE_RATE_LOW = 0.50;
// Source: Stripe Developer Coefficient 2018 — 42% of time on tech debt
export const TIME_ON_TECH_DEBT = 0.42;

export const DEFAULT_CONFIG: SimConfig = {
  simRealDuration: 180, // 3 minutes
  simYears: 5,
  tickMs: 50,
  initialWorkers: 4,
  maxWorkers: 18,
  initialNodes: 3,
  maxNodes: 40,
  entropyRateBase: 0.002,
  valuePerFeature: 8,
  entropyPerFeature: 3.5,
  couplingEntropyMult: 0.6,
};

export const COMPONENT_NAMES = [
  'auth-service', 'api-gateway', 'user-db', 'analytics', 'billing',
  'notification', 'cache-layer', 'search-idx', 'file-store', 'session-mgr',
  'audit-log', 'rate-limiter', 'config-svc', 'queue', 'scheduler',
  'report-gen', 'export-svc', 'webhook', 'telemetry', 'data-pipeline',
  'ml-model', 'recommendation', 'pricing-engine', 'fraud-detect', 'payment-gw',
  'sms-service', 'email-svc', 'geo-service', 'media-proc', 'cdn-layer',
  'feature-flags', 'A/B-test', 'event-bus', 'cron-jobs', 'health-check',
  'monitoring', 'alerting', 'deploy-svc', 'infra-mgr', 'docs-api',
];

export const WORKER_NAMES = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Henry', 'Iris', 'Jack', 'Kate', 'Leo', 'Mia', 'Ned',
  'Olivia', 'Pete', 'Quinn', 'Rosa',
];

export const MAINTAIN_RATIO_DEFAULT = 0.0;
// Per maintenance action: reduces entropy by this factor × node.features
// Tuned so 100% maintenance noticeably slows (but doesn't eliminate) entropy growth
export const MAINTENANCE_ENTROPY_REDUCTION = 0.3;
export const INITIAL_FEATURES_MIN = 6;
export const INITIAL_FEATURES_MAX = 7;

export const PHASE_LABELS = ['GROWTH', 'INFLECTION', 'TECH DEBT', 'ENTROPY CRISIS'];

export const PHASE_THRESHOLDS = [1.2, 2.5, 4.0]; // simYear boundaries for phases 1, 2, 3

// Empirically-grounded phase configuration
export const PHASE_CONFIG = [
  { label: 'GROWTH',         featureProb: 0.12,  entropyMult: 1.0, valueMult: 1.0  },
  { label: 'INFLECTION',     featureProb: 0.07,  entropyMult: 1.8, valueMult: 0.65 },
  { label: 'TECH DEBT',      featureProb: 0.03,  entropyMult: 3.0, valueMult: 0.35 },
  { label: 'ENTROPY CRISIS', featureProb: 0.015, entropyMult: 5.0, valueMult: 0.12 },
];
