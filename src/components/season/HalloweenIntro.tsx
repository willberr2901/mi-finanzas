/**
 * ════════════════════════════════════════════════════════════════════
 * 🎃 PANTALLA DE ENTRADA DE HALLOWEEN (terrorífica)
 * ────────────────────────────────────────────────────────────────────
 * Sale al abrir la app durante el mes de brujas (una vez por cada vez que se abre):
 * noche con luna, relámpagos, cementerio, niebla, ojos que brillan en la oscuridad,
 * murciélagos que vuelan hacia la pantalla y una calabaza malvada.
 * Se cierra con "Entrar… si te atreves", tocando "Saltar" o sola a los pocos segundos.
 * No sale si la persona apagó la decoración de temporada (Ajustes → Apariencia).
 * Fecha de la temporada: services/season.ts · Dibujos: Season.tsx (Bat, Pumpkin).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import '@fontsource/creepster/latin-400.css';
import { useSeason } from '../../services/season';
import { Bat } from './Season';
import vozUrl from '../../assets/voz-halloween.mp3';

const SEEN = 'mf_hw_intro';
const AUTO_CLOSE_MS = 11000;   // lo que dura la voz + la risa

// Murciélagos que salen del centro hacia la pantalla
const SWARM = [
  { x: -160, y: -260, d: 0.2, r: -20 }, { x: 170, y: -230, d: 0.35, r: 18 }, { x: -190, y: 40, d: 0.5, r: -10 },
  { x: 200, y: 90, d: 0.6, r: 12 }, { x: -60, y: -320, d: 0.75, r: -6 }, { x: 90, y: -300, d: 0.9, r: 8 },
  { x: -230, y: -120, d: 1.1, r: -16 }, { x: 240, y: -60, d: 1.25, r: 14 },
];
// Ojos que se asoman en la oscuridad
const EYES = [{ l: '12%', b: '23%', d: 1.4, s: 1 }, { l: '78%', b: '27%', d: 2.1, s: 0.8 }, { l: '30%', b: '15%', d: 2.8, s: 0.7 }, { l: '62%', b: '12%', d: 3.3, s: 0.9 }];

/** Calabaza tenebrosa: oscura, con grietas, ojos rasgados y colmillos; el fuego de adentro se enciende y titila. */
function ScaryPumpkin({ size = 170 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="sp-body" cx="45%" cy="35%" r="70%"><stop offset="0%" stopColor="#C0590E" /><stop offset="55%" stopColor="#6E2606" /><stop offset="100%" stopColor="#1E0702" /></radialGradient>
        <radialGradient id="sp-fire" cx="50%" cy="60%" r="65%"><stop offset="0%" stopColor="#FFF3A0" /><stop offset="45%" stopColor="#FF8A00" /><stop offset="100%" stopColor="#B00000" /></radialGradient>
      </defs>
      {/* Tallo torcido */}
      <path d="M57 26c-2-9 1-16 9-21l4 3c-6 5-7 10-5 18z" fill="#2B2410" />
      {/* Gajos */}
      <ellipse cx="34" cy="68" rx="27" ry="40" fill="url(#sp-body)" />
      <ellipse cx="86" cy="68" rx="27" ry="40" fill="url(#sp-body)" />
      <ellipse cx="60" cy="68" rx="30" ry="44" fill="url(#sp-body)" />
      <path d="M60 25v86M42 28c-8 10-8 70 0 80M78 28c8 10 8 70 0 80" stroke="#1A0601" strokeWidth="1.6" opacity=".7" fill="none" />
      {/* Grietas */}
      <path d="M24 44l6 7-3 6 5 5M95 92l-6-5 2-6-5-4" stroke="#140401" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Cara tallada con fuego */}
      <g className="sp-fire" fill="url(#sp-fire)" stroke="#120300" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M28 52l24 8-17 9z" />
        <path d="M92 52l-24 8 17 9z" />
        <path d="M55 74l5-8 5 8z" />
        <path d="M24 82c10 22 62 22 72 0l-7 4-4 9-5-8-5 10-5-9-5 10-5-10-5 9-5-10-4 8-4-9z" />
      </g>
    </svg>
  );
}

export default function HalloweenIntro({ ready }: { ready: boolean }) {
  const season = useSeason();
  const [show, setShow] = useState(false);
  const [canEnter, setCanEnter] = useState(false);
  const calm = useReducedMotion();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [needTap, setNeedTap] = useState(false);
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  /** Suena la voz. Si el celular no deja sonar sin tocar, se espera al primer toque. */
  const playVoice = () => {
    try {
      if (!audio.current) { audio.current = new Audio(vozUrl); audio.current.volume = 0.9; }
      audio.current.currentTime = 0;
      audio.current.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true));
    } catch { /* sin sonido */ }
  };
  const stopVoice = () => {
    const a = audio.current;
    if (!a) return;
    const fade = setInterval(() => { a.volume = Math.max(0, a.volume - 0.15); if (a.volume <= 0.05) { a.pause(); clearInterval(fade); } }, 60);
  };

  useEffect(() => {
    if (!ready || season?.id !== 'halloween') return;
    try { if (sessionStorage.getItem(SEEN)) return; sessionStorage.setItem(SEEN, '1'); } catch { /* sin almacenamiento */ }
    setShow(true);
    playVoice();
    const a = setTimeout(() => setCanEnter(true), 2300);
    timer.current = setTimeout(() => close(), AUTO_CLOSE_MS);
    return () => { clearTimeout(a); if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, season]);
  useEffect(() => { if (hidden) stopVoice(); }, [hidden]);

  const close = () => { stopVoice(); setShow(false); setHidden(true); };
  /** Primer toque cuando el celular no dejó sonar: suena y vuelve a contar el tiempo. */
  const tapToHear = () => {
    playVoice();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => close(), AUTO_CLOSE_MS);
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div role="dialog" aria-modal="true" aria-label="Bienvenida de Halloween" onClick={() => (needTap ? tapToHear() : canEnter && close())}
          className="fixed inset-0 z-[210] overflow-hidden select-none"
          style={{ background: 'radial-gradient(ellipse at 70% 18%, #3B1E5E 0%, #170A26 45%, #05020A 100%)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)' }} transition={{ duration: 0.5 }}>

          {/* Temblor de pantalla con el trueno */}
          <motion.div className="absolute inset-0" animate={{ x: [0, 0, -6, 5, -3, 0, 0], y: [0, 0, 3, -4, 2, 0, 0] }} transition={{ duration: 3.4, times: [0, 0.17, 0.19, 0.21, 0.23, 0.26, 1], repeat: Infinity }}>
            {/* Luna con nubes */}
            <div aria-hidden="true" className="absolute right-[8%] top-[7%] w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle at 40% 40%, #FFF4C9, #F2D27A 60%, #C9A24A)', boxShadow: '0 0 60px 20px rgba(255,220,140,.35), 0 0 160px 60px rgba(255,160,60,.15)' }} />
            <motion.div aria-hidden="true" className="absolute top-[12%] h-10 w-72 rounded-full bg-[#0B0414]/80 blur-md" initial={{ x: '-40vw' }} animate={{ x: '110vw' }} transition={{ duration: 9, ease: 'linear', repeat: Infinity }} />

            {/* Cementerio, árbol torcido y lápidas */}
            <svg aria-hidden="true" className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice">
              <path d="M0 150c60-30 120-30 190-10s150 10 210-20v100H0z" fill="#0A0412" />
              <path d="M60 160V70M60 100 30 72M60 115l34-30M60 85l22-26M30 72l-12-8M94 85l14-6" stroke="#05020A" strokeWidth="9" strokeLinecap="round" />
              <path d="M250 175v-34a14 14 0 0 1 28 0v34zM300 180v-26a11 11 0 0 1 22 0v26zM150 178v-22a10 10 0 0 1 20 0v22z" fill="#140B22" />
              <path d="M258 152h12M264 146v14" stroke="#2A1A3E" strokeWidth="3" />
              <path d="M0 190c80-20 160-14 240 4s120 6 160-6v32H0z" fill="#05020A" />
            </svg>

            {/* Niebla */}
            <motion.div aria-hidden="true" className="absolute -left-1/4 bottom-[6%] w-[150%] h-28 rounded-[50%] bg-[#B9A6D6]/15 blur-2xl" animate={{ x: ['0%', '12%', '0%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div aria-hidden="true" className="absolute -left-1/4 bottom-0 w-[150%] h-24 rounded-[50%] bg-[#D8CCEB]/10 blur-2xl" animate={{ x: ['8%', '-6%', '8%'] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />

            {/* Ojos en la oscuridad */}
            {EYES.map((e, n) => (
              <motion.div key={n} aria-hidden="true" className="absolute flex gap-2" style={{ left: e.l, bottom: e.b, scale: e.s }}
                initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0.1, 1, 1] }} transition={{ delay: e.d, duration: 2.6, repeat: Infinity, repeatDelay: 1.2 + n * 0.4 }}>
                {[0, 1].map(k => <span key={k} className="block w-3 h-2 rounded-[50%] bg-[#FFDD33]" style={{ boxShadow: '0 0 10px 3px rgba(255,200,40,.8)', clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)', transform: k ? 'scaleX(-1)' : undefined }} />)}
              </motion.div>
            ))}

            {/* Murciélagos saliendo hacia ti */}
            {SWARM.map((b, n) => (
              <motion.div key={n} aria-hidden="true" className="absolute left-1/2 top-[42%]"
                initial={{ x: 0, y: 0, scale: 0.15, opacity: 0, rotate: 0 }}
                animate={{ x: b.x, y: b.y, scale: [0.15, 1.6, 2.6], opacity: [0, 1, 0], rotate: b.r }}
                transition={{ delay: b.d, duration: 1.8, ease: 'easeIn', repeat: Infinity, repeatDelay: 3.2 }}>
                <Bat size={46} speed={0.18} />
              </motion.div>
            ))}

            {/* Fantasma que flota */}
            <motion.div aria-hidden="true" className="absolute left-[3%] top-[64%]" initial={{ opacity: 0, x: -40 }} animate={{ opacity: [0, 0.75, 0.55, 0.75], x: [-40, 10, 0, 14], y: [0, -14, 6, -10] }} transition={{ delay: 2.2, duration: 4, ease: 'easeInOut' }}>
              <svg width="74" height="90" viewBox="0 0 60 74"><path d="M30 2C15 2 6 14 6 30v38l8-6 8 7 8-7 8 7 8-7 8 6V30C54 14 45 2 30 2z" fill="#E9E3F5" opacity=".85" /><ellipse cx="22" cy="28" rx="4.5" ry="7" fill="#12061E" /><ellipse cx="38" cy="28" rx="4.5" ry="7" fill="#12061E" /><ellipse cx="30" cy="44" rx="5" ry="7" fill="#12061E" /></svg>
            </motion.div>

            {/* Araña que cae */}
            <motion.div aria-hidden="true" className="absolute left-[14%] top-0 flex flex-col items-center" initial={{ y: -220 }} animate={{ y: [-220, 40, 10, 30] }} transition={{ delay: 1.6, duration: 1.6, ease: 'easeOut' }}>
              <div className="w-px h-48 bg-gradient-to-b from-white/0 to-white/50" />
              <svg width="30" height="26" viewBox="0 0 26 22" className="-mt-1"><g stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"><path d="M10 9 4 4 1 8M10 11 3 10 0 14M10 13 4 15 2 20M16 9l6-5 3 4M16 11l7-1 3 4M16 13l6 2 2 5" /></g><ellipse cx="13" cy="12" rx="4.6" ry="5.4" fill="#000" /><circle cx="13" cy="6.5" r="3" fill="#000" /><circle cx="11.9" cy="6.3" r=".9" fill="#FF2E2E" /><circle cx="14.1" cy="6.3" r=".9" fill="#FF2E2E" /></svg>
            </motion.div>

            {/* Calabaza malvada + título */}
            <div className="absolute inset-x-0 top-[24%] flex flex-col items-center text-center px-6">
              {/* La calabaza se acerca lentamente, como si viniera hacia ti */}
              <motion.div initial={{ scale: 0.35, opacity: 0, y: 40 }} animate={{ scale: [0.35, 0.95, 1.12], opacity: [0, 1, 1], y: 0, rotate: [0, -3, 2, 0] }}
                transition={{ delay: 0.4, duration: 3.6, ease: 'easeOut', rotate: { delay: 1.2, duration: 2.5, repeat: Infinity } }}>
                <ScaryPumpkin size={170} />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1, x: [0, -2, 2, -1, 0] }} transition={{ delay: 1.1, duration: 0.6, x: { delay: 1.7, duration: 0.4, repeat: Infinity, repeatDelay: 2.6 } }}
                className="mt-4 text-[54px] leading-none text-[#E8590C]" style={{ fontFamily: 'Creepster, cursive', textShadow: '0 0 10px rgba(200,0,0,.55), 0 4px 0 #2A0000, 0 10px 30px rgba(0,0,0,.95)', letterSpacing: '0.04em' }}>
                Mi Finanzas
              </motion.h1>
              {/* Gotas que escurren */}
              <div aria-hidden="true" className="relative w-56 h-8 -mt-1">
                {[18, 52, 96, 140, 186].map((x, n) => (
                  <motion.span key={x} className="absolute top-0 w-1.5 rounded-b-full bg-[#9E0B0B]" style={{ left: x }} initial={{ height: 0 }} animate={{ height: [0, 14 + (n % 3) * 8, 14 + (n % 3) * 8] }} transition={{ delay: 1.6 + n * 0.15, duration: 1.4 }} />
                ))}
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 1] }} transition={{ delay: 1.9, duration: 1 }} className="text-[#E9D8FF] text-base font-bold mt-1" style={{ textShadow: '0 2px 10px #000' }}>
                ¿Te atreves… a entrar a Mi Finanzas?
              </motion.p>
              <AnimatePresence>
                {canEnter && (
                  <motion.button onClick={e => { e.stopPropagation(); close(); }} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="mt-7 px-7 h-14 rounded-2xl bg-[#FF7A1A] text-[#1A0700] font-extrabold text-base shadow-[0_0_30px_rgba(255,110,20,.6)] active:scale-95">
                    Entrar… si te atreves 🎃
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.75) 100%)' }} />

          {/* Relámpagos (suaves; se apagan si el celular pide menos movimiento) */}
          {!calm && <motion.div aria-hidden="true" className="absolute inset-0 bg-[#E8DFFF] pointer-events-none" initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.5, 0, 0.32, 0, 0] }} transition={{ duration: 3.4, times: [0, 0.17, 0.18, 0.2, 0.22, 0.25, 1], repeat: Infinity }} />}

          {needTap && (
            <motion.button onClick={e => { e.stopPropagation(); tapToHear(); }} initial={{ opacity: 0 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute left-4 top-[max(16px,env(safe-area-inset-top))] px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold">🔊 Toca para escuchar</motion.button>
          )}
          <button onClick={e => { e.stopPropagation(); close(); }} className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] px-3 py-1.5 rounded-full bg-black/40 text-white/70 text-xs font-bold">Saltar</button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
