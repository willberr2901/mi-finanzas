import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import PwaUpdate from '../pwa/PwaUpdate';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      {/* ✨ EFECTOS DE LUZ DE FONDO (GLOWS) */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Contenido */}
      <main className="relative z-10 pb-32 pt-4 px-4 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
      <PwaUpdate />
    </div>
  );
}