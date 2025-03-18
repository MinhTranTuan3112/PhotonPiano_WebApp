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
import type { SlotDetail, SlotStudentModel } from "~/lib/types/Scheduler/slot";
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
            attendanceStatus: student.attendanceStatus ?? 0, // 0: NotYet, 1: Attended, 2: Absent
            attendanceComment: student.attendanceComment ?? "",
            gestureComment: student.gestureComment ?? "",
            gestureUrl: student.gestureUrl ?? "",
            fingerNoteComment: student.fingerNoteComment ?? "",
            pedalComment: student.pedalComment ?? "",
        }));

        console.log("Loaded student data from loader:", slotStudent);
        return { slotStudent, idToken, id };
    } catch (error) {
        console.error("Failed to load attendance details:", error);
        throw new Response("Failed to load attendance details", { status: 500 });
    }
};

interface IApiResult<T> {
    Status?: string;
    Op?: string;
    Data?: T;
    message?: string; // Thêm trường message
}

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
        setAttendanceData(slotStudent || []);
    }, [slotStudent]);

    useEffect(() => {
        // console.log("Current attendance data:", attendanceData);
    }, [attendanceData]);

    const sortedAttendanceData = [...attendanceData].sort((a, b) =>
        a.studentAccount.fullName!.localeCompare(b.studentAccount.fullName!)
    );

    const handleAttendanceChange = (studentId: string, field: keyof SlotStudentModel, value: any) => {
        console.log(`Changing ${field} for student ${studentId} to:`, value);
        setAttendanceData((prev) => {
            const newData = prev.map((student) =>
                student.studentFirebaseId === studentId ? { ...student, [field]: value } : student
            );
            // console.log("Updated attendance data:", newData);
            return newData;
        });
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
            AttendanceStatus: student.attendanceStatus, // 0: NotYet, 1: Attended, 2: Absent
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
            console.log("Data sent to API:", attendanceRequest);

            // Update API call to expect boolean result
            const response = await fetchUpdateAttendanceStatus(
                attendanceRequest.SlotId,
                attendanceRequest.SlotStudentInfoRequests,
                idToken
            );
            
            
            alert("Attendance updated successfully");
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
        <div
            className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-4 sm:p-6"
            style={{ backgroundImage: "url(/piano-keys-pattern.png)", backgroundSize: "cover", backgroundPosition: "bottom" }}
        >
            <div className="max-w-7xl mx-auto">
                <Button
                    onClick={() => navigate("/scheduler")}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white mb-4 rounded-full"
                >
                    Quay lại
                </Button>

                <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center text-indigo-900 flex items-center justify-center">
                    <Music className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-indigo-800" />
                    Điểm danh lớp Piano
                </h1>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button
                        onClick={() => setShowAbsentees(!showAbsentees)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full w-full sm:w-auto"
                    >
                        <UserX className="w-5 h-5 mr-2" />
                        {showAbsentees ? "Ẩn" : "Hiển thị"} Vắng mặt
                    </Button>

                    <div className="text-center sm:text-right text-indigo-800">
                        <p className="text-base sm:text-lg font-semibold">Tổng số học sinh: {sortedAttendanceData.length}</p>
                        <p className="text-base sm:text-lg font-semibold">Số học sinh vắng mặt: {absentStudents.length}</p>
                    </div>
                </div>

                {showAbsentees && absentStudents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-6"
                    >
                        <h2 className="text-xl sm:text-2xl font-bold mb-3 text-red-700 flex items-center">
                            <UserX className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-600" />
                            Danh sách vắng mặt
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {absentStudents.map((student) => (
                                <div key={student.studentFirebaseId} className="p-4 bg-white/90 rounded-lg shadow-md">
                                    <p className="text-indigo-800">
                                        <strong>Email:</strong> {student.studentAccount.email}
                                    </p>
                                    <p className="text-indigo-800">
                                        <strong>Tên:</strong> {student.studentAccount.fullName}
                                    </p>
                                    <p className="text-indigo-800">
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
                        <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <th className="py-3 px-2 sm:px-4 w-12 text-center"></th>
                            <th className="py-3 px-2 sm:px-4 min-w-[150px] sm:min-w-[200px] text-left">Email</th>
                            <th className="py-3 px-2 sm:px-4 min-w-[120px] sm:min-w-[150px] text-left">Họ và tên</th>
                            <th className="py-3 px-2 sm:px-4 min-w-[200px] text-center">Điểm danh</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedAttendanceData.map((detail) => (
                            <motion.tr
                                key={detail.studentFirebaseId}
                                className={`bg-white/90 ${detail.attendanceStatus === 2 ? "border-l-4 border-red-500" : ""} ${
                                    flashingStudentId === detail.studentFirebaseId ? "animate-flash" : ""
                                } ${highlightedStudentId === detail.studentFirebaseId ? "bg-yellow-50" : ""}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <td className="py-4 px-2 text-center">
                                    <img
                                        src={detail.studentAccount.avatarUrl || "/placeholder.svg?height=48&width=48"}
                                        alt="Student Avatar"
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-indigo-200 object-cover mx-auto"
                                    />
                                </td>
                                <td className="py-4 px-2 text-indigo-800 text-sm sm:text-base">{detail.studentAccount.email}</td>
                                <td className="py-4 px-2 text-indigo-800 text-sm sm:text-base">{detail.studentAccount.fullName}</td>
                                <td className="py-4 px-2 text-center">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            onClick={() => handleAttendanceChange(detail.studentFirebaseId, "attendanceStatus", 1)} // 1: Attended
                                            variant={detail.attendanceStatus === 1 ? "default" : "secondary"}
                                            className={`w-full ${
                                                detail.attendanceStatus === 1
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <Check size={16} className="mr-2" /> Có mặt
                                        </Button>
                                        <Button
                                            onClick={() => handleAttendanceChange(detail.studentFirebaseId, "attendanceStatus", 2)} // 2: Absent
                                            variant={detail.attendanceStatus === 2 ? "destructive" : "secondary"}
                                            className={`w-full ${
                                                detail.attendanceStatus === 2
                                                    ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <UserX size={16} className="mr-2" /> Vắng mặt
                                        </Button>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => setShowViewDetails(detail.studentFirebaseId)}
                                                        variant="secondary"
                                                        className={`w-full relative ${
                                                            hasAdditionalData(detail)
                                                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 border border-indigo-200"
                                                                : ""
                                                        }`}
                                                    >
                                                        <Eye size={16} className="mr-2" /> Xem chi tiết
                                                        {hasAdditionalData(detail) && (
                                                            <Badge className="absolute -top-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-1.5">
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
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-6"
                    >
                        Xác nhận điểm danh
                    </Button>
                </div>
            </div>

            <Dialog open={!!showViewDetails} onOpenChange={() => setShowViewDetails(null)}>
                <DialogContent className="bg-white/90 backdrop-blur-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-indigo-900">
                            <Eye className="w-5 h-5 mr-2 text-indigo-800" />
                            Xem và chỉnh sửa chi tiết
                            {showViewDetails &&
                                hasAdditionalData(sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!) && (
                                    <Badge className="ml-2 bg-indigo-600">Có dữ liệu</Badge>
                                )}
                        </DialogTitle>
                    </DialogHeader>
                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails) && (
                        <div className="space-y-4">
                            <p className="text-indigo-800 text-sm">
                                <strong>Email:</strong>{" "}
                                {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.studentAccount.email}
                            </p>
                            <p className="text-indigo-800 text-sm">
                                <strong>Tên:</strong>{" "}
                                {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.studentAccount.fullName}
                            </p>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-indigo-800">Ghi chú điểm danh:</label>
                                <Textarea
                                    value={
                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.attendanceComment || ""
                                    }
                                    onChange={(e) => handleAttendanceChange(showViewDetails!, "attendanceComment", e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-indigo-800">Gesture (URL hình ảnh):</label>
                                <div className="mt-2">
                                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)?.gestureUrl && (
                                        <div className="mb-2 flex items-center gap-2">
                                            <img
                                                src={
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt="Gesture"
                                                className="h-16 w-16 object-cover rounded-md border border-indigo-200"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAttendanceChange(showViewDetails!, "gestureUrl", "")}
                                            >
                                                <X className="h-4 w-4 mr-2" /> Xóa
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-indigo-800">Gesture Comment:</label>
                                <Textarea
                                    value={
                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureComment || ""
                                    }
                                    onChange={(e) => handleAttendanceChange(showViewDetails!, "gestureComment", e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-indigo-800">Finger Note:</label>
                                <Textarea
                                    value={
                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.fingerNoteComment || ""
                                    }
                                    onChange={(e) => handleAttendanceChange(showViewDetails!, "fingerNoteComment", e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-indigo-800">Pedal:</label>
                                <Textarea
                                    value={
                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.pedalComment || ""
                                    }
                                    onChange={(e) => handleAttendanceChange(showViewDetails!, "pedalComment", e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="flex flex-row gap-2 justify-end mt-4">
                                <Button
                                    onClick={() => setShowViewDetails(null)}
                                    variant="outline"
                                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={() => setShowViewDetails(null)}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                >
                                    Xác nhận
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="bg-white/90 backdrop-blur-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-indigo-900">
                            <Music className="w-5 h-5 mr-2 text-indigo-800" />
                            Xác nhận điểm danh
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-indigo-700 text-sm">Xem lại danh sách vắng mặt:</p>
                        <div>
                            <h3 className="text-base font-semibold text-indigo-800 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                                Học sinh vắng mặt:
                            </h3>
                            <ul className="list-disc pl-5 text-indigo-700 text-sm mt-2">
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
                                className="w-full sm:w-auto"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {isSubmitting ? "Đang nộp..." : "Xác nhận"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AttendancePage;