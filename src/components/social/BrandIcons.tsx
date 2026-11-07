/**
 * ════════════════════════════════════════════════════════════════════
 * 🏷️ LOGOS OFICIALES DE WHATSAPP E INSTAGRAM (de Meta)
 * ────────────────────────────────────────────────────────────────────
 * Archivos originales del Brand Resource Center de Meta, en public/brands/ (sin cambios
 * de color ni de forma; solo se escalan). Reglas que seguimos:
 *   • Pequeños, al lado del texto: nunca lo más grande de la pantalla.
 *   • No se dibujan copias ni se les cambia el color.
 *   • No decimos ni sugerimos que somos socios de WhatsApp o Instagram.
 * Para otros logos (bancos, supermercados) se necesita permiso escrito de cada empresa.
 * ════════════════════════════════════════════════════════════════════
 */
export function WhatsAppLogo({ size = 24, white = false }: { size?: number; white?: boolean }) {
  return <img src={white ? '/brands/whatsapp-white.svg' : '/brands/whatsapp.svg'} width={size} height={size} alt="" aria-hidden="true" className="shrink-0" draggable={false} />;
}
export function InstagramLogo({ size = 24 }: { size?: number }) {
  return <img src="/brands/instagram.png" width={size} height={size} alt="" aria-hidden="true" className="shrink-0" draggable={false} />;
}
