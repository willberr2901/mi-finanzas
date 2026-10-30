# 🗺️ Mapa del código de Mi Finanzas

Esta guía es para ubicar rápido **dónde está cada parte de la app** y **qué se afecta si la cambias**.
Cada archivo empieza con una cabecera en español así:

```
/**
 * ════════════════════════════
 * 🛒 NOMBRE DE LA PIEZA
 * Qué hace: …
 * Dónde se ve: …
 * Si lo cambias: …
 * ════════════════════════════
 */
```

Dentro de los archivos grandes, las partes van separadas con `// ═══ SECCIÓN: … ═══`.
Busca la palabra **SECCIÓN** (Ctrl+F) para saltar entre ellas.

---

## 1. ¿Qué quiero cambiar? → ¿Dónde está?

| Quiero cambiar… | Archivo |
|---|---|
| Colores de la marca, tema claro/oscuro | `src/index.css` y `tailwind.config.js` |
| Logo | `src/components/ui/AppLogo.tsx` |
| Nombre, ícono o ayuda de un módulo del menú | `src/utils/modules.ts` |
| Encabezado de cada pantalla (menú, Guíame, campana) | `src/components/ui/ModuleHeader.tsx` |
| Pantalla **Inicio** | `src/pages/HomePage.tsx` |
| Pantalla **Mercado** | `src/pages/MarketPage.tsx` + `src/components/market/` |
| Lógica del mercado (tachar, extras, precios, historial, tiendas) | `src/services/market/marketStore.ts` |
| 🎃 Entrada de terror de Halloween (calabaza, voz `src/assets/voz-halloween.mp3`) | `src/components/season/HalloweenIntro.tsx` |
| 🎃🎄 Temas de temporada (fechas, colores, adornos, aviso) | `src/services/season.ts` + `src/components/season/Season.tsx` + colores y animaciones (alas, calabazas, araña) al final de `src/index.css` |
| 💚 Salud financiera (puntaje y consejos) | `src/services/healthScore.ts` + `src/components/home/HealthCard.tsx` |
| 🧾 Entender facturas escaneadas (comercio, fecha, productos, total, pago) | `src/services/receipt/receiptParser.ts` (la foto se lee en `src/services/ocrService.ts`) |
| 🎤 Dictar por voz (mercado y gastos) | `src/components/voice/VoiceSheet.tsx` + `src/services/voice/` (`speech.ts` micrófono, `parseVoice.ts` entiende la frase) |
| 🏪 Tiendas (elegir, distintivo, comparar precios) | `src/components/market/StorePicker.tsx`, `StoreBadge.tsx`, `MarketHistory.tsx` (Precios → Por tienda) |
| **Hogar sincronizado** (QR, unirse, salir) | `src/components/household/HouseholdSheet.tsx` |
| Sincronización cifrada | `src/services/household/householdSync.ts` y `householdCrypto.ts` |
| Pantalla **Finanzas** (movimientos, metas, reportes) | `src/pages/FinancePage.tsx` |
| Pantalla **Pagos** | `src/pages/BillsPage.tsx` + `src/components/bills/` |
| 🤝 Módulo **Préstamos** (Me deben / Yo debo, abonos, recordar por WhatsApp) | `src/pages/LoansPage.tsx` + `src/services/loansService.ts` |
| 🗂️ Categorías automáticas del mercado, catálogo para agregar con un toque y cruce factura ↔ lista | `src/services/market/categories.ts` |
| 🧾⇄🛒 Avisos de sincronización de la factura con la lista | `src/components/market/ReceiptSync.tsx` |
| 🔔 Aviso de préstamos al abrir la app (pagar / cobrar) | `src/components/loans/LoanReminder.tsx` · avisos con la app cerrada en `src/sw.ts` (checkLoans) |
| ✅ Lista de revisión antes de publicar (cada viernes) | `docs/CHECKLIST-PUBLICACION.md` · `npm run revisar` · pruebas de lo esencial en `src/__tests__/esenciales.test.ts` |
| Pantalla **Ajustes** | `src/pages/SettingsPage.tsx` |
| Escáner de facturas | `src/pages/ReceiptScannerPage.tsx` + `src/services/ocrService.ts` |
| Diseño de los avisos de arriba (toasts) | `src/components/notifications/ToastCard.tsx` |
| Qué avisos salen en la campana | `src/services/alertsService.ts` |
| Ventanas de Sí / No | `src/components/ui/ConfirmDialog.tsx` |
| Hojas que suben desde abajo | `src/components/ui/BottomSheet.tsx` |
| Texto de privacidad y términos | `src/components/legal/LegalContent.tsx` |
| Número de versión y novedades | `src/version.ts` |
| Botón e instrucciones para **descargar la app** | `src/components/pwa/InstallAppSheet.tsx` |
| Pantalla **Tu privacidad y tu seguridad** | `src/components/security/SecurityCenter.tsx` |
| Protecciones al arrancar (páginas falsas, marcos) | `src/utils/hardening.ts` |
| **Instagram** (botón y tarjeta de logro) | `src/components/social/Instagram.tsx` |
| Estadísticas anónimas | `src/services/statsService.ts` |
| Pantalla **Reportes** (solo administradora) | `src/pages/ReportsPage.tsx` |
| Revisión de seguridad completa | `docs/SEGURIDAD.md` |
| Ventana **"Danos tu opinión"** | `src/components/feedback/FeedbackSheet.tsx` |
| **Opiniones** en Reportes | `src/components/feedback/FeedbackReport.tsx` |
| Archivos de **Excel** (.xlsx) | `src/utils/xlsx.ts` (y `services/exportService.ts`) |
| Reporte PDF / Excel | `src/services/exportService.ts` |

---

## 2. Carpetas

```
src/
├── App.tsx              🧭 Rutas y piezas que están en toda la app
├── main.tsx             🚀 Arranque
├── index.css            🎨 Colores y estilos globales
├── version.ts           🏷️ Versión y novedades
├── sw.ts                ⚙️ Funciona sin internet + avisos del celular
│
├── pages/               📱 Una pantalla por archivo
│   ├── HomePage         🏠 Inicio
│   ├── MarketPage       🛒 Mercado (Lista · Historial · Precios)
│   ├── FinancePage      💰 Finanzas
│   ├── BillsPage        📅 Pagos
│   ├── LoansPage        🤝 Préstamos (Me deben · Yo debo)
│   ├── SettingsPage     ⚙️ Ajustes
│   ├── ReceiptScannerPage 📷 Escáner
│   ├── ReceiptHistoryPage 🧾 Facturas
│   ├── ReportsPage      📊 Reportes (solo administradora)
│   └── LegalPage        ⚖️ Privacidad
│
├── components/          🧱 Piezas de pantalla
│   ├── market/          🛒 Producto, terminar mercado, historial, flechitas de precio, tiendas
│   ├── voice/           🎤 Hoja de dictado por voz
│   ├── household/       🏠 Hogar sincronizado
│   ├── notifications/   🔔 Campana y diseño de avisos
│   ├── bills/           📅 Formulario de pagos y Cuentas claras
│   ├── home/            🏠 Tarjetas de Inicio
│   ├── ui/              🧩 Piezas base (encabezado, dinero, Sí/No, hojas)
│   ├── quick/           📋 Registrar desde notificación del banco
│   ├── share/           💚 Recomendar la app
│   ├── tour/            🧭 Guías "Guíame"
│   ├── pwa/             ⬆️ Aviso de actualización y novedades
│   ├── welcome/         👋 Bienvenida
│   ├── security/        🛡️ Pantalla de privacidad y seguridad
│   ├── social/          📸 Instagram
│   └── legal/           ⚖️ Textos legales
│
├── services/            🧠 Lógica (no dibuja nada)
│   ├── market/          🛒 Datos del mercado
│   ├── voice/           🎤 Micrófono y "entender" lo dictado (sin internet)
│   ├── household/       🏠 Sincronización cifrada
│   ├── alertsService    🚨 Avisos de la campana
│   ├── notificationService 🔔 notify() para mostrar avisos
│   ├── billsService     📅 Estados de pagos
│   ├── exportService    📄 PDF y Excel
│   ├── ocrService       🔍 Leer facturas
│   └── bankTextParser   🏦 Leer notificaciones del banco
│
├── contexts/            🔐 Seguridad (PIN) y 🌗 Tema
└── utils/               🔧 Herramientas (formato de pesos, base de datos, preferencias)

supabase/sync.sql        🏠 Copia de lo que hay en el servidor del hogar (solo cajas cifradas)
```

---

## 3. Dónde se guardan los datos

| Qué | Dónde | ¿Sale del celular? |
|---|---|---|
| Ingresos, gastos, metas, pagos, deudas | Base del celular (`utils/database.ts`) | ❌ Nunca |
| Preferencias (día de pago, nombres, tema…) | `utils/prefs.ts` | ❌ Nunca |
| Lista de mercado, historial de compras y precios | `services/market/marketStore.ts` | 🔐 Solo si creas un hogar, **cifrado** |
| Llave del hogar | Solo en los celulares (dentro del QR) | ❌ Nunca va al servidor |
| Estadísticas | +1 anónimo por día (`services/statsService.ts`) | 📊 Solo sumas, se puede apagar |

---

## 4. Antes de publicar un cambio

1. Corre `npm test` (pruebas automáticas en `src/__tests__/`: voz, facturas, mensajes del banco, salud financiera y temporadas). Todo debe salir en verde.
2. Sube el número en `src/version.ts` y escribe las novedades.
3. Si cambiaste textos legales, sube `TERMS_VERSION` en `LegalContent.tsx`.
4. Al subir a `main`, la app se publica sola y a todos les sale el aviso de actualización.
