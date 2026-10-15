import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { formatCOP } from '../../utils/format';

/** Número en pesos que "cuenta" hasta su valor al aparecer. */
export default function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    const controls = animate(0, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], onUpdate: v => setShown(v) });
    return () => controls.stop();
  }, [value]);
  return <span className={className} aria-label={formatCOP(value)}>{formatCOP(shown)}</span>;
}
