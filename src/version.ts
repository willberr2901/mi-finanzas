/**
 * ════════════════════════════════════════════════════════════════════
 * 🏷️ VERSIÓN DE LA APP Y NOVEDADES
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: aviso "Hay una actualización" y ventana de Novedades; Ajustes → Acerca de.
 * Al publicar una versión nueva: sube APP_VERSION y cambia la lista de novedades.
 * ════════════════════════════════════════════════════════════════════
 */
export const APP_VERSION = '1.17.1';

export const RELEASE_NOTES: string[] = [
  '🛒 Arreglado: en Mercado, si escribías un producto y tocabas "Listo", no se guardaba. Ahora se guarda siempre ("Guardar y cerrar")',
  '🗂️ Mejor clasificación automática: plurales como "Tomates" o "Aguacates" ya van en su categoría, y se sumaron más productos',
  '📱 Arreglado: en celulares más antiguos el mercado, los préstamos y los pagos no se guardaban',
]
