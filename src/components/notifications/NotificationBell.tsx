import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Clock, Info, BellRing, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computeAlerts, getReadIds, markRead, type AppAlert } from '../../services/alertsService';

const LEVEL = {
  urgente: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
  aviso: { icon: Clock, color: 'text-amber-300', bg: 'bg-amber-500/15' },
  info: { icon: Info, color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
};

/** Campana con contador y panel de avisos de la app (pagos, vencimientos, presupuesto). */
export default function NotificationBell() {
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [read, setRead] = useState<Set<string>>(getReadIds());
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'none'>('Notification' in window ? Notification.permission : 'none');
  const navigate = useNavigate();

  const refresh = () => computeAlerts().then(setAlerts).catch(() => {});
  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('mf:data-changed', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('mf:data-changed', refresh); };
  }, []);

  const unread = alerts.filter(a => !read.has(a.id)).length;

  const close = () => {
    markRead(alerts.map(a => a.id));
    setRead(getReadIds());
    setOpen(false);
  };

  const go = (a: AppAlert) => { close(); navigate(a.link); };

  const enablePush = async () => {
    if (!('Notification' in window)) return;
    setPerm(await Notification.requestPermission());
  };

  return (
    <>
      <button onClick={() => { refresh(); setOpen(true); }} aria-label={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        className="relative w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 active:scale-95 transition-transform">
        <motion.span animate={unread ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ duration: 0.8, repeat: unread ? Infinity : 0, repeatDelay: 4 }} className="flex">
          <Bell size={19} />
        </motion.span>
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#070B14]">
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
              <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="notif-title"
                className="absolute top-0 inset-x-0 mx-auto max-w-md bg-[#0d1322] border-b border-white/10 rounded-b-3xl p-5 pt-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 id="notif-title" className="text-white text-lg font-bold flex items-center gap-2"><BellRing size={18} className="text-violet-400" /> Notificaciones</h2>
                  <button onClick={close} aria-label="Cerrar" className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCheck className="mx-auto text-emerald-400 mb-2" size={32} />
                    <p className="text-white font-semibold">Todo al día</p>
                    <p className="text-slate-400 text-sm">No tienes pagos por vencer ni alertas.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {alerts.map((a, i) => {
                      const L = LEVEL[a.level]; const Icon = L.icon;
                      return (
                        <motion.li key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <button onClick={() => go(a)} className={`w-full text-left flex gap-3 p-3 rounded-2xl border ${read.has(a.id) ? 'border-white/5 bg-white/[0.02]' : 'border-white/10 bg-white/5'}`}>
                            <span className={`w-9 h-9 shrink-0 rounded-xl ${L.bg} flex items-center justify-center`}><Icon size={18} className={L.color} /></span>
                            <span className="flex-1">
                              <span className="block text-white text-sm font-semibold">{a.title}</span>
                              <span className="block text-slate-400 text-xs mt-0.5">{a.message}</span>
                            </span>
                            {!read.has(a.id) && <span className="w-2 h-2 rounded-full bg-violet-400 mt-2" aria-label="Sin leer" />}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}

                {perm === 'default' && (
                  <button onClick={enablePush} className="mt-4 w-full text-sm text-violet-300 border border-violet-500/30 rounded-2xl py-3 hover:bg-violet-500/10">
                    Activar avisos en el celular para tus pagos
                  </button>
                )}
                {perm === 'denied' && <p className="mt-4 text-[11px] text-slate-500 text-center">Los avisos del celular están bloqueados. Puedes activarlos en la configuración del navegador.</p>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
