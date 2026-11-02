/** Tres anillos uno dentro de otro (gastado · días del mes · ahorro). */
import { motion } from 'framer-motion';

export default function TripleRing({ rings, size = 112 }: { rings: { label: string; pct: number; color: string }[]; size?: number }) {
  const R = [44, 33, 22];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90" role="img" aria-label={rings.map(r => `${r.label} ${Math.round(r.pct)}%`).join(', ')}>
        {rings.map((r, i) => {
          const c = 2 * Math.PI * R[i];
          return (
            <g key={r.label}>
              <circle cx="55" cy="55" r={R[i]} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="9" />
              <motion.circle cx="55" cy="55" r={R[i]} fill="none" stroke={r.pct > 100 && i === 0 ? '#FB7185' : r.color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c}
                initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, r.pct)) / 100) }} transition={{ duration: 1.2, delay: 0.15 + i * 0.12, ease: 'easeOut' }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
