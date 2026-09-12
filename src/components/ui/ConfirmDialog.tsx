import React from 'react';
import Dialog from './Dialog';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  requireType?: string;
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', confirmVariant = 'danger', requireType,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState('');
  const canConfirm = !requireType || typed === requireType;
  React.useEffect(() => { if (!open) setTyped(''); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth={420}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.65 }}>{message}</p>
      {requireType && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Type <strong style={{ color: 'var(--danger)', fontWeight: 700 }}>{requireType}</strong> to confirm:
          </p>
          <input
            value={typed} onChange={e => setTyped(e.target.value)} placeholder={requireType}
            style={{
              background: 'var(--bg-elevated)', border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text-primary)', fontSize: 15, width: '100%',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
        <Button variant={confirmVariant} size="md" onClick={onConfirm} disabled={!canConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
