import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react';
import { scanReceipt } from '../services/ocrService';
import type { ScannedReceipt, ScannedItem } from '../services/ocrService';
import { useFinanceStore } from '../store/financeStore';

export default function ReceiptScanner() {
  const { transactions, addTransaction } = useFinanceStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReceipt | null>(null);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plannedItems = transactions.filter(t => 
    ['Plaza', 'Granos', 'Carnes', 'Lacteos', 'Panaderia', 'Bebidas', 'Aseo', 'Otros'].includes(t.category)
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError('');
    setScannedData(null);

    try {
      const result = await scanReceipt(file);
      setScannedData(result);
      
      const autoSelected = new Set<string>();
      result.items.forEach((item, index) => {
        const match = plannedItems.find(p => 
          p.description.toLowerCase().includes(item.name.toLowerCase().substring(0, 4)) ||
          item.name.toLowerCase().includes(p.description.toLowerCase().substring(0, 4))
        );
        if (match) {
          autoSelected.add(`${index}-${item.name}`);
        }
      });
      setSelectedItems(autoSelected);
      
    } catch (err) {
      setError('Error al escanear. Intenta con una imagen más clara.');
    } finally {
      setIsScanning(false);
    }
  };

  const comparePrices = (scannedItem: ScannedItem) => {
    const planned = plannedItems.find(p => 
      p.description.toLowerCase().includes(scannedItem.name.toLowerCase().substring(0, 5)) ||
      scannedItem.name.toLowerCase().includes(p.description.toLowerCase().substring(0, 5))
    );

    if (!planned) return null;

    const diff = scannedItem.price - planned.amount;
    // Aseguramos que planned.amount sea número y no sea 0 para evitar división por cero
    const percentDiff = planned.amount > 0 ? ((diff / planned.amount) * 100).toFixed(1) : '0';

    return {
      planned: planned.amount,
      scanned: scannedItem.price,
      diff,
      percentDiff,
      isHigher: diff > 0
    };
  };

  const handleSave = async () => {
    if (!scannedData) return;

    const itemsToSave = scannedData.items.filter((_, index) => 
      selectedItems.has(`${index}-${scannedData.items[index].name}`)
    );

    for (const item of itemsToSave) {
      await addTransaction({
        type: 'expense',
        amount: item.price,
        category: getCategoryFromPlanned(item.name),
        description: `🧾 ${item.name}`,
        date: new Date().toISOString(),
      });
    }

    alert(`✅ ${itemsToSave.length} productos guardados con precio real`);
    setScannedData(null);
    setSelectedItems(new Set());
  };

  const getCategoryFromPlanned = (itemName: string): string => {
    const planned = plannedItems.find(p => 
      p.description.toLowerCase().includes(itemName.toLowerCase().substring(0, 4))
    );
    return planned?.category || 'Otros';
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">🧾 Escanear Factura</h2>
        <p className="text-white/80 text-sm">Compara precios reales vs planificados</p>
      </div>

      {!scannedData && (
        <div className="space-y-4">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-600 p-8 rounded-xl transition-all flex flex-col items-center gap-3">
              <Camera className="w-12 h-12 text-purple-400" />
              <span className="text-white font-medium">Tomar Foto</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-600 p-8 rounded-xl transition-all flex flex-col items-center gap-3">
              <Upload className="w-12 h-12 text-pink-400" />
              <span className="text-white font-medium">Subir Imagen</span>
            </button>
          </div>
          {isScanning && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white text-lg">Escaneando factura...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}

      {scannedData && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{scannedData.store || 'Tienda'}</h3>
                <p className="text-gray-400 text-sm">{scannedData.date}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">${scannedData.total.toLocaleString('es-CO')}</p>
                <p className="text-xs text-gray-500">Total factura</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-bold">Productos detectados ({scannedData.items.length})</h3>
            {scannedData.items.map((item, index) => {
              const comparison = comparePrices(item);
              const isSelected = selectedItems.has(`${index}-${item.name}`);
              return (
                <div key={index} onClick={() => {
                  const newSelected = new Set(selectedItems);
                  const key = `${index}-${item.name}`;
                  if (newSelected.has(key)) newSelected.delete(key);
                  else newSelected.add(key);
                  setSelectedItems(newSelected);
                }} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-purple-900/20 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isSelected ? <Check className="w-5 h-5 text-purple-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-600" />}
                        <p className="text-white font-medium capitalize">{item.name}</p>
                      </div>
                      {comparison && (
                        <div className="mt-2 ml-7 flex items-center gap-3 text-sm">
                          <span className="text-gray-400">Planificado: ${comparison.planned.toLocaleString('es-CO')}</span>
                          <span className={comparison.isHigher ? 'text-red-400' : 'text-green-400'}>
                            {comparison.isHigher ? '↑' : '↓'} {Math.abs(parseFloat(comparison.percentDiff))}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">${item.price.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setScannedData(null); setSelectedItems(new Set()); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <X className="w-5 h-5" /> Cancelar
            </button>
            <button onClick={handleSave} disabled={selectedItems.size === 0} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Guardar ({selectedItems.size})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}