import { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Delete, Fingerprint, Lock } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import AppLogo from './ui/AppLogo';

/** Pantalla de bloqueo: PIN con teclado propio, huella opcional y espera tras varios intentos. */
export default function SecurityLock() {
  const { unlockWithPin, unlockWithBiometric, biometricEnabled, lockoutRemaining } = useSecurity();
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('Ingresa tu PIN');
  const [wait, setWait] = useState(lockoutRemaining());
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();
  const LEN = 4;

  useEffect(() => { if (biometricEnabled) unlockWithBiometric(); }, [biometricEnabled, unlockWithBiometric]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait(lockoutRemaining()), 1000);
    return () => clearInterval(t);
  }, [wait, lockoutRemaining]);

  const submit = async (value: string) => {
    setBusy(true);
    const r = await unlockWithPin(value);
    setBusy(false);
    if (r.ok) return;
    setPin('');
    shake.start({ x: [0, -14, 14, -10, 10, -4, 0], transition: { duration: 0.45 } });
    if (r.waitSeconds) { setWait(r.waitSeconds); setMsg('Demasiados intentos'); }
    else setMsg(r.left !== undefined && r.left <= 2 ? `PIN incorrecto · te quedan ${r.left} intentos` : 'PIN incorrecto');
  };

  const press = (d: string) => {
    if (busy || wait > 0 || pin.length >= LEN) return;
    const next = pin + d;
    setPin(next);
    if (next.length === LEN) submit(next);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#070B14] flex flex-col items-center justify-center px-8">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-violet-600/25 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center w-full max-w-xs">
        <AppLogo size={64} />
        <p className="text-white text-xl font-bold mt-5 flex items-center gap-2"><Lock size={18} /> Mi Finanzas</p>
        <p className={`text-sm mt-1 ${msg.startsWith('PIN incorrecto') || wait ? 'text-red-300' : 'text-slate-400'}`} role="status">
          {wait > 0 ? `Espera ${wait} s para intentar de nuevo` : msg}
        </p>
        <motion.div animate={shake} className="flex gap-4 my-8" aria-label={`${pin.length} de ${LEN} dígitos`}>
          {Array.from({ length: LEN }).map((_, i) => (
            <motion.span key={i} animate={{ scale: i < pin.length ? 1.15 : 1 }}
              className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-violet-400 border-violet-400' : 'border-slate-600'}`} />
          ))}
        </motion.div>
        <div className="grid grid-cols-3 gap-4 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <motion.button key={d} whileTap={{ scale: 0.88 }} onClick={() => press(d)} disabled={wait > 0}
              className="h-16 rounded-2xl bg-white/5 border border-white/10 text-white text-2xl font-semibold disabled:opacity-40">{d}</motion.button>
          ))}
          {biometricEnabled
            ? <motion.button whileTap={{ scale: 0.88 }} onClick={() => unlockWithBiometric()} aria-label="Desbloquear con huella" className="h-16 rounded-2xl flex items-center justify-center text-violet-300"><Fingerprint size={30} /></motion.button>
            : <span />}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => press('0')} disabled={wait > 0} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-white text-2xl font-semibold disabled:opacity-40">0</motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setPin(p => p.slice(0, -1))} aria-label="Borrar" className="h-16 rounded-2xl flex items-center justify-center text-slate-300"><Delete size={26} /></motion.button>
        </div>
        <p className="text-[11px] text-slate-500 mt-8 text-center">¿Olvidaste el PIN? Por seguridad no se puede recuperar: borra los datos del sitio desde el navegador y restaura un respaldo.</p>
      </div>
    </div>
  );
}
