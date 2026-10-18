# 🛡️ Revisión de seguridad de Mi Finanzas (v1.8.0 · octubre 2026)

Comparamos la app contra los tipos de ataque más comunes de los últimos años
(lista **OWASP Top 10** y los casos típicos de apps web y de apps hechas con IA).
Para cada uno: qué es, cómo estaba la app y qué se hizo.

| # | Ataque | Qué es (en sencillo) | Estado en Mi Finanzas | Qué se hizo en v1.8 |
|---|---|---|---|---|
| 1 | **Código inyectado (XSS)** | Meter un programa dentro de un texto o enlace para robar lo que hay en la app | React muestra todo como texto; no se usa `innerHTML` ni `eval` | ✅ Política de seguridad (CSP) también **dentro de la página**, no solo en el servidor: solo se ejecuta código propio |
| 2 | **Páginas clonadas / phishing** | Copiar la app en otra dirección para engañar | Sin protección | ✅ Alerta roja si la app se abre desde una dirección que no es la oficial |
| 3 | **Marcos invisibles (clickjacking)** | Poner la app transparente encima de otra página para que toques botones sin saber | Cabecera `frame-ancestors 'none'` en el servidor | ✅ Además, la app se oculta sola si alguien la mete dentro de otra página |
| 4 | **Robo de datos guardados** | Leer los datos del celular | Todo queda en el celular; PIN opcional | Se recomienda el PIN en la pantalla de seguridad (con revisión en vivo) |
| 5 | **Adivinar el PIN (fuerza bruta)** | Probar PINs hasta acertar | PIN con hash PBKDF2-SHA256 (210.000 vueltas) + sal y bloqueo por intentos | Sin cambios: ya cumplía la recomendación OWASP |
| 6 | **Respaldos falsos o archivos maliciosos** | Un archivo que bloquea o daña la app | Respaldo cifrado AES-256-GCM con contraseña | ✅ Límite de tamaño antes de abrir un respaldo |
| 7 | **Inyección de fórmulas en Excel (CSV)** | Un texto como `=HIPERVINCULO(...)` que se ejecuta al abrir el reporte | Sin protección | ✅ Los textos que empiezan por `= + - @` se guardan como texto |
| 8 | **Librerías con fallas conocidas** | Usar piezas de código con huecos públicos | 7 fallas (2 altas) en dependencias, varias piezas sin uso | ✅ 11 dependencias sin uso eliminadas, `react-router` actualizado: **0 fallas en lo que llega al celular** (`npm audit --omit=dev`) |
| 9 | **Secretos expuestos (típico de apps hechas con IA)** | Claves privadas del servidor dentro del código | Revisado todo el historial de GitHub | ✅ No hay claves privadas. La única llave del código es la *publicable* del servidor cifrado, que solo permite usar 5 funciones |
| 10 | **Bases de datos abiertas (típico de apps hechas con IA)** | Tablas que cualquiera puede leer | Proyecto viejo `finanzas-hogar` con datos sin cifrar | ✅ Pausado. Servidor nuevo: tablas en un esquema privado, con RLS y sin políticas: solo se accede por funciones que validan todo |
| 11 | **Abuso del servidor (spam / llenar el disco)** | Mandar millones de datos falsos | Límite por hogar | ✅ Máx. 300 hogares nuevos por hora, cajas de máx. 60.000 caracteres, 6.000 cajas por hogar, borrado automático a los 60 días |
| 12 | **Espiar la sincronización** | Leer lo que viaja por internet o lo que hay en el servidor | Cifrado de extremo a extremo AES-256-GCM; la llave viaja solo en el QR (después de `#`, nunca llega al servidor) | Sin cambios |
| 13 | **Fugas por la dirección web** | Datos en la URL que quedan en registros | El texto compartido desde el banco se procesa en el celular | ✅ `no-referrer` también dentro de la página; el código de invitación `?r=` se borra de la dirección apenas se lee |
| 14 | **Conexión sin cifrar (HTTP)** | Espiar la red Wi-Fi | HSTS en el servidor | ✅ Si alguien abre `http://`, la app salta sola a `https://` |
| 15 | **Clave de administradora** | Entrar a Reportes sin permiso | — | ✅ La clave no está en el código ni en el servidor (solo su huella SHA-256), es aleatoria de 132 bits y cada intento fallido espera 1,5 s |

## Lo que NO se puede prometer (honestidad)

- Ninguna app es 100% invulnerable. Si el celular está desbloqueado en manos de otra persona o tiene un virus, puede ver la app: por eso el **PIN**.
- Una página clonada podría quitar la alerta roja de su copia; la protección real para el usuario es abrir siempre la dirección oficial o la app instalada.
- Las herramientas de desarrollo (no llegan al celular) aún tienen avisos menores de `npm audit`; se actualizarán cuando se migre Vite a la versión 6.

## Qué datos salen del celular

| Qué | Cuándo | ¿Identifica a la persona? |
|---|---|---|
| Lista de mercado, compras y precios | Solo si creas un hogar | No: viaja cifrada, nadie más la puede leer |
| +1 anónimo (abrió / instaló / activo hoy, plataforma, código de enlace) | Si las estadísticas están encendidas | No: solo sumas por día |
| Todo lo demás (finanzas, pagos, deudas, metas, facturas, PIN) | Nunca | — |

## Revisiones recomendadas

1. Cada 3 meses: `npm audit --omit=dev` debe decir **0 vulnerabilidades**.
2. Antes de Play Store: revisión de la política por un abogado.
3. Si cambias de dominio: agrégalo en `src/utils/hardening.ts` (OFFICIAL_HOSTS) y en las cabeceras de `vercel.json` / `render.yaml`.
