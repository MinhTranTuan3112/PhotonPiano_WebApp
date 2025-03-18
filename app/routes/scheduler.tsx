import type React from "react"
import { useEffect, useState } from "react"
import { useLoaderData, useNavigate } from "@remix-run/react"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { getWeekRange } from "~/lib/utils/datetime"
import {fetchAttendanceStatus, fetchSlotById, fetchSlots} from "~/lib/services/scheduler"
import { motion } from "framer-motion"
import {Calendar, Music, Filter, ChevronLeft, ChevronRight} from "lucide-react"
import { getWeek } from "date-fns"
import {
    type Slot,
    Shift,
    type SlotDetail,
    AttendanceStatus,
    type StudentAttendanceModel,
    SlotStatus,
    AttendanceStatusText,
    SlotStatusText,
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
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [isLoading, setIsLoading] = useState(false);
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
        <div
            className="scheduler-page p-6 bg-gradient-to-b from-indigo-50 to-white min-h-screen"
            style={{
                backgroundImage: "url(/piano-keys-pattern.png)",
                backgroundSize: "cover",
                backgroundPosition: "bottom",
                backgroundOpacity: "0.1",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200"
                    >
                        Quay lại
                    </button>

                    <h1 className="title text-4xl font-bold text-center text-indigo-900 flex items-center">
                        <Music className="w-8 h-8 mr-2 text-indigo-800" /> Lịch học của Trung tâm học Piano
                    </h1>

                    <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="current-user bg-white/90 p-3 rounded-lg shadow-md backdrop-blur-sm w-full md:w-auto text-center">
                            <p className="text-sm font-semibold text-indigo-800">{currentAccount.email}</p>
                            <p className="text-xs text-indigo-600">{currentAccount.fullName}</p>
                        </div>
                    </div>
                </div>

                <div className="controls flex flex-wrap justify-center mb-6 space-x-4">
                    <div className="control flex flex-col mb-4 sm:mb-0">
                        <span className="mb-1 font-semibold text-indigo-800">Năm:</span>
                        <Select value={year.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[180px] bg-white/90 border-indigo-300 text-indigo-800 rounded-full shadow-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 backdrop-blur-sm border-indigo-200 rounded-lg shadow-lg">
                                {Array.from({ length: 5 }, (_, i) => 2022 + i).map((year) => (
                                    <SelectItem key={year} value={year.toString()} className="text-indigo-800 hover:bg-indigo-50">
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="control flex flex-col">
                        <span className="mb-1 font-semibold text-indigo-800">Tuần:</span>
                        <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
                            <SelectTrigger className="w-[180px] bg-white/90 border-indigo-300 text-indigo-800 rounded-full shadow-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select week" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 backdrop-blur-sm border-indigo-200 rounded-lg shadow-lg">
                                {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                                    <SelectItem key={week} value={week.toString()} className="text-indigo-800 hover:bg-indigo-50">
                                        Week {week}: {formatDateForDisplay(getWeekRange(year, week).startDate)} -{" "}
                                        {formatDateForDisplay(getWeekRange(year, week).endDate)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {role === 4 && (
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200"
                        >
                            <Filter className="mr-2 h-4 w-4" /> Bộ lọc
                        </Button>
                    )}
                </div>

                <div className="week-info flex justify-center items-center mb-4 space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeekChange(weekNumber - 1)}
                        disabled={weekNumber <= 1 || isLoading}
                        className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 rounded-full shadow-md transition-all duration-200"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <p className="text-lg font-medium text-indigo-800 flex items-center justify-center">
                        <Calendar className="mr-2 w-5 h-5" />
                        {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                    </p>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeekChange(weekNumber + 1)}
                        disabled={weekNumber >= 52 || isLoading}
                        className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 rounded-full shadow-md transition-all duration-200"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="schedule-table w-full border-collapse bg-white/90 shadow-lg rounded-lg overflow-hidden backdrop-blur-sm">
                        <thead>
                        <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <th className="py-3 px-4 border-b border-indigo-500 w-24 text-center">Time Slot</th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(startDate);
                                currentDay.setDate(currentDay.getDate() + i);
                                return (
                                    <th key={i} className="py-3 px-4 border-b border-indigo-500 min-w-[150px] text-center relative">
                                        {getVietnameseWeekday(currentDay)}
                                        {i < 6 && <div className="absolute right-0 top-0 bottom-0 w-px bg-indigo-400"></div>}
                                    </th>
                                );
                            })}
                        </tr>
                        <tr className="bg-indigo-100 text-indigo-800">
                            <th className="py-2 px-4 border-b border-indigo-200"></th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(startDate);
                                currentDay.setDate(currentDay.getDate() + i);
                                return (
                                    <th key={i} className="py-2 px-4 border-b border-indigo-200 text-sm text-center relative">
                                        {formatDateForDisplay(currentDay)}
                                        {i < 6 && <div className="absolute right-0 top-0 bottom-0 w-px bg-indigo-300"></div>}
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>
                        <tbody>
                        {shiftTimes.map((time, index) => (
                            <tr key={index} className="hover:bg-indigo-50/50 transition-colors duration-150">
                                <td className="time-slot py-4 px-4 font-semibold border-b border-indigo-100 text-center">{time}</td>
                                {Array.from({ length: 7 }, (_, i) => {
                                    const currentDay = new Date(startDate);
                                    currentDay.setDate(currentDay.getDate() + i);
                                    const currentDayString = formatDateForAPI(currentDay);
                                    const slotForDateAndShift = slots.filter((slot) => {
                                        return slot.date === currentDayString && shiftTimesMap[slot.shift] === time;
                                    });
                                    return (
                                        <td key={i} className="slot-cell border-b border-indigo-100 p-4 relative min-h-[120px]">
                                            {slotForDateAndShift.length > 0 ? (
                                                slotForDateAndShift.map((slot, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="slot bg-white/95 rounded-lg shadow-md p-3 mb-2 cursor-pointer hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
                                                        onClick={() => handleSlotClick(slot.id)}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyPress={(e) => e.key === "Enter" && handleSlotClick(slot.id)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <div className="slot-room text-lg font-bold text-indigo-600 flex items-center">
                                                            <Music className="mr-1 w-5 h-5" />
                                                            {slot.room?.name}
                                                        </div>
                                                        <div className="slot-class text-md text-indigo-800">{slot.class?.name}</div>
                                                        <div className="slot-status text-sm mt-1 text-indigo-500">
                                                            {role === 1 && slot.status !== undefined
                                                                ? AttendanceStatusText[slot.attendanceStatus]
                                                                : SlotStatusText[slot.status]}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="h-16 flex items-center justify-center text-gray-400">-</div>
                                            )}
                                            {i < 6 && <div className="absolute right-0 top-0 bottom-0 w-px bg-indigo-100"></div>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-indigo-900">Chi tiết tiết học</DialogTitle>
                        </DialogHeader>
                        {selectedSlot && (
                            <div className="p-6">
                                <div className="space-y-3">
                                    <p className="flex items-center text-indigo-800">
                                        <strong className="mr-2">Phòng:</strong>{" "}
                                        <span className="text-indigo-600">{selectedSlot.room?.name}</span>
                                    </p>
                                    <p className="flex items-center text-indigo-800">
                                        <strong className="mr-2">Lớp:</strong>{" "}
                                        <span className="text-indigo-600">{selectedSlot.class?.name}</span>
                                    </p>
                                    <p className="flex items-center text-indigo-800">
                                        <strong className="mr-2">Tên giáo viên:</strong>{" "}
                                        <span className="text-indigo-600">{selectedSlot.class.instructorName}</span>
                                    </p>
                                    <p className="flex items-center text-indigo-800">
                                        <strong className="mr-2">Sĩ số học sinh:</strong>{" "}
                                        <span className="text-indigo-600">{selectedSlot.numberOfStudents}</span>
                                    </p>
                                    {role === 1 && selectedSlot.slotStudents && (
                                        <>
                                            {selectedSlot.slotStudents
                                                .filter(
                                                    (student) =>
                                                        student.studentFirebaseId.toLowerCase() ===
                                                        currentAccount.accountFirebaseId?.toLowerCase()
                                                )
                                                .map((student, index) => (
                                                    <div key={index} className="space-y-2">
                                                        {student.gestureComment && (
                                                            <p className="flex items-center text-indigo-800">
                                                                <strong className="mr-2">Nhận xét tư thế:</strong>{" "}
                                                                <span className="text-indigo-600">{student.gestureComment}</span>
                                                            </p>
                                                        )}
                                                        {student.fingerNoteComment && (
                                                            <p className="flex items-center text-indigo-800">
                                                                <strong className="mr-2">Nhận xét ngón tay:</strong>{" "}
                                                                <span className="text-indigo-600">{student.fingerNoteComment}</span>
                                                            </p>
                                                        )}
                                                        {student.pedalComment && (
                                                            <p className="flex items-center text-indigo-800">
                                                                <strong className="mr-2">Nhận xét pedal:</strong>{" "}
                                                                <span className="text-indigo-600">{student.pedalComment}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                        </>
                                    )}
                                    {role === 2 && (
                                        <Button
                                            onClick={() => (window.location.href = `/attendance/${selectedSlot.id}`)}
                                            disabled={!isCurrentDatePastSlotDate(selectedSlot.date)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200"
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
                    <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-indigo-900">Tùy chọn bộ lọc</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2 text-indigo-800">Ca</h3>
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
                                            className="text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`shift-${value}`} className="text-indigo-800">{shiftTimesMap[value]}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 text-indigo-800">Trạng thái tiết học</h3>
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
                                            className="text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`status-${value}`} className="text-indigo-800">{SlotStatusText[value]}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 text-indigo-800">Tên giảng viên</h3>
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
                                            className="text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`instructor-${id}`} className="text-indigo-800">
                                            {instructorMap.get(id) || "Unknown Instructor"}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 text-indigo-800">Tên lớp</h3>
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
                                            className="text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`class-${id}`} className="text-indigo-800">
                                            {classMap.get(id) || "Unknown Class"}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={resetFilters}
                                    className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-full transition-all duration-200"
                                >
                                    Thiết lập lại
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-full transition-all duration-200"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={applyFilters}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200"
                                >
                                    Xác nhận 
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </div>
    );
};

export default SchedulerPage;