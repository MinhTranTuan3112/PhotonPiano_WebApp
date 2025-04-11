import { Await, Form, useFetcher, useLoaderData, useSearchParams } from '@remix-run/react'
import { Suspense, useEffect, useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, data, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Role } from '~/lib/types/account/account'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { requireAuth } from '~/lib/utils/auth'
import { fetchAllMinimalCriterias, fetchCreateCriteria, fetchCriterias, fetchDeleteCriteria, fetchUpdateCriteria } from '~/lib/services/criteria'
import { Criteria, CriteriaFor } from '~/lib/types/criteria/criteria'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formEntryToNumber, formEntryToString } from '~/lib/utils/form'
import { Button } from '~/components/ui/button'
import { CheckIcon, Delete, Edit2Icon, PlusCircle, X, XIcon } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { useRemixForm } from 'remix-hook-form'
import { ActionResult } from '~/lib/types/action-result'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import useLoadingDialog from '~/hooks/use-loading-dialog'
import { fetchRooms } from '~/lib/services/rooms'
import { Room } from '~/lib/types/room/room'
import GenericDataTable from '~/components/ui/generic-data-table'
import { roomColumns } from '~/components/admin/table/room-column'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { fetchDayOffs } from '~/lib/services/day-off'
import { DayOff } from '~/lib/types/day-off/day-off'
import { dayOffColumns } from '~/components/admin/table/day-off-column'
type Props = {}

const addCriteriaSchema = z
    .object({
        description: z.string().optional(), // Optional URL for existing avatar
        name: z
            .string({ message: "Tên không được để trống." }),
        weight: z.coerce.number({ message: "Trọng số không được để trống" })
            .min(1, { message: "Tối thiểu 1." })
            .max(100, { message: "Tối đa 100." }),
        action: z.string(),
        idToken: z.string(),
        criteriaFor: z.coerce.number(),
    });

type AddCriteriaSchema = z.infer<typeof addCriteriaSchema>;

const resolver = zodResolver(addCriteriaSchema);

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const promise = fetchDayOffs({ idToken, pageSize: 100 }).then((response) => {
            const dayOffs = response.data as DayOff[];

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),

            };
            return { dayOffs , metadata};
        });

        return {
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


export async function action({ request }: ActionFunctionArgs) {

    try {

    } catch (err) {
        var error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }

}

export default function AdminDayOff({ }: Props) {

    const { promise, idToken } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Quản lý các kỳ nghỉ</h1>
            <p className='text-muted-foreground'>Quản lý các kỳ nghỉ, phục vụ cho việc sắp xếp lớp</p>
            <div className='my-2  flex justify-end w-full'>
                <Button Icon={PlusCircle} iconPlacement='left'>Thêm mới</Button>
            </div>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {(data) => (
                        <GenericDataTable columns={dayOffColumns} resolvedData={data.dayOffs} metadata={data.metadata} />
                    )}
                </Await>
            </Suspense >
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