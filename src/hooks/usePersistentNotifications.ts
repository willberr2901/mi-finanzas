import { useState, useCallback } from 'react';
import type { ToastPosition } from 'react-toastify';
import { toast } from 'react-toastify';

interface Notif {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function usePersistentNotifications(position: ToastPosition = 'top-center') {
  const [queue, setQueue] = useState<Notif[]>([]);

  const push = useCallback((title: string, message: string, type: Notif['type'] = 'info') => {
    const id = crypto.randomUUID();
    setQueue(prev => [...prev, { id, title, message, type }]);
    
    toast[type](`${title}\n${message}`, {
      position,
      autoClose: false,
      closeOnClick: false,
      draggable: true,
      closeButton: true,
      style: { 
        background: '#0F172A', 
        border: '1px solid #1E293B', 
        color: '#F8FAFC', 
        borderRadius: '16px',
        fontFamily: 'system-ui'
      }
    });
  }, [position]);

  const remove = useCallback((id: string) => {
    setQueue(prev => prev.filter(n => n.id !== id));
    toast.dismiss();
  }, []);

  return { queue, push, remove };
}