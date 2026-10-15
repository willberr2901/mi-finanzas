// Texto legal de la app. Escrito para una app que NO recoge datos de nadie:
// todo se guarda en el celular de cada persona.
// Nota: es un borrador claro y honesto; antes de un lanzamiento comercial conviene que lo revise un abogado.

export const TERMS_VERSION = '2026-10';

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
          Mi Finanzas <strong>no recoge, no guarda y no vende datos de nadie</strong>. No hay registro, ni cuentas, ni servidores con tu información.
          Todo lo que escribes se queda <strong>solo en tu celular</strong> y tú lo puedes borrar cuando quieras.
        </p>
      </div>

      <h2 className="text-white text-base font-bold pt-1">Política de privacidad</h2>
      <Section title="1. Qué datos recogemos">
        <p>Ninguno. La app no pide nombre real, correo, teléfono, cédula ni datos bancarios, y no tiene servidores donde guardar tu información.</p>
      </Section>
      <Section title="2. Dónde se guarda lo que registras">
        <p>Tus movimientos, listas de mercado, pagos, deudas, metas y facturas se guardan en el almacenamiento interno del navegador de tu celular. Nadie más tiene acceso: ni los creadores de la app ni terceros.</p>
        <p>El nombre con el que la app te saluda es opcional y también queda solo en tu celular.</p>
      </Section>
      <Section title="3. Fotos de facturas">
        <p>Cuando escaneas una factura, la imagen se procesa dentro de tu celular. Para leer el texto la app descarga una única vez las herramientas de reconocimiento; tu foto no se envía a ningún servidor.</p>
      </Section>
      <Section title="4. Lo que sí se conecta a internet">
        <p>Solo la descarga de la app y de sus actualizaciones desde el servidor donde está publicada. Ese servidor, como cualquier página web, puede registrar datos técnicos básicos de la visita (como la dirección IP), pero no tus datos financieros.</p>
      </Section>
      <Section title="5. Notificaciones">
        <p>Los recordatorios de pagos los genera tu propio celular a partir de lo que registraste. Puedes desactivarlos en cualquier momento desde la configuración del navegador.</p>
      </Section>
      <Section title="6. Tus derechos y cómo borrar todo">
        <p>Como tus datos solo están en tu celular, tú tienes el control total. En Ajustes → «Borrar todos mis datos» se elimina todo de forma permanente. Si desinstalas la app o borras los datos del navegador, la información también se elimina.</p>
        <p>Puedes exportar un respaldo en PDF o Excel desde Finanzas cuando quieras.</p>
      </Section>
      <Section title="7. Ley colombiana">
        <p>Esta política se inspira en la Ley 1581 de 2012 de protección de datos personales. Al no recoger ni tratar datos personales en servidores, la app no actúa como responsable del tratamiento de tu información.</p>
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
