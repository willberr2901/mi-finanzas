import { useState } from 'react';
import { Camera, Upload, Scan, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { notify } from '../services/notificationService';

export default function ReceiptScannerPage() {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const handleScan = async (type: 'camera' | 'upload') => {
    setScanning(true);
    // Simular escaneo
    await new Promise(r => setTimeout(r, 2500));
    setScanning(false);
    setScanned(true);
    notify({ title: '✅ Factura escaneada', message: 'Se han detectado 12 productos', type: 'success' });
  };

  const handleRegister = () => {
    notify({ title: '📋 Factura registrada', message: 'Se guardó en el historial', type: 'success', duration: 3000 });
    setScanned(false);
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧾</span>
            <div>
              <h1 className={`text-base font-bold ${textPrimary}`}>Escáner de Facturas</h1>
              <p className={`text-[10px] ${textSecondary}`}>OCR Inteligente</p>
            </div>
          </div>
          <Link to="/historial-facturas" className="p-2 rounded-lg bg-white/10">
            <FileText className="w-5 h-5 text-white" />
          </Link>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Zona de escaneo */}
        <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-6 flex flex-col items-center`}>
          {scanning ? (
            <div className="text-center space-y-4 py-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-purple-500 rounded-xl animate-pulse"></div>
                <div className="absolute inset-2 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-lg animate-spin"></div>
                <Scan className="w-12 h-12 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <p className={`text-sm font-medium ${textPrimary}`}>Escaneando factura...</p>
              <p className={`text-xs ${textSecondary}`}>Detectando productos y precios</p>
            </div>
          ) : scanned ? (
            <div className="w-full space-y-4">
              <div className={`${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} border rounded-xl p-4 text-center`}>
                <span className="text-3xl">✅</span>
                <p className={`text-sm font-bold ${textPrimary} mt-2`}>Factura escaneada con éxito</p>
                <p className={`text-xs ${textSecondary}`}>12 productos detectados • Total: $125.000</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRegister} className="flex-1 bg-gradient-to-r from-green-400 to-cyan-400 text-black py-3 rounded-xl font-bold text-sm">
                  Registrar en Historial
                </button>
                <button onClick={() => setScanned(false)} className={`px-4 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200'}`}>
                  Escanear otra
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Scan className="w-10 h-10 text-purple-400" />
              </div>
              <p className={`text-sm font-bold ${textPrimary} text-center mb-1`}>Toma una foto a tu factura</p>
              <p className={`text-xs ${textSecondary} text-center mb-6 max-w-xs`}>Usa la cámara o sube una imagen para comparar precios con tu lista de mercado</p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => handleScan('camera')}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/50 transition-colors`}>
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className={`text-xs font-medium ${textPrimary}`}>Cámara</span>
                </button>
                <button onClick={() => handleScan('upload')}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/50 transition-colors`}>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className={`text-xs font-medium ${textPrimary}`}>Subir imagen</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Últimos escaneos */}
        <div>
          <h3 className={`text-xs font-bold ${textSecondary} uppercase mb-2`}>Últimos escaneos</h3>
          <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden`}>
            {[
              { name: 'Factura_Éxito.jpg', date: '02/05/2026', items: 12, status: 'Procesado' },
              { name: 'Factura_SuperInter.jpg', date: '28/04/2026', items: 8, status: 'Procesado' },
            ].map((f, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? `border-t ${borderColor}` : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'} flex items-center justify-center`}>
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textPrimary}`}>{f.name}</p>
                    <p className={`text-[10px] ${textSecondary}`}>{f.date} • {f.items} productos</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}