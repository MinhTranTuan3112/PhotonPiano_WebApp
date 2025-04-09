import { motion } from "framer-motion";
import { Music, Headphones, Users } from 'lucide-react';

const cards = [
    {
        title: "Khơi dậy đam mê âm nhạc",
        description: "Khơi dậy đam mê âm nhạc và nuôi dưỡng tinh thần nghệ thuật trong từng cá nhân.",
        icon: Music,
    },
    {
        title: "Cơ sở vật chất hiện đại",
        description: "Trải nghiệm học tập với cơ sở vật chất hiện đại và công nghệ tiên tiến.",
        icon: Headphones,
    },
    {
        title: "Môi trường học tập năng động, thực tiễn, cởi mở",
        description: "Tạo cơ hội biểu diễn, giao lưu và phát triển kỹ năng trình diễn trên sân khấu.",
        icon: Users,
    },
]

export function FeatureSection() {
    return (
        <section className="relative py-24 overflow-hidden bg-gray-100">
            {/* Piano key decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-16 flex">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-800'} h-full`} />
                ))}
            </div>

            <div className="relative container mx-auto px-4 max-w-7xl pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-sm uppercase tracking-wider text-gray-600 font-semibold">ĐÀO TẠO KHÁC BIỆT</h2>
                    <h3 className="mt-2 text-4xl font-bold text-gray-900">
                        Photon Piano cung cấp chương trình đào tạo piano độc đáo
                    </h3>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-3">
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            whileHover={{ y: -10 }}
                            className="group relative overflow-hidden rounded-lg shadow-lg bg-white"
                        >
                            <div className="p-6">
                                <card.icon className="h-12 w-12 text-gray-800 mb-4" />
                                <h4 className="mb-3 text-xl font-bold text-gray-900">{card.title}</h4>
                                <p className="text-sm leading-relaxed text-gray-600">{card.description}</p>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gray-800 to-gray-600 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Piano key decorative elements */}
            {/* <div className="absolute bottom-0 left-0 right-0 h-16 flex">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-800'} h-full`} />
                ))}
            </div> */}

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

