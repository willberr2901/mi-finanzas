import { useState } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { Lock, AlertTriangle, Fingerprint } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function SecurityLock() {
  const { unlock, isSetup } = useSecurity();
  const { theme } = useTheme();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN muy corto');
      return;
    }

    setIsLoading(true);
    const success = await unlock(pin);
    
    if (!success) {
      setError('PIN incorrecto');
      setPin('');
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleNumberPress(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className={`${bgCard} backdrop-blur-md rounded-3xl border ${borderColor} p-6 w-full max-w-sm shadow-2xl`}>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
            <Lock className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <h2 className={`text-xl font-bold ${textPrimary}`}>
            {isSetup ? 'Ingresa tu PIN' : 'Configura tu PIN'}
          </h2>
          <p className={`text-sm ${textSecondary} mt-1`}>
            {isSetup ? 'Para acceder a tus datos' : 'Protege tu información financiera'}
          </p>
        </div>

        {/* Display de PIN */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 mb-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pin.length 
                    ? 'bg-green-500 border-green-500 scale-110' 
                    : `${isDark ? 'border-gray-600' : 'border-gray-300'}`
                }`}
              />
            ))}
          </div>
          {error && (
            <div className="flex items-center justify-center gap-1 text-red-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-6" onKeyDown={handleKeyPress} tabIndex={0}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberPress(num.toString())}
              disabled={isLoading}
              className={`h-14 rounded-xl font-bold text-xl transition-all active:scale-95 ${
                isDark 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={isLoading}
            className={`h-14 rounded-xl font-semibold text-sm transition-all ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Limpiar
          </button>
          <button
            onClick={() => handleNumberPress('0')}
            disabled={isLoading}
            className={`h-14 rounded-xl font-bold text-xl transition-all active:scale-95 ${
              isDark 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className={`h-14 rounded-xl transition-all ${
              isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'
            }`}
          >
            ⌫
          </button>
        </div>

        {/* Botón de acción */}
        <button
          onClick={handleSubmit}
          disabled={pin.length < 4 || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            pin.length >= 4 && !isLoading
              ? 'bg-gradient-to-r from-green-500 to-cyan-500 hover:scale-[1.02] shadow-lg'
              : 'bg-gray-600 opacity-50 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5" />
              {isSetup ? 'Desbloquear' : 'Guardar PIN'}
            </>
          )}
        </button>

        {/* Info de seguridad */}
        <p className={`text-[10px] ${textSecondary} text-center mt-4`}>
          🔐 Tus datos están encriptados y solo se guardan en este dispositivo
        </p>
      </div>
    </div>
  );
}