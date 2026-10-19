/**
 * ════════════════════════════════════════════════════════════════════
 * 🏷️ VERSIÓN DE LA APP Y NOVEDADES
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: aviso "Hay una actualización" y ventana de Novedades; Ajustes → Acerca de.
 * Al publicar una versión nueva: sube APP_VERSION y cambia la lista de novedades.
 * ════════════════════════════════════════════════════════════════════
 */
export const APP_VERSION = '1.12.0';

export const RELEASE_NOTES: string[] = [
  'Nuevo: el escáner de facturas ahora entiende la factura: comercio, fecha, medio de pago, productos y total',
  'Cada producto con su cantidad × valor de cada uno = valor de la línea (ej: 4 leches × $3.090 = $12.360)',
  'Ya no toma impuestos, CUFE, cajero ni resolución como si fueran productos',
  'Te dice si "todo cuadra" (la suma de productos = el total) y puedes ver la foto en grande para comparar',
  'Los precios de la factura pasan a Mercado para comparar entre tiendas',
]
