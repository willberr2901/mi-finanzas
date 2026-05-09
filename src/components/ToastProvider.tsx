import { useEffect } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .Toastify__toast {
        background: #0f172a !important;
        backdrop-filter: none !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.9) !important;
        border: 1px solid #334155 !important;
        opacity: 1 !important;
        z-index: 99999 !important;
        border-radius: 12px !important;
        padding: 0 !important;
      }
      .Toastify__toast-body {
        color: #ffffff !important;
        font-weight: 500 !important;
        padding: 12px 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      .Toastify__close-button {
        color: #94a3b8 !important;
        opacity: 1 !important;
        margin-left: auto !important;
        padding: 8px !important;
      }
      .Toastify__progress-bar {
        height: 4px !important;
        background: #10b981 !important;
        border-radius: 0 0 12px 12px !important;
      }
    `;
    document.head.appendChild(style);

    // ✅ FIX: .remove() retorna void, solucionando el error TS2345
    return () => {
      style.remove();
    };
  }, []);

  return (
    <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      transition={Slide}
      limit={3}
    />
  );
}