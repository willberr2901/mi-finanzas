/**
 * ════════════════════════════════════════════════════════════════════
 * 🗂️ CATEGORÍAS AUTOMÁTICAS DEL MERCADO + NOMBRES DE FACTURA
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *   1. categoryOf("arroz diana") → 'despensa'. Clasifica cada producto solo con
 *      el nombre, usando un diccionario de productos comunes en Colombia.
 *      Si la persona cambia la categoría de un producto, se recuerda (overrides).
 *   2. expandReceiptName("LCHE ENT ALQ 1100") → "leche entera alqueria". Traduce
 *      las abreviaturas típicas de las facturas para poder cruzarlas con la lista.
 *   3. crossReceipt(...) → une cada producto de la factura con el de la lista:
 *      seguro (se tacha solo), "¿es el mismo?" (se confirma) o sin pareja.
 *      Las uniones que la persona confirma se recuerdan (alias) para la próxima.
 * Todo se guarda y calcula solo en el celular.
 * Dónde se usa: Mercado (lista agrupada y hoja Agregar) y Escáner (cruce con la lista).
 * Para agregar productos al diccionario: súmalos en WORDS (en minúscula, sin tildes).
 * ════════════════════════════════════════════════════════════════════
 */
import { norm } from './marketStore';

export type CategoryId = 'frutas' | 'lacteos' | 'carnes' | 'panaderia' | 'despensa' | 'bebidas' | 'mecato' | 'aseo' | 'personal' | 'mascotas' | 'otros';

export const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: 'frutas', label: 'Frutas y verduras', color: '#86EFAC' },
  { id: 'lacteos', label: 'Lácteos y huevos', color: '#93C5FD' },
  { id: 'carnes', label: 'Carnes y pescado', color: '#FCA5A5' },
  { id: 'panaderia', label: 'Panadería', color: '#FCD34D' },
  { id: 'despensa', label: 'Despensa', color: '#FDBA74' },
  { id: 'bebidas', label: 'Bebidas', color: '#67E8F9' },
  { id: 'mecato', label: 'Mecato y dulces', color: '#F9A8D4' },
  { id: 'aseo', label: 'Aseo del hogar', color: '#C4B5FD' },
  { id: 'personal', label: 'Cuidado personal', color: '#A5B4FC' },
  { id: 'mascotas', label: 'Mascotas', color: '#D9F99D' },
  { id: 'otros', label: 'Otros', color: '#CBD5E1' },
];
export const categoryLabel = (id: CategoryId) => CATEGORIES.find(c => c.id === id)?.label ?? 'Otros';

// ═══ SECCIÓN: Diccionario (palabra o frase → categoría) ═══
const WORDS: Record<Exclude<CategoryId, 'otros'>, string[]> = {
  frutas: ['papa', 'platano', 'tomate', 'cebolla', 'ajo', 'zanahoria', 'aguacate', 'limon', 'naranja', 'banano', 'manzana', 'mango', 'fresa', 'mora', 'lulo',
    'maracuya', 'guayaba', 'papaya', 'pina', 'yuca', 'arveja', 'habichuela', 'lechuga', 'repollo', 'pepino', 'pimenton', 'cilantro', 'perejil', 'ahuyama',
    'mazorca', 'uva', 'pera', 'cebollin', 'apio', 'brocoli', 'espinaca', 'remolacha', 'curuba', 'granadilla', 'tomate de arbol', 'mandarina', 'sandia',
    'melon', 'kiwi', 'coliflor', 'champinon', 'jengibre', 'fruta', 'verdura', 'ensalada', 'durazno', 'ciruela', 'coco', 'feijoa', 'pitahaya', 'guanabana', 'tamarindo'],
  lacteos: ['leche', 'queso', 'yogur', 'yogurt', 'kumis', 'mantequilla', 'margarina', 'crema de leche', 'cuajada', 'huevo', 'arequipe', 'kefir', 'quesillo',
    'mozzarella', 'leche en polvo', 'leche condensada', 'avena liquida', 'suero', 'bon yurt'],
  carnes: ['carne', 'res', 'pollo', 'cerdo', 'pechuga', 'muslo', 'contramuslo', 'costilla', 'chuleta', 'salchicha', 'jamon', 'mortadela', 'chorizo', 'tocino',
    'pescado', 'mojarra', 'tilapia', 'salmon', 'camaron', 'carne molida', 'higado', 'lomo', 'alas', 'butifarra', 'longaniza', 'salchichon', 'pavo',
    'bagre', 'trucha', 'posta', 'sobrebarriga', 'morrillo', 'bistec', 'hamburguesa', 'nugget', 'chicharron', 'pernil', 'menudencia', 'rellena', 'morcilla'],
  panaderia: ['pan', 'tostada', 'arepa', 'almojabana', 'pandebono', 'bunuelo', 'torta', 'ponque', 'pan tajado', 'mogolla', 'croissant', 'roscon', 'pan de queso',
    'tajado', 'calado', 'galleta de soda', 'pan integral', 'pan blanco', 'pan perro', 'pan hamburguesa', 'tortilla'],
  despensa: ['arroz', 'frijol', 'lenteja', 'garbanzo', 'pasta', 'espagueti', 'macarron', 'harina', 'azucar', 'sal', 'aceite', 'panela', 'cafe', 'chocolate',
    'avena', 'atun', 'sardina', 'enlatado', 'salsa', 'mayonesa', 'ketchup', 'salsa de tomate', 'mostaza', 'vinagre', 'condimento', 'comino', 'color', 'caldo',
    'maggi', 'maizena', 'fecula', 'gelatina', 'cereal', 'granola', 'miel', 'mermelada', 'sopa', 'maiz', 'harina pan', 'pimienta', 'canela', 'te', 'aromatica',
    'cuchuco', 'arveja seca', 'cubo', 'triguisimo', 'adobo', 'oregano', 'laurel', 'bicarbonato', 'levadura', 'cocoa', 'milo', 'nescafe', 'endulzante', 'stevia',
    'aceituna', 'conserva', 'pure', 'spaghetti', 'fideo', 'coditos', 'tallarin', 'quinua', 'chia', 'linaza', 'manteca'],
  bebidas: ['gaseosa', 'coca cola', 'agua', 'jugo', 'cerveza', 'vino', 'refresco', 'pony', 'hit', 'gatorade', 'te frio', 'colombiana', 'postobon', 'aguardiente',
    'ron', 'whisky', 'soda', 'malta', 'bebida', 'tampico', 'agua con gas', 'energizante', 'speed'],
  mecato: ['galleta', 'papas fritas', 'papa frita', 'chocolatina', 'dulce', 'chicle', 'mani', 'helado', 'gomita', 'detodito', 'chito', 'dorito', 'bombon',
    'choclito', 'golosina', 'jet', 'chocoramo', 'gansito', 'mecato', 'snack', 'pasaboca', 'crispeta', 'palomita', 'caramelo', 'brownie', 'oblea', 'bocadillo',
    'cocosette', 'festival', 'tosh', 'trululu', 'chocolatinas'],
  aseo: ['jabon', 'detergente', 'suavizante', 'cloro', 'blanqueador', 'limpido', 'desinfectante', 'esponja', 'escoba', 'trapero', 'bolsa de basura', 'bolsa basura',
    'lavaloza', 'jabon de loza', 'axion', 'ambientador', 'papel higienico', 'servilleta', 'toalla de cocina', 'fabuloso', 'varsol', 'guante', 'fab', 'ariel',
    'dersa', 'rey', 'limpiavidrio', 'insecticida', 'raid', 'recogedor', 'balde', 'brillo', 'sabra', 'clorox', 'quitamanchas', 'papel aluminio', 'vinipel', 'aluminio'],
  personal: ['shampoo', 'champu', 'crema dental', 'cepillo de diente', 'cepillo dental', 'desodorante', 'toalla higienica', 'protector', 'afeitar', 'maquina de afeitar',
    'panal', 'talco', 'acondicionador', 'enjuague', 'hilo dental', 'algodon', 'crema corporal', 'jabon de bano', 'jabon antibacterial', 'gel', 'tampon',
    'pañito', 'panito', 'toallita humeda', 'bloqueador', 'colgate', 'pañal', 'rasuradora', 'labial', 'crema para peinar', 'tinte', 'curita', 'acetaminofen', 'medicamento'],
  mascotas: ['concentrado', 'cuido', 'arena de gato', 'arena para gato', 'croqueta', 'mascota', 'perro', 'gato', 'dog chow', 'cat chow', 'chunky', 'pedigree', 'whiskas', 'snack perro'],
};

// Frases normalizadas igual que los nombres, de la más larga a la más corta (gana la más específica).
const DICT: { key: string; words: string[]; cat: CategoryId }[] = Object.entries(WORDS)
  .flatMap(([cat, list]) => list.map(w => ({ key: norm(w), cat: cat as CategoryId })))
  .filter(x => x.key)
  .map(x => ({ ...x, words: x.key.split(' ') }))
  .sort((a, b) => b.key.length - a.key.length);

const containsPhrase = (hay: string[], words: string[]) => {
  for (let i = 0; i + words.length <= hay.length; i++) if (words.every((w, j) => hay[i + j] === w)) return true;
  return false;
};

// ═══ SECCIÓN: Lo que la persona corrigió (se recuerda) ═══
const OVR_KEY = 'mf_cat_overrides';
const readJSON = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; } };
const writeJSON = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

/** Categoría según el diccionario, sin tener en cuenta lo que la persona cambió. */
export function guessCategory(name: string): CategoryId {
  const words = norm(name).split(' ').filter(Boolean);
  if (!words.length) return 'otros';
  for (const d of DICT) if (containsPhrase(words, d.words)) return d.cat;
  return 'otros';
}
/** Categoría de un producto: primero lo que la persona eligió, si no el diccionario. */
export function categoryOf(name: string): CategoryId {
  const o = readJSON<Record<string, CategoryId>>(OVR_KEY, {});
  return o[norm(name)] ?? guessCategory(name);
}
/** Guarda la categoría que eligió la persona para ese producto. */
export function setCategoryFor(name: string, cat: CategoryId) {
  const k = norm(name);
  if (!k) return;
  const o = readJSON<Record<string, CategoryId>>(OVR_KEY, {});
  if (cat === guessCategory(name)) delete o[k]; else o[k] = cat;
  writeJSON(OVR_KEY, o);
}

/** Agrupa una lista por categoría, en el orden de CATEGORIES. */
export function groupByCategory<T extends { name: string }>(items: T[]): { cat: (typeof CATEGORIES)[number]; items: T[] }[] {
  const map = new Map<CategoryId, T[]>();
  for (const it of items) { const c = categoryOf(it.name); map.set(c, [...(map.get(c) || []), it]); }
  return CATEGORIES.filter(c => map.has(c.id)).map(c => ({ cat: c, items: map.get(c.id)! }));
}

// ═══ SECCIÓN: Nombres de factura → nombres normales ═══
const ABBR: Record<string, string> = {
  lche: 'leche', lech: 'leche', lch: 'leche', qso: 'queso', ques: 'queso', arz: 'arroz', arro: 'arroz', hvo: 'huevo', huev: 'huevo', hvos: 'huevo',
  act: 'aceite', acte: 'aceite', azuc: 'azucar', azcr: 'azucar', azu: 'azucar', caf: 'cafe', jbn: 'jabon', jab: 'jabon', deterg: 'detergente', det: 'detergente',
  pol: 'pollo', poll: 'pollo', crn: 'carne', mantq: 'mantequilla', manteq: 'mantequilla', yog: 'yogur', gall: 'galleta', gllta: 'galleta', gas: 'gaseosa',
  gaseo: 'gaseosa', chocol: 'chocolate', choc: 'chocolate', pn: 'pan', tost: 'tostada', papel: 'papel', hig: 'higienico', hgnco: 'higienico', pap: 'papa',
  tom: 'tomate', ceb: 'cebolla', plat: 'platano', zanah: 'zanahoria', lent: 'lenteja', frij: 'frijol', panel: 'panela', harin: 'harina', past: 'pasta',
  salch: 'salchicha', jam: 'jamon', mortad: 'mortadela', suav: 'suavizante', limp: 'limpido', blanq: 'blanqueador', shamp: 'shampoo', desod: 'desodorante',
  crem: 'crema', dent: 'dental', ent: 'entera', desl: 'deslactosada', semid: 'semidescremada', bols: 'bolsa', agu: 'agua',
};
// Palabras que no ayudan a reconocer el producto (unidades, tamaños, presentaciones).
const NOISE = /^(\d+([.,]\d+)?|x\d+|\d+x|\d*(g|gr|grs|kg|kgs|ml|l|lt|lts|cc|und|un|unid|und|oz|lb)|und|un|unid|pq|paq|paquete|bolsa|caja|tarro|frasco|sobre|uds?|pet|vidrio|aa|a|aaa|b|tipo|x|de|la|el|con|sin|y|u|pack|precio|especial|oferta|promo)$/;

export function expandReceiptName(raw: string): string {
  const words = norm(raw).split(' ').filter(Boolean).map(w => ABBR[w] ?? w).filter(w => !NOISE.test(w));
  return words.join(' ');
}

// ═══ SECCIÓN: Cruce factura ↔ lista ═══
const ALIAS_KEY = 'mf_receipt_alias';
/** Recuerda que un nombre de factura corresponde a un producto de la lista. */
export function rememberAlias(receiptName: string, listName: string) {
  const k = norm(receiptName);
  if (!k) return;
  const a = readJSON<Record<string, string>>(ALIAS_KEY, {});
  a[k] = norm(listName);
  writeJSON(ALIAS_KEY, a);
}

export type MatchLevel = 'seguro' | 'confirmar';
/** Puntaje 0-100 de qué tanto se parece un producto de factura a uno de la lista. */
export function matchScore(receiptName: string, listName: string): number {
  const alias = readJSON<Record<string, string>>(ALIAS_KEY, {})[norm(receiptName)];
  const L = norm(listName);
  if (alias && alias === L) return 100;
  const R = expandReceiptName(receiptName);
  if (!R || !L) return 0;
  if (R === L) return 98;
  const rw = R.split(' '), lw = L.split(' ');
  if (lw.every(w => rw.includes(w))) return 92;                       // "huevo" ⊂ "huevo rojo"
  if (rw.every(w => lw.includes(w))) return 88;                       // "pan" ⊂ "pan tajado"
  const pre = (a: string, b: string) => a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, 4)) || b.startsWith(a.slice(0, 4)));
  if (lw.some(l => rw.some(r => r === l || pre(r, l)))) return 76;     // alguna palabra igual o con la misma raíz
  if (categoryOf(listName) !== 'otros' && categoryOf(listName) === guessCategory(R)) return 55; // misma categoría
  return 0;
}

export interface CrossResult<R, L> {
  pairs: { receipt: R; item: L; score: number; level: MatchLevel }[];
  unmatched: R[];
  leftover: L[];
}
/** Une cada producto de la factura con máximo un producto de la lista (los más parecidos primero). */
export function crossReceipt<R extends { name: string }, L extends { id: string; name: string }>(receipt: R[], list: L[]): CrossResult<R, L> {
  const cands: { r: number; l: number; s: number }[] = [];
  receipt.forEach((r, ri) => list.forEach((l, li) => { const s = matchScore(r.name, l.name); if (s >= 55) cands.push({ r: ri, l: li, s }); }));
  cands.sort((a, b) => b.s - a.s);
  const usedR = new Set<number>(), usedL = new Set<number>();
  const pairs: CrossResult<R, L>['pairs'] = [];
  for (const c of cands) {
    if (usedR.has(c.r) || usedL.has(c.l)) continue;
    usedR.add(c.r); usedL.add(c.l);
    pairs.push({ receipt: receipt[c.r], item: list[c.l], score: c.s, level: c.s >= 76 ? 'seguro' : 'confirmar' });
  }
  return { pairs, unmatched: receipt.filter((_, i) => !usedR.has(i)), leftover: list.filter((_, i) => !usedL.has(i)) };
}

// ═══ SECCIÓN: Catálogo para agregar con un toque ═══
/** Productos típicos de un mercado en Colombia (nombre bonito para mostrar), por categoría. */
export const CATALOG: Record<Exclude<CategoryId, 'otros'>, string[]> = {
  frutas: ['Papa', 'Plátano', 'Tomate', 'Cebolla cabezona', 'Cebolla larga', 'Zanahoria', 'Aguacate', 'Limón', 'Banano', 'Manzana', 'Naranja', 'Mora', 'Lulo', 'Maracuyá', 'Guayaba', 'Papaya', 'Piña', 'Yuca', 'Ajo', 'Cilantro', 'Lechuga', 'Pepino', 'Pimentón', 'Mango', 'Fresa', 'Arveja', 'Habichuela'],
  lacteos: ['Huevos', 'Leche', 'Queso campesino', 'Queso doble crema', 'Yogur', 'Kumis', 'Mantequilla', 'Crema de leche', 'Cuajada', 'Arequipe'],
  carnes: ['Pechuga de pollo', 'Pollo entero', 'Carne de res', 'Carne molida', 'Cerdo', 'Chuleta', 'Costilla', 'Salchichas', 'Jamón', 'Mortadela', 'Chorizo', 'Tilapia', 'Atún fresco'],
  panaderia: ['Pan tajado', 'Pan', 'Arepas', 'Almojábanas', 'Pandebono', 'Tostadas', 'Ponqué', 'Tortillas'],
  despensa: ['Arroz', 'Aceite', 'Azúcar', 'Sal', 'Panela', 'Café', 'Chocolate', 'Lentejas', 'Fríjoles', 'Garbanzos', 'Pasta', 'Harina de maíz', 'Avena', 'Atún en lata', 'Salsa de tomate', 'Mayonesa', 'Cereal', 'Caldo de gallina', 'Gelatina', 'Mermelada'],
  bebidas: ['Agua', 'Gaseosa', 'Jugo', 'Cerveza', 'Té frío', 'Malta'],
  mecato: ['Galletas', 'Papas fritas', 'Chocolatinas', 'Maní', 'Helado', 'Gomitas', 'Chicles'],
  aseo: ['Jabón de loza', 'Detergente', 'Suavizante', 'Límpido', 'Papel higiénico', 'Servilletas', 'Toalla de cocina', 'Bolsas de basura', 'Esponjas', 'Desinfectante', 'Jabón en barra'],
  personal: ['Crema dental', 'Shampoo', 'Jabón de baño', 'Desodorante', 'Toallas higiénicas', 'Cepillo de dientes', 'Pañales', 'Acondicionador'],
  mascotas: ['Concentrado de perro', 'Concentrado de gato', 'Arena para gato'],
};
const CATALOG_FLAT = Object.entries(CATALOG).flatMap(([cat, names]) => names.map(name => ({ name, cat: cat as CategoryId, key: norm(name) })));

/** Lo básico que todavía no está en la lista (para agregar con un toque). */
export const BASICS = ['Huevos', 'Leche', 'Arroz', 'Pan tajado', 'Aceite', 'Café', 'Panela', 'Papa', 'Tomate', 'Cebolla cabezona', 'Plátano', 'Queso campesino', 'Pechuga de pollo', 'Jabón de loza', 'Papel higiénico', 'Azúcar'];

/** Busca en el catálogo mientras se escribe ("hue" → Huevos). Primero lo que empieza igual. */
export function searchCatalog(q: string, exclude: Set<string> = new Set(), limit = 8): { name: string; cat: CategoryId }[] {
  const k = norm(q);
  if (!k) return [];
  const starts = CATALOG_FLAT.filter(c => !exclude.has(c.key) && (c.key.startsWith(k) || c.key.split(' ').some(w => w.startsWith(k))));
  const has = CATALOG_FLAT.filter(c => !exclude.has(c.key) && !starts.includes(c) && c.key.includes(k));
  return [...starts, ...has].slice(0, limit).map(({ name, cat }) => ({ name, cat }));
}
