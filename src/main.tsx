import React, { StrictMode, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const ErrorBoundaryFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white p-6">
    <div className="text-center space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Algo salió mal</h2>
      <p className="text-slate-400">Recarga la página o contacta soporte si el problema persiste.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors"
      >
        Recargar App
      </button>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950" />}>
      <App />
    </Suspense>
  </StrictMode>
);