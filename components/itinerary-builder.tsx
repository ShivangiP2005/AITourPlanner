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
  const [destination, setDestination] = useState("")

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
    setDestination(formData.destination)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 11000) // 11 second client-side timeout aligned with Vercel Hobby 10s limit

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        throw new Error(
          response.status === 504 || response.status === 408
            ? "This is taking too long, please try again."
            : `Server returned error (${response.status}). Please try again.`
        )
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to generate itinerary")
      }

      setItinerary(data as ItineraryData)
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        setError("This is taking too long, please try again.")
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate itinerary"
        setError(errorMessage)
      }
      setItinerary(null)
    } finally {
      clearTimeout(timeoutId)
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
       {itinerary && !loading && <ItineraryDisplay data={itinerary} destination={destination} />}
        {!itinerary && !loading && !error && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Fill in your travel preferences to get started</p>
          </Card>
        )}
      </div>
    </div>
  )
}
