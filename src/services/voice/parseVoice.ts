/**
 * ════════════════════════════════════════════════════════════════════
 * 🗣️ ENTENDER LO QUE SE DICTA (sin internet, dentro del celular)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: convierte una frase dictada en datos de la app.
 *   parseMarket("dos libras de arroz, una leche a 4.500 y media de queso")
 *     → [{ arroz, 2 lb }, { leche, 1 und, $4.500 }, { queso, 0,5 lb }]
 *   parseMovement("gasté 25 mil en almuerzo")
 *     → { gasto, $25.000, "Almuerzo" }
 * Entiende números en cifras ("25.000", "25 mil") y en palabras
 * ("veinticinco mil", "un millón doscientos mil", "media libra").
 * Privacidad: todo esto pasa dentro de la app; no se envía a ningún lado.
 * Si lo cambias: prueba con frases reales y revisa VoiceSheet.tsx.
 * ════════════════════════════════════════════════════════════════════
 */
import type { Unit } from '../market/marketStore';

// ═══ SECCIÓN: Limpieza de texto ═══
/** Minúsculas y sin tildes (conserva la ñ). */
const plain = (s: string) => s.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'ñ');

/** Pone mayúscula inicial: "arroz diana" → "Arroz diana". */
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/** Devuelve las palabras tal como se dictaron (con tildes, ñ y mayúsculas): "cafe" + "…de Café" → "Café". */
const restore = (simple: string, source: string) => {
  if (!simple) return simple;
  const pattern = simple.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/[aeiou]/g, c => `[${c}${'áéíóú'['aeiou'.indexOf(c)]}${'üü'.slice(0, c === 'u' ? 1 : 0)}]`).replace(/n/g, '[nñ]')).join('[\\s]+');
  const found = source.match(new RegExp(`(?<![\\p{L}\\d])${pattern}(?![\\p{L}\\d])`, 'iu'));
  return found ? found[0] : simple;
};

// ═══ SECCIÓN: Números en palabras ═══
const SMALL: Record<string, number> = {
  cero: 0, un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700,
  ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};
const isNumWord = (w: string) => w in SMALL || w === 'mil' || w === 'millon' || w === 'millones' || w === 'y';

/** Convierte una cifra escrita ("25.000", "4,5", "2") en número. */
const digitsToNumber = (raw: string): number | null => {
  let s = raw.replace(/[$\s]/g, '');
  if (!/\d/.test(s)) return null;
  // "25.000" o "1.250.000" → miles con punto; "4,5" → decimal con coma; "25,000" → miles con coma
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
  else s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * Lee un número desde la posición `i` de la lista de palabras.
 * Devuelve el valor y cuántas palabras usó, o null si no empieza un número.
 * Ej: ["cuarenta","y","cinco","mil","pesos"] → { value: 45000, used: 4 }
 */
export function readNumber(words: string[], i: number): { value: number; used: number } | null {
  let total = 0, group = 0, used = 0, any = false;
  for (let j = i; j < words.length; j++) {
    const w = words[j];
    const d = digitsToNumber(w);
    if (d !== null && /^[$\d]/.test(w)) {
      if (any && group > 0 && !/^(mil|millon|millones)$/.test(words[j + 1] ?? '')) break;
      group += d; any = true; used = j - i + 1; continue;
    }
    if (w === 'y') {
      // "cuarenta y cinco" sí; "arroz y leche" no
      if (!any || !(words[j + 1] in SMALL)) break;
      continue;
    }
    if (w in SMALL) { group += SMALL[w]; any = true; used = j - i + 1; continue; }
    if (w === 'mil') { total += (group || 1) * 1000; group = 0; any = true; used = j - i + 1; continue; }
    if (w === 'millon' || w === 'millones') { total += (group || 1) * 1_000_000; group = 0; any = true; used = j - i + 1; continue; }
    break;
  }
  if (!any) return null;
  return { value: total + group, used };
}

/** Busca el primer monto de dinero en una frase (para gastos). */
export function findAmount(words: string[]): { value: number; start: number; used: number } | null {
  let best: { value: number; start: number; used: number } | null = null;
  for (let i = 0; i < words.length; i++) {
    if (!isNumWord(words[i]) && !/^\$?\d/.test(words[i])) continue;
    if (words[i] === 'y') continue;
    const r = readNumber(words, i);
    if (!r) continue;
    let used = r.used;
    if (/^(pesos?|barras?|lucas?)$/.test(words[i + used] ?? '')) {
      // "25 lucas" / "2 barras" = miles en Colombia
      const unit = words[i + used];
      const value = /^(barras?|lucas?)$/.test(unit) && r.value < 1000 ? r.value * 1000 : r.value;
      used++;
      if (!best || value > best.value) best = { value, start: i, used };
      i += used - 1;
      continue;
    }
    if (!best || r.value > best.value) best = { value: r.value, start: i, used };
    i += used - 1;
  }
  return best;
}

// ═══ SECCIÓN: Unidades ═══
const UNIT_WORDS: [RegExp, Unit, number?][] = [
  [/^(libras?|lb|lbs)$/, 'lb'],
  [/^(kilos?|kilogramos?|kg|kgs)$/, 'kg'],
  [/^(litros?|lt|lts|l)$/, 'l'],
  [/^(paquetes?|paq|bolsas?|cajas?|pacas?|sixpack|six)$/, 'paq'],
  [/^(unidades?|und|uds?|tarros?|latas?|botellas?|frascos?|cubetas?|panales?)$/, 'und'],
  [/^(docenas?)$/, 'und', 12],
  [/^(media-docena)$/, 'und', 6],
];
const readUnit = (w: string | undefined): { unit: Unit; mult: number } | null => {
  if (!w) return null;
  for (const [re, unit, mult] of UNIT_WORDS) if (re.test(w)) return { unit, mult: mult ?? 1 };
  return null;
};

// ═══ SECCIÓN: Mercado ═══
export interface VoiceItem { name: string; qty: number; unit: Unit; price?: number; /** true si se dijo cantidad o unidad (dos libras) */ said?: boolean }

/** Palabras de relleno que se quitan al inicio de lo dictado. */
const FILLER = /^(necesito|necesitamos|hace falta|hacen falta|falta|faltan|compra|comprar|compre|traer|trae|agrega|agregar|anota|anotar|pon|poner|añade|añadir|tambien|ademas|y|e|lleve|lleva|llevo|eche|eché|echo|ya|el|la|los|las|un poco de|algo de)\s+/;

/** Separa la frase en productos: por comas, puntos, "y", "también", "luego"… (sin romper "y media" ni "cuarenta y cinco"). */
const splitItems = (text: string) => {
  let t = ` ${plain(text)} `;
  t = t.replace(/\by medio\b/g, ' ymedio ').replace(/\by media\b/g, ' ymedia ');
  // protege "veinte y cinco" / "cuarenta y cinco"
  t = t.replace(/\b(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa) y (un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g, '$1 yy $2');
  const parts = t.split(/,|;|\.(?!\d)|\n|\by\b|\be\b|\btambien\b|\bluego\b|\bademas\b|\bdespues\b|\bmas\b(?= \D)/g);
  return parts.map(p => p.replace(/ yy /g, ' y ').replace(/\bymedio\b/g, 'y medio').replace(/\bymedia\b/g, 'y media').trim()).filter(Boolean);
};

/** Interpreta un pedazo: "dos libras y media de arroz a 3 mil" → { arroz, 2.5 lb, $3.000 }. */
export function parseOneItem(chunk: string, source = chunk): VoiceItem | null {
  let s = plain(chunk).replace(/[¿?¡!"]/g, ' ').replace(/\s+/g, ' ').trim();
  for (let k = 0; k < 4; k++) s = s.replace(FILLER, '');
  s = s.replace(/^media docena\b/, '1 media-docena').replace(/\bmedia docena\b/, 'media-docena');

  // Precio al final: "a 4.500", "en 3 mil", "por 12000", "de a 2 mil", "a 4.500 pesos", "cuesta 5 mil", "vale…"
  let price: number | undefined;
  const pm = s.match(/\b(?:de a|a|en|por|cuesta|costo|vale|valio|lo pague a|me costo|a precio de)\s+((?:\$?[\d.,]+|[a-z]+)(?:\s+(?:[\d.,]+|[a-z]+))*?)\s*(pesos?|barras?|lucas?)?\s*(?:c\/u|cada un[oa]?|la unidad|la libra|el kilo|el litro|el paquete)?$/);
  if (pm) {
    const words = pm[1].split(' ');
    const r = readNumber(words, 0);
    if (r && r.used === words.length && r.value >= 50) {
      price = /^(barras?|lucas?)$/.test(pm[2] ?? '') && r.value < 1000 ? r.value * 1000 : r.value;
      s = s.slice(0, pm.index).trim();
    }
  }

  const words = s.split(' ').filter(Boolean);
  let qty = 1, unit: Unit = 'und', i = 0, said = false;

  // "media libra de…", "medio kilo de…"
  if (words[0] === 'media' || words[0] === 'medio') {
    const u = readUnit(words[1]);
    if (u) { qty = 0.5 * u.mult; unit = u.unit; i = 2; }
    else { qty = 0.5; unit = 'lb'; i = 1; }   // "media de queso" = media libra
  } else {
    const n = readNumber(words, 0);
    if (n && n.value > 0 && n.value < 1000) { qty = n.value; i = n.used; }
    const u = readUnit(words[i]);
    if (u) { qty *= u.mult; unit = u.unit; i++; }
    if (words[i] === 'y' && (words[i + 1] === 'media' || words[i + 1] === 'medio')) { qty += 0.5; i += 2; }
    else if (words[i] === 'y' && words[i + 1] === 'cuarto') { qty += 0.25; i += 2; }
    // "1 libra y media" ya se cubrió; "libra de" sin número = 1 libra
    if (i === 0) { const u2 = readUnit(words[0]); if (u2) { unit = u2.unit; qty = u2.mult; i = 1; } }
  }
  said = i > 0;
  if (words[i] === 'de' || words[i] === 'del') i++;

  let name = words.slice(i).join(' ').replace(/\s+(por favor|porfa|nada mas|y ya)$/, '').trim();
  // "aceite de 1 litro" / "leche de 2 litros" → cantidad y unidad al final
  const tail = i === 0 ? name.match(/^(.+?) de (\S+)(?: (\S+))?$/) : null;
  if (tail) {
    const n = readNumber([tail[2]], 0);
    const u = readUnit(tail[3] ?? tail[2]);
    if (u && (n || !tail[3])) { name = tail[1]; qty = (n?.value ?? 1) * u.mult; unit = u.unit; said = true; }
  }
  if (!name || name.length < 2 || /^\d+$/.test(name)) return null;
  return { name: cap(restore(name, source).trim()), qty: Math.round(qty * 100) / 100, unit, price, said };
}

/** Frase completa → lista de productos. */
export function parseMarket(text: string): VoiceItem[] {
  const out: VoiceItem[] = [];
  for (const chunk of splitItems(text)) {
    const it = parseOneItem(chunk, text);
    if (!it) continue;
    const same = out.find(o => plain(o.name) === plain(it.name) && o.unit === it.unit);
    if (same) { same.qty += it.qty; same.said = true; } else out.push(it);
  }
  return out;
}

// ═══ SECCIÓN: Gastos e ingresos ═══
export interface VoiceMovement { type: 'expense' | 'income'; amount: number; description: string }

const INCOME = /\b(me pagaron|me pago|me consignaron|me transfirieron|recibi|ingreso|ingresaron|entraron|me entro|me llego|cobre|vendi|gane|sueldo|salario|quincena|prima|recargos?)\b/;

/** "gasté 25 mil en almuerzo" → gasto de $25.000 "Almuerzo". */
export function parseMovement(text: string): VoiceMovement | null {
  const p = plain(text).replace(/[¿?¡!"]/g, ' ').replace(/\$\s*/g, '').replace(/(\d)\s*mil\b/g, '$1 mil').replace(/\s+/g, ' ').trim();
  const words = p.split(' ');
  const amt = findAmount(words);
  if (!amt || amt.value < 50) return null;
  const type: VoiceMovement['type'] = INCOME.test(p) && !/\b(gaste|pague|compre)\b/.test(p) ? 'income' : 'expense';
  // Descripción: lo que queda sin el monto ni los verbos
  const rest = [...words.slice(0, amt.start), ...words.slice(amt.start + amt.used)].join(' ')
    .replace(/\b(gaste|pague|compre|gastamos|pagamos|registra|registrar|anota|anotar|apunta|un gasto de|gasto de|gasto|me pagaron|pagaron|me pago|me consignaron|consignaron|me transfirieron|transfirieron|recibi|cobre|ingreso de|ingreso|me entro|me llego|entraron|vendi|gane)\b/g, ' ')
    .replace(/\b(hoy|ayer|ahora|acabo de|acabe de|me|se|fue|fueron|un total de|en total|como|mas o menos|aproximadamente|pesos?)\b/g, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/^(en|de|del|por|para|a|al|la|el|los|las|un|una)\s+/, '')
    .replace(/^(en|de|del|por|para|a|al|la|el|los|las|un|una)\s+/, '')
    .replace(/\s+(en|de|del|por|para)$/, '')
    .trim();
  return { type, amount: Math.round(amt.value), description: cap(restore(rest, text)) || (type === 'income' ? 'Ingreso' : 'Gasto') };
}
