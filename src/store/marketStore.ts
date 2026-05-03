import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  category: string;
  date: string;
  completed: boolean;
  quantity?: number;
  unitPrice?: number;
}

interface MarketStore {
  items: MarketItem[];
  loadItems: () => void;
  addItem: (item: Omit<MarketItem, 'id'>) => void;
  updatePrice: (id: string, price: number) => void;
  deleteItem: (id: string) => void;
  toggleComplete: (id: string) => void;
  completePurchase: () => void;
  getTotal: () => number;
  getCountWithPrice: () => number;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    (set, get) => ({
      items: [],
      loadItems: () => {},
      addItem: (item) => {
        set((state) => ({
          items: [...state.items, { ...item, id: crypto.randomUUID() }],
        }));
      },
      updatePrice: (id, price) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, price } : item
          ),
        }));
      },
      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      toggleComplete: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          ),
        }));
      },
      completePurchase: () => {
        set({ items: [] });
      },
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price || 0), 0);
      },
      getCountWithPrice: () => {
        return get().items.filter((item) => item.price > 0).length;
      },
    }),
    { name: 'mi-finanzas-market' }
  )
);