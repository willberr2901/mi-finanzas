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
  { demo: 'recap', tag: '📊 NUEVO EN INICIO', title: 'Tu mes, en una historia', text: 'Los primeros días de cada mes verás cuánto ahorraste, en qué se fue la plata, qué subió, qué bajó y un consejo.', cta: { label: 'Ver en Inicio', to: '/' } },
  { demo: 'rings', tag: '🎯 PRESUPUESTOS', title: 'Anillos que se llenan', text: 'Cada presupuesto ahora es un anillo: verde vas bien, amarillo cuidado, rojo te pasaste.', cta: { label: 'Ver mis presupuestos', to: '/' } },
  { demo: 'haptics', tag: '📳 MÁS FLUIDA', title: 'La sientes al tocar', text: 'Una vibración suave te confirma cuando guardas un gasto, tachas del mercado o cuentas monedas (en Android).' },
  { demo: 'backup', tag: '💾 TUS DATOS SEGUROS', title: 'Te recordamos tu copia', text: 'Si llevas más de un mes sin respaldo, te avisamos para que guardes una copia cifrada. Si pierdes el celular, recuperas todo.', cta: { label: 'Hacer respaldo', to: '/ajustes?s=respaldo' } },
  { demo: 'support', tag: '☕ APÓYANOS', title: 'Mi Finanzas sigue gratis', text: 'Si te ayuda, puedes apoyarnos por Bre-B desde $100. Es voluntario: no cambia nada de la app.', cta: { label: 'Ver cómo apoyar', to: '#apoyar' } },
];
