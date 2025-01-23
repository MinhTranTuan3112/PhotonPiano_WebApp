import { Link } from "@remix-run/react";
import { Piano, Music } from 'lucide-react';
import { motion } from "framer-motion";

export function PianoPromo() {
    return (
        <div className="relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-5 left-10 w-20 h-20 border-2 border-indigo-200 rounded-full animate-spin-slow" />
            <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-teal-200 rounded-full animate-pulse" />

            <div className="container mx-auto px-6 py-24">
                <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center text-center lg:items-start lg:text-left"
                    >
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                            Try Our Interactive Piano!
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Experience the joy of playing piano right in your browser. Practice, learn, and create music with our virtual piano simulator.
                        </p>
                        <Link
                            to="/piano-simulator"
                            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 px-6 py-3 text-lg font-semibold text-white transition-transform hover:scale-105"
                        >
                            <Piano className="h-5 w-5" />
                            Play Now
                        </Link>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative h-48 w-72 overflow-hidden rounded-2xl bg-white/80 shadow-lg backdrop-blur-sm">
                                <div className="flex h-full flex-col items-center justify-center gap-2">
                                    <div className="relative">
                                        <Piano className="h-16 w-16 text-indigo-600 animate-pulse" />
                                        <div className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                                        Virtual Piano
                                    </span>
                                </div>
                                {/* Decorative music notes */}
                                <Music className="absolute top-4 right-4 h-6 w-6 text-indigo-200 animate-bounce" />
                                <Music className="absolute bottom-4 left-4 h-4 w-4 text-teal-200 animate-pulse" />
                            </div>
                        </div>
                    </motion.div>
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
        </div>
    );
}

