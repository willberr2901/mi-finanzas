/**
 * ════════════════════════════════════════════════════════════════════
 * ☕ VENTANA "APÓYANOS" (aporte voluntario por Bre-B)
 * ────────────────────────────────────────────────────────────────────
 * Protagonista: Kai con su tintico (KaiCoffee.tsx); reacciona al valor elegido.
 * 3 pasos: 1) elegir valor (desde $100) → 2) pagar con la llave o el QR Bre-B
 * desde cualquier banco → 3) gracias + insignia "Aliado de Mi Finanzas".
 * Se abre desde el menú ☰ y, de vez en cuando, sola (regla en services/supportService.ts).
 * Es voluntario: no desbloquea nada. La plata llega directo a la cuenta, sin pasarela.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ArrowLeft, Instagram, ExternalLink, ChevronDown } from 'lucide-react';
import { qrDataURL } from '../../utils/qr';
import { formatCOP } from '../../utils/format';
import MoneyInput from '../ui/MoneyInput';
import { notify } from '../../services/notificationService';
import { openInstagram } from '../social/Instagram';
import { IS_TEST } from '../../utils/env';
import { getHousehold } from '../../services/household/householdSync';
import { incomingOffers } from '../../services/household/debtSync';
import KaiCoffee, { KaiSays } from './KaiCoffee';
import Kai from '../assistant/Kai';
import { kaiSupportLine, SUPPORT_LABELS, WALLETS, canOpenWallets, openWallet, remindNextMonth, SUPPORT_KEY, SUPPORT_QR, SUPPORT_AMOUNTS, MIN_SUPPORT, readSupport, shouldOfferSupport, countOpen, markAsked, markDismissed, markSupported, claimPromptSlot } from '../../services/supportService';

type Step = 'choose' | 'pay' | 'thanks';

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export default function SupportSheet({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [amount, setAmount] = useState(2000);
  const [other, setOther] = useState(false);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [touched, setTouched] = useState(false);

  const show = (isAuto: boolean) => { setAuto(isAuto); setStep('choose'); setOther(false); setCopied(false); setTouched(false); setAmount(2000); setOpen(true); };

  useEffect(() => { countOpen(); }, []);
  useEffect(() => {
    const on = () => show(false);
    window.addEventListener('mf:open-support', on);
    return () => window.removeEventListener('mf:open-support', on);
  }, []);
  // De vez en cuando, sola (nunca junto a otra ventana)
  useEffect(() => {
    // En la app de pruebas sale en cada apertura para poder revisarla
    if (!ready || !(IS_TEST || shouldOfferSupport(readSupport()))) return;
    // Espera a que no haya otra ventana (bienvenida, novedades, deudas…) y sale con calma.
    // Revisa cada 4 s durante máx. 3 min; una sola ventana "sola" por apertura.
    let tries = 0, calm = 0;
    let t2: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const debtWaiting = !!getHousehold() && incomingOffers(false).length > 0;  // primero la solicitud del hogar
      if (debtWaiting || document.querySelector('[role="dialog"]')) { calm = 0; if (++tries < 45) t2 = setTimeout(attempt, 4000); return; }
      if (++calm < 2) { t2 = setTimeout(attempt, 4000); return; }   // 2 revisiones seguidas sin ventanas
      if (!IS_TEST && !claimPromptSlot()) return;
      markAsked(); show(true);
    };
    t2 = setTimeout(attempt, 6000);
    return () => clearTimeout(t2);
  }, [ready]);
  useEffect(() => {
    if (step === 'pay' && showQr && !qr) qrDataURL(SUPPORT_QR, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark: '#0B1026', light: '#FFFFFF' } }).then(setQr).catch(() => {});
  }, [step, qr, showQr]);

  const close = () => { if (auto && step === 'choose') markDismissed(); setOpen(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(SUPPORT_KEY); setCopied(true); }
    catch { notify({ title: `La llave es ${SUPPORT_KEY}`, message: 'Cópiala a mano en tu banco.', type: 'info', log: false }); }
  };
  const goPay = () => {
    if (amount < MIN_SUPPORT) return notify({ title: `Desde ${formatCOP(MIN_SUPPORT)}`, message: 'Escribe un valor de $100 o más.', type: 'info', log: false });
    setStep('pay');
    navigator.clipboard?.writeText(SUPPORT_KEY).then(() => setCopied(true)).catch(() => {});   // la llave queda copiada de una
  };
  const done = () => { markSupported(); setStep('thanks'); };
  const line = kaiSupportLine(amount, touched);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="support-title" onClick={e => e.stopPropagation()}
            initial={{ y: -60, scale: 0.9, opacity: 0, rotate: -2 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 17, stiffness: 240 }}
            className="theme-dark relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60">

            {step === 'choose' && (<>
              <div className={`relative px-5 pt-4 pb-[104px] bg-gradient-to-br transition-colors ${line.mood === 'celebra' ? 'from-lime-200 via-brand-lime to-emerald-300' : 'from-amber-200 via-orange-300 to-pink-300'}`}>
                <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between"><p className="relative text-[11px] font-extrabold tracking-widest text-[#2A0A1F]">💚 APOYA A MI FINANZAS</p>
                  <button onClick={close} aria-label="Cerrar" className="p-1 text-[#2A0A1F]/70"><X size={18} /></button></div>
              </div>
              <div className="relative z-10 -mt-[104px] flex justify-center"><motion.div initial={{ y: 30, scale: 0.7, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', damping: 13 }}><KaiCoffee mood={line.mood} size={132} /></motion.div></div>
              <div className="relative z-10 px-5 -mt-1"><KaiSays text={line.text} k={line.text} /></div>
              <div className="px-5 pb-5 pt-3 text-center">
                <h2 id="support-title" className="text-white text-xl font-extrabold leading-tight">Mi Finanzas es gratis<br /><span className="text-brand-lime">y lo seguirá siendo</span></h2>
                <p className="text-[13px] text-slate-300 mt-2">Si te ayuda, puedes apoyarnos con lo que quieras, desde $100. Nos ayuda a seguir mejorándola sin anuncios y sin pedir tus datos.</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {SUPPORT_AMOUNTS.map(v => {
                    const on = !other && amount === v; const [e, t] = SUPPORT_LABELS[v] ?? ['💚', ''];
                    return (
                      <motion.button key={v} whileTap={{ scale: 0.93 }} onClick={() => { setAmount(v); setOther(false); setTouched(true); }} aria-pressed={on}
                        className={`rounded-2xl py-2 px-1 flex flex-col items-center transition-shadow ${on ? 'bg-brand-lime text-brand-ink shadow-[0_0_18px_rgba(198,244,50,.45)]' : 'bg-white/[0.06] ring-1 ring-white/10 text-white'}`}>
                        <span className="text-lg leading-none" aria-hidden="true">{e}</span><span className="font-extrabold text-[14px] mt-0.5">{formatCOP(v)}</span><span className={`text-[9.5px] font-bold ${on ? 'text-brand-ink/70' : 'text-slate-400'}`}>{t}</span>
                      </motion.button>
                    );
                  })}
                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setOther(true); setAmount(0); setTouched(true); }} aria-pressed={other}
                    className={`rounded-2xl py-2 px-1 flex flex-col items-center ${other ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] ring-1 ring-white/10 text-white'}`}>
                    <span className="text-lg leading-none" aria-hidden="true">✏️</span><span className="font-extrabold text-[14px] mt-0.5">Otro</span><span className={`text-[9.5px] font-bold ${other ? 'text-brand-ink/70' : 'text-slate-400'}`}>desde $100</span>
                  </motion.button>
                </div>
                {other && <MoneyInput value={amount} onChange={setAmount} prefix placeholder="Desde $100" ariaLabel="Otro valor" className="mt-2 w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-center font-bold outline-none focus:border-brand-lime" />}
                <motion.button whileTap={{ scale: 0.96 }} onClick={goPay} className="mt-4 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">
                  {amount >= MIN_SUPPORT ? `Apoyar con ${formatCOP(amount)} →` : 'Apoyar →'}
                </motion.button>
                {auto && <button onClick={close} className="mt-2 w-full h-11 text-sm font-bold text-slate-400">Ahora no</button>}
                <p className="text-[10.5px] text-slate-400 mt-2.5 font-semibold">🔒 Desde tu banco · Sin comisión · Voluntario</p>
                <p className="text-[10px] text-slate-500 mt-1">La app sigue gratis: tu aporte no desbloquea funciones. <a href="/legal" className="underline">Términos</a></p>
              </div>
            </>)}

            {step === 'pay' && (
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <button onClick={() => setStep('choose')} aria-label="Volver" className="p-1 -ml-1 text-slate-300"><ArrowLeft size={20} /></button>
                  <button onClick={close} aria-label="Cerrar" className="p-1 text-slate-300"><X size={20} /></button>
                </div>
                <div className="text-center -mt-2">
                  <p className="text-[10.5px] font-extrabold tracking-widest text-slate-400">VAS A APOYAR CON</p>
                  <p id="support-title" className="text-[38px] leading-tight font-extrabold text-brand-lime drop-shadow-[0_0_14px_rgba(198,244,50,.35)]">{formatCOP(amount)}</p>
                  <button onClick={() => setStep('choose')} className="text-[11.5px] font-bold text-slate-400">Cambiar valor</button>
                </div>
                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-brand-lime/15 to-white/[0.03] ring-[1.5px] ring-brand-lime">
                  <p className="text-[10.5px] font-extrabold tracking-widest text-slate-400">1 · COPIA LA LLAVE BRE-B</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[26px] font-extrabold text-white tracking-wide">{SUPPORT_KEY}</span>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={copy} className="px-3 h-9 rounded-xl bg-brand-lime text-brand-ink text-sm font-extrabold flex items-center gap-1.5">{copied ? <><Check size={15} strokeWidth={3} /> Copiada</> : <><Copy size={15} /> Copiar</>}</motion.button>
                  </div>
                </div>
                <p className="text-[10.5px] font-extrabold tracking-widest text-slate-400 mt-3.5">2 · ABRE TU APP Y PEGA</p>
                {canOpenWallets() ? (
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {WALLETS.map(w => (
                      <motion.button key={w.id} whileTap={{ scale: 0.95 }} onClick={() => { copy(); openWallet(w.pkg); }}
                        className="h-11 rounded-2xl bg-white/[0.06] ring-1 ring-white/10 text-white text-[13px] font-extrabold flex items-center gap-1.5 px-3">📱 {w.name}<ExternalLink size={13} className="ml-auto text-slate-400" /></motion.button>
                    ))}
                    <div className="h-11 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 text-slate-300 text-[12px] font-bold flex items-center px-3">🏦 Otro banco: ábrelo tú</div>
                  </div>
                ) : <p className="text-[13px] text-slate-300 mt-1.5">Abre la app de tu banco o billetera (Nequi, Daviplata, Bancolombia…).</p>}
                <p className="mt-3 p-3 rounded-2xl bg-white/[0.04] text-[12.5px] text-slate-300 leading-relaxed"><b className="text-white">3 ·</b> En tu app: Enviar → <b className="text-white">Bre-B / Llaves</b> → pega <b className="text-brand-lime">{SUPPORT_KEY}</b> y escribe <b className="text-brand-lime">{formatCOP(amount)}</b></p>
                <button onClick={() => setShowQr(v => !v)} className="mt-2 w-full h-11 rounded-2xl bg-white/[0.04] text-white text-[12.5px] font-extrabold flex items-center gap-2 px-3">🔳 ¿Pagas desde otro celular? {showQr ? 'Ocultar' : 'Ver'} QR<ChevronDown size={15} className={`ml-auto text-slate-400 transition-transform ${showQr ? 'rotate-180' : ''}`} /></button>
                <AnimatePresence>{showQr && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-2 p-4 rounded-2xl bg-white text-center">
                      {qr ? <img src={qr} alt="Código QR Bre-B para apoyar a Mi Finanzas" className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto rounded-lg bg-slate-200 animate-pulse" />}
                      <p className="text-[#0B1026] text-[12px] font-semibold mt-2">Escanéalo desde la app de tu banco</p>
                    </div>
                  </motion.div>
                )}</AnimatePresence>
                <div className="flex items-center gap-2 mt-3"><span className="shrink-0"><Kai mood="normal" size={44} still title="Kai" /></span><p className="text-[12px] text-slate-300 font-semibold">Aquí te espero. Cuando vuelvas, toca "Ya apoyé" 💚</p></div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={done} className="mt-3 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Ya apoyé 💚</motion.button>
              </div>
            )}

            {step === 'thanks' && (
              <div className="p-6 text-center">
                <motion.div initial={{ scale: 0.3, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 10 }} className="relative flex justify-center">
                  {[...Array(16)].map((_, i) => (
                    <motion.i key={i} aria-hidden="true" className="absolute w-2 h-3.5 rounded-[2px]" style={{ background: ['#C6F432', '#F9A8D4', '#7DD3FC', '#FBBF24'][i % 4], left: `${(i * 37) % 100}%`, top: 0 }}
                      initial={{ y: -20, opacity: 0, rotate: 0 }} animate={{ y: [-20, 150], opacity: [0, 1, 1, 0], rotate: 360 }} transition={{ duration: 2.2, delay: (i % 8) * 0.12, repeat: 2 }} />
                  ))}
                  <Kai mood="celebra" size={160} title="Kai celebrando" />
                </motion.div>
                <span className="inline-block mt-1 px-3 py-1 rounded-full bg-amber-400 text-[#2A0A1F] text-[11px] font-black tracking-wide">🏅 ALIADO DE {MESES[new Date().getMonth()].toUpperCase()}</span>
                <h2 id="support-title" className="text-white text-2xl font-extrabold mt-2">¡Gracias por <span className="text-brand-lime">apoyarnos!</span></h2>
                <p className="text-sm text-slate-300 mt-2">Kai está feliz 🤖💚 Tu aporte nos ayuda a mantener Mi Finanzas gratis, sin anuncios y sin pedir tus datos.</p>
                <div className="mt-5 p-3 rounded-2xl bg-gradient-to-br from-amber-200/20 to-brand-lime/10 ring-1 ring-amber-200/40 text-left flex items-center gap-3">
                  <span className="shrink-0 w-12 h-12 rounded-full bg-[radial-gradient(#FDE68A,#F59E0B)] flex items-center justify-center"><Kai mood="feliz" size={38} still title="Kai" /></span>
                  <span><span className="block text-white font-extrabold text-sm">Kai dorado desbloqueado ✨</span>
                  <span className="block text-[12px] text-slate-400 mt-0.5">Ya brilla en tu menú como agradecimiento (solo en tu celular).</span></span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => { openInstagram(); }} className="h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5"><Instagram size={16} /> Síguenos</button>
                  <button onClick={() => { remindNextMonth(); notify({ title: 'Te recuerdo en un mes ☕', type: 'success', log: false }); }} className="h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-[12.5px] font-bold">🔁 Recordarme en un mes</button>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(false)} className="mt-2 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Volver a la app</motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
