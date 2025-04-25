import { json, type LoaderFunction, redirect } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import {
    ArrowLeftIcon,
    BellIcon,
    BookOpenIcon,
    CalendarIcon,
    CheckCircleIcon,
    MusicIcon,
    TrophyIcon,
    UserIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { fetchClassDetail, fetchStudentScoreDetails } from "~/lib/services/class"
import { Role } from "~/lib/types/account/account"
import type { ClassDetails } from "~/lib/types/class/class"
import type { StudentClass } from "~/lib/types/class/student-class"
import { requireAuth } from "~/lib/utils/auth"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"

// Function to format date
const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

// Function to get status badge color
const getStatusBadge = (status: number) => {
    switch (status) {
        case 1:
            return { label: "Active", color: "bg-purple-100 text-purple-800 border-purple-200" }
        case 2:
            return { label: "Completed", color: "bg-emerald-100 text-emerald-800 border-emerald-200" }
        case 3:
            return { label: "Paused", color: "bg-amber-100 text-amber-800 border-amber-200" }
        case 0:
        default:
            return { label: "Not Started", color: "bg-slate-100 text-slate-800 border-slate-200" }
    }
}

// Function to get shift name
const getShiftName = (shift: number) => {
    switch (shift) {
        case 1:
            return "Morning (7:30 - 9:30)"
        case 2:
            return "Late Morning (9:45 - 11:45)"
        case 3:
            return "Afternoon (13:30 - 15:30)"
        case 4:
            return "Evening (15:45 - 17:45)"
        case 5:
            return "Night (18:00 - 20:00)"
        default:
            return `Shift ${shift}`
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

        // Fetch student score details
        let scoreDetails = null
        try {
            const scoreResponse = await fetchStudentScoreDetails({
                studentClassId: studentClass.id,
                idToken,
            })
            scoreDetails = scoreResponse.data
        } catch (scoreError) {
            console.error("Error fetching score details:", scoreError)
            // Continue without score details
        }

        return json({
            ...response.data,
            currentStudentClass: studentClass,
            scoreDetails,
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
    const data = useLoaderData<
        ClassDetails & {
            currentStudentClass: any
            scoreDetails: any
        }
    >()
    const classDetails = data
    const studentClass = data.currentStudentClass
    const scoreDetails = data.scoreDetails

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

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header with back button and class name */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/account/class_list">
                            <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 shadow-sm">
                                <ArrowLeftIcon className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{classDetails.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                                <span className="text-sm text-slate-500">Level: {classDetails.level?.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link to={`/account/schedule?classId=${classDetails.id}`}>
                            <Button variant="outline" className="gap-2 border-slate-200 shadow-sm">
                                <CalendarIcon className="h-4 w-4" />
                                Schedule
                            </Button>
                        </Link>
                        {/* <Link to="/account/class/changing">
              <Button className="gap-2" variant="outline">
                <RefreshCcw className="h-4 w-4" />
                Change Class
              </Button>
            </Link> */}
                    </div>
                </div>

                {/* Next class notification */}
                {nextClass && (
                    <Card className="mb-6 border-l-4 border-l-purple-500 shadow-sm border-slate-200">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="bg-purple-100 rounded-full p-3">
                                <BellIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-medium text-lg text-slate-800">Next Class</h3>
                                <p className="text-slate-600">
                                    {formatDate(nextClass.date)} - {getShiftName(nextClass.shift)} - Room{" "}
                                    {nextClass.roomId.replace("room-", "")}
                                </p>
                            </div>
                            <Link to={`/account/scheduler?classId=${classDetails.id}`}>
                                <Button variant="outline" size="sm" className="border-slate-200 shadow-sm">
                                    View Schedule
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Main content with tabs */}
                <Tabs defaultValue="overview" className="mb-8">
                    <TabsList className="mb-6 bg-slate-100 p-1">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="grades" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
                            Grades
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Instructor Card */}
                            <Card className="md:col-span-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600 text-white p-5">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <UserIcon className="h-5 w-5" />
                                        Instructor Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <Avatar className="h-24 w-24 border-4 border-purple-100">
                                            <AvatarImage
                                                src="/placeholder.svg?height=100&width=100"
                                                alt={classDetails.instructorName || ""}
                                            />
                                            <AvatarFallback className="bg-purple-100 text-purple-600 text-xl font-bold">
                                                {classDetails.instructorName?.charAt(0) || "I"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-semibold text-slate-800">{classDetails.instructorName}</h3>
                                            <p className="text-slate-500">
                                                {classDetails.instructor?.shortDescription || "Piano Instructor"}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="text-blue-600"
                                                        >
                                                            <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
                                                            <polyline points="15,9 18,9 18,11" />
                                                            <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0" />
                                                            <line x1="6" x2="7" y1="10" y2="10" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Email:</p>
                                                        <p className="text-sm font-medium">{classDetails.instructor?.email || "N/A"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="text-green-600"
                                                        >
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Phone:</p>
                                                        <p className="text-sm font-medium">{classDetails.instructor?.phone || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Class Info Card */}
                            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <MusicIcon className="h-5 w-5" />
                                        Class Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">Class Progress:</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Progress
                                                    value={progressPercentage}
                                                    className="h-2"
                                                // indicatorClassName={
                                                //     progressPercentage === 100
                                                //         ? "bg-emerald-500"
                                                //         : progressPercentage > 75
                                                //             ? "bg-green-500"
                                                //             : progressPercentage > 50
                                                //                 ? "bg-blue-500"
                                                //                 : progressPercentage > 25
                                                //                     ? "bg-amber-500"
                                                //                     : "bg-purple-500"
                                                // }
                                                />
                                                <span className="text-sm font-medium text-slate-700">{progressPercentage}%</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Level</p>
                                                <p className="text-lg font-bold text-purple-600">{classDetails.level?.name || "N/A"}</p>
                                            </div>
                                            <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Completed Sessions</p>
                                                <p className="text-lg font-bold text-emerald-600">
                                                    {completedSlots}/{totalSlots}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sessions/Week</p>
                                                <p className="text-lg font-bold text-slate-700">{classDetails.slotsPerWeek}</p>
                                            </div>
                                            <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current GPA</p>
                                                <p className="text-lg font-bold text-amber-600">{studentClass.gpa || "Not Available"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Class Description */}
                        <Card className="mb-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <BookOpenIcon className="h-5 w-5" />
                                    Class Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium text-slate-800 mb-2 text-lg">Level Description</h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            {classDetails.level?.description || "No level description available"}
                                        </p>
                                    </div>

                                    {classDetails.level?.skillsEarned && (
                                        <div>
                                            <h3 className="font-medium text-slate-800 mb-3 text-lg">Skills Acquired</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {Array.isArray(classDetails.level.skillsEarned) ? (
                                                    classDetails.level.skillsEarned.map((skill, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                                                        >
                                                            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                                                                <CheckCircleIcon className="h-3.5 w-3.5 text-purple-600" />
                                                            </div>
                                                            <p className="text-sm text-slate-700">{skill}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-slate-500 italic">No skills information available</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upcoming Classes */}
                        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5" />
                                    Upcoming Classes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                {classDetails.slots.filter((slot) => slot.status === 0 || slot.status === 1).length > 0 ? (
                                    <div className="space-y-4">
                                        {classDetails.slots
                                            .filter((slot) => slot.status === 0 || slot.status === 1)
                                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                            .slice(0, 3)
                                            .map((slot, index) => (
                                                <div
                                                    key={slot.id}
                                                    className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                                                        <CalendarIcon className="h-6 w-6 text-green-600" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-800">{formatDate(slot.date)}</p>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {getShiftName(slot.shift)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={slot.status === 1 ? "default" : "outline"}
                                                        className={
                                                            slot.status === 1
                                                                ? "bg-purple-500 hover:bg-purple-600 text-white"
                                                                : "border-slate-200 text-slate-700"
                                                        }
                                                    >
                                                        {slot.status === 1 ? "Scheduled" : "Not Scheduled"}
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4 opacity-80" />
                                        <p className="text-slate-600 text-lg">No upcoming classes</p>
                                        <p className="text-slate-500 text-sm mt-1">All classes have been completed</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Grades Tab */}
                    <TabsContent value="grades">                  
                        {/* Detailed Grades Section */}
                        <Card className="mb-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-5">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TrophyIcon className="h-5 w-5" />
                                    Detailed Scores
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                {scoreDetails ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800">{scoreDetails.className}</h3>
                                                <p className="text-sm text-slate-500">Student: {scoreDetails.studentName}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm text-slate-500">GPA</p>
                                                    <p className="text-2xl font-bold text-purple-600">{scoreDetails.gpa?.toFixed(2) || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <Badge
                                                        className={
                                                            scoreDetails.isPassed
                                                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                                : "bg-red-100 text-red-800 border-red-200"
                                                        }
                                                    >
                                                        {scoreDetails.isPassed ? "Passed" : "Not Passed"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {scoreDetails.certificateUrl && (
                                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                        <TrophyIcon className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-slate-800">Completion Certificate</h3>
                                                        <p className="text-sm text-slate-600">Congratulations! You have completed this course.</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={scoreDetails.certificateUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex h-9 items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    View Certificate
                                                </a>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="text-left p-3 text-slate-600 font-medium">Evaluation Criteria</th>
                                                        <th className="text-center p-3 text-slate-600 font-medium">Weight</th>
                                                        <th className="text-center p-3 text-slate-600 font-medium">Score</th>
                                                        <th className="text-center p-3 text-slate-600 font-medium">Weighted Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {scoreDetails.criteriaScores?.map((criteria: any, index: any) => (
                                                        <tr key={criteria.criteriaId} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                            <td className="p-3 text-slate-700 font-medium">{criteria.criteriaName}</td>
                                                            <td className="p-3 text-slate-700 text-center">{criteria.weight}%</td>
                                                            <td className="p-3 text-center">
                                                                <Badge
                                                                    className={
                                                                        criteria.score >= 9
                                                                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                                            : criteria.score >= 7
                                                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                                                : criteria.score >= 5
                                                                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                                                                    : "bg-red-100 text-red-800 border-red-200"
                                                                    }
                                                                >
                                                                    {criteria.score.toFixed(1)}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-slate-700 text-center font-medium">
                                                                {((criteria.score * criteria.weight) / 100).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-purple-50 border-t-2 border-purple-200">
                                                        <td className="p-3 text-purple-800 font-bold">Total Score</td>
                                                        <td className="p-3 text-purple-800 font-bold text-center">100%</td>
                                                        <td className="p-3"></td>
                                                        <td className="p-3 text-purple-800 font-bold text-center">
                                                            {scoreDetails.gpa?.toFixed(2) || "N/A"}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {scoreDetails.instructorComment && (
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <h3 className="font-medium text-slate-800 mb-2">Instructor Comments</h3>
                                                <p className="text-slate-600 italic">{scoreDetails.instructorComment}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                            <TrophyIcon className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 text-lg">No detailed scores available</p>
                                        <p className="text-slate-500 text-sm mt-1">Scores will be updated after course completion</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
