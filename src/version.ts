/**
 * ════════════════════════════════════════════════════════════════════
 * 🏷️ VERSIÓN DE LA APP Y NOVEDADES
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: aviso "Hay una actualización" y ventana de Novedades; Ajustes → Acerca de.
 * Al publicar una versión nueva: sube APP_VERSION y cambia la lista de novedades.
 * ════════════════════════════════════════════════════════════════════
 */
export const APP_VERSION = '1.10.1';

export const RELEASE_NOTES: string[] = [
  'Arreglo: el dictado por voz en Android ya no repite palabras ("gasté gasté gasté…")',
  'Nuevo: dicta tu mercado 🎤 — toca "Dictar" y di "dos libras de arroz, leche y huevos": la app los agrega solita',
  'Comprando: di "leche a 4.500" y se tacha de la lista con su precio; lo que no estaba te lo pregunta como antojo',
  'Dicta tus gastos desde el botón +: "gasté 25 mil en almuerzo" y solo revisas y guardas',
  'Nuevo: ¿dónde estás comprando? Elige la tienda (D1, Ara, Éxito, la plaza…) y compara precios entre tiendas',
  'En Precios → "Por tienda" ves dónde te sale más barato cada producto y cuánto te ahorras',
  'Tu voz no se graba ni se guarda: la convierte en texto el servicio de voz de tu celular',
]
