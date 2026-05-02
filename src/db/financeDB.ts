import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface TransactionData {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

interface GoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

interface FinanceDB extends DBSchema {
  transactions: {
    key: string;
    value: TransactionData;
  };
  goals: {
    key: string;
    value: GoalData;
  };
}

let db: IDBPDatabase<FinanceDB>;

export const initDB = async (): Promise<IDBPDatabase<FinanceDB>> => {
  if (db) return db;

  db = await openDB<FinanceDB>('mi-finanzas-db', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('transactions')) {
        database.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('goals')) {
        database.createObjectStore('goals', { keyPath: 'id' });
      }
    },
  });

  return db;
};

export const addTransaction = async (transaction: Omit<TransactionData, 'id' | 'createdAt'>) => {
  const database = await initDB();
  const id = crypto.randomUUID();
  await database.put('transactions', {
    ...transaction,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
};

export const getAllTransactions = async () => {
  const database = await initDB();
  return database.getAll('transactions');
};

export const deleteTransaction = async (id: string) => {
  const database = await initDB();
  await database.delete('transactions', id);
};

export const addGoal = async (goal: Omit<GoalData, 'id'>) => {
  const database = await initDB();
  const id = crypto.randomUUID();
  await database.put('goals', { ...goal, id });
  return id;
};

export const getAllGoals = async () => {
  const database = await initDB();
  return database.getAll('goals');
};