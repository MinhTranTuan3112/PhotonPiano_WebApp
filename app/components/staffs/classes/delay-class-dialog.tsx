import React, { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Await, Form, useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import GenericCombobox from '~/components/ui/generic-combobox';
import { Room } from '~/lib/types/room/room';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { fetchRooms } from '~/lib/services/rooms';
import { Input } from '~/components/ui/input';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActionResult } from '~/lib/types/action-result';
import { Controller } from 'react-hook-form';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { Level } from '~/lib/types/account/account';
import { Loader2 } from 'lucide-react';
import { LevelBadge } from '../table/student-columns';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    classId : string
}

const delayClassSchema = z.object({
    weeks: z.coerce.number().min(1, "Minimum is one week").max(52, "Maximum is 52 weeks"),
    classId : z.string(),
    action: z.string()
});

type DelayClassSchema = z.infer<typeof delayClassSchema>;
const resolver = zodResolver(delayClassSchema)

export default function DelayClassDialog({ isOpen, setIsOpen, classId }: Props) {
    // const [selectedRoomId, setSelectedRoomId] = useState<string>()
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();

    const fetcher = useFetcher<ActionResult>();

    const {
        handleSubmit,
        formState: { errors },
        register,
        control
    } = useRemixForm<DelayClassSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig: { action: '/endpoint/classes', method: 'POST', navigate: false },
        fetcher,
        defaultValues: {
            action: "DELAY",
            classId
        }
    });

    const { open: handleOpenAddModal, dialog: confirmModal } = useConfirmationDialog({
        title: 'Confirm delaying the class',
        description: 'Are you sure about this action?',
        onConfirm: handleSubmit
    })

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setIsOpen(false)
            setSearchParams([...searchParams])
        }
    })
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogContent className='min-w-[300px]'>
                <DialogHeader>
                    <DialogTitle>Delay Class</DialogTitle>
                </DialogHeader>
                <Form onSubmit={handleOpenAddModal}>
                    <div className='flex flex-row gap-8 items-center'>
                        {/* <div className='flex items-center'>Tên lớp</div>
                        <Input name='name' placeholder='Nhập tên lớp'/> */}
                        <Input {...register('weeks')} type='number'/>
                        <Label className='font-bold'>Week(s)</Label>
                    </div>
                    {
                        errors.weeks && errors.weeks.message && (
                            <div className='text-red-500'>
                                {errors.weeks.message}
                            </div>
                        )
                    }

                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow' variant={'theme'}>Proceed</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Cancel</Button>
                    </div>
                </Form>
                {confirmModal}
                {loadingDialog}
            </DialogContent>
        </Dialog>
    )
}