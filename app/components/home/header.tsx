import { Menu, Music, Piano } from 'lucide-react';
import React from "react";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <header className="fixed top-0 z-50 w-full">
            {/* Gradient background with blur */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-gray-50/80 to-white/80 backdrop-blur-sm" />

            {/* Main header content */}
            <div className="relative container mx-auto px-6 py-4">
                <nav className="flex items-center justify-between">
                    {/* Logo section with animated notes */}
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Piano className="h-8 w-8 text-indigo-600 animate-pulse" />
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full animate-bounce" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">Photon Piano</h1>
                    </div>

                    {/* Desktop Navigation - with hover effects */}
                    <div className="hidden md:flex items-center space-x-8">
                        {['Discover', 'Learn', 'Perform', 'Connect'].map((item) => (
                            <button
                                key={item}
                                className="relative group px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors duration-300"
                            >
                                <span>{item}</span>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
                            </button>
                        ))}
                        <button className="relative overflow-hidden px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-medium transition-transform hover:scale-105">
                            Join Now
                            <div className="absolute inset-0 bg-white/20 transform rotate-45 translate-x-3/4 transition-transform group-hover:translate-x-1/4" />
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                    >
                        <Menu className="h-6 w-6 text-gray-700" />
                    </button>
                </nav>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white/90 backdrop-blur-md rounded-b-2xl shadow-lg md:hidden">
                        <div className="flex flex-col space-y-4">
                            {['Discover', 'Learn', 'Perform', 'Connect'].map((item) => (
                                <button
                                    key={item}
                                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors"
                                >
                                    {item}
                                </button>
                            ))}
                            <button className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-medium">
                                Join Now
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Decorative wave shape at bottom */}
            <div className="absolute bottom-0 w-full overflow-hidden">
                <svg className="relative block w-full h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path
                        fill="#4f46e5"
                        fillOpacity="0.2"
                        d="M0,96L48,106.7C96,117,192,139,288,138.7C384,139,480,117,576,106.7C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>
            </div>
        </header>
    );
}

