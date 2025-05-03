import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
    BookOpen,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Loader2,
    MapPin,
    MoreHorizontal,
    Music2,
    User2,
    Users,
} from "lucide-react"
import { AttendanceStatus, Shift, SlotDetail, SlotStatus } from "~/lib/types/Scheduler/slot"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { cn } from "~/lib/utils"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Separator } from "@radix-ui/react-separator"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { TabsContent } from "@radix-ui/react-tabs"
import { ScrollArea } from "../ui/scroll-area"
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"


// Helper functions
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

const getFullWeekday = (date: Date): string => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return weekdays[date.getDay()]
}

const getWeekRange = (year: number, weekNumber: number) => {
    const firstDayOfYear = new Date(year, 0, 1)
    const daysOffset = (weekNumber - 1) * 7

    // Find the first day of the week
    const firstDayOfWeek = new Date(year, 0, 1 + daysOffset - firstDayOfYear.getDay())

    // Find the last day of the week
    const lastDayOfWeek = new Date(firstDayOfWeek)
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6)

    return { startDate: firstDayOfWeek, endDate: lastDayOfWeek }
}

// Components
const LoadingSpinner = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <div className="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-4">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                <p className="text-lg font-medium">Loading...</p>
            </div>
        </motion.div>
    )
}

const StatusBadge = ({ status }: { status: SlotStatus }) => {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === SlotStatus.Ongoing && "bg-teal-100 text-teal-800",
                status === SlotStatus.NotStarted && "bg-blue-100 text-blue-800",
                status === SlotStatus.Finished && "bg-green-100 text-green-800",
                status === SlotStatus.Cancelled && "bg-gray-100 text-gray-800",
            )}
        >
            {SlotStatus[status]}
        </div>
    )
}

const AttendanceBadge = ({ status }: { status: AttendanceStatus }) => {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === AttendanceStatus.Attended && "bg-green-100 text-green-800",
                status === AttendanceStatus.Absent && "bg-red-100 text-red-800",
                status === AttendanceStatus.NotYet && "bg-gray-100 text-gray-800",
            )}
        >
            {AttendanceStatus[status]}
        </div>
    )
}

const ClassCard = ({ slot, onClick }: { slot: SlotDetail; onClick: () => void }) => {
    return (
        <Card
            className={cn(
                "transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden",
                slot.status === SlotStatus.Cancelled && "opacity-70",
            )}
            onClick={onClick}
        >
            <div
                className={cn(
                    "h-2",
                    slot.status === SlotStatus.Ongoing && "bg-teal-500",
                    slot.status === SlotStatus.NotStarted && "bg-blue-500",
                    slot.status === SlotStatus.Finished && "bg-green-500",
                    slot.status === SlotStatus.Cancelled && "bg-gray-400",
                )}
            />
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-medium">{slot.class?.name}</CardTitle>
                        <CardDescription className="text-xs flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {shiftTimesMap[slot.shift]}
                        </CardDescription>
                    </div>
                    <StatusBadge status={slot.status} />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {slot.room?.name}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="flex items-center text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {slot.numberOfStudents} students
                </div>
                <div className="text-xs text-muted-foreground">
                    {slot.slotNo}/{slot.slotTotal}
                </div>
            </CardFooter>
        </Card>
    )
}

const DaySchedule = ({
    date,
    slots,
    onSlotClick,
}: {
    date: Date
    slots: SlotDetail[]
    onSlotClick: (slotId: string) => void
}) => {
    const formattedDate = formatDateForDisplay(date)
    const weekday = getFullWeekday(date)
    const vietnameseWeekday = getVietnameseWeekday(date)
    const dateString = formatDateForAPI(date)
    const slotsForDay = slots.filter((slot) => slot.date === dateString)

    return (
        <div className="space-y-4">
            <div className="sticky top-0 bg-white z-10 pb-2">
                <h3 className="text-lg font-medium">
                    {weekday} <span className="text-muted-foreground">({vietnameseWeekday})</span>
                </h3>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            {slotsForDay.length > 0 ? (
                <div className="grid gap-3">
                    {slotsForDay.map((slot) => (
                        <ClassCard key={slot.id} slot={slot} onClick={() => onSlotClick(slot.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No classes scheduled</p>
                </div>
            )}
        </div>
    )
}

// Props interface for the TeacherScheduler component
interface TeacherSchedulerProps {
    fetchSlots: (params: {
        startTime: string
        endTime: string
        idToken: string
        instructorFirebaseIds: string[]
        classIds: string[]
    }) => Promise<{ data: SlotDetail[] }>
    fetchSlotById: (slotId: string, idToken: string) => Promise<{ data: SlotDetail }>
    fetchAttendanceStatus: (slotId: string, idToken: string) => Promise<{ data: any }>
    idToken: string
    currentAccount: {
        accountFirebaseId: string
        userName: string
        fullName?: string
    }
    classId?: string
    className?: string
    initialYear?: number
    initialWeekNumber?: number
    subscribeToAttendanceChanges?: (callback: (message: any) => void) => { unsubscribe: () => void }
}

export default function TeacherScheduler({
    fetchSlots,
    fetchSlotById,
    fetchAttendanceStatus,
    idToken,
    currentAccount,
    classId,
    className,
    initialYear = new Date().getFullYear(),
    initialWeekNumber = Math.floor(
        (new Date().getTime() - new Date(initialYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
    ) + 1,
    subscribeToAttendanceChanges,
}: TeacherSchedulerProps) {
    const { startDate: initialStartDate, endDate: initialEndDate } = getWeekRange(initialYear, initialWeekNumber)

    const [slots, setSlots] = useState<SlotDetail[]>([])
    const [year, setYear] = useState(initialYear)
    const [weekNumber, setWeekNumber] = useState(initialWeekNumber)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<"week" | "day">("week")
    const [selectedDay, setSelectedDay] = useState<number>(0) // 0-6 for days of the week

    useEffect(() => {
        if (!subscribeToAttendanceChanges) return

        const subscription = subscribeToAttendanceChanges((message: any) => {
            if (message?.content?.includes("changed") && message?.topic?.includes("scheduler_attendance")) {
                Promise.all(
                    slots.map(async (slot) => {
                        try {
                            const attendanceStatusResponse = await fetchAttendanceStatus(slot.id, idToken)
                            return { ...slot, ...attendanceStatusResponse.data }
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
    }, [year, weekNumber, slots, idToken, fetchAttendanceStatus, subscribeToAttendanceChanges])

    useEffect(() => {
        fetchSlotsForWeek(year, weekNumber)
    }, [year, weekNumber])

    const fetchSlotsForWeek = async (year: number, week: number) => {
        try {
            setIsLoading(true)
            const { startDate, endDate } = getWeekRange(year, week)
            const startTime = formatDateForAPI(startDate)
            const endTime = formatDateForAPI(endDate)

            // For teachers, we filter by their ID
            const response = await fetchSlots({
                startTime,
                endTime,
                idToken,
                instructorFirebaseIds: [currentAccount.accountFirebaseId],
                classIds: classId ? [classId] : [],
            })

            setSlots(response.data)
            setStartDate(startDate)
            setEndDate(endDate)
        } catch (error) {
            console.error("Failed to fetch slots for week:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSlotClick = async (slotId: string) => {
        try {
            setIsLoading(true)
            const response = await fetchSlotById(slotId, idToken)
            const slotDetails: SlotDetail = response.data
            setSelectedSlot(slotDetails)
            setIsModalOpen(true)
        } catch (error) {
            console.error("Failed to fetch slot details:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleWeekChange = (direction: "prev" | "next") => {
        const newWeekNumber = direction === "prev" ? weekNumber - 1 : weekNumber + 1
        if (newWeekNumber >= 1 && newWeekNumber <= 52) {
            setWeekNumber(newWeekNumber)
        }
    }

    const handleYearChange = (direction: "prev" | "next") => {
        const newYear = direction === "prev" ? year - 1 : year + 1
        setYear(newYear)
    }

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const currentDay = new Date(startDate)
        currentDay.setDate(currentDay.getDate() + i)
        return currentDay
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <AnimatePresence>{isLoading && <LoadingSpinner />}</AnimatePresence>

            <header className="bg-white border-b sticky top-0 z-20">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Music2 className="h-8 w-8 text-teal-500 mr-3" />
                        <h1 className="text-2xl font-bold">{classId ? `Schedule for ${className}` : "Teaching Schedule"}</h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeekChange("prev")}
                            disabled={weekNumber <= 1}
                            className="h-9"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 min-w-[180px]">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Week {weekNumber}, {year}
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px]">
                                <div className="grid grid-cols-2 gap-1 p-2">
                                    <Button variant="outline" size="sm" onClick={() => handleYearChange("prev")} className="h-8">
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        {year - 1}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleYearChange("next")} className="h-8">
                                        {year + 1}
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                                <div className="px-2 py-1.5 text-sm font-medium">
                                    {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                                </div>
                                <Separator className="my-1" />
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                    {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                                        <DropdownMenuItem
                                            key={week}
                                            className={cn("cursor-pointer", week === weekNumber && "bg-teal-50 text-teal-900 font-medium")}
                                            onClick={() => setWeekNumber(week)}
                                        >
                                            Week {week}
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeekChange("next")}
                            disabled={weekNumber >= 52}
                            className="h-9"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                    </h2>
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "day")} className="w-auto">
                        <TabsList className="grid w-[180px] grid-cols-2">
                            <TabsTrigger value="week">Week View</TabsTrigger>
                            <TabsTrigger value="day">Day View</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <TabsContent value="week" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {weekDates.map((date, index) => (
                            <Card key={index} className="overflow-hidden">
                                <CardHeader className="p-3 bg-gray-50 border-b">
                                    <div className="text-center">
                                        <CardTitle className="text-sm font-medium">{getVietnameseWeekday(date)}</CardTitle>
                                        <CardDescription className="text-xs">{formatDateForDisplay(date)}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 h-[500px] overflow-y-auto">
                                    {slots
                                        .filter((slot) => slot.date === formatDateForAPI(date))
                                        .map((slot) => (
                                            <div
                                                key={slot.id}
                                                className={cn(
                                                    "mb-3 p-3 rounded-md border transition-all hover:shadow-md cursor-pointer",
                                                    slot.status === SlotStatus.Ongoing && "border-l-4 border-l-teal-500",
                                                    slot.status === SlotStatus.NotStarted && "border-l-4 border-l-blue-500",
                                                    slot.status === SlotStatus.Finished && "border-l-4 border-l-green-500",
                                                    slot.status === SlotStatus.Cancelled && "border-l-4 border-l-gray-400 opacity-70",
                                                )}
                                                onClick={() => handleSlotClick(slot.id)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-sm">{slot.class?.name}</h4>
                                                    <StatusBadge status={slot.status} />
                                                </div>
                                                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {shiftTimesMap[slot.shift]}
                                                </div>
                                                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {slot.room?.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center justify-between">
                                                    <span className="flex items-center">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {slot.numberOfStudents} students
                                                    </span>
                                                    <span>
                                                        {slot.slotNo}/{slot.slotTotal}
                                                    </span>
                                                </div>
                                                {slot.status === SlotStatus.Cancelled && slot.slotNote && (
                                                    <div className="mt-2 text-xs italic text-red-600 bg-red-50 p-1.5 rounded">
                                                        {slot.slotNote}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    {slots.filter((slot) => slot.date === formatDateForAPI(date)).length === 0 && (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-sm text-muted-foreground">No classes scheduled</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="day" className="mt-0">
                    <div className="flex mb-4 overflow-x-auto pb-2">
                        {weekDates.map((date, index) => (
                            <Button
                                key={index}
                                variant={selectedDay === index ? "default" : "outline"}
                                className={cn("mr-2 min-w-[100px]", selectedDay === index ? "bg-teal-600 hover:bg-teal-700" : "")}
                                onClick={() => setSelectedDay(index)}
                            >
                                <div className="text-center">
                                    <div className="font-medium">{getVietnameseWeekday(date)}</div>
                                    <div className="text-xs">{formatDateForDisplay(date)}</div>
                                </div>
                            </Button>
                        ))}
                    </div>

                    <Card className="overflow-hidden">
                        <CardContent className="p-6">
                            <ScrollArea className="h-[600px] pr-4">
                                <DaySchedule date={weekDates[selectedDay]} slots={slots} onSlotClick={handleSlotClick} />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-xl">
                                <Music2 className="h-5 w-5 mr-2 text-teal-500" />
                                {selectedSlot?.class?.name}
                            </DialogTitle>
                        </DialogHeader>

                        {selectedSlot && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                Class Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Status:</span>
                                                    <StatusBadge status={selectedSlot.status} />
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Date:</span>
                                                    <span className="text-sm font-medium">{selectedSlot.date}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Time:</span>
                                                    <span className="text-sm font-medium">{shiftTimesMap[selectedSlot.shift]}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Room:</span>
                                                    <span className="text-sm font-medium">{selectedSlot.room?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Students:</span>
                                                    <span className="text-sm font-medium">{selectedSlot.numberOfStudents}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Slot:</span>
                                                    <span className="text-sm font-medium">
                                                        {selectedSlot.slotNo} of {selectedSlot.slotTotal}
                                                    </span>
                                                </div>
                                                {selectedSlot.slotNote && (
                                                    <div className="pt-2">
                                                        <span className="text-sm text-muted-foreground">Note:</span>
                                                        <div className="mt-1 text-sm p-2 bg-gray-50 rounded border">{selectedSlot.slotNote}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center">
                                                <Users className="h-4 w-4 mr-2" />
                                                Student Attendance
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedSlot.slotStudents && selectedSlot.slotStudents.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedSlot.slotStudents.map((student, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 mr-3">
                                                                    {student.studentAccount.avatarUrl ? (
                                                                        <img
                                                                            src={student.studentAccount.avatarUrl || "/placeholder.svg"}
                                                                            alt={student.studentAccount.fullName || "Student"}
                                                                            className="h-8 w-8 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <User2 className="h-4 w-4" />
                                                                    )}
                                                                </div>
                                                                <span className="font-medium">
                                                                    {student.studentAccount.fullName || student.studentAccount.userName || "Student"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <AttendanceBadge status={student.attendanceStatus} />
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 ml-2"
                                                                                
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>View student details</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-muted-foreground">No students assigned to this class</div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    {selectedSlot.status !== SlotStatus.Cancelled && (
                                        <>
                                            <Button
                                                variant="outline"
                                                // onClick={() => router.push(`/teacher/slots/${selectedSlot.id}/feedback`)}
                                            >
                                                Provide Feedback
                                            </Button>
                                            <Button
                                                // onClick={() => router.push(`/teacher/slots/${selectedSlot.id}/attendance`)}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Take Attendance
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
