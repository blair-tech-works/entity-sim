'use client';

import type { LogEntry } from '../../types/simulation';

interface EventLogProps {
  entries: LogEntry[];
}

const levelStyles: Record<LogEntry['level'], React.CSSProperties> = {
  info: { borderLeftColor: '#1e2530', color: '#4a5568' },
  good: { borderLeftColor: '#3cff8a', color: '#3cff8a' },
  warn: { borderLeftColor: '#ff8c3c', color: '#ff8c3c' },
  crit: { borderLeftColor: '#ff3c3c', color: '#ff3c3c' },
};

export default function EventLog({ entries }: EventLogProps) {
  return (
    <div style={{
      background: '#0d1117',
      height: '100%',
      overflowY: 'auto',
      padding: '10px 14px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: '9px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#4a5568',
        marginBottom: '8px',
      }}>
        Event Log
      </div>
      {entries.map(entry => (
        <div
          key={entry.id}
          style={{
            fontSize: '9px',
            lineHeight: 1.7,
            borderLeft: '2px solid',
            paddingLeft: '8px',
            marginBottom: '2px',
            fontFamily: 'monospace',
            ...levelStyles[entry.level],
          }}
        >
          [Y{entry.year}] {entry.message}
        </div>
      ))}
    </div>
  );
}
