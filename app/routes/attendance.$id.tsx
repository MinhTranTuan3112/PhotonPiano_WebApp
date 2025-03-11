"use client"

import type { LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { Button } from "app/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Check, Circle, Users, UserX, X } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchSlotById, fetchUpdateAttendanceStatus } from "~/lib/services/scheduler"
import type { SlotDetail, SlotStudentModel } from "~/lib/types/Scheduler/slot"
import { requireAuth } from "~/lib/utils/auth"

import Modal from "~/components/scheduler/modal-props"

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    try {
        const { idToken } = await requireAuth(request)
        const { id } = params
        if (!id) {
            throw new Response("ID is required", { status: 400 })
        }
        const response = await fetchSlotById(id, idToken)
        const slotDetail: SlotDetail = response.data


        const slotStudent: SlotStudentModel[] | null = slotDetail.slotStudents!.map(student => ({
            ...student,
            attendanceStatus: student.attendanceStatus ?? 0, 
        }));
        
        return { slotStudent, idToken, id }
    } catch (error) {
        console.error("Failed to load attendance details:", error)
        throw new Response("Failed to load attendance details", { status: 500 })
    }
}

const AttendancePage = () => {
    const { slotStudent, idToken, id } = useLoaderData<typeof loader>()
    const [attendanceData, setAttendanceData] = useState<SlotStudentModel[]>(slotStudent || [])
    const [showAbsentees, setShowAbsentees] = useState(false)
    const [flashingStudentId, setFlashingStudentId] = useState<string | null>(null)
    const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        setAttendanceData(slotStudent || [])
    }, [slotStudent])

    // Sort attendanceData by fullName
    const sortedAttendanceData = [...attendanceData].sort((a, b) =>
        a.studentAccount.fullName!.localeCompare(b.studentAccount.fullName!)
    )

    const handleAttendanceChange = (studentId: string, status: number) => {
        setAttendanceData((prev) =>
            prev.map((student) =>
                student.studentFirebaseId === studentId
                    ? { ...student, attendanceStatus: status }
                    : student
            )
        )
        setFlashingStudentId(null)
        setHighlightedStudentId(null)
    }

    const absentStudents = sortedAttendanceData.filter((student) => student.attendanceStatus === 2)
    
    const handleSubmit = () => {
        setShowConfirmDialog(true)
    }

    const prepareAttendanceRequest = () => {
        const studentAttentIds = sortedAttendanceData
            .filter((student) => student.attendanceStatus === 1)
            .map((student) => student.studentFirebaseId)

        const studentAbsentIds = sortedAttendanceData
            .filter((student) => student.attendanceStatus === 2)
            .map((student) => student.studentFirebaseId)

        return {
            SlotId: id,
            StudentAttentIds: studentAttentIds,
            StudentAbsentIds: studentAbsentIds,
        }
    }

    const confirmSubmit = async () => {
        setIsSubmitting(true)
        try {
            const attendanceRequest = prepareAttendanceRequest()

            const response = await fetchUpdateAttendanceStatus(attendanceRequest.SlotId, attendanceRequest.StudentAttentIds, attendanceRequest.StudentAbsentIds, idToken)

            if (response.status !== 200) {
                throw new Error("Failed to update attendance")
            }

            navigate("/scheduler")

        } catch (error: unknown) {
            console.error("Error updating attendance:", error)
            alert("Failed to update attendance. Please try again. Error: " + error.message)
        } finally {
            setIsSubmitting(false)
            setShowConfirmDialog(false)
        }
    }
    
    return (
        <div className="attendance-page p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/scheduler')}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Quay lại
                </button>

                <h1 className="title text-4xl font-bold mb-6 text-center text-blue-800 flex items-center justify-center">
                    <Users className="mr-2" /> Điểm danh
                </h1>
                <div className="mb-4 flex justify-between items-center">
                    <button
                        onClick={() => setShowAbsentees(!showAbsentees)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
                    >
                        <UserX className="mr-2" />
                        {showAbsentees ? "Ẩn" : "Hiển thị"} Vắng mặt
                    </button>
                    <div className="text-right">
                        <p className="text-lg font-semibold">Tổng số học sinh: {sortedAttendanceData.length}</p>
                        <p className="text-lg font-semibold">Số học sinh vắng mặt: {absentStudents.length}</p>
                    </div>
                </div>
                {showAbsentees && absentStudents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-6"
                    >
                        <h2 className="text-2xl font-bold mb-3 text-red-600">Vắng</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                                <thead>
                                <tr className="bg-red-500 text-white">
                                    <th className="py-3 px-4 border-b border-red-400">Email</th>
                                    <th className="py-3 px-4 border-b border-red-400">User Name</th>
                                    <th className="py-3 px-4 border-b border-red-400">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {absentStudents.map((student) => (
                                    <tr key={student.studentFirebaseId} className="hover:bg-red-50 transition-colors duration-150">
                                        <td className="py-4 px-2 border-b border-red-100">{student.studentAccount.email}</td>
                                        <td className="py-4 px-2 border-b border-red-100">{student.studentAccount.userName}</td>
                                        <td className="py-4 px-2 border-b border-red-100">
                                            <button
                                                onClick={() => {
                                                    const studentId = student.studentFirebaseId;
                                                    setFlashingStudentId(studentId);
                                                    setHighlightedStudentId(studentId);

                                                    // Find index in sorted array for scrolling
                                                    const index = sortedAttendanceData.findIndex(s => s.studentFirebaseId === studentId);
                                                    navigate(`#student-${index}`);

                                                    setTimeout(() => setFlashingStudentId(null), 2000);
                                                }}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                                            >
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
                <div className="overflow-x-auto">
                    <table className="attendance-table w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                        <thead>
                        <tr className="bg-blue-600 text-white">
                            <th className="py-3 px-4 border-b border-blue-500">Trạng thái</th>
                            <th className="py-3 px-4 border-b border-blue-500">Email</th>
                            <th className="py-3 px-4 border-b border-blue-500">Họ và tên</th>
                            <th className="py-3 px-4 border-b border-blue-500">Điểm danh</th>
                            <th className="py-3 px-4 border-b border-blue-500">Ảnh</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedAttendanceData.map((detail, index) => (
                            <motion.tr
                                key={detail.studentFirebaseId}
                                id={`student-${index}`}
                                className={`hover:bg-blue-50 transition-colors duration-150 ${
                                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                } ${flashingStudentId === detail.studentFirebaseId ? "animate-flash" : ""}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <td className="py-4 px-2 border-b border-blue-100">
                                    <Circle
                                        className={`w-4 h-4 ${highlightedStudentId === detail.studentFirebaseId ? "text-green-500" : "text-gray-300"}`}
                                        fill={highlightedStudentId === detail.studentFirebaseId ? "currentColor" : "none"}
                                    />
                                </td>
                                <td className="py-4 px-2 border-b border-blue-100">{detail.studentAccount.email}</td>
                                <td className="py-4 px-2 border-b border-blue-100">{detail.studentAccount.fullName}</td>
                                <td className="py-4 px-2 border-b border-blue-100">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleAttendanceChange(detail.studentFirebaseId, 1)}
                                            className={`flex items-center space-x-2 px-3 py-1 rounded ${
                                                detail.attendanceStatus === 1
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-200 text-gray-700 hover:bg-green-100"
                                            }`}
                                        >
                                            <Check size={16} />
                                            <span>Có mặt</span>
                                        </button>
                                        <button
                                            onClick={() => handleAttendanceChange(detail.studentFirebaseId, 2)}
                                            className={`flex items-center space-x-2 px-3 py-1 rounded ${
                                                detail.attendanceStatus === 2
                                                    ? "bg-red-500 text-white"
                                                    : "bg-gray-200 text-gray-700 hover:bg-red-100"
                                            }`}
                                        >
                                            <X size={16} />
                                            <span>Vắng mặt</span>
                                        </button>
                                    </div>
                                </td>
                                <td className="py-4 px-2 border-b border-blue-100">
                                    <img
                                        src={detail.studentAccount.avatarUrl || "/placeholder.svg"}
                                        alt="Student Avatar"
                                        className="h-30 w-30 rounded-full"
                                    />
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-center">
                    <Button
                        onClick={handleSubmit}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Điểm danh
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {showConfirmDialog && (
                    <Modal isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                        <div className="p-6 bg-white rounded-lg">
                            <h2 className="text-2xl font-bold mb-4 text-blue-800">Xác nhận nộp điểm danh</h2>
                            <p className="mb-4">Vui lòng xem lại danh sách học sinh vắng mặt trước khi nộp:</p>
                            <div className="py-4">
                                <h3 className="text-lg font-semibold mb-2 flex items-center">
                                    <AlertTriangle className="mr-2 text-yellow-500" />
                                    Học sinh vắng mặt:
                                </h3>
                                <ul className="list-disc pl-5">
                                    {absentStudents.map((student, index) => (
                                        <li key={index} className="mb-1">
                                            {student.studentAccount.userName} ({student.studentAccount.email})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button onClick={confirmSubmit} disabled={isSubmitting} className="ml-2">
                                    {isSubmitting ? "Đang nộp điểm danh..." : "Xác nhậm điểm danh"}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    )
}

export default AttendancePage


