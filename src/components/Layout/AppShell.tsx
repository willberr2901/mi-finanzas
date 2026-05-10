import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import PwaUpdateBanner from '../ui/PwaUpdateBanner';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-violet-500/30">
      <TopBar />
      
      <main className="pt-20 pb-32 px-4 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
      <PwaUpdateBanner />
    </div>
  );
}