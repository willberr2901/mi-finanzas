import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteInfo, RoutePoint } from '../services/routeService';
import type { Toll } from '../services/tollDatabase';

// Fix para iconos de Leaflet en React
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const tollIcon = L.divIcon({
  className: 'custom-toll-icon',
  html: '<div style="background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; border: 2px solid white;">💰</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

interface RouteMapProps {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  route: RouteInfo | null;
  tolls: Toll[];
}

function MapUpdater({ origin, destination }: { origin: RoutePoint | null, destination: RoutePoint | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [origin, destination, map]);
  
  return null;
}

export default function RouteMap({ origin, destination, route, tolls }: RouteMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);
  
  const defaultCenter: [number, number] = [4.5709, -74.2973]; // Colombia
  
  const centerPosition = userLocation || (origin ? [origin.lat, origin.lng] : defaultCenter);
  
  return (
    <MapContainer
      center={centerPosition}
      zoom={origin ? 10 : 6}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater origin={origin} destination={destination} />
      
      {/* Ubicación del usuario */}
      {userLocation && (
        <Marker position={userLocation} icon={icon}>
          <Popup>Tu ubicación</Popup>
        </Marker>
      )}
      
      {/* Origen */}
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={icon}>
          <Popup>Origen: {origin.address || 'Punto de partida'}</Popup>
        </Marker>
      )}
      
      {/* Destino */}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={icon}>
          <Popup>Destino: {destination.address || 'Punto de llegada'}</Popup>
        </Marker>
      )}
      
      {/* Ruta */}
      {route && route.geometry.length > 0 && (
        <Polyline
          positions={route.geometry as [number, number][]}
          pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
        />
      )}
      
      {/* Peajes */}
      {tolls.map(toll => (
        <Marker key={toll.id} position={[toll.lat, toll.lng]} icon={tollIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-gray-900">{toll.name}</p>
              <p className="text-gray-700">{toll.road}</p>
              <p className="text-green-600 font-bold mt-1">
                ${toll.category2.toLocaleString('es-CO')}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}