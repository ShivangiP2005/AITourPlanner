export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get("destination")

  if (!destination) {
    return new Response("Destination is required", { status: 400 })
  }

  try {
    // Geocode the destination to get coordinates
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`,
    )
    const geoData = await geoResponse.json()

    if (!geoData.results || geoData.results.length === 0) {
      return new Response("Destination not found", { status: 404 })
    }

    const { latitude, longitude, name, country } = geoData.results[0]

    // Fetch weather data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&timezone=auto`,
    )
    const weatherData = await weatherResponse.json()

    const current = weatherData.current
    const weatherCode = current.weather_code

    // Map WMO weather codes to descriptions
    const getWeatherDescription = (code: number) => {
      if (code === 0) return "Clear sky"
      if (code === 1 || code === 2) return "Mostly clear"
      if (code === 3) return "Overcast"
      if (code === 45 || code === 48) return "Foggy"
      if (code === 51 || code === 53 || code === 55) return "Drizzle"
      if (code === 61 || code === 63 || code === 65) return "Rain"
      if (code === 71 || code === 73 || code === 75) return "Snow"
      if (code === 80 || code === 81 || code === 82) return "Rain showers"
      if (code === 85 || code === 86) return "Snow showers"
      if (code === 95 || code === 96 || code === 99) return "Thunderstorm"
      return "Unknown"
    }

    return Response.json({
      location: `${name}, ${country}`,
      temperature: Math.round(current.temperature_2m),
      condition: getWeatherDescription(weatherCode),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      coordinates: { latitude, longitude },
    })
  } catch (error) {
    console.error("Weather API error:", error)
    return new Response("Failed to fetch weather data", { status: 500 })
  }
}
