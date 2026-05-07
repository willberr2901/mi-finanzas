import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { notify } from '../services/notificationService';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    
    // Aquí podrías enviar a un servicio como EmailJS o guardar en localStorage para revisión posterior
    const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
    feedbacks.push({ date: new Date().toISOString(), message });
    localStorage.setItem('userFeedback', JSON.stringify(feedbacks));

    notify({
      title: '✅ Feedback Enviado',
      message: 'Gracias por tu reporte. Lo revisaremos pronto.',
      type: 'success'
    });
    
    setMessage('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 transition-all"
        title="Reportar Bug o Sugerencia"
      >
        <MessageSquare size={20} />
      </button>

      {/* Modal de Feedback */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Enviar Feedback</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe el bug o sugerencia..."
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none focus:border-blue-500 outline-none"
            />
            
            <button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg mt-4 flex items-center justify-center gap-2"
            >
              <Send size={18} /> Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}