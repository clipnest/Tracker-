import { db } from '../db/database';

export const exportData = async (): Promise<void> => {
  const [habits, habitRecords, categories, savingsGoals, savingsTransactions, settings] = await Promise.all([
    db.habits.toArray(),
    db.habitRecords.toArray(),
    db.categories.toArray(),
    db.savingsGoals.toArray(),
    db.savingsTransactions.toArray(),
    db.settings.toArray(),
  ]);
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits, habitRecords, categories, savingsGoals, savingsTransactions, settings,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trackr-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBackupFile = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  return data.version === 1 && Array.isArray(data.habits) && Array.isArray(data.savingsGoals);
};

export const importData = async (file: File): Promise<void> => {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }
  if (!validateBackupFile(parsed)) {
    throw new Error('Invalid Trackr backup file. Please select a valid trackr-backup.json file.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = parsed as any;
  const tables = [db.habits, db.habitRecords, db.categories, db.savingsGoals, db.savingsTransactions, db.settings];
  await db.transaction('rw', tables, async () => {
    await db.habits.clear();
    await db.habitRecords.clear();
    await db.categories.clear();
    await db.savingsGoals.clear();
    await db.savingsTransactions.clear();
    await db.settings.clear();
    if (data.habits?.length) await db.habits.bulkPut(data.habits);
    if (data.habitRecords?.length) await db.habitRecords.bulkPut(data.habitRecords);
    if (data.categories?.length) await db.categories.bulkPut(data.categories);
    if (data.savingsGoals?.length) await db.savingsGoals.bulkPut(data.savingsGoals);
    if (data.savingsTransactions?.length) await db.savingsTransactions.bulkPut(data.savingsTransactions);
    if (data.settings?.length) await db.settings.bulkPut(data.settings);
  });
};
