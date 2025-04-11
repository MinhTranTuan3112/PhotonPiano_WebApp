import { zodResolver } from '@hookform/resolvers/zod';
import { DialogTitle } from '@radix-ui/react-dialog';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { addDays } from 'date-fns';
import { Calendar, CalendarSync, CheckCircle, Loader2, XCircle } from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { DatePickerInput } from '~/components/ui/date-picker-input';
import { Dialog, DialogContent } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Progress } from '~/components/ui/progress';
import { Skeleton } from '~/components/ui/skeleton';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useProgressTracking from '~/hooks/use-progress-tracking';
import { useAuth } from '~/lib/contexts/auth-context';
import { fetchAccounts, fetchWaitingStudentsOfAllLevel } from '~/lib/services/account';
import { fetchAutoArrange } from '~/lib/services/class';
import { fetchAllFreeSlots, fetchFreeSlots } from '~/lib/services/free-slot';
import { fetchSystemConfigs } from '~/lib/services/system-config';
import { Account, AwaitingLevelCount, Role, StudentStatus } from '~/lib/types/account/account';
import { ActionResult } from '~/lib/types/action-result';
import { Class } from '~/lib/types/class/class';
import { SystemConfig } from '~/lib/types/config/system-config';
import { FreeSlot } from '~/lib/types/free-slot/free-slot';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { MAX_STUDENTS, MIN_STUDENTS } from '~/lib/utils/config-name';
import { LEVEL, SHIFT_TIME } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { formEntryToDateOnly, formEntryToNumber, formEntryToString, formEntryToStrings } from '~/lib/utils/form';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== 4) {
            return redirect('/');
        }

        // const { searchParams } = new URL(request.url);

        // const query = {
        //     page: Number.parseInt(searchParams.get('page') || '1'),
        //     pageSize: Number.parseInt(searchParams.get('size') || '10'),
        //     sortColumn: searchParams.get('column') || 'Id',
        //     orderByDesc: searchParams.get('desc') === 'true' ? true : false,
        //     studentStatuses: [StudentStatus.WaitingForClass],
        //     roles: [Role.Student],
        //     idToken
        // };

        const promise = fetchWaitingStudentsOfAllLevel({ idToken }).then((response) => {

            const awaitingLevelCounts = response.data as AwaitingLevelCount[]

            return {
                awaitingLevelCounts,
            }
        });

        const slotsPromise = fetchAllFreeSlots({ idToken }).then((response) => {
            const freeSlots = response.data as FreeSlot[];

            return { freeSlots };
        });

        const configPromise = fetchSystemConfigs({ idToken }).then((response) => {

            const configs = response.data as SystemConfig[]

            return {
                configs,
            }
        });

        return {
            promise, configPromise, idToken, slotsPromise
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

const arrangeClassesSchema = z.object({
    studentNumber: z.string().optional(),
    startWeek: z
        .date()
        .refine((date: Date) => date.getDay() === 1, {
            message: "Ngày được chọn phải là Thứ Hai",
        })
        .refine((date: Date) => date > addDays(new Date(), -1), {
            message: "Tuần bắt đầu phải sau hôm nay"
        }),
    // shifts: z.array(z.string()).min(1, { message: `Phải chọn ít nhất 1 ca học` }),
    idToken: z.string(),
});

type ArrangeClassSchema = z.infer<typeof arrangeClassesSchema>;
const resolver = zodResolver(arrangeClassesSchema)

const densityColor = [
    {
        min: 0,
        max: 0,
        color: "#f2f5f0"
    },
    {
        min: 1,
        max: 5,
        color: "#c1e6cb"
    },
    {
        min: 6,
        max: 10,
        color: "#8dd9a1"
    }, {
        min: 11,
        max: 15,
        color: "#4bb868"
    }, {
        min: 16,
        max: 20,
        color: "#1f873b"
    },
    {
        min: 21,
        max: 999999,
        color: "#095e20"
    },
]
const dayOfWeekVn = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

const getTileColor = (freeSlots: FreeSlot[], dayOfWeek: number, shift: number, levelId?: string) => {
    const freeSlotCount = freeSlots.filter(fs => fs.dayOfWeek === dayOfWeek && fs.shift === shift && levelId === fs.levelId).length
    const filteredColor = densityColor.filter(d => d.min <= freeSlotCount && d.max >= freeSlotCount)
    if (filteredColor.length === 0) {
        return densityColor[0].color
    }
    return filteredColor[0].color
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formData = await request.formData();
        const shifts = formEntryToStrings(formData.getAll("shifts").toString())
        const startWeek = formEntryToDateOnly(formData.get("startWeek"))
        const studentNumber = formEntryToNumber(formData.get("studentNumber"))
        const idToken = formEntryToString(formData.get("idToken"))

        if (!idToken) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        if (shifts.length === 0 || !startWeek) {
            return {
                success: false,
                error: 'Dữ liệu gửi đi bị thiếu!',
                status: 400
            }
        }

        const classes = await fetchAutoArrange({
            idToken: idToken,
            shifts: shifts.map(Number),
            startWeek: startWeek,
            studentNumber: studentNumber
        })

        return {
            success: true,
            data: classes
        };
    } catch (e) {
        const error = getErrorDetailsInfo(e)
        console.log(e)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }
}



export default function StaffAutoArrangeClass({ }: Props) {
    const { currentAccount } = useAuth()
    const { promise, idToken, configPromise, slotsPromise } = useLoaderData<typeof loader>();

    const loadingMessage = "Đang thực hiện, vui lòng chờ!"
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpenLoading, setIsOpenLoading] = useState(false);
    const [result, setResult] = useState(false);

    const { progress, progressMessage } = useProgressTracking(currentAccount?.accountFirebaseId ?? "")
    const fetcher = useFetcher<ActionResult>();

    const {
        handleSubmit,
        formState: { errors },
        control
    } = useRemixForm<ArrangeClassSchema>({
        mode: "onSubmit",
        resolver,
        fetcher,
        defaultValues: {
            idToken: idToken,
        }
    });

    const { open: handleOpentModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận xếp lớp',
        description: 'Bạn có chắc chắn muốn thực hiện quá trình tự động xếp lớp không? Hành động này không thể hoàn tác!',
        onConfirm: () => {
            handleSubmit();
        }
    })

    const handleDialogChange = (open: boolean) => {
        setResult(false)
        if (open) {
            setIsOpenLoading(true)
        } else {
            if (result) {
                setIsOpenLoading(false)
            }
        }
    }

    useEffect(() => {
        if (fetcher.data) {
            setResult(true)
        }
    }, [fetcher.data])

    useEffect(() => {
        if (fetcher.state === "submitting") {
            setIsOpenLoading(true); // Open dialog on request start
        }
    }, [fetcher.state])

    return (
        <div>
            <div className='px-8'>
                <h3 className="text-lg font-bold">Xếp Lớp Tự Động</h3>
                <p className="text-sm text-muted-foreground">
                    Chỉ vài thao tác cơ bản để xếp lớp tất cả học viên 1 cách tự động
                </p>
                <Suspense fallback={<LoadingSkeleton height={100} />}>
                    <Await resolve={configPromise}>
                        {(data) => (
                            <div className='grid grid-cols-2 w-full mt-4'>
                                <div className='flex gap-2'>
                                    <span className='font-bold'>Sĩ số lớp tối thiểu :</span>
                                    <span className=''>{data.configs.find(c => c.configName === MIN_STUDENTS)?.configValue}</span>
                                </div>
                                <div className='flex gap-2'>
                                    <span className='font-bold'>Sĩ số lớp tối đa :</span>
                                    <span className=''>{data.configs.find(c => c.configName === MAX_STUDENTS)?.configValue}</span>
                                </div>
                            </div>
                        )}
                    </Await>
                </Suspense>
                <Form onSubmit={handleOpentModal} method='POST'>
                    <Suspense fallback={<LoadingSkeleton />}>
                        <Await resolve={promise}>
                            {(data) => (
                                <div className='mt-4 space-y-6'>
                                    <div className='text-lg font-semibold'>Tổng số học sinh cần xếp lớp: <span className='font-bold'>{data.awaitingLevelCounts.reduce((sum, item) => sum + item.count, 0)}</span></div>

                                    {/* Level Breakdown */}
                                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                                        {data.awaitingLevelCounts.map((breakdown, index) => breakdown.level && (
                                            <div className='flex flex-col items-center p-4 border rounded-lg shadow-md bg-white' key={index}>
                                                <div className='text-center font-bold'>{breakdown.level.name?.split('(')[0]}</div>
                                                <div className='text-center text-lg text-gray-600'>{breakdown.count ?? 0}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Student Selection */}
                                    {/* <div className='flex flex-wrap gap-4 items-center'>
                                        <span className='font-bold'>Chọn số học viên:</span>
                                        <Controller
                                            control={control}
                                            name='studentNumber'
                                            defaultValue={data.awaitingLevelCounts.reduce((sum, item) => sum + item.count, 0).toString()}
                                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                                <Input
                                                    className='w-full sm:w-32' disabled={!isDefineStudentCount}
                                                    value={value}
                                                    onChange={onChange} />

                                            )}
                                        />
                                        {errors.studentNumber && <div className='text-red-500'>{errors.studentNumber.message}</div>}
                                        <Checkbox checked={isDefineStudentCount} onCheckedChange={() => setIsDefineStudentCount(!isDefineStudentCount)} /> <span className='italic text-sm'>Xác định số học viên cụ thể</span>
                                    </div> */}
                                    <div className='text-lg font-semibold my-4'>Biểu đồ khung giờ học viên</div>
                                    <div className='grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 w-full'>
                                        {densityColor.map((note, index) => (
                                            <div className='flex gap-2 items-center' key={index}>
                                                <div className={`rounded-sm w-4 h-4`} style={{ background: note.color }}></div>
                                                {
                                                    note.max > 100 ? (
                                                        <div className='text-sm'>{note.min} +</div>
                                                    ) : (
                                                        <div className='text-sm'>{note.min} - {note.max}</div>
                                                    )
                                                }
                                            </div>
                                        ))}
                                    </div>
                                    <Suspense fallback={<LoadingSkeleton height={200} />}>
                                        <Await resolve={slotsPromise}>
                                            {(freeSlots) => (
                                                <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2'>
                                                    {data.awaitingLevelCounts.map((breakdown, index) => breakdown.level && (
                                                        <div className='flex flex-col items-center py-4 px-2 border rounded-lg shadow-md bg-white' key={index}>
                                                            <div className='font-bold text-center'>{breakdown.level.name.split("(")[0]}</div>
                                                            <div className='grid grid-cols-8 gap-1 w-full'>
                                                                <div></div>
                                                                {
                                                                    dayOfWeekVn.map(dow => (
                                                                        <div className='text-sm' key={dow}>{dow}</div>
                                                                    ))
                                                                }
                                                                {
                                                                    SHIFT_TIME.map((s, index) => (
                                                                        <>
                                                                            <div className='text-xs'>
                                                                                C{index + 1}
                                                                            </div>
                                                                            {
                                                                                dayOfWeekVn.map((dow, dayIndex) => (
                                                                                    <div className={`rounded-sm w-4 h-4`} style={{ background: getTileColor(freeSlots.freeSlots, dayIndex, index, breakdown.level?.id) }}></div>
                                                                                ))
                                                                            }
                                                                        </>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Await>
                                    </Suspense>
                                    {/* Start Week Selection */}
                                    <div className='flex flex-wrap gap-4 items-center'>
                                        <span className='font-bold'>Chọn tuần bắt đầu:</span>
                                        <div>
                                            <Controller
                                                control={control}
                                                name='startWeek'
                                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                                    <DatePickerInput className='w-full sm:w-64'
                                                        value={value} onChange={onChange} />
                                                )}
                                            />
                                            {errors.startWeek && <div className='text-red-500'>{errors.startWeek.message}</div>}
                                        </div>

                                    </div>

                                    {/* Class Session Selection */}
                                    {/*
                                    <div className='space-y-2'>
                                        <span className='font-bold'>Chọn buổi học:</span>
                                        <div>
                                            <Controller
                                                control={control}
                                                name='shifts'
                                                render={({ field: { onChange, value } }) => {
                                                    const handleCheckboxChange = (checked: boolean, shift: string) => {
                                                        const newValue = checked
                                                            ? [...value, shift] // Add new value
                                                            : value.filter((val) => val !== shift); // Remove value

                                                        console.log("Updated shifts:", newValue); // Debugging log
                                                        onChange(newValue);
                                                    };
                                                    return (
                                                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>

                                                            {[...Array(8)].map((_, i) => (
                                                                <div key={i} className='flex items-center gap-2'>
                                                                    <Checkbox
                                                                        value={i.toString()}
                                                                        checked={value.includes(i.toString())}
                                                                        onCheckedChange={(checked: boolean) => handleCheckboxChange(checked, i.toString())} />
                                                                    <span className='italic text-sm'>Ca {i + 1}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                }}
                                            />
                                            {errors.shifts && <div className='text-red-500 mt-2'>{errors.shifts.message}</div>}
                                        </div>


                                    </div>
                                    */}
                                    {/* Buttons */}
                                    <div className='flex flex-wrap justify-center gap-4 mt-4'>
                                        <Button type='submit' Icon={CalendarSync} iconPlacement='left' className='px-8'>Bắt đầu xếp lớp</Button>
                                        <Button type='button' variant={'outline'} Icon={Calendar} iconPlacement='left'>Xem lịch nghỉ</Button>
                                    </div>
                                </div>
                            )}
                        </Await>
                    </Suspense>
                </Form>
                {confirmDialog}
                <Dialog onOpenChange={handleDialogChange} open={isOpenLoading}>
                    <DialogTitle />
                    <DialogContent className='' preventClosing={!result}>
                        {(result && fetcher.data?.success === true) ? (
                            <div className="text-center">
                                <p className="font-bold text-xl text-green-600">XẾP LỚP HOÀN TẤT</p>
                                <CheckCircle size={100} className="text-green-600 mx-auto mt-4" />
                                {(() => {
                                    const classes = (fetcher.data?.data?.data as Class[]) ?? [];
                                    return (
                                        <div>
                                            <div className='mt-4 font-bold'>Có {classes.length} lớp đã được tạo</div>
                                            <div className='max-h-96 overflow-y-auto p-1'>
                                                {
                                                    classes.length > 0 && (
                                                        <table className="min-w-full border border-gray-300 shadow-md rounded-lg">
                                                            <thead className="bg-gray-600 text-white">
                                                                <tr>
                                                                    <th className="py-2 px-4 border">Tên lớp</th>
                                                                    <th className="py-2 px-4 border">Số học viên</th>
                                                                    <th className="py-2 px-4 border">Thời khóa biểu</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {classes.map((c) => (
                                                                    <tr key={c.id} className="border hover:bg-gray-100 transition">
                                                                        <td className="py-2 px-4 border">{c.name}</td>
                                                                        <td className="py-2 px-4 border text-center">{c.studentNumber}</td>
                                                                        <td className="py-2 px-4 border">{c.scheduleDescription}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )
                                                }
                                            </div>

                                        </div>
                                    )
                                })()}
                            </div>
                        ) : (result && fetcher.data?.success === false && fetcher.data.error) ? (
                            <div className="text-center">
                                <p className="font-bold text-xl text-red-600">THẤT BẠI</p>
                                <XCircle size={100} className="text-red-600 mx-auto mt-4" />
                                <p>{fetcher.data.error}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="font-bold text-xl">{loadingMessage}</p>
                                <Loader2 size={100} className="animate-spin mx-auto mt-4" />
                                <div className='my-4 text-center text-gray-400'>
                                    {progressMessage}
                                </div>
                                <Progress value={progress} max={100}></Progress>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
function LoadingSkeleton({ height = 500 }: { height?: number }) {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className={`w-full h-[${height}px] rounded-md`} />
    </div>
}
