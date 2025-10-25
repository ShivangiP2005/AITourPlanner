"use client"

import { Card } from "@/components/ui/card"

export default function ChainOfThought() {
  const thoughts = [
    "Analyzing your destination and travel dates...",
    "Considering your interests and preferences...",
    "Planning optimal daily activities...",
    "Finding the best restaurants and dining options...",
    "Calculating costs and budgets...",
    "Adding local tips and transportation advice...",
    "Finalizing your personalized itinerary...",
  ]

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl">🤔</div>
          <h3 className="text-lg font-semibold">AI is thinking...</h3>
        </div>

        <div className="space-y-3">
          {thoughts.map((thought, index) => (
            <div
              key={index}
              className="flex items-start gap-3 animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`,
              }}
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{thought}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            This may take a moment as we craft your perfect itinerary...
          </p>
        </div>
      </div>
    </Card>
  )
}
