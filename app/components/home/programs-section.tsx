import { motion } from "framer-motion";
import { Music, Users, Trophy } from 'lucide-react';

const programs = [
    {
        title: "Private Lessons",
        description: "One-on-one instruction tailored to your goals and learning pace",
        icon: Music,
        features: [
            "Personalized curriculum",
            "Flexible scheduling",
            "In-depth technique focus"
        ]
    },
    {
        title: "Group Classes",
        description: "Learn and perform with peers in a collaborative environment",
        icon: Users,
        features: [
            "Ensemble playing",
            "Music theory workshops",
            "Peer motivation"
        ]
    },
    {
        title: "Performance Program",
        description: "Prepare for recitals, competitions, and public performances",
        icon: Trophy,
        features: [
            "Stage presence training",
            "Repertoire development",
            "Competition preparation"
        ]
    },
];

export function ProgramsSection() {
    return (
        <section className="py-24 bg-gray-100">
            <div className="container mx-auto px-4 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-2xl text-center mb-16"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Programs</h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Choose from our variety of programs designed to meet your musical aspirations
                    </p>
                </motion.div>
                <div className="grid gap-8 md:grid-cols-3">
                    {programs.map((program, index) => (
                        <motion.div
                            key={program.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            className="rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg"
                        >
                            <program.icon className="h-12 w-12 text-gray-800 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{program.title}</h3>
                            <p className="text-gray-600 mb-4">{program.description}</p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                {program.features.map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        <svg className="h-4 w-4 mr-2 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

