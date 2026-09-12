import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export default function Input({ label, error, helper, style, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
          color: focused ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
          textTransform: 'uppercase',
          transition: 'color var(--duration-normal)',
        }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        style={{
          background: 'var(--bg-elevated)',
          border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--accent-purple)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          color: 'var(--text-primary)',
          fontSize: 15,
          outline: 'none',
          transition: 'border-color var(--duration-normal), box-shadow var(--duration-normal)',
          width: '100%',
          fontFamily: 'inherit',
          boxShadow: focused ? (error ? 'var(--danger-glow)' : '0 0 0 3px var(--accent-glow)') : 'none',
          ...style,
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>{error}</span>}
      {helper && !error && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{helper}</span>}
    </div>
  );
}
