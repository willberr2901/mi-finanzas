import { motion } from 'framer-motion';

/** Logo de la app: tres barras que crecen y un punto lima (cada mes, un paso más arriba). */
export default function AppLogo({ size = 56, animated = true }: { size?: number; animated?: boolean }) {
  const bars = [
    { x: 128, y: 276, h: 120, fill: '#ffffff', op: 0.38 },
    { x: 224, y: 210, h: 186, fill: '#ffffff', op: 0.72 },
    { x: 320, y: 146, h: 250, fill: '#C6F432', op: 1 },
  ];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.227, background: 'linear-gradient(135deg,#1A2140,#0B1026)', boxShadow: '0 10px 30px -8px rgba(198,244,50,.35), inset 0 0 0 1px rgba(255,255,255,.08)' }} className="relative flex items-center justify-center overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 512 512" width={size} height={size}>
        {bars.map((b, i) => (
          <motion.rect key={i} x={b.x} width={64} rx={32} fill={b.fill} fillOpacity={b.op}
            initial={animated ? { y: 396, height: 0 } : false}
            animate={{ y: b.y, height: b.h }}
            transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 140, damping: 16 }} />
        ))}
        <motion.circle cx={352} cy={98} r={23} fill="#C6F432"
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={animated ? { scale: [0, 1.25, 1], opacity: 1, y: [0, 0, -6, 0] } : { scale: 1, opacity: 1 }}
          transition={animated ? { scale: { delay: 0.6, duration: 0.5 }, opacity: { delay: 0.6 }, y: { delay: 1.2, duration: 1.6, repeat: Infinity, repeatDelay: 1.4 } } : undefined}
          style={{ transformOrigin: '352px 98px' }} />
      </svg>
    </div>
  );
}
