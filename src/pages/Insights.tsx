import React, { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { formatRupees } from '../utils/moneyUtils';
import { getToday, getDateRange, getWeekStart, diffDays } from '../utils/dateUtils';
import { calculateCurrentStreak, calculateBestStreak, getCompletionRate, isHabitScheduledForDate } from '../utils/streakUtils';
import { FlameIcon, TrophyIcon, TargetIcon, SavingsIcon } from '../components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || 'var(--accent-purple-light)', fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('₹') ? `₹${p.value}` : `${p.value}${p.name === 'Completion' ? '%' : ''}`}
        </p>
      ))}
    </div>
  );
};

export default function Insights() {
  const today = getToday();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const habits = useLiveQuery(() => db.habits.toArray()) || [];
  const allRecords = useLiveQuery(() => db.habitRecords.toArray()) || [];
  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const allTx = useLiveQuery(() => db.savingsTransactions.toArray()) || [];

  const activeHabits = habits.filter(h => h.isActive && !h.isPaused);
  const todayRecords = allRecords.filter(r => r.date === today);
  const todayHabits = activeHabits.filter(h => isHabitScheduledForDate(h, today));
  const todayDone = todayRecords.filter(r => todayHabits.some(h => h.id === r.habitId) && (r.status === 'completed' || r.status === 'maintained')).length;

  const overallCompletion = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + getCompletionRate(h, allRecords.filter(r => r.habitId === h.id)), 0) / habits.length)
    : 0;

  const maxCurrentStreak = habits.reduce((max, h) => Math.max(max, calculateCurrentStreak(h, allRecords.filter(r => r.habitId === h.id))), 0);
  const maxBestStreak = habits.reduce((max, h) => Math.max(max, calculateBestStreak(h, allRecords.filter(r => r.habitId === h.id))), 0);

  const totalDeposited = allTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = allTx.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalDeposited - totalWithdrawn;
  const activeGoals = goals.filter(g => g.status === 'active').length;

  const txDates = [...new Set(allTx.map(t => t.date))].sort();
  const dayRange = txDates.length >= 2 ? Math.max(1, diffDays(txDates[0], txDates[txDates.length - 1]) + 1) : 1;
  const avgDaily = txDates.length > 0 ? Math.round(totalDeposited / dayRange) : 0;
  const avgMonthly = Math.round(avgDaily * 30);

  const weeklyData = useMemo(() => {
    const result = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date();
      start.setDate(start.getDate() - w * 7 - start.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const dates = getDateRange(startStr, endStr);
      let scheduled = 0, done = 0;
      for (const d of dates) {
        for (const h of activeHabits) {
          if (isHabitScheduledForDate(h, d)) {
            scheduled++;
            const rec = allRecords.find(r => r.habitId === h.id && r.date === d);
            if (rec && (rec.status === 'completed' || rec.status === 'maintained')) done++;
          }
        }
      }
      result.push({ label: `W${8 - w}`, pct: scheduled > 0 ? Math.round((done / scheduled) * 100) : 0, done, total: scheduled });
    }
    return result;
  }, [habits, allRecords]);

  // Savings monthly trend
  const savingsTrend = useMemo(() => {
    const months: Record<string, number> = {};
    for (const t of allTx) {
      const key = t.date.slice(0, 7);
      if (!months[key]) months[key] = 0;
      months[key] += t.type === 'deposit' ? t.amount / 100 : -(t.amount / 100);
    }
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([m, v]) => ({
      label: m.slice(5), net: Math.round(v),
    }));
  }, [allTx]);

  const weekStart = getWeekStart(today);
  const weekDates = getDateRange(weekStart, today);
  const habitWeekStats = habits.map(h => {
    const scheduled = weekDates.filter(d => isHabitScheduledForDate(h, d));
    const done = scheduled.filter(d => {
      const r = allRecords.find(x => x.habitId === h.id && x.date === d);
      return r && (r.status === 'completed' || r.status === 'maintained');
    });
    return { habit: h, pct: scheduled.length > 0 ? (done.length / scheduled.length) * 100 : null };
  }).filter(x => x.pct !== null).sort((a, b) => b.pct! - a.pct!);

  const weekTx = allTx.filter(t => t.date >= weekStart && t.date <= today);
  const weekSaved = weekTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 22 }}>
      <div className="slide-up" style={{ paddingTop: 4 }}>
        <h1 style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, letterSpacing: '-0.5px' }}>Insights</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>Your performance at a glance</p>
      </div>

      {/* Top stat row */}
      <div className="slide-up delay-1" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard icon={<FlameIcon size={18} style={{ color: 'var(--warning)' }} />} value={maxCurrentStreak} label="Streak" color="var(--warning)" />
        <StatCard icon={<TrophyIcon size={18} style={{ color: 'var(--accent-purple-light)' }} />} value={maxBestStreak} label="Best Streak" color="var(--accent-purple-light)" />
        <StatCard icon={<TargetIcon size={18} style={{ color: 'var(--success)' }} />} value={`${overallCompletion}%`} label="Completion" color="var(--success)" />
        <StatCard icon={<SavingsIcon size={18} style={{ color: 'var(--savings)' }} />} value={formatRupees(netSavings)} label="Net Saved" color="var(--savings)" />
      </div>

      {/* Weekly habit chart */}
      {habits.length > 0 && (
        <Card className="slide-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Weekly Completion</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Last 8 weeks</p>
            </div>
            <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-purple-light)' }}>{weeklyData[weeklyData.length - 1]?.pct ?? 0}%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }} barSize={isMobile ? 18 : 26}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" name="Completion" radius={[5, 5, 2, 2]}>
                {weeklyData.map((d, i) => (
                  <Cell key={i} fill={d.pct >= 80 ? 'var(--success)' : d.pct >= 50 ? 'var(--accent-purple)' : d.pct > 0 ? 'var(--warning)' : 'var(--bg-elevated)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Savings trend chart */}
      {savingsTrend.length >= 2 && (
        <Card className="slide-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Savings Trend</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Monthly net savings</p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--savings)' }}>{formatRupees(avgMonthly)}<span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>/mo avg</span></span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={savingsTrend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="savings-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--savings)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--savings)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="net" name="₹ Net" stroke="var(--savings)" strokeWidth={2.5} fill="url(#savings-grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Savings stats */}
      {goals.length > 0 && (
        <div className="slide-up delay-3" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Total Saved', value: formatRupees(totalDeposited), color: 'var(--success)' },
            { label: 'Withdrawn', value: formatRupees(totalWithdrawn), color: 'var(--danger)' },
            { label: 'Active Goals', value: activeGoals, color: 'var(--accent-purple-light)' },
            { label: 'Daily Avg', value: formatRupees(avgDaily), color: 'var(--savings)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px 12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Review */}
      <Card className="slide-up delay-4" variant="accent" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>This Week</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {todayHabits.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Today's habits</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: todayDone === todayHabits.length ? 'var(--success)' : 'var(--text-primary)' }}>{todayDone}/{todayHabits.length}</span>
            </div>
          )}
          {habitWeekStats.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>🏆 Best</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>{habitWeekStats[0].habit.icon} {habitWeekStats[0].habit.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(habitWeekStats[0].pct!)}% this week</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>⚠️ Needs Work</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)' }}>{habitWeekStats[habitWeekStats.length - 1].habit.icon} {habitWeekStats[habitWeekStats.length - 1].habit.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(habitWeekStats[habitWeekStats.length - 1].pct!)}%</p>
              </div>
            </div>
          )}
          {goals.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Saved this week</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--savings)' }}>{formatRupees(weekSaved)}</span>
            </div>
          )}
          {habits.length === 0 && goals.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>Start tracking to see your weekly review.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
