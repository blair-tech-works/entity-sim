'use client';

import { useState } from 'react';

const REFERENCES = [
  {
    label: 'Defect rates',
    detail: 'Capers Jones benchmarking data — 0.5 bugs/feature baseline, 7% bug-fix regression rate',
  },
  {
    label: 'Maintenance burden',
    detail: 'Gartner lifecycle research — maintenance grows from 15% (early) to 35% (mature) of total effort',
  },
  {
    label: 'Productivity loss',
    detail: 'Chalmers University (Besker et al., 2019) — 23% average developer productivity lost to technical debt',
  },
  {
    label: 'Code growth',
    detail: 'Herraiz et al. — codebase doubles every 42 months',
  },
  {
    label: 'Defect density',
    detail: 'IEEE study of 109 OSS projects — 7.47 defects/KLOC mean',
  },
  {
    label: 'Entropy correlation',
    detail: 'ArXiv 2504.18511 — 0.54 Pearson correlation between code change entropy and defect counts',
  },
  {
    label: 'Team performance',
    detail: 'DORA/Accelerate — elite teams: <5% change failure rate vs low performers: 46-60%',
  },
  {
    label: 'Issue tracking',
    detail: 'SmartSHARK dataset (38+ Apache Java projects) and Public JIRA Dataset (2.7M issues across 1,822 projects)',
  },
  {
    label: 'Time allocation',
    detail: 'Stripe Developer Coefficient (2018) — developers spend 42% of time on technical debt',
  },
];

export default function ReferencesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderTop: '1px solid #1e2530',
      background: '#0d1117',
      flexShrink: 0,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '6px 24px',
          cursor: 'pointer',
          fontFamily: "'Space Mono', 'Courier New', monospace",
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4a5568',
          textAlign: 'left',
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          border: '1px solid #2d3748',
          borderRadius: '50%',
          fontSize: '8px',
          color: '#718096',
          flexShrink: 0,
        }}>ℹ</span>
        <span>Research &amp; Data Sources</span>
        <span style={{ marginLeft: 4, fontSize: '8px', color: '#2d3748' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          padding: '12px 24px 16px',
          borderTop: '1px solid #1a2030',
        }}>
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#e8ff3c',
            fontWeight: 700,
            marginBottom: 10,
          }}>
            DATA-DRIVEN SIMULATION
          </div>
          <div style={{
            fontSize: '9px',
            color: '#4a5568',
            marginBottom: 10,
            letterSpacing: '0.04em',
          }}>
            This simulation is calibrated using empirical software engineering research:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '6px 32px',
          }}>
            {REFERENCES.map(({ label, detail }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#2d3748', flexShrink: 0, lineHeight: '16px' }}>•</span>
                <span style={{ fontSize: '9px', color: '#4a5568', lineHeight: '16px' }}>
                  <span style={{ color: '#718096', fontWeight: 700 }}>{label}:</span>
                  {' '}{detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
