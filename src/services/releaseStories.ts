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
  { demo: 'wheel', tag: '🎡 BOTÓN + NUEVO', title: 'La rueda de Kai', text: 'Toca el + y elige en la rueda: gasto, ingreso, mercado, pago fijo o del banco. Toca a Kai en el centro y dile lo que gastaste.', cta: { label: 'Probar la rueda', to: '#mas' } },
  { demo: 'xmas', tag: '🎄 NAVIDAD', title: 'Llega Kai Noel', text: 'Del 1 de diciembre al 6 de enero toda la app se viste de Navidad: nieve, gorritos y la plantilla “Cena de Navidad” en Mercado.', cta: { label: 'Ver plantilla', to: '/mercado?plantilla=navidad' } },
  { demo: 'kai', tag: '🤖 KAI REACCIONA', title: 'Kai siente tu plata', text: 'En Inicio, Kai celebra el día de pago, se preocupa si te pasas, duerme de noche y te muestra tu racha 🔥 de días anotando.', cta: { label: 'Ver mi Inicio', to: '/' } },
  { demo: 'shield', tag: '🛡️ MÁS SEGURA', title: 'Te avisa si alguien intentó entrar', text: 'Si alguien pone mal tu PIN, al abrir te contamos cuántas veces y a qué hora. Y con PIN activo, tus saldos se ocultan al cambiar de app.', cta: { label: 'Activar PIN', to: '/ajustes' } },
  { demo: 'stars', tag: '😍 CALIFÍCANOS', title: 'Desliza y Kai cambia de cara', text: 'Calificar ahora es deslizar: Kai se pone triste o feliz contigo. Puedes marcar lo que te gusta o dictar tu comentario.', cta: { label: 'Calificar', to: '#calificar' } },
  { demo: 'support', tag: '☕ APÓYANOS', title: 'Más fácil apoyar', text: 'Eliges el valor, la llave se copia sola y abres tu banco con un toque. La app sigue gratis: es voluntario.', cta: { label: 'Apoyar', to: '#apoyar' } },
];
