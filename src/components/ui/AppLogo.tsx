import { motion } from 'framer-motion';

/** Logo de la app: una moneda con una órbita que gira (todo en orden, girando a tu favor). */
export default function AppLogo({ size = 56, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <div style={{ width: size, height: size }} className="relative rounded-[28%] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-lg shadow-violet-600/40 flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size * 0.8} height={size * 0.8}>
        <ellipse cx="32" cy="32" rx="24" ry="10" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" transform="rotate(-25 32 32)" />
        <circle cx="32" cy="32" r="13" fill="#fff" />
        <text x="32" y="38.5" textAnchor="middle" fontSize="17" fontWeight="800" fill="#5b21b6" fontFamily="system-ui, sans-serif">$</text>
        <motion.g style={{ originX: '32px', originY: '32px' }} animate={animated ? { rotate: 360 } : {}} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
          <circle cx="56" cy="24" r="4" fill="#22d3ee" transform="rotate(-25 32 32)" />
        </motion.g>
      </svg>
    </div>
  );
}
