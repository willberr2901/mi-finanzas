// Utilidades de seguridad y cifrado

// Sanitizar inputs (previene XSS)
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

// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar PIN (4-6 dígitos)
export const isValidPIN = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

// Validar monto (número positivo)
export const isValidAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0 && num <= 999999999;
};

// Hash simple para PIN (no es criptográfico pero sirve para comparación básica)
export const hashPIN = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Cifrado simple usando localStorage (para datos sensibles básicos)
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

// Rate limiting simple (para intentos de PIN)
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

// Verificar integridad de datos
export const verifyDataIntegrity = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  const str = JSON.stringify(data);
  return !/<script|javascript:|onerror=|onload=/i.test(str);
};

// Guardar en localStorage de forma segura
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const encrypted = encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (e) {
      console.error('Error guardando datos:', e);
    }
  },
  
  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return decryptData(encrypted);
    } catch (e) {
      console.error('Error leyendo datos:', e);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  }
};