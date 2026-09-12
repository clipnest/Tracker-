import React, { useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Dialog({ open, onClose, title, children, maxWidth = 520 }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,5,15,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label={title}
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          width: '100%', maxWidth,
          maxHeight: '92vh',
          overflow: 'auto',
          padding: 'var(--space-6)',
          animation: 'dialog-in 0.25s cubic-bezier(0.34,1.36,0.64,1) both',
          boxShadow: 'var(--shadow-xl), 0 0 0 1px rgba(124,92,252,0.08)',
          position: 'relative',
        }}
      >
        {title && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 'var(--space-5)',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
                transition: 'all var(--duration-normal)',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <XIcon size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
