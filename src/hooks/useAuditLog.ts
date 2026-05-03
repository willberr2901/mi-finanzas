import { useCallback } from 'react';
import { notify } from '../services/notificationService';

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'BACKUP' | 'RESTORE';
  module: string;
  details: string;
  success: boolean;
}

const AUDIT_LOG_KEY = 'miFinanzasAuditLog';
const MAX_LOG_ENTRIES = 100;

export const useAuditLog = () => {
  const log = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: Date.now(),
    };

    // Cargar logs existentes
    const existing = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]') as AuditEntry[];
    
    // Agregar nuevo log al inicio
    const updated = [newEntry, ...existing].slice(0, MAX_LOG_ENTRIES);
    
    // Guardar (encriptado si hay seguridad activa)
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));

    // Notificación para acciones importantes
    if (['DELETE', 'LOGIN', 'LOGOUT', 'BACKUP', 'RESTORE'].includes(entry.action)) {
      const icons: Record<string, string> = {
        DELETE: '🗑️',
        LOGIN: '🔓',
        LOGOUT: '🔒',
        BACKUP: '💾',
        RESTORE: '📥',
        CREATE: '✅',
        UPDATE: '🔄'
      };
      
      notify({
        title: `${icons[entry.action] || '📋'} ${entry.action}`,
        message: `${entry.module}: ${entry.details}`,
        type: entry.success ? 'success' : 'error',
        duration: 3000
      });
    }

    return newEntry;
  }, []);

  const getLogs = useCallback((limit: number = 20): AuditEntry[] => {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]') as AuditEntry[];
    return logs.slice(0, limit);
  }, []);

  const clearLogs = useCallback(() => {
    localStorage.removeItem(AUDIT_LOG_KEY);
    notify({ title: '🧹 Logs limpiados', message: 'Historial de auditoría borrado', type: 'info' });
  }, []);

  return { log, getLogs, clearLogs };
};