# 🌍 AI Tour Planner

> An intelligent travel itinerary generator powered by Google Gemini AI — with real-time streaming, automatic model failover, and smart caching.

🌐 **Live Demo:** [ai-tour-planner on Vercel](https://ai-tour-planner-dd5nhokv8-shivangi.vercel.app?_vercel_share=QaZbqf43cZX7hYbtkEQxA07wYH9SO9iM)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Custom Itinerary Builder** | Generate day-by-day travel plans tailored to your destination, dates, interests, and budget |
| ⚡ **Real-Time Streaming** | Watch your itinerary build progressively, day by day, as the AI generates it |
| 🔄 **Automatic Model Fallback** | If the primary Gemini model hits a quota limit or is deprecated, the app silently tries the next model in a priority chain |
| 💾 **Smart Response Caching** | Repeat requests for the same trip are served instantly from in-memory cache — zero API calls |
| 🌤️ **Live Weather** | Get real-time weather data for any destination |
| ✈️ **Suggested Trips** | Browse curated AI-generated trip ideas |
| 📥 **Download Itinerary** | Export your generated itinerary as a `.txt` file |
| 🌙 **Dark Mode** | Full theme support with `next-themes` |
| 📱 **Responsive Design** | Mobile-first, works seamlessly on all screen sizes |

---

## 🏗️ Architecture

```
app/
├── page.tsx                    ← Main page with tabs
├── layout.tsx                  ← Global layout + font + theme
├── globals.css                 ← Global styles
└── api/
    ├── generate-itinerary/     ← Streaming Gemini generation + fallback + cache
    ├── suggested-trips/        ← Curated trip list
    └── weather/                ← Real-time weather data

components/
├── itinerary-builder.tsx       ← Form + stream reader + progressive render logic
├── itinerary-display.tsx       ← Day-by-day itinerary UI (safely handles partial data)
├── itinerary-form.tsx          ← Trip parameters form
├── chain-of-thought.tsx        ← Live progress bar + "AI is thinking" state
├── suggested-trips.tsx         ← Curated trips tab
├── trip-card.tsx               ← Individual trip card
├── weather-display.tsx         ← Live weather widget
└── header.tsx                  ← Site header

lib/
└── gemini.ts                   ← Primary model + fallback model priority chain
```

---

## 🤖 How the AI Generation Works

### Streaming Response
Rather than waiting for the entire itinerary to complete, the API route:
1. Calls `model.generateContentStream()` on the Gemini API
2. Pipes the stream directly to the browser as it arrives
3. The frontend reads the stream chunk by chunk, progressively parsing and rendering each day

### Automatic Model Fallback Chain
Defined in `lib/gemini.ts`, the app tries models in priority order:
```
gemini-3.5-flash → gemini-3.5-flash-lite → gemini-flash-latest → gemini-3.6-flash
```
If any model returns a `429 (Quota Exceeded)` or `404 (Model Deprecated)`, the next model in the chain is tried automatically — completely transparent to the user.

### In-Memory Cache
Itineraries are cached for 24 hours using a normalized key of `destination + dates + interests + budget`. Cache hits respond in ~30–50ms with zero API consumption.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **npm** package manager
- A free **Google Gemini API key** → [Get one at Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone the repo
```bash
git clone https://github.com/ShivangiP2005/AITourPlanner.git
cd AITourPlanner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Optional: Override the primary model (defaults to gemini-3.5-flash)
GEMINI_MODEL=gemini-3.5-flash
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ Yes | — | Your Google Gemini API key |
| `GEMINI_MODEL` | ❌ No | `gemini-3.5-flash` | Primary model to use. App will auto-fallback if this one is unavailable. |

> **Security:** Never commit `.env` to version control. It's already in `.gitignore`.

---

## 📡 API Routes

### `POST /api/generate-itinerary`
Generates and streams a travel itinerary.

**Request Body:**
```json
{
  "destination": "Tokyo",
  "startDate": "2026-10-01",
  "endDate": "2026-10-07",
  "interests": ["Food", "Culture", "History"],
  "budget": "Medium"
}
```

**Response:** Streaming plain text (JSON, chunked) — read progressively by the frontend.

**Headers in response:**
- `X-Model-Used` — which Gemini model was used
- `X-Cache` — `HIT` if served from cache, absent if freshly generated

---

### `GET /api/suggested-trips`
Returns a list of curated, AI-generated trip suggestions.

---

### `GET /api/weather?location={city}`
Returns current weather data for the given location.

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | [Google Gemini API](https://ai.google.dev/) via `@google/generative-ai` |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Theming | next-themes |
| Deployment | [Vercel](https://vercel.com/) |

---

## 🛠️ Troubleshooting

### `API key not found` error
- Make sure `.env` exists in the project root
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set correctly
- Restart the dev server after changes: `npm run dev`

### `429 Too Many Requests` / Quota exceeded
- You've exhausted the free tier limit (20 requests/day per model)
- The app **automatically tries fallback models** — so this usually resolves itself
- Otherwise, wait until the next day for quota to reset (UTC midnight)
- For production usage, enable billing at [Google AI Studio](https://aistudio.google.com/)

### Itinerary shows partial data or stops early
- This is normal during streaming — the progressive display catches up as chunks arrive
- If it consistently fails, try a shorter trip (3–5 days) to rule out token limits

### Build errors
```bash
npm install          # ensure all deps are installed
npm run build        # check for TypeScript errors
```

---

## 📦 Building for Production

```bash
npm run build
npm start
```

Or deploy directly to **Vercel** by connecting your GitHub repo — zero config required.

> **Note on Vercel Hobby plan:** The app uses `maxDuration = 60` in the API route. Fluid Compute on Vercel supports up to 300s, and streaming keeps the connection alive regardless of individual function timeout limits.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
