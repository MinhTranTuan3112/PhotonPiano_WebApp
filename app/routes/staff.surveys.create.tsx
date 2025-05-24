import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { getValidatedFormData } from 'remix-hook-form';
import { Separator } from '~/components/ui/separator';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { requireAuth } from '~/lib/utils/auth';
import { Role } from '~/lib/types/account/account';
import { fetchCreateSurvey } from '~/lib/services/survey';
import SurveyForm, { SurveyFormData, surveyResolver } from '~/components/survey/survey-form';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { toastWarning } from '~/lib/utils/toast-utils';
import { FilePlus, PlusCircle } from 'lucide-react';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        return {
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

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SurveyFormData>(request, surveyResolver);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const createRequest = {
            name: data.name,
            description: data.description,
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
            idToken
        }

        const response = await fetchCreateSurvey({ ...createRequest });

        if (response.status === 201) {
            return redirect('/staff/surveys');
        }

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
        });
    }
}

export default function CreateSurveyPage({ }: Props) {

    const { idToken } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);


    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <FilePlus className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Create New Survey</h3>
                    <p className="text-sm text-sky-600">Create new survey with a set of questions</p>
                </div>
            </div>
            <Separator className='w-full my-2' />

            <SurveyForm idToken={idToken} fetcher={fetcher} />
        </article>
    );
};


