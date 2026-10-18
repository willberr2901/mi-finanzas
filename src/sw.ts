/// <reference lib="webworker" />
/**
 * ════════════════════════════════════════════════════════════════════
 * ⚙️ SERVICE WORKER (funciona sin internet + avisos)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Guarda la app para usarla sin internet, revisa pagos en segundo plano y muestra notificaciones del celular.
 * Dónde se ve: En segundo plano.
 * Si lo cambias: Un error aquí puede dejar a todos con una versión vieja: prueba antes de publicar.
 * Nota: Service worker propio de Mi Finanzas: · guarda la app en el celular para que funcione sin internet · revisa en segundo plano tus pagos y te avisa con una notificación del celular (todo se calcula en el celular, sin servidores)
 * ════════════════════════════════════════════════════════════════════
 */
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

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

// Revisión periódica (Chrome Android con la app instalada; el sistema decide la hora exacta).
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'mf-pagos') event.waitUntil(Promise.all([checkBills(), checkDaily()]));
});

// La app también puede pedir una revisión (por ejemplo, al abrirla o para probar).
self.addEventListener('message', (e) => {
  if (e.data?.type === 'CHECK_BILLS') e.waitUntil(checkBills(!!e.data.force));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = all.find(c => 'focus' in c) as WindowClient | undefined;
    if (existing) { await existing.focus(); existing.navigate(url).catch(() => {}); }
    else await self.clients.openWindow(url);
  })());
});
