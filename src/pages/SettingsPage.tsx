import { useState } from 'react';
import { Trash2, MessageSquare } from 'lucide-react';
import { secureStorage } from '../utils/security';
import { notify } from '../services/notificationService';

export default function SettingsPage() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [name, setName] = useState('');

  const handleClearData = () => {
    if (confirm('⚠️ ¿Borrar todos los datos locales? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      sessionStorage.clear();
      notify({ title: '🗑️ Datos Eliminados', message: 'La app se recargará.', type: 'info' });
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const sendFeedback = () => {
    if (!feedbackText.trim()) return;
    // Guardamos feedback localmente
    const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
    feedbacks.push({ date: new Date().toISOString(), name, message: feedbackText });
    localStorage.setItem('userFeedback', JSON.stringify(feedbacks));

    notify({ title: '✅ Enviado', message: 'Gracias por tu ayuda.', type: 'success' });
    setShowFeedback(false);
    setFeedbackText('');
    setName('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      
      {showFeedback && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-emerald-500/30">
             <h3 className="text-lg font-bold mb-4">Enviar Reporte</h3>
             
             <input 
               type="text" 
               placeholder="Tu nombre" 
               className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-white mb-3 focus:border-emerald-500 outline-none"
               value={name}
               onChange={(e) => setName(e.target.value)}
             />

             <textarea 
               className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-white mb-4 h-32 resize-none focus:border-emerald-500 outline-none"
               placeholder="Describe el error o sugerencia..."
               value={feedbackText}
               onChange={(e) => setFeedbackText(e.target.value)}
             />
             
             <div className="flex gap-2">
               <button onClick={() => setShowFeedback(false)} className="flex-1 py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Cancelar</button>
               <button onClick={sendFeedback} className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors">Enviar</button>
             </div>
           </div>
        </div>
      )}

      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-2">
        <div 
          onClick={() => setShowFeedback(true)}
          className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl"><MessageSquare size={20} className="text-blue-400"/></div>
            <div>
              <h3 className="font-bold">Soporte y Feedback</h3>
              <p className="text-xs text-slate-400">Reportar un problema o sugerencia</p>
            </div>
          </div>
          <span className="text-slate-500">{'>'}</span>
        </div>

        <div onClick={handleClearData} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-xl"><Trash2 size={20} className="text-red-400"/></div>
            <div>
              <h3 className="font-bold text-red-400">Borrar Datos</h3>
              <p className="text-xs text-slate-500">Eliminar todo localmente</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-slate-500 mt-8">
        <p>Mi Finanzas v1.1.0 Pro</p>
        <p className="mt-1">Desarrollado con ❤️</p>
      </div>
    </div>
  );
}