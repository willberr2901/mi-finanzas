// src/utils/security.ts

// ✅ SANITIZE INPUT (PREVIENE XSS)
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPIN = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

export const isValidAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0 && num <= 999999999;
};

export const hashPIN = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const encryptData = (data: any, key: string = 'mi-finanzas-key-2026'): string => {
  try {
    const str = JSON.stringify(data);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  } catch (e) {
    console.error('Error cifrando datos:', e);
    return '';
  }
};

export const decryptData = (encrypted: string, key: string = 'mi-finanzas-key-2026'): any => {
  try {
    const str = atob(encrypted);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(result);
  } catch (e) {
    console.error('Error descifrando datos:', e);
    return null;
  }
};

export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  static check(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  static reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const verifyDataIntegrity = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  const str = JSON.stringify(data);
  return !/<script|javascript:|onerror=|onload=/i.test(str);
};

// ✅ CONFIGURACIÓN CENTRALIZADA (Evita problemas de contexto 'this')
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

      try {
        const decrypted = atob(raw)
          .split('')
          .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ this.ENCRYPT_KEY.charCodeAt(i % this.ENCRYPT_KEY.length)))
          .join('');
        return JSON.parse(decrypted);
      } catch {
        console.warn('[Storage] Desencriptación fallida, intentando raw JSON:', key);
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Storage] Error lectura:', err);
      return null;
    }
  },

  setItem(key: string, value: any): void {
    try {
      const json = JSON.stringify(value);
      const encrypted = json
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ this.ENCRYPT_KEY.charCodeAt(i % this.ENCRYPT_KEY.length)))
        .join('');
      localStorage.setItem(`${this.KEY_PREFIX}${key}`, btoa(encrypted));
    } catch (err) {
      console.error('[Storage] Error escritura:', err);
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(`${this.KEY_PREFIX}${key}`);
  },

  clear(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
};

// ✅ BACKUP Y RESTORE (Corregido: usa STORAGE_CONFIG en lugar de 'this')
export const createBackup = async (): Promise<Blob | null> => {
  try {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_CONFIG.KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = value;
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return null;
    }

    const encryptedData = encryptData(data);
    return new Blob([encryptedData], { type: 'application/json' });
  } catch (e) {
    console.error('Error creando backup:', e);
    return null;
  }
};

export const restoreBackup = async (file: File): Promise<boolean> => {
  try {
    const text = await file.text();
    let data: Record<string, any>;

    try {
      const decrypted = decryptData(text);
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('Datos inválidos');
      }
      data = decrypted;
    } catch {
      // Fallback para backups antiguos sin cifrado
      data = JSON.parse(text);
    }

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(STORAGE_CONFIG.KEY_PREFIX) && typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    }

    return true;
  } catch (e) {
    console.error('Error restaurando backup:', e);
    return false;
  }
};