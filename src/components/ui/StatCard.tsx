import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function StatCard({ icon, value, label, color = 'var(--text-primary)', style, className }: StatCardProps) {
  return (
    <div className={className} style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      textAlign: 'center',
      boxShadow: 'var(--shadow-xs)',
      ...style,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
