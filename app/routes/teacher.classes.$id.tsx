import { Avatar, AvatarFallback } from "@radix-ui/react-avatar"
import { json, type LoaderFunction, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import {
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  FileDown,
  FileSpreadsheet,
  FileText,
  Gauge,
  Hourglass,
  Layers,
  Link,
  Search,
  Sparkles,
  Upload,
  Users,
  Eye,
  X,
} from "lucide-react"
import React, { useState } from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Progress } from "~/components/ui/progress"
import { ScoreDetailsDialog } from "~/components/ui/score-details-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { fetchClassDetails, fetchGradeTemplate, importStudentClassScoresFromExcel } from "~/lib/services/class"
import { fetchStudentClassScores } from "~/lib/services/student-class"
import { Role } from "~/lib/types/account/account"
import { requireAuth } from "~/lib/utils/auth"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { toast } from "sonner"
import { CertificateModal } from "~/components/ui/view-certificate-modal"
import type { Certificate } from "~/lib/types/certificate/certifcate"

const getStatusBadge = (status: number) => {
  switch (status) {
    case 0:
      return (
        <Badge variant="outline" className="font-medium flex items-center gap-1">
          <CircleDashed className="h-3 w-3" />
          Scheduler
        </Badge>
      )
    case 1:
      return (
        <Badge variant="secondary" className="font-medium flex items-center gap-1">
          <Hourglass className="h-3 w-3" />
          In Progress
        </Badge>
      )
    case 2:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 font-medium flex items-center gap-1">
          <CircleCheck className="h-3 w-3" />
          Completed
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="font-medium flex items-center gap-1">
          <CircleX className="h-3 w-3" />
          Unknown
        </Badge>
      )
  }
}

const getShiftName = (shift: number) => {
  switch (shift) {
    case 0:
      return "Morning (8:00 - 10:00)"
    case 1:
      return "Late Morning (10:00 - 12:00)"
    case 2:
      return "Early Afternoon (13:00 - 15:00)"
    case 3:
      return "Afternoon (15:00 - 17:00)"
    case 4:
      return "Evening (17:00 - 19:00)"
    default:
      return `Shift ${shift}`
  }
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString()
  } catch (error) {
    return "Invalid Date"
  }
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const { idToken, role } = await requireAuth(request)
  if (role !== Role.Instructor) {
    return redirect("/")
  }
  if (!params.id) {
    throw new Response("Class ID is required", { status: 400 })
  }

  try {
    const response = await fetchClassDetails({
      id: params.id,
      idToken,
    })
    return json({ ...response.data, idToken })
  } catch (error) {
    console.error({ error })

    if (isRedirectError(error)) {
      throw error
    }

    const { message, status } = getErrorDetailsInfo(error)
    throw new Response(message, { status })
  }
}

export default function TeacherClassDetailsPage() {
  const classDetailsData = useLoaderData<typeof loader>()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeSection, setActiveSection] = useState("overview")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [classScores, setClassScores] = useState<any>(null)
  const [isLoadingScores, setIsLoadingScores] = useState(false)

  // Certificate modal state
  const [certificateModalOpen, setCertificateModalOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  const [validationErrorModalOpen, setValidationErrorModalOpen] = useState(false)
  const [validationErrorDetails, setValidationErrorDetails] = useState("")

  const showValidationErrorModal = (errorMessage: string) => {
    setValidationErrorDetails(errorMessage)
    setValidationErrorModalOpen(true)
  }

  React.useEffect(() => {
    async function loadScores() {
      if (activeSection === "grades" && classDetailsData.idToken && !classScores) {
        try {
          setIsLoadingScores(true)
          const response = await fetchStudentClassScores({
            classId: classDetailsData.id,
            idToken: classDetailsData.idToken,
          })
          setClassScores(response.data)
        } catch (error) {
          console.error("Error loading scores:", error)
          toast.warning("Cannot load scores: " + error)
        } finally {
          setIsLoadingScores(false)
        }
      }
    }

    loadScores()
  }, [activeSection, classDetailsData.id, classDetailsData.idToken, classScores])

  const handleDownloadTemplate = React.useCallback(async () => {
    try {
      if (!classDetailsData.idToken) return

      const response = await fetchGradeTemplate({
        id: classDetailsData.id,
        idToken: classDetailsData.idToken,
      })

      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: response.headers["content-type"] })

      // Create a link element and trigger the download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `grade_template_${classDetailsData.name}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      const err = getErrorDetailsInfo(error)
      toast.warning("Can not download template: " + err.message)
    }
  }, [classDetailsData.id, classDetailsData.idToken, classDetailsData.name])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadSuccess(false)
      console.log("File selected:", file.name)
      toast.info(`File selected: ${file.name}`)
    }
  }

  const handleUploadAndProcess = async () => {
    if (!selectedFile || !classDetailsData.idToken) {
      toast.warning("Has not pick file or Unauthorized")
      return
    }

    try {
      setIsUploading(true)
      setUploadSuccess(false)

      await importStudentClassScoresFromExcel({
        classId: classDetailsData.id,
        excelFile: selectedFile,
        idToken: classDetailsData.idToken,
      })

      setUploadSuccess(true)
      setSelectedFile(null)
      toast.success("Import scores sucessfully!")

      // Reset the file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }

      if (classDetailsData.idToken) {
        try {
          const response = await fetchClassDetails({
            id: classDetailsData.id,
            idToken: classDetailsData.idToken,
          })
          Object.assign(classDetailsData, response.data)
          setClassScores(null)
          const scoresResponse = await fetchStudentClassScores({
            classId: classDetailsData.id,
            idToken: classDetailsData.idToken,
          })
          setClassScores(scoresResponse.data)
        } catch (error) {
          const err = getErrorDetailsInfo(error)
          toast.warning("Can not update data: " + err.message)
        }
      }
    } catch (error) {
      const err = getErrorDetailsInfo(error)
      if (err.message && err.message.length > 100 && err.message.includes("Invalid scores detected")) {
        showValidationErrorModal(err.message)
      } else {
        toast.warning("Can not import score: " + err.message)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewCertificate = (studentClass: any) => {
    const certificate: Certificate = {
      studentClassId: studentClass.id || "",
      className: classDetailsData.name || "",
      levelName: classDetailsData.level?.name || "",
      completionDate: studentClass.completionDate || new Date().toISOString(),
      certificateUrl: studentClass.certificateUrl || "",
      certificateHtml: studentClass.certificateHtml || "",
      gpa: studentClass.gpa || 0,
      studentName: studentClass.student?.fullName || "Student",
      instructorName: classDetailsData.instructor?.fullName || "Instructor",
      skillsEarned: classDetailsData.level?.skillsEarned || [],
    }

    setSelectedCertificate(certificate)
    setCertificateModalOpen(true)
  }

  const slots = classDetailsData.slots || []
  const currentDate = new Date()
  const completedSlots = slots.filter((slot: any) => slot.status === 2).length
  const requiredSlots = classDetailsData.requiredSlots || 0
  const progressPercentage =
    classDetailsData.requiredSlots > 0 ? (completedSlots / classDetailsData.requiredSlots) * 100 : 0

  // Find the upcomingSlots definition and modify it to sort by date
  const upcomingSlots = slots
    .filter((slot: any) => {
      try {
        return new Date(slot.date) >= currentDate && slot.status !== 2
      } catch {
        return false
      }
    })
    .sort((a: any, b: any) => {
      // First sort by date
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB

      // If same date, sort by shift
      return a.shift - b.shift
    })
    .slice(0, 5)

  // Find the pastSlots definition and modify it to sort by date (most recent first)
  const pastSlots = slots
    .filter((slot: any) => slot.status === 2)
    .sort((a: any, b: any) => {
      // First sort by date (most recent first)
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateB - dateA

      // If same date, sort by shift
      return b.shift - a.shift
    })
    .slice(0, 5)
  const filteredStudents = classDetailsData.studentClasses.filter(
    (studentClass: any) =>
      studentClass.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentClass.student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Add confirmation dialog for file upload
  const { open: openUploadConfirmation, dialog: uploadConfirmationDialog } = useConfirmationDialog({
    title: "Upload Confirmation",
    description: "Are you sure you want to upload and process this file? This will update student scores.",
    onConfirm: handleUploadAndProcess,
    confirmText: "Upload",
    cancelText: "Cancel",
    confirmButtonClassname: "bg-green-600 hover:bg-green-700 text-white",
  })

  const handleScoresUpdated = React.useCallback(
    (updatedStudents: any) => {
      // Update the class scores with the new data
      if (classScores) {
        setClassScores({
          ...classScores,
          students: updatedStudents,
        })
      }

      // Force a refresh of the student class data
      if (classDetailsData.idToken) {
        // Refresh the data by fetching class details again
        fetchClassDetails({
          id: classDetailsData.id,
          idToken: classDetailsData.idToken,
        })
          .then((response) => {
            // Update the class details data
            Object.assign(classDetailsData, response.data)

            // Refresh the scores data
            return fetchStudentClassScores({
              classId: classDetailsData.id,
              idToken: classDetailsData.idToken,
            })
          })
          .then((scoresResponse) => {
            setClassScores(scoresResponse.data)
            toast.success("Scores updated successfully!")
          })
          .catch((error) => {
            console.error("Error refreshing data after score update:", error)
            toast.warning("Cannot update data after updating scores. Please reload the page.")
          })
      }
    },
    [classDetailsData, classScores],
  )

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-950 min-h-screen">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/teacher/classes" className="text-muted-foreground hover:text-foreground transition-colors">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md">
                {classDetailsData.name || "Class Details"}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    classDetailsData.status === 1 ? "default" : classDetailsData.status === 2 ? "success" : "outline"
                  }
                  className="text-xs"
                >
                  {classDetailsData.status === 0 ? "Pending" : classDetailsData.status === 1 ? "Active" : "Completed"}
                </Badge>
                {classDetailsData.isPublic !== undefined && (
                  <Badge variant={classDetailsData.isPublic ? "secondary" : "outline"} className="text-xs">
                    {classDetailsData.isPublic ? "Public" : "Private"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="px-4 pb-0">
          <div className="flex space-x-1 overflow-x-auto pb-3 scrollbar-hide">
            <Button
              variant={activeSection === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection("overview")}
              className="rounded-full"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeSection === "students" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection("students")}
              className="rounded-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Students
            </Button>
            <Button
              variant={activeSection === "schedule" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection("schedule")}
              className="rounded-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button
              variant={activeSection === "grades" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection("grades")}
              className="rounded-full"
            >
              <Award className="h-4 w-4 mr-2" />
              Grades
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <div className="p-4 md:p-6">
        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2"></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Students</p>
                      <div className="text-2xl font-bold">
                        {classDetailsData.studentNumber || 0} / {classDetailsData.capacity || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Min: {classDetailsData.minimumStudents || 0}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <Progress
                    value={
                      classDetailsData.capacity
                        ? ((classDetailsData.studentNumber || 0) / classDetailsData.capacity) * 100
                        : 0
                    }
                    className="h-1 mt-4"
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2"></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Progress</p>
                      <div className="text-2xl font-bold">
                        {completedSlots} / {requiredSlots}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(progressPercentage)}% complete</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-full">
                      <BarChart3 className="h-5 w-5 text-green-500 dark:text-green-400" />
                    </div>
                  </div>
                  <Progress value={progressPercentage} className="h-1 mt-4" />
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2"></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Level</p>
                      <div className="text-2xl font-bold truncate max-w-[150px]">
                        {classDetailsData.level?.name || "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Skills: {classDetailsData.level?.skillsEarned?.length || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-full">
                      <Layers className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-2"></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Price</p>
                      <div className="text-2xl font-bold">
                        {(classDetailsData.pricePerSlots || 0).toLocaleString()} VND
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Per session</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-full">
                      <Gauge className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Level Skills - Grid Layout */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Level Skills
                    </CardTitle>
                    <CardDescription>
                      Skills earned in the {classDetailsData.level?.name || "current"} level
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    {classDetailsData.level?.skillsEarned?.length || 0} skills
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classDetailsData.level?.skillsEarned?.map((skill: any, index: any) => (
                    <Card
                      key={index}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              index % 3 === 0
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                : index % 3 === 1
                                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                            }`}
                          >
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <p className="text-sm">{skill}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Upcoming Sessions
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection("schedule")}
                    className="gap-1 text-xs"
                  >
                    View All
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingSlots.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSlots.map((slot: any, index: any) => (
                      <div
                        key={slot?.id || index}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full">
                            <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{formatDate(slot?.date)}</p>
                            <p className="text-sm text-muted-foreground">{getShiftName(slot?.shift || 0)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Room {slot?.roomId ? slot.roomId.slice(-4) : "N/A"}
                          </Badge>
                          {getStatusBadge(slot?.status || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No upcoming sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students Section */}
        {activeSection === "students" && (
          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Students ({classDetailsData.studentNumber || 0})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 w-[200px] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-0 rounded-none">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>GPA</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.slice(0, 10).map((studentClass: any, index: any) => (
                          <TableRow
                            key={studentClass?.id || index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border">
                                  <AvatarFallback className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium">
                                    {studentClass?.student?.fullName?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{studentClass?.student?.fullName || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {studentClass?.student?.userName || ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{studentClass?.student?.email || "No email"}</TableCell>
                            <TableCell>{formatDate(studentClass?.student?.joinedDate)}</TableCell>
                            <TableCell>
                              {studentClass?.gpa !== null && studentClass?.gpa !== undefined ? (
                                <span
                                  className={`font-medium px-2 py-1 rounded-md ${
                                    studentClass.gpa >= 7
                                      ? "bg-green-100 text-green-800"
                                      : studentClass.gpa >= 5
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {studentClass.gpa ? studentClass.gpa.toFixed(1) : "Not available"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Not graded</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={studentClass?.isPassed ? "success" : "secondary"}
                                className={
                                  studentClass?.isPassed ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
                                }
                              >
                                {studentClass?.isPassed ? "Passed" : "In Progress"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                              <Users className="h-10 w-10 text-muted-foreground mb-2" />
                              <p>No students found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Section */}
        {activeSection === "schedule" && (
          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Class Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Upcoming Sessions</h3>
                    {upcomingSlots.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingSlots.map((slot: any, index: any) => (
                          <div
                            key={slot?.id || index}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full">
                                <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium">{formatDate(slot?.date)}</p>
                                <p className="text-sm text-muted-foreground">{getShiftName(slot?.shift || 0)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Room {slot?.roomId ? slot.roomId.slice(-4) : "N/A"}
                              </Badge>
                              {getStatusBadge(slot?.status || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                        <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No upcoming sessions</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Past Sessions</h3>
                    {pastSlots.length > 0 ? (
                      <div className="space-y-3">
                        {pastSlots.map((slot: any, index: any) => (
                          <div
                            key={slot?.id || index}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-full">
                                <Calendar className="h-4 w-4 text-green-500 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium">{formatDate(slot?.date)}</p>
                                <p className="text-sm text-muted-foreground">{getShiftName(slot?.shift || 0)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Room {slot?.roomId ? slot.roomId.slice(-4) : "N/A"}
                              </Badge>
                              {getStatusBadge(slot?.status || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                        <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No past sessions</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grades Section */}
        {activeSection === "grades" && (
          <div className="space-y-6">
            {/* Compact Grade Template Management */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                  Grade Template Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <Button onClick={handleDownloadTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>

                  <div className="flex-1 flex items-center gap-4">
                    <label
                      htmlFor="file-upload"
                      className="border-2 border-dashed rounded-lg p-6 text-center flex-1 relative transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20")
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20")
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20")

                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0]
                          if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                            setSelectedFile(file)
                            setUploadSuccess(false)
                            toast.info(`File selected: ${file.name}`)

                            // Update the file input for consistency
                            const fileInput = document.getElementById("file-upload") as HTMLInputElement
                            if (fileInput) {
                              // Create a new DataTransfer object
                              const dataTransfer = new DataTransfer()
                              dataTransfer.items.add(file)
                              fileInput.files = dataTransfer.files
                            }
                          } else {
                            toast.warning("Only Excel files (.xlsx, .xls) are accepted")
                          }
                        }
                      }}
                    >
                      <Input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full">
                          <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Excel files only (.xlsx, .xls)</p>
                        </div>
                        {selectedFile && (
                          <Badge variant="outline" className="mt-2 gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            {selectedFile.name}
                          </Badge>
                        )}
                      </div>
                      {!selectedFile && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border">
                            <p className="font-medium">Drop your Excel file here</p>
                          </div>
                        </div>
                      )}
                    </label>

                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                      onClick={openUploadConfirmation}
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload and Process
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Grades Table */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Student Grades
                  </CardTitle>

                  {/* View More Details button that uses ScoreDetailsDialog with class data */}
                  {isLoadingScores ? (
                    <Button variant="outline" size="sm" disabled className="gap-1">
                      <Clock className="h-4 w-4 animate-spin" />
                      Loading...
                    </Button>
                  ) : classScores ? (
                    <ScoreDetailsDialog
                      isClassView={true}
                      classData={classScores}
                      idToken={classDetailsData.idToken}
                      onScoresUpdated={handleScoresUpdated}
                    />
                  ) : (
                    <Button variant="outline" size="sm" disabled className="gap-1">
                      <Eye className="h-4 w-4" />
                      No Data Available
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((studentClass: any, index: any) => (
                        <TableRow
                          key={studentClass?.id || index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border">
                                <AvatarFallback className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
                                  {studentClass?.student?.fullName?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{studentClass?.student?.fullName || "Unknown"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {studentClass?.gpa !== null && studentClass?.gpa !== undefined ? (
                              <span
                                className={`font-medium px-2 py-1 rounded-md ${
                                  studentClass.gpa >= 7
                                    ? "bg-green-100 text-green-800"
                                    : studentClass.gpa >= 5
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {studentClass.gpa !== undefined ? studentClass.gpa.toFixed(1) : "Not available"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not graded</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={studentClass?.isPassed ? "success" : "secondary"}
                              className={studentClass?.isPassed ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                            >
                              {studentClass?.isPassed ? "Passed" : "In Progress"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {studentClass?.certificateUrl ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                                onClick={() => handleViewCertificate(studentClass)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not issued</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[200px]">
                              {studentClass?.instructorComment || "No comments"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center justify-center">
                            <Award className="h-10 w-10 text-muted-foreground mb-2" />
                            <p>No students found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Validation Error Modal */}
      {validationErrorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
                <CircleX className="h-5 w-5" />
                Highest Warning Level
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setValidationErrorModalOpen(false)}
                className="h-8 w-8"
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md border border-orange-200 dark:border-orange-800">
                <h4 className="font-medium mb-2 text-orange-800">The following validation errors were found:</h4>
                <div className="space-y-3">
                  {validationErrorDetails.split("Invalid scores detected:").map((error, index) => {
                    if (index === 0) return null // Skip the first part before "Invalid scores detected:"
                    return (
                      <div key={index} className="pl-4 border-l-2 border-orange-300 dark:border-orange-700">
                        <p className="text-sm text-orange-700 dark:text-orange-200">{error.trim()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Please correct these errors in your Excel file and try uploading again.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <Button onClick={() => setValidationErrorModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {uploadConfirmationDialog}

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        certificate={selectedCertificate}
      />
    </div>
  )
}
