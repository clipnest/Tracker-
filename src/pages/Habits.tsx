import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db, Habit } from '../db/database';
import { habitService } from '../db/habitService';
import { useSnackbar } from '../contexts/SnackbarContext';
import ProgressBar from '../components/ui/ProgressBar';
import Dialog from '../components/ui/Dialog';
import HabitForm from '../components/habits/HabitForm';
import EmptyState from '../components/ui/EmptyState';
import { getToday } from '../utils/dateUtils';
import { calculateCurrentStreak, getCompletionRate, isHabitScheduledForDate } from '../utils/streakUtils';
import { FlameIcon, PlusIcon, PauseIcon, PlayIcon, EditIcon } from '../components/ui/Icons';

type Filter = 'all' | 'active' | 'paused';

export default function Habits() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const today = getToday();
  const [filter, setFilter] = useState<Filter>('active');
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').reverse().toArray()) || [];
  const allRecords = useLiveQuery(() => db.habitRecords.toArray()) || [];
  const todayRecords = allRecords.filter(r => r.date === today);

  const filtered = habits.filter(h => {
    if (filter === 'active') return h.isActive && !h.isPaused;
    if (filter === 'paused') return h.isPaused;
    return true;
  });

  const handleTogglePause = async (h: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    await habitService.togglePause(h.id!, !h.isPaused);
    showSnackbar(h.isPaused ? 'Habit resumed ▶' : 'Habit paused ⏸', 'info');
  };

  const handleHabitAction = async (habitId: number, action: 'complete' | 'maintain' | 'indulge' | 'skip' | 'undo', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (action === 'undo') {
        await habitService.undoHabitRecord(habitId, today);
        showSnackbar('Action undone', 'info');
      } else {
        const statusMap = { complete: 'completed', maintain: 'maintained', indulge: 'indulged', skip: 'skipped' } as const;
        await habitService.recordHabitAction(habitId, today, statusMap[action]);
        const labels = { complete: '✅ Done!', maintain: '🛡️ Maintained!', indulge: 'Logged', skip: 'Skipped' };
        showSnackbar(labels[action], action === 'complete' || action === 'maintain' ? 'success' : 'info');
      }
    } catch { showSnackbar('Failed to update', 'error'); }
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 18px',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${active ? 'var(--accent-purple)' : 'var(--border-color)'}`,
    background: active ? 'rgba(124,92,252,0.15)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
    transition: 'all var(--duration-normal)',
    boxShadow: active ? '0 0 12px rgba(124,92,252,0.2)' : 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Header */}
      <div className="slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, letterSpacing: '-0.5px' }}>Habits</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>
            {habits.filter(h => h.isActive && !h.isPaused).length} active
          </p>
        </div>
        <button
          onClick={() => { setEditHabit(undefined); setShowForm(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            borderRadius: 'var(--radius-sm)', background: 'var(--accent-gradient)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: 700, boxShadow: 'var(--shadow-accent)',
            transition: 'all var(--duration-normal)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-accent-lg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-accent)'; }}
        >
          <PlusIcon size={15} /> New
        </button>
      </div>

      {/* Filter chips */}
      <div className="slide-up delay-1" style={{ display: 'flex', gap: 8 }}>
        {(['all', 'active', 'paused'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={chipStyle(filter === f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              {f === 'all' ? habits.length : f === 'active' ? habits.filter(h => h.isActive && !h.isPaused).length : habits.filter(h => h.isPaused).length}
            </span>
          </button>
        ))}
      </div>

      {/* Habit list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={filter === 'paused' ? 'No paused habits' : 'No habits yet'}
          subtitle={filter !== 'paused' ? 'Create your first habit and start building momentum.' : undefined}
          actionLabel={filter !== 'paused' ? 'Create Habit' : undefined}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="slide-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(habit => {
            const records = allRecords.filter(r => r.habitId === habit.id);
            const streak = calculateCurrentStreak(habit, records);
            const completion = getCompletionRate(habit, records);
            const todayRecord = todayRecords.find(r => r.habitId === habit.id);
            const isScheduled = isHabitScheduledForDate(habit, today);
            const isDone = todayRecord?.status === 'completed' || todayRecord?.status === 'maintained';

            return (
              <div
                key={habit.id}
                onClick={() => navigate(`/habits/${habit.id}`)}
                style={{
                  background: isDone ? `${habit.color}08` : 'var(--bg-surface)',
                  border: `1px solid ${isDone ? `${habit.color}28` : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${habit.color}${isDone ? 'cc' : '55'}`,
                  opacity: habit.isPaused ? 0.6 : 1,
                  transition: 'all var(--duration-normal) var(--ease-out)',
                  boxShadow: 'var(--shadow-xs)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = habit.color + '50'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.borderColor = ''; }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: `${habit.color}18`, border: `1px solid ${habit.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {habit.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</h3>
                      {habit.isPaused && <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-full)', fontWeight: 700, flexShrink: 0 }}>PAUSED</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{habit.category} · {habit.mode}</p>
                  </div>

                  {/* Streak badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {streak > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--warning-bg)', borderRadius: 'var(--radius-full)', padding: '4px 9px', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <FlameIcon size={13} style={{ color: 'var(--warning)' }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warning)' }}>{streak}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); setEditHabit(habit); setShowForm(true); }}
                        style={{ padding: 6, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'all var(--duration-normal)' }}
                        aria-label="Edit">
                        <EditIcon size={13} />
                      </button>
                      <button
                        onClick={e => handleTogglePause(habit, e)}
                        style={{ padding: 6, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'all var(--duration-normal)' }}
                        aria-label={habit.isPaused ? 'Resume' : 'Pause'}>
                        {habit.isPaused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: isScheduled && !habit.isPaused ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>All-time completion</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>{completion}%</span>
                  </div>
                  <ProgressBar value={completion} height={5} color={habit.color} animate />
                </div>

                {/* Actions */}
                {isScheduled && !habit.isPaused && (
                  <div onClick={e => e.stopPropagation()}>
                    {todayRecord ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: isDone ? 'var(--success-bg)' : 'var(--warning-bg)', color: isDone ? 'var(--success)' : 'var(--warning)', fontWeight: 700, fontSize: 13, textAlign: 'center', border: `1px solid ${isDone ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
                          {todayRecord.status === 'completed' ? '✅ Done' : todayRecord.status === 'maintained' ? '🛡️ Maintained' : todayRecord.status === 'indulged' ? '⚠️ Indulged' : '⏭️ Skipped'}
                        </div>
                        <button onClick={e => handleHabitAction(habit.id!, 'undo', e)} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>↩ Undo</button>
                      </div>
                    ) : habit.mode === 'good' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={e => handleHabitAction(habit.id!, 'complete', e)}
                          style={{ flex: 1, padding: '9px', borderRadius: 10, background: `${habit.color}18`, border: `1px solid ${habit.color}35`, color: habit.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all var(--duration-normal)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${habit.color}30`; e.currentTarget.style.boxShadow = `0 0 12px ${habit.color}40`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${habit.color}18`; e.currentTarget.style.boxShadow = ''; }}>
                          ✓ Done
                        </button>
                        <button onClick={e => handleHabitAction(habit.id!, 'skip', e)} style={{ padding: '9px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Skip</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={e => handleHabitAction(habit.id!, 'maintain', e)}
                          style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'var(--success-bg)', border: '1px solid rgba(74,222,128,0.25)', color: 'var(--success)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          🛡️ Maintained
                        </button>
                        <button onClick={e => handleHabitAction(habit.id!, 'indulge', e)} style={{ padding: '9px 14px', borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--danger)', fontSize: 13, cursor: 'pointer' }}>Indulged</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditHabit(undefined); }} title={editHabit ? 'Edit Habit' : 'New Habit'}>
        <HabitForm habit={editHabit} onClose={() => { setShowForm(false); setEditHabit(undefined); }} />
      </Dialog>
    </div>
  );
}
