import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";


const slides = [
    {
        url: "app/lib/assets/images/placeholder.jpg?height=1000&width=1200",
        title: "Transform Your Musical Journey",
        description: "Join our community of passionate pianists and discover the joy of music",
    },
    {
        url: "app/lib/assets/images/placeholder.jpg?height=1000&width=1200",
        title: "Learn from the Best",
        description: "Expert instructors dedicated to your musical growth",
    },
    {
        url: "app/lib/assets/images/placeholder.jpg?height=1000&width=1200",
        title: "Learn from the Best",
        description: "Expert instructors dedicated to your musical growth",
    }
]

export function Carousel() {
    const [current, setCurrent] = React.useState(0);

    const prev = () => setCurrent((curr) => (curr === 0 ? slides.length - 1 : curr - 1));
    const next = () => setCurrent((curr) => (curr === slides.length - 1 ? 0 : curr + 1));

    React.useEffect(() => {
        const interval = setInterval(() => {
            next();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-screen w-full overflow-hidden">
            <div className="relative h-full w-full">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-transform duration-500 ease-out ${index === current ? "translate-x-0" : "translate-x-full"
                            }`}
                        style={{ transform: `translateX(${100 * (index - current)}%)` }}
                    >
                        <img src={slide.url} alt="Carousel IMG" className="h-full w-full object-cover brightness-75" />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{slide.title}</h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8">{slide.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 inline-flex h-10 w-10 items-center justify-center rounded-full"
                onClick={prev}
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 inline-flex h-10 w-10 items-center justify-center rounded-full"
                onClick={next}
            >
                <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${index === current ? "bg-white" : "bg-white/50"
                            }`}
                        onClick={() => setCurrent(index)}
                    />
                ))}
            </div>
        </div>
    );
}