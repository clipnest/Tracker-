import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = '✦', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center', padding: '56px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '24px',
        background: 'var(--accent-gradient-soft)',
        border: '1px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, marginBottom: 4,
        boxShadow: '0 0 32px var(--accent-glow)',
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        {subtitle && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md" style={{ marginTop: 8 }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
