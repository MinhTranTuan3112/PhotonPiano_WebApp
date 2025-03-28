import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react';
import { Suspense, useEffect } from 'react'
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import SurveyForm, { SurveyFormData, surveyResolver } from '~/components/survey/survey-form';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchASurvey, fetchUpdateSurvey } from '~/lib/services/survey';
import { Role } from '~/lib/types/account/account';
import { SurveyDetails } from '~/lib/types/survey/survey';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        if (!params.id) {
            return redirect('/staff/surveys');
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

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        if (!params.id) {
            return {
                success: false,
                error: 'Missing survey id'
            }
        }

        const id = params.id as string;

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SurveyFormData>(request, surveyResolver);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const updateRequest = {
            name: data.name,
            description: data.description,
            isEntranceSurvey: data.isEntranceSurvey,
            questions: !data.isEmptySurvey && data.questions?.map((question, index) => {
                return {
                    id: question.id,
                    type: question.type,
                    questionContent: question.questionContent,
                    options: question.options || [],
                    isRequired: question.isRequired || true,
                    allowOtherAnswer: question.allowOtherAnswer || true,
                }
            }) || [],
            minAge: data.hasAgeConstraint === true ? data.minAge : undefined,
            maxAge: data.hasAgeConstraint === true ? data.maxAge : undefined,
            id,
            idToken
        }

        const response = await fetchUpdateSurvey({ ...updateRequest });

        return {
            success: response.status === 204
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
            status
        }
    }
}

export default function SurveyDetailsPage({ }: Props) {

    const { promise, id } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <h1 className="text-lg font-bold">Chi tiết khảo sát</h1>
            <p className="text-sm text-muted-foreground">
                Chi tiết thông tin của khảo sát
            </p>

            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ surveyPromise }) => (
                        <Await resolve={surveyPromise}>
                            <SurveyDetailsContent />
                        </Await>
                    )}
                </Await>
            </Suspense>

        </article>
    );
};

function SurveyDetailsContent() {

    const { idToken } = useLoaderData<typeof loader>();

    const surveyValue = useAsyncValue();

    const survey = surveyValue as SurveyDetails;

    const surveyData = {
        id: survey.id,
        name: survey.name,
        description: survey.description,
        isEmptySurvey: survey.pianoSurveyQuestions.length === 0,
        minAge: survey.minAge,
        maxAge: survey.maxAge,
        questions: survey.pianoSurveyQuestions.map((question) => {
            return {
                id: question.question.id,
                type: question.question.type,
                questionContent: question.question.questionContent,
                options: question.question.options,
                isRequired: question.isRequired,
                allowOtherAnswer: question.question.allowOtherAnswer
            }
        })
    };

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Cập nhật thành công!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.error(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return <SurveyForm idToken={idToken} surveyData={surveyData} isEditing={true} fetcher={fetcher} />
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
