/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 CAMPANA Y CENTRO DE NOTIFICACIONES
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Contador de avisos sin leer, pestaña Pendientes (pagos por vencer, presupuestos) e Historial (avisos pasados y lo que hace tu hogar).
 * Dónde se ve: Arriba a la derecha en cada módulo.
 * Si lo cambias: Los avisos se calculan en services/alertsService.ts; todas las campanas comparten el mismo estado.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Clock, Info, CheckCheck, BellRing, Smartphone, ChevronRight, History, Home, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlerts, markRead, clearLog, refreshAlerts, enableReminders, sendTestNotification, type AppAlert, type LoggedAlert } from '../../services/alertsService';

const LEVEL = {
  urgente: { icon: AlertTriangle, ring: 'from-red-500 to-rose-600', tag: 'Urgente', tagCls: 'bg-red-500/15 text-red-300' },
  aviso: { icon: Clock, ring: 'from-amber-400 to-orange-500', tag: 'Pronto', tagCls: 'bg-amber-500/15 text-amber-300' },
  info: { icon: Info, ring: 'from-sky-400 to-blue-600', tag: 'Info', tagCls: 'bg-sky-500/15 text-sky-300' },
  hogar: { icon: Home, ring: 'from-[#2C3560] to-[#0B1026]', tag: 'Hogar', tagCls: 'bg-lime-400/15 text-lime-300' },
};
const SEEN_KEY = 'mf_activitySeenAt';
const seenAt = () => Number(localStorage.getItem(SEEN_KEY) || 0);

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

/** Campana con contador y centro de notificaciones (pendientes + historial). */
export default function NotificationBell() {
  // Todas las campanas de la app leen el mismo estado (useAlerts): nunca muestran un aviso viejo.
  const { alerts, log, read, unread: unreadAlerts, activeIds } = useAlerts();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'ahora' | 'historial'>('ahora');
  const [perm, setPerm] = useState<NotificationPermission | 'none'>('Notification' in window ? Notification.permission : 'none');
  const navigate = useNavigate();
  useEffect(() => { if (open) refreshAlerts(); }, [open]);

  const newActivity = log.filter(l => l.kind === 'hogar' && l.at > seenAt()).length;
  const unread = unreadAlerts + newActivity;
  const close = () => { markRead(alerts.map(a => a.id)); localStorage.setItem(SEEN_KEY, String(Date.now())); setOpen(false); };
  const go = (link: string) => { close(); navigate(link); };
  const activate = async () => { const p = await enableReminders(); setPerm(p); if (p === 'granted') sendTestNotification(); };

  const card = (a: AppAlert | LoggedAlert, i: number, when?: number) => {
    const isHogar = 'kind' in a && a.kind === 'hogar';
    const L = LEVEL[isHogar ? 'hogar' : ((a as AppAlert).level ?? 'info')]; const Icon = L.icon;
    const isNew = when ? (isHogar && when > seenAt()) : !read.has(a.id);
    const resolved = !!when && !isHogar && !activeIds.has(a.id);
    return (
      <motion.li key={a.id + (when ?? '')} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.05, type: 'spring', damping: 22 }}>
        <button onClick={() => go(a.link)} className={`w-full text-left flex gap-3 p-3.5 rounded-2xl border transition-colors ${isNew ? 'border-white/15 bg-white/[0.06]' : 'border-white/5 bg-white/[0.02]'}`}>
          <span className={`relative w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br ${L.ring} flex items-center justify-center shadow-lg ${isHogar ? 'ring-1 ring-lime-300/40' : ''} ${resolved ? 'opacity-50' : ''}`}>
            <Icon size={20} className={isHogar ? 'text-brand-lime' : 'text-white'} />
            {isNew && <motion.span className="absolute inset-0 rounded-2xl border-2 border-white/60" animate={{ scale: [1, 1.25], opacity: [0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${L.tagCls}`}>{L.tag}</span>
              {resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><CheckCheck size={10} /> Resuelto</span>}
              {when && <span className="text-[10px] text-slate-500">{ago(when)}</span>}
            </span>
            <span className="block text-white text-sm font-semibold mt-1">{a.title}</span>
            <span className="block text-slate-400 text-xs mt-0.5 leading-relaxed">{a.message}</span>
          </span>
          <ChevronRight size={16} className="text-slate-600 self-center" />
        </button>
      </motion.li>
    );
  };

  return (
    <>
      <button data-tour="bell" onClick={() => setOpen(true)} aria-label={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        className="relative w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 active:scale-95 transition-transform">
        <motion.span animate={unread ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ duration: 0.8, repeat: unread ? Infinity : 0, repeatDelay: 4 }} className="flex">
          <Bell size={19} />
        </motion.span>
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-appbg">
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
              <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="notif-title"
                className="absolute top-0 inset-x-0 mx-auto max-w-md bg-gradient-to-b from-surface2 to-surface2 border-b border-white/10 rounded-b-[32px] shadow-2xl max-h-[88vh] flex flex-col"
                initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-600/40"><BellRing size={22} className="text-brand-ink" /></span>
                      <div>
                        <h2 id="notif-title" className="text-white text-lg font-bold leading-tight">Notificaciones</h2>
                        <p className="text-xs text-slate-400">{alerts.length ? `${alerts.length} ${alerts.length === 1 ? 'aviso necesita' : 'avisos necesitan'} tu atención` : 'Todo al día'}</p>
                      </div>
                    </div>
                    <button onClick={close} aria-label="Cerrar" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-black/30 p-1 rounded-2xl mt-4">
                    {(['ahora', 'historial'] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)} className={`relative py-2 rounded-xl text-sm font-semibold ${tab === t ? 'text-white' : 'text-slate-400'}`}>
                        {tab === t && <motion.span layoutId="notif-tab" className="absolute inset-0 rounded-xl bg-white/10" />}
                        <span className="relative flex items-center justify-center gap-1.5">{t === 'ahora' ? <>Pendientes{alerts.length > 0 && <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5">{alerts.length}</span>}</> : <><History size={14} /> Historial{newActivity > 0 && <span className="text-[10px] bg-brand-lime text-brand-ink rounded-full px-1.5">{newActivity}</span>}</>}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-5 pb-5 overflow-y-auto flex-1">
                  {tab === 'ahora' ? (
                    alerts.length === 0 ? (
                      <motion.div className="text-center py-8" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <span className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 flex items-center justify-center"><CheckCheck className="text-emerald-400" size={32} /></span>
                        <p className="text-white font-semibold mt-3">¡Todo al día!</p>
                        <p className="text-slate-400 text-sm">No tienes pagos por vencer ni alertas.</p>
                      </motion.div>
                    ) : <ul className="space-y-2">{alerts.map((a, i) => card(a, i))}</ul>
                  ) : (
                    log.length === 0 ? <p className="text-center text-slate-400 text-sm py-8">Aquí quedan los avisos de la app y lo que hagan en tu hogar.</p>
                      : <>
                          <ul className="space-y-2">{log.slice(0, 60).map((a, i) => card(a, i, a.at))}</ul>
                          <button onClick={clearLog} className="mt-3 mx-auto flex items-center gap-1.5 text-xs text-slate-400 font-semibold"><Trash2 size={13} /> Borrar historial</button>
                        </>
                  )}

                  <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
                    <div className="flex items-start gap-3">
                      <Smartphone size={20} className={perm === 'granted' ? 'text-emerald-400' : 'text-violet-300'} />
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{perm === 'granted' ? 'Avisos en el celular activados' : 'Recibe avisos en el celular'}</p>
                        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                          {perm === 'granted' ? 'Te avisamos cuando un pago esté por vencer (2 días antes, el mismo día y si se vence). Para avisos exactos aunque no abras la app, agrega tus pagos al calendario desde Pagos.'
                            : perm === 'denied' ? 'Están bloqueados. Actívalos en Ajustes del celular → Apps → Chrome → Notificaciones.'
                            : 'Activa los avisos y te recordaremos tus pagos antes de la fecha límite.'}
                        </p>
                        {perm === 'default' && <button onClick={activate} className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-brand-ink text-sm font-bold">Activar avisos</button>}
                        {perm === 'granted' && <button onClick={() => sendTestNotification()} className="mt-3 text-xs text-violet-300 font-semibold">Enviar notificación de prueba</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
