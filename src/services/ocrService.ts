/**
 * ════════════════════════════════════════════════════════════════════
 * 🔍 LECTURA DE FACTURAS (OCR)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Lee el texto de la foto dentro del celular (tesseract alojado en /public/ocr) y saca productos y total.
 * Dónde se ve: Escáner y comprobantes.
 * Si lo cambias: No cambies las rutas /ocr/… o el escáner deja de funcionar.
 * ════════════════════════════════════════════════════════════════════
 */
import Tesseract from 'tesseract.js';

// Lector de facturas: todo se procesa en el celular (Tesseract en el navegador).
// La foto nunca se guarda ni se envía a un servidor propio.

export interface ScannedItem { name: string; price: number; quantity: number; }
export interface ScannedReceipt { store: string; date: string; total: number; items: ScannedItem[]; rawText: string; }

/** Achica y pasa a escala de grises la foto para que la lectura sea más rápida y precisa. */
const prepareImage = (file: File): Promise<Blob | File> => new Promise(resolve => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
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
  const { data } = await Tesseract.recognize(image, 'spa', {
    // El lector vive en el mismo servidor de la app: no se usa ningún servicio externo.
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    logger: (m: { status: string; progress: number }) => {
      if (!onProgress) return;
      if (m.status === 'recognizing text') onProgress(30 + Math.round(m.progress * 68), 'Leyendo productos y precios');
      else if (m.status.includes('loading')) onProgress(5 + Math.round(m.progress * 20), 'Cargando el lector (solo la primera vez)');
      else onProgress(28, 'Analizando la factura');
    },
  });
  onProgress?.(100, 'Listo');
  return parseReceiptText(data.text);
};

// ───────────── Lectura del texto ─────────────

/** Convierte "$ 12.900", "12,900", "12.900,00" o "4500" a número en pesos. */
export const parsePrice = (raw: string): number => {
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return 0;
  // Centavos al final ("12.900,00" o "12,900.00"): se quitan; en Colombia los precios van en pesos enteros.
  const cents = s.match(/^(.*\d)[.,]\d{2}$/);
  if (cents && /[.,]/.test(cents[1])) s = cents[1];
  s = s.replace(/[.,]/g, '');
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

const PRICE_RE = /\$?\s*(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{3,7})(?!\d)/g;
const NOT_PRODUCT = /\b(nit|factura|caja|cajer|turno|tel[eé]fono|direcci[oó]n|gracias|vuelva|subtotal|sub total|iva|impuesto|efectivo|cambio|devuelta|vueltas|pago|tarjeta|d[eé]bito|cr[eé]dito|recibido|valor|cantidad|precio|resoluci[oó]n|dian|autoriza|fecha|hora|cliente|c\.?c\.?|consecutivo|propina|descuento|ahorro|art[ií]culos|items?)\b/i;
const TOTAL_RE = /\b(total\s*a\s*pagar|valor\s*total|total\s*venta|total)\b/i;
const DATE_RE = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/;

const cleanName = (s: string) => s
  .replace(/(\s+\$?\s*\d[\d.,]*){1,2}\s*$/, ' ') // precio(s) al final de la línea
  .replace(/^\s*\d{4,}\s+/, '')           // códigos de barras al inicio
  .replace(/\b\d+\s*[xX]\s*\d*/g, ' ')
  .replace(/[^\p{L}\p{N}\s.%/-]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\p{L}/gu, c => c.toUpperCase());

export const parseReceiptText = (text: string): ScannedReceipt => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items: ScannedItem[] = [];
  let store = '';
  let date = '';
  let total = 0;
  let maxSeen = 0;

  for (const line of lines.slice(0, 6)) {
    const letters = (line.match(/\p{L}/gu) || []).length;
    if (!store && letters >= 4 && letters / line.length > 0.5 && !NOT_PRODUCT.test(line)) { store = titleCase(line.replace(/[^\p{L}\p{N}\s&.-]/gu, '').trim()); }
  }

  for (const line of lines) {
    const d = line.match(DATE_RE);
    if (d && !date) {
      const y = d[3].length === 2 ? `20${d[3]}` : d[3];
      const dd = d[1].padStart(2, '0'), mm = d[2].padStart(2, '0');
      if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) date = `${y}-${mm}-${dd}`;
    }
    const prices = [...line.matchAll(PRICE_RE)].map(m => parsePrice(m[1])).filter(p => p >= 100 && p < 50_000_000);
    if (!prices.length) continue;
    const linePrice = prices[prices.length - 1];
    maxSeen = Math.max(maxSeen, linePrice);

    if (TOTAL_RE.test(line) && !/sub\s*total/i.test(line)) { total = Math.max(total, linePrice); continue; }
    if (NOT_PRODUCT.test(line)) continue;
    const name = cleanName(line);
    if ((name.match(/\p{L}/gu) || []).length < 3) continue;
    const qty = line.match(/\b(\d{1,2})\s*[xX]\b/);
    items.push({ name: titleCase(name).slice(0, 40), price: linePrice, quantity: qty ? Math.max(1, +qty[1]) : 1 });
  }

  const itemsSum = items.reduce((a, i) => a + i.price, 0);
  if (!total) total = maxSeen > itemsSum * 0.8 ? maxSeen : itemsSum;

  return { store: store || 'Factura', date, total, items: items.slice(0, 60), rawText: text };
};
