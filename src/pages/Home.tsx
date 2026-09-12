import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { habitService } from '../db/habitService';
import { savingsService } from '../db/savingsService';
import { useSnackbar } from '../contexts/SnackbarContext';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import Dialog from '../components/ui/Dialog';
import HabitForm from '../components/habits/HabitForm';
import SavingsForm from '../components/savings/SavingsForm';
import { getToday, getGreeting, formatDateReadable } from '../utils/dateUtils';
import { calculateDailyScore } from '../utils/scoreUtils';
import { calculateCurrentStreak, calculateBestStreak, getCompletionRate, isHabitScheduledForDate } from '../utils/streakUtils';
import { formatRupees } from '../utils/moneyUtils';
import { FlameIcon, PlusIcon, TrophyIcon, CheckIcon, SavingsIcon, HabitsIcon } from '../components/ui/Icons';

function AnimatedScore({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>();
  const prevVal = useRef(0);

  useEffect(() => {
    const start = prevVal.current;
    const end = value < 0 ? 0 : value;
    const dur = 900;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else prevVal.current = end;
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{displayed}</>;
}

export default function Home() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const today = getToday();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const habits = useLiveQuery(() => db.habits.toArray()) || [];
  const allRecords = useLiveQuery(() => db.habitRecords.toArray()) || [];
  const goals = useLiveQuery(() => db.savingsGoals.filter(g => g.status === 'active').toArray()) || [];
  const allTransactions = useLiveQuery(() => db.savingsTransactions.toArray()) || [];

  const todayRecords = allRecords.filter(r => r.date === today);
  const todayTransactions = allTransactions.filter(t => t.date === today);
  const activeHabits = habits.filter(h => h.isActive && !h.isPaused);
  const todayHabits = activeHabits.filter(h => isHabitScheduledForDate(h, today));
  const score = calculateDailyScore(todayHabits, todayRecords, goals, todayTransactions, today);

  const maxStreak = habits.reduce((max, h) => {
    const records = allRecords.filter(r => r.habitId === h.id);
    return Math.max(max, calculateCurrentStreak(h, records));
  }, 0);
  const bestEver = habits.reduce((max, h) => {
    const records = allRecords.filter(r => r.habitId === h.id);
    return Math.max(max, calculateBestStreak(h, records));
  }, 0);
  const overallCompletion = habits.length > 0
    ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h, allRecords.filter(r => r.habitId === h.id)), 0) / habits.length)
    : 0;

  const totalSaved = goals.reduce((s, g) => s + g.currentBalance, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const savingsPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  const habitDoneCount = todayRecords.filter(r =>
    todayHabits.some(h => h.id === r.habitId) && (r.status === 'completed' || r.status === 'maintained')
  ).length;
  const habitPct = todayHabits.length > 0 ? (habitDoneCount / todayHabits.length) * 100 : 0;

  const displayScore = score < 0 ? 0 : score;
  const scoreColor = displayScore >= 80 ? 'var(--success)' : displayScore >= 50 ? 'var(--accent-purple-light)' : displayScore >= 25 ? 'var(--warning)' : 'var(--text-muted)';

  const R = 58;
  const circumference = 2 * Math.PI * R;

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

  const getHabitRecord = (habitId: number) => todayRecords.find(r => r.habitId === habitId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Header */}
      <div className="slide-up" style={{ paddingTop: 4 }}>
        <h1 style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {getGreeting()} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {formatDateReadable(today)}
          {todayHabits.length > 0 && ` · ${habitDoneCount}/${todayHabits.length} habits done`}
        </p>
      </div>

      {/* Hero: Score + Stats — 2-col on desktop */}
      <div className="slide-up delay-1" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 16,
      }}>
        {/* Score Ring */}
        <Card variant="hero" style={{ padding: '24px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>TODAY'S SCORE</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* SVG Ring */}
            <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r={R} fill="none" stroke="var(--bg-elevated)" strokeWidth="11" />
                <circle cx="65" cy="65" r={R} fill="none" stroke={scoreColor}
                  strokeWidth="11" strokeDasharray={circumference}
                  strokeDashoffset={circumference - (displayScore / 100) * circumference}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
                />
              </svg>
              {/* Glow behind ring */}
              <div style={{
                position: 'absolute', inset: 14,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${scoreColor}12 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: scoreColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedScore value={displayScore} />
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>%</span>
              </div>
            </div>

            {/* Progress details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Habits</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{habitDoneCount}/{todayHabits.length}</span>
                </div>
                <ProgressBar value={habitPct} height={7} gradient={habitPct > 0} animate />
              </div>
              {goals.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Savings</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{Math.round(savingsPct)}%</span>
                  </div>
                  <ProgressBar value={savingsPct} height={7} color="var(--savings)" animate />
                </div>
              )}
              {score < 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Start tracking habits or savings to see your daily score.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Stat grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard
              icon={<FlameIcon size={18} style={{ color: 'var(--warning)' }} />}
              value={maxStreak}
              label="Current Streak"
              color="var(--warning)"
            />
            <StatCard
              icon={<TrophyIcon size={18} style={{ color: 'var(--accent-purple-light)' }} />}
              value={bestEver}
              label="Best Streak"
              color="var(--accent-purple-light)"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard
              icon={<CheckIcon size={18} style={{ color: 'var(--success)' }} />}
              value={`${overallCompletion}%`}
              label="Completion"
              color="var(--success)"
            />
            <StatCard
              icon={<SavingsIcon size={18} style={{ color: 'var(--savings)' }} />}
              value={formatRupees(totalSaved)}
              label="Total Saved"
              color="var(--savings)"
            />
          </div>
        </div>
      </div>

      {/* Today's Habits */}
      <div className="slide-up delay-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.2px' }}>Today's Habits</h2>
          <button
            onClick={e => { e.stopPropagation(); navigate('/habits'); }}
            style={{ fontSize: 13, color: 'var(--accent-purple-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            View all →
          </button>
        </div>

        {todayHabits.length === 0 ? (
          <Card variant="default" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <HabitsIcon size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: 14, fontSize: 14 }}>No habits scheduled for today.</p>
            <button onClick={() => setShowHabitForm(true)}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: 'var(--shadow-accent)' }}>
              + Create Habit
            </button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayHabits.slice(0, isMobile ? 5 : 8).map(habit => {
              const record = getHabitRecord(habit.id!);
              const isDone = record?.status === 'completed' || record?.status === 'maintained';
              const isSkipped = record?.status === 'skipped' || record?.status === 'indulged';
              const streak = calculateCurrentStreak(habit, allRecords.filter(r => r.habitId === habit.id));

              return (
                <div
                  key={habit.id}
                  onClick={() => navigate(`/habits/${habit.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isDone ? `${habit.color}0d` : 'var(--bg-surface)',
                    border: `1px solid ${isDone ? `${habit.color}30` : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all var(--duration-normal) var(--ease-out)',
                    borderLeft: `3px solid ${isDone ? habit.color : isSkipped ? 'var(--text-muted)' : habit.color + '60'}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: `${habit.color}18`, border: `1px solid ${habit.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                    {habit.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {habit.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{habit.category}</span>
                      {streak > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
                          <FlameIcon size={11} /> {streak}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {record ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 'var(--radius-full)',
                          background: isDone ? 'var(--success-bg)' : 'var(--bg-elevated)',
                          color: isDone ? 'var(--success)' : 'var(--text-muted)',
                          fontWeight: 700, border: `1px solid ${isDone ? 'rgba(74,222,128,0.2)' : 'var(--border-color)'}`,
                        }}>
                          {isDone ? (record.status === 'completed' ? '✓ Done' : '✓ Kept') : record.status === 'skipped' ? 'Skipped' : 'Indulged'}
                        </span>
                        <button
                          onClick={e => handleHabitAction(habit.id!, 'undo', e)}
                          style={{ fontSize: 14, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                          aria-label="Undo">↩</button>
                      </div>
                    ) : habit.mode === 'good' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={e => handleHabitAction(habit.id!, 'complete', e)}
                          style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: `${habit.color}20`, color: habit.color, border: `1px solid ${habit.color}40`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all var(--duration-normal)' }}>
                          Done
                        </button>
                        <button
                          onClick={e => handleHabitAction(habit.id!, 'skip', e)}
                          style={{ padding: '6px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontSize: 12, cursor: 'pointer' }}>
                          Skip
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={e => handleHabitAction(habit.id!, 'maintain', e)}
                          style={{ padding: '6px 10px', borderRadius: 'var(--radius-full)', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.25)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          ✓ Kept
                        </button>
                        <button
                          onClick={e => handleHabitAction(habit.id!, 'indulge', e)}
                          style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 12, cursor: 'pointer' }}>
                          ✗
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Savings Strip */}
      {goals.length > 0 && (
        <div className="slide-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Savings Goals</h2>
            <button onClick={e => { e.stopPropagation(); navigate('/savings'); }}
              style={{ fontSize: 13, color: 'var(--savings)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              View all →
            </button>
          </div>
          <Card variant="default" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Total Saved</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--savings)', letterSpacing: '-0.5px' }}>{formatRupees(totalSaved)}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>of {formatRupees(totalTarget)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Goals</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{goals.length}</p>
              </div>
            </div>
            <ProgressBar value={savingsPct} height={8} color="var(--savings)" showLabel animate />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {goals.slice(0, 3).map(g => (
                <span key={g.id} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {g.icon} {g.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="slide-up delay-4">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Quick Add</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '🎯', label: 'New Habit', color: 'var(--accent-purple)', glow: 'var(--accent-glow)', action: () => setShowHabitForm(true) },
            { icon: '💰', label: 'Savings Goal', color: 'var(--savings)', glow: 'var(--savings-glow)', action: () => setShowSavingsForm(true) },
          ].map(({ icon, label, color, glow, action }) => (
            <button key={label} onClick={action} style={{
              padding: '18px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              color: 'var(--text-secondary)',
              transition: 'all var(--duration-normal) var(--ease-out)',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.background = `${color}0a`;
              e.currentTarget.style.boxShadow = `0 0 20px ${glow}`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.transform = '';
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `1px solid ${color}30` }}>{icon}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
              <PlusIcon size={14} style={{ color }} />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={showHabitForm} onClose={() => setShowHabitForm(false)} title="New Habit">
        <HabitForm onClose={() => setShowHabitForm(false)} />
      </Dialog>
      <Dialog open={showSavingsForm} onClose={() => setShowSavingsForm(false)} title="New Savings Goal">
        <SavingsForm onClose={() => setShowSavingsForm(false)} />
      </Dialog>
    </div>
  );
}
