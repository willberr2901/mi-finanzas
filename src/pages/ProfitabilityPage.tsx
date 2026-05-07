import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Percent, Save, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';

interface ProfitAccount {
  id: string;
  entityName: string;
  accountType: string;
  initialAmount: number;
  annualRate: number;
  createdAt: string;
}

const BANKS = ['Bancolombia', 'Davivienda', 'BBVA', 'Falabella', 'Nequi', 'Daviplata', 'Nu Bank', 'RappiPay', 'Otro'];
const ACCOUNT_TYPES = ['Cuenta de Ahorros', 'CDT', 'Fondo de Inversión'];

export default function ProfitabilityPage() {
  const [accounts, setAccounts] = useState<ProfitAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [entityName, setEntityName] = useState('');
  const [accountType, setAccountType] = useState('Cuenta de Ahorros');
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [annualRate, setAnnualRate] = useState<string>('');

  useEffect(() => {
    const saved = secureStorage.getItem('miFinanzasProfitAccounts');
    if (saved) setAccounts(saved);
  }, []);

  useEffect(() => {
    if (accounts.length > 0) secureStorage.setItem('miFinanzasProfitAccounts', accounts);
  }, [accounts]);

  // Notificación diaria única
  useEffect(() => {
    const today = new Date().toLocaleDateString('es-CO');
    const key = `profit_notified_${today}`;
    
    if (!sessionStorage.getItem(key) && accounts.length > 0) {
      let totalDaily = 0;
      accounts.forEach(acc => {
        totalDaily += (acc.initialAmount * (acc.annualRate / 100)) / 365;
      });

      if (totalDaily > 0) {
        notify({
          title: '💰 Ganancia de Hoy',
          message: `Has generado aprox. $${formatCurrency(totalDaily)} en intereses hoy.`,
          type: 'success',
          duration: 6000,
          module: 'Rentabilidad'
        });
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [accounts]);

  const formatCurrency = (val: number) => val.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAdd = () => {
    if (!entityName || !initialAmount || !annualRate) {
      notify({ title: '❌ Error', message: 'Completa todos los campos', type: 'error' });
      return;
    }

    const newAcc: ProfitAccount = {
      id: Date.now().toString(),
      entityName,
      accountType,
      initialAmount: parseFloat(initialAmount.replace(/[^0-9.-]+/g, "")),
      annualRate: parseFloat(annualRate),
      createdAt: new Date().toISOString()
    };

    setAccounts([...accounts, newAcc]);
    resetForm();
    setIsModalOpen(false);
    notify({ title: '✅ Cuenta Agregada', message: `${entityName}`, type: 'success' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta cuenta?')) {
      setAccounts(accounts.filter(a => a.id !== id));
      notify({ title: '🗑️ Eliminada', message: 'Cuenta eliminada', type: 'info' });
    }
  };

  const resetForm = () => {
    setEntityName('');
    setAccountType('Cuenta de Ahorros');
    setInitialAmount('');
    setAnnualRate('');
  };

  // Generar proyección mensual con interés compuesto
  const generateProjection = (amount: number, rate: number) => {
    const rows = [];
    let currentBalance = amount;
    const monthlyRate = rate / 100 / 12;
    
    for (let i = 1; i <= 12; i++) {
      const interest = currentBalance * monthlyRate;
      currentBalance += interest;
      rows.push({
        month: i,
        interest: interest,
        balance: currentBalance
      });
    }
    return rows;
  };

  return (
    <div className="p-4 pb-24 space-y-6 relative z-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Rentabilidad</h1>
          <p className="text-gray-400 text-sm">Proyección de ganancias diarias y mensuales</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Resumen Total Diario */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 rounded-xl border border-emerald-700/30">
        <h3 className="text-emerald-300 text-sm font-medium mb-2">Ganancia Estimada HOY</h3>
        <p className="text-3xl font-bold text-white">
          ${formatCurrency(accounts.reduce((sum, acc) => sum + ((acc.initialAmount * (acc.annualRate / 100)) / 365), 0))}
        </p>
        <p className="text-xs text-emerald-400 mt-1">Basado en {accounts.length} cuenta(s)</p>
      </div>

      {/* Lista de Cuentas */}
      {accounts.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-500" />
          <p>No tienes cuentas configuradas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc) => {
            const daily = (acc.initialAmount * (acc.annualRate / 100)) / 365;
            const monthly = (acc.initialAmount * (acc.annualRate / 100)) / 12;
            const yearly = acc.initialAmount * (acc.annualRate / 100);
            const isExpanded = expandedId === acc.id;

            return (
              <div key={acc.id} className="bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border border-gray-700 relative group">
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-20"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white">{acc.entityName}</h3>
                    <p className="text-xs text-gray-400">{acc.accountType} • {acc.annualRate}% EA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Saldo</p>
                    <p className="font-bold text-white">${formatCurrency(acc.initialAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-700/50">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase">Diario</p>
                    <p className="text-sm font-semibold text-green-400">${formatCurrency(daily)}</p>
                  </div>
                  <div className="text-center border-l border-gray-700/50">
                    <p className="text-[10px] text-gray-500 uppercase">Mensual</p>
                    <p className="text-sm font-semibold text-blue-400">${formatCurrency(monthly)}</p>
                  </div>
                  <div className="text-center border-l border-gray-700/50">
                    <p className="text-[10px] text-gray-500 uppercase">Anual</p>
                    <p className="text-sm font-semibold text-purple-400">${formatCurrency(yearly)}</p>
                  </div>
                </div>

                {/* Toggle Proyección */}
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : acc.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  Ver Proyección Mensual (12 meses)
                </button>

                {/* Tabla de Proyección */}
                {isExpanded && (
                  <div className="mt-3 bg-black/30 rounded-lg p-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="py-1 px-2">Mes</th>
                          <th className="py-1 px-2 text-right">Interés</th>
                          <th className="py-1 px-2 text-right">Saldo Acum.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateProjection(acc.initialAmount, acc.annualRate).map((row) => (
                          <tr key={row.month} className="border-b border-gray-800 last:border-0">
                            <td className="py-1 px-2 text-gray-300">{row.month}</td>
                            <td className="py-1 px-2 text-right text-green-400">+${formatCurrency(row.interest)}</td>
                            <td className="py-1 px-2 text-right text-white">${formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Nueva Cuenta</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Entidad</label>
                <select 
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                >
                  <option value="">Selecciona...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                <select 
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Monto Actual ($)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 1000000"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tasa Anual (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Ej: 9.5"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pr-10 text-white focus:border-green-500 outline-none"
                  />
                  <Percent className="absolute right-3 top-3 text-gray-500" size={20} />
                </div>
              </div>

              <button 
                onClick={handleAdd}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg mt-4 flex items-center justify-center gap-2"
              >
                <Save size={20} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}