/**
 * ════════════════════════════════════════════════════════════════════
 * 🎃🎄 DECORACIÓN, AVISO Y TARJETA DE TEMPORADA
 * ────────────────────────────────────────────────────────────────────
 * SeasonDecor  → adornos animados encima de toda la app (no estorban los toques):
 *                🎃 murciélagos que aletean, arañita y calabazas con velita · 🎄 nieve y luces.
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
/** Murciélago con alas que aletean de verdad (cada ala gira desde el hombro). */
const Bat = ({ size = 46, speed = 0.32 }: { size?: number; speed?: number }) => (
  <svg width={size} height={size * 0.62} viewBox="0 0 64 40" aria-hidden="true" overflow="visible"
    style={{ filter: 'drop-shadow(0 0 5px rgba(255,138,31,.75)) drop-shadow(0 0 1px rgba(255,190,120,.9))' }}>
    {/* Ala izquierda */}
    <g className="bat-wing bat-wing-l season-anim" style={{ animationDuration: `${speed}s` }}>
      <path d="M27 15C22 9 13 6 2 9c4 2 6 5 6 9 3-2 6-2 8 0 1-3 4-4 7-2 1-2 3-3 5-2z" fill="#14081F" />
      <path d="M26 15 8 12M24 16 12 17" stroke="#3A2050" strokeWidth=".8" fill="none" />
    </g>
    {/* Ala derecha */}
    <g className="bat-wing bat-wing-r season-anim" style={{ animationDuration: `${speed}s` }}>
      <path d="M37 15c5-6 14-9 25-6-4 2-6 5-6 9-3-2-6-2-8 0-1-3-4-4-7-2-1-2-3-3-5-2z" fill="#14081F" />
      <path d="M38 15 56 12M40 16 52 17" stroke="#3A2050" strokeWidth=".8" fill="none" />
    </g>
    {/* Cuerpo, orejas, colmillos y ojos */}
    <ellipse cx="32" cy="19" rx="5.5" ry="8" fill="#1B0C29" />
    <path d="M27.5 12.5 28.5 6l3 4.5h1L35.5 6l1 6.5z" fill="#1B0C29" />
    <circle className="bat-eye season-anim" cx="30" cy="13.5" r="1.3" fill="#FFB347" />
    <circle className="bat-eye season-anim" cx="34" cy="13.5" r="1.3" fill="#FFB347" />
    <path d="M31 16.3l.5 1.4.5-1.4M32.4 16.3l.5 1.4.5-1.4" stroke="#fff" strokeWidth=".6" fill="none" />
  </svg>
);

/** Calabaza de Halloween con cara tallada y una velita adentro que titila. */
const Pumpkin = ({ size = 44, face = 0 }: { size?: number; face?: 0 | 1 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" overflow="visible">
    <defs>
      <radialGradient id={`pk-body-${face}`} cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#FFB04A" /><stop offset="65%" stopColor="#F27A12" /><stop offset="100%" stopColor="#B4500A" />
      </radialGradient>
      <radialGradient id={`pk-fire-${face}`} cx="50%" cy="55%" r="60%">
        <stop offset="0%" stopColor="#FFF6B0" /><stop offset="55%" stopColor="#FFD23F" /><stop offset="100%" stopColor="#FF8A1F" />
      </radialGradient>
    </defs>
    {/* Halo de luz detrás */}
    <circle className="pk-halo season-anim" cx="24" cy="29" r="22" fill="#FF8A1F" opacity=".25" />
    {/* Tallo y hojita con zarcillo */}
    <path d="M23 12c0-4 1-7 4-9l2 1.5c-2 2-3 4-3 7.5z" fill="#4E7A27" />
    <path d="M27 9c3-3 7-3 10-1-3 2-6 3-10 1z" fill="#6BA234" />
    <path d="M26 11c-3 0-5-2-4-4" stroke="#6BA234" strokeWidth="1" fill="none" strokeLinecap="round" />
    {/* Gajos */}
    <ellipse cx="13" cy="29" rx="10" ry="15" fill={`url(#pk-body-${face})`} />
    <ellipse cx="35" cy="29" rx="10" ry="15" fill={`url(#pk-body-${face})`} />
    <ellipse cx="24" cy="29" rx="11" ry="16" fill={`url(#pk-body-${face})`} />
    <path d="M24 13.5v31M17 15c-3 4-3 24 0 29M31 15c3 4 3 24 0 29" stroke="#C25E0C" strokeWidth=".9" fill="none" opacity=".7" />
    {/* Cara tallada: luz de vela adentro */}
    <g className="pk-fire season-anim" fill={`url(#pk-fire-${face})`} stroke="#6B2804" strokeWidth=".9" strokeLinejoin="round">
      {face === 0 ? (<>
        <path d="M13 24l4.5-5 4 5z" /><path d="M26.5 24l4-5 4.5 5z" />
        <path d="M22.5 27.5l1.5-2.5 1.5 2.5z" />
        <path d="M11 32c4 6 22 6 26 0l-3 1-1.5 2.5L30 33l-3 1.5-3-1.5-3 1.5-3-1.5-2.5 2.5L14 33z" />
      </>) : (<>
        <circle cx="17.5" cy="23" r="3.3" /><circle cx="30.5" cy="23" r="3.3" />
        <path d="M14 31c3 4 17 4 20 0-2 4-6 6-10 6s-8-2-10-6z" />
      </>)}
    </g>
    {face === 1 && <><circle cx="18.3" cy="23.6" r="1.2" fill="#2A1206" /><circle cx="31.3" cy="23.6" r="1.2" fill="#2A1206" /></>}
  </svg>
);

/** Arañita que baja de su hilo y vuelve a subir. */
const Spider = () => (
  <div className="spider season-anim">
    <div className="mx-auto w-px h-[60vh] bg-gradient-to-b from-white/0 via-white/35 to-white/60" />
    <svg width="26" height="22" viewBox="0 0 26 22" className="-mt-1 mx-auto block" aria-hidden="true" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,.7))' }}>
      <g className="spider-legs season-anim" stroke="#1B0C29" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M10 9 4 4 1 8M10 11 3 10 0 14M10 13 4 15 2 20M11 14 7 19 6 22" />
        <path d="M16 9l6-5 3 4M16 11l7-1 3 4M16 13l6 2 2 5M15 14l4 5 1 3" />
      </g>
      <ellipse cx="13" cy="12" rx="4.6" ry="5.4" fill="#1B0C29" />
      <circle cx="13" cy="6.5" r="3" fill="#1B0C29" />
      <circle cx="11.9" cy="6.3" r=".8" fill="#FF8A1F" /><circle cx="14.1" cy="6.3" r=".8" fill="#FF8A1F" />
    </svg>
  </div>
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
      {/* Murciélagos que cruzan la pantalla aleteando */}
      {[{ top: '13%', dur: 16, delay: 0.5, size: 54, flap: 0.3 }, { top: '44%', dur: 20, delay: 6, size: 40, flap: 0.24 }, { top: '70%', dur: 18, delay: 11, size: 48, flap: 0.34 }].map((b, i) => (
        <motion.div key={i} className="absolute season-anim" style={{ top: b.top, left: 0 }}
          initial={{ x: '-15vw' }} animate={{ x: ['-15vw', '115vw'], y: [0, -26, 8, -18, 0], rotate: [0, -6, 4, -3, 0] }}
          transition={{ x: { duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'linear', repeatDelay: 4 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}>
          <Bat size={b.size} speed={b.flap} />
        </motion.div>
      ))}
      {/* Arañita colgando arriba a la derecha */}
      <div className="absolute right-[18%] top-0"><Spider /></div>
      {/* Calabazas con velita, que se mecen y dan saltitos */}
      <div className="absolute left-1 bottom-1 flex items-end gap-0.5">
        <div className="pumpkin-rock season-anim"><Pumpkin size={46} face={0} /></div>
        <div className="pumpkin-hop season-anim"><Pumpkin size={30} face={1} /></div>
      </div>
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
