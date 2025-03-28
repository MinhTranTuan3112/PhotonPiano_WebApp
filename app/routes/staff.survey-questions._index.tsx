import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, isRouteErrorResponse, Link, useFetcher, useLoaderData, useLocation, useRouteError, useSearchParams } from '@remix-run/react';
import { CirclePlus, RotateCcw, Search } from 'lucide-react';
import { Suspense, useEffect } from 'react'
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import { CreateQuestionFormData, createQuestionSchema } from '~/components/survey/question-dialog';
import { columns } from '~/components/survey/question-table';
import { Button, buttonVariants } from '~/components/ui/button';
import GenericDataTable from '~/components/ui/generic-data-table';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { useQuestionDialog } from '~/hooks/use-question-dialog';
import { fetchCreateQuestion, fetchSurveyQuestions, fetchUpdateQuestion } from '~/lib/services/survey-question';
import { Role } from '~/lib/types/account/account';
import { SurveyQuestion } from '~/lib/types/survey-question/survey-question';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            keyword: searchParams.get('q') || undefined,
            idToken
        };

        const promise = fetchSurveyQuestions({ ...query }).then((response) => {
            const questionsPromise: Promise<SurveyQuestion[]> = response.data;

            const headers = response.headers;

            const metadata = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                questionsPromise,
                metadata,
                query
            }
        });

        return {
            idToken,
            promise,
            query,
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
            await getValidatedFormData<CreateQuestionFormData>(request, zodResolver(createQuestionSchema));

        console.log({ data });

        if (errors) {
            // The keys "errors" and "defaultValues" are picked up automatically by useRemixForm
            console.log({ errors });
            return { success: false, errors, defaultValues };
        }

        const questionAction = data.questionAction || 'create';

        switch (questionAction.toLowerCase()) {
            case 'create':

                const createRequest = {
                    ...data,
                    minAge: data.hasAgeConstraint ? data.minAge : undefined,
                    maxAge: data.hasAgeConstraint ? data.maxAge : undefined,
                    id: undefined,
                    options: data.options || [],
                    allowOtherAnswer: data.allowOtherAnswer || true,
                    idToken
                }

                const createResponse = await fetchCreateQuestion({ ...createRequest });

                return {
                    success: createResponse.status === 201,
                    action: 'create'
                }

            case 'update':

                const updateRequest = {
                    ...data,
                    minAge: data.hasAgeConstraint ? data.minAge : undefined,
                    maxAge: data.hasAgeConstraint ? data.maxAge : undefined,
                    options: data.options || [],
                    allowOtherAnswer: data.allowOtherAnswer || true,
                    idToken
                }

                const updateResponse = await fetchUpdateQuestion({ ...updateRequest });

                return {
                    success: updateResponse.status === 204,
                    action: 'update'
                }
            default:
                return {
                    success: false,
                    message: 'Invalid action'
                }
        }


    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            message,
            status
        }
    }
}

function SearchForm() {

    const [searchParams, setSearchParams] = useSearchParams();

    return <Form method="GET" className="my-4 flex flex-row gap-3">
        <Input placeholder="Tìm kiếm câu hỏi..." name="q"
            defaultValue={searchParams.get('q') || undefined} />

        <Button type="submit" Icon={Search} iconPlacement="left">Tìm kiếm</Button>
    </Form>
}


export default function ManageSurveyQuestionsPage({ }: Props) {

    const { promise, query } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    const { isOpen: isQuestionDialogOpen, handleOpen: handleOpenQuestionDialog, questionDialog } = useQuestionDialog({
        onQuestionCreated: (questionData) => {
            console.log({ questionData });
        },
        requiresUpload: true,
        requiresAgeInputs: true,
        isEditing: false
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            let message = '';

            switch (fetcher.data.action) {
                case 'create':
                    message = 'Câu hỏi đã được tạo thành công.';
                    break;

                default:
                    break;
            }

            if (message) {
                toast.success(message);
            }

            return;
        }

        return () => {

        }

    }, [fetcher.data]);


    return (
        <>
            <article className='px-10'>
                <h3 className="text-lg font-bold">Danh sách câu hỏi khảo sát</h3>
                <p className="text-sm text-muted-foreground">
                    Quản lý câu hỏi khảo sát của trung tâm
                </p>
                <SearchForm />
                <Suspense key={JSON.stringify(query)} fallback={<LoadingSkeleton />}>
                    <Await resolve={promise}>
                        {({ questionsPromise, metadata }) => (
                            <Await resolve={questionsPromise}>
                                <GenericDataTable
                                    columns={columns}
                                    metadata={metadata}
                                    emptyText="Không có câu hỏi nào."
                                    extraHeaderContent={
                                        <>
                                            <Button type="button" Icon={CirclePlus} iconPlacement="left"
                                                onClick={handleOpenQuestionDialog}>
                                                Tạo câu hỏi khảo sát
                                            </Button>
                                        </>
                                    }
                                />
                            </Await>
                        )}
                    </Await>
                </Suspense>
            </article>
            {questionDialog}
        </>
    );
};

export function ErrorBoundary() {

    const error = useRouteError();

    const { pathname, search } = useLocation();

    return (
        <article className="px-8">
            <h3 className="text-lg font-bold">Danh sách câu hỏi khảo sát</h3>
            <p className="text-sm text-muted-foreground">
                Quản lý câu hỏi khảo sát của trung tâm
            </p>

            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Có lỗi đã xảy ra.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                        flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Thử lại
                </Link>
            </div>
        </article>
    );
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}