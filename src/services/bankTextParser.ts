/**
 * ════════════════════════════════════════════════════════════════════
 * 🏦 LECTOR DE NOTIFICACIONES DEL BANCO
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Entiende mensajes de Bancolombia, Nequi, Daviplata, Bre-B, TC/TD: valor, comercio, fecha y medio de pago.
 * Dónde se ve: Registrar desde notificación / comprobante.
 * Si lo cambias: Prueba con mensajes reales después de cambiarlo.
 * ════════════════════════════════════════════════════════════════════
 */
import { guessCategory } from '../utils/categories';
import { parsePrice } from './ocrService';

// Convierte el texto de una notificación, SMS o correo del banco (o un comprobante
// leído con el escáner) en un movimiento listo para confirmar. Todo pasa en el celular.

export type PayMethod = 'TC' | 'TD' | 'Bre-B' | 'Nequi' | 'Daviplata' | 'Transferencia' | 'Efectivo' | null;

export interface ParsedMovement {
  type: 'expense' | 'income';
  amount: number;
  merchant: string;
  date: string;          // AAAA-MM-DD
  method: PayMethod;
  last4: string | null;
  category: string;
  confidence: 'alta' | 'media' | 'baja';
}

const AMOUNT_RE = /(?:\$|COP|cop)\s*([\d.,]+)|([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?)\s*(?:pesos|COP)?/;
const INCOME_RE = /\b(recib\w*|te (?:envi|consign|transfiri)\w*|le (?:consign|abon)\w*|consignaci[oó]n|abono|abonaron|ingreso|n[oó]mina|deposit\w*|te lleg[oó]|reembolso|devoluci[oó]n)\b/i;
const EXPENSE_RE = /\b(compra|pag(?:o|aste|ó)|retiro|retiraste|transferiste|enviaste|env[ií]o|d[eé]bito|cargo|avance)\b/i;

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const detectMethod = (t: string): PayMethod => {
  if (/bre[\s-]?b|\bllave\b|@\w+/i.test(t)) return 'Bre-B';
  if (/nequi/i.test(t)) return 'Nequi';
  if (/daviplata/i.test(t)) return 'Daviplata';
  if (/t\.?\s?cred|tarj(?:eta)?\.?\s*(?:de\s*)?cr[eé]d|\bTC\b|visa|mastercard|amex/i.test(t)) return 'TC';
  if (/t\.?\s?deb|tarj(?:eta)?\.?\s*(?:de\s*)?d[eé]b|\bTD\b|cuenta de ahorros|cta\.? ahorros|ahorros/i.test(t)) return 'TD';
  if (/transfer/i.test(t)) return 'Transferencia';
  if (/retiro|cajero/i.test(t)) return 'Efectivo';
  return null;
};

const detectDate = (t: string): string | null => {
  const m = t.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    const mm = +m[2], dd = +m[1];
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) return `${y}-${pad(mm)}-${pad(dd)}`;
  }
  if (/\bayer\b/i.test(t)) { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  return null;
};

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/^[\s:,.-]+|[\s:,.-]+$/g, '').trim();
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\p{L}/gu, c => c.toUpperCase());

const detectMerchant = (t: string, income: boolean): string => {
  const handle = t.match(/@[\w.]+\w/);
  if (handle && !income) return handle[0];
  const stop = '(?=\\s+(?:el|en|a las|hora|con|desde|por|fecha|\\d{1,2}[:/])|[.,;\\n]|$)';
  const pats = income
    ? [new RegExp(`\\bde\\s+(?:parte de\\s+)?([\\p{L}\\p{N}&@*' .-]{3,40}?)${stop}`, 'iu')]
    : [
      new RegExp(`\\ben\\s+([\\p{L}\\p{N}&*' .-]{3,40}?)${stop}`, 'iu'),
      new RegExp(`\\ba\\s+(?:la llave\\s+|la cuenta\\s+)?([\\p{L}\\p{N}&@*' .-]{3,40}?)${stop}`, 'iu'),
    ];
  for (const re of pats) {
    const m = t.match(re);
    if (m && /\p{L}/u.test(m[1]) && !/^(tu|su|la|el)\s*$/i.test(m[1])) return titleCase(clean(m[1])).slice(0, 40);
  }
  return '';
};

export const parseBankText = (raw: string): ParsedMovement | null => {
  const t = raw.replace(/ /g, ' ');
  const am = t.match(AMOUNT_RE);
  if (!am) return null;
  const amount = parsePrice(am[1] || am[2] || '');
  if (!amount || amount < 100) return null;

  const isIncome = INCOME_RE.test(t) && !/\b(compra|pagaste|transferiste|enviaste|retiro)\b/i.test(t);
  const type: ParsedMovement['type'] = isIncome ? 'income' : 'expense';
  const merchant = detectMerchant(t, isIncome);
  const method = detectMethod(t);
  const last4 = t.match(/(?:\*|x{2,}|terminad[ao] en\s*)(\d{4})\b/i)?.[1] ?? null;
  const date = detectDate(t) ?? todayISO();
  const category = isIncome
    ? (/n[oó]mina|sueldo|salario|quincena/i.test(t) ? 'Sueldo' : guessCategory(merchant || t, 'income') ?? 'Otros ingresos')
    : (guessCategory(merchant || t, 'expense') ?? (method === 'Efectivo' ? 'Otros' : 'Otros'));

  const signals = [EXPENSE_RE.test(t) || isIncome, !!merchant, !!method].filter(Boolean).length;
  return { type, amount, merchant, date, method, last4, category, confidence: signals >= 3 ? 'alta' : signals === 2 ? 'media' : 'baja' };
};

export const describeMethod = (m: PayMethod, last4: string | null) =>
  m ? `${m === 'TC' ? 'Tarjeta de crédito' : m === 'TD' ? 'Tarjeta débito' : m}${last4 ? ` *${last4}` : ''}` : '';
