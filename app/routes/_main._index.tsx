import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ActionDialog from "~/components/home/action-dialog";
import Carousel from "~/components/home/carousel";
import { NewsSection } from "~/components/home/news";
import { RegistrationSection } from "~/components/home/registration-section";
import { FeatureSection } from "~/components/home/what-we-do";
import { useAuth } from "~/lib/contexts/auth-context";
import { fetchSystemConfigByName } from "~/lib/services/system-config";
import { SystemConfig } from "~/lib/types/config/system-config";
import { ALLOW_ENTRANCE_TEST_REGISTERING } from "~/lib/utils/config-name";

export async function loader({ request, params }: LoaderFunctionArgs) {

  const url = new URL(request.url);
  const isOpenDialog = url.searchParams.get('enroll-now') === "true"

  let allowEntranceTestRegistering = true;

  try {

    const fetchConfigResponse = await fetchSystemConfigByName({
      idToken: '',
      name: ALLOW_ENTRANCE_TEST_REGISTERING
    });

    const configData: SystemConfig = await fetchConfigResponse.data;

    allowEntranceTestRegistering = configData.configValue ? configData.configValue === "true" : true;

  } catch (error) {

  }

  return { isOpenDialog, allowEntranceTestRegistering };
}

export default function Index() {

  const loaderData = useLoaderData<typeof loader>();
  const { currentAccount } = useAuth()

  const { allowEntranceTestRegistering } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col relative">
      <article className="flex-1">
        <Carousel isOpenDialog={loaderData?.isOpenDialog} allowEntranceTestRegistering={allowEntranceTestRegistering} />
        {/* MissionSection */}
        <section className="relative flex justify-center py-24 bg-gradient-to-b from-purple-700 via-blue-600 to-teal-500">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container relative">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
                Our Mission
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/90">
                Photon Piano commits to providing a professional and inspiring learning environment, helping students of all ages develop skills, nurture passion, and confidently express themselves through piano.
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
