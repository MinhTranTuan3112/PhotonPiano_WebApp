import React from "react"
import { json, redirect, type LoaderFunction } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { Users, MapPin, Clock, Filter, SortDesc, Eye, BookOpen, GraduationCap, SortDescIcon, Search, User, Award } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { getAuth, requireAuth } from "~/lib/utils/auth"
import { fetchTeacherClasses } from "~/lib/services/class"
import { Input } from "~/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Badge } from "~/components/ui/badge"
import { Progress } from "~/components/ui/progress"
import { Role } from "~/lib/types/account/account"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"

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
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

const getClassColor = (level: number) => {
    switch (level) {
        case 1:
            return "#ca8a04" // yellow-600
        case 2:
            return "#0891b2" // cyan-600
        case 3:
            return "#4f46e5" // indigo-600
        default:
            return "#64748b" // slate-500
    }
}

const getScoreColor = (isScorePublished: boolean) => {
    return isScorePublished ? "text-emerald-600" : "text-amber-600"
}

export default function TeacherClassListPage() {
    const { classes } = useLoaderData<LoaderData>()

    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedFilter, setSelectedFilter] = React.useState("Các Levels");
    const [activeTab, setActiveTab] = React.useState("all");

    const totalStudents = classes.reduce((sum, cls) => sum + cls.studentNumber, 0)
    const averageCapacity = classes.length > 0 ? classes.reduce((sum, cls) => sum + cls.capacity, 0) / classes.length : 0
    const fullClasses = classes.filter((cls) => cls.studentNumber === cls.capacity).length

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedFilter === "All Levels" ||
            selectedFilter === `Level ${cls.level}`)
    );

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Page header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-medium text-neutral-900">Danh Sách Lớp</h1>
                        <p className="text-neutral-500 mt-1">Quản lý lớp học của bạn</p>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input placeholder="Tìm kiếm lớp ... "
                                className="pl-10 w-full md:w-64 bg-white border-neutral-200 rounded-full"
                                value={searchQuery}
                                onChange={(q) => setSearchQuery(q.target.value)}
                                name="search"
                                type="search">
                            </Input>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-neutral-200 text-neutral-600 rounded-full">
                                    <Filter className="mr-2 h-4 w-4" /> {selectedFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setSelectedFilter("All Levels")}>Tất cả</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedFilter("Level 1")}>Level 1</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedFilter("Level 2")}>Level 2</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedFilter("Level 3")}>Level 3</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-neutral-200 text-neutral-600 rounded-full">
                                    <SortDesc className="mr-2 h-4 w-4" /> Sort
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                                <DropdownMenuItem>Sort by Date</DropdownMenuItem>
                                <DropdownMenuItem>Sort by Capacity</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/*Stat Card*/}
                <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white border-neutral-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Total Classes</p>
                                    <h3 className="text-3xl font-bold mt-1 text-neutral-900">{classes.length}</h3>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-neutral-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-neutral-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Total Students</p>
                                    <h3 className="text-3xl font-bold mt-1 text-neutral-900">{totalStudents}</h3>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-neutral-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-neutral-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Full Classes</p>
                                    <h3 className="text-3xl font-bold mt-1 text-neutral-900">{fullClasses}</h3>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-neutral-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-neutral-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Average Capacity</p>
                                    <h3 className="text-3xl font-bold mt-1 text-neutral-900">{averageCapacity.toFixed(1)}</h3>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-neutral-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" className="mb-10">
                    <TabsList className="bg-neutral-50 p-1 rounded-full w-auto inline-flex">
                        <TabsTrigger
                            value="all"
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            onClick={() => setActiveTab("all")}
                        >
                            All Classes
                        </TabsTrigger>
                        <TabsTrigger
                            value="active"
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            onClick={() => setActiveTab("active")}
                        >
                            Active
                        </TabsTrigger>
                        <TabsTrigger
                            value="upcoming"
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            onClick={() => setActiveTab("upcoming")}
                        >
                            Upcoming
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Class Cards */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClasses.map((cls) => {
                        const classColor = getClassColor(cls.level);
                        return (
                            <Card
                                key={cls.id}
                                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-neutral-100"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br" style={{
                                        backgroundImage: `linear-gradient(to bottom right, ${classColor}33, ${classColor}66)`,
                                    }}>
                                    </div>

                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-0 font-medium">
                                            Level {cls.level}
                                        </Badge>
                                        <Badge
                                            variant={cls.isPublic ? "default" : "secondary"}
                                            className={`${cls.isPublic ? "bg-white/90 text-neutral-800" : "bg-neutral-800/80 text-white"} backdrop-blur-sm border-0`}
                                        >
                                            {cls.isPublic ? "Public" : "Private"}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

