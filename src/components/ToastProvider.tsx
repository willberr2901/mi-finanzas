/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 CONTENEDOR DE AVISOS (donde aparecen los toasts)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: ubica los avisos arriba al centro, máximo 3 a la vez, y los
 *           cierra al cambiar de módulo para que no queden avisos viejos.
 * Estilos: clase .mf-toast en src/index.css · Diseño interno: ToastCard.tsx
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer, Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
  const { pathname } = useLocation();
  // Al entrar a otro módulo se cierran los avisos del módulo anterior.
  useEffect(() => { toast.dismiss(); }, [pathname]);

  return (
    <ToastContainer
      position="top-center"
      autoClose={3200}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      draggable
      draggableDirection="y"
      pauseOnHover
      theme="dark"
      transition={Slide}
      limit={3}
      closeButton={false}
    />
  );
}
