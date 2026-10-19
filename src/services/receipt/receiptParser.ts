/**
 * ════════════════════════════════════════════════════════════════════
 * 🧾 ENTENDER UNA FACTURA (a partir del texto que leyó el OCR)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: del texto de la foto saca SOLO lo importante:
 *   • Comercio (reconoce cadenas como D1, Ara, Éxito, Olímpica… o toma el encabezado)
 *   • Fecha (2026/10/11, 11/10/2026, 11-oct-2026…; prefiere la línea "Fecha"/"Generación")
 *   • Productos: nombre, cantidad, valor unitario y valor total de la línea
 *   • Total (votando entre TOTAL, VALOR PAGADO, TARJETA… y la suma de productos)
 *   • Medio de pago (tarjeta débito/crédito, efectivo, Nequi, Daviplata, transferencia…)
 * Cómo se defiende de errores del OCR:
 *   • Solo busca productos ENTRE el encabezado de la tabla y la palabra TOTAL
 *     (lo de abajo —impuestos, CUFE, resolución, cajero— se ignora).
 *   • Revisa que cantidad × valor unitario = valor de la línea (y corrige "TUN" → 1 UN, "AUN" → 4 UN).
 *   • Si un total quedó con un dígito mal leído (547740 / 94,740) y la suma de productos
 *     da 54.740, se queda con el que cuadra.
 * Todas las facturas son distintas: por eso hay varias formas de leer los productos
 * (con código de barras en medio, "2 X 3.200" en otra línea, peso en kg…).
 * Todo pasa dentro del celular. Si lo cambias: prueba con facturas reales.
 * ════════════════════════════════════════════════════════════════════
 */

export interface ReceiptItem { name: string; quantity: number; unitPrice: number; price: number; unit?: string }
export interface ParsedReceipt {
  store: string;
  date: string;              // AAAA-MM-DD ('' si no se encontró)
  total: number;
  subtotal?: number;
  payment: string;           // '' si no se encontró
  items: ReceiptItem[];
  itemsSum: number;
  /** ¿La suma de productos cuadra con el total? */
  sumMatches: boolean;
  rawText: string;
}

// ═══ SECCIÓN: Utilidades ═══
const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s(/-])\p{L}/gu, c => c.toUpperCase());

/** Distancia entre dos números como texto (cuántos dígitos cambian/sobran). Sirve para errores del OCR. */
const digitDistance = (a: number, b: number) => {
  const x = String(a), y = String(b);
  const d: number[][] = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return d[x.length][y.length];
};

/** "$ 12.900", "12,900", "12 900", "12.900,00", "4500" → 12900 / 4500 (pesos enteros). */
export const parsePrice = (raw: string): number => {
  let s = raw.replace(/[^\d.,\s]/g, '').trim();
  if (!s) return 0;
  const cents = s.match(/^(.*\d)[.,]\d{2}$/);
  if (cents && /[.,\s]/.test(cents[1])) s = cents[1];
  s = s.replace(/[.,\s]/g, '');
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

/** Valores de dinero dentro de una línea (sin confundir códigos de barras ni fechas). */
const MONEY = /(?<![\d.,])\$?\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{1,3} \d{3}(?![\d.,])|\d{3,7})(?![\d.,]*\d{2,})(?!\s?(?:gr?|ml|cc|g\b|kg|lb|und?\b|%))/gi;
const moneyIn = (line: string) => [...line.matchAll(MONEY)]
  .map(m => ({ value: parsePrice(m[1]), index: m.index ?? 0, raw: m[0] }))
  .filter(v => v.value >= 50 && v.value < 100_000_000);

// ═══ SECCIÓN: Comercio ═══
/** Cadenas conocidas en Colombia: texto que aparece en la factura → nombre bonito. */
const CHAINS: [RegExp, string][] = [
  [/\bd[1il|]\s*s\.?\s?a\.?\s?s\b|\btiendas?\s*d1\b|\bkoba\s*colombia|900\.?276\.?962/, 'D1'],
  [/jer[o0]nimo\s*martins|\btiendas?\s*ara\b|\bara\b.*colombia|900\.?480\.?569/, 'Ara'],
  [/almacenes\s*[e3]xito|\bexito\b|890\.?900\.?608/, 'Éxito'],
  [/\bcarulla\b/, 'Carulla'],
  [/\bsurtimax\b/, 'Surtimax'],
  [/super\s*inter\b/, 'Super Inter'],
  [/\bolimpica\b|supertiendas\s*y\s*droguerias|890\.?107\.?487/, 'Olímpica'],
  [/\bjumbo\b|cencosud/, 'Jumbo'],
  [/\bmetro\b.*cencosud|\btiendas\s*metro\b/, 'Metro'],
  [/\bmakro\b/, 'Makro'],
  [/price\s*smart/, 'PriceSmart'],
  [/\balkosto\b|colombiana\s*de\s*comercio/, 'Alkosto'],
  [/\bisimo\b/, 'Isimo'],
  [/\bcolsubsidio\b/, 'Colsubsidio'],
  [/\bcafam\b/, 'Cafam'],
  [/\bfarmatodo\b/, 'Farmatodo'],
  [/cruz\s*verde/, 'Cruz Verde'],
  [/drogas?\s*la\s*rebaja|la\s*rebaja/, 'La Rebaja'],
  [/\bzapatoca\b/, 'Zapatoca'],
  [/\bmercaldas\b/, 'Mercaldas'],
  [/\beuro\s*supermercados?\b|\bsupermercados?\s*euro\b/, 'Euro'],
  [/home\s*center|sodimac/, 'Homecenter'],
  [/\bfalabella\b/, 'Falabella'],
  [/dollar\s*city|dollarcity/, 'Dollarcity'],
  [/\bjusto\s*(?:y|&)\s*bueno\b/, 'Justo & Bueno'],
];

const LEGAL = /\b(s\.?\s?a\.?\s?s\.?|s\.?\s?a\.?|ltda\.?|e\.?\s?u\.?|s\.?\s?en\s?c\.?)$/i;

function findStore(lines: string[]): string {
  const head = plain(lines.slice(0, Math.max(8, Math.ceil(lines.length * 0.35))).join(' \n '));
  for (const [re, name] of CHAINS) if (re.test(head)) return name;
  // Encabezado: primera línea con letras de verdad que no sea NIT, dirección, teléfono…
  for (const l of lines.slice(0, 8)) {
    const clean = l.replace(/\b(nit|n\.i\.t)\b.*$/i, '').replace(/[^\p{L}\p{N}\s&.'-]/gu, ' ').replace(/\s+/g, ' ').trim();
    const letters = (clean.match(/\p{L}/gu) || []).length;
    if (letters < 3 || letters / Math.max(1, clean.replace(/\s/g, '').length) < 0.6) continue;
    if (/\b(factura|fecha|cliente|direcci|tel|resoluci|regimen|responsable|contribuyente|retenedor|iva)\b/i.test(plain(clean))) continue;
    return titleCase(clean.replace(LEGAL, '').trim()).slice(0, 40);
  }
  return '';
}

// ═══ SECCIÓN: Fecha ═══
const MONTHS: Record<string, number> = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
const validDate = (y: number, m: number, d: number) => {
  if (y < 2015 || y > new Date().getFullYear() + 1 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};
function dateIn(line: string): string {
  const l = plain(line);
  let m = l.match(/(20\d{2})\s?[/\-.]\s?(\d{1,2})\s?[/\-.]\s?(\d{1,2})(?!\d)/);         // 2026/10/11
  if (m) { const r = validDate(+m[1], +m[2], +m[3]); if (r) return r; }
  m = l.match(/(?<!\d)(\d{1,2})\s?[/\-.]\s?(\d{1,2})\s?[/\-.]\s?(20\d{2}|\d{2})(?!\d)/);  // 11/10/2026 · 11-10-26
  if (m) { const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]; const r = validDate(y, +m[2], +m[1]); if (r) return r; }
  m = l.match(/(?<!\d)(\d{1,2})[\s/\-.]*(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*[\s/\-.,]*(20\d{2})/);
  if (m) { const r = validDate(+m[3], MONTHS[m[2]], +m[1]); if (r) return r; }
  return '';
}
function findDate(lines: string[]): string {
  const preferred = lines.filter(l => /fecha|generaci|expedici|emisi|validaci|date/i.test(plain(l)));
  for (const l of [...preferred, ...lines]) { const d = dateIn(l); if (d) return d; }
  return '';
}

// ═══ SECCIÓN: Medio de pago ═══
function findPayment(text: string): string {
  const t = plain(text);
  if (/\bnequi\b/.test(t)) return 'Nequi';
  if (/daviplata/.test(t)) return 'Daviplata';
  if (/\bbre-?\s?b\b|llave\s*bre/.test(t)) return 'Bre-B';
  if (/\bpse\b|transferencia/.test(t)) return 'Transferencia';
  if (/\bqr\b.*(pago|bancolombia)|pago\s*qr|codigo\s*qr\s*bancolombia/.test(t)) return 'QR';
  const cre = /\b(credito|cred)\b|tarj(?:eta)?\s*cr[eé]d/.test(t), deb = /\b(debito|deb)\b|tarj(?:eta)?\s*d[eé]b/.test(t);
  if (/cre\s*\/\s*deb|deb\s*\/\s*cre/.test(t) || (cre && deb)) return 'Tarjeta';
  if (/\btarj|datafono|visa|mastercard|master\s*card|redeban|credibanco|\bamex\b/.test(t)) return cre ? 'Tarjeta crédito' : deb ? 'Tarjeta débito' : 'Tarjeta';
  if (cre) return 'Tarjeta crédito';
  if (deb) return 'Tarjeta débito';
  if (/\befectivo\b/.test(t)) return 'Efectivo';
  return '';
}

// ═══ SECCIÓN: Productos ═══
/** Líneas que nunca son productos. */
const NOT_PRODUCT = /\b(nit|factura|resoluci|dian|cufe|cude|autoriza|prefijo|vigencia|consecutivo|cajer|caja\b|turno|atendido|vendedor|telefono|tel\b|direcci|cliente|c\.?c\b|regimen|contribuyente|retenedor|subtotal|sub total|total|iva\b|impuesto|base\b|excluido|exento|gravado|efectivo|cambio|devuelta|vueltas|pago|tarj|debito|credito|recibo|rrn|apro|aprob|valor pagado|propina|gracias|vuelva|sistema pos|facturador|software|art\.? entregados|items?\b|unidades\b|transac|trx|codigo qr|www\.|\.com)\b/;
/** Encabezado de la tabla de productos. */
const HEADER = /\b(descrip|articulo|producto|detalle|cant|can\b|vr\.?\s*unit|valor\s*u|precio|codigo|plu)\b/g;
/** Dónde terminan los productos. */
const END = /^\W*(sub\s*-?\s*total|total\b|valor\s+total|total\s+a\s+pagar|neto\s+a\s+pagar|forma\s+de\s+pago|medio\s+de\s+pago|total\s+items|nro\.?\s*items|resumen\s+de\s+impuestos)/;

/** El OCR confunde letras con números en la cantidad: "TUN" → 1 UN, "AUN" → 4 UN. */
const OCR_DIGIT: Record<string, string> = { t: '1', i: '1', l: '1', '|': '1', '!': '1', a: '4', s: '5', o: '0', b: '8', z: '2', g: '6', q: '9' };
const fixDigit = (c: string) => (/\d/.test(c) ? c : OCR_DIGIT[c.toLowerCase()] ?? '');

const cleanName = (s: string) => s
  .replace(/\b\d{6,14}\b/g, ' ')                      // códigos de barras
  .replace(/^\s*\d{1,3}\s+(?=\p{L})/u, '')           // número de ítem al inicio
  .replace(/[^\p{L}\p{N}\s.%/&-]/gu, ' ')
  .replace(/\s[-—–]+\s/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/[\s.\-/]+$/, '')
  .trim();

interface RawItem extends ReceiptItem { line: number }

/**
 * Formato con código de barras en medio (D1, Ara, Isimo, muchas POS):
 *   "2  4 UN  3,090  7700304687862  LECHE ENTERA  12,360  5"
 *   [#ítem] [cant][UN|KG] [valor unitario] CÓDIGO NOMBRE [valor total] [id impuesto]
 */
function parseBarcodeLine(line: string): Omit<ReceiptItem, 'unit'> & { unit?: string } | null {
  const bc = line.match(/(?<!\d)(\d{7,14})(?!\d)/);
  if (!bc || bc.index === undefined) return null;
  const before = line.slice(0, bc.index), after = line.slice(bc.index + bc[1].length);
  const afterMoney = moneyIn(after);
  if (!afterMoney.length) return null;
  // Antes del código: [#] cant UN valorU
  const beforeMoney = moneyIn(before);
  let unitPrice = beforeMoney.length ? beforeMoney[beforeMoney.length - 1].value : 0;
  // Valor total de la línea: el que cuadra con el unitario (cant × unitario); si no, el primero
  // después del nombre (lo que sigue suele ser el id de impuesto o basura del fondo de la foto).
  const fits = (v: number) => unitPrice > 0 && Array.from({ length: 30 }, (_, k) => (k + 1) * unitPrice).some(e => e === v || digitDistance(e, v) <= 1);
  const last = afterMoney.find(m => fits(m.value)) ?? afterMoney[0];
  // Nombre: entre el código y el valor total
  const name = cleanName(after.slice(0, last.index));
  if ((name.match(/\p{L}/gu) || []).length < 3) return null;
  let price = last.value;
  let quantity = 1, unit: string | undefined;
  const q = before.match(/(?:^|\s)([0-9tilasobzgq|!]{1,3}(?:[.,]\d{1,3})?)\s?(un|und|unid|kg|kl|lb|gr|lt|pq|paq)\b/i);
  if (q) {
    const digits = q[1].split('').map(c => (/[.,]/.test(c) ? '.' : fixDigit(c))).join('');
    const n = parseFloat(digits);
    if (n > 0 && n < 1000) quantity = n;
    unit = q[2].toLowerCase().startsWith('k') ? 'kg' : q[2].toLowerCase().startsWith('l') ? (q[2].toLowerCase() === 'lb' ? 'lb' : 'l') : 'und';
  }
  // Cuadre: cantidad × unitario = total (el OCR a veces cambia un dígito)
  if (unitPrice && price) {
    const ratio = price / unitPrice;
    if (Math.abs(ratio - Math.round(ratio)) < 0.001 && Math.round(ratio) >= 1 && Math.round(ratio) <= 99 && (!q || Math.round(ratio) !== quantity) && unit !== 'kg') quantity = Math.round(ratio);
    const expected = Math.round(quantity * unitPrice);
    if (expected !== price && digitDistance(expected, price) <= 1) price = expected;                 // total mal leído
    else if (expected !== price && quantity === 1 && digitDistance(unitPrice, price) <= 1) unitPrice = price; // unitario mal leído
  }
  if (!unitPrice) unitPrice = Math.round(price / quantity);
  return { name, quantity, unitPrice, price, unit };
}

/** "2 X 3.200   6.400" · "0.565 KG X 9.990" · "3 UN x $ 2.500 = 7.500" */
const QTY_LINE = /(\d+(?:[.,]\d{1,3})?)\s*(un|und|unid|kg|kl|lb|gr)?\s*[xX*]\s*\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d{3,7})/i;

function parseItems(lines: string[], start: number, end: number): RawItem[] {
  const out: RawItem[] = [];
  let pendingName: { name: string; line: number } | null = null;
  for (let i = start; i < end; i++) {
    const line = lines[i];
    const p = plain(line);
    if (NOT_PRODUCT.test(p) && !/\b\d{7,14}\b/.test(line)) { pendingName = null; continue; }

    // 1) Código de barras en medio
    const bc = parseBarcodeLine(line);
    if (bc) { out.push({ ...bc, name: titleCase(bc.name).slice(0, 48), line: i }); pendingName = null; continue; }

    const money = moneyIn(line);
    const qty = line.match(QTY_LINE);

    // 2) Línea "cantidad x unitario [total]" que completa el nombre de la línea anterior (o de esta)
    if (qty) {
      const quantity = parseFloat(qty[1].replace(',', '.')) || 1;
      const unitPrice = parsePrice(qty[3]);
      const lineTotal = money.length ? money[money.length - 1].value : 0;
      const price = lineTotal && Math.abs(lineTotal - quantity * unitPrice) <= Math.max(50, lineTotal * 0.02) ? lineTotal : Math.round(quantity * unitPrice);
      const ownName = cleanName(line.slice(0, qty.index).replace(/\b\d+(?:[.,]\d+)?\s*$/, ''));
      const name = (ownName.match(/\p{L}/gu) || []).length >= 3 ? ownName : pendingName?.name;
      if (name) {
        // Si la línea anterior ya había quedado como producto con su total, se reemplaza
        const prev = out[out.length - 1];
        if (prev && pendingName && prev.line === pendingName.line) out.pop();
        out.push({ name: titleCase(name).slice(0, 48), quantity, unitPrice, price, unit: qty[2] ? (qty[2].toLowerCase().startsWith('k') ? 'kg' : 'und') : undefined, line: i });
        pendingName = null;
        continue;
      }
    }

    // 3) Nombre + valor al final: "ARROZ DIANA 500G   3.200"
    const name = cleanName(money.length ? line.slice(0, money[money.length - 1].index) : line);
    const letters = (name.match(/\p{L}/gu) || []).length;
    if (money.length && letters >= 3) {
      const price = money[money.length - 1].value;
      out.push({ name: titleCase(name).slice(0, 48), quantity: 1, unitPrice: price, price, line: i });
      pendingName = { name, line: i };
      continue;
    }
    // 4) Solo nombre: puede que la cantidad y el precio vengan en la línea siguiente
    pendingName = letters >= 3 && letters / Math.max(1, name.replace(/\s/g, '').length) > 0.6 ? { name, line: i } : null;
  }

  // Descuentos: "DESCUENTO -1.000" / "AHORRO 1.000" quedan como valor negativo
  for (const it of out) if (/descuento|dcto|ahorro|promo/i.test(plain(it.name))) { it.price = -Math.abs(it.price); it.unitPrice = it.price; it.quantity = 1; }
  return out.filter(it => it.price !== 0);
}

// ═══ SECCIÓN: Total ═══
function findTotals(lines: string[]) {
  const candidates: { value: number; weight: number }[] = [];
  let subtotal: number | undefined;
  for (const line of lines) {
    const p = plain(line);
    const money = moneyIn(line);
    if (!money.length) continue;
    const v = money[money.length - 1].value;
    if (/sub\s*-?\s*total/.test(p)) { subtotal = subtotal ?? v; continue; }
    if (/\b(cambio|devuelta|vueltas|efectivo\s*recibido|recibido|base|iva|impuesto|ahorro|descuento|propina)\b/.test(p)) continue;
    if (/total\s*a\s*pagar|neto\s*a\s*pagar|valor\s*total|total\s*factura|total\s*venta/.test(p)) candidates.push({ value: v, weight: 3 });
    else if (/^\W*total\b/.test(p) && !/total\s*(items|art|unid|base|iva)/.test(p)) candidates.push({ value: v, weight: 3 });
    else if (/valor\s*pagado|pagado|tarj|debito|credito|nequi|daviplata|datafono|transferencia/.test(p)) candidates.push({ value: v, weight: 2 });
  }
  return { candidates, subtotal };
}

function chooseTotal(candidates: { value: number; weight: number }[], itemsSum: number): number {
  if (itemsSum > 0) {
    // Si la suma de productos coincide (o casi, por un dígito mal leído) con algún total, es ese.
    if (candidates.some(c => c.value === itemsSum || digitDistance(c.value, itemsSum) <= 1)) return itemsSum;
  }
  if (!candidates.length) return itemsSum;
  // Votación: el valor que más se repite (TOTAL pesa más que PAGADO/TARJETA).
  const score = new Map<number, number>();
  for (const c of candidates) score.set(c.value, (score.get(c.value) ?? 0) + c.weight);
  // Dos lecturas que difieren en un dígito se apoyan entre sí
  for (const a of candidates) for (const b of candidates) if (a !== b && a.value !== b.value && digitDistance(a.value, b.value) <= 1) score.set(a.value, (score.get(a.value) ?? 0) + 0.5);
  return [...score.entries()].sort((x, y) => y[1] - x[1] || y[0] - x[0])[0][0];
}

// ═══ SECCIÓN: Todo junto ═══
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 1);
  const store = findStore(lines);
  const date = findDate(lines);
  const payment = findPayment(text);

  // Zona de productos: después del encabezado de la tabla (o de la fecha) y antes de TOTAL
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const hits = (plain(lines[i]).match(HEADER) || []).length;
    if (hits >= 2) { start = i + 1; break; }
  }
  if (!start) {
    const dateLine = lines.findIndex(l => !!dateIn(l));
    if (dateLine >= 0 && dateLine < lines.length * 0.5) start = dateLine + 1;
  }
  let end = lines.findIndex((l, i) => i >= start && END.test(plain(l)));
  if (end < 0) end = lines.length;

  let items: ReceiptItem[] = parseItems(lines, start, end).map(({ line: _line, ...it }) => it);
  // Si no hubo zona clara y salieron demasiadas cosas raras, intenta en todo el texto solo con códigos de barras
  if (!items.length) items = parseItems(lines, 0, lines.length).map(({ line: _line, ...it }) => it);

  const itemsSum = items.reduce((a, i) => a + i.price, 0);
  const { candidates, subtotal } = findTotals(lines.slice(Math.max(0, end - 1)));
  const total = chooseTotal(candidates, itemsSum);

  return {
    store, date, payment, total, subtotal, items: items.slice(0, 80), itemsSum,
    sumMatches: items.length > 0 && Math.abs(itemsSum - total) <= 1,
    rawText: text,
  };
}
