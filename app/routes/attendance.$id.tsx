import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Eye, FileText, Music, UserX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { FileUpload } from "~/components/ui/file-upload";
import { Textarea } from "~/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { fetchSlotById, fetchUpdateAttendanceStatus } from "~/lib/services/scheduler";
import { AttendanceStatus, SlotDetail, SlotStudentModel } from "~/lib/types/Scheduler/slot";
import { requireAuth } from "~/lib/utils/auth";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    try {
        const { idToken } = await requireAuth(request);
        const { id } = params;
        if (!id) {
            throw new Response("ID is required", { status: 400 });
        }
        const response = await fetchSlotById(id, idToken);
        const slotDetail: SlotDetail = response.data;

        const slotStudent: SlotStudentModel[] = slotDetail.slotStudents!.map((student) => ({
            ...student,
            attendanceStatus: student.attendanceStatus ?? 0,
            attendanceComment: student.attendanceComment ?? "",
            gestureComment: student.gestureComment ?? "",
            gestureUrl: student.gestureUrl ?? "",
            fingerNoteComment: student.fingerNoteComment ?? "",
            pedalComment: student.pedalComment ?? "",
        }));

   
        return { slotStudent, idToken, id };
    } catch (error) {
        console.error("Failed to load attendance details:", error);
        throw new Response("Failed to load attendance details", { status: 500 });
    }
};

const AttendancePage = () => {
    const { slotStudent, idToken, id } = useLoaderData<typeof loader>();
    const [attendanceData, setAttendanceData] = useState<SlotStudentModel[]>(slotStudent || []);
    const [showAbsentees, setShowAbsentees] = useState(false);
    const [flashingStudentId, setFlashingStudentId] = useState<string | null>(null);
    const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showViewDetails, setShowViewDetails] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (slotStudent && slotStudent.length > 0) {
            const initializedData = slotStudent.map((student) => ({
                ...student,
                attendanceStatus:
                    student.attendanceStatus !== undefined && student.attendanceStatus !== AttendanceStatus.NotYet
                        ? student.attendanceStatus
                        : 1,
            }));
            setAttendanceData(initializedData);
        }
    }, [slotStudent]);

    const sortedAttendanceData = [...attendanceData].sort((a, b) =>
        a.studentAccount.fullName!.localeCompare(b.studentAccount.fullName!)
    );

    const handleAttendanceChange = (studentId: string, field: keyof SlotStudentModel, value: any) => {
        setAttendanceData((prev) =>
            prev.map((student) =>
                student.studentFirebaseId === studentId ? { ...student, [field]: value } : student
            )
        );
        setFlashingStudentId(studentId);
        setHighlightedStudentId(studentId);
        setTimeout(() => setFlashingStudentId(null), 2000);
    };

    const absentStudents = sortedAttendanceData.filter((student) => student.attendanceStatus === 2);

    const handleSubmit = () => {
        setShowConfirmDialog(true);
    };

    const prepareAttendanceRequest = () => {
        const slotStudentInfoModels = sortedAttendanceData.map((student) => ({
            StudentId: student.studentFirebaseId,
            AttendanceComment: student.attendanceComment || undefined,
            GestureComment: student.gestureComment || undefined,
            GestureUrl: student.gestureUrl || undefined,
            FingerNoteComment: student.fingerNoteComment || undefined,
            PedalComment: student.pedalComment || undefined,
            AttendanceStatus: student.attendanceStatus,
        }));

        return {
            SlotId: id,
            SlotStudentInfoRequests: slotStudentInfoModels,
        };
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const attendanceRequest = prepareAttendanceRequest();
            await fetchUpdateAttendanceStatus(
                attendanceRequest.SlotId,
                attendanceRequest.SlotStudentInfoRequests,
                idToken
            );
            navigate("/scheduler");
        } catch (error: any) {
            console.error("Error updating attendance:", error);
            alert("Failed to update attendance: " + error.message);
        } finally {
            setIsSubmitting(false);
            setShowConfirmDialog(false);
        }
    };

    const hasAdditionalData = (student: SlotStudentModel): boolean => {
        return !!(
            student.gestureUrl ||
            student.fingerNoteComment ||
            student.pedalComment ||
            student.attendanceComment ||
            student.gestureComment
        );
    };

    const getDataIndicators = (student: SlotStudentModel) => {
        const indicators = [];
        if (student.gestureUrl) indicators.push("Gesture Image");
        if (student.gestureComment) indicators.push("Gesture Comment");
        if (student.fingerNoteComment) indicators.push("Finger Notes");
        if (student.pedalComment) indicators.push("Pedal Notes");
        if (student.attendanceComment) indicators.push("Attendance Comment");
        return indicators;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Button
                    onClick={() => navigate("/scheduler")}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white mb-4 rounded-full"
                >
                    Quay lại
                </Button>

                <h1 className="text-xl md:text-2xl lg:text-4xl font-bold mb-6 text-center text-blue-700 flex items-center justify-center">
                    <Music className="w-6 h-6 md:w-8 md:h-8 mr-2 text-blue-600" />
                    Điểm danh lớp Piano
                </h1>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button
                        onClick={() => setShowAbsentees(!showAbsentees)}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full"
                    >
                        <UserX className="w-5 h-5 mr-2" />
                        {showAbsentees ? "Ẩn" : "Hiển thị"} Vắng mặt
                    </Button>
                    <div className="text-center sm:text-right text-gray-700">
                        <p className="text-sm md:text-base lg:text-lg font-semibold">
                            Tổng số học sinh: {sortedAttendanceData.length}
                        </p>
                        <p className="text-sm md:text-base lg:text-lg font-semibold">
                            Số học sinh vắng mặt: {absentStudents.length}
                        </p>
                    </div>
                </div>

                {showAbsentees && absentStudents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-6"
                    >
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 text-orange-600 flex items-center">
                            <UserX className="w-5 h-5 md:w-6 md:h-6 mr-2 text-orange-500" />
                            Danh sách vắng mặt
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {absentStudents.map((student) => (
                                <div
                                    key={student.studentFirebaseId}
                                    className="p-4 bg-white/90 rounded-lg shadow-md"
                                >
                                    <p className="text-gray-700 text-sm md:text-base">
                                        <strong>Email:</strong> {student.studentAccount.email}
                                    </p>
                                    <p className="text-gray-700 text-sm md:text-base">
                                        <strong>Tên:</strong> {student.studentAccount.fullName}
                                    </p>
                                    <p className="text-gray-700 text-sm md:text-base">
                                        <strong>Ghi chú:</strong> {student.attendanceComment || "Không có"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white/90 shadow-lg rounded-lg overflow-hidden">
                        <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm">
                            <th className="py-2 px-2 md:py-3 md:px-4 w-16 md:w-20 text-center"></th>
                            <th className="py-2 px-2 md:py-3 md:px-4 text-left">Email</th>
                            <th className="py-2 px-2 md:py-3 md:px-4 text-left">Họ và tên</th>
                            <th className="py-2 px-2 md:py-3 md:px-4 text-center">Điểm danh</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedAttendanceData.map((detail) => (
                            <motion.tr
                                key={detail.studentFirebaseId}
                                className={`bg-white/90 ${
                                    detail.attendanceStatus === 2 ? "border-l-4 border-orange-400" : ""
                                } ${
                                    flashingStudentId === detail.studentFirebaseId ? "animate-flash" : ""
                                } ${
                                    highlightedStudentId === detail.studentFirebaseId ? "bg-yellow-50" : ""
                                }`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <td className="py-3 px-2 md:py-4 md:px-4 text-center">
                                    <div className="relative">
                                        <img
                                            src={detail.studentAccount.avatarUrl || "/placeholder.svg?height=48&width=48"}
                                            alt="Student Avatar"
                                            className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full border-2 border-blue-300 object-cover mx-auto shadow-sm hover:shadow-md transition-shadow duration-200"
                                        />
                                    </div>
                                </td>
                                <td className="py-3 px-2 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm lg:text-base">
                                    {detail.studentAccount.email}
                                </td>
                                <td className="py-3 px-2 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm lg:text-base">
                                    {detail.studentAccount.fullName}
                                </td>
                                <td className="py-3 px-2 md:py-4 md:px-4 text-center">
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <Button
                                            onClick={() =>
                                                handleAttendanceChange(detail.studentFirebaseId, "attendanceStatus", 1)
                                            }
                                            variant={detail.attendanceStatus === 1 ? "default" : "secondary"}
                                            className={`w-full text-xs md:text-sm ${
                                                detail.attendanceStatus === 1
                                                    ? "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <Check size={14} className="mr-1 md:mr-2" /> Có mặt
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                handleAttendanceChange(detail.studentFirebaseId, "attendanceStatus", 2)
                                            }
                                            variant={detail.attendanceStatus === 2 ? "destructive" : "secondary"}
                                            className={`w-full text-xs md:text-sm ${
                                                detail.attendanceStatus === 2
                                                    ? "bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <UserX size={14} className="mr-1 md:mr-2" /> Vắng mặt
                                        </Button>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => setShowViewDetails(detail.studentFirebaseId)}
                                                        variant="secondary"
                                                        className={`w-full text-xs md:text-sm relative ${
                                                            hasAdditionalData(detail)
                                                                ? "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border border-gray-200"
                                                                : ""
                                                        }`}
                                                    >
                                                        <Eye size={14} className="mr-1 md:mr-2" /> Xem chi tiết
                                                        {hasAdditionalData(detail) && (
                                                            <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5">
                                                                <FileText size={10} className="mr-1" />
                                                                {getDataIndicators(detail).length}
                                                            </Badge>
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                {hasAdditionalData(detail) && (
                                                    <TooltipContent>
                                                        <p className="font-semibold text-xs mb-1">Dữ liệu có sẵn:</p>
                                                        <ul className="text-xs list-disc pl-4">
                                                            {getDataIndicators(detail).map((indicator, idx) => (
                                                                <li key={idx}>{indicator}</li>
                                                            ))}
                                                        </ul>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-center">
                    <Button
                        onClick={handleSubmit}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full px-4 py-2 md:px-6 md:py-3"
                    >
                        Xác nhận điểm danh
                    </Button>
                </div>

                {/* Dialog chi tiết - Đảm bảo viền đầy đủ cho Textarea */}
                <Dialog open={!!showViewDetails} onOpenChange={() => setShowViewDetails(null)}>
                    <DialogContent className="bg-white/90 backdrop-blur-sm w-full max-w-[95vw] sm:max-w-xl p-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-blue-700 text-sm md:text-base">
                                <Eye className="w-4 h-4 mr-2 text-blue-600" />
                                Xem và chỉnh sửa chi tiết
                                {showViewDetails &&
                                    hasAdditionalData(
                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                    ) && (
                                        <Badge className="ml-2 bg-blue-500 text-xs">Có dữ liệu</Badge>
                                    )}
                            </DialogTitle>
                        </DialogHeader>
                        {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails) && (
                            <div className="max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Cột bên trái */}
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Ghi chú điểm danh:</label>
                                            <Textarea
                                                value={
                                                    sortedAttendanceData.find(
                                                        (s) => s.studentFirebaseId === showViewDetails
                                                    )!.attendanceComment || ""
                                                }
                                                onChange={(e) =>
                                                    handleAttendanceChange(showViewDetails!, "attendanceComment", e.target.value)
                                                }
                                                className="text-xs h-20 border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Tư thế (URL hình ảnh):</label>
                                            <div className="mt-1">
                                                {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)
                                                    ?.gestureUrl && (
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <img
                                                            src={
                                                                sortedAttendanceData.find(
                                                                    (s) => s.studentFirebaseId === showViewDetails
                                                                )!.gestureUrl || "/placeholder.svg"
                                                            }
                                                            alt="Gesture"
                                                            className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-md border border-blue-200"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleAttendanceChange(showViewDetails!, "gestureUrl", "")}
                                                        >
                                                            <X className="h-3 w-3 mr-1" /> Xóa
                                                        </Button>
                                                    </div>
                                                )}
                                                <FileUpload
                                                    onChange={(files) => {
                                                        if (files.length > 0) {
                                                            const fileUrl = URL.createObjectURL(files[0]);
                                                            handleAttendanceChange(showViewDetails!, "gestureUrl", fileUrl);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột bên phải */}
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Tư thế:</label>
                                            <Textarea
                                                value={
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                        .gestureComment || ""
                                                }
                                                onChange={(e) =>
                                                    handleAttendanceChange(showViewDetails!, "gestureComment", e.target.value)
                                                }
                                                className="text-xs h-20 border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Ngón tay:</label>
                                            <Textarea
                                                value={
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                        .fingerNoteComment || ""
                                                }
                                                onChange={(e) =>
                                                    handleAttendanceChange(showViewDetails!, "fingerNoteComment", e.target.value)
                                                }
                                                className="text-xs h-20 border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Pedal:</label>
                                            <Textarea
                                                value={
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                        .pedalComment || ""
                                                }
                                                onChange={(e) =>
                                                    handleAttendanceChange(showViewDetails!, "pedalComment", e.target.value)
                                                }
                                                className="text-xs h-20 border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Nút Hủy và Xác nhận */}
                                <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
                                    <Button
                                        onClick={() => setShowViewDetails(null)}
                                        variant="outline"
                                        className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs py-1"
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={() => setShowViewDetails(null)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs py-1"
                                    >
                                        Xác nhận
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent className="bg-white/90 backdrop-blur-sm w-full max-w-[95vw] sm:max-w-sm p-3">
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-blue-700 text-sm md:text-base">
                                <Music className="w-4 h-4 mr-2 text-blue-600" />
                                Xác nhận điểm danh
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <p className="text-gray-700 text-xs md:text-sm">Xem lại danh sách vắng mặt:</p>
                            <div>
                                <h3 className="text-xs md:text-sm font-semibold text-gray-700 flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-2 text-yellow-500" />
                                    Học sinh vắng mặt:
                                </h3>
                                <ul className="list-disc pl-5 text-gray-700 text-xs md:text-sm mt-2">
                                    {absentStudents.map((student, index) => (
                                        <li key={index} className="mb-1">
                                            {student.studentAccount.fullName} ({student.studentAccount.email})
                                            {student.attendanceComment && ` - Ghi chú: ${student.attendanceComment}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmDialog(false)}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto text-xs py-1"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={confirmSubmit}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs py-1"
                                >
                                    {isSubmitting ? "Đang nộp..." : "Xác nhận"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AttendancePage;