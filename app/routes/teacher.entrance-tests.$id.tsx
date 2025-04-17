import { zodResolver } from '@hookform/resolvers/zod'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, useFetcher, useLoaderData } from '@remix-run/react'
import { Suspense, useEffect } from 'react'
import { getValidatedFormData } from 'remix-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Skeleton } from '~/components/ui/skeleton'
import { fetchAllMinimalCriterias } from '~/lib/services/criteria'
import { fetchAnEntranceTest, fetchUpdateEntranceTest } from '~/lib/services/entrance-tests'
import { Role } from '~/lib/types/account/account'
import { MinimalCriteria } from '~/lib/types/criteria/criteria'
import { updateEntranceTestSchema } from '~/lib/types/entrance-test/entrance-test'
import { EntranceTestDetail } from '~/lib/types/entrance-test/entrance-test-detail'
import { requireAuth } from '~/lib/utils/auth'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { EntranceTestDetailsContent } from './staff.entrance-tests.$id'

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {

    try {

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Instructor) {
            return redirect('/');
        }

        if (!params.id) {
            return redirect('/teacher/entrance-tests');
        }

        const { searchParams } = new URL(request.url);

        const tab = (searchParams.get('tab') || 'general');

        const id = params.id as string;

        const promise = fetchAnEntranceTest({ id, idToken }).then((response) => {

            const entranceTestDetailsPromise: Promise<EntranceTestDetail> = response.data;

            return {
                entranceTestDetailsPromise,
            }
        });

        const fetchCriteriasResponse = await fetchAllMinimalCriterias({ idToken });

        const criterias: MinimalCriteria[] = await fetchCriteriasResponse.data;

        return {
            promise,
            idToken,
            tab,
            role,
            id,
            criterias
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

export default function TeacherEntranceTestDetailsPage({ }: Props) {

    const { promise, id, ...data } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Cập nhật thông tin đợt thi thành công!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.warning(fetcher.data.error, {
                position: 'top-center',
                duration: 5000
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);

    return (
        <article className='px-10'>
            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ entranceTestDetailsPromise }) => (
                        <Await resolve={entranceTestDetailsPromise}>
                            <EntranceTestDetailsContent fetcher={fetcher} {...data} />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article >
    )
}

const serverSchema = updateEntranceTestSchema.pick({
    name: true,
    shift: true,
    instructorId: true,
    roomId: true
}).extend({
    date: z.string().nonempty({ message: 'Ngày thi không được để trống.' })
});

type ServerUpdateEntranceTestFormData = z.infer<typeof serverSchema>;

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Instructor) {
            return redirect('/');
        }

        const { data, errors, receivedValues: defaultValues } =
            await getValidatedFormData<ServerUpdateEntranceTestFormData>(request, zodResolver(serverSchema));

        if (errors) {
            console.log({ errors });

            return { success: false, errors, defaultValues };
        }

        if (!params.id) {
            return {
                success: false,
                error: 'Không có mã đợt thi',
            }
        }

        const id = params.id as string;

        const updateRequest = {
            ...data,
            date: data.date.toString(),
            shift: parseInt(data.shift),
            id,
            instructorId: data.instructorId || undefined,
            idToken
        };

        const response = await fetchUpdateEntranceTest(updateRequest);

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
        });
    }
}

const resolver = zodResolver(updateEntranceTestSchema);


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}


function ComboboxSkeleton() {
    return <div className="flex flex-col gap-2 justify-center items-center my-4">
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
    </div>
}