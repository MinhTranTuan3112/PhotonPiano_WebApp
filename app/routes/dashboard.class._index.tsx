import React from "react"
import { json, redirect, type LoaderFunction } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { Users, MapPin, Clock, Filter, SortDesc, Eye, BookOpen, GraduationCap, SortDescIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { getAuth, requireAuth } from "~/lib/utils/auth"
import { fetchTeacherClasses } from "~/lib/services/class"
import { Input } from "~/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Badge } from "~/components/ui/badge"
import { Progress } from "~/components/ui/progress"
import { Role } from "~/lib/types/account/account"

type Class = {
    id: string
    instructorId: string
    instructorName: string
    status: number
    level: number
    isPublic: boolean
    name: string
    createdById: string
    isScorePublished: boolean
    capacity: number
    studentNumber: number
    updateById: string | null
    deletedById: string | null
    createdAt: string
    updatedAt: string | null
}

type LoaderData = {
    classes: Class[]
}

export const loader: LoaderFunction = async ({ request }) => {
    const { idToken, role } = await requireAuth(request)

    if (role !== Role.Instructor) {
        return redirect('/');
    }

    try {
        const classesResponse = await fetchTeacherClasses({
            page: 1,
            pageSize: 8,
            idToken, // Pass idToken for authentication
        });
        return json<LoaderData>({ classes: classesResponse.data })
    } catch (error) {
        console.error("Error fetching teacher classes:", error)
        return json<LoaderData>({ classes: [] })
    }
}

export default function TeacherClassListPage() {
    const { classes } = useLoaderData<LoaderData>()

    const totalStudents = classes.reduce((sum, cls) => sum + cls.studentNumber, 0)
    const averageCapacity = classes.length > 0 ? classes.reduce((sum, cls) => sum + cls.capacity, 0) / classes.length : 0
    const fullClasses = classes.filter((cls) => cls.studentNumber === cls.capacity).length

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">My Classes</h1>

            <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Full Classes</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{fullClasses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Capacity</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageCapacity.toFixed(1)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Input placeholder="Search classes..." name="search" type="search" className="w-[300px]" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Level</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>All Levels</DropdownMenuItem>
                            <DropdownMenuItem>Level 1</DropdownMenuItem>
                            <DropdownMenuItem>Level 2</DropdownMenuItem>
                            <DropdownMenuItem>Level 3</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <SortDescIcon className="mr-2 h-4 w-4" /> Sort
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                        <DropdownMenuItem>Sort by Date</DropdownMenuItem>
                        <DropdownMenuItem>Sort by Capacity</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
                    <Card key={cls.id}>
                        <CardHeader>
                            <CardTitle>{cls.name}</CardTitle>
                            <Badge variant={cls.isPublic ? "default" : "secondary"}>{cls.isPublic ? "Public" : "Private"}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Level:</span>
                                    <Badge variant="outline">Level {cls.level}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Students:</span>
                                    <span>
                                        {cls.studentNumber} / {cls.capacity}
                                    </span>
                                </div>
                                <Progress value={(cls.studentNumber / cls.capacity) * 100} className="w-full" />
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span>{new Date(cls.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Scores Published:</span>
                                    <Badge variant={cls.isScorePublished ? "success" : "destructive"}>
                                        {cls.isScorePublished ? "Yes" : "No"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button asChild variant="outline">
                                <Link to={`/dashboard/class/${cls.id}/students`}>
                                    <Users className="mr-2 h-4 w-4" /> Students
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link to={`/dashboard/class/${cls.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View Class
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

