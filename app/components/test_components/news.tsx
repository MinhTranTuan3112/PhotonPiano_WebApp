import { Calendar, ArrowRight, Music } from 'lucide-react';
import { useState } from 'react';

const events = [
    {
        title: "Spring Recital 2024",
        date: "March 15, 2024",
        description: "Join us for an evening of beautiful piano performances by our talented students",
        image: "app/lib/assets/images/placeholder.jpg?height=200&width=400",
    },
    {
        title: "Summer Music Camp",
        date: "June 1-15, 2024",
        description: "Two weeks of intensive piano training, ensemble work, and music theory",
        image: "app/lib/assets/images/placeholder.jpg?height=200&width=400",
    },
    {
        title: "Master Class Series",
        date: "Monthly",
        description: "Learn from visiting professional pianists and music educators",
        image: "app/lib/assets/images/placeholder.jpg?height=200&width=400",
    },
];

export function NewsEvents() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <section className="relative py-24 overflow-hidden bg-gray-100">
            {/* Gradient background */}
            <div className="absolute inset-0" />

            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-indigo-200 rounded-full animate-spin-slow" />
            <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-teal-200 rounded-full animate-pulse" />

            <div className="relative container mx-auto px-6">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                        Upcoming Events
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Join us for these exciting musical experiences
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {events.map((event, index) => (
                        <div
                            key={event.title}
                            className="relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="relative h-48">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-white">
                                    <Calendar className="h-5 w-5" />
                                    <span className="text-sm font-medium">{event.date}</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                                <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                                <button className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                    Learn more
                                    <ArrowRight className={`ml-1 h-4 w-4 transition-transform duration-300 ${hoveredIndex === index ? 'translate-x-1' : ''}`} />
                                </button>
                            </div>
                            {/* Decorative music note */}
                            <div className={`absolute top-2 right-2 transition-opacity duration-300 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                                <Music className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative wave shape at bottom */}
            <div className="absolute bottom-0 w-full overflow-hidden">
                <svg className="relative block w-full h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path
                        fill="#4f46e5"
                        fillOpacity="0.1"
                        d="M0,96L48,106.7C96,117,192,139,288,138.7C384,139,480,117,576,106.7C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>
            </div>
        </section>
    );
}

