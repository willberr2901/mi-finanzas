import { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, Clock, DollarSign, Car } from 'lucide-react';
import RouteMap from './RouteMap';
import { calculateRoute, geocodeAddress, calculateETA, formatDuration, formatDistance, type RoutePoint } from '../services/routeService';
import { getTollsOnRoute } from '../services/tollDatabase';
import type { RouteInfo } from '../services/routeService';
import type { Toll } from '../services/tollDatabase';

export default function RoutePlanner() {
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [tolls, setTolls] = useState<Toll[]>([]);
  const [totalTollCost, setTotalTollCost] = useState(0);
  const [vehicleCategory, setVehicleCategory] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setOriginInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        },
        () => {
          setUserLocation([4.5709, -74.2973]);
          setOriginInput('Bogotá');
        }
      );
    } else {
      setUserLocation([4.5709, -74.2973]);
      setOriginInput('Bogotá');
    }
  }, []);

  const handleCalculateRoute = async () => {
    if (!originInput.trim() || !destInput.trim()) {
      setError('Por favor ingresa origen y destino');
      return;
    }

    setLoading(true);
    setError('');
    setHasCalculated(false);
    
    try {
      const originPoint = await geocodeAddress(originInput);
      const destPoint = await geocodeAddress(destInput);
      
      setOrigin(originPoint);
      setDestination(destPoint);
      
      const routeInfo = await calculateRoute(originPoint, destPoint);
      setRoute(routeInfo);
      
      const { tolls: routeTolls, totalCost } = getTollsOnRoute(
        { lat1: originPoint.lat, lng1: originPoint.lng, lat2: destPoint.lat, lng2: destPoint.lng },
        vehicleCategory
      );
      
      setTolls(routeTolls);
      setTotalTollCost(totalCost);
      setHasCalculated(true);
      
    } catch (err: any) {
      setError(err.message || 'No se pudo calcular la ruta. Usa nombres de ciudades simples.');
      setHasCalculated(false);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => 
    amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const estimatedFuelCost = route ? (route.distance * 350) : 0;

  return (
    <div className="space-y-4" key="route-planner">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Navigation className="w-7 h-7" />
          Rutas y Peajes
        </h2>
        <p className="text-white/80 text-sm">Planifica tu viaje y conoce los peajes</p>
      </div>

      {/* Formulario */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              Origen
            </label>
            <input
              type="text"
              value={originInput}
              onChange={e => setOriginInput(e.target.value)}
              placeholder="Ej: Bogotá"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" />
              Destino
            </label>
            <input
              type="text"
              value={destInput}
              onChange={e => setDestInput(e.target.value)}
              placeholder="Ej: Medellín"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Tipo de Vehículo
          </label>
          <select
            value={vehicleCategory}
            onChange={e => setVehicleCategory(parseInt(e.target.value))}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={1}>🏍️ Motocicleta</option>
            <option value={2}>🚗 Automóvil</option>
            <option value={3}>🚙 Campero/Camioneta</option>
            <option value={4}>🚌 Bus/Camión</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleCalculateRoute}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Calculando ruta...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Calcular Ruta
            </>
          )}
        </button>
      </div>

      {/* Mapa */}
      <div className="h-96 lg:h-[500px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700" key="map-container">
        <RouteMap 
          origin={origin}
          destination={destination}
          route={route}
          tolls={tolls}
        />
      </div>

      {/* Resultados - Usar hasCalculated en lugar de verificar route && origin && destination */}
      {hasCalculated && route && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" key="results">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
              <h3 className="text-white font-bold mb-3">Información del Viaje</h3>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>Tiempo</span>
                </div>
                <span className="text-white font-bold">{formatDuration(route.duration)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-300">
                  <Navigation className="w-5 h-5 text-green-400" />
                  <span>Distancia</span>
                </div>
                <span className="text-white font-bold">{formatDistance(route.distance)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span>Llegada</span>
                </div>
                <span className="text-white font-bold">{calculateETA(route.duration)}</span>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
              <h3 className="text-white font-bold mb-3">Costos Estimados</h3>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-300">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span>Peajes ({tolls.length})</span>
                </div>
                <span className="text-yellow-400 font-bold">{formatMoney(totalTollCost)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-300">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span>Gasolina (est.)</span>
                </div>
                <span className="text-green-400 font-bold">{formatMoney(estimatedFuelCost)}</span>
              </div>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Total estimado</span>
                  <span className="text-white font-bold text-lg">
                    {formatMoney(totalTollCost + estimatedFuelCost)}
                  </span>
                </div>
              </div>
            </div>

            {tolls.length > 0 && (
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <h3 className="text-white font-bold mb-3">Peajes en la Ruta</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tolls.map(toll => (
                    <div key={toll.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-white font-medium text-sm">{toll.name}</p>
                      <p className="text-gray-400 text-xs">{toll.road}</p>
                      <p className="text-yellow-400 font-bold text-sm mt-1">
                        ${toll.category2.toLocaleString('es-CO')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 className="text-white font-bold mb-3">Instrucciones de la Ruta</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {route.instructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  <p className="text-gray-300 text-sm pt-0.5">{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}