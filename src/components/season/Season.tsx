/**
 * ════════════════════════════════════════════════════════════════════
 * 🎃🎄 DECORACIÓN, AVISO Y TARJETA DE TEMPORADA
 * ────────────────────────────────────────────────────────────────────
 * SeasonDecor  → adornos animados encima de toda la app (no estorban los toques):
 *                🎃 murciélagos que cruzan la pantalla · 🎄 nieve y luces navideñas.
 * SeasonPopup  → "¡Una nueva versión llegó por ti!" una sola vez por temporada.
 * SeasonCard   → tarjeta en Inicio con consejos de plata de la temporada.
 * Cuándo sale cada temporada y cómo se apaga: services/season.ts
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useSeason, seasonPopupPending, markSeasonPopupSeen, setSeasonEnabled, type Season } from '../../services/season';

// ═══ SECCIÓN: Dibujos (propios de la app) ═══
const Bat = ({ size = 46 }: { size?: number }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 64 32" aria-hidden="true">
    <path d="M32 10c2-4 4-6 4-6l1 5c3-1 6-1 8 1 4-3 10-4 19-2-6 2-8 6-8 10-3-2-7-2-9 1-2-2-5-3-8-1-2 3-4 6-7 9-3-3-5-6-7-9-3-2-6-1-8 1-2-3-6-3-9-1 0-4-2-8-8-10 9-2 15-1 19 2 2-2 5-2 8-1l1-5s2 2 4 6z" fill="#1A0B2E" opacity=".85" />
    <circle cx="29.5" cy="12" r="1.2" fill="#FF8A1F" /><circle cx="34.5" cy="12" r="1.2" fill="#FF8A1F" />
  </svg>
);
const Pumpkin = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 7c1-3 3-4 5-4" stroke="#3F7D2A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <ellipse cx="16" cy="19" rx="13" ry="11" fill="#FF8A1F" /><ellipse cx="16" cy="19" rx="6" ry="11" fill="#FFA24D" opacity=".6" />
    <path d="M10 17l2.5-3 2.5 3zM17 17l2.5-3 2.5 3zM10 23c3 2.5 9 2.5 12 0l-2 1-2-1-2 1-2-1-2 1z" fill="#2A1206" />
  </svg>
);

// ═══ SECCIÓN: Adornos animados ═══
export function SeasonDecor() {
  const season = useSeason();
  const flakes = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    left: (i * 37) % 100, size: 3 + ((i * 7) % 5), dur: 9 + ((i * 13) % 9), delay: -((i * 5) % 14), drift: ((i % 5) - 2) * 14, op: 0.35 + ((i * 3) % 5) / 10,
  })), []);
  if (!season) return null;

  if (season.id === 'halloween') return (
    <div className="fixed inset-0 z-[45] pointer-events-none overflow-hidden" aria-hidden="true">
      {[{ top: '14%', dur: 22, delay: 0, size: 44 }, { top: '42%', dur: 28, delay: 9, size: 34 }, { top: '68%', dur: 25, delay: 17, size: 40 }].map((b, i) => (
        <motion.div key={i} className="absolute season-anim" style={{ top: b.top, left: 0 }}
          initial={{ x: '-15vw' }} animate={{ x: ['-15vw', '115vw'], y: [0, -26, 8, -18, 0] }}
          transition={{ x: { duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'linear', repeatDelay: 6 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}>
          <motion.div animate={{ scaleY: [1, 0.55, 1] }} transition={{ duration: 0.35, repeat: Infinity }}><Bat size={b.size} /></motion.div>
        </motion.div>
      ))}
      {/* Calabacitas en las esquinas de abajo */}
      <div className="absolute left-2 bottom-2 opacity-80"><Pumpkin size={30} /></div>
    </div>
  );

  // Navidad: nieve + luces
  const bulbs = ['#F43F5E', '#F7C948', '#22C55E', '#38BDF8'];
  return (
    <div className="fixed inset-0 z-[45] pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute top-0 inset-x-0 h-4 flex justify-around items-start">
        <svg className="absolute inset-x-0 top-0 w-full h-4" preserveAspectRatio="none" viewBox="0 0 100 8"><path d="M0 1 Q 6 6 12.5 1 T 25 1 T 37.5 1 T 50 1 T 62.5 1 T 75 1 T 87.5 1 T 100 1" stroke="#0E3A27" strokeWidth=".7" fill="none" /></svg>
        {Array.from({ length: 14 }, (_, i) => (
          <motion.span key={i} className="relative mt-1.5 w-2 h-3 rounded-b-full season-anim" style={{ background: bulbs[i % 4], boxShadow: `0 0 8px ${bulbs[i % 4]}` }}
            animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.6, delay: (i % 4) * 0.4, repeat: Infinity }} />
        ))}
      </div>
      {flakes.map((f, i) => (
        <motion.span key={i} className="absolute rounded-full bg-white season-anim" style={{ left: `${f.left}%`, top: -10, width: f.size, height: f.size, opacity: f.op }}
          animate={{ y: ['0vh', '105vh'], x: [0, f.drift, 0] }} transition={{ y: { duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'linear' }, x: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }} />
      ))}
    </div>
  );
}

// ═══ SECCIÓN: Aviso de temporada (una vez) ═══
export function SeasonPopup({ ready }: { ready: boolean }) {
  const season = useSeason();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ready || !seasonPopupPending(season)) return;
    // Para que no salgan dos ventanas a la vez, el aviso de "Descarga la app" espera a la próxima visita.
    try { sessionStorage.setItem('mf_install_snooze', '1'); } catch { /* sin almacenamiento */ }
    const t = setTimeout(() => setShow(true), 900);
    return () => clearTimeout(t);
  }, [ready, season]);
  const close = () => { if (season) markSeasonPopupSeen(season); setShow(false); };
  const hw = season?.id === 'halloween';

  return (
    <AnimatePresence>
      {show && season && (
        <motion.div className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="season-title" onClick={e => e.stopPropagation()}
            initial={{ y: 80, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 18 }}
            className={`theme-dark relative w-full max-w-sm overflow-hidden rounded-[32px] p-6 text-center border border-white/10 shadow-2xl ${hw ? 'bg-gradient-to-b from-[#3B1E5E] via-[#24123D] to-[#120A22]' : 'bg-gradient-to-b from-[#145A3A] via-[#0D3B27] to-[#071F16]'}`}>
            <button onClick={close} aria-label="Cerrar" className="absolute right-4 top-4 p-1.5 text-white/60"><X size={18} /></button>
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40" style={{ background: hw ? '#FF8A1F' : '#F7C948' }} />
            <motion.div className="relative text-7xl" initial={{ scale: 0, rotate: -25 }} animate={{ scale: [0, 1.25, 1], rotate: [-25, 10, 0] }} transition={{ duration: 0.8 }}>{season.emoji}</motion.div>
            <p className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full bg-brand-lime text-brand-ink"><Sparkles size={12} /> {season.name}</p>
            <h2 id="season-title" className="relative text-white text-2xl font-extrabold mt-3 leading-tight">{season.popupTitle}</h2>
            <p className="relative text-white/80 text-sm mt-2">{season.popupText}</p>
            <button onClick={close} className="relative mt-5 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-base active:scale-[0.98]">{hw ? '¡A disfrutar! 🎃' : '¡Feliz Navidad! 🎄'}</button>
            <button onClick={() => { setSeasonEnabled(false); close(); }} className="relative mt-3 text-xs text-white/60 font-semibold">Prefiero el diseño de siempre</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══ SECCIÓN: Tarjeta de Inicio ═══
export function SeasonCard({ season }: { season: Season }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n + 1) % season.tips.length), 6000); return () => clearInterval(t); }, [season]);
  const hw = season.id === 'halloween';
  return (
    <div className={`theme-dark relative overflow-hidden rounded-[26px] p-4 ring-1 ring-brand-lime/25 ${hw ? 'bg-gradient-to-br from-[#3B1E5E] to-[#120A22]' : 'bg-gradient-to-br from-[#7A1424] via-[#3D0D16] to-[#071F16]'}`}>
      <div className="absolute -right-6 -top-6 text-7xl opacity-20 select-none" aria-hidden="true">{season.emoji}</div>
      <p className="relative text-[10px] font-extrabold tracking-widest uppercase text-brand-lime">{season.emoji} {season.name} · {season.until}</p>
      <p className="relative text-white font-extrabold mt-1">{season.tipTitle}</p>
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="relative text-[13px] text-white/85 mt-1.5 min-h-[38px]">{season.tips[i]}</motion.p>
      </AnimatePresence>
      <div className="relative flex gap-1 mt-2">{season.tips.map((_, n) => <span key={n} className={`h-1 rounded-full transition-all ${n === i ? 'w-5 bg-brand-lime' : 'w-1.5 bg-white/25'}`} />)}</div>
    </div>
  );
}
