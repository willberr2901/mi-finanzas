/**
 * ════════════════════════════════════════════════════════════════════
 * 🗂️ PUENTE: historial de mercados en el formato antiguo
 * ────────────────────────────────────────────────────────────────────
 * Desde v1.7 los mercados viven en services/market/marketStore.ts.
 * Este archivo solo traduce al formato que usan Inicio y el reporte PDF.
 * ════════════════════════════════════════════════════════════════════
 */
import { tripsList } from '../services/market/marketStore';

export interface MarketPurchase {
  id: string;
  date: string; // ISO
  total: number;
  itemsCount: number;
  items: { name: string; quantity: number; price: number }[];
}

export const getMarketHistory = (): MarketPurchase[] =>
  tripsList().map(t => ({ id: t.id, date: t.date, total: t.total, itemsCount: t.items.length, items: t.items.map(i => ({ name: i.name, quantity: i.qty, price: i.price })) }));
