import type { LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { Button } from "app/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Check, Music, UserX, X } from "lucide-react"
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

        } catch (error: any) {
            console.error("Error updating attendance:", error)
            alert("Failed to update attendance. Please try again. Error: " + error.message)
        } finally {
            setIsSubmitting(false)
            setShowConfirmDialog(false)
        }
    }

    return (
        <div className="attendance-page p-6 bg-gradient-to-b from-indigo-50 to-white min-h-screen" style={{ backgroundImage: "url(/piano-keys-pattern.png)", backgroundSize: "cover", backgroundPosition: "bottom" }}>
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/scheduler')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200"
                >
                    Quay lại
                </button>

                <h1 className="title text-4xl font-bold mb-6 text-center text-indigo-900 flex items-center justify-center">
                    <Music className="w-8 h-8 mr-2 text-indigo-800" /> Điểm danh lớp Piano
                </h1>
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={() => setShowAbsentees(!showAbsentees)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-md flex items-center transition-all duration-200"
                    >
                        <UserX className="w-5 h-5 mr-2" />
                        {showAbsentees ? "Ẩn" : "Hiển thị"} Vắng mặt
                    </button>
                    <div className="text-right text-indigo-800">
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
                        <h2 className="text-2xl font-bold mb-3 text-red-700 flex items-center">
                            <UserX className="w-6 h-6 mr-2 text-red-600" /> Danh sách vắng mặt
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white/90 shadow-lg rounded-lg overflow-hidden backdrop-blur-sm">
                                <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                    <th className="py-3 px-4 border-b border-indigo-500">Email</th>
                                    <th className="py-3 px-4 border-b border-indigo-500">Tên học sinh</th>
                                    <th className="py-3 px-4 border-b border-indigo-500">Hành động</th>
                                </tr>
                                </thead>
                                <tbody>
                                {absentStudents.map((student) => (
                                    <tr key={student.studentFirebaseId} className="hover:bg-indigo-50/50 transition-colors duration-150">
                                        <td className="py-4 px-2 border-b border-indigo-100 text-indigo-800">{student.studentAccount.email}</td>
                                        <td className="py-4 px-2 border-b border-indigo-100 text-indigo-800">{student.studentAccount.fullName}</td>
                                        <td className="py-4 px-2 border-b border-indigo-100">
                                            <button
                                                onClick={() => {
                                                    const studentId = student.studentFirebaseId;
                                                    setFlashingStudentId(studentId); 
                                                    setHighlightedStudentId(studentId); 
                                                    const index = sortedAttendanceData.findIndex(s => s.studentFirebaseId === studentId);
                                                    navigate(`#student-${index}`); 
                                                    setTimeout(() => setFlashingStudentId(null), 2000); 
                                                }}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-2 rounded-full text-sm shadow-md transition-all duration-200"
                                            >
                                                Cập nhập điểm danh
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
                    <table className="attendance-table w-full border-collapse bg-white/90 shadow-lg rounded-lg overflow-hidden backdrop-blur-sm">
                        <thead>
                        <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <th className="py-3 px-4 border-b border-indigo-500 w-12 text-center"></th>
                            <th className="py-3 px-4 border-b border-indigo-500 min-w-[200px] text-left">Email</th>
                            <th className="py-3 px-4 border-b border-indigo-500 min-w-[150px] text-left">Họ và tên</th>
                            <th className="py-3 px-4 border-b border-indigo-500 min-w-[200px] text-center">Điểm danh</th>
                            <th className="py-3 px-4 border-b border-indigo-500 w-20 text-center">Ảnh</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedAttendanceData.map((detail, index) => (
                            <motion.tr
                                key={detail.studentFirebaseId}
                                id={`student-${index}`}
                                className={`hover:bg-indigo-50/50 transition-colors duration-150 ${
                                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                } ${
                                    flashingStudentId === detail.studentFirebaseId ? "animate-flash" : ""
                                } ${
                                    highlightedStudentId === detail.studentFirebaseId ? "bg-yellow-100 border-l-4 border-yellow-500" : ""
                                }`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <td className="py-4 px-4 border-b border-indigo-100 text-center">
                                    <input
                                        type="checkbox"
                                        checked={detail.attendanceStatus === 1}
                                        onChange={(e) => handleAttendanceChange(detail.studentFirebaseId, e.target.checked ? 1 : 2)}
                                        className="w-5 h-5 text-indigo-600 border-indigo-300 rounded-full focus:ring-indigo-500 cursor-pointer transition-all duration-200"
                                    />
                                </td>
                                <td className="py-4 px-4 border-b border-indigo-100 text-indigo-800 font-medium">
                                    {detail.studentAccount.email}
                                </td>
                                <td className="py-4 px-4 border-b border-indigo-100 text-indigo-900 font-semibold">
                                    {detail.studentAccount.fullName}
                                </td>
                                <td className="py-4 px-4 border-b border-indigo-100 text-center">
                                    <div className="flex items-center justify-center space-x-4">
                                        <button
                                            onClick={() => handleAttendanceChange(detail.studentFirebaseId, 1)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md text-sm font-semibold ${
                                                detail.attendanceStatus === 1
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-indigo-700 hover:bg-indigo-100"
                                            } transition-all duration-200 min-w-[100px] justify-center`}
                                        >
                                            <Check size={16} />
                                            <span>Có mặt</span>
                                        </button>
                                        <button
                                            onClick={() => handleAttendanceChange(detail.studentFirebaseId, 2)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md text-sm font-semibold ${
                                                detail.attendanceStatus === 2
                                                    ? "bg-red-600 text-white"
                                                    : "bg-gray-200 text-red-700 hover:bg-red-100"
                                            } transition-all duration-200 min-w-[100px] justify-center`}
                                        >
                                            <X size={16} />
                                            <span>Vắng mặt</span>
                                        </button>
                                    </div>
                                </td>
                                <td className="py-4 px-4 border-b border-indigo-100 text-center">
                                    <img
                                        src={detail.studentAccount.avatarUrl || "/placeholder.svg"}
                                        alt="Student Avatar"
                                        className="h-12 w-12 rounded-full border-2 border-indigo-200 object-cover mx-auto"
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
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all duration-200"
                    >
                        Xác nhận điểm danh
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {showConfirmDialog && (
                    <Modal isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                        <div className="p-6 bg-white/90 rounded-lg shadow-lg backdrop-blur-sm">
                            <h2 className="text-2xl font-bold mb-4 text-indigo-900 flex items-center">
                                <Music className="w-6 h-6 mr-2 text-indigo-800" /> Xác nhận nộp điểm danh
                            </h2>
                            <p className="mb-4 text-indigo-700">Vui lòng xem lại danh sách học sinh vắng mặt trước khi nộp:</p>
                            <div className="py-4">
                                <h3 className="text-lg font-semibold mb-2 text-indigo-800 flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                                    Học sinh vắng mặt:
                                </h3>
                                <ul className="list-disc pl-5 text-indigo-700">
                                    {absentStudents.map((student, index) => (
                                        <li key={index} className="mb-1">
                                            {student.studentAccount.userName} ({student.studentAccount.email})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmDialog(false)}
                                    disabled={isSubmitting}
                                    className="bg-gray-200 hover:bg-gray-300 text-indigo-700 font-semibold py-2 px-4 rounded-full transition-all duration-200"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={confirmSubmit}
                                    disabled={isSubmitting}
                                    className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200"
                                >
                                    {isSubmitting ? "Đang nộp điểm danh..." : "Xác nhận điểm danh"}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendancePage;