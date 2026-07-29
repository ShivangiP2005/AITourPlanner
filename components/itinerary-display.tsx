"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Utensils, Lightbulb, MapPin, Phone } from "lucide-react"
import WeatherDisplay from "./weather-display"

export interface ItineraryData {
  destination: string
  summary: string
  days: {
    day: number
    title: string
    activities: { time: string; activity: string; location?: string }[]
    restaurant: { name: string; cuisine?: string; estimatedCost: string }
    tip: string
  }[]
  totalBudget: string
  emergencyContacts: string
  localPhrases: { phrase: string; meaning: string }[]
}

export default function ItineraryDisplay({ data }: { data: ItineraryData }) {
  const [showWeather, setShowWeather] = useState(false)

  const handleDownload = () => {
    let text = `${data.destination} Itinerary\n${data.summary}\n\n`
    data.days.forEach((day) => {
      text += `Day ${day.day}: ${day.title}\n`
      day.activities.forEach((a) => (text += `  ${a.time} - ${a.activity}${a.location ? ` (${a.location})` : ""}\n`))
      text += `  Restaurant: ${day.restaurant.name} (${day.restaurant.estimatedCost})\n`
      text += `  Tip: ${day.tip}\n\n`
    })
    text += `Total Budget: ${data.totalBudget}\nEmergency: ${data.emergencyContacts}\n`

    const element = document.createElement("a")
    const file = new Blob([text], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `itinerary-${data.destination}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{data.destination}</h2>
          <p className="text-muted-foreground">{data.summary}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowWeather(!showWeather)} variant="outline">
            {showWeather ? "Hide Weather" : "Show Weather"}
          </Button>
          <Button onClick={handleDownload} variant="outline">
            Download
          </Button>
        </div>
      </div>

      {showWeather && <WeatherDisplay destination={data.destination} />}

      {data.days.map((day) => (
        <Card key={day.day} className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge>Day {day.day}</Badge>
            <h3 className="text-lg font-semibold">{day.title}</h3>
          </div>

          <div className="space-y-3 mb-4">
            {day.activities.map((a, i) => (
              <div key={i} className="flex gap-3">
                <Clock className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-sm font-medium">{a.time}</span>
                  <p className="text-sm text-muted-foreground">
                    {a.activity}
                    {a.location && (
                      <span className="inline-flex items-center gap-1 ml-2 text-xs">
                        <MapPin className="h-3 w-3" /> {a.location}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-3 items-start">
            <Utensils className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <p className="text-sm">
              <span className="font-medium">{day.restaurant.name}</span> — {day.restaurant.cuisine},{" "}
              {day.restaurant.estimatedCost}
            </p>
          </div>

          <div className="flex gap-3 items-start">
            <Lightbulb className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{day.tip}</p>
          </div>
        </Card>
      ))}

      <Card className="p-6 bg-muted/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Budget: </span>
            {data.totalBudget}
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            <span className="font-medium">Emergency: </span>
            {data.emergencyContacts}
          </div>
        </div>
        {data.localPhrases?.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-sm mb-2">Useful Phrases</p>
            <div className="flex flex-wrap gap-2">
              {data.localPhrases.map((p, i) => (
                <Badge key={i} variant="secondary">
                  {p.phrase} — {p.meaning}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
