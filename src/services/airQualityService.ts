// Token público de prueba para WAQI (World Air Quality Index)
// NOTA: Para uso intensivo, deberías registrarte en waqi.info y obtener tu propio token gratis.
const API_TOKEN = 'demo'; 
const BASE_URL = 'https://api.waqi.info/feed';

export interface AirQualityData {
  city: string;
  state: string;
  aqi: number; // Air Quality Index
  dominentpol: string; // Pollutant (PM2.5, O3, etc.)
  timestamp: string;
  status: string; // good, moderate, unhealthy, etc.
}

// Función para obtener calidad del aire por ciudad
export const getAirQualityByCity = async (city: string): Promise<AirQualityData> => {
  try {
    const response = await fetch(`${BASE_URL}/${city}/?token=${API_TOKEN}`);
    const json = await response.json();

    if (json.status === 'ok') {
      const { iaqi, time, city: cityInfo } = json.data;
      
      // Extraer AQI (PM2.5 is usually the default for AQI calculation)
      const aqi = iaqi.pm25 ? iaqi.pm25.v : iaqi.aqi ? iaqi.aqi.v : 0;
      
      return {
        city: cityInfo.name,
        state: cityInfo.country || 'Colombia',
        aqi: aqi,
        dominentpol: iaqi.d ? iaqi.d.v : 'PM2.5',
        timestamp: time.s,
        status: getAQIStatus(aqi)
      };
    } else {
      throw new Error('No se encontraron datos para esta ciudad');
    }
  } catch (error) {
    console.error('Error fetching air quality:', error);
    throw error;
  }
};

// Determinar el estado de salud basado en AQI
const getAQIStatus = (aqi: number): string => {
  if (aqi <= 50) return 'Buena';
  if (aqi <= 100) return 'Moderada';
  if (aqi <= 150) return 'Mala para grupos sensibles';
  if (aqi <= 200) return 'Mala';
  if (aqi <= 300) return 'Muy mala';
  return 'Peligrosa';
};

// Obtener color basado en AQI
export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return 'bg-green-500';
  if (aqi <= 100) return 'bg-yellow-500';
  if (aqi <= 150) return 'bg-orange-500';
  if (aqi <= 200) return 'bg-red-500';
  if (aqi <= 300) return 'bg-purple-500';
  return 'bg-red-900';
};

// Obtener recomendación basada en AQI
export const getAQIRecommendation = (aqi: number): string => {
  if (aqi <= 50) return '¡Calidad del aire excelente! Disfruta de actividades al aire libre.';
  if (aqi <= 100) return 'Calidad aceptable. Personas sensibles deberían reducir ejercicio prolongado al aire libre.';
  if (aqi <= 150) return 'Personas con enfermedades respiratorias o cardíacas deben limitar el esfuerzo exterior.';
  if (aqi <= 200) return 'Todos deben reducir el ejercicio prolongado al aire libre.';
  return 'Alerta sanitaria: Evita actividades al aire libre.';
};