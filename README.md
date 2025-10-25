# AI Travel Guide

A personalized travel itinerary generator powered by Google's Gemini AI. Create custom travel plans, discover suggested trips, and get real-time weather information for your destinations.
🌐 **Live Demo:** https://ai-tour-planner-dd5nhokv8-shivangi.vercel.app?_vercel_share=QaZbqf43cZX7hYbtkEQxA07wYH9SO9iM

## Features

- **Create Custom Itineraries** - Build personalized travel plans with AI-powered suggestions
- **Suggested Trips** - Explore curated travel destinations with detailed information
- **Weather Integration** - Check real-time weather for your travel destinations
- **Chain of Thought Reasoning** - See how the AI generates recommendations step-by-step
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Prerequisites

Before you begin, make sure you have:
- Node.js 18+ installed
- npm or pnpm package manager
- A free Google Gemini API key (get one at https://ai.google.dev/)

## Installation

1. **Clone or extract the project**
   cd ai-travel-guide

2. **Install dependencies**
  
   npm install
   
3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   
   - Add your Google Gemini API key to `.env.local`:
   
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   

4. **Run the development server**
   
   npm run dev
   # or
   npm dev
   

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Create Itinerary
1. Click on the "Create Itinerary" tab
2. Fill in your travel details:
   - Destination
   - Travel dates
   - Budget
   - Interests/Activities
3. Click "Generate Itinerary"
4. View your personalized travel plan with day-by-day activities

### Suggested Trips
1. Click on the "Suggested Trips" tab
2. Browse curated travel destinations
3. Click on a trip card to see more details
4. Check weather information for each destination

## Environment Variables

Create a `.env.local` file in the root directory with the following:

GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

**Important:** Never commit your `.env.local` file to version control. It's already in `.gitignore`.

## Getting Your Free Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key for free
4. Copy the key and paste it into your `.env.local` file

## API Routes

The app includes the following API endpoints:

- `POST /api/generate-itinerary` - Generate a custom travel itinerary
- `GET /api/suggested-trips` - Get suggested travel destinations
- `GET /api/weather` - Get weather information for a location

## Building for Production

npm run build
npm start

## Troubleshooting

### "API key not found" error
- Make sure you've created `.env.local` file
- Verify your Gemini API key is correctly set
- Restart the development server after adding the API key

### "Rate limit exceeded" error
- You've hit Gemini's rate limits
- Wait a few moments before making another request
- Check your usage at [Google AI Studio](https://ai.google.dev/)

### Styling issues
- Clear your browser cache
- Restart the development server
- Make sure all dependencies are installed: `npm install`

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini API** - AI-powered content generation (free!)
- **React Hook Form** - Form management

## License

This project is open source and available under the MIT License.

