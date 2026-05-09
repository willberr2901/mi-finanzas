import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Percent, Save, X, ChevronDown, ChevronUp, TrendingUp, Calendar, ArrowRight, Edit } from 'lucide-react';
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

const BANKS = [
  'Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Falabella', 
  'Nequi', 'Daviplata', 'Nu Bank', 'RappiPay', 'Bancóldex', 'BAC Credomatic',
  'Colpatria', 'Citibank', 'Deutsche Bank', 'Girobank', 'Interbank', 
  'Itaú', 'JPMorgan Chase', 'Kasba', 'Mercantil', 'Pibank', 'Scotiabank',
  'Sudameris', 'Urbano', 'Wurbancard', 'Otro'
];

const ACCOUNT_TYPES = ['Cuenta de Ahorros', 'CDT', 'Fondo de Inversión', 'Cuenta Corriente'];

export default function ProfitabilityPage() {
  const [accounts, setAccounts] = useState<ProfitAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // Para edición
  
  // Estado del Formulario
  const [entityName, setEntityName] = useState('');
  const [accountType, setAccountType] = useState('Cuenta de Ahorros');
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [annualRate, setAnnualRate] = useState<string>('');

  // Cargar datos
  useEffect(() => {
    const savedAccounts = secureStorage.getItem('miFinanzasProfitAccounts');
    if (savedAccounts && Array.isArray(savedAccounts)) {
      setAccounts(savedAccounts);
    }
  }, []);

  // Guardar datos
  useEffect(() => {
    if (accounts.length > 0) {
      secureStorage.setItem('miFinanzasProfitAccounts', accounts);
    } else {
      secureStorage.removeItem('miFinanzasProfitAccounts');
    }
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

  const handleAddOrUpdate = () => {
    if (!entityName || !initialAmount || !annualRate) {
      notify({ title: '❌ Error', message: 'Completa todos los campos correctamente.', type: 'error' });
      return;
    }

    const amount = parseFloat(initialAmount.replace(/[^0-9.-]+/g, ""));
    const rate = parseFloat(annualRate);

    if (isNaN(amount) || isNaN(rate) || amount <= 0 || rate < 0) {
      notify({ title: '❌ Error', message: 'Los valores deben ser números positivos.', type: 'error' });
      return;
    }

    if (editingId) {
      // Actualizar cuenta existente
      setAccounts(prev => prev.map(acc => 
        acc.id === editingId 
          ? { ...acc, entityName, accountType, initialAmount: amount, annualRate: rate }
          : acc
      ));
      notify({ title: '✅ Cuenta Actualizada', message: `${entityName}`, type: 'success' });
    } else {
      // Agregar nueva cuenta
      const newAcc: ProfitAccount = {
        id: Date.now().toString(),
        entityName,
        accountType,
        initialAmount: amount,
        annualRate: rate,
        createdAt: new Date().toISOString()
      };
      setAccounts([...accounts, newAcc]);
      notify({ title: '✅ Cuenta Agregada', message: `${entityName}`, type: 'success' });
    }

    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (acc: ProfitAccount) => {
    setEntityName(acc.entityName);
    setAccountType(acc.accountType);
    setInitialAmount(acc.initialAmount.toString());
    setAnnualRate(acc.annualRate.toString());
    setEditingId(acc.id);
    setIsModalOpen(true);
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
    setEditingId(null);
  };

  const generateProjection = (amount: number, rate: number) => {
    const rows = [];
    let currentBalance = amount;
    const monthlyRate = rate / 100 / 12;
    
    for (let i = 1; i <= 12; i++) {
      const interest = currentBalance * monthlyRate;
      currentBalance += interest;
      rows.push({ month: i, interest, balance: currentBalance });
    }
    return rows;
  };

  const getDailyMetrics = (acc: ProfitAccount) => {
    const dailyInterest = (acc.initialAmount * (acc.annualRate / 100)) / 365;
    const yesterdayBalance = acc.initialAmount - dailyInterest;
    const todayBalance = acc.initialAmount; 
    
    return {
      dailyInterest,
      yesterdayBalance,
      todayBalance
    };
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rentabilidad</h1>
          <p className="text-slate-400 text-sm">Crece tu dinero día a día</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black p-3 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Tarjeta Resumen Global */}
      <div className="glass-panel bg-gradient-to-br from-emerald-900 to-teal-900 border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-emerald-400" />
            <h3 className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Interés Generado HOY</h3>
          </div>
          
          <p className="text-4xl font-bold text-white tracking-tight mb-1">
            ${formatCurrency(accounts.reduce((sum, acc) => sum + ((acc.initialAmount * (acc.annualRate / 100)) / 365), 0))}
          </p>
          
          <p className="text-xs text-emerald-400/80">
            Basado en {accounts.length} cuenta(s) activa(s)
          </p>
        </div>
      </div>

      {/* Lista de Cuentas */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <DollarSign size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No tienes cuentas configuradas.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 text-emerald-400 text-sm font-semibold">Agregar primera cuenta</button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc) => {
            const metrics = getDailyMetrics(acc);
            const isExpanded = expandedId === acc.id;

            return (
              <div key={acc.id} className="card-pro group relative overflow-hidden">
                {/* Header de la Tarjeta */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="font-bold text-white text-lg">{acc.entityName}</h3>
                    <p className="text-xs text-slate-400">{acc.accountType} • <span className="text-emerald-400">{acc.annualRate}% EA</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(acc)}
                      className="text-blue-400/50 hover:text-blue-500 transition-colors p-2"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="text-red-400/50 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Visualización de Crecimiento Diario */}
                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Saldo Ayer</span>
                    <span className="text-sm text-slate-300">${formatCurrency(metrics.yesterdayBalance)}</span>
                  </div>
                  
                  <div className="flex justify-center my-1">
                    <ArrowRight className="rotate-90 text-emerald-500" size={16} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-400 font-bold">Saldo Hoy</span>
                    <span className="text-lg font-bold text-white">${formatCurrency(metrics.todayBalance)}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase">Interés Ganado Hoy</span>
                    <span className="text-sm font-bold text-emerald-400">+${formatCurrency(metrics.dailyInterest)}</span>
                  </div>
                </div>

                {/* Toggle Proyección */}
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : acc.id)}
                  className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white py-2 transition-colors"
                >
                  {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  <span>{isExpanded ? 'Ocultar Proyección Mensual' : 'Ver Proyección Mensual (12 meses)'}</span>
                </button>

                {/* Tabla Expandida */}
                {isExpanded && (
                  <div className="mt-2 bg-black/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-500 border-b border-white/5">
                          <th className="py-2">Mes</th>
                          <th className="py-2 text-right">Interés</th>
                          <th className="py-2 text-right">Saldo Acum.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateProjection(acc.initialAmount, acc.annualRate).map((row) => (
                          <tr key={row.month} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                            <td className="py-2 text-slate-300">{row.month}</td>
                            <td className="py-2 text-right text-emerald-400">+${formatCurrency(row.interest)}</td>
                            <td className="py-2 text-right text-white font-medium">${formatCurrency(row.balance)}</td>
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

      {/* Modal Moderno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 border-t sm:border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Entidad Financiera</label>
                <select 
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="input-modern"
                >
                  <option value="">Selecciona un banco...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Tipo de Producto</label>
                <select 
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="input-modern"
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Monto Actual ($)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 1000000"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Tasa Anual (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Ej: 9.5"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="input-modern pr-10"
                  />
                  <Percent className="absolute right-3 top-3 text-slate-500" size={20} />
                </div>
              </div>

              {/* ✅ BOTÓN GUARDAR SIEMPRE VISIBLE Y CLARO */}
              <button 
                onClick={handleAddOrUpdate}
                className="btn-primary mt-6 w-full"
              >
                <Save size={20} /> {editingId ? 'Actualizar Configuración' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}