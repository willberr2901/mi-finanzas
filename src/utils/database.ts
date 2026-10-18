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

export type Owner = 'yo' | 'pareja' | 'compartido';

/** Pago fijo (arriendo, servicios…) o deuda con cuotas, que se repite cada mes. */
export interface Bill {
  id: string;
  name: string;
  kind: 'fijo' | 'tarjeta' | 'deuda'; // tarjeta: fecha fija, valor cambia cada mes
  category: string;      // Arriendo, Servicios, Deudas…
  amount: number;        // valor de la cuota o del pago mensual
  dueDay: number;        // día del mes en que vence (1-31)
  owner: Owner;
  totalInstallments?: number; // deudas: número de cuotas
  paidInstallments?: number;  // deudas: cuotas ya pagadas
  active: boolean;
  createdAt: number;
}

/** Registro de que un pago se hizo en un mes ('yyyy-mm'). */
export interface BillPayment {
  id: string;
  billId: string;
  period: string;
  amount: number;
  paidAt: number;
  /** Quién pagó (para dividir los pagos compartidos del hogar). */
  paidBy?: 'yo' | 'pareja';
}

export const db = new Dexie('MiFinanzasDB') as Dexie & {
  transactions: Dexie.Table<Transaction, string>;
  goals: Dexie.Table<SavingsGoal, string>;
  settings: Dexie.Table<AppSettings, string>;
  bills: Dexie.Table<Bill, string>;
  billPayments: Dexie.Table<BillPayment, string>;
};

db.version(1).stores({
  transactions: '++id, date, type, category, amount, createdAt', // ✅ Índice compuesto
  goals: '++id, name, deadline',
  settings: '++id'
});

// v2: pagos fijos y deudas (los datos anteriores se conservan)
db.version(2).stores({
  bills: 'id, dueDay, kind, active',
  billPayments: 'id, billId, period, [billId+period]'
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