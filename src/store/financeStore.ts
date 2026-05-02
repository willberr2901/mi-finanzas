import { create } from 'zustand';
import { 
  getAllTransactions, 
  addTransaction as addTransactionDB,
  deleteTransaction as deleteTransactionDB 
} from '../db/financeDB';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransactionPrice: (id: string, newPrice: number) => Promise<void>; // Nueva función para tiempo real
  
  // Cálculos
  getBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpense: () => number;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await getAllTransactions();
      // Forzamos una nueva referencia de array para asegurar que React detecte el cambio
      set({ transactions: [...transactions], isLoading: false });
    } catch (error) {
      set({ error: 'Error al cargar', isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    try {
      await addTransactionDB(transaction);
      // Recargamos inmediatamente para que todos los componentes vean el cambio
      await get().loadTransactions();
    } catch (error) {
      set({ error: 'Error al guardar' });
    }
  },

  deleteTransaction: async (id) => {
    try {
      await deleteTransactionDB(id);
      await get().loadTransactions();
    } catch (error) {
      set({ error: 'Error al eliminar' });
    }
  },

  // Función especial para actualizar precio sin borrar (más rápido para tiempo real)
  updateTransactionPrice: async (id: string, newPrice: number) => {
    try {
        // Actualizamos la BD
       // Elimina o comenta la línea:
// let db;
        
        // 1. Actualizamos el estado local INMEDIATAMENTE (Optimistic UI)
        set((state) => ({
            transactions: state.transactions.map(t => 
                t.id === id ? { ...t, amount: newPrice } : t
            )
        }));

        // 2. Actualizamos la base de datos en segundo plano
        await deleteTransactionDB(id);
        const item = get().transactions.find(t => t.id === id);
        if(item) {
             await addTransactionDB({ ...item, amount: newPrice });
        }
        // 3. Confirmamos con la BD
        await get().loadTransactions();
    } catch (error) {
        console.error("Error actualizando precio", error);
    }
  },

  getBalance: () => {
    return get().transactions.reduce((acc, tx) => 
      tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0);
  },

  getTotalIncome: () => {
    return get().transactions
      .filter(tx => tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amount, 0);
  },

  getTotalExpense: () => {
    return get().transactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);
  },
}));