import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Form, useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import { DatePickerInput } from '~/components/ui/date-picker-input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { SHIFT_TIME } from '~/lib/utils/constants';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Room } from '~/lib/types/room/room';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { fetchRooms } from '~/lib/services/rooms';
import { Button } from '~/components/ui/button';
import { ActionResult } from '~/lib/types/action-result';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { ActionFunctionArgs } from '@remix-run/node';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Controller } from 'react-hook-form';


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string,
    classId: string
}

export const addSlotSchema = z.object({
    shift: z.string({message : "Please select a shift"}),
    room: z.string({message : "Please select a room"}),
    date: z.coerce.date({ message: 'Invalid date.' }),
    action : z.string(),
    classId : z.string(),
    idToken : z.string(),
});


export type AddSlotSchema = z.infer<typeof addSlotSchema>;
const resolver = zodResolver(addSlotSchema)

export default function AddSlotDialog({ isOpen, setIsOpen, idToken, classId }: Props) {
    const [selectedRoomId, setSelectedRoomId] = useState<string>()
    const [searchParams, setSearchParams] = useSearchParams();
    const navigation = useNavigation();
    const fetcher = useFetcher<ActionResult>();

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setIsOpen(false)
            setSearchParams([...searchParams])
        }
    })
    
    const {
        handleSubmit,
        formState: { errors },
        control
    } = useRemixForm<AddSlotSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig : {action : '/endpoint/slots', method : 'POST', navigate : false},
        fetcher,
        defaultValues : {
            action : "ADD",
            classId : classId,
            idToken : idToken
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Add New Slot</DialogTitle>
                </DialogHeader>
                {/* {errors.action && <div className='text-red-500'>{errors.action.message}</div>}
                {errors.classId && <div className='text-red-500'>{errors.classId.message}</div>}
                {errors.idToken && <div className='text-red-500'>{errors.idToken.message}</div>} */}

                <Form method='POST' onSubmit={handleSubmit} >
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='flex items-center'>Date</div>
                        <div>
                            <Controller
                                control={control}
                                name='date'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <DatePickerInput value={value} onChange={onChange}
                                        ref={ref}
                                        onBlur={onBlur}
                                        className='w-full'
                                        placeholder='Date' />
                                )}
                            />
                            {errors.date && <div className='text-red-500'>{errors.date.message}</div>}
                        </div>

                        <div className='flex items-center'>Shift</div>
                        <div>
                            <Controller
                                control={control}
                                name='shift'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <Select name='shift' value={value} onValueChange={onChange}>
                                        <SelectTrigger className="">
                                            <SelectValue placeholder="Pick a shift" />
                                        </SelectTrigger>
                                        <SelectGroup>
                                            <SelectContent>
                                                {
                                                    SHIFT_TIME.map((shift, index) => (
                                                        <SelectItem value={index.toString()} key={index}>Shift {index + 1} ({shift})</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </SelectGroup>
                                    </Select>
                                )}
                            />

                            {errors.shift && <div className='text-red-500'>{errors.shift.message}</div>}

                        </div>
                        {/* <input type='hidden' name='roomId' value={selectedRoomId}></input> */}
                        <div className='flex items-center'>Room</div>
                        <div>
                            <Controller
                                control={control}
                                name='room'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <GenericCombobox<Room>
                                        className=''
                                        idToken={idToken}
                                        queryKey='rooms'
                                        fetcher={async (query) => {
                                            const response = await fetchRooms(query);

                                            const headers = response.headers;

                                            const metadata: PaginationMetaData = {
                                                page: parseInt(headers['x-page'] || '1'),
                                                pageSize: parseInt(headers['x-page-size'] || '10'),
                                                totalPages: parseInt(headers['x-total-pages'] || '1'),
                                                totalCount: parseInt(headers['x-total-count'] || '0'),
                                            };

                                            const data = response.data as Room[]

                                            return {
                                                data: data,
                                                metadata
                                            };
                                        }}
                                        mapItem={(item) => ({
                                            label: item?.name,
                                            value: item?.id
                                        })}
                                        placeholder='Pick a Room'
                                        emptyText='Can not find any rooms.'
                                        errorText='Error loading room list.'
                                        value={value}
                                        onChange={onChange}
                                        maxItemsDisplay={10}
                                    />
                                )}
                            />
                            {errors.room && <div className='text-red-500'>{errors.room.message}</div>}
                        </div>
                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow' type='submit'>Create Slot</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Cancel</Button>

                    </div>
                </Form>
                {loadingDialog}
            </DialogContent>
        </Dialog>
    )
}