import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { secureStorage, hashPIN, RateLimiter } from '../utils/security';
import { notify } from '../services/notificationService';

interface SecurityContextType {
  isLocked: boolean;
  isSetup: boolean;
  lockNow: () => void;
  unlock: (pin: string) => boolean;
  setPIN: (pin: string) => void;
  changePIN: (oldPin: string, newPin: string) => boolean;
  hasPIN: () => boolean;
  resetSecurity: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isSetup, setIsSetup] = useState<boolean>(false);

  useEffect(() => {
    const setupStatus = secureStorage.getItem('miFinanzasSecuritySetup');
    setIsSetup(!!setupStatus);
    if (setupStatus) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, []);

  const hasPIN = useCallback(() => {
    return !!secureStorage.getItem('miFinanzasPIN');
  }, []);

  const setPIN = useCallback((pin: string) => {
    if (!pin || pin.length < 4) return;
    const hashed = hashPIN(pin);
    secureStorage.setItem('miFinanzasPIN', hashed);
    secureStorage.setItem('miFinanzasSecuritySetup', true);
    setIsSetup(true);
    setIsLocked(false);
    notify({
      title: '🔐 PIN Configurado',
      message: 'Tu app está protegida.',
      type: 'success',
      module: 'Security'
    });
  }, []);

  const changePIN = useCallback((oldPin: string, newPin: string) => {
    if (!hasPIN()) return false;
    const storedHash = secureStorage.getItem('miFinanzasPIN');
    if (hashPIN(oldPin) !== storedHash) {
      notify({
        title: '❌ Error',
        message: 'PIN actual incorrecto',
        type: 'error',
        module: 'Security'
      });
      return false;
    }
    const newHash = hashPIN(newPin);
    secureStorage.setItem('miFinanzasPIN', newHash);
    notify({
      title: '🔄 PIN Actualizado',
      message: 'Tu nuevo PIN ha sido guardado.',
      type: 'success',
      module: 'Security'
    });
    return true;
  }, [hasPIN]);

  const unlock = useCallback((pin: string): boolean => {
    if (!RateLimiter.check('unlock_attempts', 5)) {
      notify({
        title: '🔒 App Bloqueada',
        message: 'Demasiados intentos. Espera 15 min.',
        type: 'error',
        duration: 5000,
        module: 'Security'
      });
      return false;
    }
    const storedHash = secureStorage.getItem('miFinanzasPIN');
    const inputHash = hashPIN(pin);
    if (storedHash === inputHash) {
      RateLimiter.reset('unlock_attempts');
      setIsLocked(false);
      notify({
        title: '🔓 Desbloqueado',
        message: 'Acceso concedido',
        type: 'success',
        module: 'Security'
      });
      return true;
    } else {
      notify({
        title: '❌ PIN Incorrecto',
        message: 'Intenta de nuevo',
        type: 'error',
        module: 'Security'
      });
      return false;
    }
  }, []);

  const lockNow = useCallback(() => {
    setIsLocked(true);
  }, []);

  const resetSecurity = useCallback(() => {
    secureStorage.removeItem('miFinanzasPIN');
    secureStorage.removeItem('miFinanzasSecuritySetup');
    setIsSetup(false);
    setIsLocked(false);
    notify({
      title: '⚠️ Seguridad Desactivada',
      message: 'Se ha eliminado el PIN.',
      type: 'warning',
      module: 'Security'
    });
  }, []);

  return (
    <SecurityContext.Provider value={{
      isLocked,
      isSetup,
      lockNow,
      unlock,
      setPIN,
      changePIN,
      hasPIN,
      resetSecurity
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};