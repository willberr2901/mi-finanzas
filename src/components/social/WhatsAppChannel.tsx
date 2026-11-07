/**
 * ════════════════════════════════════════════════════════════════════
 * 📣 CANAL DE WHATSAPP "Mi Finanzas · Ahorra en casa"
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: botón para unirse al canal (trucos de ahorro y novedades).
 * Dónde se ve: Menú ☰ y Ajustes → Acerca de.
 * Si cambia el enlace del canal: cambia WHATSAPP_CHANNEL_URL.
 * ════════════════════════════════════════════════════════════════════
 */
import { WhatsAppLogo } from './BrandIcons';

export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8juxcDDmFPooL1je0j';
export const openWhatsAppChannel = () => window.open(WHATSAPP_CHANNEL_URL, '_blank', 'noopener,noreferrer');

/** Logo oficial de WhatsApp (archivo de Meta, sin cambios). */
export function ChannelIcon({ size = 30 }: { size?: number }) {
  return <span style={{ width: size, height: size }} className="inline-flex items-center justify-center shrink-0"><WhatsAppLogo size={Math.round(size * 0.8)} /></span>;
}
