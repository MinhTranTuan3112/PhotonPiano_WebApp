import type React from "react"
import { useEffect, useState } from "react"
import { getWeekRange } from "~/lib/utils/datetime"
import { fetchAttendanceStatus, fetchSlotById, fetchSlots } from "~/lib/services/scheduler"
import { AttendanceStatus, Shift, SlotStatus, type Slot } from "~/lib/types/Scheduler/slot"
import Modal from "~/components/scheduler/ModalProps"
import { motion } from "framer-motion"
import { Piano, Music, Calendar } from "lucide-react"

const idToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE0MzRmMzFkN2Y3NWRiN2QyZjQ0YjgxZDg1MjMwZWQxN2ZlNTk3MzciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vcGhvdG9ucGlhbm8tMmYyMzMiLCJhdWQiOiJwaG90b25waWFuby0yZjIzMyIsImF1dGhfdGltZSI6MTczODUwNDQ0NSwidXNlcl9pZCI6IkhEOTdyZHdlcXlRZnUzQ0N1UDBMZkN0WmhoZjIiLCJzdWIiOiJIRDk3cmR3ZXF5UWZ1M0NDdVAwTGZDdFpoaGYyIiwiaWF0IjoxNzM4NTA0NDQ1LCJleHAiOjE3Mzg1MDgwNDUsImVtYWlsIjoicXVhbmdwaGF0N2ExQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJxdWFuZ3BoYXQ3YTFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.ID4ySXDfNIAEWyNd8qcxBWTo5di_8YDC6-3K-eaUHmz_bFUDe1E0kEtaTWsxbD8A54i6HW4Q2wKjsnM31fJyQfyrZbRC4Uzpj8IDw7Ca4Bt3y56PD62AIskmYAd5XzDtl4lGrmZjZcz7_B4j9vKtqBzE9TmfQmFseMebyRJnb-ZFgHBspN8lQUbc-NoNrHAQqGN6jUjohdD20y1KObgGOKflUJcwTxy8QjvwFgcLFXZS8kxQrn2B_sk2ydMlGmS9WlsfkLEqay95JVDjy8j1tHOaXxmhMWRF0_60a7nCbpIqdoUsKEqf9YkWNXUWIH6YryyYo51t801427V2MwIrKg"

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

interface WeekRange {
    startDate: Date
    endDate: Date
}

const getVietnameseWeekday = (date: Date): string => {
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    return weekdays[date.getDay()]
}

const SchedulerPage: React.FC = () => {
    const [slots, setSlots] = useState<Slot[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [year, setYear] = useState<number>(new Date().getFullYear())
    const [week, setWeek] = useState<WeekRange | null>(null)
    const [weekNumber, setWeekNumber] = useState<number>(getCurrentWeekNumber())
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)

    function getCurrentWeekNumber(): number {
        const currentDate = new Date()
        const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1)
        const days = Math.floor((currentDate.getTime() - firstDayOfYear.getTime()) / (1000 * 3600 * 24))
        return Math.ceil((days + firstDayOfYear.getDay() + 1) / 7)
    }

    const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedWeek = Number(event.target.value)
        setWeekNumber(selectedWeek)
        const newWeek = getWeekRange(year, selectedWeek)
        setWeek(newWeek)
    }

    useEffect(() => {
        const newWeek = getWeekRange(year, weekNumber)
        setWeek(newWeek)
    }, [year, weekNumber])

    useEffect(() => {
        const fetchSlotsData = async () => {
            if (!week) return

            setLoading(true)
            try {
                const startTime = formatDateForAPI(week.startDate)
                const endTime = formatDateForAPI(week.endDate)
                const response = await fetchSlots({ startTime, endTime, idToken })
                setSlots(response.data)
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError("An unknown error occurred")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchSlotsData()
    }, [week])

    const handleSlotClick = async (slotId: string) => {
        try {
            const slotDetails = await fetchSlotById(slotId)
            setSelectedSlot(slotDetails)
            const attendance = await fetchAttendanceStatus(slotId, idToken)
            setAttendanceStatus(attendance.attendanceStatus)
            setIsModalOpen(true)
        } catch (error) {
            console.error("Failed to fetch slot details:", error)
        }
    }

    if (loading) return <div>Loading...</div>
    if (error) return <div className="text-red-500">{error}</div>
    if (!week) return <div>Loading Week Information...</div>

    return (
        <div className="scheduler-page p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <h1 className="title text-4xl font-bold mb-6 text-center text-blue-800 flex items-center justify-center">
                    <Piano className="mr-2" /> Piano Learning Center Timetable
                </h1>
                <div className="controls flex flex-wrap justify-center mb-6 space-x-4">
                    <label className="control flex flex-col mb-4 sm:mb-0">
                        <span className="mb-1 font-semibold text-blue-700">Year:</span>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
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
                            onChange={handleWeekChange}
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

                <div className="week-info text-center mb-4">
                    <p className="text-lg font-medium text-blue-700 flex items-center justify-center">
                        <Calendar className="mr-2" />
                        {formatDateForDisplay(week.startDate)} - {formatDateForDisplay(week.endDate)}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="schedule-table w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                        <thead>
                        <tr className="bg-blue-600 text-white">
                            <th className="py-3 px-4 border-b border-blue-500">Time Slot</th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(week.startDate)
                                currentDay.setDate(currentDay.getDate() + i)
                                return (
                                    <th key={i} className="py-3 px-4 border-b border-blue-500">
                                        {getVietnameseWeekday(currentDay)}
                                    </th>
                                )
                            })}
                        </tr>
                        <tr className="bg-blue-100 text-blue-800">
                            <th className="py-2 px-4 border-b border-blue-200"></th>
                            {Array.from({ length: 7 }, (_, i) => {
                                const currentDay = new Date(week.startDate)
                                currentDay.setDate(currentDay.getDate() + i)
                                return (
                                    <th key={i} className="py-2 px-4 border-b border-blue-200 text-sm">
                                        {formatDateForDisplay(currentDay)}
                                    </th>
                                )
                            })}
                        </tr>
                        </thead>
                        <tbody>
                        {shiftTimes.map((time, index) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                                <td className="time-slot py-4 px-2 font-semibold border-b border-blue-100">{time}</td>
                                {Array.from({ length: 7 }, (_, i) => {
                                    const currentDay = new Date(week.startDate)
                                    currentDay.setDate(currentDay.getDate() + i)
                                    const currentDayString = formatDateForAPI(currentDay)
                                    const slotForDateAndShift = slots.filter((slot) => {
                                        return slot.date === currentDayString && shiftTimesMap[slot.shift] === time
                                    })
                                    return (
                                        <td key={i} className="slot-cell border-b border-blue-100 p-2">
                                            {slotForDateAndShift.length > 0 ? (
                                                slotForDateAndShift.map((slot, idx) => (
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
                                                        <div className="slot-status text-sm mt-1 text-blue-500">{SlotStatus[slot.status]}</div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="h-16 flex items-center justify-center text-gray-400">-</div>
                                            )}
                                        </td>
                                    )
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
                                    <strong className="mr-2">Number of Students:</strong>{" "}
                                    <span className="text-orange-600">{selectedSlot.class?.level}</span>
                                </p>
                  {/*              <p className="flex items-center">*/}
                  {/*                  <strong className="mr-2">Attendance Status:</strong>{" "}*/}
                  {/*                  <span className="text-purple-600">*/}
                  {/*  {attendanceStatus !== null ? AttendanceStatus[attendanceStatus] : "N/A"}*/}
                  {/*</span>*/}
                  {/*              </p>*/}
                            </div>
                        </div>
                    )}
                </Modal>
            </motion.div>
        </div>
    )
}

export default SchedulerPage

