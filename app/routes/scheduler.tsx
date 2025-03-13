import type React from "react"
import { useEffect, useState } from "react"
import { useLoaderData, useNavigate } from "@remix-run/react"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { getWeekRange } from "~/lib/utils/datetime"
import {fetchAttendanceStatus, fetchSlotById, fetchSlots} from "~/lib/services/scheduler"
import { motion } from "framer-motion"
import {Piano, Calendar, Music, Filter, ChevronLeft, ChevronRight} from "lucide-react"
import { getWeek } from "date-fns"
import {
    type Slot,
    Shift,
    type SlotDetail,
    AttendanceStatus,
    type StudentAttendanceModel,
    SlotStatus,
} from "~/lib/types/Scheduler/slot"
import { requireAuth } from "~/lib/utils/auth"
import { fetchCurrentAccountInfo } from "~/lib/services/auth"
import { PubSub, type IPubSubMessage } from "~/lib/services/pub-sub"
import {Button} from "~/components/ui/button";
import {Checkbox} from "~/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "~/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "~/components/ui/select";

const shiftTimesMap: Record<Shift, string> = {
    [Shift.Shift1_7h_8h30]: "7:00 - 8:30",
    [Shift.Shift2_8h45_10h15]: "8:45 - 10:15",
    [Shift.Shift3_10h45_12h]: "10:45 - 12:00",
    [Shift.Shift4_12h30_14h00]: "12:30 - 14:00",
    [Shift.Shift5_14h15_15h45]: "14:15 - 15:45",
    [Shift.Shift6_16h00_17h30]: "16:00 - 17:30",
    [Shift.Shift7_18h_19h30]: "18:00 - 19:30",
    [Shift.Shift8_19h45_21h15]: "19:45 - 21:15",
}

const shiftTimes = Object.values(shiftTimesMap)

const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}



const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
}

const getVietnameseWeekday = (date: Date): string => {
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    return weekdays[date.getDay()]
}

const isCurrentDatePastSlotDate = (slotDate: string): boolean => {
    // const currentDate = new Date();
    // const slotDateObj = new Date(slotDate);
    // const oneDayInMs = 24 * 60 * 60 * 1000;
    // const differenceInDays = (currentDate.getTime() - slotDateObj.getTime()) / oneDayInMs;
    //
    // return currentDate > slotDateObj && differenceInDays <= 1;

    // for demo
    return true
}
export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
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

        if (role === 1) {
            accountId = currentAccount.accountFirebaseId?.toLowerCase()
        }

        const response = await fetchSlots({ startTime, endTime, studentFirebaseId: accountId, idToken: idToken })
        const slots: SlotDetail[] = response.data

        for (const slot of slots) {
            const attendanceStatusResponse = await fetchAttendanceStatus(slot.id, idToken)
            const studentAttendanceModel: StudentAttendanceModel[] = attendanceStatusResponse.data
            const rs = studentAttendanceModel.find(
                (studentAttendanceModel) =>
                    studentAttendanceModel.studentFirebaseId?.toLowerCase() === currentAccount.accountFirebaseId?.toLowerCase(),
            )
            slot.attendanceStatus = rs?.attendanceStatus

        }

        return { slots, year, weekNumber, startDate, endDate, idToken, role, currentAccount }
    } catch (error) {
        console.error("Failed to load data:", error)
        throw new Response("Failed to load data", { status: 500 })
    }
}

const SchedulerPage: React.FC = () => {
    const {
        slots: initialSlots,
        startDate: initialStartDate,
        endDate: initialEndDate,
        year: initialYear,
        weekNumber: initialWeekNumber,
        idToken,
        role,
        currentAccount,
    } = useLoaderData<typeof loader>()

    const [slots, setSlots] = useState<SlotDetail[]>(initialSlots)
    const [year, setYear] = useState(initialYear)
    const [weekNumber, setWeekNumber] = useState(initialWeekNumber)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false)
    const [filters, setFilters] = useState({
        shifts: [] as Shift[],
        slotStatuses: [] as SlotStatus[],
        instructorFirebaseIds: [] as string[],
        studentFirebaseId: "",
        classIds: [] as string[],
    })


    const uniqueShifts = Array.from(new Set(slots.map((slot) => slot.shift)))
    const uniqueSlotStatuses = Array.from(new Set(slots.map((slot) => slot.status)))
    const uniqueInstructorIds = Array.from(new Set(slots.map((slot) => slot.class.instructorId)))
    const uniqueClassIds = Array.from(new Set(slots.map((slot) => slot.class.id)))

    const instructorMap = new Map(slots.map((slot) => [slot.class.instructorId, slot.class.instructorName]))
    const classMap = new Map(slots.map((slot) => [slot.class.id, slot.class.name]))

    useEffect(() => {
        const pubSubService = new PubSub()
        const subscription = pubSubService.receiveMessage().subscribe((message: IPubSubMessage) => {
            console.log("[Pub Sub] Message received in Student screen:", message)

            if (message.content.includes("changed") && message.topic.includes("scheduler_attendance")) {
                console.log("[Pub Sub] Attendance updated. Fetching latest data...")
                Promise.all(
                    slots.map(async (slot) => {
                        try {
                            const attendanceStatusResponse = await fetchAttendanceStatus(slot.id, idToken)
                            const studentAttendanceModel: StudentAttendanceModel[] = attendanceStatusResponse.data
                            const rs = studentAttendanceModel.find(
                                (studentAttendanceModel) =>
                                    studentAttendanceModel.studentFirebaseId?.toLowerCase() ===
                                    currentAccount.accountFirebaseId?.toLowerCase(),
                            )
                            return { ...slot, attendanceStatus: rs?.attendanceStatus }
                        } catch (error) {
                            console.error(`Failed to fetch attendance status for slot ${slot.id}:`, error)
                            return slot
                        }
                    }),
                ).then((updatedSlots) => {
                    setSlots(updatedSlots)
                })
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [year, weekNumber])

    const fetchSlotsForWeek = async (year: number, week: number) => {
        try {
            const { startDate, endDate } = getWeekRange(year, week)
            const startTime = formatDateForAPI(startDate)
            const endTime = formatDateForAPI(endDate)

            const response = await fetchSlots({
                startTime,
                endTime,
                studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : '' ,
                idToken,
                ...filters,
            })

            setSlots(response.data)
            setStartDate(startDate)
            setEndDate(endDate)
        } catch (error) {
            console.error("Failed to fetch slots for week:", error)
        }
    }

    const handleSlotClick = async (slotId: string) => {
        try {
            const response = await fetchSlotById(slotId, idToken)
            const slotDetails: SlotDetail = response.data
            setSelectedSlot(slotDetails)
            setIsModalOpen(true)
        } catch (error) {
            console.error("Failed to fetch slot details:", error)
        }
    }

    const handleWeekChange = (newWeekNumber: number) => {
        setWeekNumber(newWeekNumber)
        fetchSlotsForWeek(year, newWeekNumber)
    }

    const handleYearChange = (newYear: string) => {
        const yearNumber = Number.parseInt(newYear, 10)
        setYear(yearNumber)
        fetchSlotsForWeek(yearNumber, weekNumber)
    }

    const handleFilterChange = (name: string, value: string | string[] | Shift[] | SlotStatus[]) => {
        setFilters((prev) => ({
            ...prev,
            [name]: Array.isArray(value)
                ? value
                : prev[name as keyof typeof filters].includes(value)
                    ? (prev[name as keyof typeof filters] as string[]).filter((item) => item !== value)
                    : [...(prev[name as keyof typeof filters] as string[]), value],
        }))
    }

    const resetFilters = () => {
        setFilters({
            shifts: [],
            slotStatuses: [],
            instructorFirebaseIds: [],
            studentFirebaseId: "",
            classIds: [],
        })
        fetchSlotsForWeek(year, weekNumber)
    }

    const applyFilters = async () => {
        try {
            await fetchSlotsForWeek(year, weekNumber)
            setIsFilterModalOpen(false)
        } catch (error) {
            console.error("Error applying filters:", error)
        }
    }

    const navigate = useNavigate();

    return (
        <div className="scheduler-page p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Quay lại
                    </button>

                    <h1 className="title text-4xl font-bold text-center text-blue-800 flex items-center">
                        <Piano className="mr-2" /> Lịch học của Trung tâm học Piano
                    </h1>

                    <div className="current-user bg-gray-100 p-2 rounded shadow-md">
                        <p className="text-sm font-semibold">{currentAccount.email}</p>
                        <p className="text-xs text-gray-600">{currentAccount.fullName}</p>
                    </div>
                </div>
                <div className="controls flex flex-wrap justify-center mb-6 space-x-4">
                    <div className="control flex flex-col mb-4 sm:mb-0">
                        <span className="mb-1 font-semibold text-blue-700">Năm:</span>
                        <Select value={year.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => 2022 + i).map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="control flex flex-col">
                        <span className="mb-1 font-semibold text-blue-700">Tuần:</span>
                        <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select week" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                                    <SelectItem key={week} value={week.toString()}>
                                        Week {week}: {formatDateForDisplay(getWeekRange(year, week).startDate)} -{" "}
                                        {formatDateForDisplay(getWeekRange(year, week).endDate)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {role === 4 && (
                        <Button variant="outline" onClick={() => setIsFilterModalOpen(true)}>
                            <Filter className="mr-2 h-4 w-4" /> Bộ lọc
                        </Button>
                    )}
                </div>
                <div className="week-info flex justify-center items-center mb-4 space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeekChange(weekNumber - 1)}
                        disabled={weekNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-lg font-medium text-blue-700 flex items-center justify-center">
                        <Calendar className="mr-2" />
                        {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                    </p>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeekChange(weekNumber + 1)}
                        disabled={weekNumber >= 52}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="schedule-table w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                        <thead>
                        <tr className="bg-blue-600 text-white">
                            <th className="py-3 px-4 border-b border-blue-500">Time Slot</th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(startDate)
                                currentDay.setDate(currentDay.getDate() + i)
                                return (
                                    <th key={i} className="py-3 px-4 border-b border-blue-500 relative">
                                        {getVietnameseWeekday(currentDay)}
                                        {i < 6 && <div className="absolute right-0 top-0 bottom-0 w-px bg-blue-400"></div>}
                                    </th>
                                )
                            })}
                        </tr>
                        <tr className="bg-blue-100 text-blue-800">
                            <th className="py-2 px-4 border-b border-blue-200"></th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(startDate)
                                currentDay.setDate(currentDay.getDate() + i)
                                return (
                                    <th key={i} className="py-2 px-4 border-b border-blue-200 text-sm relative">
                                        {formatDateForDisplay(currentDay)}
                                        {i < 6 && <div className="absolute right-0 top-0 bottom-0 w-px bg-blue-300"></div>}
                                    </th>
                                )
                            })}
                        </tr>
                        </thead>
                        <tbody>
                        {shiftTimes.map((time: string, index: number) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                                <td className="time-slot py-4 px-2 font-semibold border-b border-blue-100">{time}</td>
                                {Array.from({ length: 7 }, (_, i) => {
                                    const currentDay = new Date(startDate)
                                    currentDay.setDate(currentDay.getDate() + i)
                                    const currentDayString = formatDateForAPI(currentDay)
                                    const slotForDateAndShift = slots.filter((slot: Slot) => {
                                        return slot.date === currentDayString && shiftTimesMap[slot.shift] === time
                                    })
                                    return (
                                        <td key={i} className="slot-cell border-b border-blue-100 p-2 relative">
                                            {slotForDateAndShift.length > 0 ? (
                                                slotForDateAndShift.map((slot: Slot, idx: number) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="slot bg-white rounded-lg shadow-md p-3 mb-2 cursor-pointer hover:shadow-lg transition-all duration-200"
                                                        onClick={() => handleSlotClick(slot.id)}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyPress={(e) => e.key === "Enter" && handleSlotClick(slot.id)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <div className="slot-room text-lg font-bold text-indigo-600 flex items-center">
                                                            <Music className="mr-1" size={16} />
                                                            {slot.room?.name}
                                                        </div>
                                                        <div className="slot-class text-md">{slot.class?.name}</div>

                                                        <div className="slot-status text-sm mt-1 text-blue-500">
                                                            {role === 1 && slot.status !== undefined
                                                                ? AttendanceStatus[slot.attendanceStatus!]
                                                                : SlotStatus[slot.status]}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="h-16 flex items-center justify-center text-gray-400">-</div>
                                            )}
                                            {i < 6 && <div className="absolute right-0 top-0 bottom-0 w-px bg-blue-100"></div>}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Chi tiết tiết học</DialogTitle>
                        </DialogHeader>
                        {selectedSlot && (
                            <div className="p-6 bg-white rounded-lg">
                                <div className="space-y-3">
                                    <p className="flex items-center">
                                        <strong className="mr-2">Phòng:</strong>{" "}
                                        <span className="text-indigo-600">{selectedSlot.room?.name}</span>
                                    </p>
                                    <p className="flex items-center">
                                        <strong className="mr-2">Lớp:</strong>{" "}
                                        <span className="text-green-600">{selectedSlot.class?.name}</span>
                                    </p>
                                    <p className="flex items-center">
                                        <strong className="mr-2">Tên giáo viên:</strong>{" "}
                                        <span className="text-green-600">{selectedSlot.class.instructorName}</span>
                                    </p>
                                    <p className="flex items-center">
                                        <strong className="mr-2">Sĩ số học sinh:</strong>{" "}
                                        <span className="text-orange-600">{selectedSlot.numberOfStudents}</span>
                                    </p>

                                    {role === 2 && (
                                        <Button
                                            onClick={() => (window.location.href = `/attendance/${selectedSlot.id}`)}
                                            disabled={!isCurrentDatePastSlotDate(selectedSlot.date)}
                                        >
                                            Check Attendance
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Filter Options</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Shifts</h3>
                                {uniqueShifts.map((value) => (
                                    <div key={value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`shift-${value}`}
                                            checked={filters.shifts.includes(value)}
                                            onCheckedChange={(checked) =>
                                                handleFilterChange(
                                                    "shifts",
                                                    checked ? [...filters.shifts, value] : filters.shifts.filter((s) => s !== value),
                                                )
                                            }
                                        />
                                        <label htmlFor={`shift-${value}`}>{shiftTimesMap[value as Shift]}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Slot Statuses</h3>
                                {uniqueSlotStatuses.map((value) => (
                                    <div key={value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`status-${value}`}
                                            checked={filters.slotStatuses.includes(value)}
                                            onCheckedChange={(checked) =>
                                                handleFilterChange(
                                                    "slotStatuses",
                                                    checked ? [...filters.slotStatuses, value] : filters.slotStatuses.filter((s) => s !== value),
                                                )
                                            }
                                        />
                                        <label htmlFor={`status-${value}`}>{SlotStatus[value as SlotStatus]}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Instructor Names</h3>
                                {uniqueInstructorIds.map((id) => (
                                    <div key={id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`instructor-${id}`}
                                            checked={filters.instructorFirebaseIds.includes(id)}
                                            onCheckedChange={(checked) =>
                                                handleFilterChange(
                                                    "instructorFirebaseIds",
                                                    checked
                                                        ? [...filters.instructorFirebaseIds, id]
                                                        : filters.instructorFirebaseIds.filter((i) => i !== id),
                                                )
                                            }
                                        />
                                        <label htmlFor={`instructor-${id}`}>{instructorMap.get(id) || "Unknown Instructor"}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Class Names</h3>
                                {uniqueClassIds.map((id) => (
                                    <div key={id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`class-${id}`}
                                            checked={filters.classIds.includes(id)}
                                            onCheckedChange={(checked) =>
                                                handleFilterChange(
                                                    "classIds",
                                                    checked ? [...filters.classIds, id] : filters.classIds.filter((c) => c !== id),
                                                )
                                            }
                                        />
                                        <label htmlFor={`class-${id}`}>{classMap.get(id) || "Unknown Class"}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={resetFilters}>
                                    Reset Filters
                                </Button>
                                <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </div>
    )
}

export default SchedulerPage
