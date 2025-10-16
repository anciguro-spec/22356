export interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  description: string;
  windSpeed?: number;
  pressure?: number;
  timestamp: string;
  source: string;
}

export const getCurrentWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&timezone=auto`
    );

    if (!response.ok) {
      throw new Error('Weather data unavailable');
    }

    const data = await response.json();
    const current = data.current;

    const weatherCodeMap: Record<number, { conditions: string; description: string }> = {
      0: { conditions: 'Clear', description: 'Clear sky' },
      1: { conditions: 'Partly Cloudy', description: 'Mainly clear' },
      2: { conditions: 'Partly Cloudy', description: 'Partly cloudy' },
      3: { conditions: 'Cloudy', description: 'Overcast' },
      45: { conditions: 'Foggy', description: 'Foggy' },
      48: { conditions: 'Foggy', description: 'Depositing rime fog' },
      51: { conditions: 'Drizzle', description: 'Light drizzle' },
      53: { conditions: 'Drizzle', description: 'Moderate drizzle' },
      55: { conditions: 'Drizzle', description: 'Dense drizzle' },
      61: { conditions: 'Rainy', description: 'Slight rain' },
      63: { conditions: 'Rainy', description: 'Moderate rain' },
      65: { conditions: 'Rainy', description: 'Heavy rain' },
      71: { conditions: 'Snowy', description: 'Slight snow' },
      73: { conditions: 'Snowy', description: 'Moderate snow' },
      75: { conditions: 'Snowy', description: 'Heavy snow' },
      95: { conditions: 'Stormy', description: 'Thunderstorm' },
    };

    const weatherInfo =
      weatherCodeMap[current.weather_code as number] || {
        conditions: 'Unknown',
        description: 'Unknown conditions',
      };

    return {
      temperature: Math.round(current.temperature_2m * 10) / 10,
      humidity: Math.round(current.relative_humidity_2m),
      conditions: weatherInfo.conditions,
      description: weatherInfo.description,
      windSpeed: current.wind_speed_10m,
      pressure: current.surface_pressure,
      timestamp: current.time,
      source: 'Open-Meteo',
    };
  } catch (error) {
    throw new Error('Failed to fetch weather data');
  }
};
