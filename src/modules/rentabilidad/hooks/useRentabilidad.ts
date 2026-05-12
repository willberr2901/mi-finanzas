import { useEffect, useState } from 'react';
import { calcularInteresDiario, obtenerHistorial, guardarRegistro } from '../services/rentabilidadService';
import { solicitarPermiso, enviarNotificacionNativa } from '../notifications/notificationService';
import { RentabilidadDia } from '../types';

// Generador de ID único
const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID 
  ? crypto.randomUUID() 
  : Date.now().toString(36);

export const useRentabilidad = (tasaEA: number, saldoInicial: number) => {
  const [historial, setHistorial] = useState<RentabilidadDia[]>([]);

  useEffect(() => {
    const ejecutarCalculoDiario = async () => {
      // 1. Obtener fecha de hoy (YYYY-MM-DD)
      const hoy = new Date().toISOString().split('T')[0];
      
      // 2. Obtener historial existente
      const historialActual = obtenerHistorial();
      
      // 3. Verificar si YA se calculó hoy
      const registroHoy = historialActual.find(r => r.fecha === hoy);
      
      if (registroHoy) {
        setHistorial(historialActual);
        return; // Si ya existe, no hacemos nada
      }

      // 4. Calcular Interés Compuesto Real
      // Saldo anterior es el último registrado, o el inicial si es la primera vez
      const ultimoRegistro = historialActual[0];
      const saldoAnterior = ultimoRegistro ? ultimoRegistro.saldoActual : saldoInicial;
      
      const interesGenerado = calcularInteresDiario(saldoAnterior, tasaEA);
      const saldoActual = saldoAnterior + interesGenerado;

      // 5. Guardar nuevo registro
      const nuevoRegistro: RentabilidadDia = {
        id: generateId(),
        fecha: hoy,
        tasaEA,
        saldoAnterior,
        interesGenerado,
        saldoActual
      };

      guardarRegistro(nuevoRegistro);
      
      // 6. Notificar al usuario (Nativo)
      if (interesGenerado > 1) { // Solo notificar si hay ganancia significativa
        await solicitarPermiso();
        enviarNotificacionNativa('💰 Rentabilidad Diaria', `Ganaste $${interesGenerado.toLocaleString('es-CO')} hoy. Saldo: $${saldoActual.toLocaleString('es-CO')}`);
      }

      // 7. Actualizar estado
      setHistorial(obtenerHistorial());
    };

    ejecutarCalculoDiario();
  }, [tasaEA, saldoInicial]);

  return historial;
};