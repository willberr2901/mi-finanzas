/**
 * ════════════════════════════════════════════════════════════════════
 * 🪙 CONTAR MI ALCANCÍA (pantalla completa)
 * ────────────────────────────────────────────────────────────────────
 * Dos formas de contar, que se suman en el mismo conteo:
 *   • Montoncitos: torrecitas de 10 monedas → toca ＋ por cada una; las que
 *     sobran van en "Sueltas". Exacto al 100 %.
 *   • Foto: la app busca las monedas en la foto (dentro del celular) y dice de
 *     cuánto es cada una; tocas una moneda para corregirla y "Sumar al conteo".
 * Pantallas: 1) Mi alcancía (frasco que se llena, total, meta, Kai) → 2) Contar
 * (una moneda abierta a la vez) o Foto → 3) ¡A guardar! (confeti, a qué equivale,
 * eliges la meta). "Guardar en mi meta" suma el total a una meta de ahorro.
 * El conteo a medias se recuerda en este celular (localStorage 'mf_alcancia').
 * Lógica: services/coinCounter.ts · Se abre desde Finanzas → Metas.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Camera, ImageIcon, Loader2, RotateCcw, ChevronDown, Check, ChevronLeft } from 'lucide-react';
import Kai from '../assistant/Kai';
import CountUp from '../ui/CountUp';
import { happyMoment } from '../../services/ratingService';
import { COINS, emptyCounts, coinsOf, totals, splitTen, detectCoins, type Counts, type CoinValue, type FoundCoin } from '../../services/coinCounter';
import { formatCOP } from '../../utils/format';
import { db, type SavingsGoal } from '../../utils/database';
import { notify } from '../../services/notificationService';
import MoneyInput from '../ui/MoneyInput';
import { haptic } from '../../utils/haptics';

const DRAFT = 'mf_alcancia';
const COLOR: Record<CoinValue, { ring: string; core: string; ui: string }> = {
  1000: { ring: '#C9A44C', core: '#C3C9D1', ui: '#C6F432' },
  500: { ring: '#C3C9D1', core: '#C9A44C', ui: '#7DD3FC' },
  200: { ring: '#C3C9D1', core: '#C3C9D1', ui: '#E2E8F0' },
  100: { ring: '#C9A44C', core: '#C9A44C', ui: '#FB923C' },
  50: { ring: '#B8C0CA', core: '#B8C0CA', ui: '#F9A8D4' },
};
const NEXT: Record<CoinValue, CoinValue | null> = { 1000: 500, 500: 200, 200: 100, 100: 50, 50: null };

/** Moneda dibujada con su valor y sus colores reales (borde y centro). */
const METAL = { oro: ['#F6DE8D', '#A97F22'], plata: ['#EEF1F5', '#8F98A4'] } as const;
const LOOK: Record<CoinValue, ['oro' | 'plata', 'oro' | 'plata']> = { 1000: ['oro', 'plata'], 500: ['plata', 'oro'], 200: ['plata', 'plata'], 100: ['oro', 'oro'], 50: ['plata', 'plata'] };
let coinUid = 0;
export function Coin({ v, size = 40, className = '' }: { v: CoinValue; size?: number; className?: string }) {
  const [id] = useState(() => `cn${coinUid++}`);
  const [ring, core] = LOOK[v];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={`shrink-0 ${className}`}>
      <defs>
        <radialGradient id={`${id}r`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".35" stopColor={METAL[ring][0]} /><stop offset="1" stopColor={METAL[ring][1]} /></radialGradient>
        <radialGradient id={`${id}c`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".4" stopColor={METAL[core][0]} /><stop offset="1" stopColor={METAL[core][1]} /></radialGradient>
      </defs>
      <circle cx="50" cy="53" r="46" fill="#0007" />
      <circle cx="50" cy="50" r="46" fill={`url(#${id}r)`} />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#0002" strokeWidth="2" strokeDasharray="3 3" />
      {(ring !== core || v === 1000 || v === 500) && <circle cx="50" cy="50" r="30" fill={`url(#${id}c)`} />}
      <text x="50" y={v >= 1000 ? 57 : 59} textAnchor="middle" fontWeight="900" fontSize={v >= 1000 ? 21 : v >= 100 ? 26 : 30} fill="#0009" fontFamily="system-ui,sans-serif">{v}</text>
    </svg>
  );
}
function Tower({ v, n = 10, faded = false }: { v: CoinValue; n?: number; faded?: boolean }) {
  const w = v === 1000 ? 40 : v === 500 ? 36 : 32;
  const [a, b] = METAL[LOOK[v][0]];
  return (
    <motion.div initial={{ y: -30, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: faded ? 0.55 : 1, scale: 1 }} transition={{ type: 'spring', damping: 14, stiffness: 300 }} className="flex flex-col-reverse items-center">
      {Array.from({ length: n }, (_, i) => <div key={i} style={{ width: w, height: 7, marginTop: -2, borderRadius: '50%/100%', background: `linear-gradient(180deg, ${a}, ${b})`, boxShadow: '0 1px 0 #0006' }} />)}
    </motion.div>
  );
}
/** Frasco de vidrio con tapa lima que se llena de monedas según `level` (0 a 1). */
const MIX: CoinValue[] = [1000, 500, 1000, 200, 500, 100, 1000, 50];
export function Jar({ level, big = false }: { level: number; big?: boolean }) {
  const W = big ? 230 : 200, H = big ? 290 : 250, rows = Math.round(Math.max(0, Math.min(1, level)) * (big ? 10 : 9)), per = 6, cs = big ? 38 : 34;
  return (
    <div className="relative mx-auto" style={{ width: W, height: H }} aria-hidden="true">
      <div className="absolute rounded-[12px] bg-gradient-to-b from-[#D9FF5A] to-[#8FB51F]" style={{ left: 38, right: 38, top: 0, height: 32, boxShadow: '0 6px 0 #6E8E12' }} />
      <div className="absolute rounded-full bg-[#0B1026]/60" style={{ left: W / 2 - 34, width: 68, top: 10, height: 7 }} />
      <div className="absolute overflow-hidden" style={{ left: 0, right: 0, top: 40, bottom: 0, borderRadius: '40px 40px 50px 50px', background: 'linear-gradient(90deg,#ffffff16,#ffffff06 40%,#ffffff12)', border: '3px solid #ffffff33' }}>
        {Array.from({ length: rows }, (_, r) => Array.from({ length: per }, (_, i) => (
          <motion.div key={`${r}-${i}`} className="absolute" style={{ left: 12 + i * ((W - 30) / per) + (r % 2) * 10, bottom: 10 + r * (cs * 0.58), rotate: ((r * 37 + i * 53) % 60) - 30 }}
            initial={{ y: -260, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + r * 0.07 + i * 0.02, type: 'spring', damping: 15, stiffness: 180 }}>
            <Coin v={MIX[(r + i) % MIX.length]} size={cs} />
          </motion.div>
        )))}
        <div className="absolute rounded-full bg-white/[0.16]" style={{ left: 16, top: 18, width: 14, height: H * 0.5 }} />
      </div>
      <div className="absolute rounded-[50%] bg-[radial-gradient(closest-side,rgba(198,244,50,.25),transparent)]" style={{ left: -12, right: -12, bottom: -12, height: 24 }} />
    </div>
  );
}
const LAST = 'mf_alcancia_last';
const PASAJE = 3200; // pasaje de bus aproximado (Bogotá, 2026)

const readDraft = (): { counts: Counts; bills: number } => {
  try { const d = JSON.parse(localStorage.getItem(DRAFT) || ''); return { counts: { ...emptyCounts(), ...d.counts }, bills: Number(d.bills) || 0 }; } catch { return { counts: emptyCounts(), bills: 0 }; }
};

export default function PiggyCounter({ open, onClose, goals, onSaved }: { open: boolean; onClose: () => void; goals: SavingsGoal[]; onSaved: () => void }) {
  const [view, setView] = useState<'home' | 'stacks' | 'photo' | 'done'>('home');
  const [counts, setCounts] = useState<Counts>(() => readDraft().counts);
  const [bills, setBills] = useState(() => readDraft().bills);
  const [openV, setOpenV] = useState<CoinValue | 'bills'>(1000);
  const [saving, setSaving] = useState(false);
  const [goalId, setGoalId] = useState('');
  const [mercadoSemana, setMercadoSemana] = useState(0);
  // Foto
  const [photo, setPhoto] = useState<{ url: string; w: number; h: number } | null>(null);
  const [found, setFound] = useState<FoundCoin[]>([]);
  const [busy, setBusy] = useState(false);
  const [batches, setBatches] = useState(0);
  const camRef = useRef<HTMLInputElement>(null), galRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify({ counts, bills })); } catch { /* sin almacenamiento */ } }, [counts, bills]);
  useEffect(() => { if (open && !goalId && goals[0]) setGoalId(goals[0].id); }, [open, goals, goalId]);
  useEffect(() => { if (open) setView('home'); }, [open]);
  // Mercado promedio por semana (últimos 3 meses), para decir "a qué equivale"
  useEffect(() => {
    if (!open) return;
    const from = new Date(); from.setMonth(from.getMonth() - 3);
    const iso = from.toISOString().slice(0, 10);
    db.transactions.toArray().then(tx => {
      const m = tx.filter(x => x.type === 'expense' && x.category === 'Mercado' && x.date >= iso).reduce((a, x) => a + x.amount, 0);
      setMercadoSemana(m > 0 ? m / 13 : 0);
    }).catch(() => {});
  }, [open]);

  const t = totals(counts, bills);
  const goal = goals.find(g => g.id === goalId);
  const last = (() => { try { return JSON.parse(localStorage.getItem(LAST) || 'null') as { amount: number; at: number } | null; } catch { return null; } })();
  const level = goal ? (goal.currentAmount + t.amount) / Math.max(1, goal.targetAmount) : Math.min(1, t.coins / 120);
  const setC = (v: CoinValue, patch: Partial<{ stacks: number; loose: number }>) => {
    haptic();
    setCounts(c => ({ ...c, [v]: { stacks: Math.max(0, patch.stacks ?? c[v].stacks), loose: Math.max(0, Math.min(999, patch.loose ?? c[v].loose)) } }));
  };

  // ═══ SECCIÓN: Foto → monedas ═══
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true); setFound([]);
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d')!; ctx.drawImage(bmp, 0, 0, w, h);
      setPhoto({ url: cv.toDataURL('image/jpeg', 0.85), w, h });
      await new Promise(r => setTimeout(r, 60)); // deja pintar el "Contando…"
      const res = detectCoins(ctx.getImageData(0, 0, w, h));
      setFound(res);
      if (!res.length) notify({ title: 'No encontré monedas', message: 'Riega las monedas en una sola capa y toma la foto desde arriba, con buena luz.', type: 'info', log: false });
    } catch { notify({ title: 'No pude leer la foto', message: 'Intenta con otra foto.', type: 'error', log: false }); }
    finally { setBusy(false); if (camRef.current) camRef.current.value = ''; if (galRef.current) galRef.current.value = ''; }
  };
  const cycle = (i: number) => setFound(fs => fs.flatMap((f, j) => j !== i ? [f] : NEXT[f.value] ? [{ ...f, value: NEXT[f.value]! }] : []));
  const photoCount = (v: CoinValue) => found.filter(f => f.value === v).length;
  const addPhoto = () => {
    setCounts(c => {
      const n = { ...c };
      for (const k of COINS) { const add = photoCount(k.value); if (add) n[k.value] = splitTen(coinsOf(c[k.value]) + add); }
      return n;
    });
    notify({ title: `Sumé ${found.length} monedas`, message: 'Si te quedan más, toma otra foto (otra tanda).', type: 'success', log: false });
    setBatches(b => b + 1); setFound([]); setPhoto(null); setView('stacks');
  };

  // ═══ SECCIÓN: Guardar en una meta ═══
  const save = async () => {
    if (!t.amount) return notify({ title: 'Aún no hay nada contado', type: 'info', log: false });
    setSaving(true);
    try {
      const g = goals.find(x => x.id === goalId);
      if (g) await db.goals.update(g.id, { currentAmount: g.currentAmount + t.amount });
      else {
        const d = new Date(); d.setFullYear(d.getFullYear() + 1);
        await db.goals.add({ id: crypto.randomUUID(), name: 'Alcancía', targetAmount: t.amount, currentAmount: t.amount, deadline: d.toISOString().slice(0, 10), createdAt: new Date().toISOString() });
      }
      try { localStorage.setItem(LAST, JSON.stringify({ amount: t.amount, at: Date.now() })); } catch { /* sin almacenamiento */ }
      haptic('success');
      notify({ title: `¡${formatCOP(t.amount)} guardados!`, message: g ? `Abonados a "${g.name}"` : 'Creé la meta "Alcancía" con este valor', type: 'success' });
      setCounts(emptyCounts()); setBills(0); setBatches(0);
      onSaved(); onClose();
      happyMoment('alcancia');
    } finally { setSaving(false); }
  };
  const reset = () => { setCounts(emptyCounts()); setBills(0); setFound([]); setPhoto(null); setBatches(0); };

  // ═══ SECCIÓN: Una moneda abierta; las demás en fila ═══
  const coinRow = (v: CoinValue) => {
    const c = counts[v], k = COINS.find(x => x.value === v)!, ui = COLOR[v].ui, n = coinsOf(c);
    if (openV !== v) return (
      <motion.button layout key={v} onClick={() => { setOpenV(v); haptic('light'); }} className="w-full flex items-center gap-3 rounded-[20px] bg-gradient-to-br from-[#18204A] to-[#111735] ring-1 ring-white/[0.08] px-3 py-2.5 text-left">
        <Coin v={v} size={38} />
        <span className="flex-1 min-w-0"><span className="block text-white font-extrabold text-[15px]">{k.label}</span><span className="block text-[11px] text-slate-400">{n ? `${n} moneda${n === 1 ? '' : 's'}` : 'Toca para contar'}</span></span>
        <span className="font-extrabold" style={{ color: n ? ui : '#64748B' }}>{formatCOP(n * v)}</span>
        <ChevronDown size={18} className="text-slate-500" />
      </motion.button>
    );
    return (
      <motion.div layout key={v} className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#18204A] to-[#111735] p-4" style={{ boxShadow: `inset 0 0 0 1.5px ${ui}66, 0 0 30px ${ui}1f` }}>
        <span aria-hidden="true" className="absolute -right-8 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: ui }} />
        <div className="relative flex items-center gap-3">
          <Coin v={v} size={50} />
          <div className="flex-1 min-w-0"><p className="text-white font-extrabold text-[17px]">{k.label}</p><p className="text-[11px] text-slate-400 truncate">{k.look}</p></div>
          <motion.p key={n} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-extrabold text-[22px] shrink-0" style={{ color: ui }}>{formatCOP(n * v)}</motion.p>
        </div>
        <div className="relative flex gap-2 items-end h-[96px] mt-2 px-1 overflow-hidden" aria-hidden="true">
          <AnimatePresence initial={false}>
            {Array.from({ length: Math.min(c.stacks, 6) }, (_, i) => <Tower key={i} v={v} />)}
            {c.loose > 0 && <Tower key="loose" v={v} n={c.loose} faded />}
          </AnimatePresence>
          {c.stacks > 6 && <span className="text-xs text-slate-300 font-bold mb-1">+{c.stacks - 6}</span>}
          {c.loose > 0 && <span className="text-[11px] text-slate-400 mb-1">+{c.loose} sueltas</span>}
          {!c.stacks && !c.loose && <span className="text-[12px] text-slate-500 mb-6 mx-auto">Arma torrecitas de 10 y toca ＋</span>}
        </div>
        <div className="relative flex items-center gap-2 mt-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setC(v, { stacks: c.stacks - 1 })} aria-label={`Quitar un montoncito de ${k.label}`} className="w-[52px] h-[52px] rounded-[18px] bg-white/[0.08] flex items-center justify-center text-white"><Minus size={22} /></motion.button>
          <div className="flex-1 text-center"><motion.p key={c.stacks} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[32px] font-extrabold text-white leading-none">{c.stacks}</motion.p><p className="text-[11px] text-slate-400 mt-1">montoncitos de 10</p></div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setC(v, { stacks: c.stacks + 1 })} aria-label={`Agregar un montoncito de ${k.label}`} className="w-[52px] h-[52px] rounded-[18px] flex items-center justify-center text-brand-ink" style={{ background: ui, boxShadow: `0 8px 22px ${ui}55` }}><Plus size={24} strokeWidth={3} /></motion.button>
        </div>
        <p className="relative mt-3 text-[13px] text-slate-300">¿Y sueltas? <span className="text-slate-500">(menos de 10)</span></p>
        <div className="relative flex justify-between mt-2" role="group" aria-label={`Monedas sueltas de ${k.label}`}>
          {Array.from({ length: 10 }, (_, i) => (
            <motion.button key={i} whileTap={{ scale: 0.8 }} onClick={() => setC(v, { loose: i })} aria-pressed={c.loose === i} aria-label={`${i} monedas sueltas`}
              className={`w-[29px] h-[29px] rounded-full text-[12.5px] font-extrabold transition-colors ${c.loose === i ? 'text-brand-ink' : 'bg-white/[0.08] text-slate-200'}`}
              style={c.loose === i ? { background: ui, boxShadow: `0 0 12px ${ui}88` } : undefined}>{i}</motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  const Header = ({ title, back }: { title: string; back?: () => void }) => (
    <div className="flex items-center gap-2 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
      {back && <button onClick={back} aria-label="Atrás" className="w-10 h-10 -ml-1 rounded-xl bg-white/[0.07] flex items-center justify-center text-white"><ChevronLeft size={20} /></button>}
      <div className="flex-1 min-w-0"><p className="text-[11px] font-extrabold tracking-widest text-slate-400">METAS · ALCANCÍA</p><h2 id="piggy-title" className="text-white text-[21px] font-extrabold truncate">{title}</h2></div>
      {view !== 'done' && t.coins + bills > 0 && <span className="px-2.5 py-1 rounded-full bg-brand-lime text-brand-ink text-[12px] font-extrabold">{formatCOP(t.amount)}</span>}
      {t.coins > 0 && view === 'home' && <button onClick={reset} aria-label="Empezar de cero" className="p-2 text-slate-400"><RotateCcw size={18} /></button>}
      <button onClick={onClose} aria-label="Cerrar" className="w-10 h-10 rounded-xl bg-white/[0.07] flex items-center justify-center text-slate-200"><X size={20} /></button>
    </div>
  );
  const equiv = [
    mercadoSemana > 0 && t.amount >= mercadoSemana * 0.5 ? `${(t.amount / mercadoSemana).toFixed(t.amount / mercadoSemana < 2 ? 1 : 0).replace('.', ',')} mercado${t.amount / mercadoSemana >= 1.5 ? 's' : ''} de la semana 🛒` : null,
    t.amount >= PASAJE ? `${Math.floor(t.amount / PASAJE)} pasajes de bus 🚌` : null,
  ].filter(Boolean) as string[];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-labelledby="piggy-title" className="theme-dark fixed inset-0 z-[140] bg-[#0B1026] flex flex-col"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_10%,rgba(76,95,214,.35),transparent_70%)]" />

          {/* ── 1. Mi alcancía ── */}
          {view === 'home' && (<>
            <Header title="Mi alcancía" />
            <div className="relative flex-1 overflow-y-auto px-4 pb-4">
              <div className="relative pt-2">
                <Jar level={Math.max(0.12, level)} />
                <motion.div className="absolute right-6 top-6" animate={{ y: [0, -8, 0], rotate: [0, 12, 0] }} transition={{ duration: 3, repeat: Infinity }}><Coin v={1000} size={40} /></motion.div>
                <motion.div className="absolute right-16 -top-1 opacity-70" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}><Coin v={500} size={30} /></motion.div>
              </div>
              <div className="text-center mt-1">
                <p className="text-[13px] text-slate-300">Tu alcancía tiene</p>
                <CountUp value={t.amount} className="block text-[44px] leading-tight font-extrabold text-brand-lime" />
                <p className="text-[12.5px] text-slate-400">{t.coins} moneda{t.coins === 1 ? '' : 's'}{bills ? ` + ${formatCOP(bills)} en billetes` : ''}{last ? ` · la última vez guardaste ${formatCOP(last.amount)}` : ''}</p>
              </div>
              {goals.length > 0 && goal && (
                <button onClick={() => { const i = goals.findIndex(g => g.id === goalId); setGoalId(goals[(i + 1) % goals.length].id); haptic('light'); }}
                  className="mt-3 w-full flex items-center gap-3 rounded-[22px] bg-gradient-to-br from-[#18204A] to-[#111735] ring-1 ring-white/[0.08] p-3 text-left">
                  <svg width="54" height="54" viewBox="0 0 58 58" className="-rotate-90 shrink-0" aria-hidden="true">
                    <circle cx="29" cy="29" r="24" stroke="rgba(255,255,255,.1)" strokeWidth="7" fill="none" />
                    <motion.circle cx="29" cy="29" r="24" stroke="#C6F432" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="151" initial={{ strokeDashoffset: 151 }} animate={{ strokeDashoffset: 151 * (1 - Math.min(1, level)) }} transition={{ duration: 1 }} />
                  </svg>
                  <span className="flex-1 min-w-0"><span className="block text-white font-extrabold text-[14px] truncate">Meta: {goal.name}</span>
                    <span className="block text-[12px] text-slate-400">{Math.round(Math.min(1, level) * 100)}% con lo de hoy · {goal.targetAmount - goal.currentAmount - t.amount > 0 ? `faltan ${formatCOP(goal.targetAmount - goal.currentAmount - t.amount)}` : '¡la completas! 🎉'}</span></span>
                  {goals.length > 1 && <span className="text-[11px] text-brand-lime font-bold shrink-0">Cambiar</span>}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setView('stacks')} className="rounded-[20px] bg-brand-lime text-brand-ink p-3.5 text-left">
                  <span className="text-2xl" aria-hidden="true">🪙</span><span className="block font-extrabold text-[15px] mt-1">Contar montoncitos</span><span className="block text-[11px] opacity-75">Exacto, de a 10</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setView('photo')} className="rounded-[20px] bg-white/[0.07] ring-1 ring-white/10 text-white p-3.5 text-left">
                  <span className="text-2xl" aria-hidden="true">📸</span><span className="block font-extrabold text-[15px] mt-1">Con una foto</span><span className="block text-[11px] text-slate-400">Rápido, aproximado</span>
                </motion.button>
              </div>
              <div className="flex gap-2.5 items-center mt-3 rounded-[4px_18px_18px_18px] bg-[#1B2350] ring-1 ring-white/10 px-3 py-2.5">
                <Kai mood={t.amount ? 'celebra' : 'feliz'} size={44} />
                <p className="text-[13px] text-slate-100 leading-snug">{t.amount ? <>¡Llevas <b>{t.coins} monedas</b>! Cuando termines, guárdalo en tu meta 🐷</> : <>Separa las monedas por color y cuéntalas conmigo. ¡Es más fácil de lo que parece! 🐷</>}</p>
              </div>
            </div>
            {t.amount > 0 && (
              <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-white/10">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setView('done')} className="w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">🐷 Guardar {formatCOP(t.amount)}</motion.button>
              </div>
            )}
          </>)}

          {/* ── 2. Contar montoncitos ── */}
          {view === 'stacks' && (<>
            <Header title="Montoncitos" back={() => setView('home')} />
            <div className="relative flex-1 overflow-y-auto px-4 pt-1 pb-4 space-y-2">
              <p className="text-[12.5px] text-slate-400">Separa por color, arma torrecitas de <b className="text-white">10 monedas</b> y toca <b className="text-white">＋</b> por cada una.{batches > 0 && <span className="text-brand-lime font-bold"> Ya sumaste {batches} foto{batches > 1 ? 's' : ''}.</span>}</p>
              {COINS.map(k => coinRow(k.value))}
              {openV === 'bills' ? (
                <div className="rounded-[22px] bg-gradient-to-br from-[#18204A] to-[#111735] ring-1 ring-emerald-300/40 p-4">
                  <p className="text-white font-extrabold text-[15px]">💵 Billetes</p><p className="text-[11px] text-slate-400 mb-2">Escribe cuánto suman los billetes</p>
                  <MoneyInput value={bills} onChange={setBills} prefix placeholder="$0" ariaLabel="Total en billetes" className="w-full h-12 px-3 rounded-xl bg-[#0B1026] ring-1 ring-white/10 text-white font-extrabold outline-none focus:ring-brand-lime" />
                </div>
              ) : (
                <button onClick={() => setOpenV('bills')} className="w-full flex items-center gap-3 rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 px-3 py-3 text-left">
                  <span className="w-[38px] text-center text-2xl" aria-hidden="true">💵</span><span className="flex-1 text-white font-bold text-[14px]">Billetes</span>
                  <span className="font-extrabold text-emerald-300">{bills ? formatCOP(bills) : ''}</span><ChevronDown size={18} className="text-slate-500" />
                </button>
              )}
            </div>
            <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-white/10 flex items-center gap-3">
              <div className="flex-1"><p className="text-[11px] font-extrabold tracking-widest text-slate-400">TOTAL</p><motion.p key={t.amount} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="text-[26px] font-extrabold text-brand-lime leading-tight">{formatCOP(t.amount)}</motion.p></div>
              <motion.button whileTap={{ scale: 0.97 }} disabled={!t.amount} onClick={() => setView('done')} className="px-5 py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold disabled:opacity-40">Listo 🐷</motion.button>
            </div>
          </>)}

          {/* ── Foto ── */}
          {view === 'photo' && (<>
            <Header title="Contar con una foto" back={() => setView('home')} />
            <div className="relative flex-1 overflow-y-auto px-4 pt-1 pb-4 space-y-3">
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
              <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
              {!photo && !busy && (<>
                <div className="space-y-2">
                  {[['🫓', 'Riega las monedas', 'En una mesa, en una sola capa, sin que se monten'], ['☀️', 'Buena luz', 'Foto desde arriba, sin sombras fuertes'], ['🧮', 'Si son muchas', 'Por tandas de 40-60: cada foto se suma al conteo'], ['👆', 'Tú revisas', 'Toca una moneda si la marqué mal']].map(([e, ti, d]) => (
                    <div key={ti} className="flex gap-3 items-center p-3 rounded-2xl bg-white/[0.05]"><span className="text-2xl">{e}</span><div><p className="text-white text-sm font-extrabold">{ti}</p><p className="text-[12px] text-slate-400">{d}</p></div></div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => camRef.current?.click()} className="w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><Camera size={19} /> Tomar foto</motion.button>
                <button onClick={() => galRef.current?.click()} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2"><ImageIcon size={18} /> Elegir de la galería</button>
                <p className="text-[11px] text-slate-500 text-center">🔒 La foto se revisa dentro de tu celular. No se envía a ningún lado.</p>
                <p className="text-[11px] text-amber-300/90 text-center">Función nueva: el conteo por foto es aproximado. Si las monedas están amontonadas, usa Montoncitos.</p>
              </>)}
              {busy && <div className="py-16 flex flex-col items-center gap-3 text-slate-300"><Loader2 className="animate-spin text-brand-lime" size={32} /> Contando monedas…</div>}
              {photo && !busy && (<>
                <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                  <img src={photo.url} alt="Foto de las monedas" className="w-full block" />
                  <svg viewBox={`0 0 ${photo.w} ${photo.h}`} className="absolute inset-0 w-full h-full">
                    {found.map((f, i) => (
                      <g key={i} onClick={() => cycle(i)} style={{ cursor: 'pointer' }}>
                        <circle cx={f.x} cy={f.y} r={f.r} fill="transparent" stroke={COLOR[f.value].ui} strokeWidth={Math.max(2, photo.w / 300)} />
                        <text x={f.x} y={f.y - f.r - 2} textAnchor="middle" fontSize={Math.max(9, f.r * 0.5)} fontWeight={800} fill={COLOR[f.value].ui} stroke="#0B1026" strokeWidth={2.5} paintOrder="stroke">{f.value === 1000 ? '1.000' : f.value}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="text-[12px] text-slate-400 text-center">Encontré <b className="text-white">{found.length}</b> monedas. Toca una para cambiarla (la última opción la quita).</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {COINS.map(k => <div key={k.value} className="rounded-xl bg-white/[0.05] py-2 text-center"><p className="text-lg font-extrabold" style={{ color: COLOR[k.value].ui }}>{photoCount(k.value)}</p><p className="text-[10px] text-slate-400">{k.label}</p></div>)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPhoto(null); setFound([]); }} className="flex-1 h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold">Repetir foto</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={addPhoto} disabled={!found.length} className="flex-1 h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-40"><Check size={18} strokeWidth={3} /> Sumar al conteo</motion.button>
                </div>
              </>)}
</div>
          </>)}

          {/* ── 3. ¡A guardar! ── */}
          {view === 'done' && (<>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 24 }, (_, i) => (
                <motion.span key={i} className="absolute w-2 h-4 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: ['#C6F432', '#F9A8D4', '#7DD3FC', '#FBBF24'][i % 4] }}
                  initial={{ y: -40, rotate: i * 40, opacity: 0 }} animate={{ y: [-40, 700], rotate: i * 40 + 360, opacity: [0, 1, 1, 0] }} transition={{ duration: 3.2, delay: (i % 8) * 0.12, repeat: 1 }} />
              ))}
            </div>
            <Header title="¡A guardar!" back={() => setView('home')} />
            <div className="relative flex-1 overflow-y-auto px-4 pb-4">
              <Jar level={Math.max(0.7, Math.min(1, level))} big />
              <div className="text-center mt-2">
                <p className="text-[26px] font-extrabold text-white leading-tight">¡Tienes</p>
                <CountUp value={t.amount} className="block text-[46px] leading-tight font-extrabold text-brand-lime" />
                {equiv.length > 0 && <p className="text-[14px] text-slate-300 mt-1">Eso es como <b className="text-white">{equiv[0]}</b>{equiv[1] && <><br />o <b className="text-white">{equiv[1]}</b></>}</p>}
              </div>
              <p className="text-[12.5px] font-extrabold text-slate-400 mt-4">¿A qué meta lo sumamos?</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {goals.map(g => (
                  <button key={g.id} onClick={() => { setGoalId(g.id); haptic('light'); }} aria-pressed={goalId === g.id}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-extrabold ring-1 ${goalId === g.id ? 'bg-brand-lime text-brand-ink ring-brand-lime' : 'bg-white/[0.06] text-white ring-white/10'}`}>🎯 {g.name}</button>
                ))}
                <button onClick={() => setGoalId('')} aria-pressed={!goalId} className={`px-3.5 py-2 rounded-full text-[13px] font-extrabold ring-1 ${!goalId ? 'bg-brand-lime text-brand-ink ring-brand-lime' : 'bg-white/[0.06] text-white ring-white/10'}`}>＋ Meta “Alcancía”</button>
              </div>
            </div>
            <div className="relative px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
              <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving || !t.amount} className="w-full py-4 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-[16px] disabled:opacity-40 shadow-[0_10px_30px_rgba(198,244,50,.35)]">
                {saving ? 'Guardando…' : goal ? `🐷 Guardar en “${goal.name}”` : '🐷 Crear la meta “Alcancía”'}
              </motion.button>
            </div>
          </>)}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
