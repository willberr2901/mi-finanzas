import { toast, type ToastOptions } from 'react-toastify';
import { sanitizeInput } from '../utils/security';

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'BACKUP' | 'RESTORE' | 'SECURITY';
  module: string;
  details: string;
  success: boolean;
}

export type AuditLogFunction = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;

let auditLogFn: AuditLogFunction | null = null;

export const setAuditLogFunction = (fn: AuditLogFunction) => {
  auditLogFn = fn;
};

export const notify = ({ 
  title, 
  message, 
  type = 'info', 
  duration = 3000,
  log = true,
  module = 'App'
}: { 
  title: string; 
  message?: string; 
  type?: 'success' | 'error' | 'info' | 'warning'; 
  duration?: number;
  log?: boolean;
  module?: string;
}) => {
  const safeTitle = sanitizeInput(title);
  const safeMessage = message ? sanitizeInput(message) : '';
  const safeModule = sanitizeInput(module);
  
  const fullMessage = safeMessage ? `${safeTitle}\n${safeMessage}` : safeTitle;
  const toastId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  const toastOptions: ToastOptions = {
    toastId,
    autoClose: duration,
    position: 'top-right',
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  switch (type) {
    case 'success':
      toast.success(`✅ ${fullMessage}`, toastOptions);
      break;
    case 'error':
      toast.error(`❌ ${fullMessage}`, toastOptions);
      break;
    case 'warning':
      toast.warning(`⚠️ ${fullMessage}`, toastOptions);
      break;
    default:
      toast.info(`ℹ️ ${fullMessage}`, toastOptions);
  }

  if (log && auditLogFn) {
    const actionMap: Record<string, AuditEntry['action']> = {
      'agregado': 'CREATE',
      'actualizado': 'UPDATE',
      'eliminado': 'DELETE',
      'registrado': 'CREATE',
      'guardado': 'BACKUP',
      'restaurado': 'RESTORE',
      'bloqueada': 'SECURITY',
      'desbloqueada': 'SECURITY',
    };

    const searchText = `${safeTitle} ${safeMessage}`.toLowerCase();
    const action = Object.entries(actionMap).find(([key]) => searchText.includes(key))?.[1] || 'UPDATE';

    auditLogFn({
      action,
      module: safeModule,
      details: `${safeTitle}${safeMessage ? ` - ${safeMessage}` : ''}`,
      success: type !== 'error'
    });
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(safeTitle, {
        body: safeMessage || '',
        icon: '/icon-192.png',
        tag: `mi-finanzas-${type}-${Date.now()}`,
        requireInteraction: type === 'error' || type === 'warning'
      });
    } catch (e) {
      console.warn('Notificación del sistema falló:', e);
    }
  }

  return toastId;
};

// ✅ NUEVAS FUNCIONES QUE FALTABAN PARA TransactionForm.tsx
export const notifyExpenseAdded = (name: string, amount: number, module = 'Finanzas') => {
  return notify({ 
    title: '💸 Gasto registrado', 
    message: `${sanitizeInput(name)}: $${amount.toLocaleString('es-CO')}`, 
    type: 'success',
    module,
    log: true
  });
};

export const notifyIncomeAdded = (name: string, amount: number, module = 'Finanzas') => {
  return notify({ 
    title: '💰 Ingreso registrado', 
    message: `${sanitizeInput(name)}: $${amount.toLocaleString('es-CO')}`, 
    type: 'success',
    module,
    log: true
  });
};

export const notifyMarketItemAdded = (itemName: string, price: number, module = 'Market') => {
  if (!itemName || typeof itemName !== 'string' || itemName.length > 100) {
    console.error('Nombre de producto inválido');
    return;
  }
  
  if (typeof price !== 'number' || price < 0 || price > 999999999) {
    console.error('Precio inválido');
    return;
  }
  
  return notify({ 
    title: '🛒 Producto agregado', 
    message: `${sanitizeInput(itemName)} - $${price.toLocaleString('es-CO')}`, 
    type: 'success',
    module,
    log: true
  });
};

export const notifyMarketCompleted = (items: number, total: number, module = 'Market') => {
  if (!Number.isInteger(items) || items < 0 || items > 10000) {
    console.error('Número de items inválido');
    return;
  }
  
  if (typeof total !== 'number' || total < 0 || total > 999999999) {
    console.error('Total inválido');
    return;
  }
  
  return notify({ 
    title: '✅ Compra finalizada', 
    message: `${items} productos • Total: $${total.toLocaleString('es-CO')}`, 
    type: 'success',
    duration: 5000,
    module,
    log: true
  });
};

export const notifySecurityAction = (
  action: 'LOCK' | 'UNLOCK' | 'PIN_CHANGED' | 'PIN_SETUP' | 'BACKUP' | 'RESTORE',
  module = 'Security'
) => {
  const messages: Record<string, { title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }> = {
    LOCK: { title: '🔒 App bloqueada', message: 'Requiere PIN para continuar', type: 'info' },
    UNLOCK: { title: '🔓 App desbloqueada', message: 'Acceso concedido', type: 'success' },
    PIN_SETUP: { title: '🔐 PIN configurado', message: 'Tu app ahora está protegida', type: 'success' },
    PIN_CHANGED: { title: '🔄 PIN actualizado', message: 'Tu nuevo PIN ha sido guardado', type: 'success' },
    BACKUP: { title: '💾 Backup creado', message: 'Tus datos están respaldados', type: 'success' },
    RESTORE: { title: '📥 Backup restaurado', message: 'Tus datos han sido recuperados', type: 'success' }
  };
  
  const msg = messages[action];
  
  return notify({ 
    title: msg.title, 
    message: msg.message, 
    type: msg.type || 'success',
    duration: 3000,
    module,
    log: true
  });
};

export const notifyError = (title: string, message: string, module = 'App') => {
  return notify({
    title: `❌ ${sanitizeInput(title)}`,
    message: sanitizeInput(message),
    type: 'error',
    duration: 5000,
    module,
    log: true
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.warn('Error solicitando permisos:', e);
    return false;
  }
};

export const clearAllNotifications = () => {
  toast.dismiss();
};