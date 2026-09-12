import React, { useRef } from 'react';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { exportData, importData } from '../utils/exportImport';
import { db } from '../db/database';
import { SunIcon, MoonIcon, MonitorIcon, DownloadIcon, UploadIcon, TrashIcon, InfoIcon } from '../components/ui/Icons';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { showSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReset, setShowReset] = React.useState(false);

  const handleExport = async () => {
    try { await exportData(); showSnackbar('Data exported successfully!', 'success'); }
    catch { showSnackbar('Export failed', 'error'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      showSnackbar('Data imported! ✅', 'success');
      window.location.reload();
    } catch (err) { showSnackbar(err instanceof Error ? err.message : 'Import failed', 'error'); }
    e.target.value = '';
  };

  const handleReset = async () => {
    try {
      await db.habits.clear(); await db.habitRecords.clear();
      await db.savingsGoals.clear(); await db.savingsTransactions.clear();
      await db.categories.clear(); await db.settings.clear();
      showSnackbar('All data deleted', 'info');
      window.location.reload();
    } catch { showSnackbar('Reset failed', 'error'); }
  };

  const themeOpts = [
    { value: 'dark' as const, label: 'Dark', icon: <MoonIcon size={20} />, desc: 'Dark mode' },
    { value: 'light' as const, label: 'Light', icon: <SunIcon size={20} />, desc: 'Light mode' },
    { value: 'system' as const, label: 'System', icon: <MonitorIcon size={20} />, desc: 'Auto' },
  ];

  const SectionLabel = ({ label }: { label: string }) => (
    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>{label}</p>
  );

  const SettingsRow = ({ icon, label, desc, onClick, danger = false }: { icon: React.ReactNode; label: string; desc?: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
      padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
      textAlign: 'left', borderRadius: 'var(--radius-md)', transition: 'background var(--duration-normal)',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: danger ? 'var(--danger-bg)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: danger ? 'var(--danger)' : 'var(--accent-purple-light)', flexShrink: 0, border: `1px solid ${danger ? 'rgba(248,113,113,0.2)' : 'var(--border-subtle)'}` }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</p>}
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>›</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="slide-up" style={{ paddingTop: 4, marginBottom: 8 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>Settings</h1>
      </div>

      {/* Appearance */}
      <SectionLabel label="Appearance" />
      <Card className="slide-up delay-1" style={{ padding: '18px' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>Theme</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {themeOpts.map(opt => (
            <button key={opt.value} onClick={() => setTheme(opt.value)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '16px 10px', borderRadius: 'var(--radius-md)',
              border: `2px solid ${theme === opt.value ? 'var(--accent-purple)' : 'var(--border-color)'}`,
              background: theme === opt.value ? 'rgba(124,92,252,0.1)' : 'var(--bg-elevated)',
              color: theme === opt.value ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all var(--duration-normal)',
              boxShadow: theme === opt.value ? '0 0 16px rgba(124,92,252,0.2)' : 'none',
            }}>
              {opt.icon}
              <span style={{ fontSize: 13, fontWeight: theme === opt.value ? 700 : 500 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Data */}
      <SectionLabel label="Data" />
      <Card className="slide-up delay-2" style={{ padding: '6px 6px' }}>
        <SettingsRow icon={<DownloadIcon size={18} />} label="Export Data" desc="Download trackr-backup.json" onClick={handleExport} />
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 16px' }} />
        <SettingsRow icon={<UploadIcon size={18} />} label="Import Data" desc="Restore from a backup file" onClick={() => fileInputRef.current?.click()} />
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 16px' }} />
        <SettingsRow icon={<TrashIcon size={18} />} label="Reset All Data" desc="Permanently delete everything" onClick={() => setShowReset(true)} danger />
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </Card>

      {/* About */}
      <SectionLabel label="About" />
      <Card className="slide-up delay-3" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-accent)' }}>⚡</div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>Trackr</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Version 1.0.0</p>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
          A premium habit tracker and savings goal app built for your personal productivity.
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <InfoIcon size={15} style={{ color: 'var(--accent-purple-light)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            All your data is stored locally on your device. No accounts, no cloud, no tracking — completely private.
          </p>
        </div>
      </Card>

      <ConfirmDialog open={showReset} onClose={() => setShowReset(false)} onConfirm={handleReset} title="Reset All Data" message="This will permanently delete all your habits, records, savings goals, and transactions. This cannot be undone." confirmLabel="Delete Everything" requireType="DELETE" />
    </div>
  );
}
