import { useEffect, useState, useRef } from 'react';
import { calcularInteresDiario, guardarRegistro, obtenerHistorial } from '../services/rentabilidadService';
import { enviarNotificacion, solicitarPermiso } from '../notifications/notificationService';
import { RentabilidadDia } from '../types';

// Generador de ID seguro (fallback para entornos sin crypto)
const generateId = () => 
  typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useRentabilidad = (tasaEA: number, saldoInicial: number) => {
  const [historial, setHistorial] = useState<RentabilidadDia[]>([]);
  const isCalculado = useRef(false);

  useEffect(() => {
    if (isCalculado.current) return;
    isCalculado.current = true;

    const calcular = async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const historialActual = obtenerHistorial();
      const yaExiste = historialActual.find(r => r.fecha === hoy);

      if (yaExiste) {
        setHistorial(historialActual);
        return;
      }

      const saldoAnterior = historialActual.length > 0 
        ? historialActual[0].saldoActual 
        : saldoInicial;

      const interesGenerado = calcularInteresDiario(saldoAnterior, tasaEA);
      const saldoActual = saldoAnterior + interesGenerado;

      guardarRegistro({
        id: generateId(), // ✅ AGREGADO: Generar ID único
        fecha: hoy,
        tasaEA,
        saldoAnterior,
        interesGenerado,
        saldoActual,
      });

      // Notificar solo si hay ganancia real
      if (interesGenerado > 0) {
        await solicitarPermiso(); // ✅ CORREGIDO: Ahora está importado
        enviarNotificacion('📈 Rentabilidad diaria', `Ganaste ${interesGenerado.toFixed(2)} hoy`);
      }

      setHistorial(obtenerHistorial());
    };

    calcular();
  }, [tasaEA, saldoInicial]);

  return historial;
};