import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hero' | 'stat' | 'glass' | 'elevated' | 'accent';
  noPad?: boolean;
}

const VARIANTS: Record<string, React.CSSProperties> = {
  default: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  hero: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-md)',
  },
  stat: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-xs)',
  },
  glass: {
    background: 'rgba(22,22,42,0.7)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: 'var(--shadow-md)',
  },
  elevated: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-md)',
  },
  accent: {
    background: 'linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(92,110,247,0.07) 100%)',
    border: '1px solid var(--border-accent)',
    boxShadow: 'var(--shadow-sm)',
  },
};

export default function Card({
  children, onClick, style, variant = 'default', noPad = false, className, ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: noPad ? 0 : 'var(--space-5)',
        cursor: onClick ? 'pointer' : 'default',
        transition: `transform var(--duration-normal) var(--ease-out), box-shadow var(--duration-normal) var(--ease-out)`,
        position: 'relative',
        overflow: 'hidden',
        ...VARIANTS[variant],
        ...style,
      }}
      onMouseEnter={onClick ? e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = 'var(--border-hover)';
      } : undefined}
      onMouseLeave={onClick ? e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = VARIANTS[variant].boxShadow as string || '';
        e.currentTarget.style.borderColor = '';
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
