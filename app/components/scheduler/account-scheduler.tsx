import { useEffect, useState } from "react"
import { getWeekRange } from "~/lib/utils/datetime"
import { fetchSlots, fetchSlotById } from "~/lib/services/scheduler"
import {
    ChevronLeft,
    ChevronRight,
    Music,
    Calendar,
    Clock,
    User,
    Users,
    CalendarClock,
    BookOpen,
    StickyNote,
    Award,
    CheckCircle,
    Info,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { cn } from "~/lib/utils"
import {
    AttendanceStatusText,
    AttendanceStatus,
    Shift,
    type SlotDetail,
    SlotStatus,
    SlotStatusText,
    type SlotStudentModel,
} from "~/lib/types/Scheduler/slot"
import { type Account, Role } from "~/lib/types/account/account"

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

const getWeekDay = (date: Date): string => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return weekdays[date.getDay()]
}

// Attendance Legend Component
const AttendanceLegend = ({ learnerName }: { learnerName: string }) => {
    return (
        <Card className="bg-slate-50 border border-slate-200 p-4 mt-6">
            <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2">More note / Attendance Status:</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-green-600 font-medium text-xs">(attended)</span>
                            <span className="text-slate-700">{learnerName} had attended this activity</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-red-600 font-medium text-xs">(absent)</span>
                            <span className="text-slate-700">{learnerName} had NOT attended this activity</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-gray-500 font-medium text-xs">(-)</span>
                            <span className="text-slate-700">no data was given</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}

type LearnerSchedulerProps = {
    initialSlots: SlotDetail[]
    initialStartDate: Date
    initialEndDate: Date
    initialYear: number
    initialWeekNumber: number
    idToken: string
    role: Role
    currentAccount: Account
}

export const LearnerScheduler = ({
    initialSlots,
    initialStartDate,
    initialEndDate,
    initialYear,
    initialWeekNumber,
    idToken,
    role,
    currentAccount,
}: LearnerSchedulerProps) => {
    const [slots, setSlots] = useState<SlotDetail[]>(initialSlots)
    const [year, setYear] = useState(initialYear)
    const [weekNumber, setWeekNumber] = useState(initialWeekNumber)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<string>("week")

    // Get learner name for the legend
    const learnerName = currentAccount?.fullName || currentAccount?.userName || "Student"

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const currentDay = new Date(startDate)
        currentDay.setDate(currentDay.getDate() + i)
        return currentDay
    })

    useEffect(() => {
        fetchSlotsForWeek(year, weekNumber)
    }, [year, weekNumber])

    const fetchSlotsForWeek = async (year: number, week: number) => {
        try {
            setIsLoading(true)
            const { startDate, endDate } = getWeekRange(year, week)
            const startTime = formatDateForAPI(startDate)
            const endTime = formatDateForAPI(endDate)

            const response = await fetchSlots({
                startTime,
                endTime,
                idToken,
                studentFirebaseId: role === Role.Student ? currentAccount.accountFirebaseId?.toLowerCase() : "",
            })

            let updatedSlots: SlotDetail[] = response.data

            if (role === Role.Student && currentAccount.accountFirebaseId) {
                updatedSlots = response.data.map((slot: SlotDetail) => {
                    if (!slot.slotStudents || slot.slotStudents.length === 0) {
                        return { ...slot, attendanceStatus: AttendanceStatus.NotYet }
                    }
                    const studentRecord = slot.slotStudents.find((student: SlotStudentModel) => {
                        const studentId = student.studentFirebaseId?.toLowerCase()
                        const accountId = currentAccount.accountFirebaseId?.toLowerCase()
                        return studentId === accountId
                    })
                    if (!studentRecord) {
                        return { ...slot, attendanceStatus: AttendanceStatus.NotYet }
                    }
                    const attendanceStatus = studentRecord.attendanceStatus || AttendanceStatus.NotYet
                    return { ...slot, attendanceStatus }
                })
            }

            setSlots(updatedSlots)
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
            const response = await fetchSlotById(slotId, idToken)
            setSelectedSlot(response.data)
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

    const SlotCard = ({ slot, onClick }: { slot: SlotDetail; onClick: () => void }) => (
        <div
            className={cn(
                "rounded-lg shadow p-2 text-sm transition-all duration-200 cursor-pointer",
                slot.status === SlotStatus.Cancelled
                    ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                    : slot.status === SlotStatus.Ongoing
                        ? "bg-blue-50 border border-blue-200 hover:shadow-md"
                        : slot.status === SlotStatus.Finished
                            ? "bg-green-50 border border-green-200 hover:shadow-md"
                            : "bg-white border border-blue-100 hover:shadow-md",
            )}
            onClick={() => slot.status !== SlotStatus.Cancelled && onClick()}
        >
            <div className="text-lg font-bold flex items-center text-primary mb-1">
                <Music className="mr-1 w-4 h-4" />
                {slot.room?.name}
            </div>
            <div className="text-sm mb-2">{slot.class?.name}</div>
            <div className="flex flex-wrap gap-1">
                <Badge
                    className="text-xs"
                    variant={
                        slot.status === SlotStatus.Cancelled
                            ? "outline"
                            : slot.status === SlotStatus.Finished
                                ? "default"
                                : slot.status === SlotStatus.Ongoing
                                    ? "secondary"
                                    : "outline"
                    }
                >
                    {SlotStatusText[slot.status]}
                </Badge>
                {role === Role.Student && slot.attendanceStatus !== undefined && (
                    <Badge
                        className="text-xs"
                        variant={
                            slot.attendanceStatus === AttendanceStatus.Attended
                                ? "success"
                                : slot.attendanceStatus === AttendanceStatus.Absent
                                    ? "destructive"
                                    : "outline"
                        }
                    >
                        {AttendanceStatusText[slot.attendanceStatus]}
                    </Badge>
                )}
            </div>
            {slot.status === SlotStatus.Cancelled && slot.slotNote && (
                <div className="text-xs mt-2 text-muted-foreground italic">Cancel Reason: {slot.slotNote}</div>
            )}
        </div>
    )

    return (
        <div className="learner-scheduler p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <Music className="w-8 h-8 mr-2 text-theme" />
                        My Learning Schedule
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">Week</span>
                                <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
                                    <SelectTrigger className="bg-white border-slate-200">
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

                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">Year</span>
                                <Select value={year.toString()} onValueChange={handleYearChange}>
                                    <SelectTrigger className="w-[120px] bg-white border-slate-200">
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

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleWeekChange(weekNumber - 1)}
                                disabled={weekNumber <= 1 || isLoading}
                                className="h-9 w-9"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <div className="text-sm font-medium text-slate-700 flex items-center">
                                <Calendar className="mr-2 w-4 h-4 text-theme" />
                                {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleWeekChange(weekNumber + 1)}
                                disabled={weekNumber >= 52 || isLoading}
                                className="h-9 w-9"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex items-center">
                            <Tabs value={viewMode} onValueChange={setViewMode} className="w-[200px]">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="week">Week View</TabsTrigger>
                                    <TabsTrigger value="list">List View</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </div>

                <Tabs value={viewMode} className="w-full">
                    <TabsContent value="week" className="mt-0">
                        <Card className="overflow-hidden border-0 shadow-lg">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-theme hover:bg-theme/80">
                                            <TableHead className="h-14 text-center text-primary-foreground font-semibold w-32 uppercase">
                                                Shift
                                            </TableHead>
                                            {weekDates.map((date, i) => (
                                                <TableHead
                                                    key={i}
                                                    className={cn(
                                                        "text-center text-primary-foreground px-3 min-w-[110px]",
                                                        i < 6 ? "border-r border-primary-foreground/20" : "",
                                                    )}
                                                >
                                                    <div className="font-medium">{getWeekDay(date)}</div>
                                                    <div className="text-xs opacity-90 mt-1">{formatDateForDisplay(date)}</div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shiftTimes.map((time, timeIndex) => (
                                            <TableRow key={timeIndex} className="border-b bg-card hover:bg-muted/20">
                                                <TableCell className="text-center font-medium py-2 text-sm border-r">{time}</TableCell>
                                                {weekDates.map((date, dateIndex) => {
                                                    const currentDayString = formatDateForAPI(date)
                                                    const slotsForDateAndShift = slots.filter(
                                                        (slot) => slot.date === currentDayString && shiftTimesMap[slot.shift] === time,
                                                    )

                                                    return (
                                                        <TableCell
                                                            key={dateIndex}
                                                            className={cn(
                                                                "p-2 align-top max-h-[100px] overflow-y-auto text-sm",
                                                                dateIndex < 6 ? "border-r border-border/60" : "",
                                                            )}
                                                        >
                                                            <div className="flex flex-col gap-2">
                                                                {slotsForDateAndShift.map((slot, idx) => (
                                                                    <SlotCard key={idx} slot={slot} onClick={() => handleSlotClick(slot.id)} />
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="list" className="mt-0">
                        <Card className="overflow-hidden border-0 shadow-lg">
                            <div className="p-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-theme hover:bg-theme/80">
                                            <TableHead className="text-primary-foreground">Date</TableHead>
                                            <TableHead className="text-primary-foreground">Time</TableHead>
                                            <TableHead className="text-primary-foreground">Room</TableHead>
                                            <TableHead className="text-primary-foreground">Class</TableHead>
                                            <TableHead className="text-primary-foreground">Teacher</TableHead>
                                            <TableHead className="text-primary-foreground">Status</TableHead>
                                            {role === Role.Student && <TableHead className="text-primary-foreground">Attendance</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...slots]
                                            .sort((a, b) => {
                                                const dateComparison = a.date.localeCompare(b.date)
                                                if (dateComparison !== 0) return dateComparison
                                                return a.shift - b.shift
                                            })
                                            .map((slot, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    className={cn(
                                                        "cursor-pointer hover:bg-muted/50",
                                                        idx % 2 === 0 ? "bg-slate-50" : "",
                                                        slot.status === SlotStatus.Cancelled && "opacity-60",
                                                    )}
                                                    onClick={() => slot.status !== SlotStatus.Cancelled && handleSlotClick(slot.id)}
                                                >
                                                    <TableCell>{slot.date}</TableCell>
                                                    <TableCell>{shiftTimesMap[slot.shift]}</TableCell>
                                                    <TableCell>{slot.room?.name}</TableCell>
                                                    <TableCell>{slot.class?.name}</TableCell>
                                                    <TableCell>{slot.teacher?.fullName}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                slot.status === SlotStatus.Cancelled
                                                                    ? "outline"
                                                                    : slot.status === SlotStatus.Finished
                                                                        ? "default"
                                                                        : slot.status === SlotStatus.Ongoing
                                                                            ? "secondary"
                                                                            : "outline"
                                                            }
                                                        >
                                                            {SlotStatusText[slot.status]}
                                                        </Badge>
                                                    </TableCell>
                                                    {role === Role.Student && (
                                                        <TableCell>
                                                            {slot.attendanceStatus !== undefined && (
                                                                <Badge
                                                                    variant={
                                                                        slot.attendanceStatus === AttendanceStatus.Attended
                                                                            ? "success"
                                                                            : slot.attendanceStatus === AttendanceStatus.Absent
                                                                                ? "destructive"
                                                                                : "outline"
                                                                    }
                                                                    title={AttendanceStatusText[slot.attendanceStatus]}
                                                                >
                                                                    {AttendanceStatusText[slot.attendanceStatus]}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Slot Detail Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-white shadow-xl rounded-2xl max-w-4xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <CalendarClock className="w-6 h-6 text-theme" />
                                Lesson Details
                            </DialogTitle>
                        </DialogHeader>

                        {selectedSlot && (
                            <div className="space-y-6 mt-4">
                                {/* Basic Information */}
                                <div className="bg-gradient-to-br from-slate-100 to-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-theme">
                                        <BookOpen className="w-5 h-5" /> Lesson Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={18} className="text-theme" />
                                            <span>
                                                <strong>Room:</strong> {selectedSlot.room?.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={18} className="text-theme" />
                                            <span>
                                                <strong>Class:</strong> {selectedSlot.class?.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User size={18} className="text-theme" />
                                            <span>
                                                <strong>Teacher:</strong> {selectedSlot.teacher?.fullName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users size={18} className="text-theme" />
                                            <span>
                                                <strong>Students:</strong> {selectedSlot.numberOfStudents}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CalendarClock size={18} className="text-theme" />
                                            <span>
                                                <strong>Lesson:</strong> {selectedSlot.slotNo || "-"} of {selectedSlot.slotTotal || "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className="text-theme" />
                                            <span>
                                                <strong>Time:</strong> {shiftTimesMap[selectedSlot.shift]}
                                            </span>
                                        </div>
                                        {selectedSlot.slotNote && (
                                            <div className="flex items-center gap-2 sm:col-span-2">
                                                <StickyNote size={18} className="text-theme" />
                                                <span>
                                                    <strong>Note:</strong> {selectedSlot.slotNote}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Student Feedback */}
                                {role === Role.Student &&
                                    selectedSlot.slotStudents
                                        ?.filter(
                                            (student: SlotStudentModel) =>
                                                student.studentFirebaseId.toLowerCase() === currentAccount.accountFirebaseId?.toLowerCase(),
                                        )
                                        .map((student, index) => (
                                            <div
                                                key={index}
                                                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm"
                                            >
                                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-800">
                                                    <Award className="w-5 h-5" /> Your Progress & Feedback
                                                </h3>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                                    {student.gestureComment && (
                                                        <div>
                                                            <h4 className="font-medium text-green-800 mb-1">Posture</h4>
                                                            <p className="text-sm text-gray-600">{student.gestureComment}</p>
                                                        </div>
                                                    )}
                                                    {student.fingerNoteComment && (
                                                        <div>
                                                            <h4 className="font-medium text-green-800 mb-1">Fingering</h4>
                                                            <p className="text-sm text-gray-600">{student.fingerNoteComment}</p>
                                                        </div>
                                                    )}
                                                    {student.pedalComment && (
                                                        <div>
                                                            <h4 className="font-medium text-green-800 mb-1">Pedal</h4>
                                                            <p className="text-sm text-gray-600">{student.pedalComment}</p>
                                                        </div>
                                                    )}
                                                    {(student.attendanceStatus === AttendanceStatus.Attended ||
                                                        student.attendanceStatus === AttendanceStatus.Absent ||
                                                        student.attendanceStatus === AttendanceStatus.NotYet) && (
                                                            <div className="flex items-center gap-2 sm:col-span-2">
                                                                <CheckCircle
                                                                    className={cn(
                                                                        "w-4 h-4",
                                                                        student.attendanceStatus === AttendanceStatus.Attended
                                                                            ? "text-green-600"
                                                                            : student.attendanceStatus === AttendanceStatus.Absent
                                                                                ? "text-red-600"
                                                                                : "text-gray-400",
                                                                    )}
                                                                />
                                                                <span
                                                                    className={cn(
                                                                        "text-sm",
                                                                        student.attendanceStatus === AttendanceStatus.Attended
                                                                            ? "text-green-800"
                                                                            : student.attendanceStatus === AttendanceStatus.Absent
                                                                                ? "text-red-800"
                                                                                : "text-gray-600",
                                                                    )}
                                                                >
                                                                    <strong>Attendance:</strong> {AttendanceStatusText[student.attendanceStatus]}
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>

                                                {student.gestureUrl && (
                                                    <div className="mt-4">
                                                        <h4 className="font-semibold text-green-800 mb-2">Feedback Images</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {(() => {
                                                                try {
                                                                    const imageUrls = JSON.parse(student.gestureUrl)
                                                                    return imageUrls.map((url: string, index: number) => (
                                                                        <div
                                                                            key={index}
                                                                            className="border border-green-200 rounded-lg overflow-hidden bg-white"
                                                                        >
                                                                            <img
                                                                                src={url || "/placeholder.svg?height=200&width=300"}
                                                                                alt={`Feedback ${index + 1}`}
                                                                                className="w-full h-48 object-cover"
                                                                            />
                                                                        </div>
                                                                    ))
                                                                } catch (error) {
                                                                    return (
                                                                        <div className="border border-green-200 rounded-lg overflow-hidden bg-white">
                                                                            <img
                                                                                src={student.gestureUrl || "/placeholder.svg?height=200&width=300"}
                                                                                alt="Feedback"
                                                                                className="w-full h-48 object-cover"
                                                                            />
                                                                        </div>
                                                                    )
                                                                }
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Attendance Legend moved to bottom */}
                <AttendanceLegend learnerName={learnerName} />
            </div>
        </div>
    )
}
