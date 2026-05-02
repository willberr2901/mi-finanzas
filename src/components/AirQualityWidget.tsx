import { useState, useEffect } from 'react';
import { getAirQualityByCity, getAQIColor, getAQIRecommendation } from '../services/airQualityService';
import type { AirQualityData } from '../services/airQualityService';
import { Search, Wind, MapPin, AlertTriangle } from 'lucide-react';

export default function AirQualityWidget() {
  const [city, setCity] = useState('Bogotá'); // Por defecto Bogotá
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAirQuality = async (cityName: string) => {
    setLoading(true);
    setError('');
    try {
      // Buscar en formato "Bogota, Colombia" para mejor precisión
      const result = await getAirQualityByCity(cityName);
      setData(result);
    } catch (err) {
      setError('No se pudo cargar la calidad del aire. Intenta con otra ciudad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirQuality(city);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchAirQuality(city);
    }
  };

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ciudad (ej: Bogotá, Medellín)"
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          {loading ? 'Cargando...' : <Search className="w-5 h-5" />}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Contenido Principal */}
      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta Principal AQI */}
          <div className={`p-8 rounded-2xl text-white shadow-2xl flex flex-col justify-between ${getAQIColor(data.aqi)}`}>
            <div>
              <h2 className="text-3xl font-bold mb-1">Calidad del Aire</h2>
              <p className="text-lg opacity-90">{data.city}, {data.state}</p>
              <p className="text-sm opacity-75 mt-2">Actualizado: {data.timestamp}</p>
            </div>
            
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 uppercase">Índice (AQI)</p>
                <p className="text-7xl font-black">{data.aqi}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold bg-white/20 px-3 py-1 rounded-lg inline-block">
                  {data.status}
                </p>
              </div>
            </div>
          </div>

          {/* Panel de Recomendaciones */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wind className="w-6 h-6 text-blue-400" />
              Recomendaciones
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              {getAQIRecommendation(data.aqi)}
            </p>

            <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Contaminante Principal</p>
              <p className="text-white font-bold text-xl">{data.dominentpol}</p>
            </div>

            {/* Barra de escala */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Buena</span>
                <span>Moderada</span>
                <span>Mala</span>
                <span>Peligrosa</span>
              </div>
              <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-gray-900"
                  style={{ left: `${Math.min((data.aqi / 300) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}