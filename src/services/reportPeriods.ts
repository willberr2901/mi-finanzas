/**
 * 📅 Meses disponibles para los reportes (parte liviana de exportService).
 * Está aparte para que la pantalla de Finanzas abra rápido: la librería de PDF
 * (pesada) solo se descarga cuando alguien toca "Descargar PDF/Excel".
 */
import type { Transaction } from '../utils/database';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const periodLabel = (period: string) => {
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
/** Meses con movimientos (más el actual), del más reciente al más antiguo. */
export const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const availablePeriods = (transactions: Transaction[]): string[] => {
  const set = new Set<string>([currentPeriod()]);
  transactions.forEach(t => t.date && set.add(t.date.slice(0, 7)));
  return [...set].sort().reverse();
};
