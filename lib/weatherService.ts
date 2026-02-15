/**
 * Weather Service - MET Norway API Integration
 * Fetches weather data from Norwegian Meteorological Institute
 *
 * API: https://api.met.no/weatherapi/locationforecast/2.0/compact
 * Free for commercial use, CC BY 4.0 license
 * Attribution required: "Data from MET Norway"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Weather condition types
export type WeatherCondition = 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy' | 'stormy';

export type ForecastPoint = {
  time: string;
  isNow?: boolean;
  tempC: number;
  precipMm: number;
  windKmh: number;
  windArrow: string;
  condition: WeatherCondition;
};

// Region coordinates (max 4 decimal places as required by MET Norway)
const REGIONS = {
  gorenjska: { lat: 46.24, lon: 14.36, name: 'Kranj' },
  dolenjska: { lat: 45.80, lon: 15.16, name: 'Novo mesto' },
  stajerska: { lat: 46.55, lon: 15.65, name: 'Maribor' },
};

const MET_API_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const USER_AGENT = 'NaBajk/1.0 github.com/nabajk';

const CACHE_KEY = 'nabajk_weather_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CachedWeather {
  timestamp: number;
  region: string;
  data: ForecastPoint[];
}

// Map wind direction degrees to arrow
function getWindArrow(degrees: number): string {
  // MET Norway uses "wind_from_direction" - the direction wind comes FROM
  // We want to show where wind is going TO, so we add 180 degrees
  const toDirection = (degrees + 180) % 360;
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round(toDirection / 45) % 8;
  return arrows[index];
}

// Map MET Norway symbol_code to our weather condition
function mapSymbolCode(code: string): WeatherCondition {
  // Remove day/night/polartwilight suffix
  const base = code.replace(/_day|_night|_polartwilight/g, '');

  // Check for precipitation types
  if (base.includes('rain') || base.includes('sleet') || base.includes('drizzle')) {
    return 'rainy';
  }
  if (base.includes('snow') || base.includes('thunder')) {
    return 'stormy';
  }

  // Check for clear/cloudy conditions
  if (base === 'clearsky' || base === 'fair') {
    return 'sunny';
  }
  if (base.includes('partlycloudy')) {
    return 'partly-cloudy';
  }

  // Default to cloudy for fog, overcast, etc.
  return 'cloudy';
}

// Fetch weather from MET Norway API
async function fetchFromMET(lat: number, lon: number): Promise<any> {
  const response = await fetch(
    `${MET_API_URL}?lat=${lat}&lon=${lon}`,
    {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`MET API error: ${response.status}`);
  }

  return response.json();
}

// Parse MET Norway response into ForecastPoints
function parseMetResponse(data: any): ForecastPoint[] {
  const timeseries = data?.properties?.timeseries;
  if (!timeseries || !Array.isArray(timeseries) || timeseries.length === 0) {
    throw new Error('Invalid MET response: no timeseries data');
  }

  const forecasts: ForecastPoint[] = [];
  const now = new Date();

  // Get forecasts for now, +2h, +4h
  // MET returns hourly data, so indices 0, 2, 4
  for (let offset = 0; offset <= 4; offset += 2) {
    const entry = timeseries[offset];
    if (!entry) continue;

    const time = new Date(entry.time);
    const instant = entry.data?.instant?.details || {};
    const next1h = entry.data?.next_1_hours;

    // Get symbol code from next_1_hours or next_6_hours
    const symbolCode = next1h?.summary?.symbol_code ||
      entry.data?.next_6_hours?.summary?.symbol_code ||
      'cloudy';

    // Get precipitation from next_1_hours
    const precipMm = next1h?.details?.precipitation_amount ?? 0;

    forecasts.push({
      time: `${time.getHours().toString().padStart(2, '0')}:00`,
      isNow: offset === 0,
      tempC: Math.round(instant.air_temperature ?? 10),
      precipMm: Math.round(precipMm * 10) / 10,
      windKmh: Math.round((instant.wind_speed ?? 0) * 3.6), // m/s to km/h
      windArrow: getWindArrow(instant.wind_from_direction ?? 0),
      condition: mapSymbolCode(symbolCode),
    });
  }

  return forecasts;
}

// Get cached weather data
async function getCachedWeather(region: string): Promise<ForecastPoint[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedWeather = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (data.region === region && (now - data.timestamp) < CACHE_DURATION_MS) {
      return data.data;
    }

    return null;
  } catch {
    return null;
  }
}

// Save weather data to cache
async function cacheWeather(region: string, data: ForecastPoint[]): Promise<void> {
  try {
    const cached: CachedWeather = {
      timestamp: Date.now(),
      region,
      data,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore cache errors
  }
}

// Generate fallback data when API fails
function getFallbackForecast(): ForecastPoint[] {
  const now = new Date();
  const conditions: WeatherCondition[] = ['cloudy', 'cloudy', 'cloudy'];

  return [0, 2, 4].map((offset, index) => {
    const hour = (now.getHours() + offset) % 24;
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      isNow: offset === 0,
      tempC: 10,
      precipMm: 0,
      windKmh: 10,
      windArrow: '→',
      condition: conditions[index],
    };
  });
}

/**
 * Main function to get weather forecast
 * @param region - Region ID (gorenjska, dolenjska, stajerska)
 * @returns Array of 3 ForecastPoints for upcoming time slots
 */
export async function getWeatherForecast(region: string = 'gorenjska'): Promise<ForecastPoint[]> {
  // Check cache first
  const cached = await getCachedWeather(region);
  if (cached) {
    return cached;
  }

  const coords = REGIONS[region as keyof typeof REGIONS] || REGIONS.gorenjska;

  try {
    const metData = await fetchFromMET(coords.lat, coords.lon);
    const forecasts = parseMetResponse(metData);

    // Cache the result
    await cacheWeather(region, forecasts);

    return forecasts;
  } catch (error) {
    console.warn('Failed to fetch weather from MET Norway:', error);

    // Return fallback data
    return getFallbackForecast();
  }
}

/**
 * Force refresh weather data (ignores cache)
 */
export async function refreshWeather(region: string = 'gorenjska'): Promise<ForecastPoint[]> {
  await AsyncStorage.removeItem(CACHE_KEY);
  return getWeatherForecast(region);
}
