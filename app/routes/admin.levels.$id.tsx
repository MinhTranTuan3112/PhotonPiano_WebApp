import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react';
import { Suspense, useEffect } from 'react';
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import LevelForm, { LevelFormData, levelSchema } from '~/components/level/level-form';
import { classColums } from '~/components/staffs/table/class-columns';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Card, CardContent } from '~/components/ui/card';
import { DataTable } from '~/components/ui/data-table';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { fetchALevel, fetchUpdateLevel } from '~/lib/services/level';
import { LevelDetails, Role } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { toastWarning } from '~/lib/utils/toast-utils';

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

        const promise = fetchALevel({ id }).then((response) => {
            const levelPromise: Promise<LevelDetails> = response.data;

            return {
                levelPromise
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

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const id = params.id as string;

        if (!id) {
            return redirect('/admin/levels');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<Partial<LevelFormData>>(request, zodResolver(levelSchema.partial()));

        if (errors) {
            return { success: false, errors, defaultValues };
        }
        const response = await fetchUpdateLevel({
            idToken,
            ...data
        });

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

    const { promise, id, idToken } = useLoaderData<typeof loader>();

    return (
        <section className='px-10'>
            <h3 className="text-xl font-bold">Level details</h3>
            <p className="text-sm text-muted-foreground">Details information of level</p>

            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ levelPromise }) => (
                        <Await resolve={levelPromise}>
                            <LevelDetailsContent idToken={idToken} />
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

function LevelDetailsContent({ idToken }: { idToken: string }) {

    const level = useAsyncValue() as LevelDetails;

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Level updated successfully');
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning('Failed to update level', {
                description: fetcher.data?.error,
                duration: 5000
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);


    return <Card className="p-3 border-t-4 my-4" style={{
        borderTopColor: level.themeColor
    }}>
        <CardContent>
            <Tabs defaultValue="basic-info">
                <TabsList className="grid w-full grid-cols-3 my-4 p-0 h-auto bg-background gap-1">
                    <TabsTrigger value="basic-info" className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>Basic information</TabsTrigger>
                    <TabsTrigger value="students" className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>Learners</TabsTrigger>
                    <TabsTrigger value="classes" className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>Classes</TabsTrigger>
                </TabsList>
                <TabsContent value="basic-info">
                    <LevelForm {...level} fetcher={fetcher} isSubmitting={isSubmitting} idToken={idToken} />
                </TabsContent>
                <TabsContent value="students">
                    <DataTable data={level.accounts} columns={studentColumns} />
                </TabsContent>
                <TabsContent value='classes'>
                    <DataTable data={level.classes} columns={classColums} />
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
}