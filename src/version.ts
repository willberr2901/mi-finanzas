/**
 * ════════════════════════════════════════════════════════════════════
 * 🏷️ VERSIÓN DE LA APP Y NOVEDADES
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: aviso "Hay una actualización" y ventana de Novedades; Ajustes → Acerca de.
 * Al publicar una versión nueva: sube APP_VERSION y cambia la lista de novedades.
 * ════════════════════════════════════════════════════════════════════
 */
export const APP_VERSION = '1.19.1';

/**
 * Actualización silenciosa: true para arreglos pequeños (un buscador, un texto, un error).
 * La app se actualiza sola la próxima vez que se abre, SIN la ventana de "Nueva versión",
 * sin la ventana de novedades y sin notificación. Para funciones nuevas grandes, déjalo en false.
 */
export const SILENT_UPDATE = true;

export const RELEASE_NOTES: string[] = [
  '🔎 Nuevo buscador en tu lista del mercado: escribe y encuentra el producto al instante',
  '⚡ Desde ahora los arreglos pequeños se instalan solos, sin interrumpirte',
]
