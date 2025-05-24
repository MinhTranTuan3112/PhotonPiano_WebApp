import { useState, useEffect } from "react"
import { useNavigate } from "@remix-run/react"
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCw,
    Ban,
    Info,
    Music,
    Calendar,
    Clock,
    User,
    Users,
    Settings,
    CalendarClock,
    BookOpen,
    StickyNote,
    X,
    Check,
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { ScrollArea } from "~/components/ui/scroll-area"
import { toast } from "sonner"
import { cn } from "~/lib/utils"
import { SlotCard } from "./slot-card"
import { LoadingOverlay } from "./loading-overlay"
import { BlankSlotSelector } from "./blank-slot-selector"
import { PubSub, type IPubSubMessage } from "~/lib/services/pub-sub"

// Import types and services
import { type BlankSlotModel, Shift, type SlotDetail, SlotStatus, SlotStatusText } from "~/lib/types/Scheduler/slot"
import type { Account, Role } from "~/lib/types/account/account"
import {
    fetchAssignTeacherToSlot,
    fetchAvailableTeachersForSlot,
    fetchBlankSlots,
    fetchCancelSlot,
    fetchPublicNewSlot,
    fetchSlotById,
    fetchSlots,
} from "~/lib/services/scheduler"
import { fetchSystemConfigSlotCancel } from "~/lib/services/system-config"
import { getWeekRange } from "~/lib/utils/datetime"
import { toastWarning } from "~/lib/utils/toast-utils"

// Shift times mapping
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
    // For demo purposes, always return true
    return true
}

type StaffSchedulerProps = {
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
}

export const StaffSchedule = ({
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
}: StaffSchedulerProps) => {
    // State
    const [slots, setSlots] = useState<SlotDetail[]>(initialSlots)
    const [year, setYear] = useState(initialYear)
    const [weekNumber, setWeekNumber] = useState(initialWeekNumber)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFilterLoading, setIsFilterLoading] = useState(false)
    const [filters, setFilters] = useState({
        shifts: [] as Shift[],
        slotStatuses: [] as SlotStatus[],
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
    const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false)
    const [isChangeTeacherDialogOpen, setIsChangeTeacherDialogOpen] = useState<boolean>(false)
    const [newTeacherId, setNewTeacherId] = useState<string>("")
    const [availableTeachers, setAvailableTeachers] = useState<Array<{ accountFirebaseId: string; fullName: string }>>([])
    const [isTeacherLoading, setIsTeacherLoading] = useState<boolean>(false)
    const [changeTeacherReason, setChangeTeacherReason] = useState<string>("")
    const [viewMode, setViewMode] = useState<string>("week")

    // Derived data
    const uniqueShifts = Array.from(new Set(slots.map((slot) => slot.shift)))
    const uniqueSlotStatuses = Array.from(new Set(slots.map((slot) => slot.status)))
    const uniqueInstructorIds = Array.from(new Set(slots.map((slot) => slot.class.instructorId)))
    const uniqueClassIds = Array.from(new Set(slots.map((slot) => slot.class.id)))

    const instructorMap = new Map(slots.map((slot) => [slot.class.instructorId, slot.class.instructorName]))
    const classMap = new Map(slots.map((slot) => [slot.class.id, slot.class.name]))

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const currentDay = new Date(startDate)
        currentDay.setDate(currentDay.getDate() + i)
        return currentDay
    })

    const navigate = useNavigate()

    // Effects
    useEffect(() => {
        const pubSubService = new PubSub()
        const subscription = pubSubService.receiveMessage().subscribe((message: IPubSubMessage) => {
            if (message.content.includes("changed") && message.topic.includes("scheduler_attendance")) {
                fetchSlotsForWeek(year, weekNumber)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [year, weekNumber, idToken, currentAccount.accountFirebaseId])

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
                setCancelReasons([
                    "Teacher unavailable",
                    "Room maintenance",
                    "Holiday",
                    "Emergency",
                    "Weather conditions",
                    "Other",
                ])
            }
        }

        fetchCancelReasons()
    }, [idToken])

    // Handlers
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
                ...filters,
            })

            setSlots(response.data)
            setStartDate(startDate)
            setEndDate(endDate)
        } catch (error) {
            console.error("Failed to fetch slots for week:", error)
            toastWarning("Failed to fetch schedule data. Please try again.")
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
            toastWarning("Failed to load slot details. Please try again.")
        }
    }

    const handleWeekChange = (newWeekNumber: number) => {
        setWeekNumber(newWeekNumber)

        // Update URL with new week parameter
        const url = new URL(window.location.href)
        url.searchParams.set("week", newWeekNumber.toString())
        url.searchParams.set("year", year.toString())
        navigate(url.pathname + url.search)

        fetchSlotsForWeek(year, newWeekNumber)
    }

    const handleYearChange = (newYear: string) => {
        const yearNumber = Number.parseInt(newYear, 10)
        setYear(yearNumber)

        // Update URL with new year parameter
        const url = new URL(window.location.href)
        url.searchParams.set("year", yearNumber.toString())
        url.searchParams.set("week", weekNumber.toString())
        navigate(url.pathname + url.search)

        fetchSlotsForWeek(yearNumber, weekNumber)
    }

    const handleFilterChange = (name: string, value: any) => {
        setFilters((prev) => {
            if (Array.isArray(value)) {
                return {
                    ...prev,
                    [name]: value,
                }
            } else {
                // Handle single value case
                const currentArray = prev[name as keyof typeof filters] as any[]
                return {
                    ...prev,
                    [name]: currentArray.includes(value)
                        ? currentArray.filter((item) => item !== value)
                        : [...currentArray, value],
                }
            }
        })
    }

    const resetFilters = () => {
        setFilters({
            shifts: [],
            slotStatuses: [],
            instructorFirebaseIds: [],
            studentFirebaseId: "",
            classIds: classId ? [classId] : [],
        })
        fetchSlotsForWeek(year, weekNumber)
    }

    const applyFilters = async () => {
        try {
            setIsFilterLoading(true)
            await fetchSlotsForWeek(year, weekNumber)
            setIsFilterModalOpen(false)
        } catch (error) {
            console.error("Error applying filters:", error)
        } finally {
            setIsFilterLoading(false)
        }
    }

    const handleReasonChange = (value: string) => {
        if (value === "Other") {
            setIsOtherSelected(true)
            setCancelReason("")
        } else {
            setIsOtherSelected(false)
            setCancelReason(value)
        }
    }

    const handleReplaceThenCancel = async () => {
        if (!selectedSlotToCancel || !cancelReason.trim() || !selectedBlankSlot) {
            toastWarning("Please fill in all required fields")
            return
        }

        try {
            setIsLoading(true)

            // Step 1: Create the replacement slot first
            const roomId = selectedBlankSlot.roomId
            const slotClassId = selectedSlotToCancel.class?.id

            // Make sure we have valid IDs
            if (!roomId || !slotClassId) {
                toastWarning("Invalid room or class information")
                return
            }

            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!guidRegex.test(roomId) || !guidRegex.test(slotClassId)) {
                console.error("Invalid GUID format:", { roomId, slotClassId })
                toastWarning("Error: roomId or classId is not in the correct GUID format.")
                return
            }

            const response = await fetchPublicNewSlot(
                roomId,
                selectedBlankSlot.date,
                selectedBlankSlot.shift,
                slotClassId,
                idToken,
            )

            // Step 2: Cancel the original slot
            await fetchCancelSlot(selectedSlotToCancel.id, cancelReason, idToken)

            // Close dialog and reset states
            setIsCancelDialogOpen(false)
            setCancelReason("")
            setSelectedSlotToCancel(null)
            setSelectedBlankSlot(null)

            toast.success("Slot has been cancelled and replaced successfully")

            // Refresh the page to show updated data
            navigate(0)
        } catch (error) {
            console.error("Error in replace-then-cancel process:", error)
            toastWarning("Failed to cancel and replace slot. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChangeTeacher = async () => {
        if (!newTeacherId || !selectedSlot || !changeTeacherReason.trim()) {
            toastWarning("Please fill in all required fields")
            return
        }

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

            toast.success("Teacher has been changed successfully")
        } catch (error) {
            console.error("Failed to assign teacher:", error)
            toastWarning("Failed to change teacher. Please try again.")
        } finally {
            setIsTeacherLoading(false)
        }
    }


    return (
        <div className="staff-scheduler p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen relative">
            {/* Loading Overlays */}
            {isFilterLoading && <LoadingOverlay message="Applying filters..." />}
            {isLoading && <LoadingOverlay message="Processing..." />}

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <Music className="w-8 h-8 mr-2 text-theme" />
                        {classId ? `${className} Schedule` : "Staff Scheduler"}
                    </h1>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                            <Filter className="mr-2 h-4 w-4" /> Filters
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">Week</span>
                                <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
                                    <SelectTrigger className=" bg-white border-slate-200">
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
                                        <TableRow className="bg-theme hover:bg-theme">
                                            <TableHead className="h-14 text-center text-primary-foreground font-semibold w-32">
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
                                                    <div className="font-medium">{getVietnameseWeekday(date)}</div>
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
                                                                {slotsForDateAndShift.length <= 2 ? (
                                                                    slotsForDateAndShift.map((slot, idx) => (
                                                                        <SlotCard
                                                                            key={idx}
                                                                            slot={slot}
                                                                            onClick={() => slot.status !== SlotStatus.Cancelled && handleSlotClick(slot.id)}
                                                                        />
                                                                    ))
                                                                ) : (
                                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                                        <div className="font-medium text-slate-700 mb-1">
                                                                            {slotsForDateAndShift.length} slots
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {slotsForDateAndShift.map((slot, idx) => (
                                                                                <TooltipProvider key={idx}>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Badge
                                                                                                variant={slot.status === SlotStatus.Cancelled ? "outline" : "default"}
                                                                                                className="cursor-pointer"
                                                                                                onClick={() =>
                                                                                                    slot.status !== SlotStatus.Cancelled && handleSlotClick(slot.id)
                                                                                                }
                                                                                            >
                                                                                                {slot.room?.name}
                                                                                            </Badge>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>
                                                                                            <p>{slot.class?.name}</p>
                                                                                            <p className="text-xs">{SlotStatusText[slot.status]}</p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
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
                                        <TableRow className="bg-theme hover:bg-theme">
                                            <TableHead className="text-primary-foreground">Date</TableHead>
                                            <TableHead className="text-primary-foreground">Time</TableHead>
                                            <TableHead className="text-primary-foreground">Room</TableHead>
                                            <TableHead className="text-primary-foreground">Class</TableHead>
                                            <TableHead className="text-primary-foreground">Teacher</TableHead>
                                            <TableHead className="text-primary-foreground">Status</TableHead>
                                            <TableHead className="text-primary-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...slots].sort((a, b) => {
                                            const dateComparison = a.date.localeCompare(b.date)
                                            if (dateComparison !== 0) return dateComparison
                                            return a.shift - b.shift
                                        }).map((slot, idx) => (
                                            <TableRow key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
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
                                                                    ? "success"
                                                                    : slot.status === SlotStatus.Ongoing
                                                                        ? "secondary"
                                                                        : "outline"
                                                        }
                                                    >
                                                        {SlotStatusText[slot.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleSlotClick(slot.id)}
                                                            disabled={slot.status === SlotStatus.Cancelled}
                                                        >
                                                            <Info className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
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
                    <DialogContent className="bg-white shadow-xl rounded-2xl max-w-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                                <CalendarClock className="w-6 h-6 text-indigo-700" />
                                Slot Detail
                            </DialogTitle>
                        </DialogHeader>

                        {selectedSlot && (
                            <div className="space-y-6 mt-4 text-slate-800 text-sm md:text-base">
                                {/* Class Information */}
                                <div className="bg-gradient-to-br from-slate-100 to-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-indigo-700">
                                        <BookOpen className="w-5 h-5" /> Class Information
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
                                                <strong>Number of Students:</strong> {selectedSlot.numberOfStudents}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CalendarClock size={18} className="text-theme" />
                                            <span>
                                                <strong>Slot No/Total Slot:</strong> {selectedSlot.slotNo || "-"} of{" "}
                                                {selectedSlot.slotTotal || "-"}
                                            </span>
                                        </div>
                                        {selectedSlot.slotNote && (
                                            <div className="flex items-center gap-2">
                                                <StickyNote size={18} className="text-theme" />
                                                <span>
                                                    <strong>Note:</strong> {selectedSlot.slotNote}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Staff Actions */}
                                <div className="mt-6 border-t border-slate-200 pt-5">
                                    <div className="bg-gradient-to-br from-slate-100 to-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-lg font-semibold mb-3 text-indigo-700 flex items-center gap-2">
                                            <Settings className="w-5 h-5" />
                                            Staff Actions
                                        </h3>
                                        <div className="flex flex-wrap justify-end gap-3">
                                            {/* Slot Detail Button */}
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/staff/classes/slot/${selectedSlot.id}`)}
                                                disabled={
                                                    !isCurrentDatePastSlotDate(selectedSlot.date) || selectedSlot.status === SlotStatus.Cancelled
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                <Info className="w-4 h-4" />
                                                Slot Detail
                                            </Button>

                                            {/* Change Teacher Button */}
                                            <Button
                                                variant="secondary"
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
                                                        toastWarning("Failed to load available teachers. Please try again.")
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
                                                variant="destructive"
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
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Filter Modal */}
                <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                    <DialogContent className="bg-white rounded-lg shadow-lg max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center">
                                <Filter className="w-5 h-5 mr-2 text-theme" />
                                Filter Options
                            </DialogTitle>
                        </DialogHeader>

                        {/* Active filters summary */}
                        {(filters.shifts.length > 0 ||
                            filters.slotStatuses.length > 0 ||
                            filters.instructorFirebaseIds.length > 0 ||
                            filters.classIds.length > 0) && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl mb-4 border border-indigo-100">
                                    <h3 className="font-medium text-indigo-800 mb-2 flex items-center">
                                        <Filter className="w-4 h-4 mr-2" />
                                        Active Filters
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.shifts.length > 0 && (
                                            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 px-3 py-1 shadow-sm">
                                                {filters.shifts.length} Shift(s)
                                                <button
                                                    className="ml-2 text-theme hover:text-indigo-800"
                                                    onClick={() => {
                                                        setFilters((prev) => ({ ...prev, shifts: [] }))
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        {filters.slotStatuses.length > 0 && (
                                            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 px-3 py-1 shadow-sm">
                                                {filters.slotStatuses.length} Status(es)
                                                <button
                                                    className="ml-2 text-theme hover:text-indigo-800"
                                                    onClick={() => {
                                                        setFilters((prev) => ({ ...prev, slotStatuses: [] }))
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        {filters.instructorFirebaseIds.length > 0 && (
                                            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 px-3 py-1 shadow-sm">
                                                {filters.instructorFirebaseIds.length} Teacher(s)
                                                <button
                                                    className="ml-2 text-theme hover:text-indigo-800"
                                                    onClick={() => {
                                                        setFilters((prev) => ({ ...prev, instructorFirebaseIds: [] }))
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        {filters.classIds.length > 0 && (
                                            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 px-3 py-1 shadow-sm">
                                                {filters.classIds.length} Class(es)
                                                <button
                                                    className="ml-2 text-theme hover:text-indigo-800"
                                                    onClick={() => {
                                                        setFilters((prev) => ({ ...prev, classIds: [] }))
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        <button className="text-sm text-theme hover:text-indigo-800 underline" onClick={resetFilters}>
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}

                        <ScrollArea className="max-h-[60vh] pr-2">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200 shadow-sm">
                                    <h3 className="font-semibold mb-4 text-indigo-800 flex items-center text-lg">
                                        <Clock className="w-5 h-5 mr-2 text-indigo-700" />
                                        Shift Times
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {uniqueShifts.map((value) => (
                                            <div
                                                key={value}
                                                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${filters.shifts.includes(value)
                                                    ? "bg-indigo-200 border-indigo-300 shadow-md"
                                                    : "bg-white border-indigo-100 hover:bg-indigo-50"
                                                    }`}
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "shifts",
                                                        filters.shifts.includes(value)
                                                            ? filters.shifts.filter((s) => s !== value)
                                                            : [...filters.shifts, value],
                                                    )
                                                }
                                            >
                                                <Checkbox
                                                    id={`shift-${value}`}
                                                    checked={filters.shifts.includes(value)}
                                                    className="data-[state=checked]:bg-theme data-[state=checked]:border-theme"
                                                />
                                                <label htmlFor={`shift-${value}`} className="text-indigo-800 flex-1 cursor-pointer text-sm">
                                                    {shiftTimesMap[value]}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 shadow-sm">
                                    <h3 className="font-semibold mb-4 text-purple-800 flex items-center text-lg">
                                        <Info className="w-5 h-5 mr-2 text-purple-700" />
                                        Slot Status
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {uniqueSlotStatuses.map((value) => (
                                            <div
                                                key={value}
                                                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${filters.slotStatuses.includes(value)
                                                    ? "bg-purple-200 border-purple-300 shadow-md"
                                                    : "bg-white border-purple-100 hover:bg-purple-50"
                                                    }`}
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "slotStatuses",
                                                        filters.slotStatuses.includes(value)
                                                            ? filters.slotStatuses.filter((s) => s !== value)
                                                            : [...filters.slotStatuses, value],
                                                    )
                                                }
                                            >
                                                <Checkbox
                                                    id={`status-${value}`}
                                                    checked={filters.slotStatuses.includes(value)}
                                                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                                />
                                                <label htmlFor={`status-${value}`} className="text-purple-800 flex-1 cursor-pointer text-sm">
                                                    {SlotStatusText[value]}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-5 rounded-xl border border-pink-200 shadow-sm">
                                        <h3 className="font-semibold mb-4 text-pink-800 flex items-center text-lg">
                                            <User className="w-5 h-5 mr-2 text-pink-700" />
                                            Teachers
                                        </h3>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {uniqueInstructorIds.map((id) => (
                                                <div
                                                    key={id}
                                                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${filters.instructorFirebaseIds.includes(id || "")
                                                        ? "bg-pink-200 border-pink-300 shadow-md"
                                                        : "bg-white border-pink-100 hover:bg-pink-50"
                                                        }`}
                                                    onClick={() =>
                                                        handleFilterChange(
                                                            "instructorFirebaseIds",
                                                            filters.instructorFirebaseIds.includes(id || "")
                                                                ? filters.instructorFirebaseIds.filter((i) => i !== id)
                                                                : [...filters.instructorFirebaseIds, id],
                                                        )
                                                    }
                                                >
                                                    <Checkbox
                                                        id={`instructor-${id}`}
                                                        checked={id ? filters.instructorFirebaseIds.includes(id) : false}
                                                        className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                                                    />
                                                    <label htmlFor={`instructor-${id}`} className="text-pink-800 flex-1 cursor-pointer text-sm">
                                                        {instructorMap.get(id) || "Unknown Instructor"}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200 shadow-sm">
                                        <h3 className="font-semibold mb-4 text-amber-800 flex items-center text-lg">
                                            <Users className="w-5 h-5 mr-2 text-amber-700" />
                                            Classes
                                        </h3>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {uniqueClassIds.map((id) => (
                                                <div
                                                    key={id}
                                                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${filters.classIds.includes(id)
                                                        ? "bg-amber-200 border-amber-300 shadow-md"
                                                        : "bg-white border-amber-100 hover:bg-amber-50"
                                                        }`}
                                                    onClick={() =>
                                                        handleFilterChange(
                                                            "classIds",
                                                            filters.classIds.includes(id)
                                                                ? filters.classIds.filter((c) => c !== id)
                                                                : [...filters.classIds, id],
                                                        )
                                                    }
                                                >
                                                    <Checkbox
                                                        id={`class-${id}`}
                                                        checked={filters.classIds.includes(id)}
                                                        className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                                    />
                                                    <label htmlFor={`class-${id}`} className="text-amber-800 flex-1 cursor-pointer text-sm">
                                                        {classMap.get(id) || "Unknown Class"}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                disabled={isFilterLoading}
                            >
                                <X className="w-4 h-4 mr-1.5" />
                                Reset
                            </Button>
                            <Button
                                onClick={applyFilters}
                                className="bg-theme hover:bg-indigo-700 text-white"
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
                                        Apply Filters
                                    </span>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Cancel Slot Dialog */}
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
                    <DialogContent className="bg-white rounded-lg shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Cancel and Replace Lesson</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <p className="text-slate-700 mb-4">
                                Please enter a reason for cancellation and select an alternative slot. If you do not select an
                                alternative slot, the lesson will not be canceled.
                            </p>
                            {selectedSlotToCancel && (
                                <div className="space-y-2 bg-slate-50 p-3 rounded-lg mb-4">
                                    <p className="text-slate-700">
                                        <strong>Room:</strong> <span className="text-theme">{selectedSlotToCancel.room?.name}</span>
                                    </p>
                                    <p className="text-slate-700">
                                        <strong>Class:</strong> <span className="text-theme">{selectedSlotToCancel.class?.name}</span>
                                    </p>
                                    <p className="text-slate-700">
                                        <strong>Shift:</strong>{" "}
                                        <span className="text-theme">
                                            {shiftTimesMap[selectedSlotToCancel.shift]} - {selectedSlotToCancel.date}
                                        </span>
                                    </p>
                                </div>
                            )}
                            <div className="mt-4">
                                <label htmlFor="cancelReason" className="text-slate-700 font-semibold">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <Select value={isOtherSelected ? "Other" : cancelReason} onValueChange={handleReasonChange}>
                                    <SelectTrigger id="cancelReason" className="w-full mt-1">
                                        <SelectValue placeholder="Select reason for cancellation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cancelReasons.map((reason, index) => (
                                            <SelectItem key={index} value={reason}>
                                                {reason}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isOtherSelected && (
                                    <Input
                                        type="text"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full mt-2"
                                        placeholder="Enter reason for canceling the lesson"
                                        required
                                    />
                                )}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-slate-700 font-semibold mb-2">Select alternative slot (required to cancel)</h3>
                                <BlankSlotSelector
                                    blankSlots={blankSlots}
                                    selectedBlankSlot={selectedBlankSlot}
                                    onSelectBlankSlot={setSelectedBlankSlot}
                                    shiftTimesMap={shiftTimesMap}
                                />
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCancelDialogOpen(false)
                                        setCancelReason("")
                                        setSelectedBlankSlot(null)
                                    }}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={handleReplaceThenCancel}
                                    disabled={isLoading || !cancelReason.trim() || !selectedBlankSlot || blankSlots.length === 0}
                                >
                                    {isLoading ? "Processing..." : "Confirm"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Change Teacher Dialog */}
                <Dialog open={isChangeTeacherDialogOpen} onOpenChange={setIsChangeTeacherDialogOpen}>
                    <DialogContent className="bg-white rounded-lg shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Change Teacher</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            {selectedSlot && (
                                <div className="space-y-2 bg-slate-50 p-3 rounded-lg mb-4">
                                    <p className="text-slate-700">
                                        <strong>Room:</strong> <span className="text-theme">{selectedSlot.room?.name}</span>
                                    </p>
                                    <p className="text-slate-700">
                                        <strong>Class:</strong> <span className="text-theme">{selectedSlot.class?.name}</span>
                                    </p>
                                    <p className="text-slate-700">
                                        <strong>Current teacher:</strong>{" "}
                                        <span className="text-theme">{selectedSlot.teacher?.fullName}</span>
                                    </p>
                                    <p className="text-slate-700">
                                        <strong>Shift:</strong>{" "}
                                        <span className="text-theme">
                                            {shiftTimesMap[selectedSlot.shift]} - {selectedSlot.date}
                                        </span>
                                    </p>
                                </div>
                            )}
                            <div className="mt-4">
                                <label htmlFor="newTeacher" className="text-slate-700 font-semibold">
                                    Select new teacher <span className="text-red-500">*</span>
                                </label>
                                <Select value={newTeacherId} onValueChange={setNewTeacherId}>
                                    <SelectTrigger id="newTeacher" className="w-full mt-1">
                                        <SelectValue placeholder="Select new teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeachers.map((teacher) => (
                                            <SelectItem key={teacher.accountFirebaseId} value={teacher.accountFirebaseId}>
                                                {teacher.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="mt-4">
                                    <label htmlFor="changeReason" className="text-slate-700 font-semibold">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        id="changeReason"
                                        value={changeTeacherReason}
                                        onChange={(e) => setChangeTeacherReason(e.target.value)}
                                        className="w-full mt-1"
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
                                    disabled={isTeacherLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleChangeTeacher}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                                    disabled={!newTeacherId || !changeTeacherReason.trim() || isTeacherLoading}
                                >
                                    {isTeacherLoading ? (
                                        <span className="flex items-center">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                            Processing...
                                        </span>
                                    ) : (
                                        "Confirm Changes"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </div>
    )
}
