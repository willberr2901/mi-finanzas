/**
 * ════════════════════════════════════════════════════════════════════
 * 🔐 CIFRADO DEL HOGAR (extremo a extremo)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: crea la llave secreta del hogar y cifra/descifra las "cajas"
 *           que viajan al servidor. Usa AES-256-GCM del propio navegador.
 * Dónde se usa: householdSync.ts (sincronización) y HouseholdSheet.tsx (QR).
 * Si lo cambias: los celulares ya unidos dejarían de entenderse entre sí.
 *                NO cambies los textos 'mf-room-v1', 'mf-enc-v1', 'mf-key-v1'.
 * ════════════════════════════════════════════════════════════════════
 */

// ─── Utilidades base64url (la llave viaja en el QR / enlace) ───
export const toB64u = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const fromB64u = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0));
};
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const enc = new TextEncoder();

/** Llave nueva de 256 bits (solo existe en los celulares del hogar). */
export const newHouseholdKey = () => toB64u(crypto.getRandomValues(new Uint8Array(32)));

export interface HouseholdKeys {
  room: string;          // identificador público del hogar en el servidor (no revela nada)
  aes: CryptoKey;        // cifra el contenido
  hmac: CryptoKey;       // esconde los nombres de las cajas
}

/** De la llave secreta salen tres llaves distintas (HKDF), cada una para su uso. */
export const deriveKeys = async (secretB64u: string): Promise<HouseholdKeys> => {
  const raw = fromB64u(secretB64u);
  const base = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey', 'deriveBits']);
  const params = (info: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('mi-finanzas'), info: enc.encode(info) });
  const roomBits = await crypto.subtle.deriveBits(params('mf-room-v1'), base, 256);
  const aes = await crypto.subtle.deriveKey(params('mf-enc-v1'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const hmac = await crypto.subtle.deriveKey(params('mf-key-v1'), base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
  return { room: hex(roomBits), aes, hmac };
};

/** Nombre opaco de la caja: el servidor no sabe si es un producto, un mercado o el presupuesto. */
export const boxName = async (keys: HouseholdKeys, logicalKey: string) =>
  hex(await crypto.subtle.sign('HMAC', keys.hmac, enc.encode(logicalKey))).slice(0, 40);

/** Cierra la caja: JSON → cifrado AES-GCM → texto base64url (iv + datos). */
export const seal = async (keys: HouseholdKeys, data: unknown): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keys.aes, enc.encode(JSON.stringify(data))));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return toB64u(out);
};

/** Abre la caja. Si alguien la alteró o no es de este hogar, devuelve null. */
export const open = async <T = unknown>(keys: HouseholdKeys, box: string): Promise<T | null> => {
  try {
    const all = fromB64u(box);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, keys.aes, all.slice(12));
    return JSON.parse(new TextDecoder().decode(pt)) as T;
  } catch { return null; }
};
