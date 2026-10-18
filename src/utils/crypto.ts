/**
 * ════════════════════════════════════════════════════════════════════
 * 🔑 CIFRADO CON CONTRASEÑA
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: AES-256 del navegador para el respaldo y el PIN.
 * Dónde se ve: Respaldo y seguridad.
 * Si lo cambias: No cambiar sin migrar los respaldos existentes.
 * Nota: Criptografía real del navegador (Web Crypto API). Nada sale del celular.
 * ════════════════════════════════════════════════════════════════════
 */
const enc = new TextEncoder();
const dec = new TextDecoder();

export const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
export const fromB64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
export const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

const ITERATIONS = 210_000; // recomendación OWASP para PBKDF2-SHA256

/** Hash del PIN con PBKDF2-SHA256 y sal aleatoria: el PIN nunca se guarda tal cual. */
export const hashSecret = async (secret: string, salt: Uint8Array, iterations = ITERATIONS) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256);
  return toB64(bits);
};

/** Comparación en tiempo constante. */
export const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

const deriveAesKey = async (password: string, salt: Uint8Array) => {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
};

/** Cifra con AES-256-GCM usando una contraseña (para respaldos). */
export const encryptWithPassword = async (plain: string, password: string) => {
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = await deriveAesKey(password, salt);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(plain));
  return JSON.stringify({ app: 'mi-finanzas', v: 1, alg: 'AES-256-GCM/PBKDF2-SHA256', it: ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(data) });
};

/** Descifra un respaldo. Lanza error si la contraseña es incorrecta o el archivo fue alterado. */
export const decryptWithPassword = async (payload: string, password: string) => {
  const p = JSON.parse(payload);
  if (p.app !== 'mi-finanzas' || !p.data) throw new Error('No es un respaldo de Mi Finanzas');
  const key = await deriveAesKey(password, fromB64(p.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(p.iv) as BufferSource }, key, fromB64(p.data) as BufferSource);
  return dec.decode(plain);
};
