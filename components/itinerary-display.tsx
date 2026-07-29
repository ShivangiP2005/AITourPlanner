"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </Card>
    </div>
  )
}
