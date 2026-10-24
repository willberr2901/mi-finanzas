/**
 * ════════════════════════════════════════════════════════════════════
 * ⚖️ POLÍTICA DE PRIVACIDAD Y TÉRMINOS (texto que lee el usuario)
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: Privacidad (/legal) y la ventana de aceptar términos.
 * Si cambias el texto: sube TERMS_VERSION para que la app pida aceptarlo otra vez.
 * Nota: borrador claro y honesto; antes de publicar en Play Store conviene que lo revise un abogado.
 * ════════════════════════════════════════════════════════════════════
 */

export const TERMS_VERSION = '2026-10-19-a';

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
          Tus finanzas se quedan <strong>solo en tu celular</strong>. Si decides crear un <strong>hogar sincronizado</strong>, la lista del mercado viaja
          <strong>cifrada de extremo a extremo</strong>: el servidor guarda cajas cerradas que nadie más puede abrir, ni nosotros.
        </p>
      </div>

      <h2 className="text-white text-base font-bold pt-1">Política de privacidad</h2>
      <Section title="1. Qué datos recogemos">
        <p>Ninguno que te identifique. La app no pide nombre real, correo, teléfono, cédula ni datos bancarios, y no tiene cuentas de usuario.</p>
      </Section>
      <Section title="2. Dónde se guarda lo que registras">
        <p>Tus movimientos, listas de mercado, pagos, deudas, metas y facturas se guardan en el almacenamiento interno del navegador de tu celular. Nadie más tiene acceso: ni los creadores de la app ni terceros.</p>
        <p>El nombre con el que la app te saluda es opcional y también queda solo en tu celular.</p>
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
        <p>Los préstamos que anotas (a quién le debes o quién te debe, cuánto y sus abonos) se guardan solo en tu celular, cifrados, como el resto de tu información. Si usas "Recordar", la app abre WhatsApp con un mensaje ya escrito: eres tú quien decide enviarlo; Mi Finanzas no envía nada ni conoce a esas personas.</p>
      </Section>
      <Section title="3.4 Cruce de facturas con tu lista">
        <p>Al escanear una factura, la app la compara con tu lista del mercado dentro de tu celular. Las uniones que confirmas (por ejemplo, que "TOSTADAS BIMBO" es tu "Pan tajado") se recuerdan solo en tu celular para cruzar la próxima factura automáticamente.</p>
      </Section>
      <Section title="4. Lo que sí se conecta a internet">
        <p>La descarga de la app y de sus actualizaciones desde el servidor donde está publicada. Ese servidor, como cualquier página web, puede registrar datos técnicos básicos de la visita (como la dirección IP), pero no tus datos financieros.</p>
        <p>Las estadísticas anónimas (punto 6), que puedes apagar, y, solo si tú lo activas, el hogar sincronizado (punto 5) y el dictado por voz del celular (punto 3.1).</p>
      </Section>
      <Section title="5. Hogar sincronizado (opcional)">
        <p>Sirve para compartir la lista de mercado, el historial de compras y los precios con las personas de tu hogar. Está apagado hasta que tú creas un hogar o te unes a uno.</p>
        <p><strong>Cómo te protege:</strong> cada cambio se cifra en tu celular con AES-256 usando una llave que solo existe en los celulares del hogar (viaja dentro del código QR o del enlace de invitación, en una parte que nunca se envía a ningún servidor). Al servidor solo llega texto cifrado, sin nombres de productos, precios, nombres de personas, correos ni teléfonos. Ni los creadores de la app ni el proveedor del servidor pueden leerlo.</p>
        <p><strong>Qué no se comparte:</strong> tus ingresos, gastos, pagos, deudas, metas y facturas nunca salen de tu celular.</p>
        <p><strong>Dónde y cuánto tiempo:</strong> las cajas cifradas se guardan en un servidor de Supabase en São Paulo (Brasil). Se borran solas si nadie usa el hogar durante 60 días, y puedes borrarlas cuando quieras en Mercado → Hogar → «Borrar del servidor». Como cualquier servicio en internet, el servidor ve datos técnicos de la conexión (como la dirección IP) mientras sincroniza.</p>
        <p><strong>Tu responsabilidad:</strong> quien tenga el código del hogar puede ver y editar la lista. Compártelo solo con personas de tu confianza.</p>
      </Section>
      <Section title="6. Estadísticas anónimas">
        <p>Para saber cuántas personas usan la app, cada celular suma +1 al servidor la primera vez que abre la app, cuando la instala y máximo una vez al día si la usa. Solo se envía: el tipo de evento, si el celular es Android, iPhone o computador, si la app está instalada o en el navegador, y el código del enlace con el que llegaste (si alguien te la compartió).</p>
        <p>No se envía tu nombre, correo, teléfono, montos, listas ni ningún identificador de tu celular: el servidor solo guarda sumas por día y no puede saber quién es quién. Puedes apagarlas en Ajustes → Tus datos → Estadísticas anónimas.</p>
      </Section>
      <Section title="7. Opiniones">
        <p>Si decides darnos tu opinión, se envía solo lo que escribes: las estrellas, lo que te gusta, lo que mejorarías, la parte de la app y, si quieres, un nombre o apodo. También se guarda el tipo de celular y la versión de la app para entender el comentario. No escribas datos personales como teléfono, cédula o cuentas. Las opiniones solo las ve el equipo de Mi Finanzas.</p>
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
        <p>La app se protege contra ataques comunes: solo ejecuta su propio código (bloquea código inyectado), no se deja meter dentro de otras páginas, avisa si la abres desde una dirección falsa, guarda el PIN cifrado y limita los intentos, revisa los respaldos antes de abrirlos y usa conexiones seguras (HTTPS). Ninguna app es 100% invulnerable; te recomendamos activar el PIN.</p>
      </Section>
      <Section title="10. Ley colombiana">
        <p>Esta política se inspira en la Ley 1581 de 2012 de protección de datos personales. La app no recoge datos que identifiquen a las personas; la información del hogar sincronizado viaja y se guarda cifrada de forma que nadie distinto a los celulares del hogar puede leerla.</p>
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
      <p className="text-[11px] text-slate-500 pt-2">Versión {TERMS_VERSION}</p>
    </div>
  );
}
