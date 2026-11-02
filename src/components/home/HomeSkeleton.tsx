/**
 * 🦴 ESQUELETO DE INICIO: mientras cargan los datos se ve la forma de la pantalla
 * (anillos, 8 íconos y "Para hoy") con un brillo que pasa. Nada "salta" al aparecer.
 */
const Sk = ({ className = '' }: { className?: string }) => <div className={`mf-skeleton rounded-2xl ${className}`} />;

export default function HomeSkeleton({ header = true }: { header?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Cargando tu Inicio">
      {header && (
        <div className="flex items-center gap-3 mb-5">
          <Sk className="w-10 h-10 !rounded-xl" /><Sk className="w-11 h-11" />
          <div className="flex-1 space-y-1.5"><Sk className="h-5 w-32 !rounded-lg" /><Sk className="h-3 w-24 !rounded-lg" /></div>
          <Sk className="w-10 h-10 !rounded-xl" />
        </div>
      )}
      <div className="mf-skeleton rounded-[28px] p-4 flex items-center gap-4">
        <div className="w-[104px] h-[104px] rounded-full border-[12px] border-white/[0.07] shrink-0" />
        <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-white/[0.07]" /><div className="h-7 w-11/12 rounded-lg bg-white/[0.07]" /><div className="h-3 w-1/2 rounded bg-white/[0.07]" /></div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">{Array.from({ length: 8 }, (_, i) => <Sk key={i} className="h-[72px] !rounded-[20px]" />)}</div>
      <Sk className="h-3 w-20 mt-5 mb-2 !rounded" />
      <div className="space-y-2"><Sk className="h-[60px] !rounded-[20px]" /><Sk className="h-[60px] !rounded-[20px]" /></div>
    </div>
  );
}
