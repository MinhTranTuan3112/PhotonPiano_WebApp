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


type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string
}

export default function AddSlotDialog({ isOpen, setIsOpen, idToken }: Props) {
    const [selectedRoomId, setSelectedRoomId] = useState<string>()
    const navigation = useNavigation();

    const isSubmitting = navigation.state === 'submitting';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>Thêm buổi học mới</DialogTitle>
                </DialogHeader>
                <Form method='POST' action={`/`}>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='flex items-center'>Ngày học</div>
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
                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow'>Tạo buổi học</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Hủy bỏ</Button>

                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    )
}