import type { LoaderFunctionArgs } from "@remix-run/node"
import { Suspense } from "react"
import { Await, defer, useLoaderData } from "@remix-run/react"
import { getWeekRange } from "~/lib/utils/datetime"
import { fetchSlots } from "~/lib/services/scheduler"
import { getWeek } from "date-fns"
import { requireAuth } from "~/lib/utils/auth"
import { fetchCurrentAccountInfo } from "~/lib/services/auth"
import { StaffSchedule } from "~/components/scheduler/staff-schedule"
import { redirect } from "@remix-run/react"
import { Card } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Music, Calendar } from "lucide-react"
import { Role } from "~/lib/types/account/account"

type Props = {}

const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
}

// Inline Skeleton Component
const SchedulerSkeleton = () => {
    const weekDates = Array.from({ length: 7 }, (_, i) => i)
    const shiftTimes = Array.from({ length: 8 }, (_, i) => i)

    return (
        <div className="staff-scheduler p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <Music className="w-8 h-8 mr-2 text-slate-300" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>

                {/* Controls Skeleton */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">Week</span>
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">Year</span>
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-9" />
                            <div className="flex items-center">
                                <Calendar className="mr-2 w-4 h-4 text-slate-300" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                            <Skeleton className="h-9 w-9" />
                        </div>

                        <div className="flex items-center">
                            <Skeleton className="h-10 w-48" />
                        </div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-200">
                                    <TableHead className="h-14 text-center w-32">
                                        <Skeleton className="h-6 w-16 mx-auto" />
                                    </TableHead>
                                    {weekDates.map((_, i) => (
                                        <TableHead key={i} className="text-center px-3 min-w-[110px]">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-8 mx-auto" />
                                                <Skeleton className="h-3 w-16 mx-auto" />
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shiftTimes.map((_, timeIndex) => (
                                    <TableRow key={timeIndex} className="border-b bg-card">
                                        <TableCell className="text-center font-medium py-4 border-r">
                                            <Skeleton className="h-4 w-20 mx-auto" />
                                        </TableCell>
                                        {weekDates.map((_, dateIndex) => (
                                            <TableCell key={dateIndex} className="p-2 align-top border-r border-border/60">
                                                <div className="flex flex-col gap-2">
                                                    {/* Random number of slot skeletons per cell */}
                                                    {Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, idx) => (
                                                        <div key={idx} className="bg-slate-100 p-2 rounded-lg border animate-pulse">
                                                            <Skeleton className="h-3 w-full mb-1" />
                                                            <Skeleton className="h-3 w-3/4" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Loading indicator */}
                <div className="flex items-center justify-center mt-8">
                    <div className="flex items-center space-x-2 text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                        <span className="text-sm">Loading schedule data...</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { idToken, role } = await requireAuth(request)
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const currentYear = new Date().getFullYear()
    const currentDate = new Date()
    const currentWeekNumber = getWeek(currentDate)
    const year = Number.parseInt(searchParams.get("year") || currentYear.toString())
    const weekNumber = Number.parseInt(searchParams.get("week") || currentWeekNumber.toString())
    const classId = searchParams.get("classId")
    const className = searchParams.get("className")
    const { startDate, endDate } = getWeekRange(year, weekNumber)

    const startTime = formatDateForAPI(startDate)
    const endTime = formatDateForAPI(endDate)
    if (role !== Role.Staff) {
        return redirect('/')
    }
    // Get current account info immediately (this is usually fast)
    const currentAccountResponse = await fetchCurrentAccountInfo({ idToken })
    const currentAccount = currentAccountResponse.data

    // Defer the slots loading for better UX
    const slotsPromise = fetchSlots({
        startTime,
        endTime,
        studentFirebaseId: "",
        idToken: idToken,
    }).then((response) => response.data)

    return defer({
        slots: slotsPromise,
        year,
        weekNumber,
        startDate,
        endDate,
        idToken,
        role,
        currentAccount,
        classId,
        className,
    })
}

export default function StaffScheduler({ }: Props) {
    const data = useLoaderData<typeof loader>()

    return (
        <Suspense fallback={<SchedulerSkeleton />}>
            <Await resolve={data.slots}>
                {(slots) => (
                    <StaffSchedule
                        currentAccount={data.currentAccount}
                        idToken={data.idToken}
                        initialEndDate={data.endDate}
                        initialStartDate={data.startDate}
                        initialSlots={slots}
                        initialYear={data.year}
                        initialWeekNumber={data.weekNumber}
                        classId={data.classId || undefined}
                        className={data.className || undefined}
                        role={data.role}
                    />
                )}
            </Await>
        </Suspense>
    )
}
