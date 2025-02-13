import type React from "react"
import { json, type LoaderFunction } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { teacherClasses, studentsData } from "~/lib/test-data"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Input } from "~/components/ui/input"

type ClassDetails = {
    id: number
    name: string
    capacity: number
    location: string
    time: string
    teacherId: number
}

type Student = {
    id: number
    name: string
    grade: string
    classId: number
}

export const loader: LoaderFunction = async ({ params }) => {
    const classId = Number.parseInt(params.id as string, 10)
    const classDetails = teacherClasses.find((cls) => cls.id === classId)
    const students = studentsData.filter((student) => student.classId === classId)

    if (!classDetails) {
        throw new Response("Class not found", { status: 404 })
    }

    return json({ classDetails, students })
}

export default function ClassDetailsPage() {
    const { classDetails, students } = useLoaderData<typeof loader>()

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            console.log("File uploaded:", file.name)
            // Add logic to handle the file upload
        }
    }

    const handleDownloadTemplate = () => {
        console.log("Downloading template...")
        // Add logic to download the template file
    }

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
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{classDetails.location}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{classDetails.time}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Student List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student: Student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.grade}</TableCell>
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

            <Card>
                <CardHeader>
                    <CardTitle>Class Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link to={`/dashboard/class/${classDetails.id}/schedule`}>
                        <Button className="w-full">View Class Schedule</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

