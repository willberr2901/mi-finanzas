import { toast } from 'react-toastify';

// Notificaciones específicas
export const notifyMarketItemAdded = (itemName: string, price: number) => {
  toast.success(`🛒 ${itemName}\n$${price.toLocaleString('es-CO')}`);
};

export const notifyMarketCompleted = (total: number, items: number) => {
  toast.success(`✅ ¡Compra finalizada!\n${items} productos - Total: $${total.toLocaleString('es-CO')}`);
};

export const notifyExpenseAdded = (category: string, amount: number) => {
  toast.info(`💸 Gasto registrado\n${category}: $${amount.toLocaleString('es-CO')}`);
};

export const notifyIncomeAdded = (source: string, amount: number) => {
  toast.success(`📈 Ingreso registrado\n${source}: $${amount.toLocaleString('es-CO')}`);
};

export const notifyBudgetAlert = (category: string, percentage: number) => {
  toast.warning(`⚠️ Alerta de presupuesto\nHas usado el ${percentage}% de ${category}`, { autoClose: 5000 });
};

export const notifyPriceChange = (itemName: string, oldPrice: number, newPrice: number) => {
  const diff = newPrice - oldPrice;
  const percentage = ((diff / oldPrice) * 100).toFixed(1);
  const arrow = diff > 0 ? '📈' : '📉';
  toast.info(`${arrow} Precio actualizado\n${itemName}: $${oldPrice.toLocaleString()} → $${newPrice.toLocaleString()} (${diff > 0 ? '+' : ''}${percentage}%)`);
};

// Función genérica
export const notify = ({ 
  title, 
  message, 
  type = 'info', 
  duration = 3000 
}: { 
  title: string; 
  message?: string; 
  type?: 'success' | 'error' | 'info' | 'warning'; 
  duration?: number;
}) => {
  const fullMessage = message ? `${title}\n${message}` : title;
  const id = `${type}-${Date.now()}`;
  
  switch (type) {
    case 'success': toast.success(`✅ ${fullMessage}`, { toastId: id, autoClose: duration }); break;
    case 'error': toast.error(`❌ ${fullMessage}`, { toastId: id, autoClose: duration }); break;
    case 'warning': toast.warning(`⚠️ ${fullMessage}`, { toastId: id, autoClose: duration }); break;
    default: toast.info(`ℹ️ ${fullMessage}`, { toastId: id, autoClose: duration });
  }
};

// Permisos y Push nativo
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendPushNotification = async (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/icon-192.png',
      tag: 'mi-finanzas-notification'
    });
  }
};