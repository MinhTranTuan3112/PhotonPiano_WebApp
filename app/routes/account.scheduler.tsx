import type { LoaderFunctionArgs } from "@remix-run/node"
import { getWeekRange } from "~/lib/utils/datetime"
import {
    fetchAttendanceStatus,
    fetchSlots
} from "~/lib/services/scheduler"
import { getWeek } from "date-fns"
import {
    type SlotDetail,
    type StudentAttendanceModel,
} from "~/lib/types/Scheduler/slot"
import { requireAuth } from "~/lib/utils/auth"
import { fetchCurrentAccountInfo } from "~/lib/services/auth"
import { Scheduler } from "~/components/scheduler/scheduler"
import { redirect, useLoaderData } from "@remix-run/react"
import { Role } from "~/lib/types/account/account"
import { LearnerScheduler } from "~/components/scheduler/account-scheduler"

type Props = {}

const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
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
    const { startDate, endDate } = getWeekRange(year, weekNumber)

    const startTime = formatDateForAPI(startDate)
    const endTime = formatDateForAPI(endDate)

    const currentAccountResponse = await fetchCurrentAccountInfo({ idToken })
    const currentAccount = currentAccountResponse.data

    let accountId = ""

    if (role !== Role.Student) {
        return redirect('/');
    }

    const response = await fetchSlots({ startTime, endTime, studentFirebaseId: accountId, idToken: idToken })
    const slots: SlotDetail[] = response.data
    return { slots, year, weekNumber, startDate, endDate, idToken, role, currentAccount }
}

export default function AccountScheduler({} : Props) {
    const { slots, year, weekNumber, startDate, endDate, idToken, role, currentAccount } = useLoaderData<typeof loader>()
    return (
        <LearnerScheduler 
            currentAccount={currentAccount}
            idToken={idToken}
            initialEndDate={endDate}
            initialStartDate={startDate}
            initialSlots={slots}
            initialYear={year}
            initialWeekNumber={weekNumber}
            role={role}/>
    )
}
