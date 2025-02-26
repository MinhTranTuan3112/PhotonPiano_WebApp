import React, { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Await, Form, isRouteErrorResponse, useFetcher, useLocation, useNavigation, useRouteError, useSearchParams } from '@remix-run/react'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { Account, Level } from '~/lib/types/account/account';
import { Skeleton } from '~/components/ui/skeleton';
import GenericDataTable from '~/components/ui/generic-data-table';
import { getStudentSimpleColumns, useSelection } from '../table/student-simple-columns';
import { PlusCircle, RefreshCcw, Search, Shuffle, TriangleAlert } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ClassDetail } from '~/lib/types/class/class-detail';
import { Checkbox } from '~/components/ui/checkbox';


type Props = {
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    studentPromise: Promise<{ students: Account[], metadata: PaginationMetaData }>,
    classInfo: ClassDetail

}

export default function AddStudentClassDialog({ isOpen, setIsOpen, studentPromise, classInfo }: Props) {
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedRowIds, toggleRowSelection, clearSelection } = useSelection(classInfo.capacity - classInfo.studentNumber);
    const columns = getStudentSimpleColumns({ selectedRowIds, toggleRowSelection });

    const handleRefresh = () => {
        setSearchParams({
            ...Object.fromEntries(searchParams.entries()),
            "page-students": "1",
            "q": ""
        })
        // clearSelection()
    }

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name")?.toString() || "";
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', '1');
        newSearchParams.set('q', name);
        setSearchParams(newSearchParams);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
                </DialogHeader>
                <div>
                    <div className='flex place-content-between'>
                        <div className='flex gap-2'>
                            <span className='font-bold'>LEVEL : </span>
                            <span>{classInfo.level + 1}</span>
                        </div>
                        <div className='flex gap-2'>
                            <span className='font-bold'>Tối đa : </span>
                            <span>{classInfo.capacity}</span>
                        </div>
                    </div>
                    <div className='flex gap-2 mt-2 font-bold italic items-center'>
                        <TriangleAlert /> Chỉ được bổ sung thêm <span className='text-xl'>{classInfo.capacity - classInfo.studentNumber}</span> học viên nữa
                    </div>
                    <div className='italic text-sm'>(Đã chọn {selectedRowIds.length} / {classInfo.capacity - classInfo.studentNumber})</div>
                    <Form method='GET' onSubmit={handleSearch}>
                        <div className='mt-2 flex gap-2'>
                            <Button variant={'outline'} onClick={handleRefresh} type='button'><RefreshCcw /></Button>
                            <Input placeholder='Tìm kiếm...' name='name'></Input>
                            <Button Icon={Search} iconPlacement='left'>Tìm kiếm</Button>
                        </div>
                    </Form>
                    <div className='max-h-[30rem] overflow-y-auto mt-2'>
                        <Suspense fallback={<LoadingDialog />}>
                            <Await resolve={studentPromise}>
                                {(data) => (
                                    <GenericDataTable columns={columns}
                                        metadata={data.metadata}
                                        resolvedData={data.students}
                                        enableRefresh={false}
                                        pageParamName='page-students'
                                        sizeParamName='size-students'
                                        allowHideColumns={false}
                                    />
                                )}
                            </Await>
                        </Suspense>
                    </div>
                    <div className='flex gap-2 items-center italic'>
                        <Checkbox></Checkbox> Phân bổ ngẫu nhiên để đủ sĩ số
                    </div>
                    <div className='flex gap-2 mt-2 '>
                        <Button Icon={PlusCircle} iconPlacement='left' className='w-full'>Xác nhận thêm</Button>
                    </div>

                </div>

            </DialogContent>
        </Dialog>
    )
}
function LoadingDialog() {
    return (
        <Skeleton className='w-full h-96'></Skeleton>
    )
}
