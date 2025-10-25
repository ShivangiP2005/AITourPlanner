"use client"

import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import TripCard from "./trip-card"

interface Trip {
  id: string
  destination: string
  highlights: string[]
  bestTime: string
  description: string
  image: string
}

export default function SuggestedTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch("/api/suggested-trips")
        const data = await response.json()
        setTrips(data)
      } catch (error) {
        console.error("[v0] Error fetching trips:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spinner className="h-12 w-12 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading destinations...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Explore Suggested Destinations</h2>
      <p className="text-muted-foreground mb-8">Discover amazing places around the world curated just for you</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  )
}
