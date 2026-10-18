import { loadBillStatuses, periodOf } from './billsService';
import { secureStorage } from '../utils/security';
import { formatCOP } from '../utils/format';
import { db } from '../utils/database';
import { getPrefs, cycleFor, inCycle } from '../utils/prefs';

export interface AppAlert {
  id: string;
  level: 'urgente' | 'aviso' | 'info';
  title: string;
  message: string;
  link: string;
}

/** Calcula los avisos del momento a partir de los datos guardados en el celular. */
export const computeAlerts = async (): Promise<AppAlert[]> => {
  const alerts: AppAlert[] = [];
  const period = periodOf(new Date());

  try {
    for (const s of await loadBillStatuses()) {
      if (s.paid) continue;
      const base = { link: '/pagos' };
      if (s.state === 'vencido') alerts.push({ ...base, id: `venc-${s.bill.id}-${period}`, level: 'urgente', title: `${s.bill.name} está vencido`, message: `Vencía el día ${s.dueDate.getDate()} · ${formatCOP(s.bill.amount)}. Si ya lo pagaste, márcalo.` });
      else if (s.state === 'hoy') alerts.push({ ...base, id: `hoy-${s.bill.id}-${period}`, level: 'urgente', title: `Hoy vence ${s.bill.name}`, message: `${formatCOP(s.bill.amount)} · no lo dejes pasar.` });
      else if (s.state === 'pronto') alerts.push({ ...base, id: `pronto-${s.bill.id}-${period}`, level: 'aviso', title: `${s.bill.name} vence ${s.daysLeft === 1 ? 'mañana' : `en ${s.daysLeft} días`}`, message: `${formatCOP(s.bill.amount)} · día ${s.dueDate.getDate()}.` });
    }
  } catch { /* sin datos de pagos aún */ }

  const items = secureStorage.getItem('marketItems');
  const budget = secureStorage.getItem('marketBudget');
  if (Array.isArray(items) && items.length && typeof budget === 'number' && budget > 0) {
    const total = items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0);
    const pct = Math.round((total / budget) * 100);
    if (total > budget) alerts.push({ id: `merc-exc-${period}-${Math.round(total)}`, level: 'urgente', title: 'Te pasaste del presupuesto del mercado', message: `La lista va en ${formatCOP(total)} y el presupuesto es ${formatCOP(budget)}.`, link: '/mercado' });
    else if (pct >= 85) alerts.push({ id: `merc-85-${period}`, level: 'aviso', title: `Mercado al ${pct}% del presupuesto`, message: `Te quedan ${formatCOP(budget - total)}.`, link: '/mercado' });
  }

  // Presupuestos por categoría (dentro del ciclo de pago)
  try {
    const { budgets, payDay } = getPrefs();
    const limits = Object.entries(budgets).filter(([, v]) => v > 0);
    if (limits.length) {
      const c = cycleFor(new Date(), payDay);
      const spent = new Map<string, number>();
      for (const t of await db.transactions.toArray()) {
        if (t.type === 'expense' && inCycle(t.date, c)) spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
      }
      for (const [cat, limit] of limits) {
        const v = spent.get(cat) ?? 0;
        const pct = Math.round((v / limit) * 100);
        if (pct >= 100) alerts.push({ id: `pres-100-${cat}-${c.startISO}`, level: 'urgente', title: `Te pasaste en ${cat}`, message: `Llevas ${formatCOP(v)} de ${formatCOP(limit)} (${pct}%).`, link: '/' });
        else if (pct >= 80) alerts.push({ id: `pres-80-${cat}-${c.startISO}`, level: 'aviso', title: `${cat} al ${pct}% del presupuesto`, message: `Te quedan ${formatCOP(limit - v)} hasta tu próximo pago.`, link: '/' });
      }
    }
  } catch { /* sin datos */ }

  return alerts;
};

// ---- Leídos (se guardan solo en este celular) ----
const READ_KEY = 'mf_readAlerts';
export const getReadIds = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
};
export const markRead = (ids: string[]) => {
  const all = [...getReadIds(), ...ids].slice(-200);
  localStorage.setItem(READ_KEY, JSON.stringify(all));
};

// ---- Historial de notificaciones (solo en este celular) ----
export interface LoggedAlert extends AppAlert { at: number }
const LOG_KEY = 'mf_notifLog';
export const getLog = (): LoggedAlert[] => {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
};
export const logAlerts = (alerts: AppAlert[]) => {
  const log = getLog();
  const known = new Set(log.map(l => l.id));
  const fresh = alerts.filter(a => !known.has(a.id)).map(a => ({ ...a, at: Date.now() }));
  if (fresh.length) localStorage.setItem(LOG_KEY, JSON.stringify([...fresh, ...log].slice(0, 100)));
};
export const clearLog = () => localStorage.removeItem(LOG_KEY);

// ---- Recordatorios en el celular ----
export const remindersSupported = () => 'Notification' in window && 'serviceWorker' in navigator;
export const backgroundSupported = async () => {
  const reg = await navigator.serviceWorker?.getRegistration();
  return !!(reg && 'periodicSync' in reg);
};

/** Pide permiso, programa la revisión en segundo plano y hace una revisión ahora. */
export const enableReminders = async (): Promise<NotificationPermission> => {
  if (!remindersSupported()) return 'denied';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm;
  localStorage.setItem('mf_reminders', 'on');
  try {
    const reg: any = await navigator.serviceWorker.ready;
    if (reg.periodicSync) {
      try { await (navigator as any).permissions?.query({ name: 'periodic-background-sync' }); } catch { /* sin API de permisos */ }
      await reg.periodicSync.register('mf-pagos', { minInterval: 12 * 60 * 60 * 1000 });
    }
  } catch { /* el navegador no permite revisión en segundo plano; quedan los avisos al abrir la app */ }
  return perm;
};

/** Pide al service worker revisar los pagos y avisar (máximo una vez al día; force para probar). */
export const requestBillCheck = async (force = false) => {
  if (!remindersSupported() || Notification.permission !== 'granted') return;
  try { (await navigator.serviceWorker.ready).active?.postMessage({ type: 'CHECK_BILLS', force }); } catch { /* sin service worker */ }
};

export const sendTestNotification = async () => {
  if (Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker?.ready;
  await reg?.showNotification('Mi Finanzas', { body: '¡Listo! Así te avisaremos de tus pagos antes de que venzan.', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'mf-test' });
  return true;
};

/** Al abrir la app: revisa pagos (notificación del celular una vez al día) y renueva la revisión en segundo plano. */
export const dailySystemReminder = async () => {
  if (!remindersSupported() || Notification.permission !== 'granted') return;
  if (localStorage.getItem('mf_reminders') !== 'off') await enableReminders();
  await requestBillCheck();
};
