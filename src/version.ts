/**
 * ════════════════════════════════════════════════════════════════════
 * 🏷️ VERSIÓN DE LA APP Y NOVEDADES
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: aviso "Hay una actualización" y ventana de Novedades; Ajustes → Acerca de.
 * Al publicar una versión nueva: sube APP_VERSION y cambia la lista de novedades.
 * ════════════════════════════════════════════════════════════════════
 */
export const APP_VERSION = '1.20.0';

/**
 * Actualización silenciosa (regla de Gato: no acumular versiones):
 *   • Arreglo pequeño (un buscador, un texto, un error): NO subas APP_VERSION y deja SILENT_UPDATE = true.
 *     La app se actualiza sola la próxima vez que se abre, sin ventanas ni notificación.
 *   • Función nueva grande: sube APP_VERSION, escribe las novedades y pon SILENT_UPDATE = false.
 */
export const SILENT_UPDATE = false;

export const RELEASE_NOTES: string[] = [
  '☕ Nuevo: Apóyanos. Si la app te ayuda, puedes hacer un aporte voluntario por Bre-B desde $100 (menú ☰)',
  '💚 Mi Finanzas sigue siendo gratis, sin anuncios y sin pedir tus datos',
]
