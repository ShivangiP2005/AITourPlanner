"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import ItineraryForm from "./itinerary-form"
import ItineraryDisplay, { type ItineraryData } from "./itinerary-display"
import ChainOfThought from "./chain-of-thought"

function extractJson(text: string): any {
  let clean = text.trim()
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  }
  
  try {
    return JSON.parse(clean)
  } catch {}

  // Parse matching root JSON object by tracking bracket depth (ignoring inside string literals)
  let depth = 0
  const startIndex = clean.indexOf("{")
  if (startIndex !== -1) {
    for (let i = startIndex; i < clean.length; i++) {
      const char = clean[i]
      if (char === '"') {
        i++
        while (i < clean.length) {
          if (clean[i] === '\\') {
            i += 2
            continue
          }
          if (clean[i] === '"') break
          i++
        }
      } else if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0) {
          const candidate = clean.slice(startIndex, i + 1)
          try {
            return JSON.parse(candidate)
          } catch {}
        }
      }
    }
  }

  // Attempt to fix incomplete JSON during streaming by appending common closings
  const endings = [
    '"]}]}',
    '"}]}',
    '}]}',
    ']}',
    '}',
    '"}',
    ']',
  ]
  for (const ending of endings) {
    try {
      return JSON.parse(clean + ending)
    } catch {}
  }
  return null
}

export default function ItineraryBuilder() {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [destination, setDestination] = useState("")
  
  const [daysGenerated, setDaysGenerated] = useState(0)
  const [totalExpectedDays, setTotalExpectedDays] = useState(0)

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
    setDaysGenerated(0)
    
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    setTotalExpectedDays(totalDays)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 60000) // increase client timeout to 60s for streaming long trips

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorData: any
        try {
          errorData = await response.json()
        } catch {
          throw new Error(
            response.status === 504 || response.status === 408
              ? "This is taking too long, please try again."
              : `Server returned error (${response.status}). Please try again.`
          )
        }
        throw new Error(errorData.details || errorData.error || "Failed to generate itinerary")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Failed to read response stream")

      const decoder = new TextDecoder("utf-8")
      let accumulatedText = ""
      let partialDays = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulatedText += decoder.decode(value, { stream: true })
        
        // Count how many "day" objects we've started to parse
        const matches = accumulatedText.match(/"day"\s*:/g)
        if (matches && matches.length > partialDays) {
          partialDays = matches.length
          setDaysGenerated(partialDays)
        }

        // Try progressive JSON parsing for incremental UI updates
        const parsed = extractJson(accumulatedText)
        if (parsed && Array.isArray(parsed.days)) {
          const validDays = parsed.days.filter((d: any) => d && typeof d === "object")
          if (validDays.length > 0) {
            setItinerary({
              ...parsed,
              days: validDays,
            } as ItineraryData)
          }
        }
      }

      // Final parse
      const finalParsed = extractJson(accumulatedText)
      if (finalParsed && Array.isArray(finalParsed.days)) {
        setItinerary(finalParsed as ItineraryData)
      } else {
        throw new Error("Received malformed itinerary data from AI. Please try again.")
      }

    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        setError("This is taking too long, please try again.")
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate itinerary"
        setError(errorMessage)
      }
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
          <Card className="p-6 bg-destructive/10 border-destructive/20 mb-8">
            <h3 className="font-semibold text-destructive mb-2">Error</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </Card>
        )}
        
        {loading && (!itinerary || !itinerary.days || itinerary.days.length === 0) && (
          <ChainOfThought 
            message="Starting to plan your trip..." 
            daysGenerated={daysGenerated} 
            totalDays={totalExpectedDays} 
          />
        )}
        
        {itinerary && (
          <div className="space-y-6">
            {loading && itinerary.days && itinerary.days.length > 0 && (
              <ChainOfThought 
                message="Building your itinerary..." 
                daysGenerated={daysGenerated} 
                totalDays={totalExpectedDays} 
              />
            )}
            <ItineraryDisplay data={itinerary} destination={destination} />
          </div>
        )}
        
        {!itinerary && !loading && !error && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Fill in your travel preferences to get started</p>
          </Card>
        )}
      </div>
    </div>
  )
}
