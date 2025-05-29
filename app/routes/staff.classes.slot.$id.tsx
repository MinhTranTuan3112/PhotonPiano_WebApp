import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, Link, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { ArrowLeftCircle, BookOpen, CalendarDays, CheckIcon, Clock, DoorClosed, Edit2Icon, Music, Trash, Users, XIcon } from 'lucide-react';
import { ReactNode, Suspense, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { DatePickerInput } from '~/components/ui/date-picker-input';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Textarea } from '~/components/ui/textarea';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { fetchAccounts } from '~/lib/services/account';
import { fetchRooms } from '~/lib/services/rooms';
import { fetchAvailableTeachersForSlot, fetchSlotById } from '~/lib/services/scheduler';
import { Account, Level, Role } from '~/lib/types/account/account';
import { ActionResult } from '~/lib/types/action-result';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { Room } from '~/lib/types/room/room';
import { SlotDetail, SlotStatus, TeacherModel } from '~/lib/types/Scheduler/slot';
import { requireAuth } from '~/lib/utils/auth';
import { ATTENDANCE_STATUS, SHIFT_TIME, SLOT_STATUS } from '~/lib/utils/constants';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import { toastWarning } from '~/lib/utils/toast-utils';


export async function loader({ params, request }: LoaderFunctionArgs) {
    const { idToken, role } = await requireAuth(request);
    if (role !== 4) {
        return redirect('/');
    }

    if (!params.id) {
        return redirect('/staff/classes');
    }

    const id = params.id as string;

    const slotPromise = fetchSlotById(params.id, idToken).then((response) => {
        const slot: SlotDetail = response.data;
        return { slot };
    });

    return { slotPromise, idToken, id };
}

export const addSlotSchema = z.object({
    shift: z.string().optional(),
    room: z.string().optional(),
    date: z.coerce.date({ message: 'Invalid Date.' }).optional(),
    action: z.string(),
    slotId: z.string(),
    reason: z.string().optional(),
    teacherId: z.string().optional(),
    idToken: z.string(),
});

export type AddSlotSchema = z.infer<typeof addSlotSchema>;
const resolver = zodResolver(addSlotSchema);

function LevelBadge({ level }: { level: Level }) {
    return (
        <div className="relative bg-white rounded-lg p-2 my-1">
            <div
                className="uppercase w-full text-center p-2 rounded-lg font-semibold transition-all duration-300 hover:scale-102"
                style={{
                    backgroundColor: `${level.themeColor}15`,
                    color: level.themeColor,
                    border: `1px solid ${level.themeColor}30`
                }}
            >
                {level.name}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: number }) {
    const getStatusStyle = (status: number) => {
        const styles = {
            0: "bg-neutral-100 text-neutral-600",
            1: "bg-emerald-100 text-emerald-600",
            2: "bg-blue-100 text-blue-600",
            3: "bg-red-100 text-red-600"
        };
        return styles[status as keyof typeof styles] || "bg-neutral-100 text-neutral-600";
    };

    return (
        <div className={`${getStatusStyle(status)} uppercase text-center my-1 p-2 rounded-lg font-semibold transition-all duration-300 hover:opacity-90`}>
            {SLOT_STATUS[status]}
        </div>
    );
}

function AttendanceDisplay({ attendance }: { attendance: number }) {
    const getAttendanceStyle = (attendance: number) => {
        const styles = {
            0: "border-neutral-200 text-neutral-600",
            1: "border-emerald-200 text-emerald-600",
            2: "border-red-200 text-red-600"
        };
        return styles[attendance as keyof typeof styles] || "border-neutral-200 text-neutral-600";
    };

    return (
        <Badge
            className={`${getAttendanceStyle(attendance)} font-semibold text-center px-4 py-1`}
            variant="outline"
        >
            {ATTENDANCE_STATUS[attendance]}
        </Badge>
    );
}

export default function StaffClassSlotDetail() {
    const { slotPromise, idToken, id } = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-neutral-50 py-8">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <Suspense
                        fallback={
                            <div className="p-8">
                                <Skeleton className="h-96 w-full rounded-xl" />
                            </div>
                        }
                    >
                        <Await resolve={slotPromise} key={id}>
                            {(data) => <SlotDetailComponent slot={data.slot} idToken={idToken} />}
                        </Await>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

function SlotDetailComponent({ slot, idToken }: { slot: SlotDetail; idToken: string }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const editFetcher = useFetcher<ActionResult>();
    const deleteFetcher = useFetcher<ActionResult>();
    const [isEdit, setIsEditing] = useState(false);
    const [isOpenConfirmEdit, setIsOpenConfirmEdit] = useState(false);

    const { loadingDialog: loadingEditDialog } = useLoadingDialog({
        fetcher: editFetcher,
        action: () => setSearchParams([...searchParams])
    });

    const { loadingDialog: loadingDeleteDialog } = useLoadingDialog({
        fetcher: deleteFetcher,
        action: () => navigate(`/staff/classes/${slot.classId}?tab=timeTable`)
    });

    const {
        handleSubmit,
        formState: { errors },
        register,
        control
    } = useRemixForm<AddSlotSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig: {
            action: '/endpoint/slots',
            method: 'POST',
            navigate: false
        },
        fetcher: editFetcher,
        defaultValues: {
            action: "EDIT",
            slotId: slot.id,
            idToken: idToken
        }
    });

    const handleEdit = () => handleSubmit();

    return (
        <div className="p-8 border-t-4 border-t-theme">
            <Form onSubmit={() => setIsOpenConfirmEdit(true)}>
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="hover:bg-neutral-50"
                    >
                        <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back
                    </Button>

                    <div className="flex gap-2">
                        {isEdit ? (
                            <>
                                <Button
                                    type="submit"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                >
                                    <CheckIcon className="mr-2 h-4 w-4" /> Save Changes
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    className="border-red-200 text-red-500 hover:bg-red-50"
                                >
                                    <XIcon className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                className="bg-theme hover:bg-theme text-white"
                                onClick={() => setIsEditing(true)}
                                disabled={slot.status !== SlotStatus.NotStarted}
                            >
                                <Edit2Icon className="mr-2 h-4 w-4" /> Edit Slot
                            </Button>
                        )}
                        <DeleteSlotSection slotId={slot.id} slotStatus={slot.status} classId={slot.classId} />
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center">
                            <Music className="mr-2 h-6 w-6 text-theme" />
                            Slot Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem
                                label="Date"
                                labelIcon={<CalendarDays className="h-5 w-5 text-theme" />}
                                value={
                                    isEdit ? (
                                        <div className="mt-2">
                                            <Controller
                                                control={control}
                                                name="date"
                                                defaultValue={new Date(slot.date)}
                                                render={({ field }) => (
                                                    <DatePickerInput
                                                        {...field}
                                                        placeholder="Select date"
                                                        className="w-full"
                                                    />
                                                )}
                                            />
                                            {errors.date && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.date.message}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-neutral-800">
                                            {formatRFC3339ToDisplayableDate(slot.date, false, false)}
                                        </p>
                                    )
                                }
                            />

                            <DetailItem
                                label="Shift"
                                labelIcon={<Clock className="h-5 w-5 text-theme" />}
                                value={
                                    isEdit ? (
                                        <div className="mt-2">
                                            <Controller
                                                control={control}
                                                name="shift"
                                                defaultValue={slot.shift.toString()}
                                                render={({ field }) => (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select shift" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {SHIFT_TIME.map((shift, index) => (
                                                                    <SelectItem
                                                                        key={index}
                                                                        value={index.toString()}
                                                                    >
                                                                        Shift {index + 1} ({shift})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.shift && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.shift.message}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-neutral-800">
                                            Shift {slot.shift + 1} ({SHIFT_TIME[slot.shift]})
                                        </p>
                                    )
                                }
                            />

                            <DetailItem
                                label="Room"
                                labelIcon={<DoorClosed className="h-5 w-5 text-theme" />}
                                value={
                                    isEdit ? (
                                        <div className="mt-2">
                                            <Controller
                                                control={control}
                                                name="room"
                                                defaultValue={slot.roomId ?? undefined}
                                                render={({ field }) => (
                                                    <GenericCombobox<Room>
                                                        className="w-full"
                                                        idToken={idToken}
                                                        queryKey="rooms"
                                                        fetcher={async (query) => {
                                                            const response = await fetchRooms(query);
                                                            const headers = response.headers;
                                                            const metadata: PaginationMetaData = {
                                                                page: parseInt(headers['x-page'] || '1'),
                                                                pageSize: parseInt(headers['x-page-size'] || '10'),
                                                                totalPages: parseInt(headers['x-total-pages'] || '1'),
                                                                totalCount: parseInt(headers['x-total-count'] || '0'),
                                                            };
                                                            return {
                                                                data: response.data as Room[],
                                                                metadata
                                                            };
                                                        }}
                                                        mapItem={(item) => ({
                                                            label: item?.name,
                                                            value: item?.id
                                                        })}
                                                        prechosenItem={slot.room}
                                                        placeholder="Select room"
                                                        emptyText="No rooms available"
                                                        errorText="Error loading rooms"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        maxItemsDisplay={10}
                                                    />
                                                )}
                                            />
                                            {errors.room && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.room.message}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-neutral-800">
                                            {slot.room?.name || 'Unassigned'}
                                        </p>
                                    )
                                }
                            />

                            <DetailItem
                                label="Status"
                                labelIcon={<Music className="h-5 w-5 text-theme" />}
                                value={<StatusBadge status={slot.status} />}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-neutral-800 mb-6 flex items-center">
                            <BookOpen className="mr-2 h-5 w-5 text-theme" />
                            Class Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem
                                label="Class Name"
                                value={
                                    <p className="text-lg font-medium text-neutral-800">
                                        {slot.class?.name || 'Unassigned'}
                                    </p>
                                }
                            />

                            <DetailItem
                                label="Teacher"
                                value={
                                    isEdit ? (
                                        <div className="mt-2">
                                            <Controller
                                                control={control}
                                                name="teacherId"
                                                defaultValue={slot.teacherId}
                                                render={({ field }) => (
                                                    <GenericCombobox<TeacherModel>
                                                        className="w-full"
                                                        idToken={idToken}
                                                        queryKey="teachers"
                                                        fetcher={async (query) => {
                                                            const response = await fetchAvailableTeachersForSlot(slot.id, query.idToken);
                                                            const headers = response.headers;
                                                            const metadata: PaginationMetaData = {
                                                                page: parseInt(headers['x-page'] || '1'),
                                                                pageSize: parseInt(headers['x-page-size'] || '10'),
                                                                totalPages: parseInt(headers['x-total-pages'] || '1'),
                                                                totalCount: parseInt(headers['x-total-count'] || '0'),
                                                            };

                                                            const data = await response.data as TeacherModel[];

                                                            const teachers = data.filter((teacher) => {
                                                                return teacher.accountFirebaseId !== slot.teacherId;
                                                            });

                                                            return {
                                                                data: teachers,
                                                                metadata
                                                            };
                                                        }}
                                                        mapItem={(item) => ({
                                                            label: item?.fullName || item?.userName,
                                                            value: item?.accountFirebaseId
                                                        })}
                                                        prechosenItem={slot.teacher}
                                                        placeholder="Select new teacher"
                                                        emptyText="No teachers available"
                                                        errorText="Error loading teachers"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        maxItemsDisplay={10}
                                                        hasPrechosenItemDisplay={false}
                                                    />
                                                )}
                                            />
                                        </div>
                                    ) : (
                                        slot.teacherId ? (
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/staff/teachers/${slot.class.instructorId}`}
                                                    className="text-lg text-theme hover:text-theme font-medium"
                                                >
                                                    {slot.teacher?.fullName || slot.teacher?.userName}
                                                </Link>
                                                {slot.teacherId !== slot.class.instructorId && (
                                                    <Badge variant="outline">Replacement</Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-lg font-medium text-neutral-800">
                                                Unassigned
                                            </p>
                                        )
                                    )
                                }
                            />

                            <DetailItem
                                label="Number of learners"
                                value={
                                    <p className="text-lg font-medium text-neutral-800">
                                        {slot.numberOfStudents} learners
                                    </p>
                                }
                            />

                            <DetailItem
                                label="Level"
                                value={<LevelBadge level={slot.class.level} />}
                            />
                        </div>
                    </div>

                    {slot.slotStudents && (
                        <div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-6 flex items-center">
                                <Users className="mr-2 h-5 w-5 text-theme" />
                                Attendance
                            </h3>

                            <div className="overflow-hidden rounded-xl border border-neutral-200 border-t-4 border-t-theme">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-neutral-50 border-b border-neutral-200">
                                            <th className="px-6 py-4 text-left text-sm font-medium text-neutral-500">
                                                No.
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-neutral-500">
                                                Learner
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-neutral-500">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-neutral-500">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slot.slotStudents.map((student, index) => (
                                            <tr
                                                key={student.studentFirebaseId}
                                                className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm text-neutral-600">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {student.studentAccount.avatarUrl && (
                                                            <img
                                                                src={student.studentAccount.avatarUrl}
                                                                alt=""
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-neutral-900">
                                                                {student.studentAccount.fullName ||
                                                                    student.studentAccount.userName ||
                                                                    'Unnamed Student'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-neutral-600">
                                                    {student.studentAccount.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <AttendanceDisplay
                                                            attendance={student.attendanceStatus}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </Form>

            <AlertDialog
                open={isOpenConfirmEdit}
                onOpenChange={setIsOpenConfirmEdit}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Slot</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for this change
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        {...register("reason")}
                        placeholder="Enter reason for change..."
                        className="min-h-[100px]"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEdit}
                            className="bg-theme hover:bg-theme"
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {loadingEditDialog}
            {loadingDeleteDialog}
        </div>
    );
}

function DeleteSlotSection({
    slotId,
    classId,
    slotStatus
}: {
    slotId: string;
    classId: string;
    slotStatus: SlotStatus;
}) {

    const fetcher = useFetcher<ActionResult>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm Deletion',
        description: 'Are you sure you want to delete this slot?',
        confirmText: 'Delete',
        confirmButtonClassname: 'bg-red-500 hover:bg-red-600',
        onConfirm: () => {
            const formData = new FormData();
            formData.append("action", "DELETE");
            formData.append("slotId", slotId);

            fetcher.submit(formData, {
                method: "POST",
                action: "/endpoint/slots"
            })
        }
    });

    const navigate = useNavigate()

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success("Slot deleted successfully");
            navigate(`/staff/classes/${classId}?tab=timeTable`)
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error, {
                position: 'top-center',
                duration: 5000
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);


    return <>
        <Button
            type="button"
            variant="destructive"
            onClick={handleOpenModal}
            isLoading={isSubmitting}
            disabled={isSubmitting || slotStatus !== SlotStatus.NotStarted}
        >
            <Trash className="mr-2 h-4 w-4" /> Delete Slot
        </Button>
        {confirmDialog}
    </>
}

function DetailItem({
    label,
    value,
    labelIcon
}: {
    label: string;
    value: ReactNode;
    labelIcon?: ReactNode
}) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 transition-all duration-300 hover:border-theme-200 hover:shadow-md">
            <div className="flex items-center gap-2 mb-2 ">
                {labelIcon}
                <h4 className="text-neutral-900 font-bold">{label}</h4>
            </div>
            <div className="mt-2">{value}</div>
        </div>
    );
}