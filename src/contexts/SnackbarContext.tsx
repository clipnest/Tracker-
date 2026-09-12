import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type SnackbarType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; message: string; type: SnackbarType; }

interface SnackbarContextValue {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({ showSnackbar: () => {} });
export const useSnackbar = () => useContext(SnackbarContext);

let nextId = 0;

const typeConfig: Record<SnackbarType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'rgba(22,28,22,0.96)', border: 'rgba(74,222,128,0.3)', text: 'var(--success)', icon: '✅' },
  error:   { bg: 'rgba(28,18,18,0.96)', border: 'rgba(248,113,113,0.3)', text: 'var(--danger)',  icon: '❌' },
  info:    { bg: 'rgba(18,18,30,0.96)', border: 'var(--border-accent)',   text: 'var(--accent-purple-light)', icon: 'ℹ️' },
  warning: { bg: 'rgba(28,24,14,0.96)', border: 'rgba(251,191,36,0.3)',   text: 'var(--warning)', icon: '⚠️' },
};

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {/* Toast stack */}
      <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(380px, calc(100vw - 32px))' }}>
        {toasts.map(toast => {
          const cfg = typeConfig[toast.type];
          return (
            <div key={toast.id} style={{
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'slide-up 0.3s cubic-bezier(0.34,1.36,0.64,1) both',
              display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{toast.message}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: cfg.text }} />
            </div>
          );
        })}
      </div>
    </SnackbarContext.Provider>
  );
}
