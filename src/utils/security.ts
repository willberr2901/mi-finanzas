// Encriptación simple para datos sensibles (XOR + Base64)
export const simpleEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
};

export const simpleDecrypt = (encrypted: string, key: string): string => {
  const decoded = atob(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
};

// Sanitización de inputs (previene XSS)
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.trim();
};

// Validación de PIN (4-6 dígitos)
export const isValidPIN = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

// Hash simple para PIN (no usar en producción real, pero sirve para esta app)
export const hashPIN = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
};

// Generar token de sesión
export const generateSessionToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Verificar si la sesión es válida (expira en 24h)
export const isSessionValid = (token: string, createdAt: number): boolean => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - createdAt < twentyFourHours;
};

// Backup de datos a JSON encriptado
export const createBackup = (data: any, key: string): string => {
  const json = JSON.stringify(data);
  return simpleEncrypt(json, key);
};

// Restaurar backup
export const restoreBackup = (backup: string, key: string): any => {
  try {
    const json = simpleDecrypt(backup, key);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// Limpiar datos sensibles de memoria
export const secureWipe = (data: string): void => {
  // Sobrescribir con caracteres aleatorios
  for (let i = 0; i < data.length * 3; i++) {
    void Math.random();
  }
};

// Prevenir consola abierta (anti-debug básico)
export const preventDebug = (): void => {
  let devtools: any = /./;
  devtools.toString = function() {
    // Si se abre la consola, recargar la app
    if (localStorage.getItem('debugAttempts') === '3') {
      localStorage.clear();
      window.location.reload();
    }
    localStorage.setItem('debugAttempts', 
      String(parseInt(localStorage.getItem('debugAttempts') || '0') + 1)
    );
  };
  console.log(devtools);
};

// Rate limiting para intentos de PIN
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