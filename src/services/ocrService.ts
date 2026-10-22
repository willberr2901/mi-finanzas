/**
 * ════════════════════════════════════════════════════════════════════
 * 🔍 LECTURA DE FACTURAS (OCR)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Lee el texto de la foto dentro del celular (tesseract alojado en /public/ocr).
 *           Lo que significa cada línea (comercio, productos, total, pago) lo decide
 *           services/receipt/receiptParser.ts.
 * Dónde se ve: Escáner y comprobantes.
 * Si lo cambias: No cambies las rutas /ocr/… o el escáner deja de funcionar.
 * ════════════════════════════════════════════════════════════════════
 */

// Lector de facturas: todo se procesa en el celular (Tesseract en el navegador).
// La foto nunca se guarda ni se envía a un servidor propio.

import { parseReceiptText, type ParsedReceipt, type ReceiptItem } from './receipt/receiptParser';
export { parseReceiptText, parsePrice } from './receipt/receiptParser';

/** Un producto leído: price = valor total de la línea (cantidad × unitario). */
export type ScannedItem = ReceiptItem;
export type ScannedReceipt = ParsedReceipt;

/** Achica y pasa a escala de grises la foto para que la lectura sea más rápida y precisa. */
const prepareImage = (file: File): Promise<Blob | File> => new Promise(resolve => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      // Ni muy grande (lento) ni muy pequeña (letras ilegibles)
      const maxW = 2000, minW = 1100;
      const scale = img.width > maxW ? maxW / img.width : img.width < minW ? minW / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return resolve(file); }
      ctx.filter = 'grayscale(1) contrast(1.35)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => { URL.revokeObjectURL(url); resolve(b || file); }, 'image/png');
    } catch { URL.revokeObjectURL(url); resolve(file); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
  img.src = url;
});

export const scanReceipt = async (file: File, onProgress?: (pct: number, stage: string) => void): Promise<ScannedReceipt> => {
  onProgress?.(3, 'Preparando la foto');
  const image = await prepareImage(file);
  // El lector vive en el mismo servidor de la app: no se usa ningún servicio externo.
  // Se carga solo cuando se escanea una factura (no pesa en el arranque de la app)
  const { default: Tesseract } = await import('tesseract.js');
  const worker = await Tesseract.createWorker('spa', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    logger: (m: { status: string; progress: number }) => {
      if (!onProgress) return;
      if (m.status === 'recognizing text') onProgress(30 + Math.round(m.progress * 66), 'Leyendo productos y precios');
      else if (m.status.includes('loading')) onProgress(5 + Math.round(m.progress * 20), 'Cargando el lector (solo la primera vez)');
      else onProgress(28, 'Analizando la factura');
    },
  });
  try {
    // Conserva los espacios entre columnas (cantidad · código · producto · valor).
    await worker.setParameters({ preserve_interword_spaces: '1' } as Record<string, string>);
    const { data } = await worker.recognize(image);
    onProgress?.(98, 'Ordenando los datos');
    const r = parseReceiptText(data.text);
    onProgress?.(100, 'Listo');
    return r;
  } finally {
    worker.terminate().catch(() => {});
  }
};
