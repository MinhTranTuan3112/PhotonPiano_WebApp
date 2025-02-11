import React, { useEffect, useState } from 'react';
import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getWeekRange } from "~/lib/utils/datetime";
import { fetchAttendanceStatus, fetchSlotById, fetchSlots } from "~/lib/services/scheduler";
import { motion } from "framer-motion";
import { Piano, Calendar, Music } from "lucide-react";
import Modal from "~/components/scheduler/modal-props";
import { getWeek } from 'date-fns';
import {
    Slot,
    Shift,
    SlotDetail,
    AttendanceStatus,
    StudentAttendanceModel
} from "~/lib/types/Scheduler/slot";
import { requireAuth } from "~/lib/utils/auth";
import { fetchCurrentAccountInfo } from "~/lib/services/auth";
import { PubSub, IPubSubMessage } from '~/lib/services/pub-sub';

const shiftTimesMap: Record<Shift, string> = {
    [Shift.Shift1_7h_8h30]: "7:00 - 8:30",
    [Shift.Shift2_8h45_10h15]: "8:45 - 10:15",
    [Shift.Shift3_10h45_12h]: "10:45 - 12:00",
    [Shift.Shift4_12h30_14h00]: "12:30 - 14:00",
    [Shift.Shift5_14h15_15h45]: "14:15 - 15:45",
    [Shift.Shift6_16h00_17h30]: "16:00 - 17:30",
    [Shift.Shift7_18h_19h30]: "18:00 - 19:30",
    [Shift.Shift8_19h45_21h15]: "19:45 - 21:15",
};

const shiftTimes = Object.values(shiftTimesMap);

const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getVietnameseWeekday = (date: Date): string => {
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return weekdays[date.getDay()];
};

const isCurrentDatePastSlotDate = (slotDate: string): boolean => {
    // const currentDate = new Date();
    // const slotDateObj = new Date(slotDate);
    // const oneDayInMs = 24 * 60 * 60 * 1000;
    // const differenceInDays = (currentDate.getTime() - slotDateObj.getTime()) / oneDayInMs;
    //
    // return currentDate > slotDateObj && differenceInDays <= 1;

     // for demo
    return true;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { idToken, role } = await requireAuth(request);
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const currentYear = new Date().getFullYear();
        const currentDate = new Date();
        const currentWeekNumber = getWeek(currentDate);
        const year = parseInt(searchParams.get("year") || currentYear.toString());
        const weekNumber = parseInt(searchParams.get("week") || currentWeekNumber.toString());
        const { startDate, endDate } = getWeekRange(year, weekNumber);

        const startTime = searchParams.get("start-time") || formatDateForAPI(startDate);
        const endTime = searchParams.get("end-time") || formatDateForAPI(endDate);

        const currentAccountResponse = await fetchCurrentAccountInfo({ idToken });
        const currentAccount = currentAccountResponse.data;

        let accountId = "";

        if(role == 1){
            accountId = currentAccount.accountFirebaseId?.toLowerCase();
        }

        const response = await fetchSlots({ startTime, endTime, studentFirebaseId: accountId, idToken });
        const slots: Slot[] = response.data;

        for (const slot of slots) {
            const attendanceStatusResponse = await fetchAttendanceStatus(slot.id, idToken);
            const studentAttendanceModel : StudentAttendanceModel[] = attendanceStatusResponse.data;
            const rs = studentAttendanceModel.find((studentAttendanceModel) => studentAttendanceModel.studentFirebaseId?.toLowerCase() === currentAccount.accountFirebaseId?.toLowerCase());
            slot.attendanceStatus = rs?.attendanceStatus;
        }

        return { slots, year, weekNumber, startDate, endDate, idToken, role, currentAccount };
    } catch (error) {
        console.error("Failed to load data:", error);
        throw new Response("Failed to load data", { status: 500 });
    }
};

const SchedulerPage = () => {
    const { slots, startDate, endDate, year, weekNumber, idToken, role, currentAccount } = useLoaderData<typeof loader>();
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const pubSubService = new PubSub();
        const subscription = pubSubService.receiveMessage().subscribe((message: IPubSubMessage) => {
            console.log("[Pub Sub] Message received in Student screen:", message);

            if (message.content.includes("changed")) {
                console.log("[Pub Sub] Attendance updated. Fetching latest data...");
                location.reload();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSlotClick = async (slotId: string) => {
        console.log("Slot clicked:", slotId);
        try {
            const response = await fetchSlotById(slotId, idToken);
            const slotDetails: SlotDetail = response.data;
            console.log("Slot Details: ", slotDetails);
            setSelectedSlot(slotDetails);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch slot details:", error);
        }
    };


    const handleWeekChange = (newWeekNumber: number) => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("week", newWeekNumber.toString());
        window.location.href = newUrl.toString();
    };

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(event.target.value);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("year", newYear.toString());
        window.location.href = newUrl.toString();
    };

    return (
        <div className="scheduler-page p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="title text-4xl font-bold text-center text-blue-800 flex items-center">
                        <Piano className="mr-2" /> Piano Learning Center Timetable
                    </h1>
                    <div className="current-user bg-gray-100 p-2 rounded shadow-md">
                        <p className="text-sm font-semibold">{currentAccount.email}</p>
                        <p className="text-xs text-gray-600">{currentAccount.fullName}</p>
                    </div>
                </div>
                <div className="controls flex flex-wrap justify-center mb-6 space-x-4">
                    <label className="control flex flex-col mb-4 sm:mb-0">
                        <span className="mb-1 font-semibold text-blue-700">Year:</span>
                        <select
                            value={year}
                            onChange={handleYearChange}
                            className="px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            {Array.from({ length: 5 }, (_, i) => 2022 + i).map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="control flex flex-col">
                        <span className="mb-1 font-semibold text-blue-700">Week:</span>
                        <select
                            value={weekNumber}
                            onChange={(e) => handleWeekChange(parseInt(e.target.value))}
                            className="px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                                <option key={week} value={week}>
                                    Week {week}: {formatDateForDisplay(getWeekRange(year, week).startDate)} -{" "}
                                    {formatDateForDisplay(getWeekRange(year, week).endDate)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="week-info flex justify-center items-center mb-4 space-x-2">
                    <button
                        onClick={() => handleWeekChange(weekNumber - 1)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200"
                        disabled={weekNumber <= 1}
                    >
                        Previous Week
                    </button>
                    <p className="text-lg font-medium text-blue-700 flex items-center justify-center">
                        <Calendar className="mr-2" />
                        {formatDateForDisplay(new Date(startDate))} - {formatDateForDisplay(new Date(endDate))}
                    </p>
                    <button
                        onClick={() => handleWeekChange(weekNumber + 1)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200"
                        disabled={weekNumber >= 52}
                    >
                        Next Week
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="schedule-table w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                        <thead>
                        <tr className="bg-blue-600 text-white">
                            <th className="py-3 px-4 border-b border-blue-500">Time Slot</th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(startDate);
                                currentDay.setDate(currentDay.getDate() + i);
                                return (
                                    <th key={i} className="py-3 px-4 border-b border-blue-500">
                                        {getVietnameseWeekday(currentDay)}
                                    </th>
                                );
                            })}
                        </tr>
                        <tr className="bg-blue-100 text-blue-800">
                            <th className="py-2 px-4 border-b border-blue-200"></th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(startDate);
                                currentDay.setDate(currentDay.getDate() + i);
                                return (
                                    <th key={i} className="py-2 px-4 border-b border-blue-200 text-sm">
                                        {formatDateForDisplay(currentDay)}
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>
                        <tbody>
                        {shiftTimes.map((time: string, index: number) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                                <td className="time-slot py-4 px-2 font-semibold border-b border-blue-100">{time}</td>
                                {Array.from({ length: 7 }, (_, i) => {
                                    const currentDay = new Date(startDate);
                                    currentDay.setDate(currentDay.getDate() + i);
                                    const currentDayString = formatDateForAPI(currentDay);
                                    const slotForDateAndShift = slots.filter((slot: Slot) => {
                                        return slot.date === currentDayString && shiftTimesMap[slot.shift] === time;
                                    });
                                    return (
                                        <td key={i} className="slot-cell border-b border-blue-100 p-2">
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
                                                            {slot.attendanceStatus !== undefined
                                                                ? AttendanceStatus[slot.attendanceStatus]
                                                                :  AttendanceStatus[AttendanceStatus.NotYet] }
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="h-16 flex items-center justify-center text-gray-400">-</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    {selectedSlot && (
                        <div className="p-6 bg-white rounded-lg">
                            <h2 className="modal-title text-2xl font-bold mb-4 text-blue-800">Slot Details</h2>
                            <div className="space-y-3">
                                <p className="flex items-center">
                                    <strong className="mr-2">Room:</strong>{" "}
                                    <span className="text-indigo-600">{selectedSlot.room?.name}</span>
                                </p>
                                <p className="flex items-center">
                                    <strong className="mr-2">Class:</strong>{" "}
                                    <span className="text-green-600">{selectedSlot.class?.name}</span>
                                </p>
                                <p className="flex items-center">
                                    <strong className="mr-2">Teacher name:</strong>{" "}
                                    <span className="text-green-600">{selectedSlot.class.instructorName}</span>
                                </p>
                                <p className="flex items-center">
                                    <strong className="mr-2">Number of Students:</strong>{" "}
                                    <span className="text-orange-600">{selectedSlot.numberOfStudents}</span>
                                </p>

                                {role === 2 && (
                                    <button
                                        onClick={() => window.location.href = `/attendance/${selectedSlot.id}`}
                                        className={`mt-4 px-4 py-2 rounded ${isCurrentDatePastSlotDate(selectedSlot.date) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                                        disabled={!isCurrentDatePastSlotDate(selectedSlot.date)}
                                    >
                                        Check Attendance
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            </motion.div>
        </div>
    );
};

export default SchedulerPage;