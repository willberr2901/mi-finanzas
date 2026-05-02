export interface Toll {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category1: number; // Categoría 1 (motocicleta)
  category2: number; // Categoría 2 (carro)
  category3: number; // Categoría 3 (campero)
  category4: number; // Categoría 4 (bus/camión)
  road: string; // Vía
}

// Principales peajes de Colombia (precios aproximados 2024)
export const colombianTolls: Toll[] = [
  // Bogotá - Medellín
  { id: '1', name: 'Peaje Salgar', lat: 6.2442, lng: -75.5812, category1: 11700, category2: 23400, category3: 35100, category4: 46800, road: 'Medellín-Bogotá' },
  { id: '2', name: 'Peaje La Pintada', lat: 5.5333, lng: -75.7167, category1: 11700, category2: 23400, category3: 35100, category4: 46800, road: 'Medellín-Bogotá' },
  
  // Bogotá - Girardot
  { id: '3', name: 'Peaje Anapoima', lat: 4.7167, lng: -74.3833, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Bogotá-Girardot' },
  { id: '4', name: 'Peaje Apulo', lat: 4.6833, lng: -74.2833, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Bogotá-Girardot' },
  { id: '5', name: 'Peaje Boquerón', lat: 4.6500, lng: -74.2167, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Bogotá-Girardot' },
  
  // Bogotá - Villavicencio
  { id: '6', name: 'Peaje San Mateo', lat: 4.3833, lng: -73.9167, category1: 11700, category2: 23400, category3: 35100, category4: 46800, road: 'Bogotá-Villavicencio' },
  { id: '7', name: 'Peaje La Esperanza', lat: 4.3500, lng: -73.8333, category1: 11700, category2: 23400, category3: 35100, category4: 46800, road: 'Bogotá-Villavicencio' },
  
  // Medellín - Santa Fe de Antioquia
  { id: '8', name: 'Peaje La Herradura', lat: 6.5167, lng: -75.8333, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Medellín-Santa Fe' },
  
  // Cali - Buenaventura
  { id: '9', name: 'Peaje La Paila', lat: 3.8833, lng: -76.3167, category1: 11700, category2: 23400, category3: 35100, category4: 46800, road: 'Cali-Buenaventura' },
  
  // Barranquilla - Cartagena
  { id: '10', name: 'Peaje Arroyo de Piedra', lat: 10.3167, lng: -75.5167, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Barranquilla-Cartagena' },
  
  // Bogotá - Tunja
  { id: '11', name: 'Peaje San Miguel', lat: 5.3833, lng: -73.4167, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Bogotá-Tunja' },
  
  // Eje Cafetero
  { id: '12', name: 'Peaje Cartago', lat: 4.7500, lng: -75.9167, category1: 9400, category2: 18800, category3: 28200, category4: 37600, road: 'Pereira-Cali' },
];

export const getTollsOnRoute = (routeBounds: {lat1: number, lng1: number, lat2: number, lng2: number}, vehicleCategory: number = 2): {tolls: Toll[], totalCost: number} => {
  const { lat1, lng1, lat2, lng2 } = routeBounds;
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);
  
  // Margen de búsqueda (aproximadamente 50km)
  const margin = 0.5;
  
  const tollsOnRoute = colombianTolls.filter(toll => 
    toll.lat >= minLat - margin && 
    toll.lat <= maxLat + margin &&
    toll.lng >= minLng - margin && 
    toll.lng <= maxLng + margin
  );
  
  let totalCost = 0;
  tollsOnRoute.forEach(toll => {
    switch(vehicleCategory) {
      case 1: totalCost += toll.category1; break;
      case 2: totalCost += toll.category2; break;
      case 3: totalCost += toll.category3; break;
      case 4: totalCost += toll.category4; break;
      default: totalCost += toll.category2;
    }
  });
  
  return { tolls: tollsOnRoute, totalCost };
};

export const getVehicleCategoryName = (category: number): string => {
  const categories: Record<number, string> = {
    1: 'Motocicleta',
    2: 'Automóvil',
    3: 'Campero/Camioneta',
    4: 'Bus/Camión'
  };
  return categories[category] || 'Automóvil';
};