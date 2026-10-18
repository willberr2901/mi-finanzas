import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Aplica el tema antes de pintar para que no se vea un destello del tema contrario.
try {
  const pref = JSON.parse(localStorage.getItem('mf_prefs') || '{}').theme || 'dark';
  const light = pref === 'light' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.classList.add(light ? 'light' : 'dark');
} catch { document.documentElement.classList.add('dark'); }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);