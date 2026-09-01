import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODEL, FALLBACK_MODELS } from "@/lib/gemini"

// Export maxDuration = 60 for Vercel functions (Fluid compute allows up to 60s/300s)
export const maxDuration = 60
export const dynamic = "force-dynamic"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// In-memory cache for itineraries (24-hour TTL)
interface CacheEntry {
  text: string
  timestamp: number
}

const itineraryCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(destination: string, startDate: string, endDate: string, interests: string[], budget: string): string {
  const normDest = destination.toLowerCase().trim()
  const normInterests = [...interests].map((i) => i.toLowerCase().trim()).sort().join(",")
  const normBudget = budget.toLowerCase().trim()
  return `${normDest}|${startDate}|${endDate}|${normInterests}|${normBudget}`
}

function buildPrompt(destination: string, startDate: string, endDate: string, interests: string[], budget: string, numberOfDays: number) {
  return `You are an expert travel guide. Create a travel itinerary for:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate}
- Interests: ${interests.join(", ")}
- Budget Level: ${budget}

CRITICAL RULE: The trip is EXACTLY ${numberOfDays} day${numberOfDays > 1 ? "s" : ""} long. The "days" array in your response
MUST contain EXACTLY ${numberOfDays} object${numberOfDays > 1 ? "s" : ""} — no more, no fewer. This applies even if ${numberOfDays} is
very small (1 or 2). Do not pad the trip with extra days that were not requested.

Keep descriptions punchy and concise (1-2 sentences per activity) for fast and reliable generation. Return ONLY valid JSON matching exactly this structure, no markdown, no extra text, no trailing commas:

{
  "destination": "string",
  "summary": "one sentence trip summary",
  "days": [
    {
      "day": 1,
      "title": "short title for the day",
      "activities": [
        { "time": "9:00 AM", "activity": "concise description", "location": "place name" }
      ],
      "restaurant": { "name": "string", "cuisine": "string", "estimatedCost": "e.g. €20-30" },
      "tip": "one practical tip for this day"
    }
  ],
  "totalBudget": "estimated total budget range for the whole trip",
  "emergencyContacts": "relevant local emergency number(s)",
  "localPhrases": [
    { "phrase": "local language phrase", "meaning": "english meaning" }
  ]
}

Remember: "days" array length must be EXACTLY ${numberOfDays}. Each day should have 2-3 activities. Be concise.`
}

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API Configuration Error",
          details: "GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const { destination, startDate, endDate, interests, budget } = await request.json()

    if (!destination || !startDate || !endDate || !interests || !budget) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", details: "Please provide destination, dates, interests, and budget" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid dates", details: "Please provide valid start and end dates" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (end < start) {
      return new Response(
        JSON.stringify({ error: "Invalid date range", details: "End date must be on or after the start date" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const numberOfDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    if (numberOfDays > 21) {
      return new Response(
        JSON.stringify({ error: "Trip too long", details: "Please keep trips to 21 days or fewer" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Check in-memory cache first to avoid consuming API quota for repeated trips
    const cacheKey = getCacheKey(destination, startDate, endDate, interests, budget)
    const cached = itineraryCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[generate-itinerary] CACHE HIT for "${destination}" (${numberOfDays} days)! Serving immediately from cache.`)
      
      const encoder = new TextEncoder()
      const cachedText = cached.text
      const chunkSize = Math.max(80, Math.floor(cachedText.length / 15))

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for (let i = 0; i < cachedText.length; i += chunkSize) {
              const chunk = cachedText.slice(i, i + chunkSize)
              controller.enqueue(encoder.encode(chunk))
              await new Promise((resolve) => setTimeout(resolve, 20))
            }
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Cache": "HIT",
        },
      })
    }

    console.log(`[generate-itinerary] CACHE MISS. Generating ${numberOfDays}-day trip to "${destination}"...`)

    const client = new GoogleGenerativeAI(apiKey)
    const prompt = buildPrompt(destination, startDate, endDate, interests, budget, numberOfDays)

    let activeStream: any = null
    let usedModel: string = ""
    let lastError: any = null
    let hitQuota = false

    // Try primary model then fallback models in order
    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[generate-itinerary] Attempting generation with model "${modelName}"...`)
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        })

        const resultStream = await model.generateContentStream(prompt)
        activeStream = resultStream.stream
        usedModel = modelName
        console.log(`[generate-itinerary] Stream connection successful with model "${modelName}".`)
        break
      } catch (err: any) {
        lastError = err
        const errMsg = err?.message || String(err)
        console.warn(`[generate-itinerary] Model "${modelName}" failed: ${errMsg}`)

        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Too Many Requests")
        ) {
          hitQuota = true
        }
      }
    }

    if (!activeStream) {
      console.error("[generate-itinerary] All fallback models failed:", lastError)
      if (hitQuota) {
        return new Response(
          JSON.stringify({
            error: "Daily Quota Exceeded",
            details: "The AI free tier quota limit is reached across available models. Please wait a short while or try again later.",
            isQuota: true,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        )
      }

      return new Response(
        JSON.stringify({
          error: "Failed to generate itinerary",
          details: lastError?.message || "All AI models failed to respond. Please try again in a moment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    let accumulatedText = ""
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of activeStream) {
            const chunkText = chunk.text()
            accumulatedText += chunkText
            controller.enqueue(encoder.encode(chunkText))
          }
          controller.close()

          // Cache on successful completion
          if (accumulatedText.trim().length > 0) {
            itineraryCache.set(cacheKey, {
              text: accumulatedText,
              timestamp: Date.now(),
            })
            console.log(`[generate-itinerary] Successfully generated & cached result for "${destination}" using "${usedModel}".`)
          }
        } catch (error) {
          console.error("[generate-itinerary] Streaming error during output:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Model-Used": usedModel,
      },
    })
  } catch (error) {
    console.error("[generate-itinerary] API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: "Failed to generate itinerary", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
