/**
 * ════════════════════════════════════════════════════════════════════
 * ☰ MÓDULOS (menú de pantalla completa, animado)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: al tocar ☰ la pantalla se abre en círculo desde el botón y
 *   entran en cascada las tarjetas de cada módulo, cada una con su color y
 *   un DATO VIVO ("Pagos · 2 por pagar", "Mercado · 8 por comprar"…).
 *   Abajo: Ajustes, Seguridad, Novedades, Califícanos, Recomiéndanos,
 *   Privacidad, Apóyanos, redes y "Descargar la app".
 * Dónde se ve: botón ☰ arriba a la izquierda en cada módulo.
 * Si lo cambias: los módulos (nombre, ruta, ícono) salen de utils/modules.ts.
 *   Reportes NO aparece: es secreto (7 toques en la versión, Ajustes → Acerca de).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Lock, Download, ChevronRight, BarChart3, Settings, ShieldCheck, Sparkles, Star, Heart, Coffee, type LucideIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { openInstall, canOfferInstall } from './pwa/InstallAppSheet';
import { openSecurityCenter } from './security/SecurityCenter';
import { InstagramIcon, openInstagram, INSTAGRAM_USER } from './social/Instagram';
import { ChannelIcon, openWhatsAppChannel } from './social/WhatsAppChannel';
import { openShareApp } from './share/ShareAppSheet';
import { MODULES } from '../utils/modules';
import { APP_VERSION, RELEASE_NOTES } from '../version';
import { RELEASE_STORY } from '../services/releaseStories';
import { moduleHasNew } from '../services/newFeatures';
import Kai from './assistant/Kai';
import { openSupport, isAlly } from '../services/supportService';
import { openRating, myRating } from '../services/ratingService';
import { db } from '../utils/database';
import { loadBillStatuses } from '../services/billsService';
import { listItems } from '../services/market/marketStore';
import { listLoans, isClosed } from '../services/loansService';
import { getPlan } from '../services/budgetPlan';
import { formatCOP } from '../utils/format';
import { haptic } from '../utils/haptics';
import { IS_TEST } from '../utils/env';

type Key = 'inicio' | 'mercado' | 'finanzas' | 'pagos' | 'prestamos' | 'analisis' | 'escaner' | 'facturas';
const TILES: { key: Key; color: string; emoji: string }[] = [
  { key: 'inicio', color: '#C6F432', emoji: '🏠' }, { key: 'mercado', color: '#FBBF24', emoji: '🛒' },
  { key: 'finanzas', color: '#7DD3FC', emoji: '💸' }, { key: 'pagos', color: '#F9A8D4', emoji: '📅' },
  { key: 'prestamos', color: '#C4B5FD', emoji: '🤝' }, { key: 'analisis', color: '#6EE7B7', emoji: '📊' },
  { key: 'escaner', color: '#5EEAD4', emoji: '🧾' }, { key: 'facturas', color: '#FDBA74', emoji: '🗂️' },
];
const ANALISIS = { path: '/analisis', label: 'Análisis', tagline: 'Tu mes en detalle', icon: BarChart3 };

/** Datos vivos de cada tarjeta (se leen al abrir; todo del celular). */
function useLive(open: boolean) {
  const [live, setLive] = useState<Partial<Record<Key, string>>>({});
  useEffect(() => {
    if (!open) return;
    let off = false;
    (async () => {
      const out: Partial<Record<Key, string>> = {};
      try {
        const now = new Date(); const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const tx = (await db.transactions.toArray()).filter(t => t.date.startsWith(ym));
        const exp = tx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        const inc = Math.max(tx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0), getPlan()?.income ?? 0);
        out.inicio = inc > 0 ? (inc - exp >= 0 ? `Te quedan ${formatCOP(inc - exp)}` : `Gastaste ${formatCOP(exp - inc)} de más`) : 'Tu mes de un vistazo';
        out.finanzas = tx.length ? `${tx.length} movimiento${tx.length === 1 ? '' : 's'} este mes` : 'Anota tu primer gasto';
        out.analisis = exp ? `Salió ${formatCOP(exp)} este mes` : 'Tu mes en detalle';
        const st = await loadBillStatuses();
        const pend = st.filter(s => !s.paid).length;
        out.pagos = st.length ? (pend ? `${pend} por pagar` : 'Todo pagado ✅') : 'Agrega tus pagos fijos';
      } catch { /* sin datos */ }
      try { const p = listItems().filter(i => !i.checked).length; out.mercado = p ? `${p} por comprar` : 'Lista lista ✅'; } catch { /* nada */ }
      try { const l = listLoans().filter(x => !isClosed(x)).length; out.prestamos = l ? `${l} activo${l === 1 ? '' : 's'}` : 'A paz y salvo'; } catch { /* nada */ }
      out.escaner = 'Foto a tu factura'; out.facturas = 'Tus facturas guardadas';
      if (!off) setLive(out);
    })();
    return () => { off = true; };
  }, [open]);
  return live;
}

/** Tarjeta de la sección "Más": ícono con su color y brillo, título y una línea que dice qué hay adentro. */
function More({ icon: Icon, color, title, sub, onClick, badge }: { icon: LucideIcon; color: string; title: string; sub: ReactNode; onClick: () => void; badge?: ReactNode }) {
  return (
    <motion.button variants={{ h: { opacity: 0, y: 16, scale: 0.96 }, s: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 280 } } }}
      whileTap={{ scale: 0.96 }} onClick={onClick}
      className="group relative overflow-hidden flex items-center gap-3 rounded-[20px] p-3 text-left bg-gradient-to-br from-[#18204A] to-[#111735] ring-1 ring-white/[0.08]">
      <span aria-hidden="true" className="absolute -left-4 -bottom-6 w-20 h-20 rounded-full blur-2xl opacity-25" style={{ background: color }} />
      <span className="relative w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${color}40, ${color}14)`, boxShadow: `inset 0 0 0 1px ${color}66, 0 6px 18px ${color}22` }}>
        <Icon size={20} style={{ color }} strokeWidth={2.2} />
      </span>
      <span className="relative flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-white truncate">{title}{badge}</span>
        <span className="block text-[11px] text-slate-400 leading-snug truncate">{sub}</span>
      </span>
    </motion.button>
  );
}

const Stars = ({ n }: { n: number }) => (
  <span className="inline-flex gap-px" aria-label={n ? `Calificaste ${n} estrellas` : 'Sin calificar'}>
    {[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= n ? 'text-yellow-300' : 'text-slate-600'}>★</span>)}
  </span>
);

export default function SidebarMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const name = localStorage.getItem('miFinanzasUserName');
  const live = useLive(isOpen);
  const go = (path: string) => { haptic('light'); navigate(path); onClose(); };
  const later = (fn: () => void) => () => { onClose(); setTimeout(fn, 220); };

  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.nav aria-label="Módulos" role="dialog" aria-modal="true"
          className="theme-dark fixed inset-0 z-[111] bg-[#0B1026] text-white flex flex-col"
          initial={reduce ? { opacity: 0 } : { clipPath: 'circle(0% at 36px 44px)' }}
          animate={reduce ? { opacity: 1 } : { clipPath: 'circle(150% at 36px 44px)' }}
          exit={reduce ? { opacity: 0 } : { clipPath: 'circle(0% at 36px 44px)' }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(76,95,214,.35),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(198,244,50,.10),transparent_50%)]" />

          {/* Encabezado */}
          <div className={`relative z-10 px-5 ${IS_TEST ? 'pt-[max(40px,env(safe-area-inset-top))]' : 'pt-[max(18px,env(safe-area-inset-top))]'} flex items-center gap-3`}>
            <Kai mood="feliz" size={50} />
            <div className="flex-1 min-w-0">
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="text-[20px] font-extrabold truncate">{hello}{name ? `, ${name}` : ''}</motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-[12.5px] text-slate-400">¿A dónde vamos hoy?</motion.p>
            </div>
            <motion.button initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: 0.2 }} onClick={onClose} aria-label="Cerrar módulos"
              className="w-10 h-10 rounded-xl bg-white/[0.07] ring-1 ring-white/10 flex items-center justify-center"><X size={20} /></motion.button>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
            {/* Tarjetas de módulos */}
            <motion.div className="grid grid-cols-2 gap-2.5" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } } }}>
              {TILES.map(({ key, color, emoji }) => {
                const m = key === 'analisis' ? ANALISIS : MODULES[key];
                const active = pathname === m.path;
                const isNew = key !== 'analisis' && moduleHasNew(key);
                return (
                  <motion.button key={key} onClick={() => go(m.path)} whileTap={{ scale: 0.95 }}
                    variants={{ h: { opacity: 0, y: 26, scale: 0.92 }, s: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 18, stiffness: 260 } } }}
                    className="snow-cap relative overflow-hidden text-left rounded-[24px] p-3.5 h-[122px] flex flex-col bg-[#141B3A] ring-1"
                    style={{ ['--tw-ring-color' as string]: active ? color : 'rgba(255,255,255,.08)' }}>
                    <span aria-hidden="true" className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-35" style={{ background: color }} />
                    <span className="relative flex items-start justify-between">
                      <motion.span className="w-11 h-11 rounded-[15px] flex items-center justify-center text-[22px]" style={{ background: `${color}22`, boxShadow: `inset 0 0 0 1px ${color}55` }}
                        whileHover={{ rotate: -8 }} animate={active ? { rotate: [0, -10, 8, 0] } : undefined} transition={{ duration: 0.6 }}>
                        <span aria-hidden="true">{emoji}</span>
                      </motion.span>
                      {isNew ? <span className="px-1.5 py-px rounded-full bg-brand-lime text-brand-ink text-[9px] font-extrabold tracking-wider">NUEVO</span>
                        : active ? <span className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: color }} aria-label="Estás aquí" /> : null}
                    </span>
                    <span className="relative mt-auto">
                      <span className="block text-[15.5px] font-extrabold">{m.label}</span>
                      <span className="block text-[11.5px] font-bold truncate" style={{ color }}>{live[key] ?? m.tagline}</span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Más */}
            <p className="text-[11px] font-extrabold tracking-[.12em] text-slate-400 mt-6 mb-2 px-1">MÁS</p>
            <motion.div className="grid grid-cols-2 gap-2" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.04, delayChildren: 0.35 } } }}>
              <More icon={Settings} color="#C6F432" title="Ajustes" sub="Tema y avisos" onClick={() => go('/ajustes')}
                badge={moduleHasNew('ajustes') ? <span className="w-2 h-2 rounded-full bg-brand-lime shadow-[0_0_8px_#C6F432]" aria-label="Hay algo nuevo" /> : undefined} />
              <More icon={ShieldCheck} color="#34D399" title="Seguridad" sub="Bloqueo y cifrado" onClick={later(openSecurityCenter)} />
              <More icon={Sparkles} color="#A78BFA" title="Novedades" sub={`${RELEASE_STORY.length || RELEASE_NOTES.length} cosas nuevas`} onClick={later(() => window.dispatchEvent(new Event('mf:open-whatsnew')))}
                badge={<motion.span className="w-2 h-2 rounded-full bg-violet-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} aria-hidden="true" />} />
              <More icon={Star} color="#FACC15" title="Califícanos" sub={myRating() ? <Stars n={myRating()} /> : 'Danos unas estrellas'} onClick={later(openRating)} />
              <More icon={Heart} color="#F472B6" title="Recomiéndala" sub="WhatsApp o QR" onClick={later(openShareApp)} />
              <More icon={Lock} color="#7DD3FC" title="Privacidad" sub="Solo en tu celular" onClick={() => go('/legal')} />
            </motion.div>

            {/* Apóyanos: tarjeta destacada */}
            <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, type: 'spring', damping: 20 }} whileTap={{ scale: 0.98 }} onClick={later(openSupport)}
              className="relative overflow-hidden mt-3 w-full flex items-center gap-3 p-3.5 rounded-[22px] text-left bg-gradient-to-r from-[#3A2416] via-[#2A1B2E] to-[#141B3A] ring-1 ring-orange-300/40">
              <span aria-hidden="true" className="absolute -left-6 -top-8 w-28 h-28 rounded-full bg-orange-400/30 blur-2xl" />
              <span className="relative w-12 h-12 shrink-0 rounded-[16px] bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                {isAlly() ? <Kai mood="feliz" size={44} still title="Kai" /> : <Coffee size={22} className="text-[#3A2416]" strokeWidth={2.4} />}
                {!isAlly() && [0, 1, 2].map(i => (
                  <motion.span key={i} aria-hidden="true" className="absolute -top-2 w-1 h-2.5 rounded-full bg-orange-100/80" style={{ left: 16 + i * 6 }}
                    animate={{ y: [0, -6], opacity: [0, 0.9, 0] }} transition={{ duration: 1.8, delay: i * 0.4, repeat: Infinity }} />
                ))}
              </span>
              <span className="relative flex-1 min-w-0">
                <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-white">Apóyanos{isAlly() && <span className="px-1.5 py-px rounded-full bg-brand-lime text-brand-ink text-[9px] font-extrabold">💚 ALIADO</span>}</span>
                <span className="block text-[11.5px] text-orange-100/80">Un aporte voluntario por Bre-B, desde $100</span>
              </span>
              <span className="relative shrink-0 rounded-xl bg-orange-300 text-[#3A2416] text-[12px] font-extrabold px-3 py-2">{isAlly() ? 'Gracias 💚' : 'Apoyar'}</span>
            </motion.button>

            {/* Síguenos */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, type: 'spring', damping: 20 }} className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={later(openInstagram)} className="relative overflow-hidden flex items-center gap-2.5 p-3 rounded-[20px] text-left bg-gradient-to-br from-fuchsia-500/25 via-rose-500/15 to-amber-400/20 ring-1 ring-fuchsia-300/30 active:scale-[0.97] transition-transform">
                <InstagramIcon size={34} />
                <span className="min-w-0"><span className="block text-[13px] font-extrabold">Instagram</span><span className="block text-[10.5px] text-rose-100/80 truncate">@{INSTAGRAM_USER}</span></span>
              </button>
              <button onClick={later(openWhatsAppChannel)} className="relative overflow-hidden flex items-center gap-2.5 p-3 rounded-[20px] text-left bg-gradient-to-br from-emerald-500/25 to-teal-500/15 ring-1 ring-emerald-300/30 active:scale-[0.97] transition-transform">
                <ChannelIcon size={34} />
                <span className="min-w-0"><span className="block text-[13px] font-extrabold">WhatsApp</span><span className="block text-[10.5px] text-emerald-100/80 truncate">Canal · novedades</span></span>
              </button>
            </motion.div>

            {canOfferInstall() && (
              <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }} onClick={later(openInstall)}
                className="mt-2 w-full flex items-center gap-3 p-3 rounded-[20px] bg-gradient-to-r from-[#232C5A] to-[#0B1026] ring-1 ring-brand-lime/40 text-left">
                <span className="w-10 h-10 rounded-xl bg-brand-lime flex items-center justify-center"><Download size={18} className="text-brand-ink" /></span>
                <span className="flex-1 min-w-0"><span className="block text-sm font-bold">Descargar la app</span><span className="block text-[11px] text-slate-300">Instálala en tu celular en segundos</span></span>
                <ChevronRight size={16} className="text-slate-400" />
              </motion.button>
            )}

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} className="mt-5 mx-auto w-fit text-[11px] text-slate-400 flex items-center gap-1.5 rounded-full bg-emerald-400/[0.07] ring-1 ring-emerald-300/20 px-3 py-1.5">
              <Lock size={12} className="text-emerald-400" /> Tus finanzas viven solo en tu celular · v{APP_VERSION}
            </motion.p>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
