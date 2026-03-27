import type { SimConfig } from '../types/simulation';

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
