import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import SurveyDetailsContent from '~/components/survey/survey-details-content';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchASurvey } from '~/lib/services/survey';
import { Role } from '~/lib/types/account/account';
import { SurveyDetails } from '~/lib/types/survey/survey';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Student) {
            return redirect('/');
        }

        if (!params.id) {
            return redirect('/account/my-surveys');
        }

        const id = params.id as string;

        const promise = fetchASurvey({ id, idToken }).then((response) => {
            const surveyPromise: Promise<SurveyDetails> = response.data;

            return {
                surveyPromise,
                id
            }
        });

        return {
            promise,
            id,
            idToken
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function LearnerSurveyDetailsPage({ }: Props) {

    const { promise, id } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ surveyPromise }) => (
                        <Await resolve={surveyPromise}>
                            {(survey) => (
                                <SurveyDetailsContent surveyDetails={survey} />
                            )}
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
