import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Calendar, DollarSign, Percent, Save, X, Info } from 'lucide-react';
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';

// Tipos de datos
interface ProfitAccount {
  id: string;
  entityName: string;
  accountType: string;
  initialAmount: number;
  annualRate: number; // Porcentaje anual (ej: 10 para 10%)
  createdAt: string;
}

const BANKS = [
  'Bancolombia',
  'Davivienda',
  'Banco de Bogotá',
  'BBVA',
  'Falabella',
  'Nequi',
  'Daviplata',
  'Nu Bank',
  'RappiPay',
  'Otro'
];

const ACCOUNT_TYPES = [
  'Cuenta de Ahorros',
  'Cuenta Corriente',
  'CDT',
  'Fondo de Inversión',
  'Criptomonedas'
];

export default function ProfitabilityPage() {
  const [accounts, setAccounts] = useState<ProfitAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado del formulario
  const [entityName, setEntityName] = useState('');
  const [accountType, setAccountType] = useState('Cuenta de Ahorros');
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [annualRate, setAnnualRate] = useState<string>('');

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedAccounts = secureStorage.getItem('miFinanzasProfitAccounts');
    if (savedAccounts) {
      setAccounts(savedAccounts);
    }
  }, []);

  // Guardar cambios cuando accounts cambie
  useEffect(() => {
    if (accounts.length > 0) {
      secureStorage.setItem('miFinanzasProfitAccounts', accounts);
    }
  }, [accounts]);

  // ✅ NOTIFICACIÓN DIARIA DE INTERESES
  useEffect(() => {
    const today = new Date().toLocaleDateString('es-CO');
    const notificationKey = `profit_notified_${today}`;
    
    // Solo notificar si no se ha notificado hoy y hay cuentas
    if (!sessionStorage.getItem(notificationKey) && accounts.length > 0) {
      let totalDailyInterest = 0;
      
      accounts.forEach(acc => {
        const daily = calculateDailyInterest(acc.initialAmount, acc.annualRate);
        totalDailyInterest += daily;
      });

      if (totalDailyInterest > 0) {
        notify({
          title: '💰 Interés de Hoy',
          message: `El ${today}, tus cuentas generaron aprox. $${formatCurrency(totalDailyInterest)} en intereses.`,
          type: 'success',
          duration: 6000, // 6 segundos para leer bien
          module: 'Rentabilidad'
        });
        sessionStorage.setItem(notificationKey, 'true');
      }
    }
  }, [accounts]);

  // Funciones de cálculo
  const calculateDailyInterest = (amount: number, rate: number) => {
    return (amount * (rate / 100)) / 365;
  };

  const calculateMonthlyInterest = (amount: number, rate: number) => {
    return (amount * (rate / 100)) / 12;
  };

  const calculateYearlyInterest = (amount: number, rate: number) => {
    return amount * (rate / 100);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddAccount = () => {
    if (!entityName || !initialAmount || !annualRate) {
      notify({ 
        title: '❌ Error', 
        message: 'Completa todos los campos', 
        type: 'error',
        module: 'Rentabilidad'
      });
      return;
    }

    const newAccount: ProfitAccount = {
      id: Date.now().toString(),
      entityName,
      accountType,
      initialAmount: parseFloat(initialAmount.replace(/[^0-9.-]+/g, "")),
      annualRate: parseFloat(annualRate),
      createdAt: new Date().toISOString()
    };

    setAccounts([...accounts, newAccount]);
    resetForm();
    setIsModalOpen(false);
    
    notify({ 
      title: '✅ Cuenta Agregada', 
      message: `${entityName} - ${accountType}`, 
      type: 'success',
      module: 'Rentabilidad'
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('¿Eliminar esta cuenta de rentabilidad?')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
      notify({ 
        title: '🗑️ Eliminada', 
        message: 'Cuenta eliminada correctamente', 
        type: 'info',
        module: 'Rentabilidad'
      });
    }
  };

  const resetForm = () => {
    setEntityName('');
    setAccountType('Cuenta de Ahorros');
    setInitialAmount('');
    setAnnualRate('');
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Rentabilidad</h1>
          <p className="text-gray-400 text-sm">Calcula tus ganancias por día, mes y año</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Resumen Total */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 rounded-xl border border-emerald-700/30">
        <h3 className="text-emerald-300 text-sm font-medium mb-2">Ganancia Estimada Total (Hoy)</h3>
        <p className="text-3xl font-bold text-white">
          ${formatCurrency(accounts.reduce((sum, acc) => sum + calculateDailyInterest(acc.initialAmount, acc.annualRate), 0))}
        </p>
        <p className="text-xs text-emerald-400 mt-1">Basado en {accounts.length} cuenta(s) activa(s)</p>
      </div>

      {/* Lista de Cuentas */}
      {accounts.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-500" />
          <p>No tienes cuentas configuradas.</p>
          <p className="text-sm">Agrega una entidad financiera para empezar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 relative group">
              <button 
                onClick={() => handleDeleteAccount(acc.id)}
                className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white">{acc.entityName}</h3>
                  <p className="text-xs text-gray-400">{acc.accountType} • {acc.annualRate}% EA</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Saldo Actual</p>
                  <p className="font-bold text-white">${formatCurrency(acc.initialAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-700/50">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Diario</p>
                  <p className="text-sm font-semibold text-green-400">
                    ${formatCurrency(calculateDailyInterest(acc.initialAmount, acc.annualRate))}
                  </p>
                </div>
                <div className="text-center border-l border-gray-700/50">
                  <p className="text-[10px] text-gray-500 uppercase">Mensual</p>
                  <p className="text-sm font-semibold text-blue-400">
                    ${formatCurrency(calculateMonthlyInterest(acc.initialAmount, acc.annualRate))}
                  </p>
                </div>
                <div className="text-center border-l border-gray-700/50">
                  <p className="text-[10px] text-gray-500 uppercase">Anual</p>
                  <p className="text-sm font-semibold text-purple-400">
                    ${formatCurrency(calculateYearlyInterest(acc.initialAmount, acc.annualRate))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Agregar Cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl p-6 border border-gray-700 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Nueva Cuenta</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Entidad */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Entidad Financiera</label>
                <select 
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                >
                  <option value="">Selecciona un banco...</option>
                  {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                </select>
              </div>

              {/* Tipo de Cuenta */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Producto</label>
                <select 
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                >
                  {ACCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Monto Actual ($)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 2000000"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>

              {/* Tasa de Interés */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tasa Anual (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Ej: 10.5"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pr-10 text-white focus:border-green-500 outline-none"
                  />
                  <Percent className="absolute right-3 top-3 text-gray-500" size={20} />
                </div>
                <p className="text-xs text-gray-500 mt-1">La tasa efectiva anual que ofrece la entidad.</p>
              </div>

              <button 
                onClick={handleAddAccount}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg mt-4 flex items-center justify-center gap-2 transition-colors"
              >
                <Save size={20} />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}