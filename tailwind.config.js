/** @type {import('tailwindcss').Config} */
// Paleta de marca Mi Finanzas: azul noche + verde lima.
// Los tonos "slate" se vuelven azul noche y los acentos (violet, purple, indigo,
// fuchsia, cyan, emerald) pasan a la familia lima, así toda la app usa la marca.
const navy = {
  50: '#F4F6FB', 100: '#E7EAF4', 200: '#CDD2E6', 300: '#C3C8DA', 400: '#9AA2C0',
  500: '#6A7396', 600: '#454F78', 700: '#2C3560', 800: '#1A2140', 900: '#0F1530', 950: '#070B18',
};
const lime = {
  50: '#F8FEE6', 100: '#EFFCC6', 200: '#E2FA94', 300: '#D4F75F', 400: '#C6F432',
  500: '#C6F432', 600: '#B4E01F', 700: '#88AD12', 800: '#5F7A10', 900: '#43560E', 950: '#232E05',
};
const limeGreen = {
  50: '#F3FDE8', 100: '#E4FBCB', 200: '#CCF59E', 300: '#B6EE74', 400: '#A3E64F',
  500: '#8FD63A', 600: '#73B52A', 700: '#578C22', 800: '#456E1F', 900: '#3A5C1E', 950: '#1D330B',
};
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: navy,
        violet: lime, purple: lime, indigo: lime, fuchsia: lime,
        cyan: limeGreen, emerald: limeGreen,
        brand: { lime: '#C6F432', navy: '#0B1026', navy2: '#1A2140', ink: '#070B18' },
      },
    },
  },
  plugins: [],
};
