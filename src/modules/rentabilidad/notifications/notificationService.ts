export const solicitarPermiso = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  
  // Si ya tenemos permiso, true
  if (Notification.permission === 'granted') return true;
  
  // Si el usuario no ha decidido, le preguntamos
  if (Notification.permission !== 'denied') {
    const permiso = await Notification.requestPermission();
    return permiso === 'granted';
  }
  
  return false;
};

// Esta función dispara la notificación nativa del celular (como WhatsApp o Instagram)
export const enviarNotificacionNativa = (titulo: string, cuerpo: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(titulo, {
      body: cuerpo,
      icon: '/icon-192.png', // Asegúrate de tener este icono en tu carpeta public
      badge: '/icon-192.png',
      tag: 'rentabilidad-actualizacion' // Evita spam de notificaciones
    });
  }
};