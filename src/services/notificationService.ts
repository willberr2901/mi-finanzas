import { toast } from 'react-toastify';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationOptions {
  title: string;
  message?: string;
  type?: NotificationType;
  duration?: number;
}

// Notificaciones específicas por tipo de acción
export const notifyMarketItemAdded = (itemName: string, price: number) => {
  toast.success(
    `🛒 ${itemName}\n$${price.toLocaleString('es-CO')}`,
    { toastId: 'market-add' }
  );
};

export const notifyMarketCompleted = (total: number, items: number) => {
  toast.success(
    `✅ ¡Compra finalizada!\n${items} productos - Total: $${total.toLocaleString('es-CO')}`,
    { toastId: 'market-complete' }
  );
};

export const notifyExpenseAdded = (category: string, amount: number) => {
  toast.info(
    `💸 Gasto registrado\n${category}: $${amount.toLocaleString('es-CO')}`,
    { toastId: 'expense-add' }
  );
};

export const notifyIncomeAdded = (source: string, amount: number) => {
  toast.success(
    `📈 Ingreso registrado\n${source}: $${amount.toLocaleString('es-CO')}`,
    { toastId: 'income-add' }
  );
};

export const notifyBudgetAlert = (category: string, percentage: number) => {
  toast.warning(
    `⚠️ Alerta de presupuesto\nHas usado el ${percentage}% de ${category}`,
    { toastId: 'budget-alert', autoClose: 5000 }
  );
};

export const notifyPriceChange = (itemName: string, oldPrice: number, newPrice: number) => {
  const diff = newPrice - oldPrice;
  const percentage = ((diff / oldPrice) * 100).toFixed(1);
  const arrow = diff > 0 ? '📈' : '📉';
  
  toast.info(
    `${arrow} Precio actualizado\n${itemName}: $${oldPrice.toLocaleString()} → $${newPrice.toLocaleString()} (${diff > 0 ? '+' : ''}${percentage}%)`,
    { toastId: 'price-change' }
  );
};

// Función genérica
export const notify = ({ title, message, type = 'info', duration = 3000 }: NotificationOptions) => {
  const toastConfig = {
    toastId: `${type}-${Date.now()}`,
    autoClose: duration
  };

  const fullMessage = message ? `${title}\n${message}` : title;

  switch (type) {
    case 'success':
      toast.success(`✅ ${fullMessage}`, toastConfig);
      break;
    case 'error':
      toast.error(`❌ ${fullMessage}`, toastConfig);
      break;
    case 'warning':
      toast.warning(`⚠️ ${fullMessage}`, toastConfig);
      break;
    default:
      toast.info(`ℹ️ ${fullMessage}`, toastConfig);
  }
};

// Solicitar permiso para notificaciones push
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/// Enviar notificación push
export const sendPushNotification = async (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notificationOptions: any = {
      body,
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'mi-finanzas-notification'
    };
    
    // vibrate solo funciona en navegadores que lo soportan
    if ('vibrate' in Notification.prototype) {
      (notificationOptions as any).vibrate = [200, 100, 200];
    }
    
    new Notification(title, notificationOptions);
  }
};

export default {
  notify,
  notifyMarketItemAdded,
  notifyMarketCompleted,
  notifyExpenseAdded,
  notifyIncomeAdded,
  notifyBudgetAlert,
  notifyPriceChange,
  requestNotificationPermission,
  sendPushNotification
};