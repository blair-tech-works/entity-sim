'use client';

import { useState, useEffect, useCallback } from 'react';
import { PHASE_LABELS } from '../../lib/constants';

interface PhaseBannerProps {
  onRegister: (callback: (phase: number) => void) => void;
}

export default function PhaseBanner({ onRegister }: PhaseBannerProps) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#e8ff3c');

  const show = useCallback((phase: number) => {
    setText(PHASE_LABELS[phase]);
    setColor(phase === 3 ? '#ff3c3c' : phase === 2 ? '#ff8c3c' : '#e8ff3c');
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
  }, []);

  useEffect(() => {
    onRegister(show);
  }, [onRegister, show]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: 'sans-serif',
      fontSize: '56px',
      fontWeight: 800,
      color,
      letterSpacing: '0.06em',
      textAlign: 'center',
      textShadow: `0 0 40px ${color}66`,
      zIndex: 10,
      pointerEvents: 'none',
      animation: 'fadeInOut 2.5s ease',
      whiteSpace: 'nowrap',
    }}>
      {text}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
