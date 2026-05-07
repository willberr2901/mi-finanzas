import { useState } from 'react';
import { MessageSquare, Send, X, Star, Mail, User } from 'lucide-react';
import { notify } from '../services/notificationService';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', comment: '', rating: 5 });

  const handleSubmit = () => {
    if (!formData.comment.trim()) {
      notify({ title: '⚠️ Atención', message: 'Por favor escribe un comentario.', type: 'warning' });
      return;
    }

    // Guardar feedback
    const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
    feedbacks.push({ ...formData, date: new Date().toISOString() });
    localStorage.setItem('userFeedback', JSON.stringify(feedbacks));

    notify({
      title: '✅ Gracias por tu ayuda',
      message: 'Hemos recibido tu feedback correctamente.',
      type: 'success'
    });
    
    setFormData({ name: '', email: '', comment: '', rating: 5 });
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 transition-all hover:scale-110"
        title="Enviar Feedback"
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
            
            <div className="space-y-4">
              {/* Nombre */}
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 p-3 text-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Correo */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="email" 
                  placeholder="tu@correo.com (opcional)"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 p-3 text-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Rating */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={24}
                    className={`${star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} cursor-pointer transition-colors`}
                    onClick={() => setFormData({...formData, rating: star})}
                  />
                ))}
              </div>

              {/* Comentario */}
              <textarea 
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                placeholder="Describe el bug o sugerencia..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white resize-none focus:border-blue-500 outline-none"
              />
              
              <button 
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Send size={18} /> Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}