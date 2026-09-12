import { db, Habit, HabitRecord } from './database';
import { getDayOfWeek, getToday } from '../utils/dateUtils';

export const habitService = {
  async createHabit(habit: Omit<Habit, 'id'>) {
    return await db.habits.add(habit);
  },

  async updateHabit(id: number, changes: Partial<Habit>) {
    return await db.habits.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteHabit(id: number) {
    await db.transaction('rw', db.habits, db.habitRecords, async () => {
      await db.habits.delete(id);
      await db.habitRecords.where('habitId').equals(id).delete();
    });
  },

  async togglePause(id: number, isPaused: boolean) {
    return await db.habits.update(id, { isPaused, updatedAt: new Date().toISOString() });
  },

  async getHabitsForToday() {
    const today = getToday();
    const allHabits = await db.habits.filter(h => h.isActive && !h.isPaused && h.startDate <= today).toArray();
    return allHabits.filter(h => this.isHabitScheduledForDate(h, today));
  },

  isHabitScheduledForDate(habit: Habit, date: string): boolean {
    if (!habit.isActive || habit.isPaused) return false;
    if (date < habit.startDate) return false;
    
    const dayOfWeek = getDayOfWeek(date);
    const freq = habit.frequency;
    
    if (freq.type === 'daily') return true;
    if (freq.type === 'weekdays') return freq.weekdays?.includes(dayOfWeek) ?? false;
    if (freq.type === 'weekly_target' || freq.type === 'monthly_target') return true;
    return false;
  },

  async recordHabitAction(habitId: number, date: string, status: HabitRecord['status'], value?: number, note?: string) {
    const existing = await db.habitRecords.where({ habitId, date }).first();
    const now = new Date().toISOString();
    
    if (existing && existing.id) {
      await db.habitRecords.update(existing.id, { status, value, note, updatedAt: now });
    } else {
      await db.habitRecords.add({ habitId, date, status, value, note, createdAt: now, updatedAt: now });
    }
  },

  async undoHabitRecord(habitId: number, date: string) {
    const existing = await db.habitRecords.where({ habitId, date }).first();
    if (existing && existing.id) {
      await db.habitRecords.delete(existing.id);
    }
  }
};
