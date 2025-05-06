import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "@remix-run/react"
import { getWeekRange } from "~/lib/utils/datetime"
import { fetchAttendanceStatus, fetchSlotById, fetchSlots } from "~/lib/services/scheduler"
import { motion } from "framer-motion"
import {
  BookOpen,
  Calendar,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  ListFilter,
  Music,
  StickyNote,
  User,
  Users,
} from "lucide-react"
import {
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

const formatDateForDisplay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
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
  navigate,
}: {
  slots: SlotDetail[]
  date: Date
  onSlotClick: (slotId: string) => void
  navigate: (path: string) => void
}) => {
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
    <Card className="border-blue-100 shadow-md">
      <CardContent className="pt-4">
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
                    <div className="absolute -left-[43px] flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs shadow-sm">
                      <Clock className="w-3 h-3" />
                    </div>
                    {/* Slot cards */}
                    <div className="space-y-3">
                      {timeSlot.slots.map((slot) => (
                        <motion.div
                          key={slot.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all shadow-sm hover:shadow-md",
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
    <Card className="border-blue-100 shadow-md">
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header row with days */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="flex items-center justify-center h-12 font-medium text-blue-700 bg-blue-50 rounded-lg">
                Time
              </div>
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
                  <div className="flex items-center justify-center h-24 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg shadow-sm">
                    {shiftTimesMap[shift]}
                  </div>

                  {weekDates.map((date, dayIndex) => {
                    const dateString = format(date, "yyyy-MM-dd")
                    const slotsForCell = slots.filter((slot) => slot.date === dateString && slot.shift === shift)

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "h-24 rounded-lg border border-dashed border-gray-200 p-1 transition-all",
                          isSameDay(date, selectedDate) && "border-blue-200 bg-blue-50/30",
                        )}
                      >
                        {slotsForCell.length > 0 ? (
                          <div className="h-full">
                            {slotsForCell.map((slot) => (
                              <motion.div
                                key={slot.id}
                                className={cn(
                                  "h-full p-2 rounded-md text-xs transition-all shadow-sm",
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
const UpcomingClasses = ({
  slots,
  onSlotClick,
  navigate,
}: {
  slots: SlotDetail[]
  onSlotClick: (slotId: string) => void
  navigate: (path: string) => void
}) => {
  // Sort slots by date and shift
  const sortedSlots = [...slots]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.shift - b.shift
    })
    .slice(0, 5) // Show only the next 5 classes

  return (
    <Card className="border-blue-100 shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
        <CardTitle className="text-lg font-medium flex items-center text-blue-800">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Upcoming Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {sortedSlots.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No upcoming classes</div>
        ) : (
          <div className="space-y-3">
            {sortedSlots.map((slot) => (
              <motion.div
                key={slot.id}
                className="p-3 rounded-lg border border-blue-100 hover:border-blue-200 bg-white shadow-sm hover:shadow-md"
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Replace the StatsCards component with this updated version that counts unique classes and students
const StatsCards = ({ slots }: { slots: SlotDetail[] }) => {
  // Group by class to count unique classes and their slots
  const classesByName = slots.reduce(
    (acc, slot) => {
      const className = slot.class?.name || "Unnamed Class"
      const classId = slot.class?.id || "unknown"

      if (!acc[classId]) {
        acc[classId] = {
          name: className,
          slots: 1,
          students: slot.numberOfStudents,
          ongoingSlots: slot.status === SlotStatus.Ongoing ? 1 : 0,
        }
      } else {
        acc[classId].slots += 1
        if (slot.status === SlotStatus.Ongoing) {
          acc[classId].ongoingSlots += 1
        }
      }
      return acc
    },
    {} as Record<string, { name: string; slots: number; students: number; ongoingSlots: number }>,
  )

  // Count unique classes and total slots
  const uniqueClassCount = Object.keys(classesByName).length

  // Count ongoing slots
  const ongoingSlots = slots.filter((slot) => slot.status === SlotStatus.Ongoing).length

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
          <CardTitle className="text-sm font-medium text-blue-700">Classes</CardTitle>
          <BookOpen className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-3">
          <div className="text-2xl font-bold text-blue-900">{uniqueClassCount}</div>
          <div className="mt-2 max-h-24 overflow-y-auto">
            {Object.values(classesByName).map((classInfo, index) => (
              <div key={index} className="text-xs flex justify-between items-center py-1 border-t border-blue-50">
                <span className="truncate max-w-[70%]" title={classInfo.name}>
                  {classInfo.name}
                </span>
                <span className="font-medium text-blue-700">
                  {classInfo.slots} {classInfo.slots === 1 ? "slot" : "slots"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-amber-50 to-white rounded-t-lg">
          <CardTitle className="text-sm font-medium text-amber-700">Upcoming</CardTitle>
          <Clock className="w-4 h-4 text-amber-500" />
        </CardHeader>
        <CardContent className="pt-3">
          <div className="text-2xl font-bold text-amber-700">{ongoingSlots}</div>
          <p className="text-xs text-gray-500 mt-1">Scheduled slots this week</p>
          <div className="mt-2 max-h-24 overflow-y-auto">
            {Object.values(classesByName)
              .filter((classInfo) => classInfo.ongoingSlots > 0)
              .map((classInfo, index) => (
                <div key={index} className="text-xs flex justify-between items-center py-1 border-t border-amber-50">
                  <span className="truncate max-w-[70%]" title={classInfo.name}>
                    {classInfo.name}
                  </span>
                  <span className="font-medium text-amber-700">
                    {classInfo.ongoingSlots} {classInfo.ongoingSlots === 1 ? "slot" : "slots"}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
          <CardTitle className="text-sm font-medium text-blue-700">Students</CardTitle>
          <Users className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-3">
          <div className="text-2xl font-bold text-blue-900">
            {Object.values(classesByName).reduce((sum, classInfo) => sum + classInfo.students, 0)}
          </div>
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
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [activeView, setActiveView] = useState("daily")
  const [filters, setFilters] = useState<{
    shifts: number[]
    slotStatuses: number[]
    instructorFirebaseIds: string[]
    studentFirebaseId: string
    classIds: string[]
  }>({
    shifts: [],
    slotStatuses: [],
    instructorFirebaseIds: [],
    studentFirebaseId: "",
    classIds: [],
  })
  const [isWeekChanging, setIsWeekChanging] = useState(false)

  // Use a single navigate instance
  const navigate = useNavigate()

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
      setIsWeekChanging(true)
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
          setSlots(response.data)
          setStartDate(startDate)
          setEndDate(endDate)
          setIsWeekChanging(false)
          return
        }
        updatedSlots = response.data.map((slot: SlotDetail) => {
          if (!slot.slotStudents || slot.slotStudents.length === 0) {
            return { ...slot, attendanceStatus: 0 }
          }
          const studentRecord = slot.slotStudents.find((student: SlotStudentModel) => {
            const studentId = student.studentFirebaseId?.toLowerCase()
            const accountId = currentAccount.accountFirebaseId?.toLowerCase()
            if (!studentId || !accountId) {
              return false
            }
            return studentId === accountId
          })
          if (!studentRecord) {
            return { ...slot, attendanceStatus: 0 }
          }
          const attendanceStatus = Number(studentRecord.attendanceStatus) || 0
          return { ...slot, attendanceStatus }
        })
      }

      setSlots(updatedSlots)
      setStartDate(startDate)
      setEndDate(endDate)
      // Use current date or find the closest date in the week
      const today = new Date()
      const isCurrentDateInWeek = today >= startDate && today <= endDate
      setSelectedDate(isCurrentDateInWeek ? today : startDate)
    } catch (error) {
      // Error handling
    } finally {
      setIsWeekChanging(false)
    }
  }

  const handleSlotClick = async (slotId: string) => {
    try {
      const response = await fetchSlotById(slotId, idToken)
      const slotDetails: SlotDetail = response.data
      setSelectedSlot(slotDetails)
      setIsModalOpen(true)
    } catch (error) {
      // Error handling
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

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const currentDay = new Date(startDate)
    currentDay.setDate(currentDay.getDate() + i)
    return currentDay
  })

  // Filter slots for the selected date
  const slotsForSelectedDate = slots
    .filter((slot) => slot.date === formatDateForAPI(selectedDate))
    .sort((a, b) => a.shift - b.shift)

  return (
    <div className="container mx-auto px-4 py-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      {/* Loading Overlay */}
      {isFilterLoading && <LoadingOverlay />}

      <header className="mb-6 bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-900">Teacher Schedule</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-blue-300 text-blue-800 hover:bg-blue-50 transition-all"
              onClick={() => handleWeekChange(weekNumber > 1 ? weekNumber - 1 : 1)}
              disabled={isWeekChanging}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
              <SelectTrigger className="w-[210px] border-blue-300 text-blue-800 bg-white">
                <SelectValue placeholder="Select week">
                  {isWeekChanging ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    <>
                      Week {weekNumber}: {formatDateForDisplay(startDate)}
                    </>
                  )}
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

            <Button
              variant="outline"
              size="icon"
              className="border-blue-300 text-blue-800 hover:bg-blue-50 transition-all"
              onClick={() => handleWeekChange(weekNumber < 52 ? weekNumber + 1 : 52)}
              disabled={isWeekChanging}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px] border-blue-300 text-blue-800 bg-white">
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
      </header>

      {/* Stats Cards at the top */}
      <div className="mb-6">
        <StatsCards slots={slots} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar with navigation and upcoming classes */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
              <CardTitle className="text-lg font-medium flex items-center text-blue-800">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Week Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDates.map((date, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={cn(
                      "h-10 p-0 flex flex-col items-center justify-center transition-all",
                      isSameDay(date, selectedDate)
                        ? "bg-blue-100 text-blue-900 font-medium shadow-sm"
                        : "hover:bg-blue-50",
                    )}
                    onClick={() => handleDateSelect(date)}
                  >
                    <span className="text-xs font-medium">{getVietnameseWeekday(date)}</span>
                    <span className="text-sm">{format(date, "dd")}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <UpcomingClasses
            slots={slots.filter((slot) => slot.status === SlotStatus.Ongoing)}
            onSlotClick={handleSlotClick}
            navigate={navigate}
          />
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
              <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
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

              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium flex items-center shadow-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </div>
            </div>

            <TabsContent value="daily" className="mt-0">
              <DailySchedule
                slots={slotsForSelectedDate}
                date={selectedDate}
                onSlotClick={handleSlotClick}
                navigate={navigate}
              />
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
              <Card className="border-blue-100 shadow-md">
                <CardContent className="pt-4">
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
                            "p-4 rounded-lg border transition-all shadow-sm hover:shadow-md",
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

      {/* Slot Detail Dialog */}
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
                      <strong>Teacher:</strong>{" "}
                      {selectedSlot.teacher?.fullName ?? selectedSlot.teacher?.userName ?? "N/A"}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
