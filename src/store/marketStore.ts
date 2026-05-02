import { create } from 'zustand';
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// Base de datos SEPARADA solo para mercado
interface MarketDB extends DBSchema {
  marketItems: {
    key: string;
    value: {
      id: string;
      name: string;
      price: number;
      category: string;
      date: string;
      completed: boolean;
    };
  };
}

let db: IDBPDatabase<MarketDB>;

const initMarketDB = async (): Promise<IDBPDatabase<MarketDB>> => {
  if (db) return db;
  
  db = await openDB<MarketDB>('mi-mercado-db', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('marketItems')) {
        database.createObjectStore('marketItems', { keyPath: 'id' });
      }
    },
  });
  
  return db;
};

// CRUD Operations
export const addMarketItem = async (item: Omit<MarketDB['marketItems']['value'], 'id'>) => {
  const database = await initMarketDB();
  const id = crypto.randomUUID();
  await database.put('marketItems', { ...item, id });
  return id;
};

export const getAllMarketItems = async () => {
  const database = await initMarketDB();
  return database.getAll('marketItems');
};

export const updateMarketItemPrice = async (id: string, price: number) => {
  const database = await initMarketDB();
  const item = await database.get('marketItems', id);
  if (item) {
    await database.put('marketItems', { ...item, price });
  }
};

export const deleteMarketItem = async (id: string) => {
  const database = await initMarketDB();
  await database.delete('marketItems', id);
};

export const clearCompletedMarket = async () => {
  const database = await initMarketDB();
  const items = await database.getAll('marketItems');
  const completed = items.filter(i => i.completed);
  for (const item of completed) {
    await database.delete('marketItems', item.id);
  }
};

// Zustand Store
export interface MarketItem {
  id: string;
  name: string;
  price: number;
  category: string;
  date: string;
  completed: boolean;
}

interface MarketState {
  items: MarketItem[];
  isLoading: boolean;
  
  loadItems: () => Promise<void>;
  addItem: (item: Omit<MarketItem, 'id'>) => Promise<void>;
  updatePrice: (id: string, price: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  completePurchase: () => Promise<void>;
  
  getTotal: () => number;
  getCountWithPrice: () => number;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  items: [],
  isLoading: false,

  loadItems: async () => {
    set({ isLoading: true });
    const items = await getAllMarketItems();
    set({ items, isLoading: false });
  },

  addItem: async (item) => {
    await addMarketItem(item);
    await get().loadItems();
  },

  updatePrice: async (id, price) => {
    await updateMarketItemPrice(id, price);
    await get().loadItems();
  },

  deleteItem: async (id) => {
    await deleteMarketItem(id);
    await get().loadItems();
  },

  completePurchase: async () => {
    const database = await initMarketDB();
    const items = await database.getAll('marketItems');
    for (const item of items) {
      if (item.price > 0) {
        await database.put('marketItems', { ...item, completed: true });
      }
    }
    await get().loadItems();
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + (item.price || 0), 0);
  },

  getCountWithPrice: () => {
    return get().items.filter(i => i.price > 0).length;
  },
}));