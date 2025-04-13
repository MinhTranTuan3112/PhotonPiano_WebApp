import type React from "react"
import {useEffect, useState} from "react"
import {useNavigate} from "@remix-run/react"
import {getWeekRange} from "~/lib/utils/datetime"
import {
    fetchAttendanceStatus,
    fetchBlankSlots,
    fetchCancelSlot,
    fetchPublicNewSlot,
    fetchSlotById,
    fetchSlots
} from "~/lib/services/scheduler"
import {motion} from "framer-motion"
import {Calendar, Check, ChevronLeft, ChevronRight, Clock, Filter, Info, Music, User, Users, X} from "lucide-react"
import {
    AttendanceStatusText,
    BlankSlotModel,
    Shift,
    type SlotDetail,
    SlotStatus,
    SlotStatusText, SlotStudentModel,
    type StudentAttendanceModel,
} from "~/lib/types/Scheduler/slot"
import {type IPubSubMessage, PubSub} from "~/lib/services/pub-sub"
import {Button} from "~/components/ui/button";
import {Checkbox} from "~/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "~/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "~/components/ui/select";
import {Card} from "~/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "~/components/ui/table"
import {Badge} from "~/components/ui/badge"
import {cn} from "~/lib/utils"
import {Account, Role} from "~/lib/types/account/account"
import {fetchSystemConfigSlotCancel} from "~/lib/services/system-config";
import {CompactSlotView} from "~/components/scheduler/CompactSlotView";

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
    const currentDate = new Date();
    const slotDateObj = new Date(slotDate);

    // Compare the current date and time with the slot date and time
    return currentDate.getTime() > slotDateObj.getTime();
    // for demo
    //return true
}

const LoadingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <div className="animate-spin rounded-lg h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
                <p className="mt-4 text-indigo-800 font-semibold">Đang xử lý...</p>
            </div>
        </div>
    );
};

export const Scheduler = ({
    initialSlots, initialStartDate, initialEndDate, initialYear, initialWeekNumber, idToken, role, currentAccount,
    classId, className
}: {
    initialSlots: SlotDetail[],
    initialStartDate: Date,
    initialEndDate: Date,
    initialYear: number,
    initialWeekNumber: number,
    idToken: string,
    role: Role,
    currentAccount: Account,
    classId?: string,
    className?: string
}) => {
    const [slots, setSlots] = useState<SlotDetail[]>(initialSlots);
    const [year, setYear] = useState(initialYear);
    const [weekNumber, setWeekNumber] = useState(initialWeekNumber);
    const [startDate, setStartDate] = useState(new Date(initialStartDate));
    const [endDate, setEndDate] = useState(new Date(initialEndDate));
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [filters, setFilters] = useState({
        shifts: [] as Shift[],
        slotStatuses: [] as SlotStatus[],
        instructorFirebaseIds: [] as string[],
        studentFirebaseId: "",
        classIds: classId ? [classId] : [] as string[],
    });

    const [selectedSlotToCancel, setSelectedSlotToCancel] = useState<SlotDetail | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
    const [cancelReason, setCancelReason] = useState<string>("");
    const [blankSlots, setBlankSlots] = useState<BlankSlotModel[]>([]);
    const [selectedBlankSlot, setSelectedBlankSlot] = useState<BlankSlotModel | null>(null);
    const [cancelReasons, setCancelReasons] = useState<string[]>([]);
    const uniqueShifts = Array.from(new Set(slots.map((slot) => slot.shift)));
    const uniqueSlotStatuses = Array.from(new Set(slots.map((slot) => slot.status)));
    const uniqueInstructorIds = Array.from(new Set(slots.map((slot) => slot.class.instructorId)));
    const uniqueClassIds = Array.from(new Set(slots.map((slot) => slot.class.id)));
    const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false);
    const instructorMap = new Map(slots.map((slot) => [slot.class.instructorId, slot.class.instructorName]));
    const classMap = new Map(slots.map((slot) => [slot.class.id, slot.class.name]));

    useEffect(() => {
        console.log("isLoading updated:", isLoading);
    }, [isLoading]);

    useEffect(() => {
        console.log("selectedBlankSlot updated:", selectedBlankSlot);
    }, [selectedBlankSlot]);

    useEffect(() => {
        console.log("selectedSlotToCancel updated:", selectedSlotToCancel);
    }, [selectedSlotToCancel]);

    useEffect(() => {
        const pubSubService = new PubSub();
        const subscription = pubSubService.receiveMessage().subscribe((message: IPubSubMessage) => {
            if (message.content.includes("changed") && message.topic.includes("scheduler_attendance")) {
                Promise.all(
                    slots.map(async (slot) => {
                        try {
                            const attendanceStatusResponse = await fetchAttendanceStatus(slot.id, idToken);
                            const studentAttendanceModel: StudentAttendanceModel[] = attendanceStatusResponse.data;
                            const rs = studentAttendanceModel.find(
                                (studentAttendanceModel) =>
                                    studentAttendanceModel.studentFirebaseId?.toLowerCase() ===
                                    currentAccount.accountFirebaseId?.toLowerCase(),
                            );
                            return { ...slot, attendanceStatus: rs?.attendanceStatus };
                        } catch (error) {
                            console.error(`Failed to fetch attendance status for slot ${slot.id}:`, error);
                            return slot;
                        }
                    }),
                ).then((updatedSlots) => {
                    setSlots(updatedSlots);
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [year, weekNumber, slots, idToken, currentAccount.accountFirebaseId]);


    useEffect(() => {
        fetchSlotsForWeek(year, weekNumber);
    }, [year, weekNumber]);

    const fetchSlotsForWeek = async (year: number, week: number) => {
        try {
            const { startDate, endDate } = getWeekRange(year, week);
            const startTime = formatDateForAPI(startDate);
            const endTime = formatDateForAPI(endDate);
            
            const response = await fetchSlots({
                startTime,
                endTime,
                idToken,
                ...filters,
                studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
            });

            let updatedSlots: SlotDetail[] = response.data;

            if (role === 1 && currentAccount.accountFirebaseId) {
                if (!currentAccount.accountFirebaseId.trim()) {
                    console.warn("Empty accountFirebaseId for student role");
                    setSlots(response.data);
                    setStartDate(startDate);
                    setEndDate(endDate);
                    return;
                }
                updatedSlots = response.data.map((slot: SlotDetail) => {
                    if (!slot.slotStudents || slot.slotStudents.length === 0) {
                        console.warn(`No slotStudents for slot ${slot.id}`);
                        return { ...slot, attendanceStatus: 0 };
                    }
                    const studentRecord = slot.slotStudents.find(
                        (student: SlotStudentModel) => {
                            const studentId = student.studentFirebaseId?.toLowerCase();
                            const accountId = currentAccount.accountFirebaseId?.toLowerCase();
                            console.log("Comparing IDs for slot", slot.id, ":", { studentId, accountId });
                            if (!studentId || !accountId) {
                                console.warn(`Missing IDs for slot ${slot.id}:`, { studentId, accountId });
                                return false;
                            }
                            return studentId === accountId;
                        }
                    );
                    if (!studentRecord) {
                        console.warn(`No matching student record found for slot ${slot.id}`);
                        return { ...slot, attendanceStatus: 0 };
                    }
                    const attendanceStatus = Number(studentRecord.attendanceStatus) || 0;
                    console.log(`Attendance status for slot ${slot.id}:`, { slotStudents: slot.slotStudents, studentRecord, attendanceStatus });
                    return { ...slot, attendanceStatus };
                });
            }

            setSlots(updatedSlots);
            setStartDate(startDate);
            setEndDate(endDate);
        } catch (error) {
            console.error("Failed to fetch slots for week:", error);
        }
    };

    const handleSlotClick = async (slotId: string) => {
        try {
            const response = await fetchSlotById(slotId, idToken);
            const slotDetails: SlotDetail = response.data;
            setSelectedSlot(slotDetails);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch slot details:", error);
        }
    };

    const handleWeekChange = (newWeekNumber: number) => {
        setWeekNumber(newWeekNumber);
        fetchSlotsForWeek(year, newWeekNumber);
    };

    const handleYearChange = (newYear: string) => {
        const yearNumber = Number.parseInt(newYear, 10);
        setYear(yearNumber);
        fetchSlotsForWeek(yearNumber, weekNumber);
    };

    const handleFilterChange = (name: string, value: string | string[] | Shift[] | SlotStatus[]) => {
        setFilters((prev) => ({
            ...prev,
            [name]: Array.isArray(value)
                ? value
                : prev[name as keyof typeof filters].includes(value)
                    ? (prev[name as keyof typeof filters] as string[]).filter((item) => item !== value)
                    : [...(prev[name as keyof typeof filters] as string[]), value],
        }));
    };


    const resetFilters = () => {
        setFilters({
            shifts: [],
            slotStatuses: [],
            instructorFirebaseIds: [],
            studentFirebaseId: "",
            classIds: [],
        });
        fetchSlotsForWeek(year, weekNumber);
    };

    const applyFilters = async () => {
        try {
            setIsFilterLoading(true); // Show loading screen
            await fetchSlotsForWeek(year, weekNumber);
            setIsFilterModalOpen(false);
        } catch (error) {
            console.error("Error applying filters:", error);
        } finally {
            setIsFilterLoading(false); // Hide loading screen
        }
    };

    useEffect(() => {
        if (isCancelDialogOpen && selectedSlotToCancel) {
            const fetchBlankSlotsForWeek = async () => {
                try {
                    const startTime = formatDateForAPI(startDate);
                    const endTime = formatDateForAPI(endDate);
                    const blankSlotsResponse = await fetchBlankSlots(startTime, endTime, idToken);
                    setBlankSlots(blankSlotsResponse.data);
                } catch (error) {
                    console.error("Failed to fetch blank slots:", error);
                    setBlankSlots([]);
                }
            };
            fetchBlankSlotsForWeek();
        }
    }, [isCancelDialogOpen, selectedSlotToCancel, startDate, endDate, idToken]);


    useEffect(() => {
        const fetchCancelReasons = async () => {
            try {
                const response = await fetchSystemConfigSlotCancel({ idToken });
                const reasons = JSON.parse(response.data.configValue);
                setCancelReasons(reasons);
            } catch (error) {
                console.error("Failed to fetch cancel reasons:", error);
            }
        };

        fetchCancelReasons();
    }, [idToken]);

    const handleReasonChange = (e: { target: { value: never } }) => {
        const value = e.target.value;
        if (value === "Khác") {
            setIsOtherSelected(true);
            setCancelReason("");
        } else {
            setIsOtherSelected(false);
            setCancelReason(value);
        }
    };
    
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
            });
            return;
        }

        try {
            setIsLoading(true);
   

            // Step 1: Create the replacement slot first
            const roomId = selectedBlankSlot.roomId;
            const classId = selectedSlotToCancel.class.id;

            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!guidRegex.test(roomId) || !guidRegex.test(classId)) {
                console.error("Invalid GUID format:", { roomId, classId });
                alert("Lỗi: roomId hoặc classId không đúng định dạng GUID.");
                return;
            }

            console.log("Calling fetchPublicNewSlot with:", {
                roomId,
                date: selectedBlankSlot.date,
                shift: selectedBlankSlot.shift,
                classId,
            });
            const response = await fetchPublicNewSlot(
                roomId,
                selectedBlankSlot.date,
                selectedBlankSlot.shift,
                classId,
                idToken
            );
            const newSlot = response.data;
  

            // Step 2: Cancel the original slot only if replacement succeeds
            console.log("Calling fetchCancelSlot with:", {
                slotId: selectedSlotToCancel.id,
                cancelReason,
            });
            await fetchCancelSlot(selectedSlotToCancel.id, cancelReason, idToken);
     

            // Update local state (optional, since we'll refresh)
            const updatedSlots = slots
                .map((slot) =>
                    slot.id === selectedSlotToCancel.id
                        ? { ...slot, status: SlotStatus.Cancelled, cancelReason }
                        : slot
                )
                .concat(newSlot);
            setSlots(updatedSlots);

            // Close dialog and reset states
            setIsCancelDialogOpen(false);
            setCancelReason("");
            setSelectedSlotToCancel(null);
            setSelectedBlankSlot(null);

            // Refresh the page
   
            navigate(0); // This reloads the current page
        } catch (error) {
            console.error("Error in replace-then-cancel process:", error);
        } finally {
            console.log("Resetting isLoading to false");
            setIsLoading(false);
        }
    };
    
    const navigate = useNavigate();

    return (
        <div
            className="scheduler-page p-6 bg-gradient-to-b from-indigo-50 to-white min-h-screen relative"
            style={{
                backgroundSize: "cover",
                backgroundPosition: "bottom",
            }}
        >
            {/* Loading Overlay for Filter */}
            {isFilterLoading && <LoadingOverlay />}
            {isLoading && <LoadingOverlay />}

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto justify-end">
                    <div className="current-user bg-white/90 p-3 rounded-lg shadow-md backdrop-blur-sm w-full md:w-auto text-center">
                        <p className="text-sm font-semibold text-indigo-800">{currentAccount.email}</p>
                        <p className="text-xs text-indigo-600">{currentAccount.fullName}</p>
                    </div>
                </div>
                <div className="flex justify-center items-center mb-6">
                    <h1 className="title text-3xl font-bold text-center text-blue-900 flex items-center">
                        <Music className="w-8 h-8 mr-2 text-indigo-800" />
                        Lịch học của {classId ? `lớp ${className}` : "Trung tâm"}
                        <Music className="w-8 h-8 ml-2 text-indigo-800" />
                    </h1>
                </div>

                <div className="controls flex flex-wrap justify-center mb-6 space-x-4">
                    <div className="control flex flex-col mb-4 sm:mb-0">
                        <span className="mb-1 font-semibold text-indigo-800">Tuần:</span>
                        <Select value={weekNumber.toString()} onValueChange={(value) => handleWeekChange(Number(value))}>
                            <SelectTrigger className="w-[180px] bg-white border-blue-300 text-blue-800 rounded-lg shadow-sm focus:ring-blue-500">
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

                    <div className="control flex flex-col">
                        <span className="mb-1 font-semibold text-indigo-800">Năm:</span>
                        <Select value={year.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[180px] bg-white border-blue-300 text-blue-800 rounded-lg shadow-sm focus:ring-blue-500">
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
                    {role === 4 && (
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                            disabled={isFilterLoading} // Disable while loading
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
                        className="bg-white border-blue-300 text-blue-800 hover:bg-blue-100 rounded-lg shadow-md transition-all duration-200"
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
                        className="bg-white border-blue-300 text-blue-800 hover:bg-blue-100 rounded-lg shadow-md transition-all duration-200"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <Card className="overflow-hidden border-0 shadow-xl">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-blue-600 hover:bg-blue-600">
                                    <TableHead className="h-14 text-center text-primary-foreground font-semibold w-32">
                                        Thời gian
                                    </TableHead>
                                    {weekDates.map((date, i) => (
                                        <TableHead
                                            key={i}
                                            className={cn(
                                                "text-center text-primary-foreground px-3 min-w-[150px]",
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
                                        <TableCell className="text-center font-medium py-3 border-r">{time}</TableCell>
                                        {weekDates.map((date, dateIndex) => {
                                            const currentDayString = formatDateForAPI(date);
                                            const slotForDateAndShift = slots.filter(
                                                (slot) => slot.date === currentDayString && shiftTimesMap[slot.shift] === time,
                                            );

                                            return (
                                                <TableCell
                                                    key={dateIndex}
                                                    className={cn("p-2 align-top h-[130px]", dateIndex < 6 ? "border-r border-border/60" : "")}
                                                >
                                                    <div className="flex flex-col gap-2 "> {
                                                    slotForDateAndShift.length <= 2 ? (
                                                        slotForDateAndShift.map((slot, idx) => (
                                                            <motion.div
                                                                key={idx}
                                                                className={cn(
                                                                    "rounded-lg shadow p-3 transition-all duration-200",
                                                                    slot.status === SlotStatus.Cancelled
                                                                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                                                                        : slot.status === SlotStatus.Ongoing
                                                                            ? "bg-blue-50 border border-blue-200 hover:shadow-md cursor-pointer"
                                                                            : slot.status === SlotStatus.Finished
                                                                                ? "bg-green-50 border border-green-200 hover:shadow-md cursor-pointer"
                                                                                : "bg-white border border-blue-100 hover:shadow-md cursor-pointer",
                                                                )}
                                                                onClick={() => slot.status !== SlotStatus.Cancelled && handleSlotClick(slot.id)}
                                                                whileHover={slot.status !== SlotStatus.Cancelled ? { scale: 1.02 } : {}}
                                                                whileTap={slot.status !== SlotStatus.Cancelled ? { scale: 0.98 } : {}}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "text-lg font-bold flex items-center",
                                                                        slot.status === SlotStatus.Cancelled ? "text-muted-foreground" : "text-primary",
                                                                    )}
                                                                >
                                                                    <Music className="mr-1 w-4 h-4" />
                                                                    {slot.room?.name}
                                                                </div>
                                                                <div className="text-sm">{slot.class?.name}</div>
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {/* Badge for slotStatus */}
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
                                                                        {(() => {
                                                                            const displayText = SlotStatusText[slot.status];
                                                                            return displayText;
                                                                        })()}
                                                                    </Badge>
                                                                    {/* Badge for attendanceStatus (only for students) */}
                                                                    {role === 1 && (
                                                                        <Badge
                                                                            className="text-xs"
                                                                            variant={
                                                                                slot.attendanceStatus === 1
                                                                                    ? "success" // Present: green
                                                                                    : slot.attendanceStatus === 2
                                                                                        ? "destructive" // Absent: red
                                                                                        : "outline" // NotYet: default
                                                                            }
                                                                        >
                                                                            {(() => {
                                                                                const displayText = AttendanceStatusText[slot.attendanceStatus ?? 0];
                                                                                return displayText;
                                                                            })()}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {slot.status === SlotStatus.Cancelled && slot.slotNote && (
                                                                    <div className="text-xs mt-2 text-muted-foreground italic">
                                                                        Lý do hủy: {slot.slotNote}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        ))
                                                    ) : (
                                                        <CompactSlotView slots={slotForDateAndShift} onSlotClick={handleSlotClick} role={role} />
                                                    )}
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-indigo-900">Chi tiết tiết học</DialogTitle>
                        </DialogHeader>
                        {selectedSlot && (
                            <div>
                                <div className="space-y-3 p-6">
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
                                                        student.studentFirebaseId.toLowerCase() === currentAccount.accountFirebaseId?.toLowerCase(),
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
                                </div>
                                <div className="flex space-x-4 justify-end">
                                    {role === 2 && (
                                        <Button
                                            onClick={() => (window.location.href = `/teacher/scheduler/attendance/${selectedSlot.id}`)}
                                            disabled={
                                                isCurrentDatePastSlotDate(selectedSlot.date) === false || selectedSlot.status === SlotStatus.Cancelled
                                            }
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                                        >
                                            Điểm danh
                                        </Button>
                                    )}
                                    {role === 4 && (
                                        <div className="flex gap-4 mt-4">
                                            <Button
                                                onClick={() => {
                                                    navigate(`/staff/classes/slot/${selectedSlot.id}`)
                                                }}
                                                disabled={
                                                    !isCurrentDatePastSlotDate(selectedSlot.date) || selectedSlot.status === SlotStatus.Cancelled
                                                }
                                                className="font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                                            >
                                                Chi tiết buổi học
                                            </Button>
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
                                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                                            >
                                                Hủy buổi học
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                    <DialogContent className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-indigo-900 flex items-center">
                                <Filter className="w-5 h-5 mr-2 text-indigo-700" />
                                Tùy chọn bộ lọc
                            </DialogTitle>
                        </DialogHeader>

                        {/* Active filters summary */}
                        {(filters.shifts.length > 0 ||
                            filters.slotStatuses.length > 0 ||
                            filters.instructorFirebaseIds.length > 0 ||
                            filters.classIds.length > 0) && (
                            <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                <h3 className="font-medium text-indigo-800 mb-2">Bộ lọc đang áp dụng:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {filters.shifts.length > 0 && (
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                                            {filters.shifts.length} ca học
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
                                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                                            {filters.instructorFirebaseIds.length} giảng viên
                                            <button
                                                className="ml-2 text-purple-600 hover:text-purple-800"
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
                                            {filters.classIds.length} lớp học
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
                                    <button
                                        className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                        onClick={async () => {
                                            setIsFilterLoading(true)
                                            setFilters({
                                                shifts: [],
                                                slotStatuses: [],
                                                instructorFirebaseIds: [],
                                                studentFirebaseId: "",
                                                classIds: [],
                                            })
                                            try {
                                                const { startDate, endDate } = getWeekRange(year, weekNumber)
                                                const startTime = formatDateForAPI(startDate)
                                                const endTime = formatDateForAPI(endDate)

                                                const response = await fetchSlots({
                                                    startTime,
                                                    endTime,
                                                    idToken,
                                                    shifts: [],
                                                    slotStatuses: [],
                                                    instructorFirebaseIds: [],
                                                    studentFirebaseId: role === 1 ? currentAccount.accountFirebaseId?.toLowerCase() : "",
                                                    classIds: [],
                                                })

                                                setSlots(response.data)
                                            } catch (error) {
                                                console.error("Failed to update after removing all filters:", error)
                                            } finally {
                                                setIsFilterLoading(false)
                                            }
                                        }}
                                    >
                                        Xóa tất cả
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="font-semibold mb-3 text-blue-800 flex items-center text-base">
                                        <Clock className="w-4 h-4 mr-2 text-blue-700" />
                                        Ca học
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {uniqueShifts.map((value) => (
                                            <div
                                                key={value}
                                                className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-blue-100"
                                            >
                                                <Checkbox
                                                    id={`shift-${value}`}
                                                    checked={filters.shifts.includes(value)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange(
                                                            "shifts",
                                                            checked ? [...filters.shifts, value] : filters.shifts.filter((s) => s !== value),
                                                        )
                                                    }
                                                    className="text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`shift-${value}`} className="text-blue-800 flex-1 cursor-pointer">
                                                    {shiftTimesMap[value]}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h3 className="font-semibold mb-3 text-green-800 flex items-center text-base">
                                        <Info className="w-4 h-4 mr-2 text-green-700" />
                                        Trạng thái tiết học
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {uniqueSlotStatuses.map((value) => (
                                            <div
                                                key={value}
                                                className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-green-100"
                                            >
                                                <Checkbox
                                                    id={`status-${value}`}
                                                    checked={filters.slotStatuses.includes(value)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange(
                                                            "slotStatuses",
                                                            checked
                                                                ? [...filters.slotStatuses, value]
                                                                : filters.slotStatuses.filter((s) => s !== value),
                                                        )
                                                    }
                                                    className="text-green-600 border-green-300 rounded focus:ring-green-500"
                                                />
                                                <label htmlFor={`status-${value}`} className="text-green-800 flex-1 cursor-pointer">
                                                    {SlotStatusText[value]}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <h3 className="font-semibold mb-3 text-purple-800 flex items-center text-base">
                                        <User className="w-4 h-4 mr-2 text-purple-700" />
                                        Giảng viên
                                    </h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {uniqueInstructorIds.map((id) => (
                                            <div
                                                key={id}
                                                className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-purple-100"
                                            >
                                                <Checkbox
                                                    id={`instructor-${id}`}
                                                    checked={filters.instructorFirebaseIds.includes(id!)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange(
                                                            "instructorFirebaseIds",
                                                            checked
                                                                ? [...filters.instructorFirebaseIds, id!]
                                                                : filters.instructorFirebaseIds.filter((i) => i !== id),
                                                        )
                                                    }
                                                    className="text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                                                />
                                                <label htmlFor={`instructor-${id}`} className="text-purple-800 flex-1 cursor-pointer">
                                                    {instructorMap.get(id) || "Unknown Instructor"}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                    <h3 className="font-semibold mb-3 text-amber-800 flex items-center text-base">
                                        <Users className="w-4 h-4 mr-2 text-amber-700" />
                                        Lớp học
                                    </h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {uniqueClassIds.map((id) => (
                                            <div
                                                key={id}
                                                className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-amber-100"
                                            >
                                                <Checkbox
                                                    id={`class-${id}`}
                                                    checked={filters.classIds.includes(id)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange(
                                                            "classIds",
                                                            checked ? [...filters.classIds, id] : filters.classIds.filter((c) => c !== id),
                                                        )
                                                    }
                                                    className="text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                                                />
                                                <label htmlFor={`class-${id}`} className="text-amber-800 flex-1 cursor-pointer">
                                                    {classMap.get(id) || "Unknown Class"}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                                disabled={isFilterLoading}
                            >
                                <X className="w-4 h-4 mr-1.5" />
                                Thiết lập lại
                            </Button>
                            <Button
                                onClick={applyFilters}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                                disabled={isFilterLoading}
                            >
                                {isFilterLoading ? (
                                    <span className="flex items-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Đang áp dụng...
                  </span>
                                ) : (
                                    <span className="flex items-center">
                    <Check className="w-4 h-4 mr-1.5" />
                    Áp dụng bộ lọc
                  </span>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
                            <DialogTitle className="text-indigo-900">Hủy và thay thế buổi học</DialogTitle>
                        </DialogHeader>
                        <div className="p-6">
                            <p className="text-indigo-800 mb-4">
                                Vui lòng nhập lý do hủy và chọn slot thay thế. Nếu không chọn slot thay thế, buổi học sẽ không bị hủy.
                            </p>
                            {selectedSlotToCancel && (
                                <div className="space-y-2">
                                    <p className="text-indigo-800">
                                        <strong>Phòng:</strong> <span className="text-indigo-600">{selectedSlotToCancel.room?.name}</span>
                                    </p>
                                    <p className="text-indigo-800">
                                        <strong>Lớp:</strong> <span className="text-indigo-600">{selectedSlotToCancel.class?.name}</span>
                                    </p>
                                    <p className="text-indigo-800">
                                        <strong>Thời gian:</strong>{" "}
                                        <span className="text-indigo-600">
                      {shiftTimesMap[selectedSlotToCancel.shift]} - {selectedSlotToCancel.date}
                    </span>
                                    </p>
                                </div>
                            )}
                            <div className="mt-4">
                                <label htmlFor="cancelReason" className="text-indigo-800 font-semibold">
                                    Lý do hủy <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="cancelReason"
                                    value={isOtherSelected ? "Khác" : cancelReason}
                                    onChange={handleReasonChange}
                                    className="w-full mt-1 p-2 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-indigo-800"
                                    required
                                >
                                    <option value="" disabled>
                                        Chọn lý do hủy
                                    </option>
                                    {cancelReasons.map((reason, index) => (
                                        <option key={index} value={reason}>
                                            {reason}
                                        </option>
                                    ))}
                                    <option value="Khác">Khác</option>
                                </select>
                                {isOtherSelected && (
                                    <input
                                        type="text"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full mt-2 p-2 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-indigo-800"
                                        placeholder="Nhập lý do hủy buổi học"
                                        required
                                    />
                                )}
                            </div>
                            <div className="mt-4">
                                <h3 className="text-indigo-800 font-semibold mb-2">Chọn slot thay thế (bắt buộc để hủy)</h3>
                                {blankSlots.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {blankSlots.map((slot, index) => {
                                            const slotDate = slot.date
                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-2 border rounded-lg cursor-pointer hover:bg-indigo-50 ${
                                                        selectedBlankSlot === slot ? "bg-indigo-100 border-indigo-500" : "border-indigo-300"
                                                    }`}
                                                    onClick={() => setSelectedBlankSlot(slot)}
                                                >
                                                    <p className="text-indigo-800">
                                                        <strong>Phòng:</strong>{" "}
                                                        <span className="text-indigo-600">{slot.roomName || slot.roomId}</span>
                                                    </p>
                                                    <p className="text-indigo-800">
                                                        <strong>Thời gian:</strong>{" "}
                                                        <span className="text-indigo-600">
                              {shiftTimesMap[slot.shift]} - {slotDate}
                            </span>
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-indigo-800">Không có slot trống trong tuần này. Không thể hủy buổi học.</p>
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
                                    className="bg-white/90 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    onClick={handleReplaceThenCancel}
                                    disabled={isLoading || !cancelReason.trim() || !selectedBlankSlot || blankSlots.length === 0}
                                    className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                                >
                                    {isLoading ? "Đang xử lý..." : "Xác nhận"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </div>
    )
}

