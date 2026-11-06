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
  '🤖 Conoce a Kai: arma tu presupuesto con tu sueldo, deudas y ahorro (blanco o negro)',
  '🏠 Nuevo Inicio en una pantalla: anillos, 8 íconos y “Para hoy”',
  '🔔 Avisos con botones: registra tu sueldo, marca pagos y anota gastos desde la notificación',
  '🔄 Deudas sincronizadas con tu hogar (la otra persona aprueba)',
  '✨ Menú de módulos animado, con datos al día en cada tarjeta',
  '⭐ Califica la app con unas estrellas (solo en buenos momentos, sin insistir)',
  '🪙 Alcancía nueva: frasco que se llena, monedas con su valor y a qué equivale lo que juntaste',
  '☕ Apóyanos con Kai: invítale un tintico por Bre-B (voluntario, la app sigue gratis)',
  '📊 Resumen del mes en historia · 💾 recordatorio de copia',
]
