import Dexie from 'dexie';

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  createdAt: number; // ✅ Agregado para ordenamiento rápido
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  theme: 'dark' | 'light';
  pushEnabled: boolean;
  onboardingCompleted: boolean;
}

export const db = new Dexie('MiFinanzasDB') as Dexie & {
  transactions: Dexie.Table<Transaction, string>;
  goals: Dexie.Table<SavingsGoal, string>;
  settings: Dexie.Table<AppSettings, string>;
};

db.version(1).stores({
  transactions: '++id, date, type, category, amount, createdAt', // ✅ Índice compuesto
  goals: '++id, name, deadline',
  settings: '++id'
});

export const migrateData = async () => {
  try {
    const existing = await db.settings.get('global');
    if (existing) return;
    await db.settings.add({
      id: 'global',
      theme: 'dark',
      pushEnabled: false,
      onboardingCompleted: false
    });
  } catch {}
};