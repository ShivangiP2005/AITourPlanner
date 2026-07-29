"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import ItineraryForm from "./itinerary-form"
import ItineraryDisplay, { type ItineraryData } from "./itinerary-display"
import ChainOfThought from "./chain-of-thought"

export default function ItineraryBuilder() {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateItinerary = async (formData: {
    destination: string
    startDate: string
    endDate: string
    interests: string[]
    budget: string
  }) => {
    setLoading(true)
    setItinerary(null)
    setError(null)

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to generate itinerary")
      }

      setItinerary(data as ItineraryData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate itinerary"
      setError(errorMessage)
      setItinerary(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-8">
          <h2 className="text-2xl font-bold mb-6">Plan Your Trip</h2>
          <ItineraryForm onSubmit={handleGenerateItinerary} loading={loading} />
        </Card>
      </div>

      <div className="lg:col-span-2">
        {error && (
          <Card className="p-6 bg-destructive/10 border-destructive/20">
            <h3 className="font-semibold text-destructive mb-2">Error</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </Card>
        )}
        {loading && <ChainOfThought />}
        {itinerary && !loading && <ItineraryDisplay data={itinerary} />}
        {!itinerary && !loading && !error && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Fill in your travel preferences to get started</p>
          </Card>
        )}
      </div>
    </div>
  )
}
