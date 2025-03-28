import { Link } from "@remix-run/react";
import { motion } from "framer-motion";
import { UserPlus, Music, Sparkles } from 'lucide-react';

export function RegistrationSection() {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#563d5f] via-[#3b7b98] to-[#39a2ae]" />

            {/* Decorative elements */}
            <motion.div
                className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute bottom-10 right-10 w-32 h-32 border-4 border-white/20 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.h2
                        className="text-3xl md:text-4xl font-bold text-white mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Ready to Start Your Musical Journey?
                    </motion.h2>
                    <motion.p
                        className="text-xl text-white/80 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Join our community of passionate musicians and unlock your potential with expert guidance and innovative learning tools.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Link
                            to="/entrance-survey"
                            className="inline-flex items-center gap-2 bg-white text-[#563d5f] px-8 py-3 rounded-full text-lg font-semibold transition-all hover:bg-opacity-90 hover:scale-105"
                        >
                            <UserPlus className="w-5 h-5" />
                            Đăng ký ngay
                        </Link>
                    </motion.div>
                </div>

                {/* Decorative musical elements */}
                <motion.div
                    className="absolute top-1/4 left-4 text-white/30"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Music size={40} />
                </motion.div>
                <motion.div
                    className="absolute bottom-1/4 right-4 text-white/30"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                    <Sparkles size={40} />
                </motion.div>
            </div>

            {/* Wave decoration at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
                <svg
                    className="relative block w-full h-[40px]"
                    preserveAspectRatio="none"
                    viewBox="0 0 1440 54"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M0 22L48 25.3C96 28.7 192 35.3 288 38.5C384 41.7 480 41.3 576 36.3C672 31.3 768 21.7 864 20.2C960 18.7 1056 25.3 1152 28.5C1248 31.7 1344 31.3 1392 31.2L1440 31V54H1392C1344 54 1248 54 1152 54C1056 54 960 54 864 54C768 54 672 54 576 54C480 54 384 54 288 54C192 54 96 54 48 54H0V22Z"
                        fill="white"
                        fillOpacity="0.1"
                    />
                </svg>
            </div>
        </section>
    );
}

