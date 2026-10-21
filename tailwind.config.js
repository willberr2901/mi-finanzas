/** @type {import('tailwindcss').Config} */
// Paleta de marca Mi Finanzas: azul noche + verde lima.
// Todos los colores salen de variables CSS (src/index.css) para que el tema claro
// y el oscuro cambien la app completa. Los acentos violet/purple/indigo/fuchsia
// son la familia lima y cyan/emerald la lima-verde.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix) => Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(k => [k, v(`${prefix}-${k}`)]));
const navy = scale('navy');
const lime = scale('lime');
const limeGreen = scale('lgreen');
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: v('c-white'),
        slate: navy, gray: navy,
        violet: lime, purple: lime, indigo: lime, fuchsia: lime,
        cyan: limeGreen, emerald: limeGreen,
        surface: v('c-surface'), surface2: v('c-surface2'), appbg: v('c-appbg'),
        brand: { lime: v('brand'), navy: '#0B1026', navy2: '#1A2140', ink: '#070B18' }, // brand-lime cambia con la temporada (src/index.css → .season-*)
      },
    },
  },
  plugins: [],
};
