/**
 * ════════════════════════════════════════════════════════════════════
 * 📣 CANAL DE WHATSAPP "Mi Finanzas · Ahorra en casa"
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: botón para unirse al canal (trucos de ahorro y novedades).
 * Dónde se ve: Menú ☰ y Ajustes → Acerca de.
 * Si cambia el enlace del canal: cambia WHATSAPP_CHANNEL_URL.
 * ════════════════════════════════════════════════════════════════════
 */
import { Radio } from 'lucide-react';

export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8juxcDDmFPooL1je0j';
export const openWhatsAppChannel = () => window.open(WHATSAPP_CHANNEL_URL, '_blank', 'noopener,noreferrer');

/** Ícono del canal (ícono genérico de transmisión sobre verde). */
export function ChannelIcon({ size = 30 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.3 }} className="inline-flex items-center justify-center shrink-0 bg-[#25D366] shadow-md shadow-emerald-500/20" aria-hidden="true">
      <Radio size={size * 0.56} className="text-white" strokeWidth={2.3} />
    </span>
  );
}
