import { json, LoaderFunction, redirect } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { ca } from "date-fns/locale"
import { ArrowLeftIcon, BellIcon, BookOpenIcon, CalendarIcon, CheckCircleIcon, ClockIcon, FileTextIcon, MusicIcon, PianoIcon, StarIcon, TrophyIcon, UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { fetchClassDetail } from "~/lib/services/class"
import { Role } from "~/lib/types/account/account"
import { ClassDetails } from "~/lib/types/class/class"
import { StudentClass } from "~/lib/types/class/student-class"
import { requireAuth } from "~/lib/utils/auth"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"

// Function to format date
const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

// Function to get status badge color
const getStatusBadge = (status: number) => {
    switch (status) {
        case 1:
            return { label: "Đang hoạt động", color: "bg-green-100 text-green-800 border-green-200" }
        case 2:
            return { label: "Đã hoàn thành", color: "bg-blue-100 text-blue-800 border-blue-200" }
        case 3:
            return { label: "Tạm dừng", color: "bg-amber-100 text-amber-800 border-amber-200" }
        case 0:
        default:
            return { label: "Chưa bắt đầu", color: "bg-gray-100 text-gray-800 border-gray-200" }
    }
}

// Function to get shift name
const getShiftName = (shift: number) => {
    switch (shift) {
        case 1:
            return "Sáng (7:30 - 9:30)"
        case 2:
            return "Trưa (9:45 - 11:45)"
        case 3:
            return "Chiều (13:30 - 15:30)"
        case 4:
            return "Tối (15:45 - 17:45)"
        case 5:
            return "Tối (18:00 - 20:00)"
        default:
            return `Ca ${shift}`
    }
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const { idToken, role, accountId } = await requireAuth(request)
    if (role !== Role.Student) {
        return redirect("/")
    }
    if (!params.id) {
        throw new Response("Class ID is required", { status: 400 })
    }

    try {
        const response = await fetchClassDetail(params.id, idToken)

        // Check if student is enrolled in this class
        const studentClass = response.data.studentClasses.find(
            (sc: StudentClass) => sc.student.accountFirebaseId === accountId,
        )

        if (!studentClass) {
            throw new Response("You are not enrolled in this class", { status: 403 })
        }

        return json({
            ...response.data,
            currentStudentClass: studentClass,
        })
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)
        throw new Response(message, { status })
    }
}


export default function StudentClassDetailPage() {
    const data = useLoaderData<ClassDetails & { currentStudentClass: any }>()
    const classDetails = data
    const studentClass = data.currentStudentClass

    // Calculate class progress
    const completedSlots = classDetails.slots.filter((slot) => slot.status === 2).length
    const totalSlots = classDetails.totalSlots
    const progressPercentage = Math.round((completedSlots / totalSlots) * 100) || 0

    // Get status badge
    const statusBadge = getStatusBadge(classDetails.status)

    // Get next class session
    const nextClass = classDetails.slots
        .filter((slot) => slot.status === 0 || slot.status === 1)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

    // Mock data for student's progress
    const studentProgress = {
        attendance: "90%",
        currentPiece: "Sonatina in G Major - Beethoven",
        practiceHours: 24,
        lastPractice: "2025-04-07",
        assignments: [
            { id: 1, title: "Scales Practice - G Major", dueDate: "2025-04-15", completed: true },
            { id: 2, title: "Sonatina in G Major - First Movement", dueDate: "2025-04-20", completed: false },
            { id: 3, title: "Sight Reading Exercise #12", dueDate: "2025-04-12", completed: false },
        ],
    }

    return (
        <main className="container mx-auto py-8 px-4">
            {/* Header with back button and class name */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/account/class_list">
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{classDetails.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                            <span className="text-sm text-slate-500">Cấp độ: {classDetails.level?.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link to={`/schedule?classId=${classDetails.id}`}>
                        <Button variant="outline" className="gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Lịch học
                        </Button>
                    </Link>
                    <Link to="/practice-log">
                        <Button className="gap-2">
                            <PianoIcon className="h-4 w-4" />
                            Nhật ký luyện tập
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Next class notification */}
            {nextClass && (
                <Card className="mb-6 border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-blue-100 rounded-full p-3">
                            <BellIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-medium text-lg">Buổi học tiếp theo</h3>
                            <p className="text-slate-600">
                                {formatDate(nextClass.date)} - {getShiftName(nextClass.shift)} - Phòng{" "}
                                {nextClass.roomId.replace("room-", "")}
                            </p>
                        </div>
                        <Link to={`/schedule?classId=${classDetails.id}`}>
                            <Button variant="outline" size="sm">
                                Xem lịch
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Main content with tabs */}
            <Tabs defaultValue="overview" className="mb-8">
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="progress">Tiến độ học tập</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Instructor Card */}
                        <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <UserIcon className="h-5 w-5" />
                                    Thông tin giảng viên
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src="/placeholder.svg?height=100&width=100" alt={classDetails.instructorName || ""} />
                                        <AvatarFallback>{classDetails.instructorName?.charAt(0) || "I"}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">{classDetails.instructorName}</h3>
                                        <p className="text-gray-500">{classDetails.instructor?.shortDescription || "Giảng viên piano"}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-sm text-gray-500">Email:</p>
                                                <p>{classDetails.instructor?.email || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Số điện thoại:</p>
                                                <p>{classDetails.instructor?.phone || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Class Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <MusicIcon className="h-5 w-5" />
                                    Thông tin lớp học
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Tiến độ lớp học:</p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Progress value={progressPercentage} className="h-2" />
                                            <span className="text-sm font-medium">{progressPercentage}%</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Cấp độ</p>
                                            <p className="text-lg font-bold text-indigo-600">{classDetails.level?.name || "N/A"}</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Buổi học đã hoàn thành</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {completedSlots}/{totalSlots}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Số buổi/tuần</p>
                                            <p className="text-lg font-bold">{classDetails.slotsPerWeek}</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Điểm GPA hiện tại</p>
                                            <p className="text-lg font-bold text-amber-600">{studentClass.gpa || "Chưa có"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Class Description */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <BookOpenIcon className="h-5 w-5" />
                                Mô tả lớp học
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* <div>
                                    <h3 className="font-medium text-slate-800 mb-2">Lịch học</h3>
                                    <p className="text-slate-600">{classDetails.scheduleDescription || "Chưa có thông tin lịch học"}</p>
                                </div> */}

                                <div>
                                    <h3 className="font-medium text-slate-800 mb-2">Mô tả cấp độ</h3>
                                    <p className="text-slate-600">{classDetails.level?.description || "Chưa có mô tả cấp độ"}</p>
                                </div>

                                {classDetails.level?.skillsEarned && (
                                    <div>
                                        <h3 className="font-medium text-slate-800 mb-2">Kỹ năng đạt được</h3>
                                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                            {Array.isArray(classDetails.level.skillsEarned) ? (
                                                classDetails.level.skillsEarned.map((skill, index) => <li key={index}>{skill}</li>)
                                            ) : (
                                                <li>Chưa có thông tin kỹ năng</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Classes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Buổi học sắp tới
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {classDetails.slots.filter((slot) => slot.status === 0 || slot.status === 1).length > 0 ? (
                                <div className="space-y-4">
                                    {classDetails.slots
                                        .filter((slot) => slot.status === 0 || slot.status === 1)
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .slice(0, 3)
                                        .map((slot, index) => (
                                            <div key={slot.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                                                    <CalendarIcon className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{formatDate(slot.date)}</p>
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            {getShiftName(slot.shift)}
                                                        </Badge>
                                                    </div>
                                                    {/* <p className="text-sm text-slate-500">{slot.slotNote || "Không có ghi chú"}</p> */}
                                                </div>
                                                <Badge variant={slot.status === 1 ? "default" : "outline"} className="ml-2">
                                                    {slot.status === 1 ? "Đã lên lịch" : "Chưa lên lịch"}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <p className="text-slate-600">Không có buổi học sắp tới</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Progress Tab */}
                <TabsContent value="progress">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Student Progress Overview */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TrophyIcon className="h-5 w-5" />
                                    Tiến độ học tập của bạn
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                                        <div className="w-32 h-32 rounded-full bg-indigo-50 flex flex-col items-center justify-center">
                                            <p className="text-3xl font-bold text-indigo-600">{studentClass.gpa || "N/A"}</p>
                                            <p className="text-sm text-indigo-600">Điểm GPA</p>
                                        </div>

                                        <div className="flex-grow space-y-4">
                                            <div>
                                                <h3 className="font-medium text-slate-800 mb-2">Bài học hiện tại</h3>
                                                <p className="text-slate-600">{studentProgress.currentPiece}</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Tỷ lệ tham dự:</p>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={Number.parseInt(studentProgress.attendance)} className="h-2" />
                                                        <span className="text-sm font-medium">{studentProgress.attendance}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Hoàn thành bài tập:</p>
                                                    <div className="flex items-center gap-2">
                                                        <Progress
                                                            value={Math.round(
                                                                (studentProgress.assignments.filter((a) => a.completed).length /
                                                                    studentProgress.assignments.length) *
                                                                100,
                                                            )}
                                                            className="h-2"
                                                        />
                                                        <span className="text-sm font-medium">
                                                            {Math.round(
                                                                (studentProgress.assignments.filter((a) => a.completed).length /
                                                                    studentProgress.assignments.length) *
                                                                100,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-medium text-slate-800 mb-3">Nhận xét của giảng viên</h3>
                                        <p className="text-slate-600 italic">
                                            {studentClass.instructorComment || "Chưa có nhận xét từ giảng viên."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Practice Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ClockIcon className="h-5 w-5" />
                                    Thống kê luyện tập
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-500">Tổng số giờ luyện tập</p>
                                        <p className="text-3xl font-bold text-green-600">{studentProgress.practiceHours}</p>
                                        <p className="text-xs text-gray-500">giờ</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Luyện tập gần nhất</p>
                                            <p className="text-lg font-bold text-indigo-600">{formatDate(studentProgress.lastPractice)}</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Trung bình/ngày</p>
                                            <p className="text-lg font-bold text-amber-600">45 phút</p>
                                        </div>
                                    </div>

                                    <Link to="/practice-log" className="block">
                                        <Button variant="outline" className="w-full">
                                            Xem nhật ký luyện tập
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Skills Progress */}
                    {/* <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <StarIcon className="h-5 w-5" />
                                Tiến độ kỹ năng
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <p className="font-medium">Kỹ thuật</p>
                                        <p className="text-sm">7/10</p>
                                    </div>
                                    <Progress value={70} className="h-2" />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <p className="font-medium">Biểu cảm</p>
                                        <p className="text-sm">6/10</p>
                                    </div>
                                    <Progress value={60} className="h-2" />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <p className="font-medium">Đọc nhạc</p>
                                        <p className="text-sm">8/10</p>
                                    </div>
                                    <Progress value={80} className="h-2" />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <p className="font-medium">Nhịp điệu</p>
                                        <p className="text-sm">7/10</p>
                                    </div>
                                    <Progress value={70} className="h-2" />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <p className="font-medium">Trình diễn</p>
                                        <p className="text-sm">5/10</p>
                                    </div>
                                    <Progress value={50} className="h-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card> */}

                    {/* Recent Achievements */}
                    {/* <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TrophyIcon className="h-5 w-5" />
                                Thành tích gần đây
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-amber-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                                        <TrophyIcon className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Hoàn thành bài "Sonatina in G Major"</p>
                                        <p className="text-sm text-slate-500">15/03/2025</p>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                        <StarIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Luyện tập 7 ngày liên tiếp</p>
                                        <p className="text-sm text-slate-500">10/03/2025</p>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                        <MusicIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Đạt điểm 9/10 cho bài kiểm tra</p>
                                        <p className="text-sm text-slate-500">01/03/2025</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card> */}
                </TabsContent>

                {/* Assignments Tab */}
                {/* <TabsContent value="assignments">
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileTextIcon className="h-5 w-5" />
                                Bài tập hiện tại
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {studentProgress.assignments
                                    .filter((a) => !a.completed)
                                    .map((assignment) => (
                                        <Card key={assignment.id} className="border-l-4 border-l-amber-500">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                            <FileTextIcon className="h-5 w-5 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium">{assignment.title}</h3>
                                                            <p className="text-sm text-slate-500">Hạn nộp: {formatDate(assignment.dueDate)}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm">Nộp bài</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                {studentProgress.assignments.filter((a) => !a.completed).length === 0 && (
                                    <div className="text-center py-8">
                                        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                        <p className="text-slate-600">Không có bài tập đang chờ</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5" />
                                Bài tập đã hoàn thành
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {studentProgress.assignments
                                    .filter((a) => a.completed)
                                    .map((assignment) => (
                                        <Card key={assignment.id} className="border-l-4 border-l-green-500">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium">{assignment.title}</h3>
                                                            <p className="text-sm text-slate-500">Đã nộp: {formatDate("2025-04-05")}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">Đã hoàn thành</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                {studentProgress.assignments.filter((a) => a.completed).length === 0 && (
                                    <div className="text-center py-8">
                                        <FileTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-600">Chưa có bài tập nào đã hoàn thành</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Tài liệu học tập</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <FileTextIcon className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-medium">Sách lý thuyết âm nhạc</h3>
                                            <p className="text-sm text-slate-500">PDF, 24 trang</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="px-4 py-3 bg-gray-50 flex justify-end">
                                    <Button variant="ghost" size="sm">
                                        Tải xuống
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <MusicIcon className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-medium">Bản nhạc Sonatina in G Major</h3>
                                            <p className="text-sm text-slate-500">PDF, 8 trang</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="px-4 py-3 bg-gray-50 flex justify-end">
                                    <Button variant="ghost" size="sm">
                                        Tải xuống
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <PianoIcon className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-medium">Bài tập kỹ thuật</h3>
                                            <p className="text-sm text-slate-500">PDF, 12 trang</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="px-4 py-3 bg-gray-50 flex justify-end">
                                    <Button variant="ghost" size="sm">
                                        Tải xuống
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent> */}
            </Tabs>
        </main>
    )
}
