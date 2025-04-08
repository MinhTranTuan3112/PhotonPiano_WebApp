import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ActionDialog from "~/components/home/action-dialog";
import { Carousel } from "~/components/home/carousel";
import { NewsSection } from "~/components/home/news";
import { PianoPromo } from "~/components/home/promo";
import { RegistrationSection } from "~/components/home/registration-section";
import { FeatureSection } from "~/components/home/what-we-do";
import { useAuth } from "~/lib/contexts/auth-context";
import { getAuth } from "~/lib/utils/auth";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isOpenDialog = url.searchParams.get('enroll-now') === "true"
  return { isOpenDialog }
}

export default function Index() {
  const { isOpenDialog } = useLoaderData<typeof loader>();
  const { currentAccount } = useAuth()

  return (
    <div className="flex min-h-screen flex-col relative">
      <article className="flex-1">
        <Carousel isOpenDialog={isOpenDialog} />
        {/* MissionSection */}
        <section className="relative flex justify-center py-24 bg-gradient-to-b from-purple-700 via-blue-600 to-teal-500">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container relative">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">Sứ mệnh của chúng tôi</h2>
              <p className="mt-6 text-lg leading-8 text-white/90">
                Photon Piano cam kết mang đến môi trường học tập chuyên nghiệp và truyền cảm hứng, giúp học viên ở mọi lứa tuổi phát triển kỹ năng, nuôi dưỡng đam mê và tự tin thể hiện bản thân qua âm nhạc.
              </p>
            </div>
          </div>
        </section>

        <FeatureSection />
        {/* <PianoPromo /> */}
        <NewsSection />
        <RegistrationSection />
      </article>
      {
        (currentAccount?.studentStatus === 1 || currentAccount?.studentStatus === 2 || currentAccount?.studentStatus === 3) && (
          <ActionDialog account={currentAccount} />
        )
      }
    </div>
  );

}
