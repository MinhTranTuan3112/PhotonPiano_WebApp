import { Await, Form, useLoaderData } from '@remix-run/react'
import { Suspense } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Role } from '~/lib/types/account/account'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { requireAuth } from '~/lib/utils/auth'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { DoorOpen, PlusCircle } from 'lucide-react'
import { fetchCreateRoom, fetchRooms, fetchUpdateRoom } from '~/lib/services/rooms'
import { Room } from '~/lib/types/room/room'
import GenericDataTable from '~/components/ui/generic-data-table'
import { roomColumns } from '~/components/admin/table/room-column'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { zodResolver } from '@hookform/resolvers/zod'
import { getValidatedFormData } from 'remix-hook-form'
import { useRoomDialog } from '~/components/admin/room/room-dialog'
import { Input } from '~/components/ui/input'

type Props = {}

export const roomSchema = z.object({
    roomAction: z.string(),
    id: z.string().optional(),
    name: z.string().min(1, { message: 'Name is required' }),
    capacity: z.coerce.number({ message: 'Invalid value' }).min(1, { message: 'Capacity must >= 1' }),
    status: z.coerce.number()
});

export type RoomFormData = z.infer<typeof roomSchema>;

export const roomResolver = zodResolver(roomSchema);

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            keyword: searchParams.get('q') || '',
            idToken
        };

        const promise = fetchRooms({ ...query }).then((response) => {
            const rooms = response.data as Room[];

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return { rooms, metadata };
        });

        return {
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

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<RoomFormData>(request, roomResolver);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        switch (data.roomAction.toLowerCase()) {
            case 'create':

                await fetchCreateRoom({ idToken, ...data });

                break;
            case 'update':
                await fetchUpdateRoom({ idToken, ...data });

                break;

            default:
                return Response.json({
                    success: false,
                    error: 'Invalid action'
                }, {
                    status: 400
                });
        }

        return Response.json({
            success: true
        }, {
            status: 200
        })

    } catch (error) {
        console.error(error);

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

export default function AdminRoom({ }: Props) {

    const { promise, query } = useLoaderData<typeof loader>();

    const { open: handleOpenRoomDialog, roomDialog } = useRoomDialog({
        isEdit: false,
    });

    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <DoorOpen className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Manage Rooms</h3>
                    <p className="text-sm text-sky-600">Manage rooms of the center</p>
                </div>
            </div>
            <Form method='GET' className='flex flex-row gap-4 items-center'>
                <Input
                    type='text'
                    name='q'
                    placeholder='Search by room name...'
                    className='w-full'
                    defaultValue={query.keyword}
                />
                <Button type='submit'>Search</Button>
            </Form>
            <div className='flex my-2 justify-end'>
                <Button Icon={PlusCircle} iconPlacement='left' onClick={handleOpenRoomDialog}>Add new</Button>
            </div>
            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={promise}>
                    {(data) => (
                        <GenericDataTable columns={roomColumns} resolvedData={data.rooms} metadata={data.metadata} />
                    )}
                </Await>
            </Suspense >
            {roomDialog}
            {/* {loadingAddDialog}
            {confirmAddDialog}
            {confirmDeleteDialog}
            {confirmEditModal} */}
        </article >
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}