import { secureStorage } from '../../../utils/security';
import { RentabilidadDia } from '../types';

const STORAGE_KEY = 'rentabilidad_historial';

// Generador de ID seguro (fallback para entornos sin crypto)
const generateId = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const calcularInteresDiario = (saldo: number, tasaEA: number): number => {
  const tasaDiaria = Math.pow(1 + tasaEA / 100, 1 / 365) - 1;
  return saldo * tasaDiaria;
};

export const obtenerHistorial = (): RentabilidadDia[] => {
  try {
    const data = secureStorage.getItem(STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const guardarRegistro = (registro: RentabilidadDia): void => {
  const historial = obtenerHistorial();
  const yaExiste = historial.some(r => r.fecha === registro.fecha);
  if (!yaExiste) {
    historial.unshift({ ...registro, id: generateId() });
    secureStorage.setItem(STORAGE_KEY, historial);
  }
};