/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 CAMPANA Y CENTRO DE AVISOS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: contador de avisos sin leer y centro de avisos por pestañas
 *   (Todo · Pagos · Presupuesto · Kai · Hogar), agrupado en Hoy / Antes,
 *   con botones dentro de cada aviso: "Registrar ingreso", "Ya lo pagué"…
 *   Abajo: "¿Qué te avisamos?" para elegir qué avisos y a qué hora.
 * Dónde se ve: arriba a la derecha en cada módulo.
 * Si lo cambias: los avisos se calculan en services/alertsService.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, ChevronRight, Trash2, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlerts, markRead, clearLog, refreshAlerts, runAlertAction, type AppAlert, type LoggedAlert, type AlertCat } from '../../services/alertsService';
import NotifSettings from './NotifSettings';

const SEEN_KEY = 'mf_activitySeenAt';
const seenAt = () => Number(localStorage.getItem(SEEN_KEY) || 0);
const TABS: { id: 'todo' | AlertCat; label: string }[] = [
  { id: 'todo', label: 'Todo' }, { id: 'pagos', label: 'Pagos' }, { id: 'presupuesto', label: 'Presupuesto' }, { id: 'kai', label: 'Kai' }, { id: 'hogar', label: 'Hogar' },
];
const BG: Record<string, string> = { urgente: 'bg-rose-500/20', aviso: 'bg-amber-500/15', info: 'bg-sky-400/15', hogar: 'bg-lime-400/15', kai: 'bg-indigo-400/20' };

const catOf = (a: AppAlert | LoggedAlert): AlertCat => {
  if ('kind' in a && a.kind === 'hogar') return 'hogar';
  if ('kind' in a && a.kind === 'kai') return 'kai';
  return a.cat ?? (a.link?.startsWith('/pagos') || a.link?.startsWith('/prestamos') ? 'pagos' : a.link === '/mercado' ? 'presupuesto' : 'otros');
};
const emojiOf = (a: AppAlert | LoggedAlert) => a.emoji ?? (catOf(a) === 'hogar' ? '🏠' : catOf(a) === 'pagos' ? '📅' : catOf(a) === 'presupuesto' ? '🎯' : catOf(a) === 'kai' ? '🤖' : 'ℹ️');
const dayGroup = (t: number) => {
  const d = new Date(t); const now = new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  return days <= 0 ? 'Hoy' : days === 1 ? 'Ayer' : days < 7 ? 'Esta semana' : 'Antes';
};
const hour = (t: number) => new Date(t).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

export default function NotificationBell() {
  const { alerts, log, read, unread: unreadAlerts, activeIds } = useAlerts();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [tab, setTab] = useState<'todo' | AlertCat>('todo');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => { if (open) refreshAlerts(); }, [open]);
  useEffect(() => { const on = () => setSettings(true); window.addEventListener('mf:open-notif-settings', on); return () => window.removeEventListener('mf:open-notif-settings', on); }, []);

  const newActivity = log.filter(l => (l.kind === 'hogar' || l.kind === 'kai') && l.at > seenAt()).length;
  const unread = unreadAlerts + newActivity;
  const markAll = () => { markRead(alerts.map(a => a.id)); localStorage.setItem(SEEN_KEY, String(Date.now())); refreshAlerts(); };
  const close = () => { markAll(); setOpen(false); };
  const go = (link: string) => { close(); navigate(link); };

  const now = alerts.filter(a => !hidden.has(a.id) && (tab === 'todo' || catOf(a) === tab));
  const past = log.filter(l => !activeIds.has(l.id) && (tab === 'todo' || catOf(l) === tab)).slice(0, 50);
  const count = (id: 'todo' | AlertCat) => alerts.filter(a => !hidden.has(a.id) && (id === 'todo' || catOf(a) === id)).length;
  const hasHogar = log.some(l => l.kind === 'hogar');

  const act = async (a: AppAlert, run: string) => {
    setBusy(a.id + run);
    try {
      const done = await runAlertAction(run, to => go(to));
      if (done) { markRead([a.id]); setHidden(h => new Set(h).add(a.id)); }
    } finally { setBusy(null); }
  };

  const Item = ({ a, when }: { a: AppAlert | LoggedAlert; when?: number }) => {
    const isNew = when ? ((('kind' in a) && (a.kind === 'hogar' || a.kind === 'kai')) && when > seenAt()) : !read.has(a.id);
    const level = 'level' in a && a.level ? a.level : 'info';
    const bg = BG[catOf(a) === 'hogar' ? 'hogar' : catOf(a) === 'kai' ? 'kai' : level];
    const actions = !when ? (a as AppAlert).actions : undefined;
    return (
      <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40, height: 0 }}
        className={`rounded-[20px] ring-1 ${isNew ? 'bg-white/[0.06] ring-white/15' : 'bg-white/[0.03] ring-white/[0.06]'} ${when ? 'opacity-80' : ''}`}>
        <button onClick={() => go(a.link)} className="w-full flex gap-3 p-3 text-left">
          <span className={`relative w-10 h-10 rounded-[13px] flex items-center justify-center text-[19px] shrink-0 ${bg}`} aria-hidden="true">
            {emojiOf(a)}{isNew && <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-brand-lime ring-2 ring-[#121938]" />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-white text-[13.5px] font-bold leading-snug">{a.title}</span>
            <span className="block text-slate-400 text-[12px] mt-0.5 leading-snug">{a.message}</span>
            {when && <span className="block text-[10.5px] text-slate-500 mt-1">{hour(when)}</span>}
          </span>
          {!actions?.length && <ChevronRight size={16} className="text-slate-600 self-center shrink-0" />}
        </button>
        {actions?.length ? (
          <div className="flex gap-2 px-3 pb-3 pl-[64px] -mt-1">
            {actions.map(x => (
              <button key={x.run} disabled={!!busy} onClick={() => act(a as AppAlert, x.run)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold ${x.primary ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.08] text-white'} disabled:opacity-50`}>
                {busy === a.id + x.run ? '…' : x.label}
              </button>
            ))}
          </div>
        ) : null}
      </motion.li>
    );
  };

  const groups = past.reduce<Record<string, LoggedAlert[]>>((g, l) => { const k = dayGroup(l.at); (g[k] ||= []).push(l); return g; }, {});

  return (
    <>
      <button data-tour="bell" onClick={() => setOpen(true)} aria-label={unread ? `Avisos, ${unread} sin leer` : 'Avisos'}
        className="relative w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 active:scale-95 transition-transform">
        <motion.span animate={unread ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ duration: 0.8, repeat: unread ? Infinity : 0, repeatDelay: 4 }} className="flex"><Bell size={19} /></motion.span>
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
                className="theme-dark absolute top-0 inset-x-0 mx-auto max-w-md bg-[#121938] border-b border-white/10 rounded-b-[32px] shadow-2xl max-h-[90vh] flex flex-col"
                initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
                <div className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-2">
                  <div className="flex items-center justify-between">
                    <h2 id="notif-title" className="text-white text-[22px] font-extrabold">Tus avisos</h2>
                    <div className="flex items-center gap-2">
                      <button onClick={markAll} className="text-[12px] font-extrabold text-brand-lime px-2 py-1">Marcar leídos</button>
                      <button onClick={close} aria-label="Cerrar" className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center text-slate-300"><X size={18} /></button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 overflow-x-auto -mx-5 px-5 pb-1" role="tablist" aria-label="Tipos de aviso">
                    {TABS.filter(t => t.id !== 'hogar' || hasHogar).map(t => {
                      const n = count(t.id);
                      return (
                        <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-extrabold ring-1 ${tab === t.id ? 'bg-brand-lime text-brand-ink ring-brand-lime' : 'bg-white/[0.05] text-white ring-white/10'}`}>
                          {t.label}{n > 0 ? ` ${n}` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-5 pb-5 overflow-y-auto flex-1">
                  <p className="text-[11px] font-extrabold tracking-[.12em] text-slate-400 mt-2 mb-2">AHORA</p>
                  {now.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-[20px] bg-emerald-500/10 ring-1 ring-emerald-400/20 p-3.5">
                      <CheckCheck className="text-emerald-400 shrink-0" size={22} />
                      <p className="text-[13px] text-white font-bold">Todo al día<span className="block text-[11.5px] text-slate-400 font-normal">No hay nada pendiente aquí.</span></p>
                    </div>
                  ) : <ul className="space-y-2"><AnimatePresence initial={false}>{now.map(a => <Item key={a.id} a={a} />)}</AnimatePresence></ul>}

                  {Object.entries(groups).map(([g, list]) => (
                    <div key={g}>
                      <p className="text-[11px] font-extrabold tracking-[.12em] text-slate-400 mt-4 mb-2">{g.toUpperCase()}</p>
                      <ul className="space-y-2">{list.map(l => <Item key={l.id + l.at} a={l} when={l.at} />)}</ul>
                    </div>
                  ))}
                  {past.length > 0 && <button onClick={clearLog} className="mt-3 mx-auto flex items-center gap-1.5 text-xs text-slate-400 font-semibold"><Trash2 size={13} /> Borrar historial</button>}

                  <button onClick={() => setSettings(true)} className="mt-4 w-full flex items-center gap-3 rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 p-3.5 text-left">
                    <span className="w-10 h-10 rounded-[13px] bg-brand-lime/15 flex items-center justify-center"><Settings2 size={19} className="text-brand-lime" /></span>
                    <span className="flex-1"><span className="block text-white text-[13.5px] font-bold">¿Qué te avisamos?</span><span className="block text-[11.5px] text-slate-400">Elige los avisos y a qué hora</span></span>
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
      {createPortal(<AnimatePresence>{settings && <NotifSettings onClose={() => setSettings(false)} />}</AnimatePresence>, document.body)}
    </>
  );
}
