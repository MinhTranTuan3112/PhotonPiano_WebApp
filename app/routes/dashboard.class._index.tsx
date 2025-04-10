import { useState, useEffect } from "react"
import { json, redirect, type LoaderFunction } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import {
    ArrowRight,
    Award,
    Bookmark,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    Filter,
    GraduationCap,
    LayoutGrid,
    LayoutList,
    Music,
    Search,
    SortDesc,
    Sparkles,
    User,
    Users,
    XCircle,
} from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Badge } from "~/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Separator } from "~/components/ui/separator"
import { requireAuth } from "~/lib/utils/auth"
import { fetchTeacherClasses } from "~/lib/services/class"
import { Role } from "~/lib/types/account/account"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"

type Class = {
    id: string
    instructorId: string
    instructorName: string | null
    status: number
    startTime: string
    levelId: string
    isPublic: boolean
    name: string
    createdById: string
    isScorePublished: boolean
    capacity: number
    minimumStudents: number
    requiredSlots: number
    totalSlots: number
    studentNumber: number
    updateById: string | null
    deletedById: string | null
    createdAt: string
    updatedAt: string | null
    instructor: Instructor
    level: Level
}

type Instructor = {
    accountFirebaseId: string
    userName: string
    fullName: string | null
    phone: string
    email: string
    role: number
    gender: number
    joinedDate: string
    shortDescription: string
    levelId: string | null
    status: number
    registrationDate: string
}

type Level = {
    name: string
    description: string
    skillsEarned: string[]
    slotPerWeek: number
    totalSlots: number
    pricePerSlot: number
    minimumScore: number
    isGenreDivided: boolean
    nextLevelId: string | null
}

type LoaderData = {
    classes: Class[]
}

export const loader: LoaderFunction = async ({ request }) => {
    const { idToken, role, accountId } = await requireAuth(request)

    if (role !== Role.Instructor) {
        return redirect("/")
    }

    try {
        if (!accountId) {
            return json({ error: "User ID not found" }, { status: 400 })
        }
        const classesResponse = await fetchTeacherClasses({
            page: 1,
            pageSize: 8,
            idToken, // Pass idToken for authentication
            accountId,
        })
        return json<LoaderData>({ classes: classesResponse.data })
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)

        throw new Response(message, { status })
    }
}

// Helper functions
const getClassColor = (levelName: string) => {
    if (levelName.includes("Beginner") || levelName.includes("Cơ bản")) {
        return {
            gradient: "from-yellow-300 to-yellow-500",
            light: "bg-yellow-100",
            medium: "bg-yellow-500",
            text: "text-yellow-700",
            border: "border-yellow-300",
            icon: "text-yellow-600",
            shadow: "shadow-yellow-200",
        }
    } else if (levelName.includes("Intermediate") || levelName.includes("Trung cấp")) {
        return {
            gradient: "from-cyan-300 to-cyan-500",
            light: "bg-cyan-100",
            medium: "bg-cyan-500",
            text: "text-cyan-700",
            border: "border-cyan-300",
            icon: "text-cyan-600",
            shadow: "shadow-cyan-200",
        }
    } else if (levelName.includes("Advanced") || levelName.includes("Nâng cao")) {
        return {
            gradient: "from-indigo-300 to-indigo-500",
            light: "bg-indigo-100",
            medium: "bg-indigo-500",
            text: "text-indigo-700",
            border: "border-indigo-300",
            icon: "text-indigo-600",
            shadow: "shadow-indigo-200",
        }
    } else if (levelName.includes("Professional") || levelName.includes("Chuyên nghiệp")) {
        return {
            gradient: "from-purple-300 to-purple-500",
            light: "bg-purple-100",
            medium: "bg-purple-500",
            text: "text-purple-700",
            border: "border-purple-300",
            icon: "text-purple-600",
            shadow: "shadow-purple-200",
        }
    } else {
        return {
            gradient: "from-slate-300 to-slate-500",
            light: "bg-slate-100",
            medium: "bg-slate-500",
            text: "text-slate-700",
            border: "border-slate-300",
            icon: "text-slate-600",
            shadow: "shadow-slate-200",
        }
    }
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

const StudentCapacity = ({ current, max }: { current: number; max: number }) => {
    const displayMax = Math.min(max, 10)
    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-neutral-600">Students</span>
                <span className="text-sm font-medium text-neutral-900">
                    {current}/{max}
                </span>
            </div>

            <div className="flex gap-1">
                {Array.from({ length: displayMax }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 hover:scale-110 ${i < current
                            ? current >= max
                                ? "bg-gradient-to-br from-red-300 to-red-500 text-white shadow-sm shadow-red-200"
                                : current >= max * 0.7
                                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm shadow-amber-200"
                                    : "bg-gradient-to-br from-emerald-300 to-emerald-500 text-white shadow-sm shadow-emerald-200"
                            : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                            }`}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>
    )
}

const AnimatedIcon = ({ icon: Icon, color }: { icon: any; color: string }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${isHovered ? "scale-110 rotate-6" : ""
                } ${color}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Icon className={`h-5 w-5 ${isHovered ? "text-white" : "text-neutral-600"}`} />
        </div>
    )
}

export default function TeacherClassListPage() {
    const { classes } = useLoaderData<LoaderData>()

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedFilter, setSelectedFilter] = useState("Tất cả")
    const [activeTab, setActiveTab] = useState("all")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        setIsLoaded(true)
    }, [])

    const totalStudents = classes.reduce((sum, cls) => sum + cls.studentNumber, 0)
    const averageCapacity = classes.length > 0 ? classes.reduce((sum, cls) => sum + cls.capacity, 0) / classes.length : 0
    const fullClasses = classes.filter((cls) => cls.studentNumber === cls.capacity).length

    // Get unique level names for filter dropdown
    const levelNames = [...new Set(classes.map((cls) => cls.level.name))]

    const filteredClasses = classes.filter(
        (cls) =>
            cls.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (selectedFilter === "Tất cả" || selectedFilter === cls.level.name),
    )

    return (
        <div className="bg-gradient-to-br from-white to-neutral-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Page header */}
                <div
                    className={`flex flex-col md:flex-row md:items-center md:justify-between mb-12 transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
                >
                    <div>
                        <h1 className="text-3xl font-medium text-neutral-900 flex items-center">
                            Danh Sách Lớp
                            <Sparkles className="ml-2 h-5 w-5 text-amber-500" />
                        </h1>
                        <p className="text-neutral-500 mt-1">Quản lý lớp học của bạn</p>
                    </div>

                    <div className="mt-6 md:mt-0 flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-auto group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 group-hover:text-blue-500 transition-colors duration-200" />
                            <Input
                                placeholder="Tìm kiếm lớp..."
                                className="pl-10 w-full sm:w-64 bg-white border-neutral-200 rounded-full shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                name="search"
                                type="search"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-neutral-200 text-neutral-600 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors duration-200"
                                    >
                                        <Filter className="mr-2 h-4 w-4" /> {selectedFilter}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 animate-in fade-in-80 zoom-in-95">
                                    <DropdownMenuItem onClick={() => setSelectedFilter("Tất cả")} className="hover:bg-blue-50">
                                        Tất cả
                                    </DropdownMenuItem>
                                    {levelNames.map((level) => (
                                        <DropdownMenuItem key={level} onClick={() => setSelectedFilter(level)} className="hover:bg-blue-50">
                                            {level.split("(")[0].trim()}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-neutral-200 text-neutral-600 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors duration-200"
                                    >
                                        <SortDesc className="mr-2 h-4 w-4" /> Sort
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="animate-in fade-in-80 zoom-in-95">
                                    <DropdownMenuItem className="hover:bg-blue-50">Sort by Name</DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-blue-50">Sort by Date</DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-blue-50">Sort by Capacity</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "outline"}
                                    size="icon"
                                    className={`rounded-full transition-all duration-200 ${viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700" : "border-neutral-200 text-neutral-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"}`}
                                    onClick={() => setViewMode("grid")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "outline"}
                                    size="icon"
                                    className={`rounded-full transition-all duration-200 ${viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : "border-neutral-200 text-neutral-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"}`}
                                    onClick={() => setViewMode("list")}
                                >
                                    <LayoutList className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            title: "Total Classes",
                            value: classes.length,
                            icon: BookOpen,
                            color: "bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300",
                        },
                        {
                            title: "Total Students",
                            value: totalStudents,
                            icon: Users,
                            color:
                                "bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:from-emerald-200 group-hover:to-emerald-300",
                        },
                        {
                            title: "Full Classes",
                            value: fullClasses,
                            icon: GraduationCap,
                            color:
                                "bg-gradient-to-br from-amber-100 to-amber-200 group-hover:from-amber-200 group-hover:to-amber-300",
                        },
                        {
                            title: "Average Capacity",
                            value: averageCapacity.toFixed(1),
                            icon: Award,
                            color:
                                "bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300",
                        },
                    ].map((stat, index) => (
                        <Card
                            key={stat.title}
                            className={`bg-white border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
                                        <h3 className="text-3xl font-bold mt-1 text-neutral-900">{stat.value}</h3>
                                    </div>
                                    <AnimatedIcon icon={stat.icon} color={stat.color} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs
                    defaultValue="all"
                    className={`mb-10 transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    style={{ transitionDelay: "400ms" }}
                >
                    <TabsList className="bg-neutral-50 p-1 rounded-full w-auto inline-flex shadow-sm">
                        <TabsTrigger
                            value="all"
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                            onClick={() => setActiveTab("all")}
                        >
                            All Classes
                        </TabsTrigger>
                        <TabsTrigger
                            value="active"
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                            onClick={() => setActiveTab("active")}
                        >
                            Active
                        </TabsTrigger>
                        <TabsTrigger
                            value="upcoming"
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                            onClick={() => setActiveTab("upcoming")}
                        >
                            Upcoming
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Class Cards */}
                {viewMode === "grid" ? (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredClasses.map((cls, index) => {
                            const colors = getClassColor(cls.level.name)
                            return (
                                <Card
                                    key={cls.id}
                                    className={`overflow-hidden hover:shadow-lg transition-all duration-500 group border-neutral-100 hover:border-neutral-200 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                                    style={{ transitionDelay: `${500 + index * 100}ms` }}
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} group-hover:scale-105 transition-transform duration-500`}
                                        ></div>

                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-0 font-medium shadow-sm">
                                                {cls.level.name.split("(")[0].trim()}
                                            </Badge>

                                            <Badge
                                                variant={cls.isPublic ? "default" : "secondary"}
                                                className={`${cls.isPublic ? "bg-white/90 text-neutral-800" : "bg-neutral-800/80 text-white"
                                                    } backdrop-blur-sm border-0 shadow-sm`}
                                            >
                                                {cls.isPublic ? "Public" : "Private"}
                                            </Badge>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                                            <h3 className="font-medium text-xl text-white flex items-center">
                                                {cls.name}
                                                <Music className="ml-2 h-4 w-4 text-white/70 group-hover:animate-bounce" />
                                            </h3>
                                            <div className="flex items-center mt-1 text-white/80 text-sm">
                                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                <span>Created: {formatDate(cls.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center">
                                                <div
                                                    className={`h-10 w-10 rounded-full ${colors.light} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                                                >
                                                    <Users className={`h-5 w-5 ${colors.icon}`} />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-neutral-500">Students</p>
                                                    <p className="font-medium">
                                                        {cls.studentNumber}/{cls.capacity}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <div
                                                    className={`h-10 w-10 rounded-full ${colors.light} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                                                >
                                                    <Award className={`h-5 w-5 ${colors.icon}`} />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-neutral-500">Status</p>
                                                    <p className={`font-medium ${cls.isScorePublished ? "text-emerald-600" : "text-amber-600"}`}>
                                                        {cls.isScorePublished ? "Published" : "Pending"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="my-6" />

                                        <StudentCapacity current={cls.studentNumber} max={cls.capacity} />

                                        <div className="space-y-4 mt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-neutral-600">
                                                    <Bookmark className="h-4 w-4 mr-2" />
                                                    <span className="text-sm">Status:</span>
                                                </div>
                                                <div className="flex items-center">
                                                    {cls.isScorePublished ? (
                                                        <>
                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                                                            <span className="text-sm text-emerald-600 font-medium">Scores Published</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                                                            <span className="text-sm text-amber-600 font-medium">Scores Pending</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-neutral-600">
                                                    <User className="h-4 w-4 mr-2" />
                                                    <span className="text-sm">Instructor:</span>
                                                </div>
                                                <span className="text-sm font-medium">{cls.instructorName}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-neutral-600">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    <span className="text-sm">Created:</span>
                                                </div>
                                                <span className="text-sm font-medium">{formatDate(cls.createdAt)}</span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="px-6 py-4 bg-neutral-50 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div
                                                className={`flex items-center justify-center h-8 w-8 rounded-full ${colors.medium} text-white text-xs font-medium border-2 border-white shadow-sm ${colors.shadow}`}
                                            >
                                                {cls.studentNumber}
                                            </div>
                                            <span className="ml-2 text-sm text-neutral-500">students</span>
                                        </div>

                                        <Link to={`/dashboard/class/${cls.id}`}>
                                            <Button
                                                variant="ghost"
                                                className={`text-neutral-600 hover:text-neutral-900 group-hover:bg-neutral-100 group-hover:${colors.text} transition-all duration-200`}
                                            >
                                                View Class{" "}
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div
                        className={`bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                        style={{ transitionDelay: "500ms" }}
                    >
                        <div className="grid grid-cols-12 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-500">
                            <div className="col-span-5">Class Name</div>
                            <div className="col-span-2 text-center">Level</div>
                            <div className="col-span-2 text-center">Students</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>

                        {filteredClasses.map((cls, index) => {
                            const colors = getClassColor(cls.level.name)

                            return (
                                <div
                                    key={cls.id}
                                    className={`grid grid-cols-12 px-6 py-4 border-b border-neutral-100 items-center hover:bg-neutral-50 transition-all duration-200 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                                    style={{ transitionDelay: `${600 + index * 100}ms` }}
                                >
                                    <div className="col-span-5">
                                        <div className="flex items-start">
                                            <div
                                                className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.light} flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300`}
                                            >
                                                <BookOpen className={`h-5 w-5 ${colors.icon}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-neutral-900 flex items-center">
                                                    {cls.name}
                                                    <Music className="ml-2 h-3.5 w-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </h3>
                                                <p className="text-sm text-neutral-500">Created: {formatDate(cls.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-center">
                                        <Badge variant="outline" className={`${colors.light} ${colors.text} ${colors.border}`}>
                                            {cls.level.name.split("(")[0].trim()}
                                        </Badge>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="flex justify-center">
                                            {Array.from({ length: Math.min(cls.capacity, 10) }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium -ml-1 first:ml-0 border border-white hover:scale-125 transition-transform duration-200 ${i < cls.studentNumber
                                                        ? cls.studentNumber >= cls.capacity
                                                            ? "bg-red-500 text-white"
                                                            : cls.studentNumber >= cls.capacity * 0.7
                                                                ? "bg-amber-500 text-white"
                                                                : "bg-emerald-500 text-white"
                                                        : "bg-neutral-200 text-neutral-400"
                                                        }`}
                                                >
                                                    {i < cls.studentNumber ? "" : ""}
                                                </div>
                                            ))}
                                            <span className="ml-2 text-sm font-medium">
                                                {cls.studentNumber}/{cls.capacity}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-center">
                                        <Badge
                                            variant="outline"
                                            className={`${cls.isScorePublished
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                                } shadow-sm transition-all duration-200 hover:shadow-md`}
                                        >
                                            {cls.isScorePublished ? "Published" : "Pending"}
                                        </Badge>
                                    </div>

                                    <div className="col-span-1 text-right">
                                        <Link to={`/dashboard/class/${cls.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-all duration-200"
                                            >
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {filteredClasses.length === 0 && (
                    <div
                        className={`flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl shadow-sm transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                        style={{ transitionDelay: "500ms" }}
                    >
                        <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4 animate-pulse">
                            <BookOpen className="h-10 w-10 text-neutral-400" />
                        </div>
                        <h3 className="text-xl font-medium text-neutral-900">No classes found</h3>
                        <p className="text-neutral-500 mt-2 max-w-md">
                            We couldn't find any classes matching your current filters. Try adjusting your search criteria.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6 rounded-full border-neutral-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
                            onClick={() => {
                                setSearchQuery("")
                                setSelectedFilter("Tất cả")
                            }}
                        >
                            Reset filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

