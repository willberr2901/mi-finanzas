/**
 * ════════════════════════════════════════════════════════════════════
 * 🏪 ELEGIR TIENDA ("¿Dónde estás comprando?")
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: fila de tiendas para tocar (las que más usas primero) y una
 *           opción "Otra" para escribir cualquier tienda o la plaza.
 * Dónde se ve: Mercado en modo Comprando y en Terminar mercado.
 * ════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import StoreBadge from './StoreBadge';
import { knownStores, storeKey, cleanStore } from '../../services/market/marketStore';

export default function StorePicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const stores = knownStores();
  const list = value && !stores.some(s => storeKey(s) === storeKey(value)) ? [value, ...stores] : stores;

  const save = () => { const s = cleanStore(text); if (s) onChange(s); setTyping(false); setText(''); };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="radiogroup" aria-label="Tienda">
        {list.slice(0, 14).map(s => {
          const on = !!value && storeKey(s) === storeKey(value);
          return (
            <motion.button key={s} whileTap={{ scale: 0.92 }} role="radio" aria-checked={on} onClick={() => onChange(on ? '' : s)}
              className={`relative shrink-0 w-[68px] flex flex-col items-center gap-1 py-2 rounded-2xl border transition-colors ${on ? 'bg-brand-lime/10 border-brand-lime/60' : 'bg-white/[0.03] border-white/10'}`}>
              <StoreBadge name={s} size={34} />
              <span className={`text-[10px] leading-tight text-center px-1 line-clamp-2 ${on ? 'text-white font-bold' : 'text-slate-300'}`}>{s}</span>
              {on && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-lime flex items-center justify-center"><Check size={10} className="text-brand-ink" strokeWidth={3.5} /></span>}
            </motion.button>
          );
        })}
        <button onClick={() => setTyping(true)} className="shrink-0 w-[68px] flex flex-col items-center justify-center gap-1 py-2 rounded-2xl border border-dashed border-white/15 text-slate-300">
          <span className="w-[34px] h-[34px] rounded-[10px] bg-white/[0.05] flex items-center justify-center"><Plus size={16} /></span>
          <span className="text-[10px]">Otra</span>
        </button>
      </div>
      {typing && (
        <div className="flex gap-2 mt-2">
          <input autoFocus value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} maxLength={40}
            placeholder="Ej: Tienda Don Pepe, Fruver La 80" aria-label="Nombre de la tienda"
            className="flex-1 min-w-0 h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-brand-lime" />
          <button onClick={save} className="px-4 h-11 rounded-xl bg-brand-lime text-brand-ink text-sm font-bold">Listo</button>
        </div>
      )}
    </div>
  );
}
