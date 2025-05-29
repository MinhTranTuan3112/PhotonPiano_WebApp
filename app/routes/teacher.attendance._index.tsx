import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData, useNavigate} from "@remix-run/react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { fetchSlots } from "~/lib/services/scheduler";
import { Shift, SlotDetail, SlotStatus } from "~/lib/types/Scheduler/slot";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import {fetchDeadlineSchedulerSystemConfig, fetchSystemConfigServerTime} from "~/lib/services/system-config";
import {SystemConfig} from "~/lib/types/systemconfig/systemConfig";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { idToken, role, accountId } = await requireAuth(request);

        if (role !== Role.Instructor) {
            return redirect('/');
        }

        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Default to current date if no date is specified
        const currentDate = new Date();
        const dateParam = searchParams.get("date") || format(currentDate, "yyyy-MM-dd");

        // Parse the date parameter
        const selectedDate = dateParam ? parseISO(dateParam) : currentDate;

        // Format dates for API
        const formattedDate = format(selectedDate, "yyyy-MM-dd");

        // Fetch slots for the selected date
        const response = await fetchSlots({
            startTime: formattedDate,
            endTime: formattedDate,
            instructorFirebaseIds: [accountId],
            idToken
        });
        
        

        const deadlineResponse = await fetchDeadlineSchedulerSystemConfig({idToken});
        
        const deadlineData : SystemConfig = deadlineResponse.data;

        const slots: SlotDetail[] = response.data;
        
        const currentServerTime = await fetchSystemConfigServerTime({idToken});
        
        const currentServerDateTime = currentServerTime.data;

    
        // console.log("ID", slots.map((slot: SlotDetail) => slot.id));
        
        return Response.json({
            slots,
            selectedDate: formattedDate,
            idToken,
            deadlineData,
            currentServerDateTime
        });
    } catch (error) {
        console.error("Error loading attendance data:", error);
        return Response.json(
            { error: "Failed to load attendance data" },
            { status: 500 }
        );
    }
};

const shiftTimeMap = {
    [Shift.Shift1_7h_8h30]: { start: "07:00", end: "08:30" },
    [Shift.Shift2_8h45_10h15]: { start: "08:45", end: "10:15" },
    [Shift.Shift3_10h45_12h]: { start: "10:45", end: "12:00" },
    [Shift.Shift4_12h30_14h00]: { start: "12:30", end: "14:00" },
    [Shift.Shift5_14h15_15h45]: { start: "14:15", end: "15:45" },
    [Shift.Shift6_16h00_17h30]: { start: "16:00", end: "17:30" },
    [Shift.Shift7_18h_19h30]: { start: "18:00", end: "19:30" },
    [Shift.Shift8_19h45_21h15]: { start: "19:45", end: "21:15" },
};

// Function to parse time string (e.g., "07:00") into hours and minutes
const parseTime = (time: string): { hours: number; minutes: number } => {
    const [hours, minutes] = time.split(":").map(Number);
    return { hours, minutes };
};

const isNotToday = (slotDate: string, shift: Shift, deadlineValue: string | null, serverDateTime: string): boolean => {
    const now = new Date(serverDateTime);

    // Parse the slot date
    const slot = new Date(slotDate);
    if (isNaN(slot.getTime())) {
        console.warn("Invalid slot date:", slotDate);
        return true; // Prevent invalid dates from proceeding
    }

    // Get the shift's start time
    const shiftTime = shiftTimeMap[shift];
    if (!shiftTime) {
        console.warn("Unknown shift:", shift);
        return true; // Prevent unknown shifts from proceeding
    }

    // Combine slot date with shift start time
    const { hours, minutes } = parseTime(shiftTime.start);
    const slotStartTime = new Date(slot);
    slotStartTime.setHours(hours, minutes, 0, 0);

    console.log("Current time:", now);
    console.log("Slot start time:", slotStartTime);

    // If slot is in the future, attendance is not allowed
    if (slotStartTime > now) {
        return true;
    }

    // If slot is not today, attendance is not allowed
    if (
        now.getFullYear() !== slot.getFullYear() ||
        now.getMonth() !== slot.getMonth() ||
        now.getDate() !== slot.getDate()
    ) {
        return true;
    }

    // If it's today, check the deadline
    let additionalHours = 0;
    if (deadlineValue) {
        try {
            additionalHours = parseFloat(deadlineValue) || 0;
        } catch (error) {
            console.warn("Error parsing deadline value:", error);
        }
    }

    // Apply deadline (e.g., 2 hours after slot start time)
    const slotWithDeadline = new Date(slotStartTime);
    slotWithDeadline.setHours(slotWithDeadline.getHours() + additionalHours);

    console.log("-------------------------------------------------------");
    console.log("Slot with deadline:", slotWithDeadline);
    console.log("Current time:", now);
    console.log("Result:", now > slotWithDeadline);

    // If past the attendance deadline
    return now > slotWithDeadline;
};

export default function TeacherAttendance_index() {
    const { slots, selectedDate, deadlineData, currentServerDateTime} = useLoaderData<typeof loader>();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [tickingServerTime, setTickingServerTime] = useState(new Date(currentServerDateTime));
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const navigate = useNavigate();

    // Parse the selected date for display
    const parsedSelectedDate = parseISO(selectedDate);
    const formattedDisplayDate = format(parsedSelectedDate, "dd/MM/yyyy");

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            const formattedDate = format(date, "yyyy-MM-dd");
            setCalendarOpen(false);
            navigate(`?date=${formattedDate}`);
        }
    };

    useEffect(() => {
        setTickingServerTime(new Date(currentServerDateTime));
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTickingServerTime(prev => new Date(prev.getTime() + 1000));
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentServerDateTime]);

    const handlePreviousDay = () => {
        const previousDay = subDays(parsedSelectedDate, 1);
        navigate(`?date=${format(previousDay, "yyyy-MM-dd")}`);
    };

    const handleNextDay = () => {
        const nextDay = addDays(parsedSelectedDate, 1);
        navigate(`?date=${format(nextDay, "yyyy-MM-dd")}`);
    };

    // Filter slots based on search term and status
    const filteredSlots = slots.filter((slot : SlotDetail) => {
        const matchesSearch =
            slot.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            slot.room.name.toLowerCase().includes(searchTerm.toLowerCase());

        const isCompleted = slot.status === SlotStatus.Finished;
        const isUpcoming = slot.status === SlotStatus.NotStarted;
        const isOngoing = slot.status === SlotStatus.Ongoing;

        // Apply status filter
        switch (filterStatus) {
            case "all": return matchesSearch;
            case "completed": return matchesSearch && isCompleted;
            case "upcoming": return matchesSearch && isUpcoming;
            case "ongoing": return matchesSearch && isOngoing;
            default: return matchesSearch;
        }
    });

    // Convert shift enum to readable time
    const getShiftTime = (shift: Shift): string => {
        const shiftMap = {
            [Shift.Shift1_7h_8h30]: "07:00 - 08:30",
            [Shift.Shift2_8h45_10h15]: "08:45 - 10:15",
            [Shift.Shift3_10h45_12h]: "10:45 - 12:00",
            [Shift.Shift4_12h30_14h00]: "12:30 - 14:00",
            [Shift.Shift5_14h15_15h45]: "14:15 - 15:45",
            [Shift.Shift6_16h00_17h30]: "16:00 - 17:30",
            [Shift.Shift7_18h_19h30]: "18:00 - 19:30",
            [Shift.Shift8_19h45_21h15]: "19:45 - 21:15"
        };

        return shiftMap[shift] || "Unknown";
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-700">Attendance Management</h1>

                {/* Date navigation */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        onClick={handlePreviousDay}
                        variant="outline"
                        size="sm"
                        className="border-blue-200"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="min-w-[160px] justify-start text-left font-normal border-blue-200"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formattedDisplayDate}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={parsedSelectedDate}
                                onSelect={handleDateChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        onClick={handleNextDay}
                        variant="outline"
                        size="sm"
                        className="border-blue-200"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="text"
                        placeholder="Search for classes, classrooms..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Select
                    value={filterStatus}
                    onValueChange={(value) => setFilterStatus(value)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Slots List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {filteredSlots.length > 0 ? (
                    filteredSlots.map((slot : SlotDetail) => (
                        <Card
                            key={slot.id}
                            className={`overflow-hidden border transition hover:shadow-md ${
                                slot.status === SlotStatus.Finished
                                    ? "border-gray-200"
                                    : slot.status === SlotStatus.Ongoing
                                        ? "border-green-300"
                                        : "border-blue-300"
                            }`}
                        >
                            <CardHeader className={`py-3 px-4 ${
                                slot.status === SlotStatus.Finished
                                    ? "bg-gray-50"
                                    : slot.status === SlotStatus.Ongoing
                                        ? "bg-green-50"
                                        : "bg-blue-50"
                            }`}>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base font-medium">
                                        {slot.class.name}
                                    </CardTitle>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        slot.status === SlotStatus.Finished
                                            ? "bg-gray-200 text-gray-700"
                                            : (slot.status === SlotStatus.Ongoing
                                                ? "bg-green-200 text-green-700"
                                                : "bg-blue-200 text-blue-700")
                                    }`}>
                                        {slot.status === SlotStatus.Finished
                                            ? "Completed"
                                            : (slot.status === SlotStatus.Ongoing
                                                ? "On Going"
                                                : "Up Coming")}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Room:</span>
                                        <span className="font-medium">{slot.room.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Time:</span>
                                        <span className="font-medium">{getShiftTime(slot.shift)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Number of Learner:</span>
                                        <span className="font-medium">{slot.numberOfStudents} learner</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Slot No/Total:</span>
                                        <span className="font-medium">{slot.slotNo}/{slot.slotTotal}</span>
                                    </div>
                                    <Button
                                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                                        disabled={isNotToday(slot.date, slot.shift, deadlineData.configValue, tickingServerTime.toISOString())}
                                        onClick={() => window.location.href = `/teacher/attendance/${slot.id}`}
                                    >
                                        Attendance
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <h3 className="text-lg font-medium text-gray-700 mb-1">No classes found</h3>
                        <p className="text-gray-500 max-w-md">
                            No classes found for date {formattedDisplayDate} or with the current filter.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}