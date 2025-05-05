"use client"

import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { ArrowUpDown, Calendar, Clock, Eye, Filter, Music, Search, User, X } from "lucide-react"
import React from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
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
            const searchTermLower = searchTerm.toLowerCase();
            result = result.filter(
                (item) =>
                    (item.name?.toLowerCase() || '').includes(searchTermLower) ||
                    (item.instructorName?.toLowerCase() || '').includes(searchTermLower) ||
                    (item.instructor?.userName?.toLowerCase() || '').includes(searchTermLower) ||
                    (item.level?.name?.toLowerCase() || '').includes(searchTermLower)
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
                return "bg-blue-500 hover:bg-blue-600"
            case 2:
                return "bg-emerald-500 hover:bg-emerald-600"
            case 0:
                return "bg-amber-500 hover:bg-amber-600"
            default:
                return "bg-slate-500 hover:bg-slate-600"
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date)
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Classes</h1>
                        <p className="text-slate-500 mt-1">Manage and track your piano courses</p>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <Search className="h-4 w-4" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search by class name or instructor..."
                                className="w-full pl-10 border-slate-200 h-10"
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
                                    <Button variant="outline" size="sm" className="h-10 px-4">
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Sort</span>
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
                                    <Button variant="outline" size="sm" className="h-10 px-4">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Filter</span>
                                        {hasActiveFilters && (
                                            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-purple-600">
                                                <span className="text-xs">
                                                    {levelFilters.length + statusFilters.length + (searchTerm ? 1 : 0)}
                                                </span>
                                            </Badge>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Filters</SheetTitle>
                                        <SheetDescription>Filter classes by criteria</SheetDescription>
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
                                            <Button className="bg-purple-600 hover:bg-purple-700">Apply</Button>
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
                </div>

                {/* Results Count */}
                <div className="mb-5">
                    <p className="text-sm text-slate-500">
                        Showing {filteredClasses.length} classes{" "}
                        {filteredClasses.length !== classes.length && `(out of ${classes.length} total)`}
                    </p>
                </div>

                {/* Class Cards */}
                {filteredClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {filteredClasses.map((classItem) => {
                            const progress = calculateProgress(classItem)
                            const levelNumber = classItem.level?.name?.split(" ").pop() || ""
                            const statusText = getStatusText(classItem.status)
                            const statusColorClass = getStatusColor(classItem.status)

                            return (
                                <Card
                                    key={classItem.id}
                                    className="overflow-hidden transition-all duration-200 hover:shadow-lg border-slate-200 group"
                                >
                                    <CardHeader className="p-0">
                                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 relative">
                                            <div className="absolute top-0 right-0 p-2">
                                                <Badge className={`${statusColorClass} text-white`}>{statusText}</Badge>
                                            </div>
                                            <h3 className="text-white font-bold text-xl mb-1">Piano Class {levelNumber}</h3>
                                            <div className="flex items-center text-purple-100">
                                                <Music className="h-4 w-4 mr-2" />
                                                <span className="text-sm">{classItem.level?.name || "Undefined"}</span>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Instructor</p>
                                                <div className="flex items-center">
                                                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                                                        <User className="h-3 w-3 text-purple-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 truncate">
                                                        {classItem.instructorName || classItem.instructor?.userName || "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Schedule</p>
                                                <div className="flex items-center">
                                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                                        <Clock className="h-3 w-3 text-blue-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 truncate">
                                                        {classItem.slots && classItem.slots.length > 0
                                                            ? getShiftName(classItem.slots[0].shift).split(" ")[0]
                                                            : "No schedule"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Start Date</p>
                                                <div className="flex items-center">
                                                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                                                        <Calendar className="h-3 w-3 text-emerald-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700">{formatDate(classItem.startTime)}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">End Date</p>
                                                <div className="flex items-center">
                                                    <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center mr-2">
                                                        <Calendar className="h-3 w-3 text-amber-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700">{formatDate(classItem.endTime) || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-5 pt-0">
                                        <Link to={`/account/classes/${classItem.id}`} className="w-full">
                                            <Button
                                                className="w-full bg-purple-600 hover:bg-purple-700 group-hover:shadow-md transition-all duration-200"
                                                variant="default"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm mb-12">
                        <div className="inline-flex items-center justify-center p-6 bg-slate-50 rounded-full mb-6 border border-slate-100">
                            <Search className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3 text-slate-800">No classes found</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Please try again with different filters or clear your current filters
                        </p>
                        <Button onClick={clearAllFilters} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 h-auto text-base">
                            <X className="h-4 w-4 mr-2" />
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
