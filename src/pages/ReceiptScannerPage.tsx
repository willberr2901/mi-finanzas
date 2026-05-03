import { useState, useRef } from 'react';
import { Camera, Upload, Scan, FileText, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { notify } from '../services/notificationService';

interface Receipt {
  id: string;
  date: string;
  total: number;
  store: string;
  itemCount: number;
  imageUrl?: string;
}

export default function ReceiptScannerPage() {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    // Cargar desde localStorage al iniciar
    const saved = localStorage.getItem('scannedReceipts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  // Guardar en localStorage cuando cambie receipts
  const saveReceipts = (newReceipts: Receipt[]) => {
    setReceipts(newReceipts);
    localStorage.setItem('scannedReceipts', JSON.stringify(newReceipts));
  };

  // Solicitar permisos y abrir cámara
  const requestCameraPermission = async () => {
    try {
      // Verificar si el navegador soporta permisos de cámara
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ 
          name: 'camera' as PermissionName 
        });
        
        if (permissionStatus.state === 'denied') {
          alert('❌ Permiso de cámara denegado. Por favor, habilita los permisos en la configuración de tu navegador.');
          return false;
        }
      }
      
      // Abrir input de cámara
      cameraInputRef.current?.click();
      return true;
    } catch (error) {
      console.error('Error solicitando permiso:', error);
      cameraInputRef.current?.click();
      return true;
    }
  };

  // Solicitar permisos y abrir galería
  const requestGalleryPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ 
          name: 'storage' as PermissionName 
        });
        
        if (permissionStatus.state === 'denied') {
          alert('❌ Permiso de almacenamiento denegado. Por favor, habilita los permisos en la configuración.');
          return false;
        }
      }
      
      uploadInputRef.current?.click();
      return true;
    } catch (error) {
      console.error('Error solicitando permiso:', error);
      uploadInputRef.current?.click();
      return true;
    }
  };

  // Procesar archivo seleccionado
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'camera' | 'upload') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      notify({ 
        title: '❌ Error', 
        message: 'Por favor selecciona un archivo de imagen válido', 
        type: 'error' 
      });
      return;
    }

    setScanning(true);
    
    try {
      // Crear URL temporal para la imagen
      const imageUrl = URL.createObjectURL(file);
      
      // Simular procesamiento OCR (2-3 segundos)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generar datos simulados basados en el nombre del archivo
      const randomTotal = Math.floor(Math.random() * 150000) + 30000;
      const randomItems = Math.floor(Math.random() * 15) + 3;
      
      const newReceipt: Receipt = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        total: randomTotal,
        store: type === 'camera' ? 'Foto Reciente' : file.name.replace(/\.[^/.]+$/, ""),
        itemCount: randomItems,
        imageUrl: imageUrl
      };

      setScannedData(newReceipt);
      setScanning(false);
      
      notify({ 
        title: '✅ Factura escaneada', 
        message: `Se detectaron ${randomItems} productos. Total: $${randomTotal.toLocaleString('es-CO')}`, 
        type: 'success',
        duration: 3000
      });

    } catch (error) {
      console.error('Error procesando imagen:', error);
      setScanning(false);
      notify({ 
        title: '❌ Error', 
        message: 'No se pudo procesar la imagen. Intenta de nuevo.', 
        type: 'error' 
      });
    }

    // Limpiar input
    e.target.value = '';
  };

  // Registrar en historial
  const registerToHistory = () => {
    if (scannedData) {
      saveReceipts([scannedData, ...receipts]);
      notify({ 
        title: '📋 Registrada', 
        message: 'Factura guardada en el historial', 
        type: 'success' 
      });
      setScannedData(null);
    }
  };

  // Escanear otra
  const scanAnother = () => {
    setScannedData(null);
  };

  // Eliminar del historial
  const deleteReceipt = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt?.imageUrl) {
      URL.revokeObjectURL(receipt.imageUrl);
    }
    saveReceipts(receipts.filter(r => r.id !== id));
    notify({ 
      title: '🗑️ Eliminada', 
      message: 'Factura eliminada del historial', 
      type: 'info' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0 
    });
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Inputs ocultos con permisos */}
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

      {/* Header */}
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
        {/* Zona de Escaneo */}
        <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-6`}>
          {scanning ? (
            <div className="text-center space-y-4 py-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-purple-500 rounded-xl animate-pulse"></div>
                <div className="absolute inset-2 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-lg animate-spin"></div>
                <Scan className="w-12 h-12 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className={`text-sm font-medium ${textPrimary} mb-1`}>Escaneando factura...</p>
                <p className={`text-xs ${textSecondary}`}>Detectando productos y precios</p>
              </div>
            </div>
          ) : scannedData ? (
            <div className="space-y-4">
              <div className={`${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} border rounded-xl p-6 text-center`}>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>¡Factura escaneada con éxito!</h3>
                <p className={`text-sm ${textSecondary} mb-1`}>{scannedData.itemCount} productos detectados</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {formatMoney(scannedData.total)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={registerToHistory}
                  className="bg-gradient-to-r from-green-400 to-cyan-400 text-black font-bold py-3 rounded-xl text-sm hover:scale-105 transition-transform"
                >
                  Registrar en Historial
                </button>
                <button 
                  onClick={scanAnother}
                  className={`${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'} font-bold py-3 rounded-xl text-sm hover:scale-105 transition-transform`}
                >
                  Escanear otra
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Scan className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className={`text-sm font-bold ${textPrimary} mb-1`}>Toma una foto a tu factura</h3>
              <p className={`text-xs ${textSecondary} mb-6 max-w-xs mx-auto`}>
                Usa la cámara de tu celular o sube una imagen de la galería para detectar productos y precios
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={requestCameraPermission}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/50 transition-colors`}
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className={`text-xs font-medium ${textPrimary}`}>Cámara</span>
                </button>
                <button 
                  onClick={requestGalleryPermission}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/50 transition-colors`}
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className={`text-xs font-medium ${textPrimary}`}>Subir imagen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial de Escaneos */}
        <div>
          <h3 className={`text-xs font-bold ${textSecondary} uppercase mb-2 flex items-center justify-between`}>
            <span>Últimos escaneos</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              {receipts.length}
            </span>
          </h3>
          
          {receipts.length === 0 ? (
            <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-8 text-center`}>
              <FileText className={`w-12 h-12 ${textSecondary} opacity-30 mx-auto mb-2`} />
              <p className={`text-sm ${textSecondary}`}>No has escaneado facturas aún</p>
              <p className={`text-xs ${textSecondary} mt-1`}>Toca cámara o subir para comenzar</p>
            </div>
          ) : (
            <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden`}>
              {receipts.map((receipt, index) => (
                <div 
                  key={receipt.id} 
                  className={`flex items-center justify-between px-4 py-3 ${index > 0 ? `border-t ${borderColor}` : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'} flex items-center justify-center flex-shrink-0`}>
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${textPrimary} truncate`}>{receipt.store}</p>
                      <p className={`text-[10px] ${textSecondary}`}>
                        {formatDate(receipt.date)} • {receipt.itemCount} productos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold ${textPrimary}`}>{formatMoney(receipt.total)}</span>
                    <button 
                      onClick={() => deleteReceipt(receipt.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
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