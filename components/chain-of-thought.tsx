"use client"

import { Card } from "@/components/ui/card"

interface ChainOfThoughtProps {
  message?: string;
  daysGenerated?: number;
  totalDays?: number;
}

export default function ChainOfThought({ message, daysGenerated, totalDays }: ChainOfThoughtProps) {
  const thoughts = [
    "Analyzing your destination and travel dates...",
    "Considering your interests and preferences...",
    "Planning optimal daily activities...",
    "Finding the best restaurants and dining options...",
    "Calculating costs and budgets...",
    "Adding local tips and transportation advice...",
    "Finalizing your personalized itinerary...",
  ]

  const hasProgress = daysGenerated !== undefined && totalDays !== undefined && totalDays > 0;

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl animate-pulse">🤔</div>
            <h3 className="text-lg font-semibold">
              {message || "AI is thinking..."}
            </h3>
          </div>
          {hasProgress && (
            <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
              Day {Math.min(daysGenerated, totalDays)} of {totalDays} planned
            </div>
          )}
        </div>

        {!hasProgress && (
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
        )}

        {hasProgress && (
          <div className="space-y-4">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.min((daysGenerated / totalDays) * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              Generating your daily schedule...
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            This may take a moment as we craft your perfect itinerary...
          </p>
        </div>
      </div>
    </Card>
  )
}
