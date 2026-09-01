import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODEL } from "@/lib/gemini"

// Export maxDuration = 60 for Vercel functions (Fluid compute allows up to 60s/300s)
export const maxDuration = 60
export const dynamic = "force-dynamic"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMsg = "Request timed out"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs),
    ),
  ])
}

export async function POST(request: Request) {
  const startTime = Date.now()
  // Total time budget of 25s safely within Vercel's configured duration
  const TOTAL_BUDGET_MS = 25000

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

    console.log(`[generate-itinerary] Generating ${numberOfDays}-day trip to "${destination}" using model "${GEMINI_MODEL}"...`)

    const client = new GoogleGenerativeAI(apiKey)
    // Optimized token budget to speed up response time without truncation
    const tokenBudget = Math.min(4096, Math.max(1200, numberOfDays * 400 + 800))

    const model = client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: tokenBudget,
        responseMimeType: "application/json",
      },
    })

    const prompt = buildPrompt(destination, startDate, endDate, interests, budget, numberOfDays)

    async function generateAndValidate(timeoutMs: number) {
      const attemptStart = Date.now()
      const result = await withTimeout(
        model.generateContent(prompt),
        timeoutMs,
        "Gemini API request timed out",
      )
      let responseText = result.response.text().trim()
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
      }
      const parsed = JSON.parse(responseText) // throws if invalid JSON
      if (!Array.isArray(parsed.days) || parsed.days.length !== numberOfDays) {
        throw new Error(`Expected ${numberOfDays} days, got ${parsed.days?.length ?? "invalid"}`)
      }
      console.log(`[generate-itinerary] Model generated response in ${Date.now() - attemptStart}ms`)
      return parsed
    }

    let itineraryData
    const firstAttemptBudget = Math.max(2000, Math.min(18000, TOTAL_BUDGET_MS - (Date.now() - startTime)))

    try {
      itineraryData = await generateAndValidate(firstAttemptBudget)
    } catch (firstError) {
      const elapsed = Date.now() - startTime
      const remainingMs = TOTAL_BUDGET_MS - elapsed
      console.warn(`[generate-itinerary] First attempt failed after ${elapsed}ms:`, firstError)

      // Retry only if at least 6.0s remain in the budget
      if (remainingMs >= 6000) {
        console.log(`[generate-itinerary] Retrying with remaining budget of ${remainingMs}ms...`)
        try {
          itineraryData = await generateAndValidate(remainingMs - 1000)
        } catch (secondError) {
          console.error("[generate-itinerary] Retry also failed:", secondError)
          return new Response(
            JSON.stringify({
              error: "Failed to generate itinerary",
              details: "The AI took too long or had trouble creating this itinerary. Please try again.",
            }),
            { status: 504, headers: { "Content-Type": "application/json" } },
          )
        }
      } else {
        console.warn(`[generate-itinerary] Insufficient time remaining (${remainingMs}ms) for retry. Returning timeout.`)
        return new Response(
          JSON.stringify({
            error: "Request timed out",
            details: "The AI took too long to generate your itinerary. Please try again.",
          }),
          { status: 504, headers: { "Content-Type": "application/json" } },
        )
      }
    }

    const totalDuration = Date.now() - startTime
    console.log(`[generate-itinerary] Total execution completed successfully in ${totalDuration}ms`)

    return Response.json(itineraryData)
  } catch (error) {
    console.error("[generate-itinerary] API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: "Failed to generate itinerary", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
