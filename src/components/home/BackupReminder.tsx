/**
 * 💾 RECORDATORIO DE RESPALDO (Inicio)
 * Sale si nunca has hecho respaldo o hace más de 30 días, y ya tienes 15 movimientos o más.
 * "Ahora no" lo calla 14 días. Lleva a Ajustes → Descargar respaldo cifrado.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDriveDownload, X } from 'lucide-react';
import { daysSinceBackup, backupSnoozed, snoozeBackupReminder } from '../../services/backupService';
import NewBadge from '../ui/NewBadge';

export default function BackupReminder({ txCount }: { txCount: number }) {
  const [hidden, setHidden] = useState(false);
  const d = daysSinceBackup();
  if (hidden || txCount < 15 || backupSnoozed() || (d !== null && d < 30)) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
        className="rounded-[26px] p-4 bg-gradient-to-br from-sky-400/15 to-transparent ring-1 ring-sky-300/30 relative">
        <button onClick={() => { snoozeBackupReminder(); setHidden(true); }} aria-label="Ahora no" className="absolute top-3 right-3 p-1 text-slate-400"><X size={16} /></button>
        <div className="flex items-start gap-3 pr-6">
          <span className="w-11 h-11 rounded-2xl bg-sky-300 flex items-center justify-center shrink-0"><HardDriveDownload size={22} className="text-[#06122B]" /></span>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-[15px] flex items-center gap-2">Guarda una copia <NewBadge id="home-respaldo" /></p>
            <p className="text-[12px] text-slate-300 mt-0.5">{d === null ? 'Aún no tienes respaldo.' : `Tu último respaldo fue hace ${d} días.`} Si cambias o pierdes el celular, con la copia recuperas todo.</p>
            <Link to="/ajustes?s=respaldo" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-sky-300 text-[#06122B] text-xs font-extrabold px-3 py-2">Hacer respaldo cifrado</Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
