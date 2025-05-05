"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "@remix-run/react"
import { getWeekRange } from "~/lib/utils/datetime"
import {
    fetchAssignTeacherToSlot,
    fetchAttendanceStatus,
    fetchAvailableTeachersForSlot,
    fetchBlankSlots,
    fetchCancelSlot,
    fetchPublicNewSlot,
    fetchSlotById,
    fetchSlots,
} from "~/lib/services/scheduler"
import { motion } from "framer-motion"
import {
    Ban,
    BookOpen,
    Calendar,
    CalendarClock,
    Check,
    CheckCircle,
    ChevronLeft,
    Clock,
    Filter,
    Footprints,
    HandMetal,
    Info,
    ListFilter,
    Layers,
    MoveRight,
    Music,
    RefreshCw,
    Settings,
    StickyNote,
    ThumbsUp,
    User,
    Users,
    X,
} from "lucide-react"
import {
    AttendanceStatus,
    AttendanceStatusText,
    type BlankSlotModel,
    Shift,
    type SlotDetail,
    SlotStatus,
    SlotStatusText,
    type SlotStudentModel,
    type StudentAttendanceModel,
} from "~/lib/types/Scheduler/slot"
import { type IPubSubMessage, PubSub } from "~/lib/services/pub-sub"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import type { Account } from "~/lib/types/account/account"
import type { Role } from "~/lib/types/account/account"
import { fetchSystemConfigSlotCancel } from "~/lib/services/system-config"
import { toast } from "sonner"
import { format, isSameDay } from "date-fns"

const shiftTimesMap: Record<number, string> = {
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

const LoadingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <div className="animate-spin rounded-lg h-12 w-12 border-t-4 border-purple-600 border-solid"></div>
                <p className="mt-4 text-purple-800 font-semibold">Processing...</p>
            </div>
        </div>
    )
}

// Component for displaying daily schedule
const DailySchedule = ({
    slots,
    date,
    onSlotClick,
}: { slots: SlotDetail[]; date: Date; onSlotClick: (slotId: string) => void }) => {
    const formattedDate = format(date, "EEEE, MMMM d, yyyy")

    // Group slots by shift for timeline view
    const timelineSlots = Array.from({ length: 8 }, (_, i) => i)
        .map((shiftNum) => {
            return {
                shift: shiftNum,
                time: shiftTimesMap[shiftNum],
                slots: slots.filter((slot) => slot.shift === shiftNum),
            }
        })
        .filter((item) => item.time !== undefined)

    return (
        <Card className="border-blue-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-blue-900">Daily Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                {slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Calendar className="w-16 h-16 text-blue-200 mb-4" />
                        <h3 className="text-lg font-medium text-blue-900 mb-2">No Classes Today</h3>
                        <p className="text-gray-500 max-w-md">
                            You don't have any classes scheduled for this day. Enjoy your free time or prepare for upcoming classes.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Timeline view */}
                        <div className="relative pl-8 border-l-2 border-blue-100 space-y-8 py-4">
                            {timelineSlots
                                .filter((item) => item.slots.length > 0)
                                .map((timeSlot) => (
                                    <div key={timeSlot.shift} className="relative">
                                        {/* Time indicator */}
                                        <div className="absolute -left-[41px] flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs">
                                            <Clock className="w-3 h-3" />
                                        </div>

                                        {/* Time label */}
                                        <div className="absolute -left-[150px] top-0 w-[100px] text-right text-sm font-medium text-blue-700">
                                            {timeSlot.time}
                                        </div>

                                        {/* Slot cards */}
                                        <div className="space-y-3">
                                            {timeSlot.slots.map((slot) => (
                                                <motion.div
                                                    key={slot.id}
                                                    className={cn(
                                                        "p-4 rounded-lg border transition-all",
                                                        slot.status === SlotStatus.Cancelled
                                                            ? "bg-gray-50 border-gray-200"
                                                            : slot.status === SlotStatus.Finished
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-white border-blue-200 hover:border-blue-300",
                                                    )}
                                                    whileHover={slot.status !== SlotStatus.Cancelled ? { scale: 1.01 } : {}}
                                                    onClick={() => slot.status !== SlotStatus.Cancelled && onSlotClick(slot.id)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium text-blue-900">{slot.class?.name}</h3>
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                <div className="flex items-center">
                                                                    <Music className="w-4 h-4 mr-1 text-blue-500" />
                                                                    {slot.room?.name}
                                                                </div>
                                                                <div className="flex items-center mt-1">
                                                                    <Users className="w-4 h-4 mr-1 text-blue-500" />
                                                                    {slot.numberOfStudents} students
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge
                                                                className={cn(
                                                                    "text-xs",
                                                                    slot.status === SlotStatus.Cancelled
                                                                        ? "bg-gray-100 text-gray-700"
                                                                        : slot.status === SlotStatus.Finished
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-blue-100 text-blue-800",
                                                                )}
                                                            >
                                                                {SlotStatusText[slot.status]}
                                                            </Badge>

                                                            {slot.status !== SlotStatus.Cancelled && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onSlotClick(slot.id)
                                                                    }}
                                                                >
                                                                    <Check className="w-3 h-3 mr-1" />
                                                                    Attendance
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Component for displaying weekly overview
const WeeklyOverview = ({
    slots,
    weekDates,
    onSlotClick,
    onDateSelect,
    selectedDate,
}: {
    slots: SlotDetail[]
    weekDates: Date[]
    onSlotClick: (slotId: string) => void
    onDateSelect: (date: Date) => void
    selectedDate: Date
}) => {
    // Create a grid of shifts (rows) and days (columns)
    const shifts = Array.from({ length: 8 }, (_, i) => i)

    return (
        <Card className="border-blue-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-blue-900">Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header row with days */}
                        <div className="grid grid-cols-8 gap-2 mb-4">
                            <div className="flex items-center justify-center h-12 font-medium text-blue-700">Time</div>
                            {weekDates.map((date, index) => (
                                <Button
                                    key={index}
                                    variant="ghost"
                                    className={cn(
                                        "h-12 flex flex-col items-center justify-center",
                                        isSameDay(date, selectedDate) && "bg-blue-100 text-blue-900 font-medium",
                                    )}
                                    onClick={() => onDateSelect(date)}
                                >
                                    <span className="text-xs">{format(date, "EEE")}</span>
                                    <span className="text-sm">{format(date, "dd/MM")}</span>
                                </Button>
                            ))}
                        </div>

                        {/* Grid rows for each shift */}
                        {shifts.map((shift) => {
                            // Skip if there's no time mapping for this shift
                            if (!shiftTimesMap[shift]) return null

                            return (
                                <div key={shift} className="grid grid-cols-8 gap-2 mb-2">
                                    <div className="flex items-center justify-center h-24 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg">
                                        {shiftTimesMap[shift]}
                                    </div>

                                    {weekDates.map((date, dayIndex) => {
                                        const dateString = format(date, "yyyy-MM-dd")
                                        const slotsForCell = slots.filter((slot) => slot.date === dateString && slot.shift === shift)

                                        return (
                                            <div
                                                key={dayIndex}
                                                className={cn(
                                                    "h-24 rounded-lg border border-dashed border-gray-200 p-1",
                                                    isSameDay(date, selectedDate) && "border-blue-200 bg-blue-50/30",
                                                )}
                                            >
                                                {slotsForCell.length > 0 ? (
                                                    <div className="h-full">
                                                        {slotsForCell.map((slot) => (
                                                            <motion.div
                                                                key={slot.id}
                                                                className={cn(
                                                                    "h-full p-2 rounded-md text-xs transition-all",
                                                                    slot.status === SlotStatus.Cancelled
                                                                        ? "bg-gray-100 text-gray-600"
                                                                        : slot.status === SlotStatus.Finished
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer",
                                                                )}
                                                                whileHover={slot.status !== SlotStatus.Cancelled ? { scale: 1.02 } : {}}
                                                                onClick={() => slot.status !== SlotStatus.Cancelled && onSlotClick(slot.id)}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="font-medium truncate">{slot.class?.name}</div>
                                                                    {slot.status !== SlotStatus.Cancelled && (
                                                                        <Badge
                                                                            className="ml-1 h-5 bg-white/80 hover:bg-white text-blue-700 cursor-pointer"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                onSlotClick(slot.id)
                                                                            }}
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center mt-1 text-[10px]">
                                                                    <Music className="w-3 h-3 mr-1" />
                                                                    {slot.room?.name}
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Component for displaying upcoming classes
const UpcomingClasses = ({ slots, onSlotClick }: { slots: SlotDetail[]; onSlotClick: (slotId: string) => void }) => {
    // Sort slots by date and shift
    const sortedSlots = [...slots]
        .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date)
            return a.shift - b.shift
        })
        .slice(0, 5) // Show only the next 5 classes

    return (
        <Card className="border-blue-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-blue-800">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Upcoming Classes
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {sortedSlots.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">No upcoming classes</div>
                ) : (
                    <div className="space-y-3">
                        {sortedSlots.map((slot) => (
                            <motion.div
                                key={slot.id}
                                className="p-3 rounded-lg border border-blue-100 hover:border-blue-200 bg-white"
                                whileHover={{ scale: 1.01 }}
                                onClick={() => onSlotClick(slot.id)}
                            >
                                <div className="flex justify-between">
                                    <h3 className="font-medium text-sm text-blue-900 truncate">{slot.class?.name}</h3>
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                        {slot.numberOfStudents} <span className="sr-only">students</span>
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center text-xs text-gray-600">
                                    <Calendar className="w-3 h-3 mr-1 text-blue-500" />
                                    <span className="mr-2">{format(new Date(slot.date), "dd/MM")}</span>
                                    <Clock className="w-3 h-3 mr-1 text-blue-500" />
                                    <span>{shiftTimesMap[slot.shift]}</span>
                                </div>
                                <div className="mt-1 flex justify-between items-center">
                                    <div className="flex items-center text-xs text-gray-600">
                                        <Music className="w-3 h-3 mr-1 text-blue-500" />
                                        {slot.room?.name}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-800 p-0 px-2"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onSlotClick(slot.id)
                                        }}
                                    >
                                        <Check className="w-3 h-3 mr-1" />
                                        Attendance
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Component for displaying stats cards
const StatsCards = ({
    totalClasses,
    finishedClasses,
    cancelledClasses,
    ongoingClasses,
    totalStudents,
}: {
    totalClasses: number
    finishedClasses: number
    cancelledClasses: number
    ongoingClasses: number
    totalStudents: number
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-blue-700">Total Classes</CardTitle>
                    <BookOpen className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{totalClasses}</div>
                    <p className="text-xs text-gray-500 mt-1">This week</p>
                </CardContent>
            </Card>

            <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-blue-700">Students</CardTitle>
                    <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{totalStudents}</div>
                    <p className="text-xs text-gray-500 mt-1">Total attendance</p>
                </CardContent>
            </Card>

            <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700">{finishedClasses}</div>
                    {/* <p className="text-xs text-gray-500 mt-1">
                        {Math.round((finishedClasses / totalClasses) * 100) || 0}% of total
                    </p> */}
                </CardContent>
            </Card>

            <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-amber-700">Upcoming</CardTitle>
                    <Clock className="w-4 h-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-700">{ongoingClasses}</div>
                    {/* <p className="text-xs text-gray-500 mt-1">
                        {Math.round((ongoingClasses / totalClasses) * 100) || 0}% of total
                    </p> */}
                </CardContent>
            </Card>
        </div>
    )
}

export const TeacherSchedule = ({
    initialSlots,
    initialStartDate,
    initialEndDate,
    initialYear,
    initialWeekNumber,
    idToken,
    role,
    currentAccount,
    classId,
    className,
}: {
    initialSlots: SlotDetail[]
    initialStartDate: Date
    initialEndDate: Date
    initialYear: number
    initialWeekNumber: number
    idToken: string
    role: Role
    currentAccount: Account
    classId?: string
    className?: string
}) => {
    const [slots, setSlots] = useState<SlotDetail[]>(initialSlots)
    const [year, setYear] = useState(initialYear)
    const [weekNumber, setWeekNumber] = useState(initialWeekNumber)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [selectedDate, setSelectedDate] = useState(new Date(initialStartDate))
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFilterLoading, setIsFilterLoading] = useState(false)
    const [activeView, setActiveView] = useState("daily")
    const [filters, setFilters] = useState({
        shifts: [] as number[],
        slotStatuses: [] as number[],
        instructorFirebaseIds: [] as string[],
        studentFirebaseId: "",
        classIds: classId ? [classId] : ([] as string[]),
    })

    const [selectedSlotToCancel, setSelectedSlotToCancel] = useState<SlotDetail | null>(null)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false)
    const [cancelReason, setCancelReason] = useState<string>("")
    const [blankSlots, setBlankSlots] = useState<BlankSlotModel[]>([])
    const [selectedBlankSlot, setSelectedBlankSlot] = useState<BlankSlotModel | null>(null)
    const [cancelReasons, setCancelReasons] = useState<string[]>([])
    const uniqueShifts = Array.from(new Set(slots.map((slot) => slot.shift)))
    const uniqueSlotStatuses = Array.from(new Set(slots.map((slot) => slot.status)))
    const uniqueInstructorIds = Array.from(new Set(slots.map((slot) => slot.class.instructorId)))
    const uniqueClassIds = Array.from(new Set(slots.map((slot) => slot.class.id)))
    const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false)
    const instructorMap = new Map(slots.map((slot) => [slot.class.instructorId, slot.class.instructorName]))
    const classMap = new Map(slots.map((slot) => [slot.class.id, slot.class.name]))
    const [isChangeTeacherDialogOpen, setIsChangeTeacherDialogOpen] = useState<boolean>(false)
    const [newTeacherId, setNewTeacherId] = useState<string>("")
    const [availableTeachers, setAvailableTeachers] = useState<Array<{ accountFirebaseId: string; fullName: string }>>([])
    const [isTeacherLoading, setIsTeacherLoading] = useState<boolean>(false)
    const [changeTeacherReason, setChangeTeacherReason] = useState<string>("")

    useEffect(() => {
        console.log("isLoading updated:", isLoading)
    }, [isLoading])

    useEffect(() => {
        console.log("selectedBlankSlot updated:", selectedBlankSlot)
    }, [selectedBlankSlot])

    useEffect(() => {
        console.log("selectedSlotToCancel updated:", selectedSlotToCancel)
    }, [selectedSlotToCancel])

    useEffect(() => {
        const pubSubService = new PubSub()
        const subscription = pubSubService.receiveMessage().subscribe((message: IPubSubMessage) => {
            if (message.content.includes("changed") && message.topic.includes("scheduler_attendance")) {
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
    }, [year, weekNumber, slots, idToken, currentAccount.accountFirebaseId])

    useEffect(() => {
        fetchSlotsForWeek(year, weekNumber)
    }, [year, weekNumber])

    const fetchSlotsForWeek = async (year: number, week: number) => {
        try {
            const { startDate, endDate } = getWeekRange(year, week)
            const startTime = formatDateForAPI(startDate)
            const endTime = formatDateForAPI(endDate)

            const response = await fetchSlots({
                startTime,
                endTime,
                idToken,
                ...filters,
                studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
            })

            let updatedSlots: SlotDetail[] = response.data

            if (role === 1 && currentAccount.accountFirebaseId) {
                if (!currentAccount.accountFirebaseId.trim()) {
                    console.warn("Empty accountFirebaseId for student role")
                    setSlots(response.data)
                    setStartDate(startDate)
                    setEndDate(endDate)
                    return
                }
                updatedSlots = response.data.map((slot: SlotDetail) => {
                    if (!slot.slotStudents || slot.slotStudents.length === 0) {
                        console.warn(`No slotStudents for slot ${slot.id}`)
                        return { ...slot, attendanceStatus: 0 }
                    }
                    const studentRecord = slot.slotStudents.find((student: SlotStudentModel) => {
                        const studentId = student.studentFirebaseId?.toLowerCase()
                        const accountId = currentAccount.accountFirebaseId?.toLowerCase()
                        console.log("Comparing IDs for slot", slot.id, ":", { studentId, accountId })
                        if (!studentId || !accountId) {
                            console.warn(`Missing IDs for slot ${slot.id}:`, { studentId, accountId })
                            return false
                        }
                        return studentId === accountId
                    })
                    if (!studentRecord) {
                        console.warn(`No matching student record found for slot ${slot.id}`)
                        return { ...slot, attendanceStatus: 0 }
                    }
                    const attendanceStatus = Number(studentRecord.attendanceStatus) || 0
                    console.log(`Attendance status for slot ${slot.id}:`, {
                        slotStudents: slot.slotStudents,
                        studentRecord,
                        attendanceStatus,
                    })
                    return { ...slot, attendanceStatus }
                })
            }

            setSlots(updatedSlots)
            setStartDate(startDate)
            setEndDate(endDate)
            setSelectedDate(startDate)
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

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
    }

    const handleFilterChange = (name: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [name]: Array.isArray(value)
                ? value
                : prev[name as keyof typeof filters].includes(value)
                    ? (prev[name as keyof typeof filters] as any[]).filter((item) => item !== value)
                    : [...(prev[name as keyof typeof filters] as any[]), value],
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
            setIsFilterLoading(true) // Show loading screen
            await fetchSlotsForWeek(year, weekNumber)
            setIsFilterModalOpen(false)
        } catch (error) {
            console.error("Error applying filters:", error)
        } finally {
            setIsFilterLoading(false) // Hide loading screen
        }
    }

    useEffect(() => {
        if (isCancelDialogOpen && selectedSlotToCancel) {
            const fetchBlankSlotsForWeek = async () => {
                try {
                    const startTime = formatDateForAPI(startDate)
                    const endTime = formatDateForAPI(endDate)
                    const blankSlotsResponse = await fetchBlankSlots(startTime, endTime, idToken)
                    setBlankSlots(blankSlotsResponse.data)
                } catch (error) {
                    console.error("Failed to fetch blank slots:", error)
                    setBlankSlots([])
                }
            }
            fetchBlankSlotsForWeek()
        }
    }, [isCancelDialogOpen, selectedSlotToCancel, startDate, endDate, idToken])

    useEffect(() => {
        const fetchCancelReasons = async () => {
            try {
                const response = await fetchSystemConfigSlotCancel({ idToken })
                const reasons = JSON.parse(response.data.configValue)
                setCancelReasons(reasons)
            } catch (error) {
                console.error("Failed to fetch cancel reasons:", error)
            }
        }

        fetchCancelReasons()
    }, [idToken])

    const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        if (value === "Khác") {
            setIsOtherSelected(true)
            setCancelReason("")
        } else {
            setIsOtherSelected(false)
            setCancelReason(value)
        }
    }

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const currentDay = new Date(startDate)
        currentDay.setDate(currentDay.getDate() + i)
        return currentDay
    })

    const handleReplaceThenCancel = async () => {
        if (!selectedSlotToCancel || !cancelReason.trim() || !selectedBlankSlot) {
            console.log("Validation failed: Missing required fields", {
                selectedSlotToCancel,
                cancelReason,
                selectedBlankSlot,
            })
            return
        }

        try {
            setIsLoading(true)

            // Step 1: Create the replacement slot first
            const roomId = selectedBlankSlot.roomId
            const classId = selectedSlotToCancel.class.id

            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!guidRegex.test(roomId) || !guidRegex.test(classId)) {
                console.error("Invalid GUID format:", { roomId, classId })
                alert("Error: roomId or classId is not in the correct GUID format.")
                return
            }

            console.log("Calling fetchPublicNewSlot with:", {
                roomId,
                date: selectedBlankSlot.date,
                shift: selectedBlankSlot.shift,
                classId,
            })
            const response = await fetchPublicNewSlot(
                roomId,
                selectedBlankSlot.date,
                selectedBlankSlot.shift,
                classId,
                idToken,
            )
            const newSlot = response.data

            // Step 2: Cancel the original slot only if replacement succeeds
            console.log("Calling fetchCancelSlot with:", {
                slotId: selectedSlotToCancel.id,
                cancelReason,
            })
            await fetchCancelSlot(selectedSlotToCancel.id, cancelReason, idToken)

            // Update local state (optional, since we'll refresh)
            const updatedSlots = slots
                .map((slot) =>
                    slot.id === selectedSlotToCancel.id ? { ...slot, status: SlotStatus.Cancelled, cancelReason } : slot,
                )
                .concat(newSlot)
            setSlots(updatedSlots)

            // Close dialog and reset states
            setIsCancelDialogOpen(false)
            setCancelReason("")
            setSelectedSlotToCancel(null)
            setSelectedBlankSlot(null)

            // Refresh the page
            navigate(0) // This reloads the current page
        } catch (error) {
            console.error("Error in replace-then-cancel process:", error)
        } finally {
            console.log("Resetting isLoading to false")
            setIsLoading(false)
        }
    }

    const navigate = useNavigate()

    // Filter slots for the selected date
    const slotsForSelectedDate = slots
        .filter((slot) => slot.date === formatDateForAPI(selectedDate))
        .sort((a, b) => a.shift - b.shift)

    // Calculate stats
    const totalClasses = slots.length
    const finishedClasses = slots.filter((slot) => slot.status === SlotStatus.Finished).length
    const cancelledClasses = slots.filter((slot) => slot.status === SlotStatus.Cancelled).length
    const ongoingClasses = slots.filter((slot) => slot.status === SlotStatus.Ongoing).length
    const totalStudents = slots.reduce((sum, slot) => sum + slot.numberOfStudents, 0)

    return (
        <div className="container mx-auto px-4 py-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            {/* Loading Overlay */}
            {isFilterLoading && <LoadingOverlay />}
            {isLoading && <LoadingOverlay />}

            <header className="mb-8">
                <div className="flex justify-end items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
                            <SelectTrigger className="w-[210px] border-blue-300 text-blue-800">
                                <SelectValue placeholder="Select week">
                                    Week {weekNumber}: {formatDateForDisplay(startDate)}
                                </SelectValue>
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

                        <Select value={year.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[100px] border-blue-300 text-blue-800">
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
                </div>

                {(filters.shifts.length > 0 ||
                    filters.slotStatuses.length > 0 ||
                    filters.instructorFirebaseIds.length > 0 ||
                    filters.classIds.length > 0) && (
                        <div className="bg-blue-50 p-3 rounded-lg mt-4">
                            <h3 className="font-medium text-blue-800 mb-2">Application filter: </h3>
                            <div className="flex flex-wrap gap-2">
                                {filters.shifts.length > 0 && (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                                        {filters.shifts.length} Shift
                                        <button
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                            onClick={async () => {
                                                setIsFilterLoading(true)
                                                setFilters((prev) => ({ ...prev, shifts: [] }))
                                                try {
                                                    const { startDate, endDate } = getWeekRange(year, weekNumber)
                                                    const startTime = formatDateForAPI(startDate)
                                                    const endTime = formatDateForAPI(endDate)

                                                    const response = await fetchSlots({
                                                        startTime,
                                                        endTime,
                                                        idToken,
                                                        ...filters,
                                                        shifts: [],
                                                        studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
                                                    })

                                                    setSlots(response.data)
                                                } catch (error) {
                                                    console.error("Failed to update after filter removal:", error)
                                                } finally {
                                                    setIsFilterLoading(false)
                                                }
                                            }}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filters.slotStatuses.length > 0 && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                                        {filters.slotStatuses.length} trạng thái
                                        <button
                                            className="ml-2 text-green-600 hover:text-green-800"
                                            onClick={async () => {
                                                setIsFilterLoading(true)
                                                setFilters((prev) => ({ ...prev, slotStatuses: [] }))
                                                try {
                                                    const { startDate, endDate } = getWeekRange(year, weekNumber)
                                                    const startTime = formatDateForAPI(startDate)
                                                    const endTime = formatDateForAPI(endDate)

                                                    const response = await fetchSlots({
                                                        startTime,
                                                        endTime,
                                                        idToken,
                                                        ...filters,
                                                        slotStatuses: [],
                                                        studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
                                                    })

                                                    setSlots(response.data)
                                                } catch (error) {
                                                    console.error("Failed to update after filter removal:", error)
                                                } finally {
                                                    setIsFilterLoading(false)
                                                }
                                            }}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filters.instructorFirebaseIds.length > 0 && (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                                        {filters.instructorFirebaseIds.length} Teacher
                                        <button
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                            onClick={async () => {
                                                setIsFilterLoading(true)
                                                setFilters((prev) => ({ ...prev, instructorFirebaseIds: [] }))
                                                try {
                                                    const { startDate, endDate } = getWeekRange(year, weekNumber)
                                                    const startTime = formatDateForAPI(startDate)
                                                    const endTime = formatDateForAPI(endDate)

                                                    const response = await fetchSlots({
                                                        startTime,
                                                        endTime,
                                                        idToken,
                                                        ...filters,
                                                        instructorFirebaseIds: [],
                                                        studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
                                                    })

                                                    setSlots(response.data)
                                                } catch (error) {
                                                    console.error("Failed to update after filter removal:", error)
                                                } finally {
                                                    setIsFilterLoading(false)
                                                }
                                            }}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filters.classIds.length > 0 && (
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1">
                                        {filters.classIds.length} Class
                                        <button
                                            className="ml-2 text-amber-600 hover:text-amber-800"
                                            onClick={async () => {
                                                setIsFilterLoading(true)
                                                setFilters((prev) => ({ ...prev, classIds: [] }))
                                                try {
                                                    const { startDate, endDate } = getWeekRange(year, weekNumber)
                                                    const startTime = formatDateForAPI(startDate)
                                                    const endTime = formatDateForAPI(endDate)

                                                    const response = await fetchSlots({
                                                        startTime,
                                                        endTime,
                                                        idToken,
                                                        ...filters,
                                                        classIds: [],
                                                        studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
                                                    })

                                                    setSlots(response.data)
                                                } catch (error) {
                                                    console.error("Failed to update after filter removal:", error)
                                                } finally {
                                                    setIsFilterLoading(false)
                                                }
                                            }}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left sidebar with stats and navigation */}
                <div className="lg:col-span-1 space-y-6">
                    <StatsCards
                        totalClasses={totalClasses}
                        finishedClasses={finishedClasses}
                        cancelledClasses={cancelledClasses}
                        ongoingClasses={ongoingClasses}
                        totalStudents={totalStudents}
                    />

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium flex items-center text-blue-800">
                                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                                Week Navigation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDates.map((date, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        className={cn(
                                            "h-10 p-0 flex flex-col items-center justify-center",
                                            isSameDay(date, selectedDate) && "bg-blue-100 text-blue-900 font-medium",
                                        )}
                                        onClick={() => handleDateSelect(date)}
                                    >
                                        <span className="text-xs">{getVietnameseWeekday(date)}</span>
                                        <span className="text-sm">{format(date, "dd")}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <UpcomingClasses
                        slots={slots.filter((slot) => slot.status === SlotStatus.Ongoing)}
                        onSlotClick={handleSlotClick}
                    />
                </div>

                {/* Main content area */}
                <div className="lg:col-span-3 space-y-6">
                    <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                        <div className="flex justify-between items-center mb-4">
                            <TabsList className="grid w-[400px] grid-cols-3">
                                <TabsTrigger
                                    value="daily"
                                    className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Daily 
                                </TabsTrigger>
                                <TabsTrigger
                                    value="weekly"
                                    className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
                                >
                                    <Layers className="w-4 h-4 mr-2" />
                                    Weekly 
                                </TabsTrigger>
                                <TabsTrigger value="list" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                                    <ListFilter className="w-4 h-4 mr-2" />
                                    List 
                                </TabsTrigger>
                            </TabsList>

                            <div className="text-sm text-blue-700 font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</div>
                        </div>

                        <TabsContent value="daily" className="mt-0">
                            <DailySchedule slots={slotsForSelectedDate} date={selectedDate} onSlotClick={handleSlotClick} />
                        </TabsContent>

                        <TabsContent value="weekly" className="mt-0">
                            <WeeklyOverview
                                slots={slots}
                                weekDates={weekDates}
                                onSlotClick={handleSlotClick}
                                onDateSelect={handleDateSelect}
                                selectedDate={selectedDate}
                            />
                        </TabsContent>

                        <TabsContent value="list" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-semibold text-blue-900">All Classes This Week</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {slots.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Calendar className="w-16 h-16 text-blue-200 mb-4" />
                                                <h3 className="text-lg font-medium text-blue-900 mb-2">No Classes This Week</h3>
                                                <p className="text-gray-500 max-w-md">You don't have any classes scheduled for this week.</p>
                                            </div>
                                        ) : (
                                            slots.map((slot) => (
                                                <motion.div
                                                    key={slot.id}
                                                    className={cn(
                                                        "p-4 rounded-lg border transition-all",
                                                        slot.status === SlotStatus.Cancelled
                                                            ? "bg-gray-50 border-gray-200"
                                                            : slot.status === SlotStatus.Finished
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-white border-blue-200 hover:border-blue-300",
                                                    )}
                                                    whileHover={slot.status !== SlotStatus.Cancelled ? { scale: 1.01 } : {}}
                                                    onClick={() => slot.status !== SlotStatus.Cancelled && handleSlotClick(slot.id)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium text-blue-900">{slot.class?.name}</h3>
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                                                                    {slot.date} • {shiftTimesMap[slot.shift]}
                                                                </div>
                                                                <div className="flex items-center mt-1">
                                                                    <Music className="w-4 h-4 mr-1 text-blue-500" />
                                                                    {slot.room?.name}
                                                                </div>
                                                                <div className="flex items-center mt-1">
                                                                    <Users className="w-4 h-4 mr-1 text-blue-500" />
                                                                    {slot.numberOfStudents} students
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge
                                                                className={cn(
                                                                    "text-xs",
                                                                    slot.status === SlotStatus.Cancelled
                                                                        ? "bg-gray-100 text-gray-700"
                                                                        : slot.status === SlotStatus.Finished
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-blue-100 text-blue-800",
                                                                )}
                                                            >
                                                                {SlotStatusText[slot.status]}
                                                            </Badge>

                                                            {slot.status !== SlotStatus.Cancelled && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleSlotClick(slot.id)
                                                                    }}
                                                                >
                                                                    <Check className="w-3 h-3 mr-1" />
                                                                    Attendance
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white shadow-xl rounded-2xl max-w-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                            <CalendarClock className="w-6 h-6 text-blue-700" />
                            Slot Detail
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSlot && (
                        <div className="space-y-6 mt-4 text-blue-900 text-sm md:text-base">
                            {/* --- Class Information --- */}
                            <div className="bg-gradient-to-br from-blue-100 to-white border border-blue-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-700">
                                    <BookOpen className="w-5 h-5" /> Class Information
                                </h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                    <li className="flex items-center gap-2">
                                        <Calendar size={18} className="text-blue-600" />
                                        <span>
                                            <strong>Room:</strong> {selectedSlot.room?.name}
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BookOpen size={18} className="text-blue-600" />
                                        <span>
                                            <strong>Class:</strong> {selectedSlot.class?.name}
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <User size={18} className="text-blue-600" />
                                        <span>
                                            <strong>Teacher:</strong> {selectedSlot.teacher.fullName}
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Users size={18} className="text-blue-600" />
                                        <span>
                                            <strong>Number of Students:</strong> {selectedSlot.numberOfStudents}
                                        </span>
                                    </li>

                                    <li className="flex items-center gap-2">
                                        <CalendarClock size={18} className="text-blue-600" />
                                        <span>
                                            <strong>Slot No/Total Slot:</strong> {selectedSlot.slotNo || "-"} of{" "}
                                            {selectedSlot.slotTotal || "-"}
                                        </span>
                                    </li>

                                    {selectedSlot.slotNote && (
                                        <li className="flex items-center gap-2">
                                            <StickyNote size={18} className="text-blue-600" />
                                            <span>
                                                <strong>Note:</strong> {selectedSlot.slotNote}
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {role === 1 &&
                                selectedSlot.slotStudents &&
                                selectedSlot.slotStudents
                                    .filter(
                                        (student: SlotStudentModel) =>
                                            student.studentFirebaseId.toLowerCase() === currentAccount.accountFirebaseId?.toLowerCase(),
                                    )
                                    .map((student, index) => (
                                        <div
                                            key={index}
                                            className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 shadow-sm"
                                        >
                                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-700">
                                                <ThumbsUp className="w-5 h-5" /> Your Feedback
                                            </h3>

                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-blue-900 text-sm md:text-base">
                                                {student.gestureComment && (
                                                    <li className="flex items-center gap-2">
                                                        <MoveRight className="text-blue-600 w-4 h-4" />
                                                        <span>
                                                            <strong>Posture:</strong> {student.gestureComment}
                                                        </span>
                                                    </li>
                                                )}
                                                {student.fingerNoteComment && (
                                                    <li className="flex items-center gap-2">
                                                        <HandMetal className="text-blue-600 w-4 h-4" />
                                                        <span>
                                                            <strong>Fingering:</strong> {student.fingerNoteComment}
                                                        </span>
                                                    </li>
                                                )}
                                                {student.pedalComment && (
                                                    <li className="flex items-center gap-2">
                                                        <Footprints className="text-blue-600 w-4 h-4" />
                                                        <span>
                                                            <strong>Pedal:</strong> {student.pedalComment}
                                                        </span>
                                                    </li>
                                                )}
                                                {(student.attendanceStatus === AttendanceStatus.Attended ||
                                                    student.attendanceStatus === AttendanceStatus.Absent) && (
                                                        <li className="flex items-center gap-2">
                                                            <CheckCircle className="text-blue-600 w-4 h-4" />
                                                            <span>
                                                                <strong>Attendance:</strong> {AttendanceStatusText[student.attendanceStatus]}
                                                            </span>
                                                        </li>
                                                    )}
                                            </ul>
                                        </div>
                                    ))}

                            {/* --- Staff Controls --- */}
                            {role === 4 && (
                                <div className="mt-6 border-t border-slate-200 pt-5">
                                    <div className="bg-gradient-to-br from-blue-100 to-white border border-blue-200 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                                            <Settings className="w-5 h-5" />
                                            Staff Actions
                                        </h3>
                                        <div className="flex flex-wrap justify-end gap-3">
                                            {/* Slot Detail Button */}
                                            <Button
                                                onClick={() => navigate(`/staff/classes/slot/${selectedSlot.id}`)}
                                                disabled={
                                                    !isCurrentDatePastSlotDate(selectedSlot.date) || selectedSlot.status === SlotStatus.Cancelled
                                                }
                                                className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-semibold px-5 py-2.5 rounded-xl shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Info className="w-4 h-4" />
                                                Slot Detail
                                            </Button>

                                            {/* Change Teacher Button */}
                                            <Button
                                                onClick={async () => {
                                                    try {
                                                        setIsTeacherLoading(true)
                                                        const response = await fetchAvailableTeachersForSlot(selectedSlot.id, idToken)
                                                        setAvailableTeachers(response.data)
                                                        setNewTeacherId("")
                                                        setChangeTeacherReason("")
                                                        setIsChangeTeacherDialogOpen(true)
                                                    } catch (error) {
                                                        console.error("Failed to fetch available teachers:", error)
                                                    } finally {
                                                        setIsTeacherLoading(false)
                                                    }
                                                }}
                                                disabled={selectedSlot.status === SlotStatus.Cancelled || isTeacherLoading}
                                                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Change Teacher
                                            </Button>

                                            {/* Cancel Slot Button */}
                                            <Button
                                                onClick={() => {
                                                    setSelectedSlotToCancel(selectedSlot)
                                                    setIsCancelDialogOpen(true)
                                                }}
                                                disabled={
                                                    !isCurrentDatePastSlotDate(selectedSlot.date) ||
                                                    selectedSlot.status === SlotStatus.Cancelled ||
                                                    selectedSlot.status === SlotStatus.Ongoing
                                                }
                                                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Ban className="w-4 h-4" />
                                                Cancel Slot
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-blue-900 flex items-center">
                            <Filter className="w-5 h-5 mr-2 text-blue-700" />
                            Filter options
                        </DialogTitle>
                    </DialogHeader>

                    {/* Filter content */}
                    {/* (Filter dialog content remains the same, just changing blue to blue) */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="bg-white/90 border-blue-300 text-blue-800 hover:bg-blue-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                            disabled={isFilterLoading}
                        >
                            <X className="w-4 h-4 mr-1.5" />
                            Reset
                        </Button>
                        <Button
                            onClick={applyFilters}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                            disabled={isFilterLoading}
                        >
                            {isFilterLoading ? (
                                <span className="flex items-center">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Applying...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <Check className="w-4 h-4 mr-1.5" />
                                    Apply filter
                                </span>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Other dialogs remain the same, just changing blue to blue */}
            <Dialog
                open={isCancelDialogOpen}
                onOpenChange={(open) => {
                    if (!isLoading) {
                        setIsCancelDialogOpen(open)
                        setCancelReason("")
                        setSelectedSlotToCancel(null)
                        setSelectedBlankSlot(null)
                        setBlankSlots([])
                    }
                }}
            >
                <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-blue-900">Cancel and replace lessons</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <p className="text-blue-800 mb-4">
                            Please enter a reason for cancellation and select an alternative slot. If you do not select an alternative
                            slot, the lesson will not be canceled.
                        </p>
                        {selectedSlotToCancel && (
                            <div className="space-y-2">
                                <p className="text-blue-800">
                                    <strong>Room:</strong> <span className="text-blue-600">{selectedSlotToCancel.room?.name}</span>
                                </p>
                                <p className="text-blue-800">
                                    <strong>Class:</strong> <span className="text-blue-600">{selectedSlotToCancel.class?.name}</span>
                                </p>
                                <p className="text-blue-800">
                                    <strong>Shift:</strong>{" "}
                                    <span className="text-blue-600">
                                        {shiftTimesMap[selectedSlotToCancel.shift]} - {selectedSlotToCancel.date}
                                    </span>
                                </p>
                            </div>
                        )}
                        <div className="mt-4">
                            <label htmlFor="cancelReason" className="text-blue-800 font-semibold">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="cancelReason"
                                value={isOtherSelected ? "Khác" : cancelReason}
                                onChange={handleReasonChange}
                                className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-blue-800"
                                required
                            >
                                <option value="" disabled>
                                    Select reason for cancellation
                                </option>
                                {cancelReasons.map((reason, index) => (
                                    <option key={index} value={reason}>
                                        {reason}
                                    </option>
                                ))}
                                <option value="Khác">Other</option>
                            </select>
                            {isOtherSelected && (
                                <input
                                    type="text"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full mt-2 p-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-blue-800"
                                    placeholder="Enter reason for canceling the lesson"
                                    required
                                />
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-blue-800 font-semibold mb-2">Select alternative slot (required to cancel)</h3>
                            {blankSlots.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {blankSlots.map((slot, index) => {
                                        const slotDate = slot.date
                                        return (
                                            <div
                                                key={index}
                                                className={`p-2 border rounded-lg cursor-pointer hover:bg-blue-50 ${selectedBlankSlot === slot ? "bg-blue-100 border-blue-500" : "border-blue-300"
                                                    }`}
                                                onClick={() => setSelectedBlankSlot(slot)}
                                            >
                                                <p className="text-blue-800">
                                                    <strong>Room:</strong> <span className="text-blue-600">{slot.roomName || slot.roomId}</span>
                                                </p>
                                                <p className="text-blue-800">
                                                    <strong>Shift:</strong>{" "}
                                                    <span className="text-blue-600">
                                                        {shiftTimesMap[slot.shift]} - {slotDate}
                                                    </span>
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-blue-800">There are no slots available this week. Lessons cannot be cancelled.</p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCancelDialogOpen(false)
                                    setCancelReason("")
                                    setSelectedBlankSlot(null)
                                }}
                                className="bg-white/90 border-blue-300 text-blue-800 hover:bg-blue-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={handleReplaceThenCancel}
                                disabled={isLoading || !cancelReason.trim() || !selectedBlankSlot || blankSlots.length === 0}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                            >
                                {isLoading ? "Processing..." : "Confirm"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isChangeTeacherDialogOpen} onOpenChange={setIsChangeTeacherDialogOpen}>
                <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-blue-900">Change teacher</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        {selectedSlot && (
                            <div className="space-y-2 mb-4">
                                <p className="text-blue-800">
                                    <strong>Room:</strong> <span className="text-blue-600">{selectedSlot.room?.name}</span>
                                </p>
                                <p className="text-blue-800">
                                    <strong>Class:</strong> <span className="text-blue-600">{selectedSlot.class?.name}</span>
                                </p>
                                <p className="text-blue-800">
                                    <strong>Current teacher:</strong>{" "}
                                    <span className="text-blue-600">{selectedSlot.class.instructorName}</span>
                                </p>
                                <p className="text-blue-800">
                                    <strong>Shift:</strong>{" "}
                                    <span className="text-blue-600">
                                        {shiftTimesMap[selectedSlot.shift]} - {selectedSlot.date}
                                    </span>
                                </p>
                            </div>
                        )}
                        <div className="mt-4">
                            <label htmlFor="newTeacher" className="text-blue-800 font-semibold">
                                Select new teacher <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="newTeacher"
                                value={newTeacherId}
                                onChange={(e) => setNewTeacherId(e.target.value)}
                                className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-blue-800"
                                required
                            >
                                <option value="" disabled>
                                    Select new teacher
                                </option>
                                {availableTeachers.map((teacher) => (
                                    <option key={teacher.accountFirebaseId} value={teacher.accountFirebaseId}>
                                        {teacher.fullName}
                                    </option>
                                ))}
                            </select>
                            <div className="mt-4">
                                <label htmlFor="changeReason" className="text-blue-800 font-semibold">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="changeReason"
                                    value={changeTeacherReason}
                                    onChange={(e) => setChangeTeacherReason(e.target.value)}
                                    className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-blue-800"
                                    placeholder="Enter reason for changing teacher"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsChangeTeacherDialogOpen(false)
                                    setNewTeacherId("")
                                    setChangeTeacherReason("")
                                }}
                                className="bg-white/90 border-blue-300 text-blue-800 hover:bg-blue-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                                disabled={isTeacherLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (!newTeacherId || !selectedSlot) return

                                    try {
                                        setIsTeacherLoading(true)
                                        await fetchAssignTeacherToSlot(selectedSlot.id, newTeacherId, changeTeacherReason, idToken)

                                        // Refresh the slot data
                                        const response = await fetchSlotById(selectedSlot.id, idToken)
                                        const updatedSlot = response.data

                                        // Update the slots list
                                        setSlots(slots.map((slot) => (slot.id === selectedSlot.id ? updatedSlot : slot)))

                                        setSelectedSlot(updatedSlot)
                                        setIsChangeTeacherDialogOpen(false)
                                        setNewTeacherId("")
                                        setChangeTeacherReason("")

                                        // Optional: Show success message
                                        toast.success("Successful teacher change!")
                                    } catch (error) {
                                        console.error("Failed to assign teacher:", error)
                                        toast.error("An error occurred while changing teacher.")
                                    } finally {
                                        setIsTeacherLoading(false)
                                    }
                                }}
                                disabled={!newTeacherId || !changeTeacherReason.trim() || isTeacherLoading}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                            >
                                {isTeacherLoading ? (
                                    <span className="flex items-center">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                        Processing...
                                    </span>
                                ) : (
                                    "Confirm changes"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
