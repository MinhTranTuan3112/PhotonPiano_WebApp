import { LoaderFunctionArgs } from "@remix-run/node";
import { Carousel } from "~/components/home/carousel";
import { NewsSection } from "~/components/home/news";
import { PianoPromo } from "~/components/home/promo";
import { RegistrationSection } from "~/components/home/registration-section";
import { FeatureSection } from "~/components/home/what-we-do";
import { getAuth } from "~/lib/utils/auth";



export default function Index() {

  return (
    <div className="flex min-h-screen flex-col">
      <article className="flex-1">
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

        <FeatureSection />
        <PianoPromo />
        <NewsSection />
        <RegistrationSection />
      </article>
    </div>
  );

}
