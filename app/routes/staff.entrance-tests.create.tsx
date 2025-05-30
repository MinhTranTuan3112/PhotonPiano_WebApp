import { zodResolver } from '@hookform/resolvers/zod'
import { ActionFunctionArgs, redirect } from '@remix-run/node'
import { Form, useFetcher, useLoaderData } from '@remix-run/react'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { Button } from '~/components/ui/button'
import { DatePickerInput } from '~/components/ui/date-picker-input'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { CreateEntranceTestFormData, createEntranceTestSchema } from '~/lib/utils/schemas'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Controller } from 'react-hook-form'
import { SHIFT_TIME } from '~/lib/utils/constants'
import { Clock, MapPin, PlusCircle, UserCog } from 'lucide-react'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { requireAuth } from '~/lib/utils/auth'
import { Account, Role } from '~/lib/types/account/account'
import GenericCombobox from '~/components/ui/generic-combobox'
import { fetchRooms } from '~/lib/services/rooms'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { Room } from '~/lib/types/room/room'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import { fetchAccounts } from '~/lib/services/account'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Shift } from '~/lib/types/entrance-test/entrance-test'
import { fetchCreateEntranceTest } from '~/lib/services/entrance-tests'
import { toastWarning } from '~/lib/utils/toast-utils'

type Props = {};

const resolver = zodResolver(createEntranceTestSchema);

export async function loader({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        return { idToken };

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<CreateEntranceTestFormData>(request, resolver);

        console.log({ data });

        if (errors) {
            console.log({ errors });
            // The keys "errors" and "defaultValues" are picked up automatically by useRemixForm
            return { success: false, errors, defaultValues };
        }

        const response = await fetchCreateEntranceTest({
            idToken,
            ...data,
            date: data.date.toISOString().split('T')[0],
        });

        return redirect('/staff/entrance-tests');

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message
        }, {
            status
        });
    }

}

function formatToDateOnly(rfc3339: string): string {
    const date = new Date(rfc3339);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

function formatDateToYMD(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

export function getEntranceTestName({ shift, date, roomName }: {
    shift?: Shift,
    date?: Date;
    roomName?: string;
}): string {

    const shiftName = (() => {
        switch (shift) {
            case Shift.Shift1_7h_8h30:
                return "7h_8h30";
            case Shift.Shift2_8h45_10h15:
                return "8h45_10h15";
            case Shift.Shift3_10h45_12h:
                return "10h45_12h";
            case Shift.Shift4_12h30_14h00:
                return "12h30_14h00";
            case Shift.Shift5_14h15_15h45:
                return "14h15_15h45";
            case Shift.Shift6_16h00_17h30:
                return "16h00_17h30";
            case Shift.Shift7_18h_19h30:
                return "18h_19h30";
            case Shift.Shift8_19h45_21h15:
                return "19h45_21h15";
            default:
                return '';
        }
    })();

    const dateStr = date ? formatDateToYMD(date) : '';

    return `${shiftName || ''}_${dateStr || ''}_${roomName || ''}`;
}


export default function CreateEntranceTestPage({ }: Props) {

    const { idToken } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <PlusCircle className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Create New Entrance Test</h3>
                    <p className="text-sm text-sky-600">Input basic information</p>
                </div>
            </div>

            <CreateEntranceTestForm idToken={idToken} />

        </article>
    )
}

export function CreateEntranceTestForm({
    idToken,
    studentIds: initialStudentIds = [],
    hasWidthConstraint = true
}: {
    idToken: string,
    studentIds?: string[];
    hasWidthConstraint?: boolean;
}) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const {
        handleSubmit,
        formState: { errors },
        register,
        setValue: setFormValue,
        getValues: getFormValues,
        control,
        watch
    } = useRemixForm<CreateEntranceTestFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            studentIds: initialStudentIds || [],
        },
        submitConfig: {
            action: '/staff/entrance-tests/create',
            method: 'POST',
        },
        fetcher
    });

    const { date: testDate, shift: testShift, roomId, instructorId, roomName } = watch();

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Create this test?',
        onConfirm: () => {
            console.log(getFormValues());
            handleSubmit();
        }
    });

    useEffect(() => {

        if (fetcher.data?.success && fetcher.data.success === true) {
            toast.success('Test created successfully!');
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

    return <>
        <Form method='POST' className={`my-5 flex flex-col gap-5 ${hasWidthConstraint ? 'md:max-w-[60%]' : ''} `}
            action='/staff/entrance-tests/create'>
            <div className="">
                <Label htmlFor='name'>Test name</Label>
                <Input {...register('name')} name='name' id='name' placeholder='Test name...' readOnly={true} />
                {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
            </div>
            <div className="flex md:flex-row max-md:flex-col gap-5">
                <div className="w-full">
                    <Label className='w-full'>Test date</Label>
                    <Controller
                        control={control}
                        name='date'
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <DatePickerInput
                                placeholder='Select test date'
                                ref={ref}
                                value={value}
                                onChange={(date) => {
                                    onChange(date)
                                    setFormValue('name', getEntranceTestName({
                                        date: date as Date,
                                        roomName,
                                        shift: parseInt(testShift)
                                    }));
                                }}
                                name='date'
                                id='date'
                                className='w-full'
                            />
                        )}
                    />
                    {errors.date && <p className='text-sm text-red-500'>{errors.date.message}</p>}
                </div>
                <div className="w-full md:max-w-[25%] max-md:max-w-[50%]">
                    <Label className='w-full'>Test shift</Label>
                    <Controller
                        name='shift'
                        control={control}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <Select onValueChange={(value) => {
                                onChange(value);
                                setFormValue('name', getEntranceTestName({
                                    date: testDate,
                                    roomName,
                                    shift: parseInt(value)
                                }));
                            }} value={value}>
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder={<div className='flex flex-row items-center gap-1'><Clock /> Select shift</div>} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Shift</SelectLabel>
                                        {SHIFT_TIME.map((shift, index) => (
                                            <SelectItem key={shift} value={(index + 1).toString()}>{shift}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.shift && <p className='text-sm text-red-500'>{errors.shift.message}</p>}
                </div>
            </div>
            <div className="w-full">
                <Label className='w-full flex flex-row gap-1 items-center'><MapPin className='p-1' />Room</Label>
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
                            emptyText='Rooms not found.'
                            errorText='Error loading rooms.'
                            value={value}
                            onChange={onChange}
                            maxItemsDisplay={10}
                        />
                    )}
                />
                {errors.roomId && <p className='text-sm text-red-500'>{errors.roomId.message}</p>}
            </div>
            <div className="w-full">
                <Label className='w-full flex flex-row items-center'><UserCog className='p-1' /> Teacher</Label>
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
                            placeholder='Select teacher'
                            emptyText='No teachers found.'
                            errorText='Error loading teachers data.'
                            maxItemsDisplay={10}
                            value={value || ''}
                            onChange={onChange}
                        />
                    )}
                />
                {errors.instructorId && <p className='text-sm text-red-500'>{errors.instructorId.message}</p>}
            </div>
            <Button variant={'theme'} type='button'
                isLoading={isSubmitting} disabled={isSubmitting} onClick={handleOpenConfirmDialog}>
                Arrange
            </Button>
        </Form>
        {confirmDialog}
    </>
}