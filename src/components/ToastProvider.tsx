import { useEffect } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const customStyles = `
  .Toastify__toast {
    background: #0f172a !important;
    color: white !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    font-family: 'Inter', sans-serif !important;
    min-height: 60px !important;
    opacity: 1 !important;
    z-index: 9999 !important;
  }
  .Toastify__toast-body {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px !important;
    font-weight: 500;
    color: #ffffff !important;
  }
  .Toastify__close-button { color: #94a3b8 !important; opacity: 1 !important; margin-left: 10px !important; }
  .Toastify__progress-bar { height: 4px !important; background: linear-gradient(90deg, #10b981, #3b82f6) !important; }
`;

export default function ToastProvider() {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
    return () => { document.head.removeChild(styleElement); };
  }, []);

  return (
    <ToastContainer
      position="top-center"
      autoClose={5000}
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
      toastClassName={() => "mb-4"}
    />
  );
}