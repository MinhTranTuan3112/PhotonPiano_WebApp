import { zodResolver } from '@hookform/resolvers/zod'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { Delete, Import, Pencil, Save, Trash } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import ResultTable from '~/components/entrance-tests/result-table'
import { Button } from '~/components/ui/button'
import { DatePickerInput } from '~/components/ui/date-picker-input'
import GenericCombobox from '~/components/ui/generic-combobox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import { fetchAccounts } from '~/lib/services/account'
import { fetchAnEntranceTest, fetchUpdateEntranceTest } from '~/lib/services/entrance-tests'
import { fetchRooms } from '~/lib/services/rooms'
import { Account, Role } from '~/lib/types/account/account'
import { UpdateEntranceTestFormData, updateEntranceTestSchema } from '~/lib/types/entrance-test/entrance-test'
import { EntranceTestDetail } from '~/lib/types/entrance-test/entrance-test-detail'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { Room } from '~/lib/types/room/room'
import { requireAuth } from '~/lib/utils/auth'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from '~/lib/utils/constants'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { fetchAllMinimalCriterias } from '~/lib/services/criteria'
import { MinimalCriteria } from '~/lib/types/criteria/criteria'
import { useImportResultDialog } from '~/hooks/use-import-result-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

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

        if (!params.id) {
            return redirect('/staff/entrance-tests');
        }

        const id = params.id as string;

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect(role === Role.Instructor ? `/teacher/entrance-tests/${id}` : '/');
        }


        const promise = fetchAnEntranceTest({ id, idToken }).then((response) => {

            const entranceTestDetailsPromise: Promise<EntranceTestDetail> = response.data;

            return {
                entranceTestDetailsPromise
            }
        });

        const fetchCriteriasResponse = await fetchAllMinimalCriterias({ idToken });

        const criterias: MinimalCriteria[] = await fetchCriteriasResponse.data;

        return {
            promise,
            criterias,
            idToken,
            role,
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

export default function StaffEntranceTestDetailsPage({ }: Props) {

    const { promise, id } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Chi tiết ca thi</h1>
            <p className='text-muted-foreground'>Thông tin chung</p>
            <Suspense fallback={<LoadingSkeleton />} key={id}>
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
    roomId: true,
    isAnnouncedScore: true

}).extend({
    date: z.string().nonempty({ message: 'Ngày thi không được để trống.' })
});

type ServerUpdateEntranceTestFormData = z.infer<typeof serverSchema>;

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        if (!params.id) {
            return {
                success: false,
                error: 'Không có mã đợt thi',
            }
        }

        const id = params.id as string;

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect(role === Role.Instructor ? `/teacher/entrance-tests/${id}` : '/');
        }

        const { data, errors, receivedValues: defaultValues } =
            await getValidatedFormData<ServerUpdateEntranceTestFormData>(request, zodResolver(serverSchema));

        if (errors) {
            console.log({ errors });

            return { success: false, errors, defaultValues };
        }


        const updateRequest = {
            ...data,
            date: data.date.toString(),
            shift: parseInt(data.shift),
            id,
            instructorId: data.instructorId || undefined,
            idToken
        };
        const response = await fetchUpdateEntranceTest(updateRequest);

        return Response.json({
            success: response.status === 204
        }, {
            status: 200
        });

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        });

    }
}

const resolver = zodResolver(updateEntranceTestSchema);

function EntranceTestDetailsContent() {

    const { idToken, criterias } = useLoaderData<typeof loader>();

    const entranceTestValue = useAsyncValue();

    const entranceTest = entranceTestValue as EntranceTestDetail;

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { handleSubmit,
        formState: { errors },
        control,
        register,
        setValue: setFormValue,
        getValues: getFormValues
    } =
        useRemixForm<UpdateEntranceTestFormData>({
            mode: 'onSubmit',
            resolver,
            defaultValues: {
                name: entranceTest.name,
                shift: entranceTest.shift.toString(),
                instructorId: entranceTest.instructorId,
                isAnnouncedScore: entranceTest.isAnnouncedScore,
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

    const { handleOpen: handleOpenImportDialog, importResultDialog } = useImportResultDialog({
        criterias: criterias,
        entranceTestStudents: entranceTest.entranceTestStudents
    });

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
            }} navigate={false}>
            <div className='flex gap-2 items-center'>
                <Label className="w-32">
                    Tên bài thi
                </Label>
                <Input  {...register('name')} id="name" className="col-span-3"
                    placeholder='Nhập tên đợt thi...' readOnly={true}/>
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
                        name='roomId'
                        control={control}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <GenericCombobox<Room>
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

                                    return {
                                        data: response.data,
                                        metadata
                                    };
                                }}
                                mapItem={(item) => ({
                                    label: item?.name,
                                    value: item?.id
                                })}
                                placeholder='Chọn phòng thi'
                                emptyText='Không tìm thấy phòng thi.'
                                errorText='Lỗi khi tải danh sách phòng thi.'
                                value={value}
                                onChange={onChange}
                                maxItemsDisplay={10}
                            />
                        )}
                    />
                    {errors.roomId && <span className='text-red-500'>{errors.roomId.message}</span>}
                </div>
                <div className='flex gap-2 items-center'>
                    {/*Người gác thi */}
                    <Controller
                        control={control}
                        name='instructorId'
                        render={({ field: { value, onChange } }) => (
                            <GenericCombobox<Account>
                                queryKey='accounts'
                                fetcher={async (query) => {
                                    const response = await fetchAccounts({
                                        page: query.page,
                                        pageSize: query.pageSize,
                                        idToken,
                                        roles: [Role.Instructor]
                                    });

                                    const headers = response.headers;

                                    const metadata: PaginationMetaData = {
                                        page: parseInt(headers['x-page'] || '1'),
                                        pageSize: parseInt(headers['x-page-size'] || '10'),
                                        totalPages: parseInt(headers['x-total-pages'] || '1'),
                                        totalCount: parseInt(headers['x-total-count'] || '0'),
                                    };

                                    return {
                                        data: response.data,
                                        metadata
                                    };

                                }}
                                idToken={idToken}
                                mapItem={(item) => ({
                                    label: <div className="flex flex-row justify-center items-center">
                                        <Avatar className=''>
                                            <AvatarImage src={item.avatarUrl || "/images/noavatar.png"} alt="@shadcn" />
                                            <AvatarFallback>{item.fullName || item.email}</AvatarFallback>
                                        </Avatar>
                                        <span className='ml-2'>{item.fullName || item.email}</span>
                                    </div>,
                                    value: item?.accountFirebaseId
                                })}
                                placeholder='Chọn người gác thi'
                                emptyText='Không tìm thấy người gác thi.'
                                errorText='Lỗi khi tải danh sách người gác thi.'
                                maxItemsDisplay={10}
                                value={value || ''}
                                onChange={onChange}
                            />
                        )}
                    />
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
                    disabled={isSubmitting}
                    type='submit'>
                    <Save className='mr-4' />
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </div>
        </Form>
        <h1 className="text-xl font-extrabold mt-8">Danh sách học viên</h1>
        <p className='text-muted-foreground'>Danh sách học viên tham gia thi vào ca thi này</p>
        {/* <ScoreTable data={entranceTest.entranceTestStudents} className='my-8' /> */}

        <div className="my-8">
            <div className="flex justify-end">
                <Button type='button' variant={'outline'} onClick={handleOpenImportDialog}
                    Icon={Import} iconPlacement='left'>Nhập điểm qua file Excel</Button>
            </div>
            <ResultTable data={entranceTest.entranceTestStudents} />
        </div>


        {/* <DataTable columns={studentColumns} data={entranceTest.entranceTestStudents} /> */}
        <div className='flex flex-col md:flex-row justify-center gap-4'>
            {
                (entranceTest.status === 0 || entranceTest.status === 3) && entranceTest.registerStudents === 0 && (
                    <Button className='px-12' variant={"destructive"}>
                        <Trash className='mr-2' /> Xóa ca thi này
                    </Button>
                )
            }
            <PublishScoreSection isAnnouncedScore={entranceTest.isAnnouncedScore} id={entranceTest.id} />
        </div>

        {importResultDialog}
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

function PublishScoreSection({
    isAnnouncedScore,
    id
}: {
    isAnnouncedScore: boolean
    id: string,
}) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận công bố điểm số',
        description: 'Bạn có chắc chắn muốn công bố điểm số cho ca thi này không?',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('isAnnouncedScore', (!isAnnouncedScore).toString());
            fetcher.submit(formData, {
                action: '/publish-test-results',
                method: "POST"
            });
        }
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Công bố điểm số thành công!');
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
        <Button className={`font-bold px-12 ${isAnnouncedScore ? "bg-red-700" : "bg-gray-700"} `}
            type='button' onClick={handleOpenConfirmDialog} isLoading={isSubmitting} disabled={isSubmitting}>
            {
                isAnnouncedScore === true ? (
                    <>
                        <Delete className='mr-4'
                        />
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
        {confirmDialog}
    </>
}