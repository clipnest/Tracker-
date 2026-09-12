import { db, SavingsGoal, SavingsTransaction } from './database';

export const savingsService = {
  async createGoal(goal: Omit<SavingsGoal, 'id'>) {
    return await db.savingsGoals.add(goal);
  },

  async updateGoal(id: number, changes: Partial<SavingsGoal>) {
    return await db.savingsGoals.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteGoal(id: number) {
    await db.transaction('rw', db.savingsGoals, db.savingsTransactions, async () => {
      await db.savingsGoals.delete(id);
      await db.savingsTransactions.where('goalId').equals(id).delete();
    });
  },

  async deposit(goalId: number, amount: number, date: string, note?: string) {
    await db.transaction('rw', db.savingsGoals, db.savingsTransactions, async () => {
      const goal = await db.savingsGoals.get(goalId);
      if (!goal) throw new Error('Goal not found');
      
      const newBalance = goal.currentBalance + amount;
      await db.savingsGoals.update(goalId, { 
        currentBalance: newBalance,
        updatedAt: new Date().toISOString()
      });
      
      await db.savingsTransactions.add({
        goalId,
        type: 'deposit',
        amount,
        date,
        note,
        createdAt: new Date().toISOString()
      });
    });
  },

  async withdraw(goalId: number, amount: number, date: string, note?: string) {
    await db.transaction('rw', db.savingsGoals, db.savingsTransactions, async () => {
      const goal = await db.savingsGoals.get(goalId);
      if (!goal) throw new Error('Goal not found');
      
      const newBalance = Math.max(0, goal.currentBalance - amount);
      const actualWithdrawal = goal.currentBalance - newBalance;
      
      if (actualWithdrawal > 0) {
        await db.savingsGoals.update(goalId, { 
          currentBalance: newBalance,
          updatedAt: new Date().toISOString()
        });
        
        await db.savingsTransactions.add({
          goalId,
          type: 'withdrawal',
          amount: actualWithdrawal,
          date,
          note,
          createdAt: new Date().toISOString()
        });
      }
    });
  },

  async undoLastTransaction(goalId: number) {
    await db.transaction('rw', db.savingsGoals, db.savingsTransactions, async () => {
      const lastTx = await db.savingsTransactions.where('goalId').equals(goalId).reverse().sortBy('createdAt');
      if (lastTx.length === 0) return;
      
      const tx = lastTx[0];
      const goal = await db.savingsGoals.get(goalId);
      if (!goal || !tx.id) return;
      
      let newBalance = goal.currentBalance;
      if (tx.type === 'deposit') {
        newBalance -= tx.amount;
      } else if (tx.type === 'withdrawal') {
        newBalance += tx.amount;
      }
      
      await db.savingsGoals.update(goalId, { 
        currentBalance: newBalance,
        updatedAt: new Date().toISOString()
      });
      await db.savingsTransactions.delete(tx.id);
    });
  }
};
