import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Calendar } from 'lucide-react';
import React, { Suspense } from 'react'
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { DatePickerInput } from '~/components/ui/date-picker-input';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchAccounts } from '~/lib/services/account';
import { Account, Role, StudentStatus } from '~/lib/types/account/account';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { LEVEL } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== 4) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            studentStatuses: [StudentStatus.WaitingForClass],
            roles: [Role.Student],
            idToken
        };

        const promise = fetchAccounts({ ...query }).then((response) => {

            const accounts: Account[] = response.data;

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                accounts,
                metadata,
                query: { ...query, idToken: undefined }
            }
        });

        return {
            promise,
            query: { ...query, idToken: undefined }
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

export default function StaffAutoArrangeClass({ }: Props) {
    const { promise } = useLoaderData<typeof loader>();

    return (
        <div>
            <div className='px-8'>
                <h3 className="text-lg font-bold">Xếp Lớp Tự Động</h3>
                <p className="text-sm text-muted-foreground">
                    Chỉ vài thao tác cơ bản để xếp lớp tất cả học viên 1 cách tự động
                </p>
                <Suspense fallback={<LoadingSkeleton />}>
                    <Await resolve={promise}>
                        {(data) => (
                            <div className='mt-8 space-y-6'>
                            <div className='text-lg font-semibold'>Tổng số học sinh cần xếp lớp: <span className='font-bold'>{data.metadata.totalCount}</span></div>
                        
                            {/* Level Breakdown */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                                {LEVEL.map((level, index) => (
                                    <div className='flex flex-col items-center p-4 border rounded-lg shadow-md bg-white' key={index}>
                                        <div className='text-center font-bold'>LEVEL {index + 1}</div>
                                        <div className='text-center text-lg text-gray-600'>{data.accounts.filter(a => a.level === index).length}</div>
                                    </div>
                                ))}
                            </div>
                        
                            {/* Student Selection */}
                            <div className='flex flex-wrap gap-4 items-center'>
                                <span  className='font-bold'>Chọn số học viên:</span>
                                <Input defaultValue={100} className='w-full sm:w-32' />
                                <Checkbox /> <span className='italic text-sm'>Xác định số học viên cụ thể</span>
                            </div>
                        
                            {/* Start Week Selection */}
                            <div className='flex flex-wrap gap-4 items-center'>
                                <span className='font-bold'>Chọn tuần bắt đầu:</span>
                                <DatePickerInput className='w-full sm:w-64' />
                            </div>
                        
                            {/* Class Session Selection */}
                            <div className='space-y-2'>
                                <span className='font-bold'>Chọn buổi học:</span>
                                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className='flex items-center gap-2'>
                                            <Checkbox /> <span className='italic text-sm'>Ca {i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        
                            {/* Buttons */}
                            <div className='flex flex-wrap justify-center gap-4'>
                                <Button variant={'outline'} Icon={Calendar} iconPlacement='left'>Xem lịch nghỉ</Button>
                                <Button>Bắt đầu xếp lớp</Button>
                            </div>
                        </div>
                            
                        )}
                    </Await>
                </Suspense>
            </div>
        </div>
    )
}
function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
