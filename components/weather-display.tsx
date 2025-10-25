"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  coordinates: { latitude: number; longitude: number }
}

interface WeatherDisplayProps {
  destination: string
}

export default function WeatherDisplay({ destination }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/weather?destination=${encodeURIComponent(destination)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch weather")
        }

        const data = await response.json()
        setWeather(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch weather")
      } finally {
        setLoading(false)
      }
    }

    if (destination) {
      fetchWeather()
    }
  }, [destination])

  if (loading) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="text-sm text-muted-foreground">Loading weather...</div>
      </Card>
    )
  }

  if (error || !weather) {
    return null
  }

  const getWeatherEmoji = (condition: string) => {
    if (condition.includes("Clear")) return "☀️"
    if (condition.includes("Mostly clear")) return "🌤️"
    if (condition.includes("Overcast")) return "☁️"
    if (condition.includes("Foggy")) return "🌫️"
    if (condition.includes("Drizzle")) return "🌦️"
    if (condition.includes("Rain")) return "🌧️"
    if (condition.includes("Snow")) return "❄️"
    if (condition.includes("Thunderstorm")) return "⛈️"
    return "🌡️"
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm mb-3">Current Weather</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getWeatherEmoji(weather.condition)}</span>
              <div>
                <div className="text-2xl font-bold">{weather.temperature}°F</div>
                <div className="text-sm text-muted-foreground">{weather.condition}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-border">
              <div>
                <span className="text-muted-foreground">Humidity:</span>
                <div className="font-medium">{weather.humidity}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Wind:</span>
                <div className="font-medium">{weather.windSpeed} mph</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
