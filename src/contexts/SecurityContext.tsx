import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react'; // ✅ Importación correcta de solo tipo
import { notify } from '../services/notificationService';

// Definimos la interfaz del contexto para que TypeScript sepa qué propiedades existen
interface SecurityContextType {
  isLocked: boolean;
  isSetup: boolean;
  lockNow: () => void;
  unlockWithPin: (pin: string) => boolean;
  setupPin: (pin: string) => void;
}

// Creamos el contexto con un valor inicial undefined
const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  // Estados locales
  const [isLocked, setIsLocked] = useState(false);
  
  // Verificamos si ya existe un PIN guardado al iniciar
  const [isSetup, setIsSetup] = useState(() => !!localStorage.getItem('miFinanzasPin'));
  const [storedPin, setStoredPin] = useState<string>(() => localStorage.getItem('miFinanzasPin') || '');

  // Función para bloquear la app inmediatamente
  const lockNow = useCallback(() => {
    setIsLocked(true);
    notify({ 
      title: '🔒 App bloqueada', 
      message: 'Requiere PIN para continuar', 
      type: 'info' 
    });
  }, []);

  // Función para desbloquear con PIN
  const unlockWithPin = useCallback((pin: string) => {
    if (pin === storedPin) {
      setIsLocked(false);
      notify({ 
        title: '🔓 Desbloqueado', 
        message: 'Acceso concedido', 
        type: 'success' 
      });
      return true;
    } else {
      notify({ 
        title: '❌ PIN Incorrecto', 
        message: 'Intenta de nuevo', 
        type: 'error' 
      });
      return false;
    }
  }, [storedPin]);

  // Función para configurar un nuevo PIN por primera vez
  const setupPin = useCallback((pin: string) => {
    if (!pin || pin.length !== 4 && pin.length !== 6) {
      notify({ 
        title: '⚠️ Error', 
        message: 'El PIN debe tener 4 o 6 dígitos', 
        type: 'warning' 
      });
      return;
    }
    
    // Guardar en localStorage y estado local
    localStorage.setItem('miFinanzasPin', pin);
    setStoredPin(pin);
    setIsSetup(true);
    setIsLocked(false); // Al configurar, se desbloquea
    
    notify({ 
      title: '🔐 PIN Configurado', 
      message: 'Tu app ahora está protegida', 
      type: 'success' 
    });
  }, []);

  return (
    <SecurityContext.Provider value={{ isLocked, isSetup, lockNow, unlockWithPin, setupPin }}>
      {children}
    </SecurityContext.Provider>
  );
};

// Hook personalizado para consumir el contexto fácilmente
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};