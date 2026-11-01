/**
 * ════════════════════════════════════════════════════════════════════
 * 🪙 CONTADOR DE ALCANCÍA (monedas colombianas)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *   1. COINS: las monedas en circulación con sus datos oficiales
 *      (Banco de la República, Resolución JD-4 de 2012).
 *   2. detectCoins(): busca monedas en una foto DENTRO del celular
 *      (nada se envía a internet) y dice de cuánto es cada una:
 *        · borde amarillo + centro plateado → $1.000
 *        · borde plateado + centro amarillo → $500
 *        · toda amarilla → $100 · toda plateada → $200 o $50 (por tamaño)
 *      Funciona bien con monedas regadas en una sola capa; si están
 *      amontonadas, cuenta solo las que se ven (por eso la persona revisa).
 *   3. totals(): suma montoncitos de 10 + sueltas de cada moneda.
 * Dónde se usa: Finanzas → Metas → "Contar alcancía" (components/goals/PiggyCounter.tsx).
 * ════════════════════════════════════════════════════════════════════
 */

export type CoinValue = 1000 | 500 | 200 | 100 | 50;
export interface CoinSpec { value: CoinValue; label: string; mm: number; grams: number; look: string }

export const COINS: CoinSpec[] = [
  { value: 1000, label: '$1.000', mm: 26.7, grams: 9.95, look: 'Borde amarillo, centro plateado' },
  { value: 500, label: '$500', mm: 23.7, grams: 7.14, look: 'Borde plateado, centro amarillo' },
  { value: 200, label: '$200', mm: 22.4, grams: 4.61, look: 'Toda plateada' },
  { value: 100, label: '$100', mm: 20.3, grams: 3.34, look: 'Toda amarilla' },
  { value: 50, label: '$50', mm: 17.0, grams: 2.0, look: 'Plateada y pequeña' },
];

// ═══ SECCIÓN: Sumas ═══
export type Counts = Record<CoinValue, { stacks: number; loose: number }>;
export const emptyCounts = (): Counts => ({ 1000: { stacks: 0, loose: 0 }, 500: { stacks: 0, loose: 0 }, 200: { stacks: 0, loose: 0 }, 100: { stacks: 0, loose: 0 }, 50: { stacks: 0, loose: 0 } });
export const coinsOf = (c: { stacks: number; loose: number }) => Math.max(0, c.stacks) * 10 + Math.max(0, c.loose);
export const totals = (counts: Counts, bills = 0) => {
  const byValue = COINS.map(k => ({ value: k.value, coins: coinsOf(counts[k.value]), amount: coinsOf(counts[k.value]) * k.value }));
  return { byValue, coins: byValue.reduce((a, b) => a + b.coins, 0), amount: byValue.reduce((a, b) => a + b.amount, 0) + Math.max(0, bills) };
};
/** Pasa una cantidad de monedas a montoncitos de 10 + sueltas. */
export const splitTen = (n: number) => ({ stacks: Math.floor(n / 10), loose: n % 10 });

// ═══ SECCIÓN: Detección en la foto ═══
export interface FoundCoin { x: number; y: number; r: number; value: CoinValue; ring: number; center: number }
interface Img { data: Uint8ClampedArray; width: number; height: number }

/** Qué tan "amarillo" (latón) es un color: 0 = plateado/gris, ~0.5 = dorado. */
const yellowness = (r: number, g: number, b: number) => {
  const l = (r + g + b) / 3;
  return l < 25 ? 0 : ((r + g) / 2 - b) / l;
};

/**
 * Busca círculos (monedas) con una transformada de Hough por gradiente, sin librerías.
 * La imagen debe venir ya reducida (lado mayor ~900 px) para que sea rápida en el celular.
 */
export function detectCoins(img: Img): FoundCoin[] {
  // Pasada 1: cualquier tamaño, para descubrir de qué tamaño salen las monedas en esta foto
  const S = Math.min(img.width, img.height);
  const first = findCircles(img, Math.max(8, Math.round(S * 0.015)), Math.round(S * 0.16), 0.5, 0.6);
  if (!first.length) return [];
  const top = [...first].sort((a, b) => b.s - a.s).slice(0, Math.max(5, Math.ceil(first.length * 0.4))).map(c => c.r).sort((a, b) => a - b);
  const R = top[Math.floor(top.length / 2)];
  // Pasada 2: solo tamaños de moneda (de $50 a $1.000 caben entre 0,6R y 1,2R)
  const coins = findCircles(img, Math.max(6, Math.round(R * 0.58)), Math.round(R * 1.22), 0.32, 0.5, R * 1.1);
  return colorize(img, coins);
}

function findCircles(img: Img, rmin: number, rmax: number, minSupport: number, minCover: number, minDist = 0): { x: number; y: number; r: number; s: number }[] {
  const { data, width: W, height: H } = img;
  const N = W * H;
  // 1) Gris + desenfoque suave (2 pasadas de caja 3×3)
  let gray = new Float32Array(N);
  for (let i = 0; i < N; i++) gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += gray[(y + dy) * W + x + dx];
      out[y * W + x] = s / 9;
    }
    gray = out;
  }
  // 2) Bordes (Sobel)
  const gx = new Float32Array(N), gy = new Float32Array(N), mag = new Float32Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const a = gray[i - W - 1], b = gray[i - W], c = gray[i - W + 1], d = gray[i - 1], f = gray[i + 1], g = gray[i + W - 1], h = gray[i + W], k = gray[i + W + 1];
    gx[i] = (c + 2 * f + k) - (a + 2 * d + g);
    gy[i] = (g + 2 * h + k) - (a + 2 * b + c);
    mag[i] = Math.hypot(gx[i], gy[i]);
  }
  const sorted = Array.from(mag).filter(v => v > 0).sort((p, q) => p - q);
  const thr = Math.max(40, sorted[Math.floor(sorted.length * 0.86)] || 0);

  // 3) Votos: cada borde vota por centros a lo largo de su gradiente
  const acc = new Float32Array(N);
  const edges: number[] = [];
  for (let i = 0; i < N; i++) {
    if (mag[i] < thr) continue;
    edges.push(i);
    const x0 = i % W, y0 = (i / W) | 0, ux = gx[i] / mag[i], uy = gy[i] / mag[i];
    for (const sgn of [1, -1]) for (let r = rmin; r <= rmax; r++) {
      const x = Math.round(x0 + sgn * ux * r), y = Math.round(y0 + sgn * uy * r);
      if (x < 0 || y < 0 || x >= W || y >= H) break;
      acc[y * W + x] += 1;
    }
  }
  // Suaviza el acumulador (caja 5×5)
  const accS = new Float32Array(N);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    let s = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += acc[(y + dy) * W + x + dx];
    accS[y * W + x] = s;
  }
  // 4) Máximos locales = candidatos a centro
  const cands: { x: number; y: number; v: number }[] = [];
  const win = Math.max(3, Math.round(rmin * 0.8));
  for (let y = win; y < H - win; y += 2) for (let x = win; x < W - win; x += 2) {
    const v = accS[y * W + x];
    if (v < 30) continue;
    let isMax = true;
    for (let dy = -win; dy <= win && isMax; dy += 2) for (let dx = -win; dx <= win; dx += 2) if (accS[(y + dy) * W + x + dx] > v) { isMax = false; break; }
    if (isMax) cands.push({ x, y, v });
  }
  cands.sort((a, b) => b.v - a.v);

  // 5) Radio de cada candidato: el anillo con más bordes apuntando al centro
  const scored: { x: number; y: number; r: number; s: number }[] = [];
  for (const c of cands.slice(0, 1500)) {
    const hist = new Float32Array(rmax + 2);
    const x0 = Math.max(0, c.x - rmax), x1 = Math.min(W - 1, c.x + rmax), y0 = Math.max(0, c.y - rmax), y1 = Math.min(H - 1, c.y + rmax);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (mag[i] < thr) continue;
      const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy);
      if (d < rmin || d > rmax) continue;
      const cos = Math.abs((dx * gx[i] + dy * gy[i]) / (d * mag[i]));
      if (cos > 0.85) hist[Math.round(d)] += 1;
    }
    let best = 0, bestR = 0;
    for (let r = rmin; r <= rmax; r++) {
      const sup = (hist[r - 1] + hist[r] + hist[r + 1]) / (2 * Math.PI * r);
      if (sup > best) { best = sup; bestR = r; }
    }
    if (best < minSupport) continue;
    // Cobertura: el borde debe rodear la moneda (no un pedacito de línea)
    const bins = new Uint8Array(24);
    for (let a = 0; a < 96; a++) {
      const t = (a / 96) * 2 * Math.PI;
      for (let dr = -2; dr <= 2; dr++) {
        const x = Math.round(c.x + Math.cos(t) * (bestR + dr)), y = Math.round(c.y + Math.sin(t) * (bestR + dr));
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (mag[y * W + x] >= thr * 0.8) { bins[Math.floor(a / 4)] = 1; break; }
      }
    }
    const cover = bins.reduce((p, q) => p + q, 0) / 24;
    if (cover >= minCover) scored.push({ x: c.x, y: c.y, r: bestR, s: best * cover });
  }
  // 6) Quita duplicados (dos centros para la misma moneda)
  scored.sort((a, b) => b.s - a.s);
  const kept: typeof scored = [];
  for (const c of scored) if (kept.every(k => Math.hypot(k.x - c.x, k.y - c.y) > Math.max(minDist, 0.75 * Math.max(k.r, c.r)))) kept.push(c);
  return kept;
}

function colorize(img: Img, coins: { x: number; y: number; r: number }[]): FoundCoin[] {
  const { data, width: W, height: H } = img;

  // 7) Valor de cada moneda por color (borde vs centro) y tamaño
  const sample = (cx: number, cy: number, r0: number, r1: number) => {
    let s = 0, n = 0;
    const R = Math.ceil(r1);
    for (let dy = -R; dy <= R; dy += 1) for (let dx = -R; dx <= R; dx += 1) {
      const d = Math.hypot(dx, dy);
      if (d < r0 || d > r1) continue;
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = (y * W + x) * 4;
      s += yellowness(data[i], data[i + 1], data[i + 2]); n++;
    }
    return n ? s / n : 0;
  };
  // Brillo del fondo (la mesa o el plástico ocupan la mayor parte de la foto)
  const lums: number[] = [];
  for (let i = 0; i < W * H; i += 7) lums.push((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3);
  lums.sort((p, q) => p - q);
  const bg = lums[Math.floor(lums.length * 0.6)];
  const lumIn = (cx: number, cy: number, r: number) => {
    let s = 0, n = 0;
    for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = (y * W + x) * 4; s += (data[i] + data[i + 1] + data[i + 2]) / 3; n++;
    }
    return n ? s / n : 255;
  };
  const withColor = coins
    .map(c => ({ ...c, ring: sample(c.x, c.y, c.r * 0.78, c.r * 0.93), center: sample(c.x, c.y, 0, c.r * 0.45), lum: lumIn(c.x, c.y, Math.round(c.r * 0.8)) }))
    // Un "círculo" del mismo brillo que el fondo y sin color es un pliegue o una sombra, no una moneda
    .filter(c => !(c.lum > bg * 0.86 && Math.max(c.ring, c.center) < 0.1));
  const bigR = Math.max(...withColor.filter(c => Math.abs(c.ring - c.center) > 0.07).map(c => c.r), 0) || Math.max(...withColor.map(c => c.r), 0);
  return withColor.map(c => ({ x: c.x, y: c.y, r: c.r, ring: c.ring, center: c.center, value: classify(c.ring, c.center, c.r, bigR) }));
}

/** Decide el valor con los colores del borde y del centro (y el tamaño si es toda plateada). */
export function classify(ring: number, center: number, r: number, bigR: number): CoinValue {
  const diff = ring - center;
  if (diff > 0.06) return 1000;          // borde más amarillo que el centro
  if (diff < -0.06) return 500;          // centro más amarillo que el borde
  if ((ring + center) / 2 > 0.2) return 100;   // toda amarilla
  return bigR && r < bigR * 0.72 ? 50 : 200;    // toda plateada: la grande es de $200
}

/** Cuenta cuántas hay de cada valor. */
export const countByValue = (found: FoundCoin[]) => {
  const out = emptyCounts();
  for (const v of COINS.map(c => c.value)) out[v] = splitTen(found.filter(f => f.value === v).length);
  return out;
};
