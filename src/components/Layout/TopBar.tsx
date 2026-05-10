import { Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu size={24} className="text-white" />
            </button>
          )}
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Mi Finanzas
          </h1>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold">
          G
        </div>
      </div>
    </div>
  );
}