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

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = `You are an expert travel guide AI. Generate detailed, personalized travel itineraries.
Format your response with clear sections and use markdown formatting.
Include day-by-day activities, restaurant recommendations, estimated costs, local tips, and transportation advice.
Be specific with times, locations, and practical information.`

    const userPrompt = `Create a detailed day-by-day travel itinerary for:
- Destination: ${destination}
- Travel Dates: ${startDate} to ${endDate}
- Interests: ${interests.join(", ")}
- Budget Level: ${budget}

Please provide:
1. A day-by-day breakdown with specific activities and timings
2. Restaurant recommendations for each day with estimated costs
3. Total estimated costs for activities and meals
4. Local tips and transportation advice
5. Best times to visit attractions
6. Emergency contacts and useful phrases

Format clearly with day headers and bullet points.`

    const stream = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2500,
      },
    })

    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode("🤔 **AI is thinking about your perfect itinerary...**\n\n---\n\n"))

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
