import React, { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Await, Form, useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import { DatePickerInput } from '~/components/ui/date-picker-input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { LEVEL, SHIFT_TIME } from '~/lib/utils/constants';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Room } from '~/lib/types/room/room';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { fetchRooms } from '~/lib/services/rooms';
import { Button } from '~/components/ui/button';
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


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string,
    levelPromise: Promise<Level[]>
}

const addClassSchema = z.object({
    level: z.string({ message: "Must pick a level" }),
    idToken: z.string(),
    action: z.string()
});

type AddSlotSchema = z.infer<typeof addClassSchema>;
const resolver = zodResolver(addClassSchema)

export default function AddClassDialog({ isOpen, setIsOpen, idToken, levelPromise }: Props) {
    // const [selectedRoomId, setSelectedRoomId] = useState<string>()
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();

    const fetcher = useFetcher<ActionResult>();

    const {
        handleSubmit,
        formState: { errors },
        control
    } = useRemixForm<AddSlotSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig: { action: '/endpoint/classes', method: 'POST', navigate: false },
        fetcher,
        defaultValues: {
            action: "ADD",
            idToken: idToken
        }
    });

    const { open: handleOpenAddModal, dialog: confirmAddModal } = useConfirmationDialog({
        title: 'Confirm adding new class',
        description: 'Are you sure about this action?',
        onConfirm: () => {
            handleSubmit();
        }
    })

    const { loadingDialog: loadingAddDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setIsOpen(false)
            setSearchParams([...searchParams])
        }
    })
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Add New Class</DialogTitle>
                </DialogHeader>
                <Form onSubmit={handleOpenAddModal}>
                    <div className='grid grid-cols-2 gap-4'>
                        {/* <div className='flex items-center'>Tên lớp</div>
                        <Input name='name' placeholder='Nhập tên lớp'/> */}
                        <div className='flex items-center'>Level</div>
                        <div>
                            <Controller
                                control={control}
                                name='level'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <div>
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="mt-2">
                                                <SelectValue placeholder="Pick a level" />
                                            </SelectTrigger>
                                            <SelectGroup>
                                                <SelectContent>
                                                    <Suspense fallback={<Loader2 className='animate-spin' />}>
                                                        <Await resolve={levelPromise}>
                                                            {(levels) =>
                                                                levels.map(l => (
                                                                    <SelectItem value={l.id} key={l.id}>{l.name.split('(')[0]}</SelectItem>
                                                                ))}
                                                        </Await>
                                                    </Suspense>
                                                </SelectContent>
                                            </SelectGroup>
                                        </Select>
                                        {errors.level && <div className='text-red-500'>{errors.level.message}</div>}
                                    </div>

                                )}
                            />

                        </div>
                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow'>Create Class</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Cancel</Button>

                    </div>
                </Form>
                {confirmAddModal}
                {loadingAddDialog}
            </DialogContent>
        </Dialog>
    )
}