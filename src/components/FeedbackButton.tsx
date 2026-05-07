import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { notify } from '../services/notificationService';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    
    const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
    feedbacks.push({ date: new Date().toISOString(), message });
    localStorage.setItem('userFeedback', JSON.stringify(feedbacks));

    notify({
      title: '✅ Feedback Enviado',
      message: 'Gracias por tu reporte.',
      type: 'success'
    });
    
    setMessage('');
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 transition-all hover:scale-110"
        title="Reportar Bug"
      >
        <MessageSquare size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Enviar Feedback</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} className="text-slate-400"/></button>
            </div>
            
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe el bug..."
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white resize-none focus:border-blue-500 outline-none"
            />
            
            <button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
            >
              <Send size={18} /> Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}