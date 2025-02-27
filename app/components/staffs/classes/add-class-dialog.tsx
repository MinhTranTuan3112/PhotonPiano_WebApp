import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Form, useFetcher, useNavigation } from '@remix-run/react'
import { DatePickerInput } from '~/components/ui/date-picker-input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { LEVEL, SHIFT_TIME } from '~/lib/utils/constants';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Room } from '~/lib/types/room/room';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { fetchRooms } from '~/lib/services/rooms';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string
}

export default function AddClassDialog({ isOpen, setIsOpen, idToken }: Props) {
    // const [selectedRoomId, setSelectedRoomId] = useState<string>()
    const navigation = useNavigation();

    const isSubmitting = navigation.state === 'submitting';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Thêm lớp mới</DialogTitle>
                </DialogHeader>
                <Form method='POST' action={`/`}>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='flex items-center'>Tên lớp</div>
                        <Input name='name' placeholder='Nhập tên lớp'/>
                        <div className='flex items-center'>Level</div>
                        <div>
                            <Select>
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Chọn level" />
                                </SelectTrigger>
                                <SelectGroup>
                                    <SelectContent>
                                        {
                                            LEVEL.map((level, index) => (
                                                <SelectItem value={index.toString()} key={index}>LEVEL {index + 1} - ({level})</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </SelectGroup>
                            </Select>
                        </div>
                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow'>Tạo lớp học</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Hủy bỏ</Button>

                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    )
}