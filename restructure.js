const fs = require('fs');
const path = require('path');

console.log('🔄 Reestructurando proyecto Mi Finanzas...\n');

// Crear estructura de backend
const backendStructure = {
  'backend/src/config': ['database.ts', 'security.ts'],
  'backend/src/models': ['User.ts', 'Transaction.ts', 'MarketItem.ts', 'Receipt.ts'],
  'backend/src/routes': ['auth.routes.ts', 'transactions.routes.ts', 'market.routes.ts', 'receipts.routes.ts'],
  'backend/src/middleware': ['auth.middleware.ts', 'validation.middleware.ts'],
  'backend/src/controllers': ['auth.controller.ts', 'transactions.controller.ts', 'market.controller.ts'],
};

// Crear estructura de frontend
const frontendStructure = {
  'src/api': ['client.ts'],
  'src/components': [],
  'src/contexts': ['ThemeContext.tsx', 'AuthContext.tsx'],
  'src/hooks': ['useAuditLog.ts', 'useAuth.ts'],
  'src/pages': ['HomePage.tsx', 'FinancePage.tsx', 'MarketPage.tsx', 'ReceiptScannerPage.tsx', 'ReceiptHistoryPage.tsx', 'CreditPage.tsx', 'SettingsPage.tsx', 'LoginPage.tsx', 'RegisterPage.tsx'],
  'src/services': ['notificationService.ts', 'ocrService.ts', 'creditService.ts'],
  'src/store': ['marketStore.ts', 'financeStore.ts'],
  'src/utils': ['security.ts', 'validators.ts'],
};

// Crear carpetas backend
Object.keys(backendStructure).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Creado: ${dir}`);
  }
});

// Crear carpetas frontend
Object.keys(frontendStructure).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Creado: ${dir}`);
  }
});

// Eliminar archivos obsoletos
const filesToDelete = [
  'src/pages/AirQualityPage.tsx',
  'src/pages/RoutesPage.tsx',
  'src/services/airQualityService.ts',
  'src/services/routeService.ts',
  'src/services/tollDatabase.ts',
];

filesToDelete.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`🗑️  Eliminado: ${file}`);
  }
});

console.log('\n✅ Reestructuración completada!\n');
console.log('📦 Ahora crea los archivos con el código que te proporcionaré...\n');