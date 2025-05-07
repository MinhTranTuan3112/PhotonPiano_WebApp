import { zodResolver } from '@hookform/resolvers/zod';
import { DialogTitle } from '@radix-ui/react-dialog';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { addDays } from 'date-fns';
import { BarChart3, Calendar, CalendarClock, CalendarDays, CalendarSync, CheckCircle, Loader2, Users, XCircle } from 'lucide-react';
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
            message: "The day choosen must be monday",
        })
        .refine((date: Date) => date > addDays(new Date(), -1), {
            message: "Start week must be in the future"
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
        color: "#f7fbff" // Almost white/very light sky
    },
    {
        min: 1,
        max: 5,
        color: "#d1e5f0" // Light sky blue
    },
    {
        min: 6,
        max: 10,
        color: "#9ecae1" // Medium sky blue
    }, {
        min: 11,
        max: 15,
        color: "#6baed6" // Sky blue/azure
    }, {
        min: 16,
        max: 20,
        color: "#3182bd" // Deeper blue
    },
    {
        min: 21,
        max: 999999,
        color: "#08519c" // Dark blue/navy
    },
]
const dayOfWeekVn = ["M", "T", "W", "Th", "F", "S", "Su"]

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
                error: 'Invalid Data!',
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



export default function StaffAutoArrangeClass({}: Props) {
    const { currentAccount } = useAuth()
    const { promise, idToken, configPromise, slotsPromise } = useLoaderData<typeof loader>()
  
    const loadingMessage = "Processing... Please wait!"
    const [searchParams, setSearchParams] = useSearchParams()
    const [isOpenLoading, setIsOpenLoading] = useState(false)
    const [result, setResult] = useState(false)
  
    const { progress, progressMessage } = useProgressTracking(currentAccount?.accountFirebaseId ?? "")
    const fetcher = useFetcher<ActionResult>()
  
    const {
      handleSubmit,
      formState: { errors },
      control,
    } = useRemixForm<ArrangeClassSchema>({
      mode: "onSubmit",
      resolver,
      fetcher,
      defaultValues: {
        idToken: idToken,
      },
    })
  
    const { open: handleOpentModal, dialog: confirmDialog } = useConfirmationDialog({
      title: "Confirm The Action",
      description: "Do you want to proceed with this auto-arrange process? This action cannot be rolled back!",
      onConfirm: () => {
        handleSubmit()
      },
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
        setIsOpenLoading(true)
      }
    }, [fetcher.state])
  
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-sky-100">
            <div className="flex items-center gap-3 mb-4">
              <CalendarClock className="h-8 w-8 text-sky-600" />
              <div>
                <h3 className="text-2xl font-bold text-sky-800">Auto-Arrange Classes</h3>
                <p className="text-sm text-sky-600">Just a few simple steps to arrange all classes automatically</p>
              </div>
            </div>
  
            <Suspense fallback={<LoadingSkeleton height={100} />}>
              <Await resolve={configPromise}>
                {(data) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-200 flex items-center">
                      <div className="bg-sky-100 p-3 rounded-full mr-3">
                        <Users className="h-5 w-5 text-sky-700" />
                      </div>
                      <div>
                        <span className="text-sm text-sky-500">Minimum Class Size</span>
                        <p className="text-xl font-bold text-sky-800">
                          {data.configs.find((c) => c.configName === MIN_STUDENTS)?.configValue}
                        </p>
                      </div>
                    </div>
                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-200 flex items-center">
                      <div className="bg-sky-100 p-3 rounded-full mr-3">
                        <Users className="h-5 w-5 text-sky-700" />
                      </div>
                      <div>
                        <span className="text-sm text-sky-500">Maximum Class Size</span>
                        <p className="text-xl font-bold text-sky-800">
                          {data.configs.find((c) => c.configName === MAX_STUDENTS)?.configValue}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Await>
            </Suspense>
  
            <Form onSubmit={handleOpentModal} method="POST">
              <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                  {(data) => (
                    <div className="mt-8 space-y-8">
                      <div className="bg-sky-700 text-white p-4 rounded-lg shadow-md flex items-center justify-between">
                        <div className="flex items-center">
                          <BarChart3 className="h-6 w-6 mr-3" />
                          <span className="text-lg font-medium">Total learners waiting for class</span>
                        </div>
                        <span className="text-2xl font-bold">
                          {data.awaitingLevelCounts.reduce((sum, item) => sum + item.count, 0)}
                        </span>
                      </div>
  
                      {/* Level Breakdown */}
                      <div>
                        <h4 className="text-lg font-semibold text-sky-800 mb-3">Level Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {data.awaitingLevelCounts.map(
                            (breakdown, index) =>
                              breakdown.level && (
                                <div
                                  className="flex flex-col items-center p-4 border rounded-lg shadow-sm bg-gradient-to-b from-white to-sky-50 hover:shadow-md transition-all"
                                  key={index}
                                >
                                  <div className="text-center font-bold text-sky-800">
                                    {breakdown.level.name?.split("(")[0]}
                                  </div>
                                  <div className="text-center text-2xl font-bold text-sky-600 mt-2">
                                    {breakdown.count ?? 0}
                                  </div>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
  
                      {/* Learner schedule heatmap */}
                      <div>
                        <h4 className="text-lg font-semibold text-sky-800 mb-3">Learner Schedule Heatmap</h4>
                        <div className="bg-white p-4 rounded-lg border border-sky-100 mb-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                            {densityColor.map((note, index) => (
                              <div className="flex items-center gap-2" key={index}>
                                <div className="rounded-sm w-4 h-4" style={{ background: note.color }}></div>
                                {note.max > 100 ? (
                                  <div className="text-sm text-gray-600">{note.min}+</div>
                                ) : (
                                  <div className="text-sm text-gray-600">
                                    {note.min} - {note.max}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
  
                          <Suspense fallback={<LoadingSkeleton height={200} />}>
                            <Await resolve={slotsPromise}>
                              {(freeSlots) => (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                  {data.awaitingLevelCounts.map(
                                    (breakdown, index) =>
                                      breakdown.level && (
                                        <div
                                          className="flex flex-col items-center py-4 px-2 border rounded-lg shadow-sm bg-white hover:shadow-md transition-all"
                                          key={index}
                                        >
                                          <div className="font-bold text-center text-sky-800 mb-3">
                                            {breakdown.level.name.split("(")[0]}
                                          </div>
                                          <div className="grid grid-cols-8 gap-1 w-full">
                                            <div></div>
                                            {dayOfWeekVn.map((dow, index) => (
                                              <div className="text-sm font-medium text-sky-700" key={index}>
                                                {dow}
                                              </div>
                                            ))}
                                            {SHIFT_TIME.map((s, index) => (
                                              <React.Fragment key={index}>
                                                <div className="text-xs font-medium text-gray-500">C{index + 1}</div>
                                                {dayOfWeekVn.map((dow, dayIndex) => (
                                                  <div
                                                    className="rounded-sm w-4 h-4"
                                                    style={{
                                                      background: getTileColor(
                                                        freeSlots.freeSlots,
                                                        dayIndex,
                                                        index,
                                                        breakdown.level?.id,
                                                      ),
                                                    }}
                                                    key={dayIndex}
                                                  ></div>
                                                ))}
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        </div>
                                      ),
                                  )}
                                </div>
                              )}
                            </Await>
                          </Suspense>
                        </div>
                      </div>
  
                      {/* Start Week Selection */}
                      <div className="bg-white p-6 rounded-lg border border-sky-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-sky-600 mr-2" />
                            <span className="font-bold text-sky-800">Choose start week:</span>
                          </div>
                          <div className="flex-grow">
                            <Controller
                              control={control}
                              name="startWeek"
                              render={({ field: { onChange, onBlur, value, ref } }) => (
                                <DatePickerInput
                                  className="w-full md:w-64 border-sky-200 focus:border-sky-500 focus:ring-sky-500"
                                  value={value}
                                  onChange={onChange}
                                />
                              )}
                            />
                            {errors.startWeek && (
                              <div className="text-red-500 mt-1 text-sm">{errors.startWeek.message}</div>
                            )}
                          </div>
                        </div>
                      </div>
  
                      {/* Buttons */}
                      <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <Button
                          type="submit"
                          className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                          <CalendarDays className="mr-2 h-5 w-5" />
                          Start Arranging
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-sky-300 text-sky-700 hover:bg-sky-50 px-8 py-2 rounded-lg"
                        >
                          <Calendar className="mr-2 h-5 w-5" />
                          View Day-Offs
                        </Button>
                      </div>
                    </div>
                  )}
                </Await>
              </Suspense>
            </Form>
  
            {confirmDialog}
  
            <Dialog onOpenChange={handleDialogChange} open={isOpenLoading}>
              <DialogTitle />
              <DialogContent className="" preventClosing={!result}>
                {result && fetcher.data?.success === true ? (
                  <div className="text-center">
                    <p className="font-bold text-xl text-green-600">SCHEDULE COMPLETE</p>
                    <CheckCircle size={100} className="text-green-600 mx-auto mt-4" />
                    {(() => {
                      const classes = (fetcher.data?.data?.data as Class[]) ?? []
                      return (
                        <div>
                          <div className="mt-4 font-bold text-sky-800">{classes.length} class(es) created</div>
                          <div className="max-h-96 overflow-y-auto p-1 mt-4">
                            {classes.length > 0 && (
                              <table className="min-w-full border border-sky-200 shadow-md rounded-lg">
                                <thead className="bg-sky-700 text-white">
                                  <tr>
                                    <th className="py-2 px-4 border border-sky-300">Name</th>
                                    <th className="py-2 px-4 border border-sky-300">Learner number</th>
                                    <th className="py-2 px-4 border border-sky-300">Schedule Desc</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classes.map((c) => (
                                    <tr key={c.id} className="border border-sky-100 hover:bg-sky-50 transition">
                                      <td className="py-2 px-4 border border-sky-100">{c.name}</td>
                                      <td className="py-2 px-4 border border-sky-100 text-center">{c.studentNumber}</td>
                                      <td className="py-2 px-4 border border-sky-100">{c.scheduleDescription}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : result && fetcher.data?.success === false && fetcher.data.error ? (
                  <div className="text-center">
                    <p className="font-bold text-xl text-red-600">FAILURE</p>
                    <XCircle size={100} className="text-red-600 mx-auto mt-4" />
                    <p className="mt-4 text-gray-700">{fetcher.data.error}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-bold text-xl text-sky-800">{loadingMessage}</p>
                    <Loader2 size={100} className="animate-spin mx-auto mt-4 text-sky-600" />
                    <div className="my-4 text-center text-sky-500">{progressMessage}</div>
                    <Progress value={progress} max={100} className="h-2 bg-sky-100">
                      <div className="h-full bg-sky-600 rounded-full"></div>
                    </Progress>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    )
  }
  
  function LoadingSkeleton({ height = 500 }: { height?: number }) {
    return (
      <div className="flex justify-center items-center my-4">
        <Skeleton className={`w-full h-[${height}px] rounded-md bg-sky-100`} />
      </div>
    )
  }
