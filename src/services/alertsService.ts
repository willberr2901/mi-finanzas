/**
 * ════════════════════════════════════════════════════════════════════
 * 🚨 AVISOS DEL MOMENTO (campana)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Calcula pagos vencidos o por vencer, mercado sobre el presupuesto y presupuestos al 80%/100%. Un solo estado para todas las campanas, historial y recordatorios del celular.
 * Dónde se ve: Campana 🔔 y notificaciones del celular.
 * Si lo cambias: Cambia qué avisos salen y cuándo.
 * ════════════════════════════════════════════════════════════════════
 */
import { loadBillStatuses, periodOf } from './billsService';
import { listItems, estimateList, getBudget } from './market/marketStore';
import { getActivity, saveActivity, type ActivityEntry } from './notificationService';
import { useEffect, useState } from 'react';
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

  // Mercado: lo que va en el carrito y lo que costaría la lista, frente al presupuesto
  const budget = getBudget();
  const items = listItems();
  if (items.length && budget > 0) {
    const cart = items.filter(i => i.checked).reduce((s, i) => s + (i.paid || 0) * i.qty, 0);
    const est = estimateList(items).total;
    if (cart > budget) alerts.push({ id: `merc-exc-${period}`, level: 'urgente', title: 'Te pasaste del presupuesto del mercado', message: `Llevas ${formatCOP(cart)} en el carrito y el presupuesto es ${formatCOP(budget)}.`, link: '/mercado' });
    else if (est > budget) alerts.push({ id: `merc-est-${period}`, level: 'aviso', title: 'Tu lista supera el presupuesto', message: `Costaría aprox. ${formatCOP(est)} y el presupuesto es ${formatCOP(budget)}.`, link: '/mercado' });
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

// ═══ SECCIÓN: Leídos (se guardan solo en este celular) ═══
const READ_KEY = 'mf_readAlerts';
export const getReadIds = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
};
export const markRead = (ids: string[]) => {
  const all = [...new Set([...getReadIds(), ...ids])].slice(-300);
  localStorage.setItem(READ_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('mf:alerts-changed'));
};

// ═══ SECCIÓN: Historial (alertas + actividad del hogar) ═══
export type LoggedAlert = ActivityEntry & { level?: AppAlert['level'] };
export const getLog = (): LoggedAlert[] => getActivity() as LoggedAlert[];
export const logAlerts = (alerts: AppAlert[]) => {
  const log = getActivity();
  const known = new Set(log.map(l => l.id));
  const fresh = alerts.filter(a => !known.has(a.id)).map(a => ({ ...a, at: Date.now(), kind: 'alerta' as const }));
  if (fresh.length) saveActivity([...fresh, ...log]);
};
export const clearLog = () => saveActivity([]);

// ═══ SECCIÓN: Un solo lugar con los avisos del momento ═══
// Antes cada campana calculaba sus avisos y al entrar a otro módulo podía
// mostrar uno viejo. Ahora todas leen de aquí y se actualizan juntas.
let current: AppAlert[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
export const refreshAlerts = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    try { current = await computeAlerts(); logAlerts(current); } catch { /* sin datos */ }
    window.dispatchEvent(new Event('mf:alerts-changed'));
  }, 120);
};
let watching = false;
const watch = () => {
  if (watching) return;
  watching = true;
  ['mf:data-changed', 'mf:prefs-changed', 'mf:market-changed', 'focus'].forEach(e => window.addEventListener(e, refreshAlerts));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAlerts(); });
  refreshAlerts();
};

export const useAlerts = () => {
  const [, tick] = useState(0);
  useEffect(() => {
    watch();
    const on = () => tick(t => t + 1);
    window.addEventListener('mf:alerts-changed', on);
    return () => window.removeEventListener('mf:alerts-changed', on);
  }, []);
  const read = getReadIds();
  return { alerts: current, log: getLog(), read, unread: current.filter(a => !read.has(a.id)).length, activeIds: new Set(current.map(a => a.id)) };
};

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

// ---- 🎉 Avisos de nuevas versiones (los muestra el service worker, ver src/sw.ts → checkUpdate) ----
const UPDATE_KEY = 'mf_update_notices';
/** ¿Avisar en el celular cuando salga una versión nueva? (encendido por defecto) */
export const updateNoticesOn = () => localStorage.getItem(UPDATE_KEY) !== 'off';
export const setUpdateNotices = async (on: boolean) => {
  localStorage.setItem(UPDATE_KEY, on ? 'on' : 'off');
  // El service worker no puede leer localStorage: se lo dejamos en su caché.
  try { await (await caches.open('mf-meta')).put(new Request('/__mf_update_notif'), new Response(on ? 'on' : 'off')); } catch { /* sin caché */ }
};
/**
 * Estado real de los avisos en este celular (para mostrarlo en Ajustes):
 * permiso de notificaciones, app instalada y revisión automática en segundo plano.
 */
export const noticeStatus = async () => {
  const permission = remindersSupported() ? Notification.permission : 'denied';
  const installed = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  let background: boolean | null = null;   // null = este navegador no tiene revisión automática
  try {
    const reg: any = await navigator.serviceWorker?.getRegistration();
    if (reg?.periodicSync) background = (await reg.periodicSync.getTags()).includes('mf-pagos');
  } catch { background = null; }
  return { permission, installed, background };
};

/** Muestra ya un ejemplo del aviso de versión nueva (para probar). */
export const testUpdateNotice = async () => {
  if (!remindersSupported() || Notification.permission !== 'granted') return false;
  try { (await navigator.serviceWorker.ready).active?.postMessage({ type: 'TEST_UPDATE_NOTICE' }); return true; } catch { return false; }
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
