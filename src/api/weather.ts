export type PressureLevel = "low" | "normal" | "high" | undefined;

export interface WeatherData {
  temperature_2m: number;
  apparent_temperature: number;
  surface_pressure: number;
  weather_code: number;
  time: string;
  condition: string;
  icon: string;
  pressureLevel: PressureLevel;
}

export interface WeatherAPIResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    surface_pressure?: number;
    weather_code?: number;
    time?: string;
  };
}

export interface WeatherError {
  message: string;
  code?: number;
}

export const weatherCodeMap: Record<
  number,
  { condition: string; icon: string }
> = {
  0: { condition: "sunny", icon: "☀️" },
  1: { condition: "sunny", icon: "☀️" },
  2: { condition: "cloudy", icon: "☁️" },
  3: { condition: "cloudy", icon: "☁️" },
  45: { condition: "cloudy", icon: "☁️" },
  48: { condition: "cloudy", icon: "☁️" },
  51: { condition: "rain", icon: "🌧️" },
  53: { condition: "rain", icon: "🌧️" },
  55: { condition: "rain", icon: "🌧️" },
  61: { condition: "rain", icon: "🌧️" },
  63: { condition: "rain", icon: "🌧️" },
  65: { condition: "rain", icon: "🌧️" },
  71: { condition: "snow", icon: "❄️" },
  73: { condition: "snow", icon: "❄️" },
  75: { condition: "snow", icon: "❄️" },
  77: { condition: "snow", icon: "❄️" },
  80: { condition: "rain", icon: "🌧️" },
  81: { condition: "rain", icon: "🌧️" },
  82: { condition: "rain", icon: "🌧️" },
  85: { condition: "snow", icon: "❄️" },
  86: { condition: "snow", icon: "❄️" },
};

function classifyPressure(value: number): PressureLevel {
  if (!Number.isFinite(value)) return undefined;
  if (value < 1007) return "low";
  if (value <= 1020) return "normal";
  return "high";
}

function normalizeCurrent(
  current?: WeatherAPIResponse["current"]
): WeatherData | null {
  if (!current) return null;

  const temperature = Number(current.temperature_2m);
  const apparent = Number(current.apparent_temperature);
  const pressure = Number(current.surface_pressure);
  const weatherCode = Number(current.weather_code);
  const time = typeof current.time === "string" ? current.time : "";

  if (
    !Number.isFinite(temperature) ||
    !Number.isFinite(apparent) ||
    !Number.isFinite(pressure) ||
    !Number.isFinite(weatherCode) ||
    !time
  ) {
    return null;
  }

  const mapped = weatherCodeMap[weatherCode] ?? {
    condition: "cloudy",
    icon: "☁️",
  };

  return {
    temperature_2m: temperature,
    apparent_temperature: apparent,
    surface_pressure: pressure,
    weather_code: weatherCode,
    time,
    condition: mapped.condition,
    icon: mapped.icon,
    pressureLevel: classifyPressure(pressure),
  };
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData | WeatherError> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current:
        "temperature_2m,apparent_temperature,surface_pressure,weather_code",
      timezone: "auto",
    });

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );
    if (!res.ok) {
      return { message: "Weather API error", code: res.status };
    }

    const data = (await res.json()) as WeatherAPIResponse;
    if (!data.current) {
      return { message: "Weather data is unavailable" };
    }

    const normalized = normalizeCurrent(data.current);
    if (!normalized) {
      return { message: "Weather data is unavailable" };
    }

    return normalized;
  } catch (err) {
    return {
      message:
        err instanceof Error
          ? err.message
          : "Unexpected error while fetching weather",
    };
  }
}
