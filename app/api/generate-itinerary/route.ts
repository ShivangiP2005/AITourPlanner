import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API Configuration Error",
          details:
            "GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set. Please add your Google Gemini API key in the Vars section.",
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

    // Work out how many days the trip actually is
    const start = new Date(startDate)
    const end = new Date(endDate)
    const numberOfDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: "gemini-flash-latest" })

    const systemPrompt = `You are an expert travel guide AI. Generate detailed, personalized travel itineraries.
Always format using proper markdown: use "##" for each day header, "-" for bullet points, and "**bold**" for emphasis.
Be specific with times, locations, and practical information. Keep each day concise but complete —
prioritize covering all days over writing long paragraphs for fewer days.`

    const userPrompt = `Create a ${numberOfDays}-day travel itinerary for:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${numberOfDays} days total)
- Interests: ${interests.join(", ")}
- Budget Level: ${budget}

For EACH of the ${numberOfDays} days, include:
- 2-4 key activities with approximate times
- One restaurant recommendation with estimated cost
- One practical tip (transport, local custom, or timing)

End with a short section: total estimated budget, emergency contacts, and 2-3 key local phrases.
Keep it scannable — short bullets, not long paragraphs.`

    const stream = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: Math.min(8000, numberOfDays * 500 + 800),
      },
    })

    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }

          controller.close()
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown streaming error"
          controller.enqueue(encoder.encode(`\n\n❌ **Error**: ${errorMsg}`))
          controller.close()
        }
      },
    })

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("[v0] API Error:", error)

    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(
      JSON.stringify({
        error: "Failed to generate itinerary",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
