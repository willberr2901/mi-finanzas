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
  { demo: 'kai', tag: '🤖 CONOCE A KAI', title: 'Tu asistente de presupuesto', text: 'Kai te pregunta tu sueldo, tus deudas y cuánto quieres ahorrar, y arma tu presupuesto. Si hoy no alcanza, te ayuda a liberar deuda primero. Déjalo presionado para cambiarlo a negro.', cta: { label: 'Armar mi presupuesto', to: '#kai' } },
  { demo: 'rings', tag: '🏠 NUEVO INICIO', title: 'Todo en una pantalla', text: 'Tus anillos del mes, 8 íconos para todo y lo más importante “Para hoy”. El detalle completo está en Ver análisis. Los mismos anillos salen en tu PDF y tu Excel.', cta: { label: 'Ver mi Inicio', to: '/' } },
  { demo: 'notif', tag: '🔔 AVISOS QUE REGISTRAN', title: 'Anota desde la notificación', text: 'El día de pago registras tu sueldo con un toque, “Ya lo pagué” marca tus cuotas y cada noche te pregunta si gastaste algo. Tú eliges qué y a qué hora.', cta: { label: 'Elegir mis avisos', to: '/ajustes' } },
  { demo: 'debts', tag: '🔄 DEUDAS DEL HOGAR', title: 'Comparte tus cuotas', text: 'Sincroniza tus deudas con tu hogar: la otra persona aprueba y, cuando alguien paga, el otro lo ve al instante. Todo cifrado.', cta: { label: 'Ir a Pagos', to: '/pagos' } },
  { demo: 'rings', tag: '✨ MÓDULOS', title: 'Un menú con vida', text: 'Toca ☰ y cada módulo te cuenta cómo va: cuánto te queda, qué falta por pagar y qué falta por comprar.', cta: { label: 'Abrir módulos', to: '/' } },
  { demo: 'recap', tag: '📊 TU MES', title: 'Tu mes, en una historia', text: 'Los primeros días de cada mes verás cuánto ahorraste, qué subió, qué bajó y un consejo.', cta: { label: 'Ver en Inicio', to: '/' } },
];
