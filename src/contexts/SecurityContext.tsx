import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { hashPIN, isValidPIN, generateSessionToken, isSessionValid, simpleEncrypt, simpleDecrypt, RateLimiter, preventDebug } from '../utils/security';
import { notify } from '../services/notificationService';

interface SecurityContextType {
  isLocked: boolean;
  isSetup: boolean;
  unlock: (pin: string) => Promise<boolean>;
  setupPIN: (pin: string) => Promise<boolean>;
  changePIN: (oldPin: string, newPin: string) => Promise<boolean>;
  disableSecurity: (pin: string) => Promise<boolean>;
  lockNow: () => void;
  lastActivity: number;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const SECURITY_KEY = 'miFinanzasSecurityKey';
const PIN_HASH_KEY = 'miFinanzasPINHash';
const SESSION_TOKEN_KEY = 'miFinanzasSessionToken';
const SESSION_CREATED_KEY = 'miFinanzasSessionCreated';
const AUTO_LOCK_KEY = 'miFinanzasAutoLockMinutes';

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const lockNow = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_CREATED_KEY);
    setIsLocked(true);
    notify({ title: '🔒 App bloqueada', message: 'Requiere PIN para continuar', type: 'info' });
  }, []);

  useEffect(() => {
    try {
      preventDebug();
    } catch (e) {
      console.warn('preventDebug no disponible:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const pinHash = localStorage.getItem(PIN_HASH_KEY);
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const sessionCreated = parseInt(localStorage.getItem(SESSION_CREATED_KEY) || '0');
      
      setIsSetup(!!pinHash);
      
      if (pinHash && sessionToken && isSessionValid(sessionToken, sessionCreated)) {
        setIsLocked(false);
        notify({ title: '🔓 Sesión activa', message: 'Bienvenido de nuevo', type: 'success', duration: 2000 });
      }
    } catch (e) {
      console.error('Error verificando seguridad:', e);
    }
  }, []);

  useEffect(() => {
    const checkInactivity = () => {
      try {
        const autoLockMinutes = parseInt(localStorage.getItem(AUTO_LOCK_KEY) || '30');
        const inactiveTime = Date.now() - lastActivity;
        
        if (inactiveTime > autoLockMinutes * 60 * 1000 && isSetup && !isLocked) {
          lockNow();
          notify({ 
            title: '🔒 Bloqueo automático', 
            message: `Sesión bloqueada por ${autoLockMinutes}min de inactividad`, 
            type: 'warning' 
          });
        }
      } catch (e) {
        console.error('Error en auto-lock:', e);
      }
    };

    const interval = setInterval(checkInactivity, 60000);
    return () => clearInterval(interval);
  }, [lastActivity, isSetup, isLocked, lockNow]);

  const setupPIN = useCallback(async (pin: string): Promise<boolean> => {
    try {
      if (!isValidPIN(pin)) {
        notify({ title: '❌ PIN inválido', message: 'Debe tener 4-6 dígitos', type: 'error' });
        return false;
      }

      const pinHash = hashPIN(pin);
      const securityKey = generateSessionToken();
      
      localStorage.setItem(PIN_HASH_KEY, pinHash);
      localStorage.setItem(SECURITY_KEY, simpleEncrypt(securityKey, pin));
      localStorage.setItem(SESSION_TOKEN_KEY, generateSessionToken());
      localStorage.setItem(SESSION_CREATED_KEY, Date.now().toString());
      
      setIsSetup(true);
      setIsLocked(false);
      
      notify({ title: '🔐 Seguridad activada', message: 'Tu app ahora está protegida con PIN', type: 'success' });
      return true;
    } catch (e) {
      console.error('Error configurando PIN:', e);
      notify({ title: '❌ Error', message: 'No se pudo configurar el PIN', type: 'error' });
      return false;
    }
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      if (!RateLimiter.check('pin-attempts')) {
        notify({ 
          title: '⏳ Demasiados intentos', 
          message: 'Espera 15 minutos antes de intentar de nuevo', 
          type: 'error',
          duration: 5000
        });
        return false;
      }

      const storedHash = localStorage.getItem(PIN_HASH_KEY);
      if (!storedHash) {
        notify({ title: '❌ Error', message: 'PIN no configurado', type: 'error' });
        return false;
      }

      if (hashPIN(pin) === storedHash) {
        RateLimiter.reset('pin-attempts');
        
        localStorage.setItem(SESSION_TOKEN_KEY, generateSessionToken());
        localStorage.setItem(SESSION_CREATED_KEY, Date.now().toString());
        
        setIsLocked(false);
        updateActivity();
        
        notify({ title: '🔓 Desbloqueado', message: 'Acceso concedido', type: 'success', duration: 2000 });
        return true;
      } else {
        notify({ title: '❌ PIN incorrecto', message: 'Intenta de nuevo', type: 'error' });
        return false;
      }
    } catch (e) {
      console.error('Error desbloqueando:', e);
      notify({ title: '❌ Error', message: 'No se pudo desbloquear', type: 'error' });
      return false;
    }
  }, [updateActivity]);

  const changePIN = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      const storedHash = localStorage.getItem(PIN_HASH_KEY);
      if (!storedHash || hashPIN(oldPin) !== storedHash) {
        notify({ title: '❌ PIN actual incorrecto', message: 'Verifica tu PIN', type: 'error' });
        return false;
      }

      if (!isValidPIN(newPin)) {
        notify({ title: '❌ Nuevo PIN inválido', message: 'Debe tener 4-6 dígitos', type: 'error' });
        return false;
      }

      const encryptedKey = localStorage.getItem(SECURITY_KEY);
      if (encryptedKey) {
        try {
          const securityKey = simpleDecrypt(encryptedKey, oldPin);
          localStorage.setItem(SECURITY_KEY, simpleEncrypt(securityKey, newPin));
        } catch (e) {
          console.error('Error re-encriptando:', e);
        }
      }

      localStorage.setItem(PIN_HASH_KEY, hashPIN(newPin));
      
      notify({ title: '🔄 PIN actualizado', message: 'Tu nuevo PIN ha sido guardado', type: 'success' });
      return true;
    } catch (e) {
      console.error('Error cambiando PIN:', e);
      notify({ title: '❌ Error', message: 'No se pudo cambiar el PIN', type: 'error' });
      return false;
    }
  }, []);

  const disableSecurity = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const storedHash = localStorage.getItem(PIN_HASH_KEY);
      if (!storedHash || hashPIN(pin) !== storedHash) {
        notify({ title: '❌ PIN incorrecto', message: 'No se puede desactivar', type: 'error' });
        return false;
      }

      localStorage.removeItem(PIN_HASH_KEY);
      localStorage.removeItem(SECURITY_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_CREATED_KEY);
      
      setIsSetup(false);
      setIsLocked(false);
      
      notify({ title: '🔓 Seguridad desactivada', message: 'Tu app ya no requiere PIN', type: 'warning' });
      return true;
    } catch (e) {
      console.error('Error desactivando seguridad:', e);
      notify({ title: '❌ Error', message: 'No se pudo desactivar', type: 'error' });
      return false;
    }
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    const handler = () => updateActivity();
    
    events.forEach(event => window.addEventListener(event, handler));
    return () => events.forEach(event => window.removeEventListener(event, handler));
  }, [updateActivity]);

  return (
    <SecurityContext.Provider value={{
      isLocked,
      isSetup,
      unlock,
      setupPIN,
      changePIN,
      disableSecurity,
      lockNow,
      lastActivity
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity debe usarse dentro de SecurityProvider');
  }
  return context;
};