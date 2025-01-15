import { MetaFunction } from "@remix-run/react";
import { Carousel } from "~/components/test_components/carousel";
import { Header } from "../components/test_components/header";
import { ProgramsSection } from "~/components/test_components/programs-section";
import { NewsEvents } from "~/components/test_components/news";
import Footer from "~/components/footer";
import { WhatWeDo } from "~/components/test_components/what-we-do";
import { PianoPromo } from "~/components/test_components/promo";
import { RegistrationSection } from "~/components/test_components/registration-section";

export const meta: MetaFunction = () => {
    return [
        { title: "PianoMaster - Learn Piano Online" },
        { name: "description", content: "Learn piano with expert instructors online" },
    ];
};


export default function TestHome() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <Carousel />
                {/* MissionSection */}
                <section className="relative py-24 bg-gradient-to-b from-purple-700 via-blue-600 to-teal-500">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="container relative">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">Our Mission</h2>
                            <p className="mt-6 text-lg leading-8 text-white/90">
                                To positively impact the motivation, achievement, and self-confidence of underserved students by integrating music education
                                into the core curriculum of under-resourced schools.
                            </p>
                        </div>
                    </div>
                </section>

                {/* <ProgramsSection /> */}
                <WhatWeDo />
                <PianoPromo />
                <NewsEvents />
                <RegistrationSection />
            </main>
            <Footer />
        </div>
    );
}