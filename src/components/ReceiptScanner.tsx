import { Camera, Upload, Scan } from 'lucide-react';
import { useState } from 'react';

export default function ReceiptScanner() {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    // Simulación
    setTimeout(() => setScanning(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <Scan className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Escáner de Facturas</h1>
          <p className="text-xs text-gray-400">OCR Inteligente para tus compras</p>
        </div>
      </div>

      <div className="rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-6" style={{ minHeight: '300px' }}>
        {scanning ? (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-purple-300 font-medium animate-pulse">Analizando factura...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
              <Scan className="w-10 h-10 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Toma una foto a tu factura</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">Usa la cámara de tu celular o sube una imagen de la galería para comparar precios.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <button 
                onClick={handleScan}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all flex flex-col items-center gap-2 group"
              >
                <Camera className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
                <span className="text-sm font-medium text-gray-300">Cámara</span>
              </button>
              
              <button 
                onClick={handleScan}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all flex flex-col items-center gap-2 group"
              >
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
                <span className="text-sm font-medium text-gray-300">Subir</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}