import { useState, useRef } from 'react';
import { Camera, Upload, Scan, FileText, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { notify } from '../services/notificationService';

interface Receipt {
  id: string;
  date: string;
  total: number;
  store: string;
  itemCount: number;
}

export default function ReceiptScannerPage() {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]); // Historial vacío al inicio
  
  // Referencias para los inputs ocultos de archivo
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  // Función que simula el procesamiento al elegir un archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'camera' | 'upload') => {
    if (e.target.files && e.target.files.length > 0) {
      setScanning(true);
      
      // Simular tiempo de escaneo (OCR)
      await new Promise(r => setTimeout(r, 2000));
      
      // Crear registro ficticio basado en la fecha actual (ya que no tenemos OCR real conectado)
      const newReceipt: Receipt = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        total: Math.floor(Math.random() * 150000) + 20000, // Simulación
        store: type === 'camera' ? 'Tienda Local' : 'Archivo Subido',
        itemCount: Math.floor(Math.random() * 10) + 1
      };

      setReceipts(prev => [newReceipt, ...prev]);
      setScanning(false);
      
      notify({ 
        title: '✅ Factura escaneada', 
        message: `Se detectaron ${newReceipt.itemCount} productos. Total: $${newReceipt.total.toLocaleString()}`, 
        type: 'success' 
      });

      // Limpiar el input para poder volver a subir el mismo archivo si se desea
      e.target.value = '';
    }
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const triggerCamera = () => cameraInputRef.current?.click();
  const triggerUpload = () => uploadInputRef.current?.click();

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Inputs ocultos para permisos */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraInputRef} 
        className="hidden" 
        onChange={(e) => handleFileSelect(e, 'camera')} 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={uploadInputRef} 
        className="hidden" 
        onChange={(e) => handleFileSelect(e, 'upload')} 
      />

      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧾</span>
            <div>
              <h1 className={`text-base font-bold ${textPrimary}`}>Escáner de Facturas</h1>
              <p className={`text-[10px] ${textSecondary}`}>OCR Inteligente</p>
            </div>
          </div>
          <Link to="/historial-facturas" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <FileText className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
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
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Scan className="w-10 h-10 text-purple-400" />
              </div>
              <p className={`text-sm font-bold ${textPrimary} text-center mb-1`}>Toma una foto a tu factura</p>
              <p className={`text-xs ${textSecondary} text-center mb-6 max-w-xs`}>Usa la cámara o sube una imagen para comparar precios con tu lista de mercado</p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={triggerCamera}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/50 transition-colors`}>
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className={`text-xs font-medium ${textPrimary}`}>Cámara</span>
                </button>
                <button onClick={triggerUpload}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/50 transition-colors`}>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className={`text-xs font-medium ${textPrimary}`}>Subir imagen</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Historial Local (Ahora vacío al inicio) */}
        <div>
          <h3 className={`text-xs font-bold ${textSecondary} uppercase mb-2`}>Últimos escaneos</h3>
          {receipts.length === 0 ? (
            <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-8 text-center`}>
              <p className={`text-sm ${textSecondary}`}>No has escaneado facturas aún.</p>
            </div>
          ) : (
            <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden`}>
              {receipts.map((f, i) => (
                <div key={f.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? `border-t ${borderColor}` : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'} flex items-center justify-center`}>
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${textPrimary}`}>{f.store}</p>
                      <p className={`text-[10px] ${textSecondary}`}>{new Date(f.date).toLocaleDateString()} • {f.itemCount} productos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${textPrimary}`}>${f.total.toLocaleString()}</span>
                    <button onClick={() => deleteReceipt(f.id)} className="text-gray-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}