import { useState, useEffect } from 'react';
import { Wind, AlertTriangle, Info, MapPin, Search } from 'lucide-react';

const GLASS_STYLE = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
};

export default function AirQualityWidget() {
  const [city, setCity] = useState('Bogotá');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAQI = async () => {
    setLoading(true);
    try {
      const token = 'demo'; 
      const response = await fetch(`https://api.waqi.info/feed/${city}/?token=${token}`);
      const json = await response.json();
      
      if (json.status === 'ok') {
        setData(json.data);
      } else {
        alert('Ciudad no encontrada. Intenta con "Bogota" o "Medellin"');
      }
    } catch (error) {
      console.error('Error fetching air quality:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAQI();
  }, []);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-400';
    if (aqi <= 100) return 'text-yellow-400';
    if (aqi <= 150) return 'text-orange-400';
    if (aqi <= 200) return 'text-red-400';
    return 'text-purple-400';
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return 'Bueno';
    if (aqi <= 100) return 'Moderado';
    if (aqi <= 150) return 'Insalubre para grupos sensibles';
    if (aqi <= 200) return 'Insalubre';
    return 'Muy Insalubre';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Wind className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Calidad del Aire</h1>
          <p className="text-xs text-gray-400">Monitoreo en tiempo real</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAQI()}
            placeholder="Ciudad (ej: Bogotá, Medellín)"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all"
          />
        </div>
        <button 
          onClick={fetchAQI}
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold px-6 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? '...' : <Search className="w-5 h-5" />}
        </button>
      </div>

      {data && (
        <>
          <div className="rounded-2xl p-6 relative overflow-hidden" style={GLASS_STYLE}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    {data.city.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Actualizado: {new Date(data.time.s).toLocaleDateString()}
                  </p>
                </div>
                <div className={`text-5xl font-extrabold ${getAQIColor(data.aqi)} text-shadow-glow`}>
                  {data.aqi}
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Índice AQI</p>
                  <p className={`text-lg font-bold ${getAQIColor(data.aqi)}`}>
                    {getAQILabel(data.aqi)}
                  </p>
                </div>
                <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${data.aqi <= 50 ? 'bg-green-500' : data.aqi <= 100 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min((data.aqi / 300) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Contaminantes Principales
              </h3>
              <div className="space-y-3">
                {Object.entries(data.iaqi).slice(0, 5).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-400 font-mono text-sm">{key.toUpperCase()}</span>
                    <span className="text-white font-bold">{val.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Recomendación de Salud
              </h3>
              <div className="text-sm text-gray-300 leading-relaxed">
                {data.aqi <= 50 ? (
                  <p>✅ El aire es excelente. Disfruta de actividades al aire libre sin preocupaciones.</p>
                ) : data.aqi <= 100 ? (
                  <p>⚠️ Calidad aceptable. Personas sensibles deben reducir ejercicio prolongado al aire libre.</p>
                ) : (
                  <p>❌ El aire es insalubre. Evita actividades al aire libre y usa tapabocas si debes salir.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}