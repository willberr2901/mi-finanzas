/**
 * ════════════════════════════════════════════════════════════════════
 * 🤝 PRÉSTAMOS CON PERSONAS ("Yo debo" / "Me deben")
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: lleva las deudas pequeñas con amigos y familia, aparte de los
 *           pagos fijos y créditos: "me prestaron para el pasaje", "le presté
 *           a Juan para el almuerzo". Cada préstamo tiene abonos hasta quedar saldado.
 * Dónde se guarda: solo en el celular, cifrado (secureStorage 'mf_loans_v1').
 * Dónde se ve: módulo Préstamos (pages/LoansPage.tsx), resumen en Pagos.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { secureStorage } from '../utils/security';

export type LoanDir = 'debo' | 'meDeben';
export interface LoanPayment { id: string; amount: number; date: string; note?: string }
export interface Loan {
  id: string;
  dir: LoanDir;           // 'debo' = yo le debo a alguien · 'meDeben' = alguien me debe
  person: string;
  amount: number;         // valor prestado
  reason: string;         // motivo: pasaje, almuerzo…
  date: string;           // AAAA-MM-DD
  due?: string;           // para cuándo (opcional)
  payments: LoanPayment[];
  createdAt: number;
}

const KEY = 'mf_loans_v1';
const EVENT = 'mf:loans-changed';
const load = (): Loan[] => { const v = secureStorage.getItem(KEY); return Array.isArray(v) ? v : []; };
const save = (l: Loan[]) => { secureStorage.setItem(KEY, l); window.dispatchEvent(new Event(EVENT)); syncLoansToSW(l); };

export const REASONS = ['Pasaje', 'Almuerzo', 'Mercado', 'Préstamo', 'Servicios', 'Salida', 'Otro'];
export const today = () => new Date().toLocaleDateString('en-CA');

export const paidOf = (l: Loan) => l.payments.reduce((a, p) => a + p.amount, 0);
export const leftOf = (l: Loan) => Math.max(0, l.amount - paidOf(l));
export const isClosed = (l: Loan) => leftOf(l) === 0;
export const isLate = (l: Loan) => !isClosed(l) && !!l.due && l.due < today();

export const listLoans = () => load().sort((a, b) => b.createdAt - a.createdAt);
export const addLoan = (d: Omit<Loan, 'id' | 'payments' | 'createdAt'>) => {
  const l: Loan = { ...d, person: d.person.trim().replace(/\s+/g, ' ').slice(0, 40), reason: d.reason.trim().slice(0, 60), id: crypto.randomUUID(), payments: [], createdAt: Date.now() };
  save([l, ...load()]);
  return l;
};
export const addPayment = (id: string, amount: number, date = today(), note?: string) =>
  save(load().map(l => l.id === id ? { ...l, payments: [...l.payments, { id: crypto.randomUUID(), amount: Math.min(Math.round(amount), leftOf(l)), date, note }] } : l));
export const removeLoan = (id: string) => save(load().filter(l => l.id !== id));
export const undoLastPayment = (id: string) => save(load().map(l => l.id === id ? { ...l, payments: l.payments.slice(0, -1) } : l));

/** Personas con las que ya hay préstamos (para escribir rápido). */
export const knownPeople = () => [...new Set(load().map(l => l.person))].slice(0, 12);

/** Totales: lo que me deben y lo que debo (solo lo pendiente). */
export const loanTotals = (loans = load()) => ({
  meDeben: loans.filter(l => l.dir === 'meDeben').reduce((a, l) => a + leftOf(l), 0),
  debo: loans.filter(l => l.dir === 'debo').reduce((a, l) => a + leftOf(l), 0),
  late: loans.filter(isLate).length,
});

/** Agrupa por persona lo que sigue pendiente. */
export const byPerson = (loans: Loan[]) => {
  const m = new Map<string, Loan[]>();
  for (const l of loans) { const k = l.person.toLowerCase(); m.set(k, [...(m.get(k) || []), l]); }
  return [...m.values()].map(ls => ({ person: ls[0].person, loans: ls, left: ls.reduce((a, l) => a + leftOf(l), 0) })).sort((a, b) => b.left - a.left);
};

/** Mensaje amable para recordarle a alguien por WhatsApp (se abre WhatsApp, la app no envía nada). */
export const reminderText = (l: Loan, fmt: (n: number) => string) =>
  `Hola ${l.person.split(' ')[0]} 👋 Te escribo para recordarte lo de ${l.reason.toLowerCase() || 'lo que te presté'} (${fmt(leftOf(l))} pendientes). ¡Gracias! 😊`;

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>(listLoans);
  useEffect(() => {
    const on = () => setLoans(listLoans());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return loans;
}

// ═══ SECCIÓN: Avisos (dentro de la app y en el celular) ═══
export type LoanAlertKind = 'vencido' | 'hoy' | 'pronto' | 'cobrar';
export interface LoanAlert { loan: Loan; kind: LoanAlertKind; days: number }
const dayDiff = (iso: string) => Math.round((new Date(`${iso}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000);

/**
 * Préstamos que merecen un aviso:
 *   • con fecha: vencidos, que vencen hoy o en 1-2 días.
 *   • "Me deben" sin fecha: cuando ya pasaron 15 días o más (para acordarse de cobrar).
 */
export const loanAlerts = (loans = load()): LoanAlert[] => loans.filter(l => !isClosed(l)).flatMap((l): LoanAlert[] => {
  if (l.due) {
    const d = dayDiff(l.due);
    if (d < 0) return [{ loan: l, kind: 'vencido', days: d }];
    if (d === 0) return [{ loan: l, kind: 'hoy', days: 0 }];
    if (d <= 2) return [{ loan: l, kind: 'pronto', days: d }];
    return [];
  }
  const age = -dayDiff(l.date);
  return l.dir === 'meDeben' && age >= 15 ? [{ loan: l, kind: 'cobrar', days: age }] : [];
}).sort((a, b) => a.days - b.days);

/** Texto corto del estado: "Venció hace 3 días", "Vence hoy", "Vence mañana"… */
export const alertLabel = (a: LoanAlert) =>
  a.kind === 'vencido' ? `Venció hace ${-a.days} día${a.days === -1 ? '' : 's'}`
    : a.kind === 'hoy' ? 'Vence hoy'
    : a.kind === 'pronto' ? (a.days === 1 ? 'Vence mañana' : `Vence en ${a.days} días`)
    : `Hace ${a.days} días`;

// "Recuérdamelo mañana" (solo en este celular)
const SNOOZE = 'mf_loan_snooze';
export const snoozeLoan = (id: string) => { try { const m = JSON.parse(localStorage.getItem(SNOOZE) || '{}'); m[id] = today(); localStorage.setItem(SNOOZE, JSON.stringify(m)); } catch { /* sin almacenamiento */ } };
export const isSnoozedToday = (id: string) => { try { return JSON.parse(localStorage.getItem(SNOOZE) || '{}')[id] === today(); } catch { return false; } };

/**
 * Copia mínima para que el service worker pueda avisar con la app cerrada
 * (quién, cuánto falta, motivo y fecha). Se guarda en la caché local del celular, nunca sale de él.
 */
export async function syncLoansToSW(loans = load()) {
  try {
    if (!('caches' in window)) return;
    const open = loans.filter(l => !isClosed(l)).map(l => ({ id: l.id, dir: l.dir, person: l.person, left: leftOf(l), reason: l.reason, date: l.date, due: l.due ?? null }));
    const cache = await caches.open('mf-meta');
    await cache.put(new Request('/__mf_loans'), new Response(JSON.stringify(open), { headers: { 'Content-Type': 'application/json' } }));
  } catch { /* sin caché */ }
}
