import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' | 'success' | 'savings';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  stopPropagation?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--accent-gradient)',
    color: '#fff',
    boxShadow: 'var(--shadow-accent)',
  },
  secondary: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  danger: {
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    border: '1px solid rgba(248,113,113,0.25)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
  },
  icon: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    borderRadius: '50%',
    border: '1px solid var(--border-color)',
    padding: '8px',
  },
  success: {
    background: 'var(--success-bg)',
    color: 'var(--success)',
    border: '1px solid rgba(74,222,128,0.25)',
  },
  savings: {
    background: 'var(--savings-bg)',
    color: 'var(--savings)',
    border: '1px solid rgba(34,211,238,0.25)',
  },
};

const SIZES: Record<string, React.CSSProperties> = {
  xs: { padding: '4px 10px', fontSize: '12px', borderRadius: '8px' },
  sm: { padding: '7px 14px', fontSize: '13px', borderRadius: '10px' },
  md: { padding: '10px 18px', fontSize: '14px', borderRadius: '12px' },
  lg: { padding: '14px 28px', fontSize: '15px', borderRadius: '14px' },
};

export default function Button({
  children, variant = 'primary', size = 'md', stopPropagation = false,
  onClick, style, disabled, fullWidth, ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation();
    onClick?.(e);
  };

  const isIcon = variant === 'icon';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `all var(--duration-normal) var(--ease-out)`,
        outline: 'none',
        border: 'none',
        letterSpacing: '0.1px',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...VARIANTS[variant],
        ...(isIcon ? {} : SIZES[size]),
        ...style,
      }}
      onMouseEnter={e => {
        if (disabled) return;
        const el = e.currentTarget;
        el.style.transform = 'translateY(-1px)';
        el.style.filter = 'brightness(1.08)';
        if (variant === 'primary') el.style.boxShadow = 'var(--shadow-accent-lg)';
      }}
      onMouseLeave={e => {
        if (disabled) return;
        const el = e.currentTarget;
        el.style.transform = '';
        el.style.filter = '';
        if (variant === 'primary') el.style.boxShadow = 'var(--shadow-accent)';
      }}
      onMouseDown={e => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={e => {
        if (disabled) return;
        e.currentTarget.style.transform = '';
      }}
      {...props}
    >
      {children}
    </button>
  );
}
