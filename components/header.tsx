export default function Header() {
  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">✈️</div>
          <h1 className="text-4xl sm:text-5xl font-bold">Travel Guide</h1>
        </div>
        <p className="text-lg opacity-90 mt-2">Discover personalized itineraries powered by AI</p>
      </div>
    </header>
  )
}
