/**
 * ════════════════════════════════════════════════════════════════════
 * ⚖️ POLÍTICA DE PRIVACIDAD Y TÉRMINOS (texto que lee el usuario)
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: Privacidad (/legal) y la ventana de aceptar términos.
 * Si cambias el texto: sube TERMS_VERSION para que la app pida aceptarlo otra vez.
 * Nota: borrador claro y honesto; antes de publicar en Play Store conviene que lo revise un abogado.
 * ════════════════════════════════════════════════════════════════════
 */

export const TERMS_VERSION = '2026-11-07-a';
/** 📮 Contacto oficial de la app (derechos sobre datos, dudas, aportes). Cámbialo aquí y se actualiza en toda la app. */
export const APP_EMAIL = 'mifinanzas.app@gmail.com';
export const APP_OWNER = 'el equipo de Mi Finanzas';
export const APP_CITY = 'Bogotá, Colombia';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-1.5">
    <h3 className="text-white font-semibold text-sm">{title}</h3>
    <div className="text-slate-300 text-[13px] leading-relaxed space-y-1.5">{children}</div>
  </section>
);

export default function LegalContent() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4">
        <p className="text-emerald-300 font-semibold text-sm">En resumen</p>
        <p className="text-slate-200 text-[13px] mt-1 leading-relaxed">
          Mi Finanzas <strong>no recoge, no lee y no vende datos de nadie</strong>. No hay registro ni cuentas.
          Tus finanzas se quedan <strong>solo en tu celular</strong>. Si decides crear un <strong>hogar sincronizado</strong>, la lista del mercado viaja{' '}
          <strong>cifrada de extremo a extremo</strong>: el servidor guarda cajas cerradas que nadie más puede abrir, ni nosotros.
        </p>
      </div>

      <h2 className="text-white text-base font-bold pt-1">Política de privacidad</h2>
      <Section title="1. Qué datos recogemos">
        <p>Ninguno que te identifique. La app no pide nombre real, correo, teléfono, cédula ni datos bancarios, y no tiene cuentas de usuario.</p>
      </Section>
      <Section title="2. Dónde se guarda lo que registras">
        <p>Tus movimientos, listas de mercado, pagos, deudas, metas y facturas se guardan en el almacenamiento interno del navegador de tu celular. No se envían a ningún servidor: ni los creadores de la app ni terceros pueden verlos.</p>
        <p>Ojo: dentro del celular esa información se guarda de forma que no se lee a simple vista, pero <strong>no está protegida con contraseña</strong>. Quien tenga tu celular desbloqueado podría abrir la app. Por eso te recomendamos <strong>activar el PIN</strong> de la app y guardar tus <strong>copias de respaldo</strong>, que sí van cifradas con la contraseña que tú eliges.</p>
        <p>El nombre con el que la app te saluda es opcional y también queda solo en tu celular.</p>
      </Section>
      <Section title="2.1 Cookies y almacenamiento del celular">
        <p>Mi Finanzas <strong>no usa cookies</strong> de publicidad ni de seguimiento. Para funcionar guarda información en el almacenamiento interno del navegador de tu celular: tus registros, tus preferencias (tema, color de Kai, avisos), el PIN cifrado y el registro de intentos fallidos de PIN para avisarte si alguien intentó entrar. Todo eso se queda en tu celular y se borra con «Borrar todos mis datos».</p>
      </Section>
      <Section title="3. Fotos de facturas">
        <p>Cuando escaneas una factura, la imagen se procesa dentro de tu celular. Para leer el texto la app descarga una única vez las herramientas de reconocimiento; tu foto no se envía a ningún servidor.</p>
      </Section>
      <Section title="3.1 Dictado por voz (opcional)">
        <p>Si tocas el micrófono para dictar tu lista de mercado o un gasto, la app usa el reconocimiento de voz que ya trae tu celular o navegador (el mismo del teclado). Ese servicio es de tu sistema: en Android y Chrome lo presta Google y en iPhone lo presta Apple, y puede enviar el audio a sus servidores para convertirlo en texto, según sus propias políticas.</p>
        <p>Mi Finanzas no graba, no guarda y no recibe tu audio: solo recibe el texto, lo interpreta dentro de tu celular y lo guarda junto con el resto de tu información local. El micrófono solo se activa cuando tú lo tocas y se apaga solo al dejar de hablar. Si prefieres no usarlo, puedes escribir como siempre.</p>
      </Section>
      <Section title="3.2 Tiendas donde compras">
        <p>Si eliges dónde hiciste el mercado (D1, la plaza, etc.), ese dato se guarda con tu historial de compras para comparar precios. La imagen de tienda que ves es un dibujo propio de la app, igual para todas; no usamos los logos oficiales de esas marcas, que pertenecen a sus dueños.</p>
      </Section>
      <Section title="3.3 Préstamos con personas">
        <p>Los préstamos que anotas (a quién le debes o quién te debe, cuánto y sus abonos) se guardan solo en tu celular, igual que el resto de tu información (ver punto 2). Si usas "Recordar", la app abre WhatsApp con un mensaje ya escrito: eres tú quien decide enviarlo; Mi Finanzas no envía nada ni conoce a esas personas.</p>
      </Section>
      <Section title="3.4 Cruce de facturas con tu lista">
        <p>Al escanear una factura, la app la compara con tu lista del mercado dentro de tu celular. Las uniones que confirmas (por ejemplo, que "TOSTADAS BIMBO" es tu "Pan tajado") se recuerdan solo en tu celular para cruzar la próxima factura automáticamente.</p>
      </Section>
      <Section title="4. Lo que sí se conecta a internet">
        <p>La descarga de la app y de sus actualizaciones desde el servidor donde está publicada. Ese servidor, como cualquier página web, puede registrar datos técnicos básicos de la visita (como la dirección IP), pero no tus datos financieros.</p>
        <p>Las estadísticas anónimas (punto 6), que puedes apagar, y, solo si tú lo activas, el hogar sincronizado (punto 5) y el dictado por voz del celular (punto 3.1).</p>
      </Section>
      <Section title="4.1 Servicios de terceros que usa la app">
        <p><strong>Render</strong> (Estados Unidos): publica la app y sus actualizaciones.</p>
        <p><strong>Supabase</strong> (servidor en São Paulo, Brasil): guarda las cajas cifradas del hogar sincronizado, las sumas anónimas de estadísticas y las opiniones que envías.</p>
        <p><strong>Reconocimiento de voz de Google o Apple</strong>: solo si tocas el micrófono (punto 3.1).</p>
        <p><strong>Enlaces a otras apps</strong> (WhatsApp, Instagram, Google Calendar y apps de bancos como Nequi, Daviplata o Bancolombia): la app solo las abre cuando tú tocas el botón; lo que hagas allá se rige por las políticas de cada una. Mi Finanzas no tiene acuerdos con esas empresas ni usa sus logos.</p>
        <p>La app no tiene publicidad ni herramientas de rastreo de terceros.</p>
      </Section>
      <Section title="5. Hogar sincronizado (opcional)">
        <p>Sirve para compartir la lista de mercado, el historial de compras y los precios con las personas de tu hogar. Está apagado hasta que tú creas un hogar o te unes a uno.</p>
        <p><strong>Cómo te protege:</strong> cada cambio se cifra en tu celular con AES-256 usando una llave que solo existe en los celulares del hogar (viaja dentro del código QR o del enlace de invitación, en una parte que nunca se envía a ningún servidor). Al servidor solo llega texto cifrado, sin nombres de productos, precios, nombres de personas, correos ni teléfonos. Ni los creadores de la app ni el proveedor del servidor pueden leerlo.</p>
        <p><strong>Deudas compartidas (opcional):</strong> si aceptas sincronizar deudas con tu hogar, solo las que tú marcas (nombre, valor, cuotas y fecha de pago) viajan con el mismo cifrado. Las demás quedan solo tuyas.</p>
        <p><strong>Qué no se comparte:</strong> tus ingresos, gastos, metas, facturas y las deudas que no marcaste nunca salen de tu celular.</p>
        <p><strong>Dónde y cuánto tiempo:</strong> las cajas cifradas se guardan en un servidor de Supabase en São Paulo (Brasil). Se borran solas si nadie usa el hogar durante 60 días, y puedes borrarlas cuando quieras en Mercado → Hogar → «Borrar del servidor». Como cualquier servicio en internet, el servidor ve datos técnicos de la conexión (como la dirección IP) mientras sincroniza.</p>
        <p><strong>Tu responsabilidad:</strong> quien tenga el código del hogar puede ver y editar la lista. Compártelo solo con personas de tu confianza.</p>
      </Section>
      <Section title="6. Estadísticas anónimas">
        <p>Para saber cuántas personas usan la app, cada celular suma +1 al servidor la primera vez que abre la app, cuando la instala y máximo una vez al día si la usa. Además, máximo una vez al día, se suma <strong>cuántos</strong> productos se agregaron al mercado y <strong>cuántos</strong> gastos se registraron (solo el número, sin montos, nombres ni categorías). Solo se envía: el tipo de evento, si el celular es Android, iPhone o computador, si la app está instalada o en el navegador, y el código del enlace con el que llegaste (si alguien te la compartió).</p>
        <p>No se envía tu nombre, correo, teléfono, montos, listas ni ningún identificador de tu celular: el servidor solo guarda sumas por día y no puede saber quién es quién. Puedes apagarlas en Ajustes → Tus datos → Estadísticas anónimas.</p>
      </Section>
      <Section title="7. Opiniones">
        <p>Si decides darnos tu opinión, se envía solo lo que escribes o dictas: la calificación, lo que te gusta, lo que mejorarías, la parte de la app y, si quieres, un nombre o apodo. También se guarda el tipo de celular y la versión de la app para entender el comentario. No escribas datos personales como teléfono, cédula o cuentas. Las opiniones solo las ve el equipo de Mi Finanzas.</p>
      </Section>
      <Section title="7.1 Notificaciones">
        <p>Los recordatorios de pagos los genera tu propio celular a partir de lo que registraste. Puedes desactivarlos en cualquier momento desde la configuración del navegador.</p>
        <p>Si tienes los avisos activados, tu celular también revisa de vez en cuando si hay una versión nueva de la app (solo descarga el número de versión, igual que al abrirla) y te muestra un aviso. No se envía ningún dato tuyo. Puedes apagarlo en Ajustes → Recordatorios → Avisos de nuevas versiones.</p>
      </Section>
      <Section title="8. Tus derechos y cómo borrar todo">
        <p>Como tus datos solo están en tu celular, tú tienes el control total. En Ajustes → «Borrar todos mis datos» se elimina todo de forma permanente. Si desinstalas la app o borras los datos del navegador, la información también se elimina.</p>
        <p>Si usas el hogar sincronizado, en Mercado → Hogar puedes salir del hogar o borrarlo del servidor.</p>
        <p>Puedes exportar un respaldo en PDF o Excel desde Finanzas cuando quieras.</p>
      </Section>
      <Section title="9. Seguridad">
        <p>La app se protege contra ataques comunes: solo ejecuta su propio código (bloquea código inyectado), no se deja meter dentro de otras páginas, avisa si la abres desde una dirección falsa, guarda el PIN cifrado y limita los intentos, te avisa si alguien intentó entrar con un PIN equivocado, oculta la pantalla al cambiar de app (con PIN activo), revisa los respaldos antes de abrirlos y usa conexiones seguras (HTTPS). Ninguna app es 100% invulnerable; te recomendamos activar el PIN.</p>
      </Section>
      <Section title="10. Ley colombiana">
        <p>Esta política sigue la Ley 1581 de 2012 de protección de datos personales. La app no recoge datos que identifiquen a las personas; la información del hogar sincronizado viaja y se guarda cifrada de forma que nadie distinto a los celulares del hogar puede leerla.</p>
      </Section>
      <Section title="11. Responsable y contacto">
        <p>Responsable: {APP_OWNER}, {APP_CITY}.</p>
        <p>Para preguntas, quejas o para ejercer tus derechos (conocer, actualizar, corregir o borrar información, o retirar tu autorización) escríbenos a <a className="text-brand-lime font-semibold underline" href={`mailto:${APP_EMAIL}`}>{APP_EMAIL}</a>. Respondemos en máximo 15 días hábiles. Si no quedas conforme, puedes acudir a la Superintendencia de Industria y Comercio (SIC).</p>
        <p>Como casi todo vive solo en tu celular, para borrar tus datos no necesitas escribirnos: usa Ajustes → «Borrar todos mis datos». Las opiniones que enviaste sí podemos borrarlas si nos escribes.</p>
      </Section>

      <h2 className="text-white text-base font-bold pt-2">Términos y condiciones</h2>
      <Section title="1. Para qué sirve la app">
        <p>Mi Finanzas es una herramienta gratuita para organizar las finanzas del hogar: mercado, ingresos, gastos, pagos y deudas. Los cálculos y clasificaciones son una ayuda y no reemplazan la asesoría de un profesional financiero o contable.</p>
      </Section>
      <Section title="2. Tu responsabilidad">
        <p>Tú decides qué registras y cómo usas la información. Te recomendamos hacer respaldos periódicos, porque si se borran los datos del navegador o se pierde el celular, la información no se puede recuperar desde ningún servidor.</p>
      </Section>
      <Section title="3. Sin garantías">
        <p>La app se ofrece tal como está. Trabajamos para que los cálculos sean correctos, pero pueden existir errores. Revisa siempre las cifras importantes antes de tomar decisiones.</p>
      </Section>
      <Section title="4. Cambios">
        <p>Si estos términos cambian, la app te los mostrará de nuevo para que los aceptes.</p>
      </Section>
      <Section title="5. Apóyanos (aportes voluntarios)">
        <p>Mi Finanzas es y seguirá siendo gratis. «Apóyanos» es un aporte <strong>voluntario</strong> que haces desde tu propio banco a la llave Bre-B del creador de la app. La app no procesa pagos, no ve tu banco y no sabe si aportaste.</p>
        <p>El aporte no compra nada ni desbloquea funciones: el sello «Aliado» y el Kai dorado son solo un agradecimiento. No es una donación con beneficio tributario. Si aportaste por error, escríbenos al correo de contacto y lo revisamos.</p>
      </Section>
      <Section title="6. Edad">
        <p>La app está pensada para personas mayores de 18 años. Si eres menor de edad, úsala con permiso y acompañamiento de tu mamá, papá o acudiente, y no hagas aportes en Apóyanos sin su autorización.</p>
      </Section>
      <Section title="7. Contacto">
        <p>Escríbenos a <a className="text-brand-lime font-semibold underline" href={`mailto:${APP_EMAIL}`}>{APP_EMAIL}</a>.</p>
      </Section>
      <p className="text-[11px] text-slate-500 pt-2">Versión {TERMS_VERSION}</p>
    </div>
  );
}
