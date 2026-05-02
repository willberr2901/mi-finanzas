import { useEffect } from 'react';
import MarketList from '../components/MarketList';
import { useMarketStore } from '../store/marketStore';

export default function MarketPage() {
  const { loadItems } = useMarketStore();

  useEffect(() => {
    console.log('🔄 Cargando items de mercado...');
    loadItems();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-4 pt-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🛒 Mi Mercado
        </h1>
        <p className="text-gray-400 text-sm">Lista inteligente de compras</p>
      </header>
      
      <MarketList />
    </div>
  );
}