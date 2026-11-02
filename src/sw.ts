/// <reference lib="webworker" />
/**
 * ════════════════════════════════════════════════════════════════════
 * ⚙️ SERVICE WORKER (funciona sin internet + avisos)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Guarda la app para usarla sin internet, revisa pagos en segundo plano, avisa cuando hay
 *           una versión nueva de la app y muestra notificaciones del celular.
 * Dónde se ve: En segundo plano.
 * Si lo cambias: Un error aquí puede dejar a todos con una versión vieja: prueba antes de publicar.
 * Nota: Service worker propio de Mi Finanzas: · guarda la app en el celular para que funcione sin internet · revisa en segundo plano tus pagos y te avisa con una notificación del celular (todo se calcula en el celular, sin servidores)
 * ════════════════════════════════════════════════════════════════════
 */
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';
import { APP_VERSION } from './version';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

self.addEventListener('message', (e) => { if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); });

// ---------- Recordatorios de pagos en segundo plano ----------
interface Bill { id: string; name: string; amount: number; dueDay: number; active: boolean }
interface BillPayment { billId: string; period: string }

const readAll = <T,>(db: IDBDatabase, store: string): Promise<T[]> => new Promise((resolve) => {
  if (!db.objectStoreNames.contains(store)) return resolve([]);
  const req = db.transaction(store, 'readonly').objectStore(store).getAll();
  req.onsuccess = () => resolve(req.result as T[]);
  req.onerror = () => resolve([]);
});

const openDB = (): Promise<IDBDatabase | null> => new Promise((resolve) => {
  const req = indexedDB.open('MiFinanzasDB');
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => resolve(null);
});

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');

// ---------- Preferencias que deja la app (utils/prefs.ts → syncToWorker) ----------
interface Meta {
  reminder?: { enabled: boolean; time: string }; payDay?: number; budgets?: Record<string, number>;
  plan?: { income: number; payDays: number[]; freq: string } | null;
  notif?: { payday?: { on: boolean; time: string }; bills?: { on: boolean; time: string }; budget?: { on: boolean }; weekly?: { on: boolean; time: string }; kai?: { on: boolean }; quiet?: { on: boolean } } | null;
}
const readMeta = async (): Promise<Meta> => {
  try { const r = await (await caches.open('mf-meta')).match(new Request('/__mf_prefs')); return r ? await r.json() : {}; } catch { return {}; }
};
const N_DEF = { payday: { on: true, time: '08:00' }, bills: { on: true, time: '07:30' }, budget: { on: true }, weekly: { on: true, time: '18:00' }, kai: { on: true }, quiet: { on: false } };
const notifOf = (m: Meta) => ({ ...N_DEF, ...(m.notif || {}) });
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pastTime = (hhmm: string, now = new Date()) => { const [h, m] = (hhmm || '00:00').split(':').map(Number); return now.getHours() * 60 + now.getMinutes() >= h * 60 + (m || 0); };
const quietNow = (m: Meta, now = new Date()) => notifOf(m).quiet.on && (now.getHours() >= 22 || now.getHours() < 7);
/** Una sola vez por clave/valor (ej. una vez al día). */
const once = async (key: string, value: string, force = false) => {
  const cache = await caches.open('mf-meta'); const req = new Request(`/__mf_once_${key}`);
  const prev = await cache.match(req);
  if (!force && prev && (await prev.text()) === value) return false;
  await cache.put(req, new Response(value)); return true;
};
const ICON = { icon: '/icon-192.png', badge: '/icon-192.png' };
const granted = () => (self as any).Notification?.permission === 'granted';

// ---------- 💚 Día de pago: registrar el sueldo con un toque ----------
async function checkPayday(force = false) {
  if (!granted()) return;
  const m = await readMeta(); const n = notifOf(m);
  if (!m.plan || !m.plan.income || !n.payday.on || quietNow(m)) return;
  const now = new Date(); const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (!m.plan.payDays.some(d => Math.min(d, last) === now.getDate())) return;
  if (!force && !pastTime(n.payday.time, now)) return;
  const today = isoOf(now);
  const db = await openDB(); if (!db) return;
  const txs = await readAll<{ date: string; type: string }>(db, 'transactions'); db.close();
  if (txs.some(x => x.type === 'income' && x.date === today)) return;
  if (!(await once('payday', today, force))) return;
  const amount = Math.round(m.plan.income / Math.max(1, m.plan.payDays.length));
  await self.registration.showNotification('💚 ¡Hoy te pagan!', {
    body: `¿Ya te llegaron los ${fmt(amount)}${m.plan.freq === 'quincenal' ? ' de la quincena' : ''}?`, ...ICON, tag: 'mf-sueldo',
    actions: [{ action: 'sueldo-si', title: '✅ Sí, registrar' }, { action: 'sueldo-luego', title: '⏰ Más tarde' }],
    data: { url: '/', kind: 'sueldo', amount },
  } as NotificationOptions);
}

// ---------- 📅 Pagos y cuotas: con botón "Ya lo pagué" ----------
async function checkBills(force = false) {
  if (!granted()) return;
  const m = await readMeta(); const n = notifOf(m);
  if (!force && (!n.bills.on || quietNow(m) || !pastTime(n.bills.time))) return;
  const db = await openDB();
  if (!db) return;
  const [bills, payments] = await Promise.all([readAll<Bill>(db, 'bills'), readAll<BillPayment>(db, 'billPayments')]);
  db.close();

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayKey = isoOf(now);

  const pending = bills
    .filter(b => b.active && !payments.some(p => p.billId === b.id && p.period === period))
    .map(b => ({ b, days: Math.round((new Date(now.getFullYear(), now.getMonth(), Math.min(b.dueDay, last)).getTime() - today) / 86400000) }))
    .filter(x => x.days <= 2)
    .sort((a, b) => a.days - b.days);
  if (!pending.length) return;

  const snoozeRes = await (await caches.open('mf-meta')).match(new Request('/__mf_bills_snooze'));
  let snooze: Record<string, string> = {};
  try { snooze = snoozeRes ? await snoozeRes.json() : {}; } catch { /* vacío */ }
  let shown = 0;
  for (const { b, days } of pending) {
    if (shown >= 2) break;
    if (!force && snooze[b.id] === todayKey) continue;
    if (!(await once(`bill-${b.id}`, todayKey, force))) continue;
    const title = days < 0 ? `🔴 ${b.name} está vencido` : days === 0 ? `📅 Hoy vence ${b.name}` : `📅 ${b.name} vence ${days === 1 ? 'mañana' : 'en 2 días'}`;
    await self.registration.showNotification(title, {
      body: `${fmt(b.amount)}${days < 0 ? ` · venció hace ${-days} día${days === -1 ? '' : 's'}` : ''}`, ...ICON, tag: `mf-pago-${b.id}`, renotify: true,
      actions: [{ action: 'pago-hecho', title: '✅ Ya lo pagué' }, { action: 'pago-luego', title: '⏰ Mañana' }],
      data: { url: '/pagos', kind: 'pago', billId: b.id },
    } as NotificationOptions);
    shown++;
  }
}

// ---------- 🕗 ¿Gastaste algo hoy? (solo si no anotaste nada) ----------
async function checkDaily(force = false) {
  if (!granted()) return;
  const m = await readMeta();
  if (!m.reminder?.enabled || quietNow(m)) return;
  const now = new Date();
  if (!force && !pastTime(m.reminder.time || '20:00', now)) return;
  const todayISO = isoOf(now);
  const db = await openDB();
  if (!db) return;
  const txs = await readAll<{ date: string }>(db, 'transactions');
  db.close();
  if (txs.some(t => t.date === todayISO)) return;
  if (!(await once('daily', todayISO, force))) return;
  await self.registration.showNotification('🕗 ¿Gastaste algo hoy?', {
    body: 'Anótalo en 3 segundos y tus anillos quedan al día.', ...ICON, tag: 'mf-diario',
    actions: [{ action: 'gasto', title: '➖ Gasto' }, { action: 'ingreso', title: '➕ Ingreso' }, { action: 'nogaste', title: '🙌 No gasté' }],
    data: { url: '/?registrar=gasto', kind: 'diario' },
  } as NotificationOptions);
}

// ---------- 🎯 Presupuestos al 80% y 100% · 📊 resumen semanal ----------
async function checkBudgetsAndWeek(force = false) {
  if (!granted()) return;
  const m = await readMeta(); const n = notifOf(m);
  if (quietNow(m)) return;
  const now = new Date();
  const db = await openDB(); if (!db) return;
  const txs = await readAll<{ date: string; type: string; category: string; amount: number }>(db, 'transactions'); db.close();
  const exp = txs.filter(x => x.type === 'expense');
  // Presupuestos dentro del ciclo de pago
  const limits = Object.entries(m.budgets || {}).filter(([, v]) => v > 0);
  if (n.budget.on && limits.length) {
    const pd = Math.max(1, Math.min(31, m.payDay || 1));
    let y = now.getFullYear(), mo = now.getMonth();
    const dayIn = (yy: number, mm: number) => new Date(yy, mm, Math.min(pd, new Date(yy, mm + 1, 0).getDate()));
    if (now < dayIn(y, mo)) mo -= 1;
    const start = isoOf(dayIn(y, mo));
    for (const [cat, limit] of limits) {
      const v = exp.filter(x => x.category === cat && x.date >= start).reduce((a, x) => a + x.amount, 0);
      const pct = Math.round((v / limit) * 100);
      const lvl = pct >= 100 ? '100' : pct >= 80 ? '80' : '';
      if (!lvl || !(await once(`pres-${cat}`, `${start}-${lvl}`, force))) continue;
      await self.registration.showNotification(lvl === '100' ? `🎯 Te pasaste en ${cat}` : `🎯 ${cat} va en ${pct}%`, {
        body: lvl === '100' ? `Llevas ${fmt(v)} de ${fmt(limit)}.` : `Te quedan ${fmt(limit - v)} hasta tu próximo pago.`, ...ICON, tag: `mf-pres-${cat}`, data: { url: '/analisis' },
      } as NotificationOptions);
    }
  }
  // Resumen semanal: domingos después de la hora elegida
  if (n.weekly.on && now.getDay() === 0 && (force || pastTime(n.weekly.time, now))) {
    const d = (k: number) => { const x = new Date(now); x.setDate(x.getDate() - k); return isoOf(x); };
    const week = exp.filter(x => x.date > d(7) && x.date <= d(0)).reduce((a, x) => a + x.amount, 0);
    const before = exp.filter(x => x.date > d(14) && x.date <= d(7)).reduce((a, x) => a + x.amount, 0);
    if (week > 0 && (await once('weekly', d(0), force))) {
      const diff = before > 0 ? Math.round(((week - before) / before) * 100) : null;
      await self.registration.showNotification(`📊 Tu semana: gastaste ${fmt(week)}`, {
        body: diff === null ? 'Así cerraste la semana. ¡Sigue anotando!' : diff <= 0 ? `${Math.abs(diff)}% menos que la semana anterior 👏` : `${diff}% más que la semana anterior. Revisa los gustos 👀`,
        ...ICON, tag: 'mf-semana', data: { url: '/analisis' },
      } as NotificationOptions);
    }
  }
}

// ---------- Escribir en la base del celular desde un botón del aviso ----------
const putAll = (db: IDBDatabase, writes: [string, unknown][]) => new Promise<void>((resolve, reject) => {
  const stores = [...new Set(writes.map(w => w[0]))].filter(s => db.objectStoreNames.contains(s));
  const tx = db.transaction(stores, 'readwrite');
  for (const [s, v] of writes) if (stores.includes(s)) tx.objectStore(s).put(v);
  tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
});
const tellApp = async () => { for (const c of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) c.postMessage({ type: 'MF_DATA_CHANGED' }); };
const uid = () => (self.crypto as any).randomUUID ? self.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function registerSalarySW(amount: number) {
  const db = await openDB(); if (!db) return;
  await putAll(db, [['transactions', { id: uid(), date: isoOf(new Date()), type: 'income', category: 'Sueldo', amount, description: 'Sueldo', createdAt: Date.now() }]]);
  db.close(); await tellApp();
  await self.registration.showNotification('✅ Sueldo registrado', { body: `${fmt(amount)} · tus anillos ya se actualizaron 💚`, ...ICON, tag: 'mf-sueldo', data: { url: '/' } } as NotificationOptions);
}
async function payBillSW(billId: string) {
  const db = await openDB(); if (!db) return;
  const bills = await readAll<Bill & { kind: string; category: string; totalInstallments?: number; paidInstallments?: number }>(db, 'bills');
  const b = bills.find(x => x.id === billId); if (!b) { db.close(); return; }
  const now = new Date(); const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const inst = b.kind === 'deuda' ? (b.paidInstallments ?? 0) + 1 : undefined;
  const writes: [string, unknown][] = [
    ['billPayments', { id: uid(), billId: b.id, period, amount: b.amount, paidAt: Date.now() }],
    ['transactions', { id: uid(), date: isoOf(now), type: 'expense', amount: b.amount, category: b.category, description: inst && b.totalInstallments ? `${b.name} · cuota ${inst} de ${b.totalInstallments}` : b.name, createdAt: Date.now() }],
  ];
  if (b.kind === 'deuda') writes.push(['bills', { ...b, paidInstallments: inst, active: !(b.totalInstallments && inst! >= b.totalInstallments) }]);
  await putAll(db, writes); db.close(); await tellApp();
  await self.registration.showNotification(`✅ ${b.name} pagado`, { body: `${fmt(b.amount)} · quedó anotado como gasto`, ...ICON, tag: `mf-pago-${b.id}`, data: { url: '/pagos' } } as NotificationOptions);
}
const snoozeBill = async (billId: string) => {
  const cache = await caches.open('mf-meta'); const r = await cache.match(new Request('/__mf_bills_snooze'));
  let s: Record<string, string> = {}; try { s = r ? await r.json() : {}; } catch { /* vacío */ }
  s[billId] = isoOf(new Date()); // hoy no vuelve a avisar; mañana sí
  await cache.put(new Request('/__mf_bills_snooze'), new Response(JSON.stringify(s)));
};

// ---------- 🎉 Aviso de versión nueva ----------
/** ¿La versión a es más nueva que b? ("1.10.2" > "1.9.1") */
const isNewer = (a: string, b: string) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; }
  return false;
};

/**
 * Revisa /version.json. Si hay una versión más nueva que la instalada, muestra UNA notificación
 * por versión ("🎉 Nueva versión…"); al tocarla se abre la app y se actualiza sola.
 * No envía nada a ningún servidor: solo descarga el número de versión (igual que al abrir la app).
 * Se puede apagar en Ajustes → Recordatorios → "Avisos de nuevas versiones".
 */
async function checkUpdate(force = false) {
  if ((self as any).Notification?.permission !== 'granted') return;
  const cache = await caches.open('mf-meta');
  const off = await cache.match(new Request('/__mf_update_notif'));
  if (!force && off && (await off.text()) === 'off') return;
  let remote: { version?: string; notes?: string[]; silent?: boolean } = {};
  try { remote = await (await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })).json(); } catch { return; }
  if (!remote.version || (!force && !isNewer(remote.version, APP_VERSION))) return;
  if (remote.silent && !force) return; // arreglo pequeño: se instala solo, sin notificación
  const key = new Request('/__mf_notified_version');
  const prev = await cache.match(key);
  if (!force && prev && (await prev.text()) === remote.version) return;
  await cache.put(key, new Response(remote.version));
  const raw = (remote.notes ?? [])[0]?.replace(/^(Nuevo|Arreglo|Mejora):\s*/i, '') || 'Trae mejoras para ti.';
  const first = raw.charAt(0).toUpperCase() + raw.slice(1);
  await self.registration.showNotification(`🎉 Nueva versión de Mi Finanzas (${remote.version})`, {
    body: `${first}\nToca para actualizar y ver las novedades.`,
    icon: '/icon-192.png', badge: '/icon-192.png', tag: 'mf-update', data: { url: '/' },
  } as NotificationOptions);
  // Deja la versión nueva descargando de una vez, para que abra rápido.
  self.registration.update().catch(() => {});
}

// ---------- 🤝 Préstamos con personas ----------
type LoanCopy = { id: string; dir: 'debo' | 'meDeben'; person: string; left: number; reason: string; date: string; due: string | null };
const isoToday = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const daysTo = (iso: string) => Math.round((new Date(`${iso}T12:00:00`).getTime() - new Date(`${isoToday()}T12:00:00`).getTime()) / 86400000);

/**
 * Avisos de préstamos (máximo uno por préstamo al día, hasta 3):
 *   • "Yo debo"   → 💸 No olvides pagarle a… (con botones Ya le pagué / Mañana).
 *   • "Me deben"  → 🤝 Hora de cobrarle a… (con botones Recordarle por WhatsApp / Me abonó).
 * Lee la copia mínima que deja la app en la caché (loansService → syncLoansToSW).
 */
async function checkLoans(force = false) {
  if ((self as any).Notification?.permission !== 'granted') return;
  const cache = await caches.open('mf-meta');
  const res = await cache.match(new Request('/__mf_loans'));
  if (!res) return;
  let loans: LoanCopy[] = [];
  try { loans = await res.json(); } catch { return; }
  const day = isoToday();
  const snoozeRes = await cache.match(new Request('/__mf_loans_snooze'));
  let snooze: Record<string, string> = {};
  try { snooze = snoozeRes ? await snoozeRes.json() : {}; } catch { /* vacío */ }
  const doneRes = await cache.match(new Request('/__mf_loans_notified'));
  let done: Record<string, string> = {};
  try { done = doneRes ? await doneRes.json() : {}; } catch { /* vacío */ }

  const due = loans.map(l => {
    if (l.due) { const d = daysTo(l.due); return d <= 2 ? { l, d, kind: d < 0 ? 'vencido' : d === 0 ? 'hoy' : 'pronto' } : null; }
    const age = -daysTo(l.date);
    return l.dir === 'meDeben' && age >= 15 && age % 7 === 1 ? { l, d: age, kind: 'cobrar' } : null;   // sin fecha: una vez por semana
  }).filter(Boolean) as { l: LoanCopy; d: number; kind: string }[];

  let shown = 0;
  for (const { l, d, kind } of due.sort((a, b) => a.d - b.d)) {
    if (shown >= 3) break;
    if (!force && (snooze[l.id] === day || done[l.id] === day)) continue;
    const when = kind === 'vencido' ? `venció hace ${-d} día${d === -1 ? '' : 's'}` : kind === 'hoy' ? 'vence HOY' : kind === 'pronto' ? (d === 1 ? 'vence mañana' : `vence en ${d} días`) : `ya van ${d} días`;
    const name = l.person.split(' ')[0];
    const what = l.reason ? ` por ${l.reason.toLowerCase()}` : '';
    const opts = l.dir === 'debo'
      ? { title: kind === 'vencido' ? `🔴 Le debes a ${name} y ya se pasó la fecha` : `💸 No olvides pagarle a ${name}`,
          body: `${fmt(l.left)}${what} · ${when}.\nCumplir te deja a paz y salvo 🙌`,
          actions: [{ action: 'pagado', title: '✅ Ya le pagué' }, { action: 'luego', title: '⏰ Mañana' }] }
      : { title: kind === 'vencido' ? `🤝 ${name} se atrasó con lo que te debe` : `🤝 Hora de cobrarle a ${name}`,
          body: `Te debe ${fmt(l.left)}${what} · ${when}.\nRecuérdale con un mensaje amable.`,
          actions: [{ action: 'recordar', title: '💬 Recordarle' }, { action: 'abono', title: '✅ Me abonó' }] };
    const wa = `Hola ${name} 👋 Te escribo para recordarte lo de ${l.reason ? l.reason.toLowerCase() : 'lo que te presté'} (${fmt(l.left)} pendientes). ¡Gracias! 😊`;
    await self.registration.showNotification(opts.title, {
      body: opts.body, icon: '/icon-192.png', badge: '/icon-192.png', tag: `mf-prestamo-${l.id}`,
      actions: opts.actions, vibrate: [180, 80, 180, 80, 320], renotify: true,
      data: { url: `/prestamos?ver=${l.id}`, loanId: l.id, wa: `https://wa.me/?text=${encodeURIComponent(wa)}` },
    } as NotificationOptions);
    done[l.id] = day;
    shown++;
  }
  if (shown) await cache.put(new Request('/__mf_loans_notified'), new Response(JSON.stringify(done)));
}

// Revisión periódica (Chrome Android con la app instalada; el sistema decide la hora exacta).
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'mf-pagos') event.waitUntil(Promise.all([checkPayday(), checkBills(), checkDaily(), checkBudgetsAndWeek(), checkUpdate(), checkLoans()]));
});

// La app también puede pedir una revisión (por ejemplo, al abrirla o para probar).
self.addEventListener('message', (e) => {
  if (e.data?.type === 'CHECK_BILLS') e.waitUntil(Promise.all([checkPayday(), checkBills(!!e.data.force), checkDaily(), checkBudgetsAndWeek(), checkLoans(!!e.data.force)]));
  if (e.data?.type === 'TEST_ACTIONS') e.waitUntil(Promise.all([checkPayday(true), checkBills(true), checkDaily(true)]));
  if (e.data?.type === 'CHECK_LOANS') e.waitUntil(checkLoans(!!e.data.force));
  if (e.data?.type === 'TEST_UPDATE_NOTICE') e.waitUntil(checkUpdate(true));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = data.url || '/';
  // Botones de los avisos nuevos: se hacen sin abrir la app cuando se puede
  if (data.kind === 'sueldo') {
    if (event.action === 'sueldo-si') { event.waitUntil(registerSalarySW(Number(data.amount) || 0)); return; }
    if (event.action === 'sueldo-luego') return;
  }
  if (data.kind === 'pago') {
    if (event.action === 'pago-hecho') { event.waitUntil(payBillSW(data.billId)); return; }
    if (event.action === 'pago-luego') { event.waitUntil(snoozeBill(data.billId)); return; }
  }
  if (data.kind === 'diario') {
    if (event.action === 'nogaste') return;
    url = event.action === 'ingreso' ? '/?registrar=ingreso' : '/?registrar=gasto';
  }
  // Botones de los avisos de préstamos
  if (data.loanId) {
    if (event.action === 'recordar' && data.wa) { event.waitUntil(self.clients.openWindow(data.wa)); return; }
    if (event.action === 'luego') {
      event.waitUntil((async () => {
        const cache = await caches.open('mf-meta');
        const r = await cache.match(new Request('/__mf_loans_snooze'));
        let m: Record<string, string> = {};
        try { m = r ? await r.json() : {}; } catch { /* vacío */ }
        m[data.loanId] = isoToday();
        await cache.put(new Request('/__mf_loans_snooze'), new Response(JSON.stringify(m)));
      })());
      return;
    }
    if (event.action === 'pagado' || event.action === 'abono') url = `/prestamos?abonar=${data.loanId}`;
  }
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = all.find(c => 'focus' in c) as WindowClient | undefined;
    if (existing) { await existing.focus(); existing.navigate(url).catch(() => {}); }
    else await self.clients.openWindow(url);
  })());
});
