import type { LoaderFunctionArgs } from "@remix-run/node"
import { getWeekRange } from "~/lib/utils/datetime"
import {
    fetchSlots
} from "~/lib/services/scheduler"
import { getWeek } from "date-fns"
import {
    type SlotDetail,
} from "~/lib/types/Scheduler/slot"
import { requireAuth } from "~/lib/utils/auth"
import { Await, redirect, useAsyncValue, useLoaderData } from "@remix-run/react"
import { Role } from "~/lib/types/account/account"
import { TeacherSchedule } from "~/components/scheduler/teacher-schedule"
import { Suspense } from "react"
import { Skeleton } from "~/components/ui/skeleton"
import { useAuth } from "~/lib/contexts/auth-context"

type Props = {}

const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
}

export const loader = async ({ request }: LoaderFunctionArgs) => {

    const { idToken, role } = await requireAuth(request);

    if (role !== Role.Instructor) {
        return redirect('/');
    }

    const { searchParams } = new URL(request.url);
    
    const currentYear = new Date().getFullYear()
    const currentDate = new Date()
    const currentWeekNumber = getWeek(currentDate)
    const year = Number.parseInt(searchParams.get("year") || currentYear.toString())
    const weekNumber = Number.parseInt(searchParams.get("week") || currentWeekNumber.toString())
    const { startDate, endDate } = getWeekRange(year, weekNumber)

    const startTime = formatDateForAPI(startDate)
    const endTime = formatDateForAPI(endDate)

    const promise = fetchSlots({ startTime, endTime, idToken }).then((response) => {
        const slotsPromise: Promise<SlotDetail[]> = response.data;

        return { slotsPromise };
    });

    return { promise, year, weekNumber, startDate, endDate, idToken, role }
}

export default function StaffScheduler({ }: Props) {

    const { promise, year, weekNumber, startDate, endDate, idToken, role } = useLoaderData<typeof loader>();

    return <Suspense key={JSON.stringify({ year, weekNumber, startDate, endDate })} fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
            {({ slotsPromise }) => (
                <Await resolve={slotsPromise}>
                    <TeacherScheduleContent
                        startDate={startDate}
                        endDate={endDate}
                        year={year}
                        weekNumber={weekNumber}
                        idToken={idToken}
                        role={role}
                    />
                </Await>
            )}
        </Await>
    </Suspense>
}


function TeacherScheduleContent({
    startDate, endDate, year, weekNumber, idToken, role
}: {
    year: number,
    weekNumber: number,
    startDate: Date,
    endDate: Date,
    idToken: string,
    role: Role,
}) {

    const { currentAccount } = useAuth();

    const slots = useAsyncValue() as SlotDetail[];

    return <TeacherSchedule
        initialSlots={slots}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialYear={year}
        initialWeekNumber={weekNumber}
        idToken={idToken}
        role={role}
        currentAccount={currentAccount!} />
}

function LoadingSkeleton() {
    return <div className="px-10">
        <Skeleton className="w-full h-[200px]" />
        <br />
        <Skeleton className="w-full h-[500px]" />
    </div>
}