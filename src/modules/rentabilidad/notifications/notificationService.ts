export const solicitarPermiso = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permiso = await Notification.requestPermission();
  return permiso === 'granted';
};

export const enviarNotificacion = (titulo: string, body: string): void => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(titulo, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'rentabilidad-diaria' // Evita notificaciones duplicadas
    });
  }
};