"use client"

import { useState } from "react"
import Header from "@/components/header"
import ItineraryBuilder from "@/components/itinerary-builder"
import SuggestedTrips from "@/components/suggested-trips"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"builder" | "trips">("builder")

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("builder")}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "builder"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Itinerary
            </button>
            <button
              onClick={() => setActiveTab("trips")}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "trips"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Suggested Trips
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === "builder" && <ItineraryBuilder />}
        {activeTab === "trips" && <SuggestedTrips />}
      </div>
    </main>
  )
}
