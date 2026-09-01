import { GoogleGenerativeAI } from "@google/generative-ai"

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

Return ONLY valid JSON matching exactly this structure, no markdown, no extra text, no trailing commas:

{
  "destination": "string",
  "summary": "one sentence trip summary",
  "days": [
    {
      "day": 1,
      "title": "short title for the day",
      "activities": [
        { "time": "9:00 AM", "activity": "description", "location": "place name" }
      ],
      "restaurant": { "name": "string", "cuisine": "string", "estimatedCost": "string e.g. €20-30" },
      "tip": "one practical tip for this day"
    }
  ],
  "totalBudget": "estimated total budget range for the whole trip",
  "emergencyContacts": "relevant local emergency number(s)",
  "localPhrases": [
    { "phrase": "local language phrase", "meaning": "english meaning" }
  ]
}

Remember: "days" array length must be EXACTLY ${numberOfDays}. Each day should have 2-4 activities. Be concise.`
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

    const client = new GoogleGenerativeAI(apiKey)
    // Give real headroom so short trips don't get truncated if the model overshoots
    const tokenBudget = Math.min(8000, Math.max(2000, numberOfDays * 600 + 1200))

    const model = client.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: tokenBudget,
        responseMimeType: "application/json",
      },
    })

    const prompt = buildPrompt(destination, startDate, endDate, interests, budget, numberOfDays)

    async function generateAndValidate(timeoutMs = 12000) {
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
      return parsed
    }

    let itineraryData
    try {
      // First attempt: capped at 12s
      itineraryData = await generateAndValidate(12000)
    } catch (firstError) {
      console.error("[generate-itinerary] First attempt failed, retrying once:", firstError)
      try {
        // Second attempt: capped at 12s
        itineraryData = await generateAndValidate(12000)
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
    }

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
