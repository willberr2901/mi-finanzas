/**
 * ════════════════════════════════════════════════════════════════════
 * 🛡️ ALMACENAMIENTO LOCAL (listas y preferencias guardadas en el celular)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: secureStorage guarda listas y preferencias en el celular en un formato
 *           no legible a simple vista (soporta tildes y emojis desde v1.7).
 * Ojo: esto NO es cifrado fuerte, es solo para que no se lea a simple vista.
 *      Lo realmente sensible va protegido de otra forma:
 *        · PIN → PBKDF2 con sal (contexts/SecurityContext.tsx)
 *        · Respaldos → AES-256-GCM con contraseña (utils/crypto.ts)
 *        · Hogar sincronizado → cifrado de extremo a extremo (services/household)
 * Dónde se ve: Mercado, facturas y otros.
 * Si lo cambias: Si cambias el formato, conserva la lectura del formato anterior.
 * (v1.15: se quitaron funciones viejas de "cifrado" débil que ya no se usaban.)
 * ════════════════════════════════════════════════════════════════════
 */
const STORAGE_CONFIG = {
  KEY_PREFIX: 'miFinanzas_v2_',
  ENCRYPT_KEY: 'finanzas-key-2026-secure'
};

export const secureStorage = {
  KEY_PREFIX: STORAGE_CONFIG.KEY_PREFIX,
  ENCRYPT_KEY: STORAGE_CONFIG.ENCRYPT_KEY,
  getItem(key: string): any {
    try {
      const raw = localStorage.getItem(`${this.KEY_PREFIX}${key}`);
      if (!raw) return null;
      // Formato nuevo (v1.7): "u8:" + bytes UTF-8 ofuscados. Soporta tildes, ñ y emojis.
      if (raw.startsWith('u8:')) {
        const bytes = Uint8Array.from(atob(raw.slice(3)), c => c.charCodeAt(0));
        const k = new TextEncoder().encode(this.ENCRYPT_KEY);
        return JSON.parse(new TextDecoder().decode(bytes.map((b, i) => b ^ k[i % k.length])));
      }
      try {
        const decrypted = atob(raw).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ this.ENCRYPT_KEY.charCodeAt(i % this.ENCRYPT_KEY.length))).join('');
        return JSON.parse(decrypted);
      } catch { return JSON.parse(raw); }
    } catch { return null; }
  },
  setItem(key: string, value: any): void {
    try {
      // Antes: XOR por caracteres + btoa, que fallaba en silencio con emojis (😋) y no guardaba nada.
      const bytes = new TextEncoder().encode(JSON.stringify(value));
      const k = new TextEncoder().encode(this.ENCRYPT_KEY);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ^ k[i % k.length]);
      localStorage.setItem(`${this.KEY_PREFIX}${key}`, 'u8:' + btoa(bin));
    } catch { /* almacenamiento lleno o bloqueado */ }
  },
  removeItem(key: string): void { localStorage.removeItem(`${this.KEY_PREFIX}${key}`); },
  clear(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.KEY_PREFIX)) localStorage.removeItem(key);
    }
  }
};
