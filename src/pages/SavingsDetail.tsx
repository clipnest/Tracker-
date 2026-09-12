import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { savingsService } from '../db/savingsService';
import { useSnackbar } from '../contexts/SnackbarContext';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import Dialog from '../components/ui/Dialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SavingsForm from '../components/savings/SavingsForm';
import { formatRupees, rupeesToPaise } from '../utils/moneyUtils';
import { getToday, formatDateReadable, diffDays } from '../utils/dateUtils';
import { ArrowLeftIcon, EditIcon, TrashIcon, UndoIcon } from '../components/ui/Icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function SavingsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const today = getToday();

  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  const goal = useLiveQuery(() => id ? db.savingsGoals.get(Number(id)) : undefined, [id]);
  const transactions = useLiveQuery(() => id ? db.savingsTransactions.where('goalId').equals(Number(id)).toArray() : [], [id]) || [];

  if (!goal) return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/savings')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
        <ArrowLeftIcon size={18} /> Back
      </button>
      <p style={{ color: 'var(--text-secondary)' }}>Goal not found.</p>
    </div>
  );

  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentBalance / goal.targetAmount) * 100)) : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentBalance);
  const isComplete = goal.currentBalance >= goal.targetAmount || goal.status === 'completed';

  const deposits = transactions.filter(t => t.type === 'deposit');
  let projectionText = 'Not enough data yet.';
  if (deposits.length >= 2) {
    const sorted = [...deposits].sort((a, b) => a.date.localeCompare(b.date));
    const days = Math.max(1, diffDays(sorted[0].date, sorted[sorted.length - 1].date));
    const totalDeposited = deposits.reduce((s, t) => s + t.amount, 0);
    const dailyRate = totalDeposited / days;
    if (dailyRate > 0 && remaining > 0) {
      const daysNeeded = Math.round(remaining / dailyRate);
      if (daysNeeded > 36500) projectionText = 'At current rate, this will take a very long time.';
      else {
        const projected = new Date();
        projected.setDate(projected.getDate() + daysNeeded);
        projectionText = `At current rate, goal by ${projected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`;
      }
    } else if (!remaining) projectionText = 'Goal achieved! 🎉';
  }

  const totalDeposited = deposits.reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const depositDates = [...new Set(deposits.map(t => t.date))];
  const avgDaily = depositDates.length > 1 ? Math.round(totalDeposited / Math.max(1, diffDays(depositDates[0], depositDates[depositDates.length - 1]) + 1)) : 0;

  const handleDeposit = async (paise: number) => {
    if (paise <= 0) return;
    try {
      await savingsService.deposit(goal.id!, paise, today);
      showSnackbar(`${formatRupees(paise)} saved! 💰`, 'success');
    } catch (err) { showSnackbar(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleWithdraw = async () => {
    const paise = rupeesToPaise(parseFloat(withdrawAmount) || 0);
    if (paise <= 0) { showSnackbar('Enter a valid amount', 'error'); return; }
    if (paise > goal.currentBalance) { showSnackbar('Insufficient balance', 'error'); return; }
    try {
      await savingsService.withdraw(goal.id!, paise, today, withdrawNote || undefined);
      showSnackbar(`${formatRupees(paise)} withdrawn`, 'info');
      setShowWithdraw(false); setWithdrawAmount(''); setWithdrawNote('');
    } catch (err) { showSnackbar(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    await savingsService.deleteGoal(goal.id!);
    showSnackbar('Goal deleted', 'info');
    navigate('/savings');
  };

  // Chart data
  const txSorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const chartData = txSorted.map(t => {
    running += t.type === 'deposit' ? t.amount : -t.amount;
    return { date: t.date.slice(5), amount: Math.floor(running / 100) };
  });

  const filteredTx = [...transactions]
    .filter(t => filter === 'all' ? true : filter === 'deposits' ? t.type === 'deposit' : t.type === 'withdrawal')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const grouped: Record<string, typeof filteredTx> = {};
  for (const t of filteredTx) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  const chipSty = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 'var(--radius-full)', border: `1px solid ${active ? 'var(--savings)' : 'var(--border-color)'}`,
    background: active ? 'var(--savings-bg)' : 'var(--bg-elevated)',
    color: active ? 'var(--savings)' : 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500,
    transition: 'all var(--duration-normal)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="slide-up" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
        <button onClick={() => navigate('/savings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--duration-normal)', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <ArrowLeftIcon size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${goal.color}18`, border: `1px solid ${goal.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{goal.icon}</div>
          <div><h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>{goal.name}</h1></div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => setShowEdit(true)} style={{ padding: 8, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all var(--duration-normal)' }}><EditIcon size={16} /></button>
          <button onClick={() => setShowDelete(true)} style={{ padding: 8, borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><TrashIcon size={16} /></button>
        </div>
      </div>

      {/* Hero Balance */}
      <div className="slide-up delay-1" style={{ background: `linear-gradient(135deg, ${goal.color}14 0%, var(--bg-surface) 60%)`, border: `1px solid ${goal.color}30`, borderRadius: 'var(--radius-xl)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${goal.color}08`, pointerEvents: 'none' }} />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>CURRENT BALANCE</p>
        <p style={{ fontSize: 44, fontWeight: 900, color: goal.color, marginBottom: 2, letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums' }}>{formatRupees(goal.currentBalance)}</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18 }}>of {formatRupees(goal.targetAmount)} goal</p>
        <ProgressBar value={pct} height={10} color={isComplete ? 'var(--success)' : goal.color} showLabel animate />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining</p>
            <p style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{formatRupees(remaining)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Date</p>
            <p style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{goal.targetDate}</p>
          </div>
        </div>
        {projectionText && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>{projectionText}</p>}
      </div>

      {/* Analytics strip */}
      <div className="slide-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Saved', val: formatRupees(totalDeposited), color: 'var(--success)' },
          { label: 'Withdrawn', val: formatRupees(totalWithdrawn), color: 'var(--danger)' },
          { label: 'Daily Avg', val: formatRupees(avgDaily), color: 'var(--savings)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: s.color, marginBottom: 3 }}>{s.val}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!isComplete && (
        <Card className="slide-up delay-2" style={{ padding: '18px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>Quick Save</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {QUICK_AMOUNTS.map(amt => (
              <button key={amt} onClick={() => handleDeposit(rupeesToPaise(amt))}
                style={{ flex: '1 0 auto', padding: '10px 8px', borderRadius: 'var(--radius-sm)', background: `${goal.color}12`, border: `1px solid ${goal.color}30`, color: goal.color, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all var(--duration-normal)', minWidth: 70 }}
                onMouseEnter={e => { e.currentTarget.style.background = `${goal.color}25`; e.currentTarget.style.boxShadow = `0 0 12px ${goal.color}35`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${goal.color}12`; e.currentTarget.style.boxShadow = ''; }}>
                +₹{amt}
              </button>
            ))}
            <button onClick={() => setShowCustom(true)}
              style={{ flex: '1 0 auto', padding: '10px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', minWidth: 70 }}>
              Custom
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowWithdraw(true)}
              style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
              Withdraw
            </button>
            <button onClick={async () => { try { await savingsService.undoLastTransaction(goal.id!); showSnackbar('Undone', 'info'); } catch { showSnackbar('Nothing to undo', 'error'); } }}
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UndoIcon size={15} /> Undo
            </button>
          </div>
        </Card>
      )}

      {isComplete && (
        <div className="slide-up delay-2" style={{ background: 'var(--success-bg)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 'var(--radius-xl)', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🎉</p>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)', marginBottom: 6 }}>Goal Achieved!</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You've saved {formatRupees(goal.currentBalance)} toward your {goal.name} goal.</p>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card className="slide-up delay-3">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Savings History</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`sg-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={goal.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={goal.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`₹${v}`, 'Balance']} contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} cursor={{ stroke: 'var(--border-hover)' }} />
              <Area type="monotone" dataKey="amount" stroke={goal.color} strokeWidth={2.5} fill={`url(#sg-${goal.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Transactions */}
      <div className="slide-up delay-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Transactions</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'deposits', 'withdrawals'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={chipSty(filter === f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>
        {Object.keys(grouped).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '28px 0', fontSize: 14 }}>No transactions yet.</p>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, txs]) => (
            <div key={date} style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>{formatDateReadable(date)}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {txs.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'deposit' ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {t.type === 'deposit' ? '↓' : '↑'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{t.type === 'deposit' ? 'Saved' : 'Withdrawn'}</p>
                      {t.note && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.note}</p>}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 15, color: t.type === 'deposit' ? 'var(--success)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.type === 'deposit' ? '+' : '-'}{formatRupees(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title="Edit Goal"><SavingsForm goal={goal} onClose={() => setShowEdit(false)} /></Dialog>
      <Dialog open={showCustom} onClose={() => { setShowCustom(false); setCustomAmount(''); }} title="Custom Amount">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input value={customAmount} onChange={e => setCustomAmount(e.target.value)} type="number" placeholder="Amount in ₹" min="1" autoFocus
            style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '14px', color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, outline: 'none', width: '100%', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowCustom(false); setCustomAmount(''); }} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { const p = rupeesToPaise(parseFloat(customAmount) || 0); if (p > 0) { handleDeposit(p); setShowCustom(false); setCustomAmount(''); } }} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: goal.color, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Save →</button>
          </div>
        </div>
      </Dialog>
      <Dialog open={showWithdraw} onClose={() => { setShowWithdraw(false); setWithdrawAmount(''); setWithdrawNote(''); }} title="Withdraw">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" placeholder="Amount in ₹" min="1" autoFocus
            style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: 16, outline: 'none', width: '100%', fontFamily: 'inherit' }} />
          <input value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} placeholder="Reason (optional)"
            style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%', fontFamily: 'inherit' }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Available: {formatRupees(goal.currentBalance)}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowWithdraw(false); setWithdrawAmount(''); setWithdrawNote(''); }} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleWithdraw} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--danger)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Withdraw</button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Goal" message={`Delete "${goal.name}"? All transactions will be permanently removed.`} confirmLabel="Delete Goal" />
    </div>
  );
}
