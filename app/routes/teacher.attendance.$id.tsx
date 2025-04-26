import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect, useLoaderData } from "@remix-run/react"
import { motion } from "framer-motion"
import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    ImageIcon,
    Music,
    Pencil,
    Save,
    Trash2,
    Upload,
    UserX,
    X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Textarea } from "~/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { fetchSlotById, fetchUpdateAttendanceStatus } from "~/lib/services/scheduler"
import { AttendanceStatus, type SlotDetail, type SlotStudentModel } from "~/lib/types/Scheduler/slot"
import { requireAuth } from "~/lib/utils/auth"
import { read, utils } from "xlsx"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { InfoIcon } from "lucide-react";
import { useImagesDialog } from "~/hooks/use-images-dialog"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { Role } from "~/lib/types/account/account"


// Extended SlotStudentModel to support multiple images
type ExtendedSlotStudentModel = {
    gestureUrls: string[]
} & SlotStudentModel;

// Function to validate if URL is a valid image URL
const validateImageUrl = (url: string): boolean => {
    // Check if it's a valid URL format
    try {
        new URL(url);
    } catch {
        return false;
    }

    // Check if URL has image extension or is a common image hosting URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));

    // Check for common image hosting services
    const isImageHosting = [
        'imgur.com',
        'i.imgur.com',
        'flickr.com',
        'unsplash.com',
        'googleusercontent.com',
        'cloudinary.com',
        'drive.google.com/file',
        'storage.googleapis.com',
        's3.amazonaws.com',
        'blob:'
    ].some(host => url.includes(host));

    return hasImageExtension || isImageHosting || url.includes('data:image/');
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Instructor) {
            return redirect('/');
        }

        const { id } = params;
        if (!id) {
            throw new Response("ID is required", { status: 400 });
        }

        const response = await fetchSlotById(id, idToken);
        const slotDetail: SlotDetail = await response.data;

        const slotStudent: ExtendedSlotStudentModel[] = slotDetail.slotStudents!.map((student) => {
            let gestureUrls: string[] = [];

            if (student.gestureUrl) {
                try {
                    const parsedUrls = JSON.parse(student.gestureUrl);

                    if (Array.isArray(parsedUrls)) {
                        gestureUrls = parsedUrls;
                    } else if (typeof parsedUrls === 'string') {
                        try {
                            const nestedParsed = JSON.parse(parsedUrls);
                            gestureUrls = Array.isArray(nestedParsed) ? nestedParsed : [parsedUrls];
                        } catch {
                            gestureUrls = [parsedUrls];
                        }
                    }
                } catch {
                    // If not valid JSON, treat as a single URL
                    gestureUrls = [student.gestureUrl];
                }
            }

            return {
                ...student,
                attendanceStatus: student.attendanceStatus ?? 0,
                attendanceComment: student.attendanceComment ?? "",
                gestureComment: student.gestureComment ?? "",
                gestureUrl: student.gestureUrl ?? "",
                gestureUrls: gestureUrls, // Use the properly parsed URLs
                fingerNoteComment: student.fingerNoteComment ?? "",
                pedalComment: student.pedalComment ?? "",
            };
        });

        return { slotStudent, idToken, id };

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });

    }
};

const AttendancePage = () => {

    const { slotStudent, idToken, id } = useLoaderData<typeof loader>()

    const [attendanceData, setAttendanceData] = useState<ExtendedSlotStudentModel[]>(slotStudent || [])
    const [showAbsentees, setShowAbsentees] = useState(false)
    const [flashingStudentId, setFlashingStudentId] = useState<string | null>(null)
    const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showViewDetails, setShowViewDetails] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState("attendance")
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showExcelHelpDialog, setShowExcelHelpDialog] = useState(false);

    const navigate = (url: string) => {
        window.location.href = url;
    }

    useEffect(() => {
        if (slotStudent && slotStudent.length > 0) {
            const initializedData = slotStudent.map((student) => ({
                ...student,
                attendanceStatus:
                    student.attendanceStatus !== undefined && student.attendanceStatus !== AttendanceStatus.NotYet
                        ? student.attendanceStatus
                        : 1,
            }))
            setAttendanceData(initializedData)
        }
    }, [slotStudent])

    // const sortedAttendanceData = [...attendanceData].sort((a, b) =>
    //     a.studentAccount.fullName!.localeCompare(b.studentAccount.fullName!),
    // )

    const [sortedAttendanceData, setSortedAttendanceData] = useState([...attendanceData].sort((a, b) =>
        a.studentAccount.fullName!.localeCompare(b.studentAccount.fullName!),
    ));

    useEffect(() => {

        setAttendanceData((prev) => {
            const sortedData = [...prev].sort((a, b) =>
                a.studentAccount.fullName!.localeCompare(b.studentAccount.fullName!),
            );
            setSortedAttendanceData(sortedData);
            return sortedData;
        })

        return () => {

        }

    }, [attendanceData])


    const handleAttendanceChange = (studentId: string, field: keyof ExtendedSlotStudentModel, value) => {
        setAttendanceData((prev) =>
            prev.map((student) => {
                if (student.studentFirebaseId === studentId) {
                    // If updating gestureUrl, also update gestureUrls for backward compatibility
                    if (field === "gestureUrl") {
                        return {
                            ...student,
                            [field]: value,
                            gestureUrls: value ? [value] : [],
                        }
                    }
                    return { ...student, [field]: value }
                }
                return student
            }),
        )
        setFlashingStudentId(studentId)
        setHighlightedStudentId(studentId)
        setTimeout(() => setFlashingStudentId(null), 2000)
    }

    // Handle adding a new image to gestureUrls array
    const handleAddImage = (studentId: string, imageUrl: string) => {
        setAttendanceData((prev) =>
            prev.map((student) => {
                if (student.studentFirebaseId === studentId) {
                    const updatedUrls = [...student.gestureUrls, imageUrl];
                    return {
                        ...student,
                        gestureUrls: updatedUrls,
                        gestureUrl: updatedUrls[0] || "",
                    };
                }
                return student;
            })
        );
        setCurrentImageIndex(0);
    };

    // Handle removing an image from gestureUrls array
    const handleRemoveImage = (studentId: string, index: number) => {
        setAttendanceData((prev) =>
            prev.map((student) => {
                if (student.studentFirebaseId === studentId) {
                    const updatedUrls = [...student.gestureUrls]
                    updatedUrls.splice(index, 1)
                    return {
                        ...student,
                        gestureUrls: updatedUrls,
                        gestureUrl: updatedUrls[0] || "",
                    }
                }
                return student
            }),
        )
        setCurrentImageIndex(0)
    }

    const absentStudents = sortedAttendanceData.filter((student) => student.attendanceStatus === 2)

    const handleSubmit = () => {
        setShowConfirmDialog(true)
    }

    const prepareAttendanceRequest = () => {
        const slotStudentInfoModels = sortedAttendanceData.map((student) => {
            // Create the base object with required fields
            const studentData: any = {
                StudentId: student.studentFirebaseId,
                AttendanceStatus: student.attendanceStatus,
            };

            // Only add optional fields if they have values
            if (student.attendanceComment)
                studentData.AttendanceComment = student.attendanceComment;

            if (student.gestureComment)
                studentData.GestureComment = student.gestureComment;

            if (student.fingerNoteComment)
                studentData.FingerNoteComment = student.fingerNoteComment;

            if (student.pedalComment)
                studentData.PedalComment = student.pedalComment;

            // Only add GestureUrls if the array is not empty
            if (student.gestureUrls && student.gestureUrls.length > 0) {
                // Send as array of strings, let the API handle serialization
                studentData.GestureUrls = student.gestureUrls;
            }

            return studentData;
        });

        return {
            SlotId: id,
            SlotStudentInfoRequests: slotStudentInfoModels,
        };
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const attendanceRequest = prepareAttendanceRequest();
            await fetchUpdateAttendanceStatus(attendanceRequest.SlotId, attendanceRequest.SlotStudentInfoRequests, idToken);
            navigate('/teacher/attendance');
        } catch (error: any) {
            console.error("Error updating attendance:", error);
            alert("Failed to update attendance: " + error.message);
        } finally {
            setIsSubmitting(false);
            setShowConfirmDialog(false);
        }
    };

    const hasAdditionalData = (student: ExtendedSlotStudentModel): boolean => {
        return !!(
            student.gestureUrls.length > 0 ||
            student.fingerNoteComment ||
            student.pedalComment ||
            student.attendanceComment ||
            student.gestureComment
        )
    }

    const getDataIndicators = (student: ExtendedSlotStudentModel) => {
        const indicators = []
        if (student.gestureUrls.length > 0) indicators.push(`${student.gestureUrls.length} Hình ảnh`)
        if (student.gestureComment) indicators.push("Posture note")
        if (student.fingerNoteComment) indicators.push("Finger note")
        if (student.pedalComment) indicators.push("Pedal note")
        if (student.attendanceComment) indicators.push("Attendance note")
        return indicators
    }

    const handleOpenDetails = (studentId: string) => {
        setShowViewDetails(studentId)
        setActiveTab("attendance")
        setCurrentImageIndex(0)
    }

    const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Read the Excel file
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json(worksheet);

            // Check if data has required fields
            if (jsonData.length === 0) {
                alert("No data found in the Excel file");
                return;
            }

            // Validate the Excel structure (should have email and status columns)
            const firstRow = jsonData[0] as any;
            if (!firstRow.Email && !firstRow.email) {
                alert("Excel file must contain an 'Email' column");
                return;
            }

            // Update attendance data from Excel
            const updatedAttendanceData = [...attendanceData];
            let updatedCount = 0;
            let notFoundCount = 0;

            jsonData.forEach((row: any) => {
                // Get email from row (case insensitive)
                const email = row.Email || row.email;
                if (!email) return;

                // Find the student by email
                const studentIndex = updatedAttendanceData.findIndex(
                    student => student.studentAccount.email.toLowerCase() === email.toLowerCase()
                );

                if (studentIndex === -1) {
                    notFoundCount++;
                    return;
                }

                // Update attendance status
                let status = AttendanceStatus.NotYet;
                const rawStatus = row.Status || row.status || row.AttendanceStatus || row.attendanceStatus;

                if (rawStatus !== undefined) {
                    // Handle various status formats
                    if (typeof rawStatus === 'number') {
                        status = rawStatus;
                    } else if (typeof rawStatus === 'string') {
                        const statusText = rawStatus.toLowerCase();
                        if (statusText.includes('có mặt') || statusText.includes('present') || statusText === '1') {
                            status = AttendanceStatus.Attended;
                        } else if (statusText.includes('vắng') || statusText.includes('absent') || statusText === '2') {
                            status = AttendanceStatus.Absent;
                        }
                    }

                    updatedAttendanceData[studentIndex].attendanceStatus = status;
                    updatedCount++;
                }

                // Update comments if available
                const comments = {
                    attendanceComment: row.AttendanceComment || row.attendanceComment,
                    gestureComment: row.GestureComment || row.gestureComment,
                    fingerNoteComment: row.FingerNoteComment || row.fingerNoteComment,
                    pedalComment: row.PedalComment || row.pedalComment
                };

                Object.entries(comments).forEach(([key, value]) => {
                    if (value !== undefined) {
                        updatedAttendanceData[studentIndex][key as keyof ExtendedSlotStudentModel] = value;
                    }
                });
            });

            setAttendanceData(updatedAttendanceData);

            alert(`Imported ${updatedCount} attendance records successfully.${notFoundCount > 0 ? ` ${notFoundCount} students not found.` : ''}`);
        } catch (error) {
            console.error("Error importing Excel:", error);
            alert("Failed to import Excel file. Please check the file format.");
        }

        // Reset the input
        event.target.value = '';
    };

    const { open: handleOpenImageDialog, dialog: imageDialog } = useImagesDialog({
        onConfirm: (imageUrls) => {
            setAttendanceData((prev) => {
                return prev.map((student) => {
                    console.log({ studentId: student.studentFirebaseId, showViewDetails });

                    if (student.studentFirebaseId === showViewDetails) {
                        const updatedUrls = [...student.gestureUrls, ...imageUrls];

                        console.log({
                            ...student,
                            gestureUrls: updatedUrls,
                            gestureUrl: updatedUrls[0] || "",
                        });

                        return {
                            ...student,
                            gestureUrls: updatedUrls,
                            gestureUrl: updatedUrls[0] || "",
                        };
                    }

                    return student;
                });
            });
        },
        maxImages: 10,
        requiresUpload: true
    });

    return (
        <>
            <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Button
                        onClick={() => navigate('/teacher/scheduler')}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white mb-4 rounded-lg"
                    >
                      Back
                    </Button>
                    
                    <h1 className="text-xl md:text-2xl lg:text-4xl font-bold mb-6 text-center text-blue-700 flex items-center justify-center">
                        <Music className="w-6 h-6 md:w-8 md:h-8 mr-2 text-blue-600" />
                        Taking attendance for Piano class
                    </h1>
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Button
                            onClick={() => setShowAbsentees(!showAbsentees)}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg"
                        >
                            <UserX className="w-5 h-5 mr-2" />
                            {showAbsentees ? "Hide" : "Show"} Absent
                        </Button>
                        <div className="text-center sm:text-right text-gray-700">
                            <p className="text-sm md:text-base lg:text-lg font-semibold">
                                Totals: {sortedAttendanceData.length}
                            </p>
                            <p className="text-sm md:text-base lg:text-lg font-semibold">
                                Absents: {absentStudents.length}
                            </p>
                        </div>
                    </div>
                    <div className="mb-4 flex items-center justify-center">
                        <AlertDialog open={showExcelHelpDialog} onOpenChange={setShowExcelHelpDialog}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                                >
                                    <InfoIcon className="w-4 h-4 mr-2" />
                                    Excel Import Guide
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-md">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-blue-700">
                                        Excel Import Guide
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm text-gray-600">
                                        <p>The Excel file needs a column <strong>&quot;Email&quot;</strong> to identify students and a column <strong>&quot;Status&quot;</strong>
                                            (1 = Present, 2 = Absent).</p>
                                        <p className="mt-2">Additional columns can be added:</p>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>&quot;AttendanceComment&quot; - Attendance notes</li>
                                            <li>&quot;GestureComment&quot; - Posture notes</li>
                                            <li>&quot;FingerNoteComment&quot; - Finger notes</li>
                                            <li>&quot;PedalComment&quot; - Pedal notes</li>
                                        </ul>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogAction className="bg-blue-600 text-white hover:bg-blue-700">
                                        Understood
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="relative flex-1 sm:flex-none my-3">
                        <Button
                            onClick={() => document.getElementById('excelImport')?.click()}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg"
                        >
                            <Upload className="w-5 h-5 mr-2" />
                            Import from Excel
                        </Button>
                        <input
                            type="file"
                            id="excelImport"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleExcelImport}
                        />
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
                                Absence list
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {absentStudents.map((student) => (
                                    <div key={student.studentFirebaseId} className="p-4 bg-white/90 rounded-lg shadow-md">
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
                                <th className="py-2 px-2 md:py-3 md:px-4 text-left">Full name</th>
                                <th className="py-2 px-2 md:py-3 md:px-4 text-center">Attendance</th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedAttendanceData.map((detail) => (
                                <motion.tr
                                    key={detail.studentFirebaseId}
                                    className={`bg-white/90 ${detail.attendanceStatus === 2 ? "border-l-4 border-orange-400" : ""} ${flashingStudentId === detail.studentFirebaseId ? "animate-flash" : ""
                                    } ${highlightedStudentId === detail.studentFirebaseId ? "bg-yellow-50" : ""}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    <td className="py-3 px-2 md:py-4 md:px-4 text-center">
                                        <div className="relative">
                                            <img
                                                src={detail.studentAccount.avatarUrl || '/images/noavatar.png'}
                                                alt="Student Avatar"
                                                className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-lg border-2 border-blue-300 object-cover mx-auto shadow-sm hover:shadow-md transition-shadow duration-200"
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
                                                onClick={() => handleAttendanceChange(detail.studentFirebaseId, "attendanceStatus", 1)}
                                                variant={detail.attendanceStatus === 1 ? "default" : "secondary"}
                                                className={`w-full text-xs md:text-sm ${detail.attendanceStatus === 1
                                                    ? "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                            >
                                                <Check size={14} className="mr-1 md:mr-2" /> Attended
                                            </Button>
                                            <Button
                                                onClick={() => handleAttendanceChange(detail.studentFirebaseId, "attendanceStatus", 2)}
                                                variant={detail.attendanceStatus === 2 ? "destructive" : "secondary"}
                                                className={`w-full text-xs md:text-sm ${detail.attendanceStatus === 2
                                                    ? "bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                            >
                                                <UserX size={14} className="mr-1 md:mr-2" /> Absent
                                            </Button>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={() => handleOpenDetails(detail.studentFirebaseId)}
                                                            variant="secondary"
                                                            className={`w-full text-xs md:text-sm relative ${hasAdditionalData(detail)
                                                                ? "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border border-gray-200"
                                                                : ""
                                                            }`}
                                                        >
                                                            <Eye size={14} className="mr-1 md:mr-2" /> Details
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
                                                            <p className="font-semibold text-xs mb-1">Data available</p>
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
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg px-4 py-2 md:px-6 md:py-3"
                        >
                            Confirm
                        </Button>
                    </div>
                    {/* Redesigned "Xem chi tiet" dialog with multiple image support */}
                    <Dialog open={!!showViewDetails} onOpenChange={(open) => !open && setShowViewDetails(null)}>
                        <DialogContent className="bg-white p-0 rounded-xl overflow-hidden border border-blue-100 shadow-lg max-w-[95vw] sm:max-w-2xl">
                            {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails) && (
                                <>
                                    {/* Student Header */}
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center gap-4">
                                        <div className="relative">
                                            <img
                                                src={
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.studentAccount
                                                        .avatarUrl || '/images/noavatar.png'
                                                }
                                                alt="Student Avatar"
                                                className="h-16 w-16 rounded-lg border-2 border-white/70 object-cover shadow-md"
                                            />
                                            <Badge
                                                className={`absolute -bottom-1 -right-1 ${sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.attendanceStatus ===
                                                1
                                                    ? "bg-emerald-400 hover:bg-emerald-500"
                                                    : "bg-orange-400 hover:bg-orange-500"
                                                }`}
                                            >
                                                {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.attendanceStatus ===
                                                1 ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <X className="h-3 w-3" />
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="text-white">
                                            <h3 className="font-bold text-lg">
                                                {
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.studentAccount
                                                        .fullName
                                                }
                                            </h3>
                                            <p className="text-sm text-blue-100">
                                                {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.studentAccount.email}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-white/20 text-white hover:bg-white/30">
                                                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.attendanceStatus ===
                                                    1
                                                        ? "Attended"
                                                        : "Absent"}
                                                </Badge>
                                                {hasAdditionalData(
                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!,
                                                ) && (
                                                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        {
                                                            getDataIndicators(
                                                                sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!,
                                                            ).length
                                                        }{" "}
                                                        Notes
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Tabbed Interface */}
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <div className="border-b border-gray-200">
                                            <TabsList className="h-12 w-full rounded-none bg-white">
                                                <TabsTrigger
                                                    value="attendance"
                                                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                                                >
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Attendance
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="technique"
                                                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                                                >
                                                    <Music className="w-4 h-4 mr-2" />
                                                    Technique
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="image"
                                                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                                                >
                                                    <ImageIcon className="w-4 h-4 mr-2" />
                                                    Images
                                                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureUrls.length >
                                                        0 && (
                                                            <Badge className="ml-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                                {
                                                                    sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureUrls
                                                                        .length
                                                                }
                                                            </Badge>
                                                        )}
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>
                                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                                            {/* Attendance Tab */}
                                            <TabsContent value="attendance" className="mt-0">
                                                <Card className="border-0 shadow-none">
                                                    <CardContent className="p-0 space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                                                Attendance notes:
                                                            </label>
                                                            <div className="relative">
                                                                <Textarea
                                                                    value={
                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .attendanceComment || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleAttendanceChange(showViewDetails!, "attendanceComment", e.target.value)
                                                                    }
                                                                    placeholder="Enter notes about attendance..."
                                                                    className="text-sm min-h-[120px] w-full border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none pl-4 pr-10 py-3"
                                                                />
                                                                <Pencil className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                                                            <div className="flex items-center">
                                                                <Badge
                                                                    className={`${sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                        .attendanceStatus === 1
                                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                                        : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                                    }`}
                                                                >
                                                                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                        .attendanceStatus === 1
                                                                        ? "Attended"
                                                                        : "Absent"}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => handleAttendanceChange(showViewDetails!, "attendanceStatus", 1)}
                                                                    variant={
                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .attendanceStatus === 1
                                                                            ? "default"
                                                                            : "outline"
                                                                    }
                                                                    size="sm"
                                                                    className={`${sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                        .attendanceStatus === 1
                                                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                                    }`}
                                                                >
                                                                    <Check className="w-4 h-4 mr-1" /> Attended
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleAttendanceChange(showViewDetails!, "attendanceStatus", 2)}
                                                                    variant={
                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .attendanceStatus === 2
                                                                            ? "default"
                                                                            : "outline"
                                                                    }
                                                                    size="sm"
                                                                    className={`${sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                        .attendanceStatus === 2
                                                                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                                                                        : "border-orange-200 text-orange-700 hover:bg-orange-50"
                                                                    }`}
                                                                >
                                                                    <UserX className="w-4 h-4 mr-1" /> Absent
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            {/* Technique Tab */}
                                            <TabsContent value="technique" className="mt-0">
                                                <Card className="border-0 shadow-none">
                                                    <CardContent className="p-0 space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                                <Music className="w-4 h-4 mr-2 text-blue-500" />
                                                                Posture:
                                                            </label>
                                                            <div className="relative">
                                                                {" "}
                                                                <Textarea
                                                                    value={
                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .gestureComment || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleAttendanceChange(showViewDetails!, "gestureComment", e.target.value)
                                                                    }
                                                                    placeholder="Enter notes about playing posture..."
                                                                    className="text-sm min-h-[100px] w-full border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none pl-4 pr-10 py-3"
                                                                />
                                                                <Pencil className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                                <Music className="w-4 h-4 mr-2 text-blue-500" />
                                                                Finger:
                                                            </label>
                                                            <div className="relative">
                                                                <Textarea
                                                                    value={
                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .fingerNoteComment || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleAttendanceChange(showViewDetails!, "fingerNoteComment", e.target.value)
                                                                    }
                                                                    placeholder="Enter notes on finger technique..."
                                                                    className="text-sm min-h-[100px] w-full border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none pl-4 pr-10 py-3"
                                                                />
                                                                <Pencil className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                                <Music className="w-4 h-4 mr-2 text-blue-500" />
                                                                Pedal:
                                                            </label>
                                                            <div className="relative">
                                                                <Textarea
                                                                    value={
                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .pedalComment || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleAttendanceChange(showViewDetails!, "pedalComment", e.target.value)
                                                                    }
                                                                    placeholder="Enter notes about pedal technique..."
                                                                    className="text-sm min-h-[100px] w-full border border-gray-300 rounded-md box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none pl-4 pr-10 py-3"
                                                                />
                                                                <Pencil className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            {/* Image Tab - Enhanced for allowing URL pasting for all students */}
                                            <TabsContent value="image" className="mt-0">
                                                <Card className="border-0 shadow-none">
                                                    <CardContent className="p-0">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                                    <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
                                                                    Posture image:
                                                                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureUrls
                                                                        .length > 0 && (
                                                                        <Badge className="ml-2 bg-blue-100 text-blue-700">
                                                                            {
                                                                                sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                                    .gestureUrls.length
                                                                            }{" "}
                                                                            images
                                                                        </Badge>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureUrls
                                                                .length > 0 ? (
                                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                                    {/* Image Gallery */}
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="relative mb-3 w-full">
                                                                            <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                                                                                <img
                                                                                    src={
                                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                                            .gestureUrls[currentImageIndex] || "/placeholder.svg"
                                                                                    }
                                                                                    alt={`Gesture ${currentImageIndex + 1}`}
                                                                                    className="max-h-[300px] max-w-full object-contain"
                                                                                />
                                                                                {/* Image navigation controls */}
                                                                                {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                                    .gestureUrls.length > 1 && (
                                                                                    <>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="icon"
                                                                                            onClick={() =>
                                                                                                setCurrentImageIndex((prev) =>
                                                                                                    prev === 0
                                                                                                        ? sortedAttendanceData.find(
                                                                                                        (s) => s.studentFirebaseId === showViewDetails,
                                                                                                    )!.gestureUrls.length - 1
                                                                                                        : prev - 1,
                                                                                                )
                                                                                            }
                                                                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-gray-200 h-8 w-8"
                                                                                        >
                                                                                            <ChevronLeft className="h-4 w-4" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="icon"
                                                                                            onClick={() =>
                                                                                                setCurrentImageIndex((prev) =>
                                                                                                    prev ===
                                                                                                    sortedAttendanceData.find(
                                                                                                        (s) => s.studentFirebaseId === showViewDetails,
                                                                                                    )!.gestureUrls.length -
                                                                                                    1
                                                                                                        ? 0
                                                                                                        : prev + 1,
                                                                                                )
                                                                                            }
                                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-gray-200 h-8 w-8"
                                                                                        >
                                                                                            <ChevronRight className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </>
                                                                                )}
                                                                                {/* Delete button */}
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveImage(showViewDetails!, currentImageIndex)}
                                                                                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                            {/* Image counter */}
                                                                            {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                                .gestureUrls.length > 1 && (
                                                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                                                                                    {currentImageIndex + 1} /{" "}
                                                                                    {
                                                                                        sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                                            .gestureUrls.length
                                                                                    }
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {/* Thumbnail navigation */}
                                                                        {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!
                                                                            .gestureUrls.length > 1 && (
                                                                            <div className="flex flex-wrap gap-2 justify-center mt-2 mb-3">
                                                                                {sortedAttendanceData
                                                                                    .find((s) => s.studentFirebaseId === showViewDetails)!
                                                                                    .gestureUrls.map((url, index) => (
                                                                                        <button
                                                                                            key={index}
                                                                                            onClick={() => setCurrentImageIndex(index)}
                                                                                            className={`w-12 h-12 rounded-md overflow-hidden border-2 ${currentImageIndex === index ? "border-blue-500" : "border-gray-200"
                                                                                            }`}
                                                                                        >
                                                                                            <img
                                                                                                src={url || "/placeholder.svg"}
                                                                                                alt={`Thumbnail ${index + 1}`}
                                                                                                className="w-full h-full object-cover"
                                                                                            />
                                                                                        </button>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gray-50 rounded-lg p-6 border border-dashed border-gray-200 flex flex-col items-center justify-center">
                                                                    <div className="text-center mb-4">
                                                                        <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                                        <p className="text-sm text-gray-500">There are no pose images yet</p>
                                                                        <p className="text-xs text-gray-400 mt-1">Upload an image or enter the URL below</p>
                                                                    </div>

                                                                    <Button type="button" Icon={Upload} iconPlacement="left"
                                                                            variant={'outline'} onClick={handleOpenImageDialog}>
                                                                        Upload photos
                                                                    </Button>
                                                                    {/* <FileUpload
                                                                        onChange={(files) => {
                                                                            if (files.length > 0) {
                                                                                const fileUrl = URL.createObjectURL(files[0])
                                                                                handleAddImage(showViewDetails!, fileUrl)
                                                                            }
                                                                        }}
                                                                    /> */}
                                                                </div>
                                                            )}
                                                            {/* Add more images section - Always show for all students */}
                                                            <div className="w-full mt-3">
                                                                <p className="text-sm text-gray-500 mb-2">
                                                                    {sortedAttendanceData.find((s) => s.studentFirebaseId === showViewDetails)!.gestureUrls.length > 0
                                                                        ? "Add new images:"
                                                                        : "Or enter the image URL:"}
                                                                </p>
                                                                {/* URL input option with validation */}
                                                                <div className="mt-2">
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                id="imageUrlInput"
                                                                                placeholder="https://example.com/image.jpg"
                                                                                className="flex-1 h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        const target = e.target as HTMLInputElement;
                                                                                        if (target.value.trim()) {
                                                                                            // Validate URL before adding
                                                                                            const isValid = validateImageUrl(target.value.trim());
                                                                                            if (isValid) {
                                                                                                handleAddImage(showViewDetails!, target.value.trim());
                                                                                                target.value = '';
                                                                                                document.getElementById('urlError')?.classList.add('hidden');
                                                                                            } else {
                                                                                                document.getElementById('urlError')?.classList.remove('hidden');
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                onClick={() => {
                                                                                    const input = document.getElementById('imageUrlInput') as HTMLInputElement;
                                                                                    if (input.value.trim()) {
                                                                                        // Validate URL before adding
                                                                                        const isValid = validateImageUrl(input.value.trim());
                                                                                        if (isValid) {
                                                                                            handleAddImage(showViewDetails!, input.value.trim());
                                                                                            input.value = '';
                                                                                            document.getElementById('urlError')?.classList.add('hidden');
                                                                                        } else {
                                                                                            document.getElementById('urlError')?.classList.remove('hidden');
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                                                                size="sm"
                                                                            >
                                                                                Add
                                                                            </Button>
                                                                        </div>
                                                                        <p id="urlError" className="text-xs text-red-500 mt-1 hidden">
                                                                            Invalid URL. Make sure the URL is in image format (jpg, jpeg, png, gif, webp).
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                    {/* Footer with action buttons */}
                                    <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end">
                                        <Button
                                            onClick={() => setShowViewDetails(null)}
                                            variant="outline"
                                            className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Closed
                                        </Button>
                                        <Button
                                            onClick={() => setShowViewDetails(null)}
                                            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Save changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <DialogContent className="bg-white/90 backdrop-blur-sm w-full max-w-[95vw] sm:max-w-sm p-3">
                            <DialogHeader>
                                <DialogTitle className="flex items-center text-blue-700 text-sm md:text-base">
                                    <Music className="w-4 h-4 mr-2 text-blue-600" />
                                    Confirm attendance
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                                <p className="text-gray-700 text-xs md:text-sm">Review the absence list:</p>
                                <div>
                                    <h3 className="text-xs md:text-sm font-semibold text-gray-700 flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-2 text-yellow-500" />
                                        Students absent:
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
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmSubmit}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs py-1"
                                    >
                                        {isSubmitting ? "Submitting..." : "Confirm"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            {imageDialog}
        </>
    )
}

export default AttendancePage

