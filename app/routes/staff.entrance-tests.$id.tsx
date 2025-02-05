import { zodResolver } from '@hookform/resolvers/zod'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { Delete, Lock, Pencil, Save, Trash, Unlock } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import ScoreTable from '~/components/entrance-tests/score-table'
import RoomsCombobox from '~/components/room/rooms-combobox'
import { Button } from '~/components/ui/button'
import { DatePickerInput } from '~/components/ui/date-picker-input'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import { fetchAnEntranceTest, fetchUpdateEntranceTest } from '~/lib/services/entrance-tests'
import { Role } from '~/lib/types/account/account'
import { UpdateEntranceTest, UpdateEntranceTestFormData, updateEntranceTestSchema } from '~/lib/types/entrance-test/entrance-test'
import { EntranceTestDetail } from '~/lib/types/entrance-test/entrance-test-detail'
import { requireAuth } from '~/lib/utils/auth'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from '~/lib/utils/constants'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'

type Props = {}

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-blue-500 font-semibold";
        case 2: return "text-gray-400 font-semibold";
        case 3: return "text-gray-400 font-semibold";
        default: return "text-black font-semibold";
    }
};

export async function loader({ request, params }: LoaderFunctionArgs) {

    try {

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        if (!params.id) {
            return redirect('/staff/entrance-tests');
        }

        const id = params.id as string;

        const promise = fetchAnEntranceTest({ id, idToken }).then((response) => {

            const entranceTestDetailsPromise: Promise<EntranceTestDetail> = response.data;

            return {
                entranceTestDetailsPromise
            }
        });

        return {
            promise,
            id
        }

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function StaffEntranceTestsPage({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Chi tiết ca thi</h1>
            <p className='text-muted-foreground'>Thông tin chung</p>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ entranceTestDetailsPromise }) => (
                        <Await resolve={entranceTestDetailsPromise}>
                            <EntranceTestDetailsContent />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article >
    )
}

const serverSchema = updateEntranceTestSchema.pick({
    name: true,
    shift: true,
    instructorId: true,
    roomId: true
}).extend({
    date: z.string().nonempty({ message: 'Ngày thi không được để trống.' })
});

type ServerUpdateEntranceTestFormData = z.infer<typeof serverSchema>;

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { data, errors, receivedValues: defaultValues } =
            await getValidatedFormData<ServerUpdateEntranceTestFormData>(request, zodResolver(serverSchema));

        if (errors) {
            console.log({ errors });

            return { success: false, errors, defaultValues };
        }

        if (!params.id) {
            return {
                success: false,
                error: 'Không có mã đợt thi',
            }
        }

        const id = params.id as string;

        const updateRequest = {
            ...data,
            date: data.date.toString(),
            shift: parseInt(data.shift),
            id,
            instructorId: data.instructorId || undefined,
            idToken
        };
        const response = await fetchUpdateEntranceTest(updateRequest);

        return {
            success: response.status === 204
        }

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
            status
        }
    }
}

const resolver = zodResolver(updateEntranceTestSchema);

function EntranceTestDetailsContent() {

    const entranceTestValue = useAsyncValue();

    const entranceTest = entranceTestValue as EntranceTestDetail;

    const fetcher = useFetcher<typeof action>();

    const { handleSubmit,
        formState: { errors, isSubmitting },
        control,
        register
    } =
        useRemixForm<UpdateEntranceTestFormData>({
            mode: 'onSubmit',
            resolver,
            defaultValues: {
                name: entranceTest.name,
                shift: entranceTest.shift.toString(),
                instructorId: entranceTest.instructorId,
                roomId: entranceTest.roomId,
                date: new Date(entranceTest.date)
            },
            fetcher
        });

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận cập nhật ca thi',
        description: 'Bạn có chắc chắn muốn cập nhật thông tin ca thi này không?',
        onConfirm: () => {
            handleSubmit();
        }
    })

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Cập nhật thông tin đợt thi thành công!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.error(fetcher.data.error, {
                position: 'top-center'
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);

    return <>
        <Form className='mt-4'
            method='POST'
            onSubmit={() => {
                handleOpenModal();
            }}>
            <div className='flex gap-2 items-center'>
                <Label className="w-32">
                    Tên bài thi
                </Label>
                <Input  {...register('name')} id="name" className="col-span-3"
                    placeholder='Nhập tên đợt thi...' />
                {errors.name && <span className='text-red-500'>{errors.name.message}</span>}
            </div>
            <div className='mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 w-full'>
                <div className='flex gap-2 items-center'>
                    <Label className="w-32">
                        Ca thi
                    </Label>
                    <Controller
                        control={control}
                        name='shift'
                        render={({ field: { value, onChange } }) => (
                            <Select value={value}
                                onValueChange={onChange}>
                                <SelectTrigger className='w-64'>
                                    <SelectValue placeholder="Chọn ca thi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {
                                            SHIFT_TIME.map((item, index) => (
                                                <SelectItem key={index} value={index.toString()}>Ca {index + 1} ({item})</SelectItem>
                                            ))
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.shift && <span className='text-red-500'>{errors.shift.message}</span>}
                </div>
                {/*Ngày thi */}
                <div className='flex gap-2 items-center'>
                    <Label className="w-32">
                        Ngày thi
                    </Label>
                    <Controller
                        control={control}
                        name='date'
                        render={({ field: { value, onChange, ref, onBlur } }) => (
                            <DatePickerInput
                                ref={ref}
                                onBlur={onBlur}
                                value={value}
                                onChange={onChange}
                                placeholder='Chọn ngày thi'
                                className='w-56'
                            />
                        )}
                    />
                    {errors.date && <span className='text-red-500'>{errors.date.message}</span>}
                </div>
                {/*Room */}
                <div className='flex gap-2 items-center '>
                    <Label className="w-32">
                        Phòng thi
                    </Label>
                    <Controller
                        control={control}
                        name='roomId'
                        render={({ field: { value, onChange } }) => (
                            <RoomsCombobox
                                value={value}
                                onChange={onChange}
                            />
                        )}
                    />
                    {errors.roomId && <span className='text-red-500'>{errors.roomId.message}</span>}
                </div>
                <div className='flex gap-2 items-center'>
                    {/*Người gác thi */}
                    {errors.instructorId && <span className='text-red-500'>{errors.instructorId.message}</span>}
                </div>
            </div>
            <div className='mt-4 grid grid-cols-1 lg:grid-cols-3'>
                <div className='flex gap-4'>
                    <span className='font-bold'>Sức chứa hiện tại :</span>
                    <span className=''>{entranceTest.roomCapacity}</span>
                </div>
                <div className='flex gap-4'>
                    <span className='font-bold'>Số học viên tham dự :</span>
                    <span className=''>{entranceTest.registerStudents}</span>
                </div>
                <div className='flex gap-4'>
                    <span className='font-bold'>Trạng thái :</span>
                    <span className={getStatusStyle(entranceTest.status)}>{ENTRANCE_TEST_STATUSES[entranceTest.status]}</span>
                </div>
            </div>
            <div className='mt-4 flex justify-end flex-wrap gap-4'>
                <Button className='font-bold px-12' isLoading={isSubmitting}
                    disabled={isSubmitting}>
                    <Save className='mr-4' />
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </div>
            <h1 className="text-xl font-extrabold mt-8">Danh sách học viên</h1>
            <p className='text-muted-foreground'>Danh sách học viên tham gia thi vào ca thi này</p>
            {/* <ScoreTable data={entranceTest.entranceTestStudents} className='my-8' /> */}
            {/* <DataTable columns={studentColumns} data={entranceTest.entranceTestStudents} /> */}
            <div className='flex flex-col md:flex-row justify-center gap-4'>
                {
                    entranceTest.isOpen ? (
                        <Button className='px-12'>
                            <Lock className='mr-2' /> Khóa ca thi này
                        </Button>
                    ) : (
                        <Button className='px-12'>
                            <Unlock className='mr-2' /> Mở khóa ca thi này
                        </Button>
                    )
                }
                {
                    (entranceTest.status === 0 || entranceTest.status === 3) && entranceTest.registerStudents === 0 && (
                        <Button className='px-12' variant={"destructive"}>
                            <Trash className='mr-2' /> Xóa ca thi này
                        </Button>
                    )
                }
                <Button className={`font-bold px-12 ${entranceTest.isAnnoucedScore ? "bg-red-700" : "bg-gray-700"} `}>
                    {
                        entranceTest.isAnnoucedScore ? (
                            <>
                                <Delete className='mr-4' />
                                Hủy công bố điểm số
                            </>
                        ) : (
                            <>
                                <Pencil className='mr-4' />
                                Công bố điểm số
                            </>
                        )
                    }
                </Button>
            </div>
        </Form>
        {confirmDialog}
    </>
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}


function ComboboxSkeleton() {
    return <div className="flex flex-col gap-2 justify-center items-center my-4">
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
    </div>
}