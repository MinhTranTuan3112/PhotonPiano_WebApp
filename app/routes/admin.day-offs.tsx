import { Await, useFetcher, useLoaderData } from '@remix-run/react'
import { Suspense, useEffect, useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Role } from '~/lib/types/account/account'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { requireAuth } from '~/lib/utils/auth'
import { Button } from '~/components/ui/button'
import GenericDataTable from '~/components/ui/generic-data-table'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { fetchCreateDayOff, fetchDayOffs, fetchDeleteDayOff, fetchUpdateDayOff } from '~/lib/services/day-off'
import { DayOff, dayOffSchema } from '~/lib/types/day-off/day-off'
import { dayOffColumns, DayOffDialog } from '~/components/admin/table/day-off-column'
import { CalendarDaysIcon, PlusCircle } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getValidatedFormData } from 'remix-hook-form'
import { toast } from 'sonner'
import { toastWarning } from '~/lib/utils/toast-utils'

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '100'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            idToken
        };

        const promise = fetchDayOffs({ ...query }).then((response) => {
            const dayOffs = response.data as DayOff[];

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return { dayOffs, metadata };
        });

        return {
            query,
            promise,
            role,
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

const schema = dayOffSchema.extend({
    dayOffAction: z.string()
});

type ServerFormData = z.infer<typeof schema>;

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const dayOffAction = searchParams.get('action') as string;

        if (dayOffAction === 'delete') {
            await fetchDeleteDayOff({
                id: searchParams.get('id') || '',
                idToken
            });

            return Response.json({
                success: true,
                dayOffAction: 'delete'
            }, {
                status: 200
            });
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<ServerFormData>(request, zodResolver(schema));

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        switch (data.dayOffAction.toLowerCase()) {
            case 'update':

                await fetchUpdateDayOff({
                    ...data,
                    id: data.id || '',
                    startTime: data.startTime ? data.startTime.toISOString() : undefined,
                    endTime: data.endTime ? data.endTime.toISOString() : undefined,
                    idToken
                })

                break;

            case 'create':

                await fetchCreateDayOff({
                    ...data,
                    startTime: data.startTime.toISOString(),
                    endTime: data.endTime.toISOString(),
                    idToken
                })

                break;

            case 'delete':

                await fetchDeleteDayOff({
                    id: data.id || '',
                    idToken
                })

                break;

            default:
                break;
        }

        return Response.json({
            success: true,
            dayOffAction: data.dayOffAction,
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
            status
        }, {
            status
        })

    }

}

export default function AdminDayOff({ }: Props) {

    const { promise, query } = useLoaderData<typeof loader>();

    const [isOpenDialog, setIsOpenDialog] = useState(false);

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Create Successfully!');
            setIsOpenDialog(false);
            return;
        }


        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return (
        <>
            <article className='px-10'>
                <div className="flex items-center gap-3 mb-4">
                    <CalendarDaysIcon className="h-8 w-8 text-sky-600" />
                    <div>
                        <h3 className="text-2xl font-bold text-sky-800">Manage Day-Offs</h3>
                        <p className="text-sm text-sky-600">Manage day-offs or holidays, also served in scheduling</p>
                    </div>
                </div>
                <div className='my-2 flex justify-end w-full'>
                    <Button Icon={PlusCircle} iconPlacement='left' type='button'
                        onClick={() => setIsOpenDialog(true)} variant={'theme'}>Add new</Button>
                </div>
                <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                    <Await resolve={promise}>
                        {(data) => (
                            <GenericDataTable columns={dayOffColumns} resolvedData={data.dayOffs} metadata={data.metadata} />
                        )}
                    </Await>
                </Suspense>
            </article>
            <DayOffDialog fetcher={fetcher} isOpen={isOpenDialog}
                setIsOpen={setIsOpenDialog} isEdit={false} />
        </>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}