import { useState } from 'react';
import { ShoppingCart, TrendingUp, Receipt, History } from 'lucide-react';

interface TabProps {
  children: React.ReactNode;
}

export default function TabsNavigation({ children }: TabProps) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { icon: ShoppingCart, label: 'Mercado' },
    { icon: TrendingUp, label: 'Finanzas' },
    { icon: Receipt, label: 'Escanear' },
    { icon: History, label: 'Historial' },
  ];

  const tabChildren = Array.isArray(children) ? children : [children];

  return (
    <div>
      {/* Navegación de Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-xl overflow-x-auto">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === index
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido de la Tab activa */}
      <div className="animate-fadeIn">
        {tabChildren[activeTab]}
      </div>
    </div>
  );
}