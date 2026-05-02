export interface RoutePoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface RouteInfo {
  distance: number; // en km
  duration: number; // en minutos
  geometry: Array<[number, number]>; // coordenadas de la ruta
  instructions: string[];
}

export const calculateRoute = async (
  origin: RoutePoint,
  destination: RoutePoint
): Promise<RouteInfo> => {
  try {
    // Usar OSRM (Open Source Routing Machine) - gratuito
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error('No se pudo calcular la ruta');
    }
    
    const route = data.routes[0];
    const legs = route.legs[0];
    
    // Extraer instrucciones
    const instructions = legs.steps.map((step: any) => {
      const maneuver = step.maneuver;
      const modifier = maneuver.modifier || 'straight';
      const type = maneuver.type;
      
      if (type === 'depart') return `Sal desde ${origin.address || 'origen'}`;
      if (type === 'arrive') return `Llegaste a ${destination.address || 'destino'}`;
      if (type === 'turn') return `Gira a la ${modifier}`;
      if (type === 'continue') return `Continúa recto`;
      if (type === 'roundabout') return `Toma la rotonda`;
      return step.name || 'Continúa';
    });
    
    return {
      distance: route.distance / 1000, // convertir a km
      duration: route.duration / 60, // convertir a minutos
      geometry: route.geometry.coordinates,
      instructions
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
};

// Geocodificación (convertir dirección a coordenadas)
export const geocodeAddress = async (address: string): Promise<RoutePoint> => {
  try {
    // Usar Nominatim (OpenStreetMap) - gratuito
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Colombia')}&limit=1`
    );
    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error('Dirección no encontrada');
    }
    
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      address: data[0].display_name
    };
  } catch (error) {
    console.error('Error geocoding:', error);
    throw error;
  }
};

// Reverse geocoding (coordenadas a dirección)
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// Calcular tiempo estimado de llegada
export const calculateETA = (durationMinutes: number): string => {
  const now = new Date();
  const arrival = new Date(now.getTime() + durationMinutes * 60000);
  
  const hours = arrival.getHours().toString().padStart(2, '0');
  const minutes = arrival.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// Formatear duración
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins} min`;
};

// Formatear distancia
export const formatDistance = (km: number): string => {
  return `${km.toFixed(1)} km`;
};