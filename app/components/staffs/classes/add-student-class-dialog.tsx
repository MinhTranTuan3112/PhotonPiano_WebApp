import React, { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Await, Form, useFetcher, useNavigation } from '@remix-run/react'
import { DatePickerInput } from '~/components/ui/date-picker-input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { SHIFT_TIME } from '~/lib/utils/constants';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Room } from '~/lib/types/room/room';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { fetchRooms } from '~/lib/services/rooms';
import { Button } from '~/components/ui/button';
import { Account } from '~/lib/types/account/account';
import { Skeleton } from '~/components/ui/skeleton';
import GenericDataTable from '~/components/ui/generic-data-table';
import { studentSimpleColumns } from '../table/student-simple-columns';


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    studentPromise: Promise<{ students : Account[], metadata : PaginationMetaData}>,

}

export default function AddStudentClassDialog({ isOpen, setIsOpen, studentPromise }: Props) {
    const navigation = useNavigation();

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
                </DialogHeader>
                <Suspense fallback={<LoadingDialog />}>
                    <Await resolve={studentPromise}>
                        {(data) => (
                            <GenericDataTable columns={studentSimpleColumns} metadata={data.metadata} resolvedData={data.students}/>
                        )}
                    </Await>
                </Suspense>
            </DialogContent>
        </Dialog>
    )
}
function LoadingDialog(){
    return (
        <Skeleton className='w-full h-96'></Skeleton>
    )
}