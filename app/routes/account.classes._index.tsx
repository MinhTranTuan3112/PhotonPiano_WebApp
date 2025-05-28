import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import {
    ArrowUpDown,
    Calendar,
    Clock,
    Eye,
    Filter,
    Music,
    Search,
    User,
    X,
    GraduationCap,
    BookOpen,
    Star,
} from "lucide-react"
import React from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "~/components/ui/sheet"
import { Progress } from "~/components/ui/progress"
import { fetchStudentClasses } from "~/lib/services/class"
import { Role } from "~/lib/types/account/account"
import { requireAuth } from "~/lib/utils/auth"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { idToken, role, accountId } = await requireAuth(request)
        if (role !== Role.Student) {
            return json({ error: "Unauthorized" }, { status: 403 })
        }

        if (!accountId) {
            return json({ error: "User ID not found" }, { status: 400 })
        }

        const response = await fetchStudentClasses({
            idToken,
            accountId,
            page: 1,
            pageSize: 50,
            sortColumn: "Id",
            orderByDesc: true,
        })
        return json({ classes: response.data })
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)
        throw new Response(message, { status })
    }
}

export default function StudentClassList() {
    const { classes } = useLoaderData<{ classes: any[] }>()
    console.log(classes)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filteredClasses, setFilteredClasses] = React.useState(classes)
    const [sortOption, setSortOption] = React.useState("name-asc")
    //Filter state
    const [levelFilters, setLevelFilter] = React.useState<string[]>([])
    const [statusFilters, setStatusFilter] = React.useState<string[]>([])
    // Get unique values for filters
    const levels = Array.from(new Set(classes.map((item) => item.level?.name || ""))).sort()
    const statuses = Array.from(
        new Set(
            classes.map((item) => {
                switch (item.status) {
                    case 1:
                        return "In Progress"
                    case 2:
                        return "Completed"
                    case 0:
                        return "Not Started"
                    default:
                        return "Undefined"
                }
            }),
        ),
    )

    React.useEffect(() => {
        let result = classes

        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase()
            result = result.filter(
                (item) =>
                    (item.name?.toLowerCase() || "").includes(searchTermLower) ||
                    (item.instructorName?.toLowerCase() || "").includes(searchTermLower) ||
                    (item.instructor?.userName?.toLowerCase() || "").includes(searchTermLower) ||
                    (item.level?.name?.toLowerCase() || "").includes(searchTermLower),
            )
        }

        // Apply level filters
        if (levelFilters.length > 0) {
            result = result.filter((item) => levelFilters.includes(item.level?.name || ""))
        }

        // Apply status filters
        if (statusFilters.length > 0) {
            result = result.filter((item) => {
                const statusText = getStatusText(item.status)
                return statusFilters.includes(statusText)
            })
        }

        result = sortClasses(result, sortOption)
        setFilteredClasses(result)
    }, [searchTerm, levelFilters, statusFilters, sortOption, classes])

    const sortClasses = (classes: any[], option: string) => {
        const sorted = [...classes]

        switch (option) {
            case "name-asc":
                return sorted.sort((a, b) => a.name.localeCompare(b.name))
            case "name-desc":
                return sorted.sort((a, b) => b.name.localeCompare(a.name))
            case "progress-asc":
                return sorted.sort((a, b) => {
                    const progressA = calculateProgress(a)
                    const progressB = calculateProgress(b)
                    return progressA - progressB
                })
            case "progress-desc":
                return sorted.sort((a, b) => {
                    const progressA = calculateProgress(a)
                    const progressB = calculateProgress(b)
                    return progressB - progressA
                })
            case "date-asc":
                return sorted.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            case "date-desc":
                return sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            default:
                return sorted
        }
    }

    // Calculate progress based on completed slots
    const calculateProgress = (classItem: any) => {
        if (!classItem.slots || classItem.slots.length === 0) return 0
        const completedSlots = classItem.slots.filter((slot: any) => slot.status === 2).length
        return Math.round((completedSlots / classItem.totalSlots) * 100) || 0
    }

    // Get status text based on status code
    const getStatusText = (status: number) => {
        switch (status) {
            case 1:
                return "In Progress"
            case 2:
                return "Completed"
            case 0:
                return "Not Started"
            default:
                return "Undefined"
        }
    }

    // Toggle filter function
    const toggleFilter = (value: string, filterType: "level" | "status") => {
        switch (filterType) {
            case "level":
                setLevelFilter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
                break
            case "status":
                setStatusFilter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
                break
        }
    }

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm("")
        setLevelFilter([])
        setStatusFilter([])
        setSortOption("name-asc")
    }

    // Check if any filters are active
    const hasActiveFilters = searchTerm || levelFilters.length > 0 || statusFilters.length > 0

    // Function to determine badge color based on status
    const getStatusColor = (status: number) => {
        switch (status) {
            case 1:
                return "bg-blue-500/10 text-blue-700 border-blue-200"
            case 2:
                return "bg-emerald-500/10 text-emerald-700 border-emerald-200"
            case 0:
                return "bg-amber-500/10 text-amber-700 border-amber-200"
            default:
                return "bg-slate-500/10 text-slate-700 border-slate-200"
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date)
    }

    // Function to get shift name
    const getShiftName = (shift: number) => {
        switch (shift) {
            case 1:
                return "Morning"
            case 2:
                return "Late Morning"
            case 3:
                return "Afternoon"
            case 4:
                return "Evening"
            case 5:
                return "Night"
            default:
                return `Shift ${shift}`
        }
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return "bg-emerald-500"
        if (progress >= 50) return "bg-blue-500"
        if (progress >= 20) return "bg-amber-500"
        return "bg-slate-300"
    }

    const getLevelThemeColor = (level: any) => {
        if (level?.themeColor) return level.themeColor

        const levelName = level?.name?.toLowerCase() || ""
        if (levelName.includes("beginner")) return "#21c44d"
        if (levelName.includes("intermediate")) return "#3b82f6"
        if (levelName.includes("advanced")) return "#8b5cf6"
        return "#6366f1"
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            My Piano Classes
                        </h1>
                    </div>
                    <p className="text-slate-600 text-lg">Track your musical journey and progress</p>
                </div>

                {/* Search and Filter Bar */}
                <Card className="border-0 shadow-sm mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search classes, instructors, or levels..."
                                    className="pl-10 border-slate-200 h-11 bg-slate-50/50 focus:bg-white transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3">
                                {/*Sort Dropdown*/}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="default" className="h-11 px-4 bg-slate-50/50 hover:bg-white">
                                            <ArrowUpDown className="h-4 w-4 mr-2" />
                                            Sort
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                                                Class Name (A-Z)
                                                {sortOption === "name-asc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("progress-desc")}>
                                                Progress (High-Low)
                                                {sortOption === "progress-desc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("progress-asc")}>
                                                Progress (Low-High)
                                                {sortOption === "progress-asc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("date-desc")}>
                                                Start Date (Newest)
                                                {sortOption === "date-desc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("date-asc")}>
                                                Start Date (Oldest)
                                                {sortOption === "date-asc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Filter Sheet */}
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="default" className="h-11 px-4 bg-slate-50/50 hover:bg-white">
                                            <Filter className="h-4 w-4 mr-2" />
                                            Filter
                                            {hasActiveFilters && (
                                                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600">
                                                    <span className="text-xs">
                                                        {levelFilters.length + statusFilters.length + (searchTerm ? 1 : 0)}
                                                    </span>
                                                </Badge>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent>
                                        <SheetHeader>
                                            <SheetTitle>Filter Classes</SheetTitle>
                                            <SheetDescription>Refine your class list by level and status</SheetDescription>
                                        </SheetHeader>
                                        <div className="py-6 space-y-6">
                                            {/* Level Filters */}
                                            <section className="space-y-3">
                                                <h3 className="text-sm font-medium">Class Level</h3>
                                                <div className="space-y-2">
                                                    {levels.map((level) => (
                                                        <div className="flex items-center space-x-2" key={level}>
                                                            <Checkbox
                                                                id={`level-${level}`}
                                                                checked={levelFilters.includes(level)}
                                                                onCheckedChange={() => toggleFilter(level, "level")}
                                                            />
                                                            <Label htmlFor={`level-${level}`} className="flex items-center">
                                                                {level}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* Status Filters */}
                                            <section className="space-y-3">
                                                <h3 className="text-sm font-medium">Status</h3>
                                                <div className="space-y-2">
                                                    {statuses.map((status) => (
                                                        <div key={status} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`status-${status}`}
                                                                checked={statusFilters.includes(status)}
                                                                onCheckedChange={() => toggleFilter(status, "status")}
                                                            />
                                                            <Label htmlFor={`status-${status}`} className="flex items-center">
                                                                {status}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                        <SheetFooter className="flex flex-row gap-3 sm:justify-between">
                                            <Button variant="outline" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                                                Clear Filters
                                            </Button>
                                            <SheetClose asChild>
                                                <Button className="bg-blue-600 hover:bg-blue-700">Apply</Button>
                                            </SheetClose>
                                        </SheetFooter>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {searchTerm && (
                                    <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                        <span>Search: {searchTerm}</span>
                                        <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSearchTerm("")}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}

                                {levelFilters.map((level) => (
                                    <Badge key={level} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                        <span>Level: {level}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 ml-1"
                                            onClick={() => toggleFilter(level, "level")}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}

                                {statusFilters.map((status) => (
                                    <Badge key={status} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                        <span>Status: {status}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 ml-1"
                                            onClick={() => toggleFilter(status, "status")}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}

                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Results Count */}
                <div className="mb-6">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-medium">{filteredClasses.length}</span> classes
                        {filteredClasses.length !== classes.length && (
                            <span className="text-slate-500"> (out of {classes.length} total)</span>
                        )}
                    </p>
                </div>

                {/* Class Cards */}
                {filteredClasses.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClasses.map((classItem) => {
                            const progress = calculateProgress(classItem)
                            const statusText = getStatusText(classItem.status)
                            const statusColorClass = getStatusColor(classItem.status)
                            const themeColor = getLevelThemeColor(classItem.level)

                            return (
                                <Card
                                    key={classItem.id}
                                    className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                >
                                    <CardHeader className="p-0">
                                        <div
                                            className="p-6 text-white relative overflow-hidden"
                                            style={{
                                                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
                                            }}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                                                <Music className="w-full h-full" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-3">
                                                    <Badge className={`${statusColorClass} border`}>{statusText}</Badge>
                                                    <div className="text-right">
                                                        <p className="text-xs opacity-90">Level</p>
                                                        <p className="font-semibold">{classItem.level?.name || "Undefined"}</p>
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold mb-2 line-clamp-1">{classItem.name}</h3>
                                                <p className="text-sm opacity-90 line-clamp-2">
                                                    {classItem.level?.description || "Piano class"}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6 space-y-4">
                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Progress</span>
                                                <span className="font-medium">{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>

                                        {/* Class Details */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-slate-500 text-xs">
                                                    <User className="h-3 w-3 mr-1" />
                                                    Instructor
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {classItem.instructorName || classItem.instructor?.userName || "N/A"}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center text-slate-500 text-xs">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Schedule
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {classItem.slots && classItem.slots.length > 0
                                                        ? getShiftName(classItem.slots[0].shift)
                                                        : "TBD"}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center text-slate-500 text-xs">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Start Date
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">{formatDate(classItem.startTime)}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center text-slate-500 text-xs">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    End Date
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">{formatDate(classItem.endTime) || "N/A"}</p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Link to={`/account/classes/${classItem.id}`} className="w-full block">
                                            <Button
                                                className="w-full mt-4 group-hover:shadow-md transition-all duration-200 text-white"
                                                style={{
                                                    backgroundColor: themeColor,
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="text-center py-16">
                            <div className="inline-flex items-center justify-center p-6 bg-slate-100 rounded-full mb-6">
                                <Search className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-slate-800">No classes found</h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                We couldn't find any classes matching your criteria. Try adjusting your filters or search terms.
                            </p>
                            <Button onClick={clearAllFilters} className="bg-blue-600 hover:bg-blue-700">
                                <X className="h-4 w-4 mr-2" />
                                Clear All Filters
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
