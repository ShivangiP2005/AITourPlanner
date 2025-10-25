"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WeatherDisplay from "./weather-display"

interface Trip {
  id: string
  destination: string
  highlights: string[]
  bestTime: string
  description: string
  image: string
}

interface TripCardProps {
  trip: Trip
}

export default function TripCard({ trip }: TripCardProps) {
  const [showWeather, setShowWeather] = useState(false)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="text-6xl">{trip.image}</div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{trip.destination}</h3>
        <p className="text-muted-foreground text-sm mb-4">{trip.description}</p>

        {showWeather && <WeatherDisplay destination={trip.destination} />}

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Highlights:</p>
          <div className="flex flex-wrap gap-2">
            {trip.highlights.map((highlight, idx) => (
              <span key={idx} className="px-3 py-1 bg-accent/20 text-accent-foreground text-xs rounded-full">
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-medium">Best Time:</span> {trip.bestTime}
        </p>

        <div className="flex gap-2">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">Learn More</Button>
          <Button variant="outline" onClick={() => setShowWeather(!showWeather)} className="flex-1">
            {showWeather ? "Hide" : "Weather"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
