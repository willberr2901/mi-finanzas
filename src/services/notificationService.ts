import { toast } from 'react-toastify';

// Tipo para entradas de auditoría
export interface AuditEntry {
  id: string;
  timestamp: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'BACKUP' | 'RESTORE' | 'SECURITY';
  module: string;
  details: string;
  success: boolean;
}

// Tipo para la función de logging
export type AuditLogFunction = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;

// Referencia para la función de auditoría
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
  const fullMessage = message ? `${title}\n${message}` : title;
  const toastId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Opciones para el toast (sin tipo explícito para evitar errores)
  const toastOptions = {
    toastId,
    autoClose: duration,
    position: 'top-right' as const,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  // Mostrar toast según el tipo
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

  // Registrar en auditoría si está configurado
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
      'pin actualizado': 'SECURITY',
      'backup': 'BACKUP'
    };

    const searchText = `${title} ${message || ''}`.toLowerCase();
    const action = Object.entries(actionMap).find(([key]) => searchText.includes(key))?.[1] || 'UPDATE';

    auditLogFn({
      action,
      module,
      details: `${title}${message ? ` - ${message}` : ''}`,
      success: type !== 'error'
    });
  }

  // Notificación nativa del sistema
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message || '',
        icon: '/icon-192.png',
        tag: `mi-finanzas-${type}-${Date.now()}`,
        requireInteraction: type === 'error' || type === 'warning'
      });
    } catch (e) {
      console.warn('No se pudo mostrar notificación del sistema:', e);
    }
  }

  return toastId;
};

// Notificaciones específicas
export const notifyMarketItemAdded = (itemName: string, price: number, module = 'Market') => {
  return notify({ 
    title: '🛒 Producto agregado', 
    message: `${itemName} - $${price.toLocaleString('es-CO')}`, 
    type: 'success',
    module,
    log: true
  });
};

export const notifyMarketItemUpdated = (itemName: string, oldPrice: number, newPrice: number, module = 'Market') => {
  const diff = newPrice - oldPrice;
  const diffText = diff >= 0 ? `+$${Math.abs(diff).toLocaleString('es-CO')}` : `-$${Math.abs(diff).toLocaleString('es-CO')}`;
  
  return notify({ 
    title: '🔄 Precio actualizado', 
    message: `${itemName}: $${oldPrice.toLocaleString('es-CO')} → $${newPrice.toLocaleString('es-CO')} (${diffText})`, 
    type: 'info',
    module,
    log: true
  });
};

export const notifyMarketItemDeleted = (itemName: string, module = 'Market') => {
  return notify({ 
    title: '🗑️ Producto eliminado', 
    message: `${itemName} removido de la lista`, 
    type: 'warning',
    module,
    log: true
  });
};

export const notifyMarketCompleted = (items: number, total: number, module = 'Market') => {
  return notify({ 
    title: '✅ Compra finalizada', 
    message: `${items} productos • Total: $${total.toLocaleString('es-CO')}`, 
    type: 'success',
    duration: 5000,
    module,
    log: true
  });
};

export const notifyExpenseAdded = (category: string, amount: number, module = 'Finance') => {
  return notify({ 
    title: '💸 Gasto registrado', 
    message: `${category}: $${amount.toLocaleString('es-CO')}`, 
    type: 'info',
    module,
    log: true
  });
};

export const notifyIncomeAdded = (source: string, amount: number, module = 'Finance') => {
  return notify({ 
    title: '📈 Ingreso registrado', 
    message: `${source}: $${amount.toLocaleString('es-CO')}`, 
    type: 'success',
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

export const notifyTransactionAdded = (type: 'income' | 'expense', category: string, amount: number, module = 'Finance') => {
  const icon = type === 'income' ? '📥' : '📤';
  const color = type === 'income' ? 'success' : 'info' as const;
  
  return notify({
    title: `${icon} ${type === 'income' ? 'Ingreso' : 'Gasto'} registrado`,
    message: `${category}: $${amount.toLocaleString('es-CO')}`,
    type: color,
    module,
    log: true
  });
};

export const notifyScannerResult = (productsFound: number, totalDetected: number, module = 'Scanner') => {
  return notify({
    title: '🧾 Factura procesada',
    message: `${productsFound} productos detectados • Total estimado: $${totalDetected.toLocaleString('es-CO')}`,
    type: 'success',
    duration: 4000,
    module,
    log: true
  });
};

export const notifyError = (title: string, message: string, module = 'App') => {
  return notify({
    title: `❌ ${title}`,
    message,
    type: 'error',
    duration: 5000,
    module,
    log: true
  });
};

// Permisos y notificaciones push
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.warn('Error solicitando permisos de notificación:', e);
    return false;
  }
};

export const sendPushNotification = async (
  title: string, 
  body: string, 
  options?: { icon?: string; tag?: string; requireInteraction?: boolean }
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    await requestNotificationPermission();
  }
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: options?.icon || '/icon-192.png',
        tag: options?.tag || `mi-finanzas-${Date.now()}`,
        requireInteraction: options?.requireInteraction ?? false
      });
      return true;
    } catch (e) {
      console.warn('Error enviando notificación push:', e);
      return false;
    }
  }
  
  return false;
};

// Utilidades adicionales
export const clearAllNotifications = () => {
  toast.dismiss();
};

export const notifyAppUpdate = (newVersion: string) => {
  return notify({
    title: '🔄 Actualización disponible',
    message: `Nueva versión ${newVersion} lista para instalar`,
    type: 'info',
    duration: 0,
    log: false
  });
};

export const notifyConnectionError = (module: string = 'App') => {
  return notify({
    title: '📡 Sin conexión',
    message: 'Verifica tu conexión a internet e intenta de nuevo',
    type: 'warning',
    duration: 4000,
    module,
    log: true
  });
};

export const notifySuccess = (message: string, module: string = 'App', duration: number = 3000) => {
  return notify({
    title: '✅ Éxito',
    message,
    type: 'success',
    duration,
    module,
    log: true
  });
};