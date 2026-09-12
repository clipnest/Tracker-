import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, style, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={selectId} style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
          color: focused ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
          textTransform: 'uppercase',
          transition: 'color var(--duration-normal)',
        }}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        style={{
          background: 'var(--bg-elevated)',
          border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--accent-purple)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          color: 'var(--text-primary)',
          fontSize: 15, outline: 'none', cursor: 'pointer',
          width: '100%', fontFamily: 'inherit',
          appearance: 'none',
          transition: 'border-color var(--duration-normal), box-shadow var(--duration-normal)',
          boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
          ...style,
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>{error}</span>}
    </div>
  );
}
