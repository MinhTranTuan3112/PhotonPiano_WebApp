import { json, LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ArrowUpDown, Eye, Filter, Music, Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import Image from "~/components/ui/image";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { fetchStudentClasses } from "~/lib/services/class";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function loader({ request } : LoaderFunctionArgs) {
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
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filteredClasses, setFilteredClasses] = React.useState(classes)
    const [sortOption, setSortOption] = React.useState("name-asc")
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    //Filter state
    const [levelFilters, setLevelFilter] = React.useState<string[]>([])
    const [statusFilters, setStatusFilter] = React.useState<string[]>([])

    // Get unique values for filters
    const levels = Array.from(new Set(classes.map((item) => item.level?.name || ""))).sort()
    const statuses = Array.from(new Set(classes.map((item) => {
        switch (item.status) {
            case 1: return "Đang học"
            case 2: return "Hoàn thành"
            case 0: return "Chưa bắt đầu"
            default: return "Không xác định"
        }
    })))

    React.useEffect(() => {
        let result = classes

        if (searchTerm) {
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.instructorName.toLowerCase().includes(searchTerm.toLowerCase()),
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
            case 1: return "Đang học"
            case 2: return "Hoàn thành"
            case 0: return "Chưa bắt đầu"
            default: return "Không xác định"
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
                return "bg-blue-500"
            case 2:
                return "bg-green-500"
            case 0:
                return "bg-amber-500"
            default:
                return "bg-gray-500"
        }
    }

    // Update the getLevelColor function to work with numeric levels
    const getLevelColor = (level: string) => {
        const levelNum = parseInt(level.split(" ").pop() || "1")
        switch (levelNum) {
            case 1:
                return "text-emerald-500"
            case 2:
                return "text-blue-500"
            case 3:
                return "text-amber-500"
            case 4:
                return "text-purple-500"
            default:
                return "text-gray-500"
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date)
    }

    // Get upcoming classes (classes with next lessons)
    const upcomingClasses = classes
        .filter(c => c.status !== 2)
        .filter(c => c.slots && c.slots.length > 0)
        .map(c => {
            const nextSlot = c.slots
                .filter((slot: any) => slot.status === 0 || slot.status === 1)
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

            return {
                ...c,
                nextLesson: nextSlot ? `${formatDate(nextSlot.date)}, ${getShiftName(nextSlot.shift)}` : null
            }
        })
        .filter(c => c.nextLesson)
        .slice(0, 2)

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

    return (
        <div className="min-h-screen bg-white">
            {/*Header*/}
            <div className="bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-100 border-b border-slate-100">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center p-2 bg-white/50 backdrop-blur-sm rounded-full mb-4 shadow-sm">
                            <Music className="h-6 w-6 text-indigo-600 mr-2" />
                            <span className="text-indigo-700 font-medium">PhotonPiano</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">Danh sách lớp học</h1>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            Quản lý và theo dõi tiến độ các khóa học piano của bạn
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search and Filter Bar */}
                <Card className="mb-8 border border-slate-200 shadow-md rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-group flex-1 md:flex-grow md:max-w-full">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Search className="h-4 w-4" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    className="w-full pl-10 pr-10 py-2 border-plate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

                            <div className="flex gap-2">
                                {/*Sort Dropdown*/}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <ArrowUpDown className="h-4 w-4" />
                                            <span className="hidden sm:inline">Sắp xếp</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                                                Tên lớp (A-Z)
                                                {sortOption === "name-asc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("progress-desc")}>
                                                Tiến độ (Cao-Thấp)
                                                {sortOption === "progress-desc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("progress-asc")}>
                                                Tiến độ (Thấp-Cao)
                                                {sortOption === "progress-asc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("date-desc")}>
                                                Ngày bắt đầu (Mới nhất)
                                                {sortOption === "date-desc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortOption("date-asc")}>
                                                Ngày bắt đầu (Cũ nhất)
                                                {sortOption === "date-asc" && <span className="ml-auto">✓</span>}
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Filter Sheet */}
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <Filter className="h-4 w-4" />
                                            <span className="hidden sm:inline">Bộ lọc</span>
                                            {hasActiveFilters && (
                                                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-indigo-600">
                                                    <span className="text-xs">
                                                        {levelFilters.length + statusFilters.length + (searchTerm ? 1 : 0)}
                                                    </span>
                                                </Badge>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent>
                                        <SheetHeader>
                                            <SheetTitle>Bộ lọc</SheetTitle>
                                            <SheetDescription>Lọc các lớp học theo tiêu chí</SheetDescription>
                                        </SheetHeader>
                                        <div className="py-6 space-y-6">
                                            {/* Level Filters */}
                                            <section className="space-y-3">
                                                <h3 className="text-sm font-medium">Level Lớp</h3>
                                                <div className="space-y-2">
                                                    {levels.map((level) => (
                                                        <div className="flex items-center space-x-2" key={level}>
                                                            <Checkbox
                                                                id={`level-${level}`}
                                                                checked={levelFilters.includes(level)}
                                                                onCheckedChange={() => toggleFilter(level, "level")}
                                                            />
                                                            <Label htmlFor={`level-${level}`} className="flex items-center">
                                                                <div className={`w-2 h-2 rounded-full mr-2 ${getLevelColor(level)}`}></div>
                                                                {level}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* Status Filters */}
                                            <section className="space-y-3">
                                                <h3 className="text-sm font-medium">Trạng thái</h3>
                                                <div className="space-y-2">
                                                    {statuses.map((status) => (
                                                        <div key={status} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`status-${status}`}
                                                                checked={statusFilters.includes(status)}
                                                                onCheckedChange={() => toggleFilter(status, "status")}
                                                            />
                                                            <Label htmlFor={`status-${status}`} className="flex items-center">
                                                                <Badge className={`mr-2 ${getStatusColor(
                                                                    status === "Đang học" ? 1 :
                                                                        status === "Hoàn thành" ? 2 :
                                                                            status === "Chưa bắt đầu" ? 0 : 3
                                                                )}`} variant="outline">
                                                                    {status}
                                                                </Badge>
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                        <SheetFooter className="flex flex-row gap-3 sm:justify-between">
                                            <Button variant="outline" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                                                Xóa bộ lọc
                                            </Button>
                                            <SheetClose asChild>
                                                <Button>Áp dụng</Button>
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
                                        <span>Tìm kiếm: {searchTerm}</span>
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
                                        <span>Trạng thái: {status}</span>
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
                                        Xóa tất cả
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Classes Section */}
                {upcomingClasses.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center mb-6">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                <Sparkles className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800">Buổi học sắp tới</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingClasses.map((classItem) => (
                                <Card
                                    key={`upcoming-${classItem.id}`}
                                    className="border border-slate-200 shadow-md rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="flex items-center p-5">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mr-4 flex-shrink-0 transition-colors duration-300 group-hover:from-indigo-200 group-hover:to-indigo-300 shadow-sm">
                                            <Music className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-slate-800">{classItem.name}</h3>
                                            <p className="text-sm text-slate-500">{classItem.nextLesson}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-shrink-0 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-300 rounded-lg"
                                            onClick={() => window.location.href = `/class_list/${classItem.id}`}
                                        >
                                            Chi tiết
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className="mb-4 flex justify-between items-center">
                    <p className="text-muted-foreground text-sm">
                        Hiển thị {filteredClasses.length} lớp học{" "}
                        {filteredClasses.length !== classes.length && `(trong tổng số ${classes.length})`}
                    </p>
                </div>

                {/* Class Cards */}
                {filteredClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {filteredClasses.map((classItem, index) => {
                            const isHovered = hoveredIndex === index
                            const progress = calculateProgress(classItem)
                            return (
                                <div
                                    key={classItem.id}
                                    className="relative group block p-2 h-full w-full"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <AnimatePresence>
                                        {isHovered && (
                                            <motion.span
                                                className="absolute inset-0 h-full w-full bg-indigo-50/80 dark:bg-slate-800/[0.8] block rounded-xl"
                                                layoutId="hoverBackground"
                                                initial={{ opacity: 0 }}
                                                animate={{
                                                    opacity: 1,
                                                    transition: { duration: 0.15 },
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    transition: { duration: 0.15, delay: 0.2 },
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                    <Card className="overflow-hidden border border-slate-200 shadow-md hover:shadow-xl rounded-xl hover:border-indigo-200 transition-all duration-300 relative z-10">
                                        <div className="relative h-48 overflow-hidden">
                                            <Image
                                                src="/placeholder.svg?height=200&width=300"
                                                alt={classItem.name}
                                                className={`object-cover w-full h-full transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                            <Badge className={`absolute top-3 right-3 ${getStatusColor(classItem.status)} shadow-md`}>
                                                {getStatusText(classItem.status)}
                                            </Badge>
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="text-white font-bold text-xl mb-1 drop-shadow-md">{classItem.name}</h3>
                                                <div className="flex items-center text-white/90">
                                                    <Music className="h-3 w-3 mr-1" />
                                                    <span className="text-xs drop-shadow-md">{classItem.level?.name || "Không xác định"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <CardContent className="pt-5 pb-3">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className={`w-3 h-3 rounded-full mr-2 ${getLevelColor(classItem.level?.name || "Level 1")}`}></div>
                                                        <span className="text-xs font-medium text-slate-600">Level:</span>
                                                    </div>
                                                    <span className={`text-sm font-semibold ${getLevelColor(classItem.level?.name || "Level 1")}`}>
                                                        {classItem.level?.name || "Không xác định"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-600">Giáo viên:</span>
                                                    <span className="text-sm text-slate-800">{classItem.instructorName}</span>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-xs font-medium text-slate-600">Tiến độ:</span>
                                                        <span className="text-xs font-semibold text-slate-700">{progress}%</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full rounded-full ${progress === 100
                                                                ? "bg-gradient-to-r from-green-400 to-green-500"
                                                                : "bg-gradient-to-r from-indigo-400 to-indigo-600"
                                                                }`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0 pb-5">
                                            <Link to={`/account/class_list/${classItem.id}`} className="w-full">
                                                <Button
                                                    className={`w-full transition-all duration-300 rounded-lg ${isHovered
                                                        ? "bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-200"
                                                        : "bg-indigo-600 shadow-md"
                                                        } hover:bg-indigo-700 text-white`}
                                                >
                                                    <Eye className={`h-4 w-4 mr-2 ${isHovered ? "animate-pulse" : ""}`} />
                                                    Xem chi tiết
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-md mb-12">
                        <div className="inline-flex items-center justify-center p-6 bg-slate-50 rounded-full mb-6 border border-slate-100">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3 text-slate-800">Không tìm thấy lớp học nào</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Vui lòng thử lại với các bộ lọc khác hoặc xóa các bộ lọc hiện tại
                        </p>
                        <Button onClick={clearAllFilters} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                            <X className="h-4 w-4 mr-2" />
                            Xóa tất cả bộ lọc
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

