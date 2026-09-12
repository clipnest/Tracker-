import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { habitService } from '../db/habitService';
import { useSnackbar } from '../contexts/SnackbarContext';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import Dialog from '../components/ui/Dialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import HabitForm from '../components/habits/HabitForm';
import { getToday, getDateRange, formatDateReadable, addDays } from '../utils/dateUtils';
import { calculateCurrentStreak, calculateBestStreak, getCompletionRate, isHabitScheduledForDate } from '../utils/streakUtils';
import { ArrowLeftIcon, FlameIcon, TrophyIcon, CalendarIcon, EditIcon, TrashIcon, PauseIcon, PlayIcon } from '../components/ui/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Tab = 'overview' | 'calendar' | 'history';

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const today = getToday();
  const [tab, setTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPause, setShowPause] = useState(false);

  const habit = useLiveQuery(() => id ? db.habits.get(Number(id)) : undefined, [id]);
  const allRecords = useLiveQuery(() => id ? db.habitRecords.where('habitId').equals(Number(id)).toArray() : [], [id]) || [];

  if (!habit) return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/habits')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
        <ArrowLeftIcon size={18} /> Back
      </button>
      <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Habit not found.</p>
    </div>
  );

  const streak = calculateCurrentStreak(habit, allRecords);
  const bestStreak = calculateBestStreak(habit, allRecords);
  const completion = getCompletionRate(habit, allRecords);
  const todayRecord = allRecords.find(r => r.date === today);
  const isDone = todayRecord?.status === 'completed' || todayRecord?.status === 'maintained';

  const handleAction = async (action: 'complete' | 'maintain' | 'indulge' | 'skip' | 'undo', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (action === 'undo') {
        await habitService.undoHabitRecord(habit.id!, today);
        showSnackbar('Action undone', 'info');
      } else {
        const statusMap = { complete: 'completed', maintain: 'maintained', indulge: 'indulged', skip: 'skipped' } as const;
        await habitService.recordHabitAction(habit.id!, today, statusMap[action]);
        showSnackbar(action === 'complete' ? '✅ Done!' : action === 'maintain' ? '🛡️ Maintained!' : action === 'indulge' ? 'Logged' : 'Skipped', action === 'complete' || action === 'maintain' ? 'success' : 'info');
      }
    } catch { showSnackbar('Failed', 'error'); }
  };

  const handleDelete = async () => {
    await habitService.deleteHabit(habit.id!);
    showSnackbar('Habit deleted', 'info');
    navigate('/habits');
  };

  const handleTogglePause = async () => {
    await habitService.togglePause(habit.id!, !habit.isPaused);
    showSnackbar(habit.isPaused ? 'Habit resumed' : 'Habit paused', 'info');
    setShowPause(false);
  };

  // 12-week bar chart
  const weeklyBars = (() => {
    const bars = [];
    for (let w = 11; w >= 0; w--) {
      const start = new Date();
      start.setDate(start.getDate() - w * 7 - start.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const dates = getDateRange(startStr, endStr);
      let scheduled = 0, done = 0;
      for (const d of dates) {
        if (isHabitScheduledForDate(habit, d)) {
          scheduled++;
          const rec = allRecords.find(r => r.date === d);
          if (rec && (rec.status === 'completed' || rec.status === 'maintained')) done++;
        }
      }
      bars.push({ week: `W${12 - w}`, pct: scheduled > 0 ? Math.round((done / scheduled) * 100) : 0 });
    }
    return bars;
  })();

  // Calendar: last 90 days
  const calStart = addDays(today, -89);
  const calDates = getDateRange(calStart, today);
  const recordMap: Record<string, string> = {};
  for (const r of allRecords) recordMap[r.date] = r.status;

  const getColor = (status?: string) => {
    if (!status) return 'var(--bg-elevated)';
    if (status === 'completed' || status === 'maintained') return habit.color;
    if (status === 'skipped' || status === 'indulged') return 'var(--danger)';
    return 'var(--bg-elevated)';
  };

  // Group cal dates by week rows
  const calWeeks: string[][] = [];
  let week: string[] = [];
  const firstDayOfWeek = new Date(calStart).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) week.push('');
  for (const d of calDates) {
    week.push(d);
    if (week.length === 7) { calWeeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(''); calWeeks.push(week); }

  const sortedHistory = [...allRecords].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, padding: '10px', background: tab === t ? 'var(--bg-elevated)' : 'transparent',
    border: 'none', color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 500,
    borderRadius: 'var(--radius-sm)', transition: 'all var(--duration-normal)',
  });

  const isScheduledToday = isHabitScheduledForDate(habit, today);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="slide-up" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
        <button onClick={() => navigate('/habits')} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--duration-normal)', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <ArrowLeftIcon size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${habit.color}18`, border: `1px solid ${habit.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{habit.icon}</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>{habit.name}</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{habit.category} · {habit.mode} · {typeof habit.frequency === 'string' ? habit.frequency : (habit.frequency as any)?.type || 'custom'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => setShowEdit(true)} style={{ padding: 8, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all var(--duration-normal)' }}><EditIcon size={16} /></button>
          <button onClick={() => setShowPause(true)} style={{ padding: 8, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all var(--duration-normal)' }}>{habit.isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}</button>
          <button onClick={() => setShowDelete(true)} style={{ padding: 8, borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><TrashIcon size={16} /></button>
        </div>
      </div>

      {/* Stats row */}
      <div className="slide-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px 10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <FlameIcon size={16} style={{ color: 'var(--warning)', margin: '0 auto 6px' }} />
          <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--warning)', lineHeight: 1 }}>{streak}</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>Current</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px 10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <TrophyIcon size={16} style={{ color: 'var(--accent-purple-light)', margin: '0 auto 6px' }} />
          <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-purple-light)', lineHeight: 1 }}>{bestStreak}</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>Best</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px 10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <CalendarIcon size={16} style={{ color: 'var(--success)', margin: '0 auto 6px' }} />
          <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>{completion}%</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>Rate</p>
        </div>
      </div>

      {/* Today's action */}
      {isScheduledToday && !habit.isPaused && (
        <Card className="slide-up delay-2" style={{ padding: '16px', borderLeft: `3px solid ${habit.color}` }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>TODAY</p>
          {todayRecord ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: isDone ? 'var(--success-bg)' : 'var(--warning-bg)', border: `1px solid ${isDone ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}`, color: isDone ? 'var(--success)' : 'var(--warning)', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
                {todayRecord.status === 'completed' ? '✅ Completed' : todayRecord.status === 'maintained' ? '🛡️ Maintained' : todayRecord.status === 'indulged' ? '⚠️ Indulged' : '⏭️ Skipped'}
              </div>
              <button onClick={e => handleAction('undo', e)} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>↩ Undo</button>
            </div>
          ) : habit.mode === 'good' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={e => handleAction('complete', e)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: `${habit.color}18`, border: `1px solid ${habit.color}35`, color: habit.color, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all var(--duration-normal)' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${habit.color}30`; e.currentTarget.style.boxShadow = `0 0 16px ${habit.color}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${habit.color}18`; e.currentTarget.style.boxShadow = ''; }}>
                ✓ Mark Done
              </button>
              <button onClick={e => handleAction('skip', e)} style={{ padding: '11px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Skip</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={e => handleAction('maintain', e)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'var(--success-bg)', border: '1px solid rgba(74,222,128,0.25)', color: 'var(--success)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                🛡️ Maintained
              </button>
              <button onClick={e => handleAction('indulge', e)} style={{ padding: '11px 14px', borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)', fontSize: 13, cursor: 'pointer' }}>Indulged</button>
            </div>
          )}
        </Card>
      )}

      {/* Tabs */}
      <div className="slide-up delay-2" style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 4 }}>
        {(['overview', 'calendar', 'history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>All-time Completion</h3>
                <span style={{ fontSize: 20, fontWeight: 900, color: habit.color }}>{completion}%</span>
              </div>
              <ProgressBar value={completion} height={10} color={habit.color} animate gradient={completion > 0} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>Total Done</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{allRecords.filter(r => r.status === 'completed' || r.status === 'maintained').length}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>Tracked Days</p>
                <p style={{ fontSize: 22, fontWeight: 800 }}>{allRecords.length}</p>
              </div>
            </div>
          </Card>

          {weeklyBars.length > 0 && (
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>12-Week Performance</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyBars} margin={{ top: 0, right: 0, bottom: 0, left: -24 }} barSize={18}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12, boxShadow: 'var(--shadow-lg)' }} formatter={(v: number) => [`${v}%`, 'Completion']} />
                  <Bar dataKey="pct" radius={[4, 4, 2, 2]}>
                    {weeklyBars.map((d, i) => (
                      <Cell key={i} fill={d.pct >= 80 ? habit.color : d.pct >= 50 ? `${habit.color}88` : d.pct > 0 ? `${habit.color}44` : 'var(--bg-elevated)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Calendar */}
      {tab === 'calendar' && (
        <Card className="fade-in">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Last 90 Days</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: habit.color, marginRight: 4 }} />Done
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--danger)', margin: '0 4px 0 10px' }} />Missed
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} style={{ fontSize: 9, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>{d}</span>
              ))}
            </div>
            {calWeeks.map((wk, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {wk.map((d, di) => (
                  <div key={di} title={d || undefined} style={{
                    aspectRatio: '1', borderRadius: 4,
                    background: d ? getColor(recordMap[d]) : 'transparent',
                    opacity: !d ? 0 : !recordMap[d] && isHabitScheduledForDate(habit, d) && d < today ? 0.25 : 1,
                    border: d === today ? '1.5px solid var(--text-muted)' : 'none',
                    transition: 'transform var(--duration-fast)',
                  }} />
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '28px 0', fontSize: 14 }}>No history yet.</p>
          ) : sortedHistory.map(r => {
            const statusColors: Record<string, string> = {
              completed: 'var(--success)', maintained: 'var(--success)',
              skipped: 'var(--text-muted)', indulged: 'var(--danger)',
            };
            const statusLabels: Record<string, string> = {
              completed: '✅ Completed', maintained: '🛡️ Maintained',
              skipped: '⏭️ Skipped', indulged: '⚠️ Indulged',
            };
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${statusColors[r.status] || 'var(--text-muted)'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {r.status === 'completed' || r.status === 'maintained' ? '✓' : r.status === 'indulged' ? '✗' : '–'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: statusColors[r.status] || 'var(--text-muted)' }}>{statusLabels[r.status] || r.status}</p>
                  {r.note && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.note}</p>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{formatDateReadable(r.date)}</span>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title="Edit Habit">
        <HabitForm habit={habit} onClose={() => setShowEdit(false)} />
      </Dialog>
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Habit" message={`Delete "${habit.name}"? All records will be permanently removed.`} confirmLabel="Delete" />
      <ConfirmDialog open={showPause} onClose={() => setShowPause(false)} onConfirm={handleTogglePause} title={habit.isPaused ? 'Resume Habit' : 'Pause Habit'} message={habit.isPaused ? `Resume "${habit.name}"?` : `Pause "${habit.name}"? Streaks won't break while paused.`} confirmLabel={habit.isPaused ? 'Resume' : 'Pause'} confirmVariant="primary" />
    </div>
  );
}
