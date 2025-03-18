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
import { ActionResult } from '~/lib/types/action-result';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';


type Props = {
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    studentPromise: Promise<{ students: Account[], metadata: PaginationMetaData }>,
    classInfo: ClassDetail,
    idToken: string

}

export default function AddStudentClassDialog({ isOpen, setIsOpen, studentPromise, classInfo, idToken }: Props) {
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedRowIds, toggleRowSelection, clearSelection } = useSelection(classInfo.capacity - classInfo.studentNumber);
    const columns = getStudentSimpleColumns({ selectedRowIds, toggleRowSelection });
    const fetcher = useFetcher<ActionResult>()
    const [isAutoFill, setIsAutoFill] = useState(false)

    const handleRefresh = () => {
        setSearchParams({
            ...Object.fromEntries(searchParams.entries()),
            "page-students": "1",
            "q": ""
        })
        // clearSelection()
    }

    const { loadingDialog } = useLoadingDialog({
        fetcher: fetcher,
        action: () => {
            setIsOpen(false)
            clearSelection()
            setSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                studentClassDialog: "false",
            })
        }
    })

    const handleAdd = () => {
        console.log(selectedRowIds)
        fetcher.submit(
            {
                studentFirebaseIds: selectedRowIds,
                classId: classInfo.id,
                isAutoFill : isAutoFill,
                idToken
            },
            {
                method: "POST",
                action: "/api/add-students-to-class",
            }
        );
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

    const { open: handleOpenAddModel, dialog: confirmAddDialog } = useConfirmationDialog({
        title: 'Xác nhận thêm học viên',
        description: 'Bạn có chắc chắn muốn thêm các học viên này không?',
        onConfirm: () => {
            handleAdd();
        }
    })

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
                            <span>{classInfo.level.name.split('(')[0]}</span>
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
                    <div className='max-h-[28rem] overflow-y-auto mt-2'>
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
                    <div className='flex gap-2 items-center italic mt-2'>
                        <Checkbox checked={isAutoFill} onCheckedChange={() => setIsAutoFill(!isAutoFill)}></Checkbox> Phân bổ ngẫu nhiên để đủ sĩ số
                    </div>
                    <div className='flex gap-2 mt-2 '>
                        <Button onClick={handleOpenAddModel} Icon={PlusCircle} iconPlacement='left' className='w-full'>Xác nhận thêm</Button>
                    </div>
                </div>
                {confirmAddDialog}
                {loadingDialog}
            </DialogContent>
        </Dialog>
    )
}
function LoadingDialog() {
    return (
        <Skeleton className='w-full h-96'></Skeleton>
    )
}
