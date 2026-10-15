import { secureStorage } from './security';

export interface MarketPurchase {
  id: string;
  date: string; // ISO
  total: number;
  itemsCount: number;
  items: { name: string; quantity: number; price: number }[];
}

const KEY = 'marketHistory';

export const getMarketHistory = (): MarketPurchase[] => {
  const saved = secureStorage.getItem(KEY);
  return Array.isArray(saved) ? saved : [];
};

export const addMarketPurchase = (purchase: MarketPurchase) => {
  const history = [purchase, ...getMarketHistory()].slice(0, 60); // guarda los últimos 60 mercados
  secureStorage.setItem(KEY, history);
};

/** Último precio pagado por un producto (para avisar si subió). */
export const lastPriceOf = (name: string): number | null => {
  const key = name.trim().toLowerCase();
  for (const p of getMarketHistory()) {
    const found = p.items.find(i => i.name.trim().toLowerCase() === key);
    if (found) return found.price;
  }
  return null;
};

/** Productos comprados antes (para sugerir mientras escribes): nombre, último precio y cuántas veces. */
export const knownProducts = (): { name: string; price: number; times: number }[] => {
  const map = new Map<string, { name: string; price: number; times: number }>();
  for (const p of getMarketHistory()) {          // del más reciente al más antiguo
    for (const i of p.items) {
      const k = i.name.trim().toLowerCase();
      const cur = map.get(k);
      if (cur) cur.times++;
      else map.set(k, { name: i.name.trim(), price: i.price, times: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.times - a.times);
};
