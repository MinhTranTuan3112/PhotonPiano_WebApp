import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { ArrowLeftCircle, CalendarDays, CheckIcon, Clock, DoorClosed, Edit2Icon, Music, Trash, XIcon } from 'lucide-react';
import React, { ReactNode, Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { DatePickerInput } from '~/components/ui/date-picker-input';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { fetchRooms } from '~/lib/services/rooms';
import { fetchSlotById } from '~/lib/services/scheduler';
import { ActionResult } from '~/lib/types/action-result';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { Room } from '~/lib/types/room/room';
import { SlotDetail } from '~/lib/types/Scheduler/slot';
import { requireAuth } from '~/lib/utils/auth';
import { ATTENDANCE_STATUS, CLASS_STATUS, LEVEL, SHIFT_TIME, SLOT_STATUS } from '~/lib/utils/constants';

type Props = {}

export async function loader({ params, request }: LoaderFunctionArgs) {

    const { idToken, role } = await requireAuth(request);

    if (role !== 4) {
        return redirect('/');
    }
    if (!params.id) {
        return redirect('/staff/classes')
    }

    const slotPromise = fetchSlotById(params.id, idToken).then((response) => {
        const slot: SlotDetail = response.data;
        return {
            slot,
        }
    });

    return {
        slotPromise, idToken
    }
}

export const addSlotSchema = z.object({
    shift: z.string().optional(),
    room: z.string().optional(),
    date: z.coerce.date({ message: 'Ngày không hợp lệ.' }).optional(),
    action: z.string(),
    slotId: z.string(),
    idToken: z.string(),
});


export type AddSlotSchema = z.infer<typeof addSlotSchema>;
const resolver = zodResolver(addSlotSchema)


const getLevelStyle = (level: number) => {
    switch (level) {
        case 0: return "text-[#92D808] bg-[#e2e8d5] font-semibold";
        case 1: return "text-[#FBDE00] bg-[#faf5d2] font-semibold";
        case 2: return "text-[#FBA000] bg-[#f5d193] font-semibold";
        case 3: return "text-[#fc4e03] bg-[#fcb292] font-semibold";
        case 4: return "text-[#ff0000] bg-[#faa7a7] font-semibold";
        default: return "text-black font-semibold";
    }
};

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-gray-500 bg-gray-200 font-semibold";
        case 1: return "text-green-500 bg-green-200 font-semibold";
        case 2: return "text-blue-400 bg-blue-200 font-semibold";
        case 3: return "text-red-400 bg-red-200 font-semibold";
        default: return "text-black font-semibold";
    }
};
const getAttendanceStyle = (attendance: number) => {
    switch (attendance) {
        case 0: return "text-gray-500";
        case 1: return "text-green-500";
        case 2: return "text-red-500";
        default: return "text-black";
    }
};
function LevelBadge({ level }: {
    level: number
}) {
    return <div className={`${getLevelStyle(level)} uppercase w-full text-center my-1 p-2 rounded-lg`}>LEVEL {level + 1} - {LEVEL[level]}</div>
}
function StatusBadge({ status }: {
    status: number
}) {
    return <div className={`${getStatusStyle(status)} uppercase w-full text-center my-1 p-2 rounded-lg`}>{SLOT_STATUS[status]}</div>
}
function AttendanceDisplay({ attendance }: {
    attendance: number
}) {
    return <div className={`${getAttendanceStyle(attendance)} font-bold text-center`}>
        {ATTENDANCE_STATUS[attendance]}
    </div>
}


export default function StaffClassSlotDetail() {
    const { slotPromise, idToken } = useLoaderData<typeof loader>();

    return (
        <div className='p-4'>

            <div className="p-6 bg-white shadow-lg rounded-lg">
                <Suspense fallback={<Skeleton className="text-center h-96 w-full">Loading slot details...</Skeleton>}>
                    <Await resolve={slotPromise}>
                        {(data) => (
                            <SlotDetailComponent slot={data.slot} idToken={idToken} />
                        )}
                    </Await>

                </Suspense>
            </div>
        </div>

    );
}

function SlotDetailComponent({ slot, idToken }: { slot: SlotDetail, idToken: string }) {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams();
    const editFetcher = useFetcher<ActionResult>();
    const deleteFetcher = useFetcher<ActionResult>();
    const [isEdit, setIsEditing] = useState(false)

    const { loadingDialog: loadingEditDialog } = useLoadingDialog({
        fetcher: editFetcher,
        action: () => {
            setSearchParams([...searchParams])
        }
    })
    const { loadingDialog: loadingDeleteDialog } = useLoadingDialog({
        fetcher: deleteFetcher,
        action: () => {
            navigate(`/staff/classes/${slot.classId}?tab=3`)
        }
    })

    const {
        handleSubmit,
        formState: { errors },
        control
    } = useRemixForm<AddSlotSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig: { action: '/api/slots', method: 'POST', navigate: false },
        fetcher: editFetcher,
        defaultValues: {
            action: "EDIT",
            slotId: slot.id,
            idToken: idToken
        }
    });

    const { open: handleOpenEditModal, dialog: confirmEditDialog } = useConfirmationDialog({
        title: 'Xác nhận sửa buổi học',
        description: 'Bạn có chắc chắn muốn sửa buổi học này không?',
        onConfirm: () => {
            handleSubmit();
        }
    })

    const { open: handleOpenDeleteModal, dialog: confirmDeleteDialog } = useConfirmationDialog({
        title: 'Xác nhận xóa buổi học',
        description: 'Bạn có chắc chắn muốn xóa buổi học này không?',
        onConfirm: () => {
            handleDelete();
        }
    })

    const handleDelete = () => {
        deleteFetcher.submit({
            action: "DELETE",
            slotId: slot.id,
            idToken: idToken
        }, {
            action: "/api/slots",
            method: "DELETE"
        })
    }

    return (
        <div>

            <Form onSubmit={handleOpenEditModal}>
                <div className='flex flex-col sm:flex-row place-content-between gap-2 mb-8'>
                    <Button type='button' variant={'outline'} onClick={() => navigate(-1)}><ArrowLeftCircle className='mr-4' /> Trở về</Button>
                    <div className='flex gap-2'>
                        {
                            isEdit ? (
                                <>
                                    <Button type='submit' className='bg-green-500 hover:bg-green-300'><CheckIcon className='mr-4' /> Lưu thay đổi</Button>
                                    <Button type='button' className='bg-red-400 hover:bg-red-200' onClick={() => setIsEditing(false)}><XIcon className='mr-4' /> Hủy thay đổi</Button>
                                </>
                            ) : (
                                <Button type='button' variant={'theme'} onClick={() => setIsEditing(true)}><Edit2Icon className='mr-4' /> Chỉnh sửa buổi học</Button>
                            )
                        }
                        <Button type='button' variant={'destructive'} onClick={handleOpenDeleteModal}><Trash className='mr-4' /> Xóa buổi học</Button>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Chi tiết buổi học</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <DetailItem label="Ngày" labelIcon={<CalendarDays />} value={
                        isEdit ? (
                            <>
                                <Controller
                                    control={control}
                                    name='date'
                                    defaultValue={new Date(slot.date)}
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <DatePickerInput value={value} onChange={onChange}
                                            ref={ref}
                                            onBlur={onBlur}
                                            placeholder='Ngày học'
                                            className='mt-2 w-64' />
                                    )}
                                />
                                {errors.date && <div className='text-red-500'>{errors.date.message}</div>}
                            </>
                        ) : (
                            <p className="text-lg font-medium text-gray-800">{slot.date}</p>
                        )
                    } />
                    <DetailItem label="Ca học" labelIcon={<Clock />} value={
                        isEdit ? (
                            <>
                                <Controller
                                    control={control}
                                    name='shift'
                                    defaultValue={slot.shift.toString()}
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <Select onValueChange={onChange} value={value}>
                                            <SelectTrigger className="w-64 mt-2">
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
                                    )}
                                />
                                {errors.shift && <div className='text-red-500'>{errors.shift.message}</div>}
                            </>

                        ) : (
                            <p className="text-lg font-medium text-gray-800">{`Ca ${slot.shift + 1} (${SHIFT_TIME[slot.shift]})`}</p>
                        )
                    } />
                    <DetailItem label="Phòng học" labelIcon={<DoorClosed />} value={
                        isEdit ? (
                            <>
                                <Controller
                                    control={control}
                                    name='room'
                                    defaultValue={slot.roomId ?? undefined}
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <GenericCombobox<Room>
                                            className='mt-2 w-64'
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
                                            prechosenItem={slot.room}
                                            placeholder='Chọn phòng học'
                                            emptyText='Không tìm thấy phòng học.'
                                            errorText='Lỗi khi tải danh sách phòng học.'
                                            value={value}
                                            onChange={onChange}
                                            maxItemsDisplay={10}
                                        />
                                    )}
                                />
                                {errors.room && <div className='text-red-500'>{errors.room.message}</div>}
                            </>
                        ) : (
                            <p className="text-lg font-medium text-gray-800">{slot.room?.name || 'Unassigned'}</p>

                        )
                    } />
                    <DetailItem label="Trạng thái" labelIcon={<Music />} value={<StatusBadge status={slot.status} />} />
                </div>
            </Form>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Thông tin lớp</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <DetailItem label="Tên lớp" value={<p className="text-lg font-medium text-gray-800">{slot.class?.name || 'Chưa có lớp'}</p>} />
                <DetailItem label="Giảng viên" value={<p className="text-lg font-medium text-gray-800">{slot.class?.instructorName || 'Chưa có giảng viên'}</p>} />
                <DetailItem label="Sĩ số" value={<p className="text-lg font-medium text-gray-800">{slot.numberOfStudents.toString()}</p>} />
                <DetailItem label="Level" value={<LevelBadge level={slot.class.level} />} />
            </div>

            {slot.slotStudents && (
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Điểm danh buổi học</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="text-left p-3">STT</th>
                                    <th className="text-left p-3">Học viên</th>
                                    <th className="text-left p-3">Email</th>
                                    <th className="text-center p-3">TT Điểm danh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slot.slotStudents.map((student, index) => (
                                    <tr key={student.studentFirebaseId} className="border-b">
                                        <td className='p-3'>{index + 1}</td>
                                        <td className="p-3 flex items-center gap-2">
                                            {student.studentAccount.avatarUrl && (
                                                <img src={student.studentAccount.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                                            )}
                                            {student.studentAccount.userName || student.studentAccount.fullName || 'Không xác định'}
                                        </td>
                                        <td className="p-3">{student.studentAccount.email}</td>
                                        <td className="p-3">
                                            <AttendanceDisplay attendance={student.attendanceStatus} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {loadingDeleteDialog}
            {loadingEditDialog}
            {confirmDeleteDialog}
            {confirmEditDialog}
        </div>
    );
}

function DetailItem({ label, value, labelIcon }: { label: string; value: ReactNode, labelIcon?: ReactNode }) {


    return (
        <div className="bg-gray-100 p-4 rounded-lg">
            <div className='flex gap-2 items-center'>
                {labelIcon}
                <p className="text-sm text-gray-500">{label}</p>
            </div>
            {value}
        </div>
    );
}
