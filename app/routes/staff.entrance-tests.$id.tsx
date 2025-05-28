import { zodResolver } from '@hookform/resolvers/zod'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, FetcherWithComponents, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { AlertTriangle, Calendar, CirclePlus, Clock, Delete, Edit2Icon, Import, Mail, MapPin, Phone, Piano, Trash, User, XIcon } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import ResultTable from '~/components/entrance-tests/result-table'
import { Button } from '~/components/ui/button'
import { DatePickerInput } from '~/components/ui/date-picker-input'
import GenericCombobox from '~/components/ui/generic-combobox'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import { fetchAccounts } from '~/lib/services/account'
import { fetchAnEntranceTest, fetchUpdateEntranceTest } from '~/lib/services/entrance-tests'
import { fetchRooms } from '~/lib/services/rooms'
import { Account, Role } from '~/lib/types/account/account'
import { EntranceTestStatus, UpdateEntranceTestFormData, updateEntranceTestSchema } from '~/lib/types/entrance-test/entrance-test'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime'
import { useStudentListDialog } from '~/hooks/use-student-list-dialog'
import { action as addStudentsToTestAction } from '~/routes/add-students-to-test';
import { getEntranceTestName } from './staff.entrance-tests.create'
import { toastWarning } from '~/lib/utils/toast-utils'
import { ActionResult } from '~/lib/types/action-result'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import NoInformation from '~/components/common/no-information'
import TestStatusAnnotation from '~/components/common/test-status-annotation'

type Props = {}

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 bg-green-200 font-semibold";
        case 1: return "text-blue-500 bg-blue-200 font-semibold";
        case 2: return "text-gray-500 bg-gray-200 font-semibold";
        case 3: return "text-gray-500 bg-gray-200 font-semibold";
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

        const { searchParams } = new URL(request.url);

        const tab = (searchParams.get('tab') || 'general')

        const promise = fetchAnEntranceTest({ id, idToken }).then((response) => {

            const entranceTestDetailsPromise: Promise<EntranceTestDetail> = response.data;

            return {
                entranceTestDetailsPromise,
            }
        });

        const fetchCriteriasResponse = await fetchAllMinimalCriterias({ idToken });

        const criterias: MinimalCriteria[] = await fetchCriteriasResponse.data;

        return {
            promise,
            criterias,
            idToken,
            tab,
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

    const { promise, id, ...data } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Update test successfully!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                position: 'top-center',
                duration: 5000
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);

    return (
        <article className='px-10'>
            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ entranceTestDetailsPromise }) => (
                        <Await resolve={entranceTestDetailsPromise}>
                            <EntranceTestDetailsContent fetcher={fetcher} {...data} />
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
}).extend({
    date: z.coerce.date({ message: 'Test date cannot be empty.' })
}).partial();

type ServerUpdateEntranceTestFormData = z.infer<typeof serverSchema>;

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        if (!params.id) {
            return {
                success: false,
                error: 'No test id found',
            }
        }

        const id = params.id as string;

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect(role === Role.Instructor ? `/teacher/entrance-tests/${id}` : '/');
        }

        const { data, errors, receivedValues: defaultValues } =
            await getValidatedFormData<ServerUpdateEntranceTestFormData>(request, zodResolver(serverSchema));

        console.log({ data });

        if (errors) {
            console.log({ errors });

            return { success: false, errors, defaultValues };
        }

        const updateRequest = {
            ...data,
            date: data.date ? data.date.toISOString().split('T')[0] : undefined,
            shift: data.shift ? parseInt(data.shift) : undefined,
            id,
            instructorId: data.instructorId || undefined,
            idToken
        };

        console.log({ updateRequest });

        const response = await fetchUpdateEntranceTest(updateRequest);

        return Response.json({
            success: true
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

function StatusBadge({ status }: {
    status: number
}) {
    return <div className={`${getStatusStyle(status)} uppercase text-center my-1 p-2 rounded-lg`}>{ENTRANCE_TEST_STATUSES[status]}</div>
}

const resolver = zodResolver(updateEntranceTestSchema);

export function EntranceTestDetailsContent({
    fetcher, tab, idToken, criterias, role,
}: {
    fetcher: FetcherWithComponents<any>;
    tab: string;
    idToken: string;
    criterias: MinimalCriteria[];
    role: Role;
}) {

    const entranceTest = useAsyncValue() as EntranceTestDetail;

    return <>
        <div className="flex flex-row justify-between items-center w-full">
            <div className="">
                <h1 className="text-xl font-bold text-theme flex flex-row gap-1 items-center"><Piano className='size-5' /> Piano test details information</h1>
                <p className='text-sm mb-4 text-theme/60'>
                    Manage information about the time, exam room and score table, list of learners.
                </p>
            </div>
            <div className="flex flex-row gap-3">
                <StatusBadge status={entranceTest.testStatus} />
                <div className={`uppercase text-center my-1 p-2 rounded-lg ${entranceTest.isAnnouncedScore ? 'text-green-500 bg-green-200 font-semibold' : 'text-gray-500 bg-gray-200 font-semibold'}`}>
                    {entranceTest.isAnnouncedScore ? 'Score published' : 'Score not published'}
                </div>
            </div>
        </div>
        <Tabs defaultValue='general' className="">
            <TabsList className="grid w-full grid-cols-2 my-4 p-0 h-auto bg-background gap-1">
                <TabsTrigger value="general" className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>Basic information</TabsTrigger>
                <TabsTrigger value="students" className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>Learners</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
                <Card className='border-t-4 border-t-theme'>
                    <CardHeader>
                        <CardTitle>Basic information</CardTitle>
                        <CardDescription>
                            Basic information about the test.
                        </CardDescription>
                    </CardHeader>
                    <EntranceTestForm fetcher={fetcher} idToken={idToken} role={role} {...entranceTest} />
                </Card>
            </TabsContent>
            <TabsContent value="students">
                <StudentsSection entranceTest={entranceTest} criterias={criterias} role={role}
                    idToken={idToken} />
            </TabsContent>
        </Tabs>
        {role === Role.Staff && <DeleteEntranceTestSection entranceTest={entranceTest} />}
        <TestStatusAnnotation />
    </>
}

export function EntranceTestForm({
    fetcher, idToken, role, ...defaultData
}: {
    role: Role;
    fetcher: FetcherWithComponents<any>;
    idToken: string;
} & EntranceTestDetail) {

    const isSubmitting = fetcher.state === 'submitting';

    const { handleSubmit,
        formState: { errors },
        control,
        register,
        setValue: setFormValue,
        getValues: getFormValues,
        watch
    } =
        useRemixForm<UpdateEntranceTestFormData>({
            mode: 'onSubmit',
            resolver,
            defaultValues: {
                name: defaultData.name,
                shift: defaultData.shift.toString(),
                instructorId: defaultData.instructorId,
                isAnnouncedScore: defaultData.isAnnouncedScore,
                roomId: defaultData.roomId,
                roomName: defaultData.room?.name || '',
                date: new Date(defaultData.date)
            },
            fetcher
        });

    const { open: handleOpenEntranceTestUpdateDialog, dialog: entranceTestConfirmDialog } = useConfirmationDialog({
        title: 'Confirm update entrance test',
        description: 'Are you sure you want to update this entrance test?',
        onConfirm: () => {
            setFormValue('isAnnouncedScore', undefined);
            handleSubmit();
        }
    });

    const { date: testDate, shift: testShift, roomId, instructorId, roomName } = watch();

    const [isEdit, setIsEdit] = useState(false);

    return <>
        <Form className='mt-4'
            method='POST' navigate={false}>
            <CardContent className="space-y-2">
                {role === Role.Staff && <div className="flex justify-end mb-3 space-y-2">
                    {
                        isEdit ? (
                            <>
                                <Button variant={'destructive'} type="button" onClick={() => setIsEdit(false)}
                                    Icon={XIcon} iconPlacement='left'>
                                    Cancel changes
                                </Button>
                            </>
                        ) : (
                            <Button variant={'theme'} onClick={() => setIsEdit(true)} type="button"
                                Icon={Edit2Icon} iconPlacement='left'
                                disabled={defaultData.testStatus === EntranceTestStatus.Ended}>Edit
                            </Button>
                        )
                    }
                </div>}
                <div className="grid grid-cols-2 gap-7">
                    <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold">Name: <span className='text-red-600'>*</span></span>
                        {
                            isEdit ? (
                                <div >
                                    <Input  {...register('name')} id="name" className="col-span-3"
                                        placeholder='Test name...' readOnly={true} />
                                </div>
                            ) : (
                                <p className="text-gray-900">{defaultData.name}</p>
                            )
                        }
                        {errors.name && <span className='text-red-500'>{errors.name.message}</span>}
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold flex flex-row items-center gap-1"><Clock className='text-theme size-4' /> Shift: <span className='text-red-600'>*</span></span>
                        {
                            isEdit ? (
                                <Controller
                                    control={control}
                                    name='shift'
                                    render={({ field: { value, onChange } }) => (
                                        <Select value={value}
                                            onValueChange={(value) => {
                                                onChange(value);
                                                setFormValue('name', getEntranceTestName({
                                                    date: testDate,
                                                    roomName,
                                                    shift: parseInt(testShift)
                                                }));
                                            }}>
                                            <SelectTrigger className='w-64'>
                                                <SelectValue placeholder="Select shift" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {
                                                        SHIFT_TIME.map((item, index) => (
                                                            <SelectItem key={index} value={index.toString()}>Shift {index + 1} ({item})</SelectItem>
                                                        ))
                                                    }
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            ) : (
                                <p className="text-gray-900">{`Shift ${defaultData.shift + 1}: ${SHIFT_TIME[defaultData.shift]}`}</p>
                            )
                        }
                        {errors.shift && <span className='text-red-500'>{errors.shift.message}</span>}
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold flex flex-row gap-1 items-center"><Calendar className='text-theme size-4' /> Test date: <span className='text-red-600'>*</span></span>
                        {
                            isEdit ? (
                                <Controller
                                    control={control}
                                    name='date'
                                    render={({ field: { value, onChange, ref, onBlur } }) => (
                                        <DatePickerInput
                                            ref={ref}
                                            onBlur={onBlur}
                                            value={value}
                                            onChange={(newDate) => {
                                                onChange(newDate);
                                                setFormValue('name', getEntranceTestName({
                                                    date: newDate as Date,
                                                    roomName,
                                                    shift: parseInt(testShift)
                                                }));
                                            }}
                                            placeholder='Select test date'
                                            className='w-full'
                                        />
                                    )}
                                />
                            ) : (
                                <p className="text-gray-900">{formatRFC3339ToDisplayableDate(defaultData.date, false, false)}</p>
                            )
                        }
                        {errors.date && <span className='text-red-500'>{errors.date.message}</span>}
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold flex flex-row gap-1 items-center"><MapPin className='text-theme size-4' /> Room: <span className='text-red-600'>*</span></span>
                        {
                            isEdit ? (
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
                                            onItemChange={(room) => {
                                                setFormValue('roomName', room?.name || '');
                                                setFormValue('name', getEntranceTestName({
                                                    date: testDate,
                                                    roomName: room.name || '',
                                                    shift: parseInt(testShift)
                                                }));
                                            }}
                                            placeholder='Select room'
                                            emptyText='No rooms found.'
                                            errorText='Error loading rooms.'
                                            value={value}
                                            onChange={onChange}
                                            maxItemsDisplay={10}
                                        />
                                    )}
                                />
                            ) : (
                                <p className="text-gray-900">{defaultData.room?.name}</p>
                            )
                        }
                        {errors.roomId && <span className='text-red-500'>{errors.roomId.message}</span>}
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold flex flex-row gap-1 items-center"><User className='text-theme size-4' /> Teacher: <span className='text-red-600'>*</span></span>
                        {
                            isEdit ? (
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

                                                const data = await response.data as Account[];

                                                const filteredData = data.filter((item) => item.accountFirebaseId !== defaultData.instructorId);

                                                return {
                                                    data: filteredData,
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
                                            placeholder='Select teacher'
                                            emptyText='No teachers found.'
                                            errorText='Error loading instructors.'
                                            maxItemsDisplay={10}
                                            value={value || ''}
                                            onChange={(value) => {
                                                onChange(value);
                                            }}
                                            prechosenItem={defaultData.instructor}
                                            hasPrechosenItemDisplay={false}
                                        />
                                    )}
                                />
                            ) : (
                                // <p className="text-gray-900">{defaultData.instructor?.fullName || defaultData.instructor?.email}</p>
                                <div className="flex flex-col gap-2">
                                    {defaultData.instructor?.fullName || defaultData.instructor?.email}
                                    <div className="flex flex-row justify-between">
                                        <div className="flex flex-row gap-2 items-center">
                                            <Mail className='text-theme size-5' />
                                            <span className="italic">{defaultData.instructor?.email}</span>
                                        </div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <Phone className='text-theme size-5' />
                                            {defaultData.instructor?.phone || <NoInformation />}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        {errors.instructorId && <span className='text-red-500'>{errors.instructorId.message}</span>}
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold">Status: </span>
                        <div className="">
                            <StatusBadge status={defaultData.testStatus} />
                        </div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg col-start-2 border-l-4 border-l-theme">
                        <span className="text-gray-700 font-bold">Number of learners: </span>
                        <p className="text-gray-900">{defaultData.entranceTestStudents.length}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className='mt-4 flex justify-end w-full'>
                {isEdit && <Button className='font-bold px-12' isLoading={isSubmitting}
                    disabled={isSubmitting}
                    type='button' variant={'theme'} onClick={handleOpenEntranceTestUpdateDialog}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>}
            </CardFooter>
        </Form>
        {entranceTestConfirmDialog}
    </>
}

function StudentsSection({
    entranceTest,
    criterias,
    role,
    idToken
}: {
    entranceTest: EntranceTestDetail,
    criterias: MinimalCriteria[],
    role: Role;
    idToken: string;
}) {

    const { handleOpen: handleOpenImportDialog, importResultDialog } = useImportResultDialog({
        criterias: criterias,
        entranceTestStudents: entranceTest.entranceTestStudents,
        role
    });

    const fetcher = useFetcher<typeof addStudentsToTestAction>();

    const isSubmitting = fetcher.state === 'submitting';

    const { handleOpen: handleOpenStudentListDialog, studentsListDialog } = useStudentListDialog({
        entranceTest,
        idToken,
        onStudentsAdded: (students) => {
            const formData = new FormData();

            students.forEach((student) => {
                formData.append('studentIds', student.accountFirebaseId);
            })

            formData.append('entranceTestId', entranceTest.id);

            fetcher.submit(formData, {
                action: '/add-students-to-test',
                method: "POST"
            });
        }
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Add success!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return <>
        <Card className="border-t-4 border-t-theme">
            <CardHeader>
                <CardTitle>Learners list</CardTitle>
                <CardDescription>Learners in test.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="my-8">
                    <div className="flex flex-row justify-between items-center">
                        {role === Role.Staff && <div className="flex justify-end my-3" onClick={handleOpenStudentListDialog}>
                            <Button type='button' variant={'theme'}
                                Icon={CirclePlus} iconPlacement='left'
                                disabled={isSubmitting || entranceTest.testStatus !== EntranceTestStatus.NotStarted} isLoading={isSubmitting}>
                                Add learner
                            </Button>
                        </div>}
                        <div className="flex justify-end">
                            <Button type='button' variant={'theme'} onClick={handleOpenImportDialog}
                                Icon={Import} iconPlacement='left' disabled={entranceTest.testStatus !== EntranceTestStatus.Ended}>Import results with Excel file</Button>
                        </div>
                    </div>
                    <ResultTable data={entranceTest.entranceTestStudents} />
                </div>
            </CardContent>
            {role === Role.Staff && <CardFooter className="flex flex-col md:flex-row justify-center gap-4">
                {
                    (entranceTest.status === 0 || entranceTest.status === 3) && entranceTest.registerStudents === 0 && (
                        <Button className='px-12' variant={"destructive"}>
                            <Trash className='mr-2' /> Delete this test
                        </Button>
                    )
                }
                <PublishScoreSection isAnnouncedScore={entranceTest.isAnnouncedScore} id={entranceTest.id}
                    status={entranceTest.testStatus}
                    entranceTest={entranceTest} />
            </CardFooter>}

        </Card>
        {importResultDialog}
        {studentsListDialog}
    </>
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}

function PublishScoreSection({
    isAnnouncedScore,
    id,
    status,
    entranceTest
}: {
    isAnnouncedScore: boolean
    id: string,
    status: EntranceTestStatus;
    entranceTest: EntranceTestDetail;
}) {

    const fetcher = useFetcher<ActionResult>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: `${isAnnouncedScore ? "Cancel" : "Publish"} test results`,
        description: `Are you sure you want to ${isAnnouncedScore ? "cancel" : "publish"} test results?`,
        confirmText: `${isAnnouncedScore ? "Cancel" : "Publish"} test results`,
        confirmButtonClassname: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
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
            toast.success('Success!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                position: 'top-center',
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    const isResultsPublishable = entranceTest.entranceTestStudents.length > 0 && entranceTest.entranceTestStudents.every((student) => !!student.theoraticalScore && student.entranceTestResults.length > 0);

    return <div className='flex flex-col gap-3 w-full'>

        {status !== EntranceTestStatus.Ended &&
            <Alert variant="warning" className='my-5 w-full'>
                <AlertTriangle className="h-10 w-10 pr-5" />
                <AlertTitle>
                    This test has not ended yet.
                </AlertTitle>
                <AlertDescription>
                    Test results can be published after the test is finished.
                </AlertDescription>
            </Alert>
        }

        {!isResultsPublishable && <Alert variant="warning" className='my-5 w-full'>
            <AlertTriangle className="h-10 w-10 pr-5" />
            <AlertTitle>
                All learners results are not available yet.
            </AlertTitle>
            <AlertDescription>
                Test results can only be published when all learners have completed the test and results are available.
            </AlertDescription>
        </Alert>}

        <Button className={`font-bold uppercase max-w-[60%] mx-auto`}
            type='button' onClick={handleOpenConfirmDialog} isLoading={isSubmitting}
            disabled={status !== EntranceTestStatus.Ended || isSubmitting || !isResultsPublishable}
            variant={isAnnouncedScore ? 'destructive' : 'warning'}
        >
            {
                isAnnouncedScore === true ? (
                    <>
                        <Delete className='mr-4'
                        />
                        Cancel publishing results
                    </>
                ) : (
                    <>
                        Publish results
                    </>
                )
            }
        </Button>
        {confirmDialog}
    </div>
}

function DeleteEntranceTestSection({
    entranceTest
}: {
    entranceTest: EntranceTestDetail;
}) {

    const fetcher = useFetcher<ActionResult>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm delete entrance test',
        description: 'Are you sure you want to delete this entrance test?',
        confirmText: 'Delete',
        confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('entranceTestId', entranceTest.id);
            fetcher.submit(formData, {
                method: "POST",
                action: "/delete-entrance-test",
            });
        }
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success("Test deleted successfully!");
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);


    return <div className="my-4 flex justify-center">
        <Button type='button' variant={'destructive'} className='uppercase font-bold'
            onClick={handleOpenDialog}
            isLoading={isSubmitting}
            disabled={isSubmitting || entranceTest.testStatus !== EntranceTestStatus.NotStarted}>
            Delete this test
        </Button>
        {confirmDialog}
    </div>
}