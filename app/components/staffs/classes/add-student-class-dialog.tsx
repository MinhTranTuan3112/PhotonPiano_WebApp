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
    idToken: string,
    allowSkipLevel: boolean

}

export default function AddStudentClassDialog({ isOpen, setIsOpen, studentPromise, classInfo, idToken, allowSkipLevel }: Props) {
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedRowIds, toggleRowSelection, clearSelection } = useSelection(classInfo.capacity - classInfo.studentNumber);
    const columns = getStudentSimpleColumns({ selectedRowIds, toggleRowSelection });
    const fetcher = useFetcher<ActionResult>()
    const [isAutoFill, setIsAutoFill] = useState(false)
    const [isIncludeOther, setIsIncludeOther] = useState(false)

    const handleRefresh = () => {
        setSearchParams({
            ...Object.fromEntries(searchParams.entries()),
            "page-students": "1",
            "q": ""
        })
        // clearSelection()
    }

    const handleIncludeOther = () => {
        if (isIncludeOther) {
            setIsIncludeOther(false)
            setSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                "include-other": "false",
            })
        } else {
            setIsIncludeOther(true)
            setSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                "include-other": "true",
            })
        }
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
                isAutoFill: isAutoFill,
                idToken
            },
            {
                method: "POST",
                action: "/endpoint/add-students-to-class",
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
        title: 'Confirm add new learner(s)',
        description: 'Do you want to add these new learners to this class?',
        onConfirm: () => {
            handleAdd();
        }
    })
    console.log(allowSkipLevel)
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className='max-w-3xl'>
                <DialogHeader>
                    <DialogTitle>Add learners to the class</DialogTitle>
                </DialogHeader>
                <div>
                    <div className='flex place-content-between'>
                        <div className='flex gap-2'>
                            <span className='font-bold'>LEVEL : </span>
                            <span>{classInfo.level.name.split('(')[0]}</span>
                        </div>
                        <div className='flex gap-2'>
                            <span className='font-bold'>Max : </span>
                            <span>{classInfo.capacity}</span>
                        </div>
                    </div>
                    <div className='flex gap-2 mt-2 font-bold italic items-center'>
                        <TriangleAlert /> Can only add <span className='text-xl'>{classInfo.capacity - classInfo.studentNumber}</span> more learners
                    </div>
                    <div className='italic text-sm'>(Selected {selectedRowIds.length} / {classInfo.capacity - classInfo.studentNumber})</div>
                    <Form method='GET' onSubmit={handleSearch}>
                        <div className='mt-2 flex gap-2'>
                            <Button variant={'outline'} onClick={handleRefresh} type='button'><RefreshCcw /></Button>
                            <Input placeholder='Search...' name='name'></Input>
                            <Button Icon={Search} iconPlacement='left'>Search</Button>
                        </div>
                    </Form>
                    <div className='max-h-[24rem] overflow-y-auto mt-2'>
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
                    {
                        allowSkipLevel && (
                            <div className='flex gap-2 items-center italic mt-2'>
                                <Checkbox checked={isIncludeOther} onCheckedChange={() => handleIncludeOther()}></Checkbox>
                                Include other levels
                            </div>
                        )
                    }
                    <div className='flex gap-2 items-center italic mt-2'>
                        <Checkbox checked={isAutoFill} onCheckedChange={() => setIsAutoFill(!isAutoFill)}></Checkbox>
                        Randomly distribute to reach minimum class size
                    </div>
                    <div className='flex gap-2 mt-2 '>
                        <Button onClick={handleOpenAddModel} Icon={PlusCircle} iconPlacement='left' className='w-full'>Apply</Button>
                    </div>
                </div>

            </DialogContent>
            {confirmAddDialog}
            {loadingDialog}
        </Dialog>
    )
}
function LoadingDialog() {
    return (
        <Skeleton className='w-full h-96'></Skeleton>
    )
}
