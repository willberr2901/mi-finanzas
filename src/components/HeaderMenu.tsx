import { useState } from 'react';
import { Menu, X, ShoppingCart, PieChart, History, Receipt } from 'lucide-react';

interface HeaderMenuProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export default function HeaderMenu({ currentView, onChangeView }: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'market', label: '🛒 Mercado', icon: ShoppingCart },
    { id: 'finances', label: '📊 Finanzas', icon: PieChart },
    { id: 'scan', label: '🧾 Escanear', icon: Receipt },
    { id: 'history', label: '📜 Historial', icon: History },
  ];

  return (
    <header className="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Mi Finanzas
        </h1>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-2xl z-50">
          <div className="max-w-4xl mx-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeView(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}