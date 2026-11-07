/**
 * ════════════════════════════════════════════════════════════════════
 * 🛡️ ¿POR QUÉ CONFIAR EN MI FINANZAS?
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: explica en lenguaje sencillo por qué la app es segura (sin logos prestados).
 * Dónde se ve: sello al final del Inicio, Menú → Privacidad y Ajustes → Privacidad.
 * Si cambias algo de cómo se guardan los datos, actualiza también esta lista.
 * ════════════════════════════════════════════════════════════════════
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Kai from '../components/assistant/Kai';
import { APP_EMAIL } from '../components/legal/LegalContent';

const REASONS: [string, string, string][] = [
  ['📱', 'Tus finanzas se quedan en tu celular', 'Gastos, deudas y metas no viajan a ningún servidor. Solo el hogar compartido viaja, y cifrado.'],
  ['🔑', 'Nunca te pedimos claves', 'Ni de tu banco, ni tarjetas, ni cédula. Si alguien te las pide a nombre de Mi Finanzas, no es nosotros.'],
  ['🏦', 'No somos un banco', 'No movemos tu plata ni vemos tus cuentas. Los pagos los haces tú, desde tu banco.'],
  ['🚫', 'Sin publicidad ni rastreo', 'No vendemos ni compartimos tus datos con nadie.'],
  ['🔒', 'PIN y aviso de intentos', 'Bloquea la app y te avisamos si alguien intentó entrar.'],
  ['📮', 'Contacto real', `${APP_EMAIL} · respondemos en máximo 15 días hábiles.`],
];

export default function TrustPage() {
  const navigate = useNavigate();
  return (
    <div className="pb-28">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-slate-400 py-2"><ChevronLeft size={18} /> Atrás</button>
      <div className="flex items-center gap-3 mt-1">
        <Kai mood="feliz" size={78} />
        <h1 className="text-[24px] font-extrabold leading-tight text-white">¿Por qué confiar en <span className="text-brand-lime">Mi Finanzas</span>?</h1>
      </div>
      <div className="mt-3 space-y-2">
        {REASONS.map(([e, t, d], i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-white/5 px-3.5 py-3">
            <span className="text-2xl" aria-hidden="true">{e}</span>
            <span><span className="block text-[14px] font-extrabold text-white">{t}</span><span className="block text-[12px] text-slate-400 font-semibold leading-snug">{d}</span></span>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Link to="/legal" className="py-3 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-center">Ver privacidad</Link>
        <Link to="/legal" className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-extrabold text-center">Términos</Link>
      </div>
      <p className="text-[10.5px] text-slate-500 mt-4 leading-snug">WhatsApp e Instagram son marcas de Meta. Los nombres de bancos y tiendas que aparecen en la app son marcas de sus dueños; Mi Finanzas no está afiliada a ellos.</p>
    </div>
  );
}
