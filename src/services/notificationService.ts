/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 AVISOS DE LA APP (notify) + REGISTRO DE ACTIVIDAD
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: muestra los avisos de arriba con el diseño de ToastCard, evita
 *           avisos repetidos y guarda en el historial lo que pasa en el hogar.
 * Dónde se ve: toda la app. El historial está en la campana 🔔 → Historial.
 * Si lo cambias: todos los módulos usan notify(); conserva sus parámetros.
 * ════════════════════════════════════════════════════════════════════
 */
import { createElement } from 'react';
import { toast, type ToastOptions } from 'react-toastify';
import ToastCard, { type ToastKind } from '../components/notifications/ToastCard';

// ═══ SECCIÓN: Registro de auditoría (Ajustes → Seguridad) ═══
export interface AuditEntry {
  id: string;
  timestamp: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'BACKUP' | 'RESTORE' | 'SECURITY';
  module: string;
  details: string;
  success: boolean;
}
export type AuditLogFunction = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
let auditLogFn: AuditLogFunction | null = null;
export const setAuditLogFunction = (fn: AuditLogFunction) => { auditLogFn = fn; };

// ═══ SECCIÓN: Limpieza de textos ═══
/** Quita emojis/símbolos del inicio (el aviso ya trae su ícono) y recorta textos largos.
 *  React ya protege contra código malicioso, así que no se convierten comillas ni "/". */
const clean = (s: string, max: number) => s.replace(/^[^\p{L}\p{N}¿¡$]+/u, '').trim().slice(0, max);

// ═══ SECCIÓN: Mostrar un aviso ═══
const recent = new Map<string, number>();

export const notify = ({
  title, message, type = 'info', duration, log = true, module = 'App', action,
}: {
  title: string;
  message?: string;
  type?: ToastKind;
  duration?: number;
  log?: boolean;
  module?: string;
  action?: { label: string; onClick: () => void };
}) => {
  const t = clean(title, 90) || title.slice(0, 90);
  const m = message ? clean(message, 220) : '';

  // El mismo aviso dos veces seguidas (en menos de 2,5 s) no se repite.
  const sig = `${type}|${t}|${m}`;
  const now = Date.now();
  if (now - (recent.get(sig) ?? 0) < 2500) return sig;
  recent.set(sig, now);
  if (recent.size > 40) recent.clear();

  const options: ToastOptions = {
    toastId: `${sig}-${now}`,
    autoClose: duration ?? (type === 'error' || type === 'warning' ? 5000 : action ? 6000 : 3200),
    icon: false,
    className: `mf-toast mf-toast-${type}`,
    closeOnClick: !action,
  };
  toast(({ closeToast }) => createElement(ToastCard, { kind: type, title: t, message: m || undefined, action, closeToast }), options);

  if (log && auditLogFn) {
    const map: Record<string, AuditEntry['action']> = {
      agregad: 'CREATE', registrad: 'CREATE', actualizad: 'UPDATE', eliminad: 'DELETE',
      guardad: 'BACKUP', restaurad: 'RESTORE', bloquead: 'SECURITY', desbloquead: 'SECURITY',
    };
    const text = `${t} ${m}`.toLowerCase();
    auditLogFn({
      action: Object.entries(map).find(([k]) => text.includes(k))?.[1] || 'UPDATE',
      module, details: `${t}${m ? ` - ${m}` : ''}`, success: type !== 'error',
    });
  }

  // Con la app en segundo plano, el aviso llega también como notificación del celular.
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
    navigator.serviceWorker?.ready.then(reg => reg.showNotification(t, { body: m, icon: '/icon-192.png', badge: '/icon-192.png', tag: `mf-${type}` }))
      .catch(() => { try { new Notification(t, { body: m, icon: '/icon-192.png' }); } catch { /* sin permiso */ } });
  }
  return sig;
};

/** Cierra todos los avisos en pantalla (se usa al cambiar de módulo para no dejar avisos viejos). */
export const clearAllNotifications = () => { toast.dismiss(); };

// ═══ SECCIÓN: Historial de actividad (campana → Historial) ═══
export interface ActivityEntry { id: string; title: string; message: string; link: string; at: number; kind: 'hogar' | 'alerta' }
const LOG_KEY = 'mf_notifLog';
export const getActivity = (): ActivityEntry[] => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; } };
export const saveActivity = (list: ActivityEntry[]) => {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, 120))); } catch { /* sin espacio */ }
  window.dispatchEvent(new Event('mf:alerts-changed'));
};
export const logActivity = (e: { title: string; message: string; link: string }) =>
  saveActivity([{ id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), kind: 'hogar', ...e }, ...getActivity()]);

// ═══ SECCIÓN: Atajos usados por varios módulos ═══
const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
export const notifyExpenseAdded = (name: string, amount: number, module = 'Finanzas') =>
  notify({ title: 'Gasto registrado', message: `${name}: ${cop(amount)}`, type: 'success', module });
export const notifyIncomeAdded = (name: string, amount: number, module = 'Finanzas') =>
  notify({ title: 'Ingreso registrado', message: `${name}: ${cop(amount)}`, type: 'success', module });
export const notifyMarketItemAdded = (itemName: string, price: number, module = 'Mercado') =>
  notify({ title: 'Producto agregado', message: `${itemName} · ${cop(price)}`, type: 'success', module });
export const notifyMarketCompleted = (items: number, total: number, module = 'Mercado') =>
  notify({ title: 'Compra finalizada', message: `${items} productos · Total ${cop(total)}`, type: 'success', module });

export const notifySecurityAction = (action: 'LOCK' | 'UNLOCK' | 'PIN_CHANGED' | 'PIN_SETUP' | 'BACKUP' | 'RESTORE', module = 'Seguridad') => {
  const msgs: Record<string, { title: string; message: string; type: ToastKind }> = {
    LOCK: { title: 'App bloqueada', message: 'Necesitas tu PIN para entrar', type: 'info' },
    UNLOCK: { title: 'App desbloqueada', message: 'Bienvenida de nuevo', type: 'success' },
    PIN_SETUP: { title: 'PIN configurado', message: 'Tu app ahora está protegida', type: 'success' },
    PIN_CHANGED: { title: 'PIN actualizado', message: 'Tu nuevo PIN quedó guardado', type: 'success' },
    BACKUP: { title: 'Copia de seguridad creada', message: 'Tus datos están respaldados', type: 'success' },
    RESTORE: { title: 'Copia restaurada', message: 'Tus datos se recuperaron', type: 'success' },
  };
  return notify({ ...msgs[action], module });
};

export const notifyError = (title: string, message: string, module = 'App') =>
  notify({ title, message, type: 'error', module });

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try { return (await Notification.requestPermission()) === 'granted'; } catch { return false; }
};
