import React, { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Await, Form, isRouteErrorResponse, useFetcher, useLocation, useNavigation, useRouteError } from '@remix-run/react'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { Account } from '~/lib/types/account/account';
import { Skeleton } from '~/components/ui/skeleton';
import GenericDataTable from '~/components/ui/generic-data-table';
import { getStudentSimpleColumns, useSelection } from '../table/student-simple-columns';


type Props = {
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    studentPromise: Promise<{ students: Account[], metadata: PaginationMetaData }>,

}

export default function AddStudentClassDialog({ isOpen, setIsOpen, studentPromise }: Props) {
    const navigation = useNavigation();
    const { selectedRowIds, toggleRowSelection } = useSelection(3);
    const columns = getStudentSimpleColumns({ selectedRowIds, toggleRowSelection });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
                </DialogHeader>
                <div className='max-h-[36rem] overflow-y-auto'>
                    <Suspense fallback={<LoadingDialog />}>
                        <Await resolve={studentPromise}>
                            {(data) => (
                                <GenericDataTable columns={columns} 
                                    metadata={data.metadata} 
                                    resolvedData={data.students}
                                    enableRefresh={false} 
                                    pageParamName='page-students'
                                    sizeParamName='size-students'/>
                            )}
                        </Await>
                    </Suspense>
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
