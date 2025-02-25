import type { LoaderFunction } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react"
import { requireAuth } from "~/lib/utils/auth"
import { Role } from "~/lib/types/account/account"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { fetchClassDetails, fetchGradeTemplate } from "~/lib/services/class"
import type React from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { useCallback } from "react"


type Student = {
    accountFirebaseId: string
    userName: string
    email: string
    level: number
}

type StudentClass = {
    id: string
    classId: string
    studentFirebaseId: string
    createdById: string
    updateById: string | null
    deletedById: string | null
    certificateUrl: string | null
    isPassed: boolean
    gpa: number | null
    instructorComment: string | null
    student: Student
}

type ClassSlot = {
    id: string
    classId: string
    roomId: string
    shift: number
    date: string
    status: number
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

export default function ClassDetailsPage() {
    const classDetails = useLoaderData<typeof loader>()
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            console.log("File uploaded:", file.name)
            // Add logic to handle the file upload
        }
    }

    const handleDownloadTemplate = useCallback(async () => {
        try {
            const response = await fetchGradeTemplate({
                id: classDetails.id,
                idToken: classDetails.idToken,
            })
            // Create a Blob from the response data
            const blob = new Blob([response.data], { type: response.headers["content-type"] })

            // Create a link element and trigger the download
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `grade_template.xlsx` 
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading template:", error)
        }
    }, [classDetails.id, classDetails.idToken])

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{classDetails.name}</h1>
                <Link to="/dashboard/class">
                    <Button variant="outline">Back to Classes</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Capacity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{classDetails.capacity} students</p>
                        <p className="text-sm text-muted-foreground">Current: {classDetails.studentNumber}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">Level {classDetails.level}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={classDetails.status === 1 ? "success" : "destructive"}>
                            {classDetails.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Class Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold">Instructor:</p>
                            <p>{classDetails.instructor?.userName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Created At:</p>
                            <p>{new Date(classDetails.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Public:</p>
                            <Badge variant={classDetails.isPublic ? "default" : "secondary"}>
                                {classDetails.isPublic ? "Public" : "Private"}
                            </Badge>
                        </div>
                        <div>
                            <p className="font-semibold">Scores Published:</p>
                            <Badge variant={classDetails.isScorePublished ? "success" : "secondary"}>
                                {classDetails.isScorePublished ? "Published" : "Not Published"}
                            </Badge>
                        </div>
                        <div>
                            <p className="font-semibold">Required Slots:</p>
                            <p>{classDetails.requiredSlots}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Total Slots:</p>
                            <p>{classDetails.totalSlots}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Student List ({classDetails.studentNumber})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classDetails.studentClasses.map((studentClass: StudentClass) => (
                                <TableRow key={studentClass.id}>
                                    <TableCell>{studentClass.student.userName}</TableCell>
                                    <TableCell>{studentClass.student.email}</TableCell>
                                    <TableCell>{studentClass.student.level}</TableCell>
                                    <TableCell>
                                        <Badge variant={studentClass.isPassed ? "success" : "secondary"}>
                                            {studentClass.isPassed ? "Passed" : "Not Passed"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Download Grade Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleDownloadTemplate} className="w-full">
                            Download Template
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload Grades (Excel)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="w-full" />
                    </CardContent>
                </Card>
            </div>
            {/* <Card>
                <CardHeader>
                    <CardTitle>Class Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classDetails.slots.map((slot: ClassSlot) => (
                                <TableRow key={slot.id}>
                                    <TableCell>{new Date(slot.date).toLocaleDateString()}</TableCell>
                                    <TableCell>Shift {slot.shift}</TableCell>
                                    <TableCell>
                                        <Badge variant={slot.status === 1 ? "success" : "secondary"}>
                                            {slot.status === 1 ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card> */}
        </div>
    )
}

export function ErrorBoundary() {
    const error = useRouteError()

    if (isRouteErrorResponse(error)) {
        return (
            <div className="error-container">
                <h1>
                    {error.status} {error.statusText}
                </h1>
                <p>{error.data}</p>
            </div>
        )
    } else if (error instanceof Error) {
        return (
            <div className="error-container">
                <h1>Error</h1>
                <p>{error.message}</p>
            </div>
        )
    } else {
        return <h1>Unknown Error</h1>
    }
}

