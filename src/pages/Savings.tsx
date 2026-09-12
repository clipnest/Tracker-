import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { savingsService } from '../db/savingsService';
import { useSnackbar } from '../contexts/SnackbarContext';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import Dialog from '../components/ui/Dialog';
import SavingsForm from '../components/savings/SavingsForm';
import EmptyState from '../components/ui/EmptyState';
import { getToday, formatDateReadable } from '../utils/dateUtils';
import { formatRupees, rupeesToPaise } from '../utils/moneyUtils';
import { PlusIcon, TargetIcon } from '../components/ui/Icons';

const QUICK_AMOUNTS = [100, 200, 500];

export default function Savings() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const today = getToday();
  const [showForm, setShowForm] = useState(false);
  const [customGoalId, setCustomGoalId] = useState<number | null>(null);
  const [customAmt, setCustomAmt] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const active = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');

  const totalSaved = active.reduce((s, g) => s + g.currentBalance, 0);
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);

  const handleQuickSave = async (goalId: number, paise: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await savingsService.deposit(goalId, paise, today);
      showSnackbar(`${formatRupees(paise)} saved! 💰`, 'success');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const handleCustomSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customGoalId) return;
    const paise = rupeesToPaise(parseFloat(customAmt) || 0);
    if (paise <= 0) { showSnackbar('Enter a valid amount', 'error'); return; }
    try {
      await savingsService.deposit(customGoalId, paise, today);
      showSnackbar(`${formatRupees(paise)} saved! 💰`, 'success');
      setCustomGoalId(null); setCustomAmt('');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Header */}
      <div className="slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, letterSpacing: '-0.5px' }}>Savings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>{active.length} active goal{active.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
          borderRadius: 'var(--radius-sm)', background: 'var(--savings-gradient)',
          color: '#000', border: 'none', cursor: 'pointer', fontSize: 13,
          fontWeight: 700, boxShadow: 'var(--shadow-savings)',
          transition: 'all var(--duration-normal)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(34,211,238,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-savings)'; }}>
          <PlusIcon size={15} /> New Goal
        </button>
      </div>

      {/* Summary bar */}
      {active.length > 0 && (
        <div className="slide-up delay-1">
          <Card variant="accent" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Total Saved</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--savings)', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{formatRupees(totalSaved)}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>of {formatRupees(totalTarget)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}<span style={{ fontSize: 18 }}>%</span></p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>OVERALL</p>
              </div>
            </div>
            <ProgressBar value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} height={8} color="var(--savings)" animate />
          </Card>
        </div>
      )}

      {/* Goal cards */}
      {active.length === 0 && completed.length === 0 ? (
        <EmptyState icon="💰" title="No savings goals yet" subtitle="Create your first goal and start saving toward something meaningful." actionLabel="Create Goal" onAction={() => setShowForm(true)} />
      ) : (
        <div className="slide-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentBalance / goal.targetAmount) * 100) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentBalance);
            const isNearDone = pct >= 90;

            return (
              <div
                key={goal.id}
                onClick={() => navigate(`/savings/${goal.id}`)}
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isNearDone ? `${goal.color}40` : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--duration-normal) var(--ease-out)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                {/* Accent top strip */}
                <div style={{ height: 3, background: `linear-gradient(to right, ${goal.color}, ${goal.color}80)`, width: `${pct}%`, transition: 'width 1s var(--ease-out)' }} />

                <div style={{ padding: '18px 18px 16px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: `${goal.color}18`, border: `1px solid ${goal.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {goal.icon}
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{goal.name}</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Target: {formatDateReadable(goal.targetDate)}</p>
                      </div>
                    </div>
                    {/* Mini progress ring */}
                    <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
                      <svg width="46" height="46" viewBox="0 0 46 46" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="23" cy="23" r="18" fill="none" stroke="var(--bg-elevated)" strokeWidth="4.5" />
                        <circle cx="23" cy="23" r="18" fill="none" stroke={goal.color}
                          strokeWidth="4.5" strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s var(--ease-out)' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: goal.color }}>{Math.round(pct)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 22, fontWeight: 900, color: goal.color, letterSpacing: '-0.5px' }}>{formatRupees(goal.currentBalance)}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>of {formatRupees(goal.targetAmount)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>{formatRupees(remaining)}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>remaining</p>
                    </div>
                  </div>

                  <ProgressBar value={pct} height={7} color={goal.color} animate />

                  {/* Quick save buttons */}
                  <div style={{ display: 'flex', gap: 7, marginTop: 14 }} onClick={e => e.stopPropagation()}>
                    {QUICK_AMOUNTS.map(amt => (
                      <button key={amt} onClick={e => handleQuickSave(goal.id!, rupeesToPaise(amt), e)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)',
                          background: `${goal.color}12`, border: `1px solid ${goal.color}30`,
                          color: goal.color, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          transition: 'all var(--duration-normal)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${goal.color}25`; e.currentTarget.style.boxShadow = `0 0 12px ${goal.color}30`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${goal.color}12`; e.currentTarget.style.boxShadow = ''; }}>
                        +₹{amt}
                      </button>
                    ))}
                    <button onClick={e => { e.stopPropagation(); setCustomGoalId(goal.id!); setCustomAmt(''); }}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'all var(--duration-normal)' }}>
                      Custom
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Completed */}
          {completed.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 8, marginBottom: 4 }}>Completed</h3>
              {completed.map(goal => (
                <div key={goal.id} onClick={() => navigate(`/savings/${goal.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-surface)', border: '1px solid var(--success-bg)', borderRadius: 'var(--radius-md)', cursor: 'pointer', opacity: 0.75 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{goal.icon}</div>
                  <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: 14 }}>{goal.name}</p><p style={{ fontSize: 12, color: 'var(--success)' }}>Goal achieved 🎉</p></div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>{formatRupees(goal.currentBalance)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="New Savings Goal">
        <SavingsForm onClose={() => setShowForm(false)} />
      </Dialog>

      <Dialog open={customGoalId !== null} onClose={() => { setCustomGoalId(null); setCustomAmt(''); }} title="Custom Amount">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input value={customAmt} onChange={e => setCustomAmt(e.target.value)} type="number" placeholder="Enter amount in ₹" autoFocus
            style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '14px', color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, outline: 'none', width: '100%', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setCustomGoalId(null); setCustomAmt(''); }} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCustomSave} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--savings-gradient)', border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Save →</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
