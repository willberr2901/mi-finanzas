/**
 * ════════════════════════════════════════════════════════════════════
 * 🤖 KAI, EL ASISTENTE DE PRESUPUESTO
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: dibuja a Kai (diseño propio de Mi Finanzas) con 5 caras:
 *   normal (hablando) · feliz · pensando · calma ("no te preocupes") · celebra.
 * Se mueve solo: flota, parpadea, la antena brilla y una moneda orbita.
 * En el pecho lleva los 3 anillos del mes (gastado, días, ahorro).
 * Si el celular tiene "reducir movimiento", Kai se queda quieto.
 * Rendimiento: el flotar va por fuera del dibujo (lo mueve la tarjeta gráfica,
 * no se redibuja el robot). En tamaño mini (< 90 px) o con `still` no lleva
 * brillos borrosos ni moneda en órbita: así el teclado y la pantalla van fluidos.
 * Colores: blanco o negro (services/kaiPrefs.ts).
 * ════════════════════════════════════════════════════════════════════
 */
import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useKaiColor, type KaiColor } from '../../services/kaiPrefs';

export type KaiMood = 'normal' | 'feliz' | 'pensando' | 'calma' | 'celebra';
const L = '#D4FF4A';

const HANDS: Record<KaiMood, [number, number, number][]> = {
  normal: [[110, 330, -20], [290, 330, 20]], feliz: [[104, 322, -30], [296, 322, 30]], pensando: [[118, 336, -20], [248, 262, 40]],
  calma: [[112, 334, -20], [214, 316, 10]], celebra: [[82, 214, -35], [318, 214, 35]],
};

const star = (x: number, y: number) => {
  let p = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 8 : 20; p += `${x + r * Math.cos(a)},${y + r * Math.sin(a)} `; }
  return p;
};

/** Ojos y boca en la pantalla de Kai. */
function Face({ mood, glow }: { mood: KaiMood; glow: string | null }) {
  const g = glow ? { filter: `url(#${glow})` } : {};
  if (mood === 'feliz') return <g {...g}><path d="M150 178 q17 -30 34 0 M216 178 q17 -30 34 0" stroke={L} strokeWidth="9" fill="none" strokeLinecap="round" /><path d="M182 196 q18 18 36 0" stroke={L} strokeWidth="6" fill="none" strokeLinecap="round" /></g>;
  if (mood === 'pensando') return <g {...g}><rect x="164" y="144" width="26" height="34" rx="13" fill={L} /><rect x="226" y="150" width="26" height="22" rx="11" fill={L} /><path d="M190 206 h20" stroke={L} strokeWidth="5" strokeLinecap="round" /></g>;
  if (mood === 'calma') return <g {...g}><path d="M150 168 q17 18 34 0 M216 168 q17 18 34 0" stroke={L} strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M186 198 q14 10 28 0" stroke={L} strokeWidth="5" fill="none" strokeLinecap="round" /></g>;
  if (mood === 'celebra') return <g {...g}><polygon points={star(167, 166)} fill={L} stroke={L} strokeWidth="3" strokeLinejoin="round" /><polygon points={star(233, 166)} fill={L} stroke={L} strokeWidth="3" strokeLinejoin="round" /><path d="M180 194 q20 26 40 0 z" fill={L} /></g>;
  return <g {...g}><rect x="152" y="146" width="30" height="44" rx="15" fill={L} /><rect x="218" y="146" width="30" height="44" rx="15" fill={L} /><path d="M188 204 q12 9 24 0" stroke={L} strokeWidth="5" fill="none" strokeLinecap="round" /></g>;
}

const CONFETTI: [number, number, string, number][] = [[60, 120, '#F9A8D4', 20], [340, 110, L, -30], [46, 250, '#7DD3FC', 50], [356, 260, '#FBBF24', -10], [96, 60, L, 70], [300, 40, '#F9A8D4', 15], [30, 180, '#FBBF24', -40], [372, 186, '#7DD3FC', 30]];

const PAL: Record<KaiColor, { s: [string, string, string, string]; hl: number; frame: string; stem: string; rim: string; rimOp: number }> = {
  blanco: { s: ['#FFFFFF', '#E7EBFA', '#AEB8DD', '#7C87B8'], hl: 0.9, frame: '#C9D0EC', stem: '#AEB8DD', rim: '#BFF3FF', rimOp: 0.35 },
  negro: { s: ['#5A6188', '#272C47', '#12162B', '#04060E'], hl: 0.3, frame: '#0A0E24', stem: '#3A4166', rim: '#C6F432', rimOp: 0.55 },
};

interface KaiProps { mood?: KaiMood; size?: number; className?: string; title?: string; still?: boolean; color?: KaiColor }

export default function Kai({ mood = 'normal', size = 160, className = '', title = 'Kai, tu asistente', still: forceStill = false, color }: KaiProps) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const saved = useKaiColor();
  const P = PAL[color ?? saved];
  const still = reduce || forceStill;
  const lite = size < 90;                 // mini: sin brillos borrosos (mucho más liviano)
  const u = (s: string) => `${id}${s}`;
  const glow = lite ? null : u('g');
  const gf = (k: string) => (lite ? undefined : `url(#${u(k)})`);
  const blinkable = !still && (mood === 'normal' || mood === 'pensando');
  const orbit = !still && size >= 120;    // la moneda solo gira en Kai grande
  const loop = { repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <span className={`relative inline-block align-middle ${className}`} style={{ width: size, height: size * 1.1 }}>
      {/* Sombra: va aparte y se anima con CSS (no redibuja el robot) */}
      <motion.span aria-hidden="true" className="absolute left-1/2 rounded-[50%]"
        style={{ bottom: size * 0.02, width: size * 0.42, height: size * 0.06, marginLeft: -size * 0.21, background: 'radial-gradient(closest-side, rgba(0,0,0,.55), transparent)', willChange: 'transform' }}
        animate={still ? undefined : { scaleX: [1, 0.8, 1] }} transition={{ duration: 3.2, ...loop }} />
      <motion.span className="absolute inset-0 block" style={{ willChange: still ? undefined : 'transform' }}
        animate={still ? undefined : { y: [0, -size * 0.025, 0] }} transition={{ duration: 3.2, ...loop }}>
    <svg width={size} height={size * 1.1} viewBox="0 0 400 440" role="img" aria-label={title} className="block">
      <defs>
        <radialGradient id={u('hb')} cx=".35" cy=".28" r=".85"><stop offset="0" stopColor={P.s[0]} /><stop offset=".45" stopColor={P.s[1]} /><stop offset=".85" stopColor={P.s[2]} /><stop offset="1" stopColor={P.s[3]} /></radialGradient>
        <linearGradient id={u('vz')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141B45" /><stop offset="1" stopColor="#03050F" /></linearGradient>
        <linearGradient id={u('or')} x1="0" x2="1"><stop offset="0" stopColor="#7DD3FC" stopOpacity="0" /><stop offset=".5" stopColor="#C6F432" /><stop offset="1" stopColor="#7DD3FC" stopOpacity="0" /></linearGradient>
        <linearGradient id={u('rf')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".32" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
        {!lite && <filter id={u('g')} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>}
        {!lite && <filter id={u('s')}><feGaussianBlur stdDeviation="5" /></filter>}
        <clipPath id={u('vc')}><rect x="112" y="114" width="176" height="110" rx="54" /></clipPath>
      </defs>
      <ellipse cx="200" cy="300" rx="168" ry="38" fill="none" stroke={`url(#${u('or')})`} strokeWidth="3" opacity=".45" transform="rotate(-10 200 300)" />
      {/* Cuerpo */}
      <path d="M138 300 C138 266 166 252 200 252 C234 252 262 266 262 300 C262 352 236 384 200 384 C164 384 138 352 138 300Z" fill={`url(#${u('hb')})`} />
      <path d="M150 296 C152 274 172 264 196 263" stroke="#fff" strokeOpacity={P.hl * 0.85} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Núcleo: los 3 anillos del mes */}
      <circle cx="200" cy="318" r="30" fill={`url(#${u('vz')})`} />
      <g filter={gf('g')}>
        <circle cx="200" cy="318" r="22" fill="none" stroke="#ffffff18" strokeWidth="5" />
        <circle cx="200" cy="318" r="22" fill="none" stroke={L} strokeWidth="5" strokeLinecap="round" strokeDasharray="138" strokeDashoffset={138 * 0.28} transform="rotate(-90 200 318)" />
        <circle cx="200" cy="318" r="14" fill="none" stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round" strokeDasharray="88" strokeDashoffset={88 * 0.5} transform="rotate(-90 200 318)" />
        <circle cx="200" cy="318" r="7" fill="none" stroke="#F9A8D4" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="44" strokeDashoffset={44 * 0.2} transform="rotate(-90 200 318)" />
      </g>
      <ellipse cx="200" cy="258" rx="46" ry="7" fill="#C6F432" opacity={lite ? 0.35 : 0.55} filter={gf('s')} />
      {/* Antena */}
      <path d="M200 64 C200 46 210 36 222 30" stroke={P.stem} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="224" cy="28" r="11" fill={L} filter={gf('g')} />
      <circle cx="220" cy="24" r="3.5" fill="#fff" opacity=".9" />
      {/* Orejas */}
      <rect x="68" y="134" width="30" height="70" rx="15" fill={`url(#${u('hb')})`} /><rect x="302" y="134" width="30" height="70" rx="15" fill={`url(#${u('hb')})`} />
      <rect x="76" y="154" width="6" height="30" rx="3" fill={L} filter={gf('g')} /><rect x="318" y="154" width="6" height="30" rx="3" fill={L} filter={gf('g')} />
      {/* Cabeza */}
      <rect x="86" y="62" width="228" height="196" rx="92" fill={`url(#${u('hb')})`} />
      <rect x="86" y="62" width="228" height="196" rx="92" fill="none" stroke={P.rim} strokeOpacity={P.rimOp} strokeWidth="2" />
      <path d="M116 120 C124 88 160 72 200 72" stroke="#fff" strokeOpacity={P.hl} strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Pantalla */}
      <rect x="106" y="108" width="188" height="122" rx="60" fill={P.frame} />
      <rect x="112" y="114" width="176" height="110" rx="54" fill={`url(#${u('vz')})`} />
      <g clipPath={`url(#${u('vc')})`}>
        <rect x="112" y="114" width="176" height="110" fill={L} opacity=".05" />
        <ellipse cx="140" cy="198" rx="12" ry="6" fill="#FF8FC7" opacity={lite ? 0.35 : 0.55} filter={gf('s')} />
        <ellipse cx="260" cy="198" rx="12" ry="6" fill="#FF8FC7" opacity={lite ? 0.35 : 0.55} filter={gf('s')} />
        <motion.g key={mood} initial={still ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <motion.g animate={blinkable ? { scaleY: [1, 1, 0.1, 1] } : undefined}
            transition={{ duration: 0.35, times: [0, 0.4, 0.7, 1], repeat: Infinity, repeatDelay: 3.6 }}>
            <Face mood={mood} glow={glow} />
          </motion.g>
        </motion.g>
        <path d="M112 114 L190 114 L130 224 L112 224Z" fill={`url(#${u('rf')})`} />
      </g>
      {/* Manos */}
      {HANDS[mood].map(([x, y, r], i) => (
        <motion.g key={i} initial={false} animate={{ x: x - 200, y: y - 330, rotate: mood === 'feliz' && i === 1 && !still ? [r, r + 22, r] : r }}
          transition={mood === 'feliz' && i === 1 && !still ? { rotate: { duration: 0.9, repeat: 2 }, default: { type: 'spring', damping: 16 } } : { type: 'spring', damping: 16 }}>
          <ellipse cx="200" cy="330" rx="22" ry="27" fill={`url(#${u('hb')})`} />
          <ellipse cx="194" cy="320" rx="8" ry="5" fill="#fff" opacity={P.hl * 0.75} />
        </motion.g>
      ))}
      {/* Órbita delantera y moneda */}
      <path d="M34 322 A168 38 -10 0 0 366 262" fill="none" stroke={`url(#${u('or')})`} strokeWidth="3.5" />
      <circle r="13" fill="#FCD34D" cx={orbit ? 0 : 330} cy={orbit ? 0 : 292}>
        {orbit && <animateMotion dur="5s" repeatCount="indefinite" path="M34 322 A168 38 -10 0 0 366 262 A168 38 -10 0 0 34 322" />}
      </circle>
      {/* Extras según la cara */}
      {mood === 'pensando' && (
        <g>
          <circle cx="318" cy="96" r="6" fill="#A5B4FC" /><circle cx="338" cy="74" r="9" fill="#A5B4FC" />
          <rect x="330" y="20" width="62" height="38" rx="19" fill="#1B2350" stroke="#A5B4FC" strokeWidth="2" />
          {[0, 1, 2].map(i => <motion.circle key={i} cx={347 + i * 14} cy="39" r="4" fill={L} animate={still ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />)}
        </g>
      )}
      {mood === 'calma' && <path transform="translate(300 64) scale(1.6)" d="M0 6 C0 -2 10 -4 12 3 C14 -4 24 -2 24 6 C24 14 12 20 12 22 C12 20 0 14 0 6Z" fill="#6EE7B7" />}
      {mood === 'celebra' && !still && CONFETTI.map(([x, y, c, r], i) => (
        <motion.rect key={i} x={x} y={y} width="10" height="18" rx="3" fill={c}
          initial={{ opacity: 0, y: y - 40, rotate: r }} animate={{ opacity: [0, 1, 1, 0], y: [y - 40, y, y + 30, y + 60], rotate: r + 180 }}
          transition={{ duration: 2.2, delay: i * 0.08, repeat: 2, repeatDelay: 0.4 }} />
      ))}
    </svg>
      </motion.span>
    </span>
  );
}
