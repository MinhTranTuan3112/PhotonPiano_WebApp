import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { getValidatedFormData } from 'remix-hook-form';
import LevelForm, { LevelFormData, levelSchema } from '~/components/level/level-form';
import { classColums } from '~/components/staffs/table/class-columns';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { DataTable } from '~/components/ui/data-table';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { fetchALevel } from '~/lib/services/level';
import { LevelDetails, Role } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const id = params.id as string;

        if (!id) {
            return redirect('/admin/levels');
        }

        const promise = fetchALevel({ idToken, id }).then((response) => {
            const levelPromise: Promise<LevelDetails> = response.data;

            return {
                levelPromise
            }
        });

        return {
            promise,
            id
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

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const id = params.id as string;

        if (!id) {
            return redirect('/admin/levels');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<Partial<LevelFormData>>(request, zodResolver(levelSchema.partial()));

        console.log({ data });

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        return Response.json({
            success: true
        }, {
            status: 200
        });

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

export default function LevelDetailsPage({ }: Props) {

    const { promise, id } = useLoaderData<typeof loader>();

    return (
        <section className='px-10'>
            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ levelPromise }) => (
                        <Await resolve={levelPromise}>
                            <LevelDetailsContent />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </section>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}

function LevelDetailsContent() {

    const level = useAsyncValue() as LevelDetails;

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    return <Tabs defaultValue="basic-info">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic-info">Basic information</TabsTrigger>
            <TabsTrigger value="students">Learners</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="basic-info">
            <LevelForm {...level} fetcher={fetcher} isSubmitting={isSubmitting} />
        </TabsContent>
        <TabsContent value="students">
            <DataTable data={level.accounts} columns={studentColumns} />
        </TabsContent>
        <TabsContent value='classes'>
            <DataTable data={level.classes} columns={classColums} />
        </TabsContent>
    </Tabs>
}