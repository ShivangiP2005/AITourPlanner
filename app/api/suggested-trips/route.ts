export async function GET() {
  const suggestedTrips = [
    {
      id: "1",
      destination: "Paris, France",
      highlights: ["Eiffel Tower", "Louvre Museum", "Cafés", "Seine River"],
      bestTime: "April - June, September - October",
      description: "Experience the city of love with iconic landmarks and world-class cuisine.",
      image: "🗼",
    },
    {
      id: "2",
      destination: "Tokyo, Japan",
      highlights: ["Temples", "Street Food", "Technology", "Cherry Blossoms"],
      bestTime: "March - May, September - November",
      description: "Discover the perfect blend of ancient tradition and cutting-edge modernity.",
      image: "🗾",
    },
    {
      id: "3",
      destination: "New York, USA",
      highlights: ["Times Square", "Central Park", "Broadway", "Museums"],
      bestTime: "April - May, September - October",
      description: "The city that never sleeps offers endless entertainment and culture.",
      image: "🗽",
    },
    {
      id: "4",
      destination: "Barcelona, Spain",
      highlights: ["Sagrada Familia", "Beaches", "Tapas", "Architecture"],
      bestTime: "April - May, September - October",
      description: "Explore Gaudí's masterpieces and vibrant Mediterranean culture.",
      image: "🏖️",
    },
    {
      id: "5",
      destination: "Dubai, UAE",
      highlights: ["Burj Khalifa", "Desert Safari", "Shopping", "Luxury"],
      bestTime: "October - April",
      description: "Experience ultra-modern luxury and desert adventures.",
      image: "🏙️",
    },
    {
      id: "6",
      destination: "Bali, Indonesia",
      highlights: ["Temples", "Beaches", "Rice Terraces", "Yoga"],
      bestTime: "April - October",
      description: "Find peace and beauty in tropical paradise with spiritual experiences.",
      image: "🏝️",
    },
  ]

  return Response.json(suggestedTrips)
}
