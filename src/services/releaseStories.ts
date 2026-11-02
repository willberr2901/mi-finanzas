/**
 * ════════════════════════════════════════════════════════════════════
 * 🎬 HISTORIA DE NOVEDADES (la ventana grande con "video" de cada novedad)
 * ────────────────────────────────────────────────────────────────────
 * Cada versión grande puede traer una historia: una pantalla por novedad con
 * su animación (components/pwa/FeatureDemos.tsx), título, texto corto y un botón
 * "Probarlo" que lleva directo a la función.
 * Si la versión no tiene historia, se muestra la lista de RELEASE_NOTES (src/version.ts).
 * Se puede volver a ver desde el menú ☰ → "Novedades".
 * ════════════════════════════════════════════════════════════════════
 */
import type { DemoId } from '../components/pwa/FeatureDemos';

export interface StorySlide { demo: DemoId; tag: string; title: string; text: string; cta?: { label: string; to: string } }

export const RELEASE_STORY: StorySlide[] = [
  { demo: 'kai', tag: '🤖 CONOCE A KAI', title: 'Tu asistente de presupuesto', text: 'Kai te pregunta tu sueldo, tus deudas y cuánto quieres ahorrar, y arma tu presupuesto. Si hoy no alcanza, te ayuda a liberar deuda primero.', cta: { label: 'Armar mi presupuesto', to: '#kai' } },
  { demo: 'rings', tag: '🎯 NUEVO INICIO', title: 'Tu mes en anillos', text: 'Gastado, días del mes y ahorro en un anillo triple, y cuánto puedes gastar por día. Los mismos anillos salen en tu PDF y tu Excel.', cta: { label: 'Ver en Inicio', to: '/' } },
  { demo: 'recap', tag: '📊 NUEVO EN INICIO', title: 'Tu mes, en una historia', text: 'Los primeros días de cada mes verás cuánto ahorraste, en qué se fue la plata, qué subió, qué bajó y un consejo.', cta: { label: 'Ver en Inicio', to: '/' } },
  { demo: 'haptics', tag: '📳 MÁS FLUIDA', title: 'La sientes al tocar', text: 'Una vibración suave te confirma cuando guardas un gasto, tachas del mercado o cuentas monedas (en Android).' },
  { demo: 'backup', tag: '💾 TUS DATOS SEGUROS', title: 'Te recordamos tu copia', text: 'Si llevas más de un mes sin respaldo, te avisamos para que guardes una copia cifrada. Si pierdes el celular, recuperas todo.', cta: { label: 'Hacer respaldo', to: '/ajustes?s=respaldo' } },
  { demo: 'support', tag: '☕ APÓYANOS', title: 'Mi Finanzas sigue gratis', text: 'Si te ayuda, puedes apoyarnos por Bre-B desde $100. Es voluntario: no cambia nada de la app.', cta: { label: 'Ver cómo apoyar', to: '#apoyar' } },
];
