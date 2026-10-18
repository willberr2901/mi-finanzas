/**
 * ════════════════════════════════════════════════════════════════════
 * 🏠 SINCRONIZACIÓN DEL HOGAR (en vivo y cifrada)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: cuando hay un hogar creado, sube los cambios del mercado como
 *           "cajas cerradas" (cifradas en este celular) y baja las de los
 *           demás. El servidor nunca ve nombres, productos ni precios.
 * Sin hogar: este archivo NO se conecta a nada.
 * Dónde se ve: chip "Hogar" en Mercado, Ajustes → Hogar sincronizado.
 * Si lo cambias: puedes romper la sincronización entre celulares.
 * Servidor: proyecto Supabase "mi-finanzas-sync" (ver supabase/sync.sql).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { deriveKeys, newHouseholdKey, seal, open, boxName, type HouseholdKeys } from './householdCrypto';
import { SYNC_URL, SYNC_KEY, SYNC_REALTIME_KEY } from './syncConfig';
import { onLocalChange, allKeys, getDoc, applyRemote, myName, type RemoteChange } from '../market/marketStore';
import { notify, logActivity } from '../notificationService';
import { formatCOP } from '../../utils/format';

// ═══ SECCIÓN: Estado guardado en este celular ═══
interface Household { key: string; name: string; since: number; joinedAt: number; ready?: boolean }
const HKEY = 'mf_household';
const OUTBOX = 'mf_sync_outbox';
const DEVICE = 'mf_device';

const readJSON = <T,>(k: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return fallback; } };
const writeJSON = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio */ } };

export const getHousehold = (): Household | null => readJSON<Household | null>(HKEY, null);
const saveHousehold = (h: Household | null) => { if (h) writeJSON(HKEY, h); else localStorage.removeItem(HKEY); };
const deviceId = () => {
  let d = localStorage.getItem(DEVICE);
  if (!d) { d = crypto.randomUUID(); localStorage.setItem(DEVICE, d); }
  return d;
};

// ═══ SECCIÓN: Estado visible (chip "Sincronizado hace 1 min") ═══
export type SyncStatus = 'off' | 'connecting' | 'ok' | 'syncing' | 'offline' | 'error';
interface StatusInfo { status: SyncStatus; lastSync: number | null; online: number }
let info: StatusInfo = { status: getHousehold() ? 'connecting' : 'off', lastSync: null, online: 0 };
const setInfo = (patch: Partial<StatusInfo>) => { info = { ...info, ...patch }; window.dispatchEvent(new Event('mf:sync-status')); };

export const useHousehold = () => {
  const [, tick] = useState(0);
  useEffect(() => {
    const on = () => tick(t => t + 1);
    window.addEventListener('mf:sync-status', on);
    const iv = setInterval(on, 30000); // refresca "hace X min"
    return () => { window.removeEventListener('mf:sync-status', on); clearInterval(iv); };
  }, []);
  return { household: getHousehold(), ...info };
};

// ═══ SECCIÓN: Llamadas al servidor (solo cajas cifradas) ═══
const rpc = async <T,>(fn: string, body: unknown): Promise<T> => {
  const r = await fetch(`${SYNC_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SYNC_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`sync ${fn} ${r.status}`);
  const text = await r.text();
  return (text ? JSON.parse(text) : null) as T;
};

let keys: HouseholdKeys | null = null;
let started = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pulling: Promise<void> | null = null;
let channel: any = null;
let realtime: any = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const outbox = () => new Set(readJSON<string[]>(OUTBOX, []));
const queue = (ks: string[]) => {
  if (!getHousehold()) return;
  const o = outbox(); ks.forEach(k => o.add(k)); writeJSON(OUTBOX, [...o]);
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 350);
};

/** Sube los cambios pendientes (cifrados). */
const push = async () => {
  const h = getHousehold();
  if (!h || !keys) return;
  const pending = [...outbox()];
  if (!pending.length) return;
  setInfo({ status: 'syncing' });
  try {
    for (let i = 0; i < pending.length; i += 100) {
      const slice = pending.slice(i, i + 100);
      const items = [];
      for (const k of slice) {
        const v = getDoc(k);
        if (!v) continue;
        items.push({ k: await boxName(keys, k), box: await seal(keys, { k, v, by: deviceId(), n: myName() }) });
      }
      if (items.length) await rpc('sync_push', { p_room: keys.room, p_items: items });
      const o = outbox(); slice.forEach(k => o.delete(k)); writeJSON(OUTBOX, [...o]);
    }
    channel?.send({ type: 'broadcast', event: 'ping', payload: {} });
    setInfo({ status: 'ok', lastSync: Date.now() });
  } catch {
    setInfo({ status: navigator.onLine ? 'error' : 'offline' });
  }
};

/** Baja lo que cambiaron los demás celulares y avisa con una notificación bonita. */
export const pull = () => {
  if (pulling) return pulling;
  pulling = (async () => {
    const h = getHousehold();
    if (!h || !keys) return;
    try {
      let since = h.since;
      const byName = new Map<string, RemoteChange[]>();
      for (let page = 0; page < 20; page++) {
        const rows = await rpc<{ k: string; box: string; seq: number }[]>('sync_pull', { p_room: keys.room, p_since: since });
        if (!rows?.length) break;
        const docs: { key: string; value: unknown }[] = [];
        const who: string[] = [];
        for (const r of rows) {
          since = Math.max(since, r.seq);
          const data = await open<{ k: string; v: unknown; by: string; n: string }>(keys, r.box);
          if (!data || data.by === deviceId()) continue;
          docs.push({ key: data.k, value: data.v }); who.push(data.n || 'Alguien del hogar');
        }
        // Aplica por persona para poder decir "Chumpi agregó…"
        const groups = new Map<string, { key: string; value: unknown }[]>();
        docs.forEach((d, i) => { const g = groups.get(who[i]) ?? []; g.push(d); groups.set(who[i], g); });
        for (const [n, g] of groups) { const c = applyRemote(g); if (c.length) byName.set(n, [...(byName.get(n) ?? []), ...c]); }
        if (rows.length < 1000) break;
      }
      const cur = getHousehold();
      if (cur) saveHousehold({ ...cur, since, ready: true });
      if (h.ready) byName.forEach((c, n) => announce(n, c));  // en la primera descarga (al unirse) no se avisa
      setInfo({ status: 'ok', lastSync: Date.now() });
    } catch {
      setInfo({ status: navigator.onLine ? 'error' : 'offline' });
    }
  })().finally(() => { pulling = null; });
  return pulling;
};

// ═══ SECCIÓN: Avisos de lo que hicieron los demás ═══
const announce = (who: string, changes: RemoteChange[]) => {
  const trip = changes.find(c => c.kind === 'trip');
  if (trip && trip.kind === 'trip') {
    const msg = `Total ${formatCOP(trip.total)}. Ya está en tu historial de mercados.`;
    notify({ title: `${who} terminó el mercado`, message: msg, type: 'hogar', log: false });
    logActivity({ title: `${who} terminó el mercado`, message: msg, link: '/mercado?tab=historial' });
    return;
  }
  const named = changes.filter(c => 'name' in c) as { kind: string; name: string }[];
  if (!named.length) {
    const b = changes.find(c => c.kind === 'budget');
    if (b && b.kind === 'budget') logActivity({ title: `${who} cambió el presupuesto del mercado`, message: formatCOP(b.value), link: '/mercado' });
    return;
  }
  const verb = (k: string) => ({ added: 'agregó', checked: 'compró', removed: 'quitó', edited: 'editó' } as Record<string, string>)[k] ?? 'cambió';
  let title: string, message: string;
  if (named.length === 1) {
    title = `${who} ${verb(named[0].kind)} ${named[0].name}`;
    message = named[0].kind === 'checked' ? 'Se tachó de la lista del mercado.' : 'Lista del mercado actualizada.';
  } else {
    const kinds = new Set(named.map(c => c.kind));
    const first = named.slice(0, 3).map(c => c.name).join(', ');
    title = kinds.size === 1 ? `${who} ${verb(named[0].kind)} ${named.length} productos` : `${who} actualizó ${named.length} productos`;
    message = `${first}${named.length > 3 ? '…' : ''}`;
  }
  notify({ title, message, type: 'hogar', log: false });
  logActivity({ title, message, link: '/mercado' });
};

// ═══ SECCIÓN: Conexión en vivo (aviso instantáneo + quién está en línea) ═══
const connectLive = async () => {
  if (!keys || channel) return;
  try {
    const { RealtimeClient } = await import('@supabase/realtime-js');
    realtime = new RealtimeClient(`${SYNC_URL.replace('https', 'wss')}/realtime/v1`, { params: { apikey: SYNC_REALTIME_KEY, eventsPerSecond: 5 } });
    channel = realtime.channel(`mf-${keys.room.slice(0, 32)}`, { config: { broadcast: { self: false }, presence: { key: deviceId() } } });
    channel
      .on('broadcast', { event: 'ping' }, () => { pull(); })
      .on('presence', { event: 'sync' }, () => setInfo({ online: Object.keys(channel.presenceState()).length }))
      .subscribe((s: string) => { if (s === 'SUBSCRIBED') { channel.track({ t: Date.now() }); pull(); } });
  } catch { /* sin conexión en vivo: queda la revisión periódica */ }
};
const disconnectLive = () => {
  try { channel?.unsubscribe(); realtime?.disconnect(); } catch { /* ya cerrado */ }
  channel = null; realtime = null; setInfo({ online: 0 });
};

// ═══ SECCIÓN: Arranque (se llama una vez desde App.tsx) ═══
export const startHouseholdSync = async () => {
  if (started) return;
  started = true;
  onLocalChange(queue);
  window.addEventListener('online', () => { push(); pull(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { push(); pull(); }
  });
  await boot();
};

const boot = async () => {
  const h = getHousehold();
  if (!h) { setInfo({ status: 'off' }); return; }
  setInfo({ status: 'connecting' });
  keys = await deriveKeys(h.key);
  await pull();
  await push();
  connectLive();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => { if (document.visibilityState === 'visible') pull(); }, 30000);
};

// ═══ SECCIÓN: Crear, unirse, salir ═══
export const createHousehold = async (name: string) => {
  saveHousehold({ key: newHouseholdKey(), name: name.trim() || 'Mi hogar', since: 0, joinedAt: Date.now() });
  writeJSON(OUTBOX, allKeys());
  await boot();
};

export const inviteLink = () => {
  const h = getHousehold();
  if (!h) return '';
  // Todo va después de "#": esa parte del enlace NUNCA se envía a ningún servidor.
  return `${location.origin}/hogar#k=${h.key}&n=${encodeURIComponent(h.name)}`;
};

export const parseInvite = (text: string): { key: string; name: string } | null => {
  const m = text.match(/[#&]k=([A-Za-z0-9_-]{43})(?:&n=([^&\s]*))?/);
  if (!m) return null;
  let name = 'Hogar';
  try { name = decodeURIComponent(m[2] || '') || 'Hogar'; } catch { /* nombre raro */ }
  return { key: m[1], name };
};

export const joinHousehold = async (invite: { key: string; name: string }) => {
  disconnectLive();
  saveHousehold({ key: invite.key, name: invite.name.slice(0, 40), since: 0, joinedAt: Date.now() });
  writeJSON(OUTBOX, allKeys());   // lo que ya tenías se une a la lista del hogar
  await boot();
};

export const renameHousehold = (name: string) => {
  const h = getHousehold();
  if (h) { saveHousehold({ ...h, name: name.trim().slice(0, 40) || h.name }); setInfo({}); }
};

/** Sale del hogar: este celular deja de sincronizar. Tus datos se quedan aquí. */
export const leaveHousehold = () => {
  disconnectLive();
  if (pollTimer) clearInterval(pollTimer);
  keys = null;
  saveHousehold(null);
  localStorage.removeItem(OUTBOX);
  setInfo({ status: 'off', lastSync: null });
};

/** Borra todas las cajas del hogar en el servidor y sale. */
export const deleteHouseholdFromServer = async () => {
  if (!keys) { const h = getHousehold(); if (h) keys = await deriveKeys(h.key); }
  if (keys) await rpc('sync_delete_room', { p_room: keys.room });
  leaveHousehold();
};

export const syncNow = async () => { await push(); await pull(); };
