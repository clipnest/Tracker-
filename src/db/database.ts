import Dexie, { type Table } from 'dexie';

export interface Habit {
  id?: number;
  name: string;
  mode: 'good' | 'avoidance';
  type: 'simple' | 'count' | 'duration';
  category: string;
  frequency: HabitFrequency;
  target?: number; // for count/duration types
  targetUnit?: 'reps' | 'minutes' | 'hours';
  startDate: string; // ISO date string YYYY-MM-DD
  color: string;
  icon: string;
  isActive: boolean;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitFrequency {
  type: 'daily' | 'weekdays' | 'weekly_target' | 'monthly_target';
  weekdays?: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  weeklyTarget?: number; // e.g. 3 times per week
  monthlyTarget?: number; // e.g. 20 times per month
}

export interface HabitRecord {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped' | 'missed' | 'maintained' | 'indulged' | 'pending';
  value?: number; // for count/duration
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: number;
  name: string;
  isCustom: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number; // in paise (integer)
  currentBalance: number; // in paise (integer)
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  description?: string;
  icon: string;
  color: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface SavingsTransaction {
  id?: number;
  goalId: number;
  type: 'deposit' | 'withdrawal' | 'adjustment';
  amount: number; // in paise (integer, always positive)
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

export class TrackrDatabase extends Dexie {
  habits!: Table<Habit>;
  habitRecords!: Table<HabitRecord>;
  categories!: Table<Category>;
  savingsGoals!: Table<SavingsGoal>;
  savingsTransactions!: Table<SavingsTransaction>;
  settings!: Table<Settings>;

  constructor() {
    super('TrackrDB');
    this.version(1).stores({
      habits: '++id, name, mode, type, category, isActive, isPaused, startDate, createdAt',
      habitRecords: '++id, habitId, date, status, [habitId+date]',
      categories: '++id, name',
      savingsGoals: '++id, name, status, createdAt',
      savingsTransactions: '++id, goalId, type, date, createdAt',
      settings: '++id, &key',
    });
  }
}

export const db = new TrackrDatabase();

// Seed default categories on first run
db.on('populate', async () => {
  const defaultCategories = ['Health', 'Fitness', 'Study', 'Personal', 'Productivity', 'Other'];
  for (const name of defaultCategories) {
    await db.categories.add({ name, isCustom: false, createdAt: new Date().toISOString() });
  }
});
