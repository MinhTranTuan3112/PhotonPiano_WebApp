import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from "react";
import EnrollDialog from '../entrance-tests/enroll-dialog';

const slides = [
    {
        // ?height=1000&width=1200
        url: "/images/banner1.jpg?height=1000&width=1200",
        title: "THI ĐẦU VÀO 2025",
        description: "Trung tâm Photon Piano trân trọng thông báo lịch thi đầu vào mới nhất 2025",
    },
    {
        url: "/images/banner2.png?height=1000&width=1200",
        title: "Learn from the Best",
        description: "Các giảng viên chuyên gia tận tâm giúp bạn phát triển âm nhạc",
    },
    {
        url: "/images/banner3.jpg?height=1000&width=1200",
        title: "Mở khóa tiềm năng",
        description: "Lộ trình học đảm bảo giúp bạn đạt được mục tiêu âm nhạc của mình",
    }
]

export function Carousel() {

    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isOpenEnrollDialog, setIsOpenEnrollDialog] = useState(false);

    const moveSlide = useCallback((direction: 'prev' | 'next') => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrent(prevCurrent => {
            if (direction === 'prev') {
                return prevCurrent === 0 ? slides.length - 1 : prevCurrent - 1;
            } else {
                return prevCurrent === slides.length - 1 ? 0 : prevCurrent + 1;
            }
        });

        setTimeout(() => setIsTransitioning(false), 1000); // Match this with your transition duration
    }, [isTransitioning]);

    const prev = useCallback(() => moveSlide('prev'), [moveSlide]);
    const next = useCallback(() => moveSlide('next'), [moveSlide]);

    useEffect(() => {
        const interval = setInterval(() => {
            moveSlide('next');
        }, 5000);

        return () => clearInterval(interval);
    }, [moveSlide]);

    return (
        <>
            <div className="relative h-screen w-full overflow-hidden">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <img
                            src={slide.url || "/placeholder.svg"}
                            alt={`Carousel Slide ${index + 1}`}
                            className="h-full w-full object-cover brightness-75"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{slide.title}</h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8">{slide.description}</p>
                            {index === 0 && (
                                <button onClick={() => setIsOpenEnrollDialog(!isOpenEnrollDialog)} className="mt-8 relative overflow-hidden px-6 py-3 rounded-full bg-gradient-to-r from-indigo-400 to-teal-200 text-white font-medium text-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Đăng ký ngay
                                    <div className="absolute inset-0 bg-white/20 transform rotate-45 translate-x-3/4 transition-transform group-hover:translate-x-1/4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 z-20"
                    onClick={prev}
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 z-20"
                    onClick={next}
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2 z-20">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`h-2 w-2 rounded-full transition-colors ${index === current ? "bg-white" : "bg-white/50"
                                }`}
                            onClick={() => {
                                if (!isTransitioning) {
                                    setCurrent(index);
                                    setIsTransitioning(true);
                                    setTimeout(() => setIsTransitioning(false), 1000);
                                }
                            }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
            <EnrollDialog setIsOpen={setIsOpenEnrollDialog} isOpen={isOpenEnrollDialog} />
        </>
    );
}

