import { useEffect } from 'react';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle, AlertTriangle, Info, XCircle, Bell } from 'lucide-react';

// Estilos personalizados inyectados
const customStyles = `
  .Toastify__toast {
    background: #1e293b !important;
    color: white !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    font-family: 'Inter', sans-serif !important;
  }
  .Toastify__toast-body {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px !important;
    font-weight: 500;
  }
  .Toastify__close-button {
    color: #94a3b8 !important;
    opacity: 1 !important;
  }
`;

export default function ToastProvider() {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
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
      toastClassName={() => "mb-4"}
    />
  );
}