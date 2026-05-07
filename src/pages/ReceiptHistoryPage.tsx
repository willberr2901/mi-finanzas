import { useState, useEffect } from 'react';
import { secureStorage } from '../utils/security';
import { DollarSign, Calendar, Trash2, AlertTriangle } from 'lucide-react';

interface Invoice {
  id: string;
  store: string;
  date: string;
  total: number;
  products: Array<{ name: string; price: number; quantity: number }>;
  isValid?: boolean; // Para marcar facturas inválidas
}

export default function ReceiptHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const savedInvoices = secureStorage.getItem('miFinanzasInvoices');
    if (savedInvoices) {
      // Filtrar solo facturas válidas
      const validInvoices = savedInvoices.filter((inv: Invoice) => {
        return inv.isValid !== false && inv.total > 0 && inv.products.length > 0;
      });
      setInvoices(validInvoices);
    }
  }, []);

  const deleteInvoice = (id: string) => {
    if (confirm('¿Eliminar esta factura?')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      secureStorage.setItem('miFinanzasInvoices', updated);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Historial de Facturas</h1>
      
      {invoices.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-500" />
          <p>No hay facturas escaneadas aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white">{invoice.store}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Calendar size={12} />
                    <span>{invoice.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="font-bold text-green-400">${formatCurrency(invoice.total)}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-500 mb-2">{invoice.products.length} productos:</p>
                <div className="space-y-1">
                  {invoice.products.slice(0, 3).map((product, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300">{product.name}</span>
                      <span className="text-gray-400">${formatCurrency(product.price)}</span>
                    </div>
                  ))}
                  {invoice.products.length > 3 && (
                    <p className="text-xs text-gray-500">+{invoice.products.length - 3} más...</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => deleteInvoice(invoice.id)}
                className="mt-3 text-red-400 text-sm flex items-center gap-1 hover:text-red-300"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}