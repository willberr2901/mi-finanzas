import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import LegalContent, { TERMS_VERSION } from './legal/LegalContent';

export const termsAccepted = () => localStorage.getItem('mf_termsVersion') === TERMS_VERSION;

/** Primera vez (o cuando cambian los términos): muestra privacidad y términos para aceptar. */
export default function TermsModal({ onAccept }: { onAccept: () => void }) {
  const [readToEnd, setReadToEnd] = useState(false);

  const accept = () => {
    localStorage.setItem('mf_termsVersion', TERMS_VERSION);
    localStorage.setItem('miFinanzasTermsAccepted', 'true');
    onAccept();
  };

  return (
    <motion.div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="terms-title"
        className="w-full max-w-md bg-[#0d1322] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh]"
        initial={{ y: 60 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 240 }}>
        <div className="p-5 pb-3 flex items-center gap-3 border-b border-white/5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"><ShieldCheck className="text-white" size={22} /></div>
          <div>
            <h2 id="terms-title" className="text-white font-bold text-lg">Tu privacidad primero</h2>
            <p className="text-slate-400 text-xs">Términos y política de privacidad</p>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1" onScroll={e => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setReadToEnd(true); }}>
          <LegalContent />
        </div>
        <div className="p-5 pt-3 border-t border-white/5">
          <button onClick={accept} className="btn-primary w-full">Acepto, empecemos</button>
          {!readToEnd && <p className="text-center text-[11px] text-slate-500 mt-2">Puedes leerlo completo aquí o después en el menú → Privacidad</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}
