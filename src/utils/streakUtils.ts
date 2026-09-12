import { Habit, HabitRecord } from '../db/database';
import { getDayOfWeek } from './dateUtils';

export const isHabitScheduledForDate = (habit: Habit, dateStr: string): boolean => {
  if (!habit.isActive || habit.isPaused) return false;
  if (dateStr < habit.startDate) return false;
  const dayOfWeek = getDayOfWeek(dateStr);
  const freq = habit.frequency;
  if (freq.type === 'daily') return true;
  if (freq.type === 'weekdays') return freq.weekdays?.includes(dayOfWeek) ?? false;
  if (freq.type === 'weekly_target' || freq.type === 'monthly_target') return true;
  return false;
};

const isSuccessStatus = (status: HabitRecord['status']): boolean =>
  status === 'completed' || status === 'maintained';

export const calculateCurrentStreak = (habit: Habit, records: HabitRecord[]): number => {
  const recordMap = new Map<string, HabitRecord['status']>();
  for (const r of records) recordMap.set(r.date, r.status);
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);
  let skippedToday = false;
  for (let i = 0; i < 730; i++) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (dateStr < habit.startDate) break;
    if (isHabitScheduledForDate(habit, dateStr)) {
      const status = recordMap.get(dateStr);
      if (i === 0 && !skippedToday && (!status || status === 'pending')) {
        skippedToday = true;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      if (status && isSuccessStatus(status)) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const calculateBestStreak = (habit: Habit, records: HabitRecord[]): number => {
  if (records.length === 0) return 0;
  const recordMap = new Map<string, HabitRecord['status']>();
  for (const r of records) recordMap.set(r.date, r.status);
  const start = new Date(habit.startDate);
  const today = new Date();
  let best = 0;
  let current = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (isHabitScheduledForDate(habit, dateStr)) {
      const status = recordMap.get(dateStr);
      if (status && isSuccessStatus(status)) {
        current++;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return best;
};

export const getCompletionRate = (habit: Habit, records: HabitRecord[]): number => {
  const start = new Date(habit.startDate);
  const today = new Date();
  const recordMap = new Map<string, HabitRecord['status']>();
  for (const r of records) recordMap.set(r.date, r.status);
  let scheduled = 0;
  let completed = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (isHabitScheduledForDate(habit, dateStr)) {
      scheduled++;
      const status = recordMap.get(dateStr);
      if (status && isSuccessStatus(status)) completed++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return scheduled === 0 ? 100 : Math.round((completed / scheduled) * 100);
};
