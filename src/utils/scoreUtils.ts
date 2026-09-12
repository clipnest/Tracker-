import { Habit, HabitRecord, SavingsGoal, SavingsTransaction } from '../db/database';
import { isHabitScheduledForDate } from './streakUtils';

// Returns 0-100, or -1 if no data at all (empty state)
export const calculateDailyScore = (
  todayHabits: Habit[],
  todayRecords: HabitRecord[],
  goals: SavingsGoal[],
  todayTransactions: SavingsTransaction[],
  _date: string
): number => {
  const hasHabits = todayHabits.length > 0;
  const hasGoals = goals.length > 0;

  if (!hasHabits && !hasGoals) return -1;

  let habitScore = 100;
  if (hasHabits) {
    const done = todayRecords.filter(r =>
      todayHabits.some(h => h.id === r.habitId) &&
      (r.status === 'completed' || r.status === 'maintained')
    ).length;
    habitScore = (done / todayHabits.length) * 100;
  }

  let savingsScore = 50; // neutral if no activity
  if (hasGoals) {
    savingsScore = todayTransactions.length > 0 ? 85 : 30;
  }

  if (!hasHabits) return Math.round(savingsScore);
  if (!hasGoals) return Math.round(habitScore);
  return Math.round(habitScore * 0.7 + savingsScore * 0.3);
};
