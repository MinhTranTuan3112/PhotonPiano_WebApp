import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react';
import { FileQuestion, PencilLine, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react'
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import SurveyDetailsContent from '~/components/survey/survey-details-content';
import SurveyForm, { SurveyFormData, surveyResolver } from '~/components/survey/survey-form';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchASurvey, fetchUpdateSurvey } from '~/lib/services/survey';
import { Role } from '~/lib/types/account/account';
import { SurveyDetails } from '~/lib/types/survey/survey';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { toastWarning } from '~/lib/utils/toast-utils';

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

        return Response.json({
            success: response.status === 204
        }, {
            status: 200
        })

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        })
    }
}

export default function SurveyDetailsPage({ }: Props) {

    const { promise, id } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <FileQuestion className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Survey details</h3>
                    <p className="text-sm text-sky-600">Survey details information</p>
                </div>
            </div>

            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ surveyPromise }) => (
                        <Await resolve={surveyPromise}>
                            <SurveyContent />
                        </Await>
                    )}
                </Await>
            </Suspense>

        </article>
    );
};

function SurveyContent() {

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

    const [isEditing, setIsEditing] = useState(false);

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Update successfully!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000,
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);



    return <div className="">
        <div className="flex justify-end my-4">
            <Button type='button' variant={'outline'} size={'icon'} className='rounded-full' onClick={() => setIsEditing(!isEditing)}>
                {!isEditing ? <PencilLine /> : <X className='text-red-600' />}
            </Button>
        </div>
        {isEditing ? <SurveyForm idToken={idToken} surveyData={surveyData} isEditing={true} fetcher={fetcher} /> :
            <SurveyDetailsContent surveyDetails={survey} />}
    </div>
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
