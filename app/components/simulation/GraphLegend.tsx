'use client';

import { useState, useRef, useEffect } from 'react';

// ─── Research data ───────────────────────────────────────────────────────────

const NODE_COLORS = [
  { color: '#3cb8ff', label: 'New Component', ratio: '< 0.3' },
  { color: '#3cff8a', label: 'Healthy', ratio: '0.3–0.6' },
  { color: '#e8ff3c', label: 'Moderate Debt', ratio: '0.6–1.0' },
  { color: '#ff8c3c', label: 'High Entropy', ratio: '1.0–1.8' },
  { color: '#ff3c3c', label: 'Critical', ratio: '> 1.8' },
];

interface ResearchSource {
  name: string;
  topic: string;
  citation: string;
  uses: { constant: string; value: string; label: string }[];
  mapping: string;
}

const RESEARCH_SOURCES: ResearchSource[] = [
  {
    name: 'Capers Jones',
    topic: 'Software Defect Economics',
    citation: 'Applied Software Measurement (3rd ed., McGraw-Hill, 2008); The Economics of Software Quality (Addison-Wesley, 2011). Based on 12,000+ projects from 24 countries.',
    uses: [
      { constant: 'BUGS_PER_FEATURE', value: '0.5', label: 'Delivered defects per FP (commercial software)' },
      { constant: 'BUG_FIX_REGRESSION_RATE', value: '0.07', label: '7% of bug fixes introduce new defects (U.S. avg; range: <1% to 25%)' },
    ],
    mapping: 'Feature shipping injects entropy probabilistically. Bug-fix regression means even remediation adds entropy — the "fix one, break one" dynamic that accelerates in later phases.',
  },
  {
    name: 'Besker, Martini & Bosch (2019)',
    topic: 'Tech Debt Productivity Loss',
    citation: 'Journal of Systems and Software, 156, 41–61. DOI: 10.1016/j.jss.2019.06.004. Longitudinal study: 43 developers reported twice weekly for 7 weeks. Replicated with independent dataset.',
    uses: [
      { constant: 'TECH_DEBT_PRODUCTIVITY_LOSS', value: '0.23', label: '23% of developer time lost to technical debt' },
    ],
    mapping: 'Feature delivery probability drops from 0.12 (Growth) to 0.015 (Crisis) — an 87.5% reduction modeling how TD compounds beyond the baseline 23%.',
  },
  {
    name: 'Gartner',
    topic: 'Lifecycle Maintenance Burden',
    citation: 'Gartner analyst reports on application maintenance costs. Broader finding (Boehm, 1981): maintenance = 60–80% of total lifecycle costs.',
    uses: [
      { constant: 'MAINTENANCE_BURDEN_EARLY', value: '0.15', label: '15% maintenance in early lifecycle' },
      { constant: 'MAINTENANCE_BURDEN_MID', value: '0.25', label: '25% maintenance mid-lifecycle' },
      { constant: 'MAINTENANCE_BURDEN_LATE', value: '0.35', label: '35% maintenance in late lifecycle' },
    ],
    mapping: 'Phase-based entropy multipliers scale from 1.0x to 5.0x, modeling the nonlinear cost escalation across the lifecycle.',
  },
  {
    name: 'ArXiv 2504.18511',
    topic: 'Co-Change Entropy & Defect Prediction',
    citation: 'Hrishikesh et al. (2025). "Co-Change Graph Entropy: A New Process Metric for Defect Prediction." Shannon entropy on co-change graphs across 8 Apache projects (SmartSHARK dataset).',
    uses: [
      { constant: 'ENTROPY_DEFECT_CORRELATION', value: '0.54', label: 'Pearson r between co-change entropy and defect count' },
    ],
    mapping: 'Core justification for O(n·f·c): coupling (edges) multiplies entropy, mirroring how co-change graph structure predicts defects.',
  },
  {
    name: 'DORA / Accelerate',
    topic: 'DevOps Performance Tiers',
    citation: 'Forsgren, Humble & Kim, Accelerate (IT Revolution, 2018). 23,000+ respondents. 2019 & 2024 State of DevOps Reports.',
    uses: [
      { constant: 'CHANGE_FAILURE_RATE_ELITE', value: '0.05', label: 'Elite performers: ~5% change failure rate (2024 report)' },
      { constant: 'CHANGE_FAILURE_RATE_LOW', value: '0.50', label: 'Low performers: 46–60% failure rate (2019 report)' },
    ],
    mapping: 'The 10x gap between elite and low models phase transitions. Growth phase = elite-like shipping; Entropy Crisis = low-performer failure rates.',
  },
  {
    name: 'Stripe Developer Coefficient',
    topic: 'Developer Time Allocation',
    citation: 'Stripe (Sept 2018). Harris Poll survey: 1,000+ developers, 1,000+ C-level executives, 5 countries, 30+ industries.',
    uses: [
      { constant: 'TIME_ON_TECH_DEBT', value: '0.42', label: '42% of developer time on tech debt (13.5h/wk debt + 3.8h/wk bad code)' },
    ],
    mapping: 'Validates late-phase behavior where maintenance burden exceeds 40%. The build/maintain slider lets users allocate this split directly.',
  },
  {
    name: 'Hatton, Spinellis & van Genuchten (2017)',
    topic: 'Codebase Growth Rate',
    citation: 'J. Software: Evolution and Process, 29(5), e1847. DOI: 10.1002/smr.1847. Analyzed 404M+ lines of code across open/closed-source systems.',
    uses: [
      { constant: '—', value: '1.21x/yr', label: 'Median compound annual growth rate → doubling every ~42 months' },
    ],
    mapping: 'Node spawn probability accelerates over time (0.0015 × (1 + simYear × 0.3)), growing from 3 to ~40 components over 5 simulated years.',
  },
  {
    name: 'Shah, Morisio & Torchiano (2012)',
    topic: 'Defect Density Across OSS',
    citation: 'IEEE APSEC 2012, pp. 406–415. DOI: 10.1109/APSEC.2012.93. Scoping study: 19 papers, 109 projects (open + closed source).',
    uses: [
      { constant: 'DEFECT_DENSITY_MEAN', value: '7.47', label: '7.47 defects/KLOC mean (median 4.3, SD 7.99)' },
    ],
    mapping: 'High mean + high variance models why some nodes go critical while others stay healthy at the same age. Stochastic bug events reproduce this spread.',
  },
];

const DATASETS = [
  {
    name: 'SmartSHARK',
    description: '38–107 Apache Java projects. Version control, metrics, bug-fix labels, CI data. Maintained by TU Clausthal & University of Gottingen.',
    role: 'Primary validation dataset for the entropy-defect correlation study (ArXiv 2504.18511).',
  },
  {
    name: 'Public JIRA Dataset',
    description: '16 JIRA repositories, 1,822 projects, 2.7M issues, 32M changes. Montgomery et al. (MSR 2022). DOI: 10.1145/3524842.3528486.',
    role: 'Scale evidence that defect patterns generalize beyond small samples.',
  },
];

const EMPHASIS_POINTS = [
  {
    title: 'Coupling as a multiplier',
    text: 'Entropy is O(n·f·c), not O(n+f+c). Every new edge increases entropy growth for all connected nodes.',
  },
  {
    title: 'The compounding trap',
    text: 'Existing TD forces new TD. entropyPerFeature scales from 1.0x to 5.0x across phases — same feature, more debt.',
  },
  {
    title: 'The crossover point',
    text: 'Entropy always exceeds value eventually. Unmanaged complexity guarantees ROI inversion.',
  },
  {
    title: 'Maintenance slows, never cures',
    text: 'Even 100% maintenance allocation only slows entropy growth. Most time goes to understanding debt, not eliminating it.',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function GraphLegend() {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        top: expanded ? 10 : 'auto',
        zIndex: 5,
        maxWidth: expanded ? 520 : 200,
        background: expanded ? 'rgba(13, 17, 23, 0.95)' : 'rgba(13, 17, 23, 0.75)',
        border: '1px solid #1e2530',
        borderRadius: 6,
        overflow: 'hidden',
        transition: 'max-width 0.3s ease, background 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Collapsed: Legend Key ─────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px 8px' }}>
        {/* Node colors */}
        <div style={{
          fontSize: 8,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: '#4a5568',
          marginBottom: 6,
          fontFamily: 'monospace',
        }}>
          Node Health (entropy / value)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
          {NODE_COLORS.map(({ color, label, ratio }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9, color: '#6b7280' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}44` }} />
              <span style={{ minWidth: 36, color: '#4a5568', fontFamily: 'monospace', fontSize: 8 }}>{ratio}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Visual encoding key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 9, color: '#6b7280', borderTop: '1px solid #1e2530', paddingTop: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="#4a5568" strokeWidth="1" /><circle cx="7" cy="7" r="3" fill="none" stroke="#4a5568" strokeWidth="1" /></svg>
            <span>Size = sqrt(features)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="7" x2="12" y2="7" stroke="#4a5568" strokeWidth="1" /></svg>
            <span>Edge = coupling</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffd700', marginLeft: 4, marginRight: 1 }} />
            <span>Worker (engineer)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 10, marginLeft: 2, marginRight: 0, width: 14, textAlign: 'center' }}>⚠</span>
            <span>Bug count badge</span>
          </div>
        </div>

        {/* Formula */}
        <div style={{
          fontFamily: 'monospace',
          fontSize: 9,
          color: '#e8ff3c',
          background: 'rgba(232, 255, 60, 0.06)',
          padding: '5px 8px',
          borderRadius: 3,
          textAlign: 'center',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}>
          Entropy = O(n · f · c)
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%',
            padding: '5px 0',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid #1e2530',
            color: '#e8ff3c',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            fontFamily: 'monospace',
            textAlign: 'center',
          }}
        >
          {expanded ? '▾ Close Research Sources' : '▸ Research Sources'}
        </button>
      </div>

      {/* ── Expanded: Research Panel ─────────────────────────────────────── */}
      {expanded && (
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 14px 14px',
          borderTop: '1px solid #27272a',
        }}>
          {/* Section: Sources */}
          <div style={{
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: '#e8ff3c',
            fontFamily: 'monospace',
            margin: '12px 0 10px',
            fontWeight: 700,
          }}>
            Empirical Sources
          </div>

          {RESEARCH_SOURCES.map((src) => (
            <div key={src.name} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c9d1d9', marginBottom: 2 }}>
                {src.name}
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, fontStyle: 'italic' }}>
                {src.topic} — {src.citation}
              </div>
              {src.uses.map((u) => (
                <div key={u.constant} style={{ fontSize: 10, color: '#a1a1aa', marginBottom: 2, paddingLeft: 8 }}>
                  <span style={{ fontFamily: 'monospace', color: '#3cb8ff', fontSize: 9 }}>{u.constant}</span>
                  {' = '}
                  <span style={{ color: '#e8ff3c', fontWeight: 600 }}>{u.value}</span>
                  {' — '}
                  <span>{u.label}</span>
                </div>
              ))}
              <div style={{ fontSize: 9, color: '#4a5568', paddingLeft: 8, marginTop: 3 }}>
                Sim: {src.mapping}
              </div>
            </div>
          ))}

          {/* Section: Datasets */}
          <div style={{
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: '#e8ff3c',
            fontFamily: 'monospace',
            margin: '16px 0 8px',
            fontWeight: 700,
            borderTop: '1px solid #27272a',
            paddingTop: 12,
          }}>
            Validation Datasets
          </div>

          {DATASETS.map((ds) => (
            <div key={ds.name} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c9d1d9', marginBottom: 2 }}>
                {ds.name}
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                {ds.description}
              </div>
              <div style={{ fontSize: 9, color: '#4a5568' }}>
                Role: {ds.role}
              </div>
            </div>
          ))}

          {/* Section: What the sim emphasizes */}
          <div style={{
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: '#e8ff3c',
            fontFamily: 'monospace',
            margin: '16px 0 8px',
            fontWeight: 700,
            borderTop: '1px solid #27272a',
            paddingTop: 12,
          }}>
            Design Decisions
          </div>

          {EMPHASIS_POINTS.map((pt) => (
            <div key={pt.title} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#c9d1d9' }}>
                {pt.title}
              </div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>
                {pt.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
