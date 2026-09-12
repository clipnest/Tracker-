import React, { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  animate?: boolean;
  gradient?: boolean;
  style?: React.CSSProperties;
}

export default function ProgressBar({
  value, color = 'var(--accent-purple)', height = 8,
  showLabel = false, animate = true, gradient = false, style
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [displayed, setDisplayed] = useState(animate ? 0 : clamped);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const timeout = setTimeout(() => setDisplayed(clamped), 80);
      return () => clearTimeout(timeout);
    }
    setDisplayed(clamped);
  }, [clamped]);

  const fill = gradient
    ? 'var(--accent-gradient)'
    : color;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <div style={{
        flex: 1, height, borderRadius: height,
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${displayed}%`,
          background: fill,
          borderRadius: height,
          transition: animate ? 'width 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
          boxShadow: clamped > 0 ? `0 0 8px ${color === 'var(--accent-purple)' ? 'var(--accent-glow)' : `${color}40`}` : 'none',
        }} />
      </div>
      {showLabel && (
        <span style={{
          fontSize: 11, color: 'var(--text-secondary)', minWidth: 34,
          textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
