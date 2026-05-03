const fs = require('fs');
const path = require('path');

// Crear directorio public si no existe
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Crear un SVG simple como placeholder (esto servirá como ícono temporal)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect fill="#1e293b" width="512" height="512" rx="60"/>
  <text fill="white" font-size="200" font-family="Arial" font-weight="bold" x="50%" y="55%" text-anchor="middle">MF</text>
  <path fill="#10b981" d="M256 80c-97 0-176 79-176 176s79 176 176 176 176-79 176-176S353 80 256 80zm0 320c-79 0-144-65-144-144s65-144 144-144 144 65 144 144-65 144-144 144z"/>
  <path fill="#10b981" d="M360 240l-120 80-60-40-40 40 100 60 160-100z"/>
</svg>
`;

// Escribir el SVG en public
fs.writeFileSync('public/icons.svg', svgIcon);

console.log('✅ Íconos PWA generados en public/icons.svg');