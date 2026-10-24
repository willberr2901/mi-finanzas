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

async function checkBills(force = false) {
  const db = await openDB();
  if (!db) return;
  const [bills, payments] = await Promise.all([readAll<Bill>(db, 'bills'), readAll<BillPayment>(db, 'billPayments')]);
  db.close();

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const pending = bills
    .filter(b => b.active && !payments.some(p => p.billId === b.id && p.period === period))
    .map(b => ({ b, days: Math.round((new Date(now.getFullYear(), now.getMonth(), Math.min(b.dueDay, last)).getTime() - today) / 86400000) }))
    .filter(x => x.days <= 2);
  if (!pending.length) return;

  // Una notificación por día como máximo (salvo prueba manual).
  const cache = await caches.open('mf-meta');
  const key = new Request('/__mf_last_reminder');
  const prev = await cache.match(key);
  const todayKey = now.toDateString();
  if (!force && prev && (await prev.text()) === todayKey) return;
  await cache.put(key, new Response(todayKey));

  pending.sort((a, b) => a.days - b.days);
  const lines = pending.slice(0, 3).map(({ b, days }) =>
    days < 0 ? `🔴 ${b.name} venció hace ${-days} día${days === -1 ? '' : 's'} · ${fmt(b.amount)}`
      : days === 0 ? `🟠 Hoy vence ${b.name} · ${fmt(b.amount)}`
      : `🟡 ${b.name} vence ${days === 1 ? 'mañana' : 'en 2 días'} · ${fmt(b.amount)}`);

  await self.registration.showNotification(pending.length === 1 ? 'Tienes un pago pendiente' : `Tienes ${pending.length} pagos pendientes`, {
    body: lines.join('\n'),
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'mf-pagos',
    data: { url: '/pagos' },
  } as NotificationOptions);
}

// ---------- Recordatorio diario para anotar gastos ----------
async function checkDaily() {
  const cache = await caches.open('mf-meta');
  const prefsRes = await cache.match(new Request('/__mf_prefs'));
  if (!prefsRes) return;
  let prefs: { reminder?: { enabled: boolean; time: string } } = {};
  try { prefs = await prefsRes.json(); } catch { return; }
  if (!prefs.reminder?.enabled) return;
  const now = new Date();
  const [h, m] = (prefs.reminder.time || '20:00').split(':').map(Number);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const key = new Request('/__mf_last_daily');
  const prev = await cache.match(key);
  if (prev && (await prev.text()) === todayISO) return;
  const db = await openDB();
  if (!db) return;
  const txs = await readAll<{ date: string }>(db, 'transactions');
  db.close();
  await cache.put(key, new Response(todayISO));
  if (txs.some(t => t.date === todayISO)) return;
  await self.registration.showNotification('¿Ya anotaste los gastos de hoy?', {
    body: 'Tómate un minuto y registra lo que gastaste. Así tu mes queda claro.',
    icon: '/icon-192.png', badge: '/icon-192.png', tag: 'mf-diario', data: { url: '/' },
  } as NotificationOptions);
}

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
  let remote: { version?: string; notes?: string[] } = {};
  try { remote = await (await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })).json(); } catch { return; }
  if (!remote.version || (!force && !isNewer(remote.version, APP_VERSION))) return;
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
  if (event.tag === 'mf-pagos') event.waitUntil(Promise.all([checkBills(), checkDaily(), checkUpdate(), checkLoans()]));
});

// La app también puede pedir una revisión (por ejemplo, al abrirla o para probar).
self.addEventListener('message', (e) => {
  if (e.data?.type === 'CHECK_BILLS') e.waitUntil(Promise.all([checkBills(!!e.data.force), checkLoans(!!e.data.force)]));
  if (e.data?.type === 'CHECK_LOANS') e.waitUntil(checkLoans(!!e.data.force));
  if (e.data?.type === 'TEST_UPDATE_NOTICE') e.waitUntil(checkUpdate(true));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = data.url || '/';
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
