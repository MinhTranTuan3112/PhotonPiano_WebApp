import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Form, useFetcher, useNavigation } from '@remix-run/react'
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


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string,
    slotsPerWeek : number,
    totalSlots : number,
    level : number
}
const daysOftheWeek = [
    {label : "Thứ 2",value : "0"},
    {label : "Thứ 3",value : "1"},
    {label : "Thứ 4",value : "2"},
    {label : "Thứ 5",value : "3"},
    {label : "Thứ 6",value : "4"},
    {label : "Thứ 7",value : "5"},
    {label : "Chủ Nhật",value : "6"},
]
export default function ArrangeScheduleClassDialog({ isOpen, setIsOpen, idToken, slotsPerWeek, totalSlots, level }: Props) {
    const [selectedRoomId, setSelectedRoomId] = useState<string>()
    const [selectedDaysOfTheWeek, setSelectedDaysOfTheWeek] = useState<string[]>()
    const navigation = useNavigation();

    const isSubmitting = navigation.state === 'submitting';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Trình xếp lịch auto vip pro max</DialogTitle>
                </DialogHeader>
                <div>
                    <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center'>
                        <TriangleAlert className='flex=grow' size={100}/>
                        <div>
                            Quá trình tự động xếp lịch có thể thất bại vì trùng lịch học. Nếu điều này xảy ra, vui lòng chọn phòng học, ca học hoặc tuần bắt đầu khác.
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2 mt-4'>
                        <div>
                            <span className='mr-4 font-semibold'>Level : </span>
                            <span>{level + 1}</span>
                        </div>
                        <div>
                            <span className='mr-4 font-semibold'>Số buổi 1 tuần : </span>
                            <span>{slotsPerWeek}</span>
                        </div>
                        <div>
                            <span className='mr-4 font-semibold'>Tổng số buổi học : </span>
                            <span>{totalSlots}</span>
                        </div>
                    </div>
                </div>
                <Form method='POST' action={`/`}>
                    <div className='grid grid-cols-2 gap-4 mt-4'>
                        <div className='flex flex-col'>Tuần bắt đầu<div className='italic text-sm'>(Vui lòng chỉ chọn thứ hai)</div></div>
                        <DatePickerInput className='' />
                        <div className='flex items-center'>Ca học</div>
                        <div>
                            <Select>
                                <SelectTrigger className="">
                                    <SelectValue placeholder="Chọn ca học" />
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
                        </div>
                        <div className='flex items-center'>Phòng học</div>
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
                            placeholder='Chọn phòng học'
                            emptyText='Không tìm thấy phòng học.'
                            errorText='Lỗi khi tải danh sách phòng học.'
                            value={selectedRoomId ?? undefined}
                            onChange={setSelectedRoomId}
                            maxItemsDisplay={10}
                        />
                        <div className='flex flex-col'>Ngày học<div className='italic text-sm'>(Vui lòng chọn {slotsPerWeek})</div></div>
                        <MultiSelect options={daysOftheWeek}
                            value={selectedDaysOfTheWeek}
                            placeholder='Ngày trong tuần'
                            className='w-full'
                            maxItems={slotsPerWeek}
                            onValueChange={setSelectedDaysOfTheWeek} />

                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow'>Hoàn Tất</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Hủy bỏ</Button>

                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    )
}