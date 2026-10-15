import { loadBillStatuses, periodOf } from './billsService';
import { secureStorage } from '../utils/security';
import { formatCOP } from '../utils/format';

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

/** Notificación del sistema una vez al día con los pagos urgentes (si la persona dio permiso). */
export const dailySystemReminder = async () => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const today = new Date().toDateString();
  if (localStorage.getItem('mf_lastDailyReminder') === today) return;
  const urgent = (await computeAlerts()).filter(a => a.level === 'urgente' && a.link === '/pagos');
  if (!urgent.length) return;
  localStorage.setItem('mf_lastDailyReminder', today);
  const body = urgent.length === 1 ? urgent[0].title : `${urgent.length} pagos necesitan tu atención: ${urgent.map(a => a.title).slice(0, 2).join(', ')}…`;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification('Mi Finanzas', { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'mf-daily' });
    else new Notification('Mi Finanzas', { body, icon: '/icon-192.png' });
  } catch { /* algunos navegadores no lo permiten */ }
};
