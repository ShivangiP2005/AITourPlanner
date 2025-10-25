"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import ItineraryForm from "./itinerary-form"
import ItineraryDisplay from "./itinerary-display"
import ChainOfThought from "./chain-of-thought"

export default function ItineraryBuilder() {
  const [itinerary, setItinerary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [destination, setDestination] = useState<string>("")
  const [isThinking, setIsThinking] = useState(false)
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
    setDestination(formData.destination)
    setIsThinking(true)

    try {
      console.log("[v0] Sending request with data:", formData)

      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] API error response:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to generate itinerary")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          fullText += chunk
          setItinerary(fullText)

          // Stop showing thinking after first content
          if (fullText.length > 100) {
            setIsThinking(false)
          }
        }
      }

      console.log("[v0] Successfully generated itinerary")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate itinerary"
      console.error("[v0] Error:", errorMessage)
      setError(errorMessage)
      setItinerary(null)
    } finally {
      setLoading(false)
      setIsThinking(false)
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
            <p className="text-xs text-muted-foreground mt-2">Please check your API key and try again.</p>
          </Card>
        )}
        {loading && isThinking && <ChainOfThought />}
        {loading && !isThinking && (
          <Card className="p-8 text-center">
            <div className="inline-block">
              <Spinner className="h-12 w-12 mb-4" />
              <p className="text-muted-foreground">Generating your personalized itinerary...</p>
            </div>
          </Card>
        )}
        {itinerary && !loading && <ItineraryDisplay content={itinerary} destination={destination} />}
        {!itinerary && !loading && !error && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Fill in your travel preferences to get started</p>
          </Card>
        )}
      </div>
    </div>
  )
}
