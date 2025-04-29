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
import { MultiSelect } from '~/components/ui/multi-select';
import { TriangleAlert } from 'lucide-react';
import { string, z } from 'zod';
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActionResult } from '~/lib/types/action-result';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { Level } from '~/lib/types/account/account';
import { addDays } from 'date-fns';


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string,
    slotsPerWeek: number,
    totalSlots: number,
    level: Level,
    classId: string
}


const daysOftheWeek = [
    { label: "Thứ 2", value: "0" },
    { label: "Thứ 3", value: "1" },
    { label: "Thứ 4", value: "2" },
    { label: "Thứ 5", value: "3" },
    { label: "Thứ 6", value: "4" },
    { label: "Thứ 7", value: "5" },
    { label: "Chủ Nhật", value: "6" },
]


export default function ArrangeScheduleClassDialog({ isOpen, setIsOpen, idToken, slotsPerWeek, totalSlots, level, classId }: Props) {
    const navigation = useNavigation();
    const fetcher = useFetcher<ActionResult>();
    const [searchParams, setSearchParams] = useSearchParams();

    const scheduleClassSchema = z.object({
        shift: z.string({ message: "Please pick a shift" }),
        startWeek: z
            .date()
            .refine((date: Date) => date.getDay() === 1, {
                message: "The choosen day must be monday",
            })
            .refine((date: Date) => date > addDays(new Date(), -1), {
                message: "Start week must be after today"
            }),
        dayOfWeeks: z.array(z.string()).min(slotsPerWeek, { message: `Must select ${slotsPerWeek} day(s) in the week` }),
        id: z.string(),
        idToken: z.string(),
        action: z.string()
    });

    type ScheduleClassSchema = z.infer<typeof scheduleClassSchema>;
    const resolver = zodResolver(scheduleClassSchema)

    const {
        handleSubmit,
        formState: { errors },
        control
    } = useRemixForm<ScheduleClassSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig: { action: '/endpoint/classes', method: 'POST', navigate: false },
        fetcher,
        defaultValues: {
            action: "SCHEDULE",
            id: classId,
            idToken: idToken
        }
    });

    const { open: handleOpenModal, dialog: confirmModal } = useConfirmationDialog({
        title: 'Confirm arrange class schedule',
        description: 'Are you sure about this action? This can not be rollbacked!.',
        onConfirm: () => {
            handleSubmit();
        }
    })

    const { loadingDialog } = useLoadingDialog({
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
                    <DialogTitle>Auto Scheduling</DialogTitle>
                </DialogHeader>
                <div>
                    <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center'>
                        <TriangleAlert size={100} />
                        <div>
                        The auto-scheduling process may fail due to schedule conflicts. If this happens, please select a different classroom, session, or start week.
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2 mt-4'>
                        <div>
                            <span className='mr-4 font-semibold'>Level : </span>
                            <span>{level.name.split('(')[0]}</span>
                        </div>
                        <div>
                            <span className='mr-4 font-semibold'>Slots per week: </span>
                            <span>{slotsPerWeek}</span>
                        </div>
                        <div>
                            <span className='mr-4 font-semibold'>Total slots: </span>
                            <span>{totalSlots}</span>
                        </div>
                    </div>
                </div>
                <Form onSubmit={handleSubmit}>
                    <div className='grid grid-cols-2 gap-4 mt-4'>
                        <div className='flex flex-col'>Start week<div className='italic text-sm'>(Please select monday)</div></div>
                        <div>
                            <Controller
                                control={control}
                                name='startWeek'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <DatePickerInput className='' value={value} onChange={onChange} onBlur={onBlur} ref={ref} />
                                )}
                            />
                            {errors.startWeek && <div className='text-red-500'>{errors.startWeek.message}</div>}
                        </div>
                        <div className='flex items-center'>Shift</div>
                        <div>
                            <Controller
                                control={control}
                                name='shift'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <Select onValueChange={onChange} value={value}>
                                        <SelectTrigger className="">
                                            <SelectValue placeholder="Pick a shift" />
                                        </SelectTrigger>
                                        <SelectGroup>
                                            <SelectContent>
                                                {
                                                    SHIFT_TIME.map((shift, index) => (
                                                        <SelectItem value={index.toString()} key={index}>Ca {index + 1} ({shift})</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </SelectGroup>
                                    </Select>
                                )}
                            />
                            {errors.shift && <div className='text-red-500'>{errors.shift.message}</div>}
                        </div>

                        <div className='flex flex-col'>Day Of Week<div className='italic text-sm'>(Please select {slotsPerWeek})</div></div>
                        <div>
                            <Controller
                                control={control}
                                name='dayOfWeeks'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <MultiSelect options={daysOftheWeek}
                                        value={value}
                                        placeholder='Day(s) of week'
                                        className='w-full'
                                        maxItems={slotsPerWeek}
                                        onValueChange={onChange} />
                                )}
                            />
                            {errors.dayOfWeeks && <div className='text-red-500'>{errors.dayOfWeeks.message}</div>}
                        </div>
                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow' type='submit'>Proceed</Button>
                        <Button className='flex-grow' type='button' variant={'outline'} onClick={() => setIsOpen(false)}>Cancel</Button>

                    </div>
                </Form>
                {loadingDialog}
                {confirmModal}
            </DialogContent>
        </Dialog>
    )
}