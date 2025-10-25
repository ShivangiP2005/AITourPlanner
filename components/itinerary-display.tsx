"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WeatherDisplay from "./weather-display"

interface ItineraryDisplayProps {
  content: string
  destination?: string
}

export default function ItineraryDisplay({ content, destination }: ItineraryDisplayProps) {
  const [showWeather, setShowWeather] = useState(false)

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `itinerary-${destination || "travel"}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const formatContent = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("##")) {
        return (
          <h2 key={idx} className="text-xl font-bold mt-6 mb-3">
            {line.replace(/^#+\s*/, "")}
          </h2>
        )
      }
      if (line.startsWith("#")) {
        return (
          <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">
            {line.replace(/^#+\s*/, "")}
          </h3>
        )
      }
      if (line.startsWith("-") || line.startsWith("•")) {
        return (
          <li key={idx} className="ml-4 mb-1">
            {line.replace(/^[-•]\s*/, "")}
          </li>
        )
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />
      }
      return (
        <p key={idx} className="mb-2 leading-relaxed">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6">
      {destination && showWeather && <WeatherDisplay destination={destination} />}

      <Card className="p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold">Your Itinerary</h2>
          <div className="flex gap-2">
            {destination && (
              <Button
                onClick={() => setShowWeather(!showWeather)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {showWeather ? "Hide Weather" : "Show Weather"}
              </Button>
            )}
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              Download
            </Button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="text-foreground leading-relaxed">{formatContent(content)}</div>
        </div>
      </Card>
    </div>
  )
}
