import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

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
        JSON.stringify({
          error: "Missing required fields",
          details: "Please provide destination, dates, interests, and budget",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const numberOfDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: Math.min(8000, numberOfDays * 500 + 800),
        responseMimeType: "application/json",
      },
    })

    const prompt = `You are an expert travel guide. Create a ${numberOfDays}-day travel itinerary for:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${numberOfDays} days total)
- Interests: ${interests.join(", ")}
- Budget Level: ${budget}

Return ONLY valid JSON matching exactly this structure, no markdown, no extra text:

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

Include all ${numberOfDays} days. Each day should have 2-4 activities.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let itineraryData
    try {
      itineraryData = JSON.parse(responseText)
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to parse itinerary",
          details: "The AI response was not valid JSON. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    return Response.json(itineraryData)
  } catch (error) {
    console.error("[v0] API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: "Failed to generate itinerary", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
