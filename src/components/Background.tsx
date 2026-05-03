export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Degradado 1 - Superior izquierdo (verde/cyan) */}
      <div 
        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 163, 0.6) 0%, transparent 60%)',
          animation: 'pulse-glow 4s ease-in-out infinite'
        }}
      />
      
      {/* Degradado 2 - Superior derecho (cyan/azul) */}
      <div 
        className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0, 209, 255, 0.5) 0%, transparent 60%)',
          animation: 'pulse-glow 5s ease-in-out infinite 1s'
        }}
      />
      
      {/* Degradado 3 - Centro inferior (verde) */}
      <div 
        className="absolute -bottom-1/2 left-1/2 w-full h-full rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.5) 0%, transparent 60%)',
          animation: 'pulse-glow 6s ease-in-out infinite 2s'
        }}
      />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1);
            opacity: inherit;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}