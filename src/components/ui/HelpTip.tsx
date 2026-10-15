import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

/** Botón (?) que abre una burbuja explicando para qué sirve algo. */
export default function HelpTip({ text, title, align = 'right' }: { text: string; title?: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    const t = setTimeout(() => setOpen(false), 8000);
    return () => { document.removeEventListener('pointerdown', close); clearTimeout(t); };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} aria-label={title ? `¿Qué es ${title}?` : 'Ayuda'} aria-expanded={open}
        className="w-7 h-7 -m-1 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
        <HelpCircle size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span role="tooltip"
            initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className={`absolute top-8 ${align === 'right' ? 'right-0' : 'left-0'} z-[70] w-64 bg-slate-800 border border-violet-500/30 text-slate-100 text-xs leading-relaxed rounded-2xl p-3 shadow-2xl shadow-black/60 text-left font-normal normal-case tracking-normal`}>
            {title && <strong className="block text-white text-sm mb-1">{title}</strong>}
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
