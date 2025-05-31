import type React from "react"
import { type LoaderFunctionArgs } from "@remix-run/node"
import { Await, useAsyncValue, useLoaderData, useNavigate } from "@remix-run/react"
import {
    ArrowRight,
    Calendar,
    DollarSign,
    Music,
    Users,
    CheckCircle2,
    GraduationCap,
    BookOpen,
    Award,
    Clock,
    Info,
    Sparkles,
    X,
    AlertCircle,
} from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card"
import { cn } from "~/lib/utils"
import type { Level } from "~/lib/types/account/account"
import type { Class } from "~/lib/types/class/class"
import { fetchALevel } from "~/lib/services/level"
import { formatCurrency } from "~/lib/utils/format"
import { Suspense, useState } from "react"
import { getAuth } from "~/lib/utils/auth"
import BadgeWithPopup from "~/components/ui/badge-with-popup"
import { useAuth } from "~/lib/contexts/auth-context"
import { Skeleton } from "~/components/ui/skeleton"

function adjustColorBrightness(hex: string, factor: number): string {
    hex = hex.replace("#", "")

    let r = Number.parseInt(hex.substring(0, 2), 16)
    let g = Number.parseInt(hex.substring(2, 4), 16)
    let b = Number.parseInt(hex.substring(4, 6), 16)

    r = Math.min(255, Math.floor(r * factor))
    g = Math.min(255, Math.floor(g * factor))
    b = Math.min(255, Math.floor(b * factor))

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

type LoaderData = {
    levelData: Level & {
        classes: Array<
            Class & {
                instructor?: { userName: string }
                endTime?: string
                classDays?: string
                classTime?: string | string[]
            }
        >
        nextLevel?: {
            id: string
            themeColor: string
            description: string
            name: string
        }
        numberActiveStudentInLevel?: number
        estimateDurationInWeeks?: number
        totalPrice?: number
        requiresEntranceTest?: boolean
    }
    authData: {
        idToken?: string
        refreshToken?: string
        idTokenExpiry?: number
        role?: number
        accountId?: string
    }
}

type LevelDetails = Level & {
    classes: Array<
        Class & {
            instructor?: { userName: string }
            endTime?: string
            classDays?: string
            classTime?: string | string[]
        }
    >
    nextLevel?: {
        id: string
        themeColor: string
        description: string
        name: string
    }
    numberActiveStudentInLevel?: number
    estimateDurationInWeeks?: number
    totalPrice?: number
    requiresEntranceTest?: boolean
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    try {

        if (!params.id) {
            throw new Response("Level ID is required", { status: 400 })
        }

        const id = params.id as string;

        // const response = await fetchALevel({
        //     id: params.id,
        // });

        const promise = fetchALevel({
            id
        }).then((response) => {
            const levelPromise: Promise<LevelDetails> = response.data;

            return {
                levelPromise
            }
        });


        return {
            promise,
            id
        }

    } catch (error) {
        console.error("Error fetching level details:", error)
        throw new Response("Failed to load level details", { status: 500 })
    }
}

function AlreadyLoggedInModal({
    isOpen,
    onClose,
    accentColor,
    userRole,
}: {
    isOpen: boolean
    onClose: () => void
    accentColor: string
    userRole?: number
}) {
    const navigate = useNavigate()

    if (!isOpen) return null

    const getProfileRoute = () => {
        switch (userRole) {
            case 1: // Student
                return "/account/profile"
            case 2: // Teacher
                return "/teacher/profile"
            case 3: // Admin
                return "/admin/profile"
            default:
                return "/staff/profile"
        }
    }

    const getRoleMessage = (roleNumber?: number): string => {
        switch (roleNumber) {
            case 0: // Guest
                return "You're browsing as a guest. To enroll in classes, please sign up for a student account."
            case 1: // Student
                return "You're already logged in! You can enroll in classes directly from your profile or browse available classes here."
            case 2: // Instructor
                return "You're logged in as an Instructor. You can manage your classes and students from your profile, but class enrollment is for students only."
            case 3: // Administrator
                return "You're logged in as an Administrator. You have full system access through your admin panel, but class enrollment is for students only."
            case 4: // Staff
                return "You're logged in as Staff. You can manage classes and assist students from your profile, but class enrollment is for students only."
            default:
                return "You're logged in, but class enrollment is only available for student accounts."
        }
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor}20` }}
                        >
                            <AlertCircle className="h-5 w-5" style={{ color: accentColor }} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Already Logged In</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{getRoleMessage(userRole)}</p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => {
                                onClose()
                                navigate(getProfileRoute())
                            }}
                            style={{ backgroundColor: accentColor }}
                            className="flex-1 text-white hover:opacity-90"
                        >
                            Go to Profile
                        </Button>
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Continue Browsing
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Component for class time display with hover card
function TimeSlotHoverCard({ classTime }: { classTime?: string | string[] }) {
    if (!classTime) {
        return <span className="text-gray-500 text-sm">TBA</span>
    }

    const timeSlots = Array.isArray(classTime) ? classTime : [classTime]

    if (timeSlots.length === 1) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">{timeSlots[0]}</span>
            </div>
        )
    }

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{timeSlots[0]}</span>
                    {timeSlots.length > 1 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                            +{timeSlots.length - 1}
                        </Badge>
                    )}
                </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="top">
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        All Available Time Slots
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        {timeSlots.map((time, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="text-sm">{time}</span>
                                {index === 0 && (
                                    <Badge variant="outline" className="ml-auto text-xs">
                                        Primary
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}

export default function LevelDetailsPage() {

    const { promise, id } = useLoaderData<typeof loader>();

    return <Suspense key={id} fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
            {({ levelPromise }) => (
                <Await resolve={levelPromise}>
                    <LevelDetailsContent />
                </Await>
            )}
        </Await>
    </Suspense>

}

function LevelDetailsContent() {

    const levelData = useAsyncValue() as LevelDetails;

    const { currentAccount } = useAuth()
    const isLoggedIn = !!currentAccount
    const navigate = useNavigate()
    const [showLoginModal, setShowLoginModal] = useState(false)

    const handleRegisterClick = () => {
        if (isLoggedIn) {
            if (currentAccount?.role === 1) {
                navigate("/account/class-registering")
            } else {
                setShowLoginModal(true)
            }
        } else {
            navigate("/entrance-survey")
        }
    }

    const handleEnrollClick = () => {
        if (isLoggedIn) {
            if (currentAccount.role === 1) {
                navigate("/account/class-registering")
            } else {
                setShowLoginModal(true)
            }
        } else {
            navigate("/entrance-survey")
        }
    }

    // Table view only, no state needed for view mode
    const formattedPricePerSlot = formatCurrency(levelData.pricePerSlot)
    const formattedTotalPrice = formatCurrency(levelData.totalPrice || levelData.pricePerSlot * levelData.totalSlots)
    const calculateDuration = () => {
        const weeks = levelData.totalSlots / levelData.slotPerWeek
        const months = weeks / 4.33
        return formatDurationInMonths(months)
    }

    const formatDurationInMonths = (months: any) => {
        const wholeMonths = Math.floor(months)
        const partialMonth = months - wholeMonths

        if (partialMonth === 0) {
            return `${wholeMonths} ${wholeMonths === 1 ? "month" : "months"}`
        } else if (partialMonth < 0.25) {
            return `${wholeMonths} ${wholeMonths === 1 ? "month" : "months"}`
        } else if (partialMonth < 0.75) {
            return `${wholeMonths} and a half ${wholeMonths === 1 ? "month" : "months"}`
        } else {
            return `~ ${wholeMonths + 1} ${wholeMonths + 1 === 1 ? "month" : "months"}`
        }
    }

    const estimatedDuration = calculateDuration()

    const getClassStatus = (statusCode: number): string => {
        switch (statusCode) {
            case 0:
                return "Not Started"
            case 1:
                return "Ongoing"
            case 2:
                return "Finished"
            default:
                return "Unknown"
        }
    }

    // Check if class is enrollable
    const isClassEnrollable = (cls: Class & { instructor?: { userName: string } }): boolean => {
        return cls.status === 0 && cls.studentNumber < cls.capacity
    }

    // Format date for display
    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString || dateString === "0001-01-01") return "TBA"
        try {
            return new Date(dateString).toLocaleDateString()
        } catch (e) {
            return "TBA"
        }
    }

    // Get enrollment status text and color
    const getEnrollmentStatus = (cls: Class & { instructor?: { userName: string } }) => {
        if (isClassEnrollable(cls)) {
            return {
                text: "Open for Enrollment",
                color: adjustColorBrightness(levelData.themeColor || "#21c44d", 0.7),
                enrollable: true,
            }
        } else if (cls.status === 1) {
            return {
                text: "In Progress",
                color: "#f59e0b", // Amber
                enrollable: false,
            }
        } else if (cls.status === 2) {
            return {
                text: "Completed",
                color: "#6366f1", // Indigo
                enrollable: false,
            }
        } else if (cls.status === 3) {
            return {
                text: "Completed",
                color: "#6366f1", // Indigo
                enrollable: false,
            }
        } else if (cls.status === 4) {
            return {
                text: "Cancelled",
                color: "#ef4444", // Red
                enrollable: false,
            }
        } else {
            return {
                text: "Class Full",
                color: "#9ca3af", // Gray
                enrollable: false,
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Already Logged In Modal */}
            <AlreadyLoggedInModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                accentColor={levelData.themeColor || "#21c44d"}
                userRole={currentAccount?.role}
            />

            {/* Hero Section with Piano Background */}
            <div className="relative h-[400px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        filter: "brightness(0.7)",
                    }}
                ></div>
                <div
                    className="absolute inset-0 bg-gradient-to-r"
                    style={{
                        backgroundImage: `linear-gradient(to right, ${adjustColorBrightness(levelData.themeColor || "#21c44d", 0.7)}CC, ${adjustColorBrightness(levelData.themeColor || "#21c44d", 0.7)}99)`,
                    }}
                ></div>
                <div className="relative container mx-auto h-full flex items-center z-10 px-4">
                    <div className="flex items-center justify-between w-full">
                        {/* Left side content */}
                        <div className="max-w-3xl text-white flex-1">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                                <Music size={16} className="text-green-300" />
                                <span className="text-sm font-medium">Piano Level</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{levelData.name}</h1>

                            <p className="text-lg text-gray-100 mb-6 max-w-2xl">{levelData.description}</p>

                            <BadgeWithPopup
                                skills={levelData.skillsEarned}
                                visibleCount={4}
                                className="mb-16 max-h-24"
                                themeColor={levelData.themeColor || "#21c44d"}
                            />
                        </div>

                        {/* Right side piano illustration */}
                        <div className="hidden lg:flex flex-1 justify-end items-center relative">
                            <div className="relative">
                                {/* Floating musical notes */}
                                <div
                                    className="absolute -top-8 -left-4 animate-bounce"
                                    style={{ animationDelay: "0s", animationDuration: "3s" }}
                                >
                                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <Music className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div
                                    className="absolute -top-12 left-12 animate-bounce"
                                    style={{ animationDelay: "1s", animationDuration: "3s" }}
                                >
                                    <div className="w-4 h-4 bg-white/15 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute -top-6 left-24 animate-bounce"
                                    style={{ animationDelay: "2s", animationDuration: "3s" }}
                                >
                                    <div className="w-5 h-5 bg-white/25 rounded-full flex items-center justify-center">
                                        <Music className="w-3 h-3 text-white" />
                                    </div>
                                </div>

                                {/* Piano keyboard */}
                                <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-2xl">
                                    <div className="flex items-end">
                                        {/* White keys */}
                                        {Array.from({ length: 14 }, (_, i) => (
                                            <div
                                                key={`white-${i}`}
                                                className="w-8 h-32 bg-white border border-gray-200 rounded-b-md shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
                                                style={{
                                                    marginRight: i === 6 ? "4px" : "1px",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Black keys */}
                                    <div className="absolute top-6 left-6 flex">
                                        {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((position, i) => (
                                            <div
                                                key={`black-${i}`}
                                                className="w-5 h-20 bg-gray-900 rounded-b-md shadow-lg hover:bg-gray-800 transition-colors cursor-pointer"
                                                style={{
                                                    position: "absolute",
                                                    left: `${position * 32 + 20}px`,
                                                    zIndex: 10,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Decorative elements */}
                                <div className="absolute -bottom-4 -right-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
                                <div className="absolute -top-2 -right-4 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4 max-w-7xl">
                {/* Stats Cards */}
                <div className="mb-6">
                    <SectionHeader
                        icon={<Info className="h-6 w-6" style={{ color: levelData.themeColor || "#21c44d" }} />}
                        title="Program Information"
                        accentColor={levelData.themeColor || "#21c44d"}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-12">
                    {/* Existing three cards remain the same */}
                    <StatsCard
                        icon={<Calendar className="h-10 w-10 p-2 rounded-full bg-green-100 text-green-600" />}
                        title="Program Schedule"
                        stats={[
                            { label: "Total Lessons", value: levelData.totalSlots },
                            { label: "Lessons Per Week", value: levelData.slotPerWeek },
                            { label: "Program Duration", value: `${estimatedDuration}` },
                        ]}
                        accentColor={levelData.themeColor || "#21c44d"}
                    />

                    <StatsCard
                        icon={<DollarSign className="h-10 w-10 p-2 rounded-full bg-green-100 text-green-600" />}
                        title="Tuition Details"
                        stats={[
                            { label: "Price Per Lesson", value: formattedPricePerSlot },
                            { label: "Total Tuition", value: formattedTotalPrice, highlight: true },
                        ]}
                        footer="Includes all lesson materials and access to practice rooms."
                        accentColor={levelData.themeColor || "#21c44d"}
                    />

                    <StatsCard
                        icon={<Users className="h-10 w-10 p-2 rounded-full bg-green-100 text-green-600" />}
                        title="Enrollment Status"
                        stats={[
                            { label: "Current Students", value: levelData.numberActiveStudentInLevel || 0 },
                            {
                                label: "Available Classes",
                                value: levelData.classes.filter((c: Class) => c.status === 0 && c.isPublic).length,
                            },
                        ]}
                        accentColor={levelData.themeColor || "#21c44d"}
                    />

                    {/* New Entrance Test Card */}
                    <StatsCard
                        icon={
                            levelData.requiresEntranceTest ? (
                                <AlertCircle className="h-10 w-10 p-2 rounded-full bg-amber-100 text-amber-600" />
                            ) : (
                                <CheckCircle2 className="h-10 w-10 p-2 rounded-full bg-green-100 text-green-600" />
                            )
                        }
                        title="Entrance Requirements"
                        stats={[
                            {
                                label: 'Entrance Requirements',
                                value: levelData.requiresEntranceTest ? <Badge variant={'outline'} className="text-red-600 bg-red-500/20">Required</Badge>
                                    : <Badge variant={'outline'} className="text-green-600 bg-green-500/20">Not Required</Badge>,
                                highlight: levelData.requiresEntranceTest,
                            },
                        ]}
                        footer={
                            levelData.requiresEntranceTest
                                ? "You'll need to pass an entrance test before enrollment."
                                : "No entrance test required for this level."
                        }
                        accentColor={levelData.requiresEntranceTest ? "#f59e0b" : levelData.themeColor || "#21c44d"}
                    />
                </div>

                {/* What You'll Learn Section */}
                <div className="mb-16">
                    <SectionHeader
                        icon={<GraduationCap className="h-6 w-6" style={{ color: levelData.themeColor || "#21c44d" }} />}
                        title="Skills You'll Master"
                        accentColor={levelData.themeColor || "#21c44d"}
                    />

                    <Card className="overflow-hidden border-0 shadow-lg">
                        <div className="h-1" style={{ backgroundColor: levelData.themeColor || "#21c44d" }}></div>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {levelData.skillsEarned
                                    .slice(0, Math.ceil(levelData.skillsEarned.length / 2))
                                    .map((skill: string, index: number) => (
                                        <LearningItem
                                            key={index}
                                            icon={<CheckCircle2 className="h-5 w-5" style={{ color: levelData.themeColor || "#21c44d" }} />}
                                            text={skill}
                                            accentColor={levelData.themeColor || "#21c44d"}
                                        />
                                    ))}

                                {levelData.skillsEarned
                                    .slice(Math.ceil(levelData.skillsEarned.length / 2))
                                    .map((skill: string, index: number) => (
                                        <LearningItem
                                            key={index}
                                            icon={<CheckCircle2 className="h-5 w-5" style={{ color: levelData.themeColor || "#21c44d" }} />}
                                            text={skill}
                                            accentColor={levelData.themeColor || "#21c44d"}
                                        />
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Program Journey */}
                {levelData.nextLevel && (
                    <div className="mb-16">
                        <SectionHeader
                            icon={<Award className="h-6 w-6" style={{ color: levelData.themeColor || "#21c44d" }} />}
                            title="Your Piano Journey"
                            accentColor={levelData.themeColor || "#21c44d"}
                        />

                        <div className="relative">
                            <div
                                className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-0"
                                style={{ backgroundColor: `${levelData.themeColor || "#21c44d"}40` }}
                            ></div>

                            <div className="relative z-10 space-y-12 py-4">
                                {/* Current Level */}
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    <div
                                        className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg flex-shrink-0 md:mt-4"
                                        style={{ backgroundColor: adjustColorBrightness(levelData.themeColor || "#21c44d", 0.7) }}
                                    >
                                        <Music className="h-6 w-6 text-white" />
                                    </div>
                                    <Card className="flex-grow w-full md:w-auto border-0 shadow-lg">
                                        <div className="h-1" style={{ backgroundColor: levelData.themeColor || "#21c44d" }}></div>
                                        <CardHeader>
                                            <div className="flex items-center">
                                                <Badge className="mr-2" style={{ backgroundColor: levelData.themeColor || "#21c44d" }}>
                                                    Current Level
                                                </Badge>
                                                <CardTitle>{levelData.name}</CardTitle>
                                            </div>
                                            <CardDescription>{levelData.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {levelData.skillsEarned.slice(0, 3).map((skill: string, index: number) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="text-sm"
                                                        style={{
                                                            borderColor: levelData.themeColor || "#21c44d",
                                                            color: levelData.themeColor || "#21c44d",
                                                        }}
                                                    >
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {levelData.skillsEarned.length > 3 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-sm"
                                                        style={{
                                                            borderColor: levelData.themeColor || "#21c44d",
                                                            color: levelData.themeColor || "#21c44d",
                                                        }}
                                                    >
                                                        +{levelData.skillsEarned.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-gray-700" />
                                                    <span>{estimatedDuration} </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>{formattedTotalPrice}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Next Level */}
                                {levelData.nextLevel && (
                                    <div className="flex flex-col md:flex-row items-start gap-6">
                                        <div
                                            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg flex-shrink-0 md:mt-4 bg-white dark:bg-gray-800"
                                            style={{ border: `2px dashed ${levelData.nextLevel.themeColor || "#7bc421"}` }}
                                        >
                                            <Music className="h-6 w-6" style={{ color: levelData.nextLevel.themeColor || "#7bc421" }} />
                                        </div>
                                        <Card className="flex-grow w-full md:w-auto border-0 shadow-lg opacity-90 hover:opacity-100 transition-all">
                                            <div
                                                className="h-1"
                                                style={{ backgroundColor: levelData.nextLevel.themeColor || "#7bc421" }}
                                            ></div>
                                            <CardHeader>
                                                <div className="flex items-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="mr-2"
                                                        style={{ color: levelData.nextLevel.themeColor || "#7bc421" }}
                                                    >
                                                        Next Level
                                                    </Badge>
                                                    <CardTitle>{levelData.nextLevel?.name}</CardTitle>
                                                </div>
                                                <CardDescription>{levelData.nextLevel.description}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="border-t pt-4">
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    style={{
                                                        borderColor: levelData.nextLevel.themeColor || "#7bc421",
                                                        color: levelData.nextLevel.themeColor || "#7bc421",
                                                    }}
                                                    onClick={() => {
                                                        if (levelData.nextLevel?.id) {
                                                            navigate(`/levels/${levelData.nextLevel.id}`)
                                                        }
                                                    }}
                                                >
                                                    View Next Level <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Available Classes Section */}
                {levelData.classes && levelData.classes.length > 0 && (
                    <div className="mb-16">
                        <SectionHeader
                            icon={<BookOpen className="h-6 w-6" style={{ color: levelData.themeColor || "#21c44d" }} />}
                            title="Available Classes"
                            accentColor={levelData.themeColor || "#21c44d"}
                            className="mb-6"
                        />

                        <Card className="border-0 shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-4 px-6 font-semibold">Class Name</th>
                                            <th className="text-left py-4 px-6 font-semibold">Students</th>
                                            <th className="text-left py-4 px-6 font-semibold">Start Date</th>
                                            <th className="text-left py-4 px-6 font-semibold">End Date</th>
                                            <th className="text-left py-4 px-6 font-semibold">Class Days</th>
                                            <th className="text-left py-4 px-6 font-semibold">Class Time</th>
                                            <th className="text-left py-4 px-6 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {levelData.classes
                                            .filter((cls) => cls.status === 0 && cls.isPublic)
                                            .map((cls) => {
                                                const enrollmentStatus = getEnrollmentStatus(cls)

                                                return (
                                                    <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="font-medium">{cls.name}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {cls.instructor?.userName || "Instructor TBA"}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="font-medium">{`${cls.studentNumber}/${cls.capacity}`}</div>
                                                            <div className="w-24 mt-1">
                                                                <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                                                                    <div
                                                                        style={{
                                                                            width: `${(cls.studentNumber / cls.capacity) * 100}%`,
                                                                            backgroundColor: enrollmentStatus.color,
                                                                        }}
                                                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">{formatDate(cls.startTime)}</td>
                                                        <td className="py-4 px-6">{formatDate(cls.endTime)}</td>
                                                        <td className="py-4 px-6">{cls.classDays || "TBA"}</td>
                                                        <td className="py-4 px-6">
                                                            <TimeSlotHoverCard classTime={cls.classTime} />
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {(() => {
                                                                const enrollmentStatus = getEnrollmentStatus(cls)

                                                                // For learners (role 1), show "Enroll Now" button if enrollable, otherwise show badge
                                                                if (currentAccount?.role === 1) {
                                                                    if (enrollmentStatus.enrollable) {
                                                                        return (
                                                                            <Button
                                                                                size="sm"
                                                                                style={{ backgroundColor: enrollmentStatus.color }}
                                                                                onClick={() => handleEnrollClick()}
                                                                            >
                                                                                Enroll Now
                                                                            </Button>
                                                                        )
                                                                    } else {
                                                                        return (
                                                                            <Badge style={{ backgroundColor: enrollmentStatus.color }}>
                                                                                {enrollmentStatus.text}
                                                                            </Badge>
                                                                        )
                                                                    }
                                                                }

                                                                // For all other users (guests, teachers, admin, staff), show badge
                                                                return (
                                                                    <Badge style={{ backgroundColor: enrollmentStatus.color }}>
                                                                        {enrollmentStatus.text}
                                                                    </Badge>
                                                                )
                                                            })()}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                        {levelData.classes.filter((cls) => cls.status === 0).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No classes are currently available for enrollment.</p>
                                <p className="text-sm mt-2">Please check back later or contact us for more information.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Requirements Section */}
                <div className="mb-16">
                    <SectionHeader
                        icon={<Info className="h-6 w-6" style={{ color: levelData.themeColor || "#21c44d" }} />}
                        title="Level Requirements"
                        accentColor={levelData.themeColor || "#21c44d"}
                    />

                    <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="h-1" style={{ backgroundColor: levelData.themeColor || "#21c44d" }}></div>
                        <CardContent className="p-8">
                            {/* Entrance Test Alert (if required) */}
                            {levelData.requiresEntranceTest && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-800 mb-1">Entrance Test Required</h4>
                                            <p className="text-amber-700 text-sm">
                                                This level requires passing an entrance test before enrollment. The test evaluates your current
                                                piano skills and music theory knowledge to ensure you're ready for this level's curriculum.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <RequirementCard
                                    title="Minimum GPA"
                                    value={levelData.minimumGPA}
                                    icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
                                    description="Minimum grade point average required to pass this level"
                                    accentColor={levelData.themeColor || "#21c44d"}
                                />

                                <RequirementCard
                                    title="Theoretical Score"
                                    value={levelData.minimumTheoreticalScore}
                                    icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                                    description="Minimum score required on theoretical assessments"
                                    accentColor={levelData.themeColor || "#21c44d"}
                                />

                                <RequirementCard
                                    title="Practical Score"
                                    value={levelData.minimumPracticalScore}
                                    icon={<Music className="h-5 w-5 text-purple-500" />}
                                    description="Minimum score required on practical performance assessments"
                                    accentColor={levelData.themeColor || "#21c44d"}
                                />
                            </div>

                            {/* Additional entrance test details */}
                            {levelData.requiresEntranceTest && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        Entrance Test Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span>Test Duration: 30-45 minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-gray-500" />
                                            <span>Includes theory and practical components</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-500" />
                                            <span>One-on-one assessment with instructor</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-gray-500" />
                                            <span>Results available within 24 hours</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom CTA */}
                <div className="relative overflow-hidden rounded-2xl mb-8">
                    <div
                        className="absolute inset-0 bg-gradient-to-r"
                        style={{
                            backgroundImage: `linear-gradient(to right, ${adjustColorBrightness(levelData.themeColor || "#21c44d", 0.7)}CC, ${adjustColorBrightness(
                                levelData.themeColor || "#21c44d",
                                0.7,
                            )}99)`,
                        }}
                    ></div>
                    <div className="relative z-10 p-12 text-center text-white">
                        <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Piano Journey?</h2>
                        <p className="text-lg mb-8 max-w-2xl mx-auto">
                            Join our piano teaching center and develop your musical skills with expert guidance and a structured
                            curriculum designed for your success.
                            {levelData.requiresEntranceTest && (
                                <span className="block mt-2 text-yellow-200">
                                    Note: This level requires passing an entrance test before enrollment.
                                </span>
                            )}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                className="bg-white hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                                style={{ color: levelData.themeColor || "#21c44d" }}
                                onClick={handleRegisterClick}
                            >
                                {isLoggedIn ? "Go to Profile" : levelData.requiresEntranceTest ? "Take Entrance Test" : "Register"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Component for stats cards
type StatItem = {
    label: React.ReactNode;
    value: React.ReactNode;
    highlight?: boolean
}

function StatsCard({
    icon,
    title,
    stats,
    footer,
    accentColor,
}: {
    icon: React.ReactNode
    title: string
    stats: StatItem[]
    footer?: string
    accentColor: string
}) {
    return (
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    {icon}
                    <CardTitle>{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {stats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">{stat.label}:</span>
                        <span
                            className={cn(
                                stat.highlight ? "text-xl font-bold" : "font-medium",
                                stat.highlight ? { color: accentColor } : "",
                            )}
                        >
                            {stat.value}
                        </span>
                    </div>
                ))}
                {footer && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{footer}</p>}
            </CardContent>
        </Card>
    )
}

// Component for section headers
function SectionHeader({
    icon,
    title,
    accentColor,
    className,
}: {
    icon: React.ReactNode
    title: string
    accentColor: string
    className?: string
}) {
    return (
        <div className={cn("flex items-center gap-2 mb-6", className)}>
            <div className="h-10 w-1 rounded-full" style={{ backgroundColor: accentColor }}></div>
            {icon}
            <h2 className="text-2xl font-bold">{title}</h2>
        </div>
    )
}

// Component for learning items
function LearningItem({
    icon,
    text,
    accentColor,
}: {
    icon: React.ReactNode
    text: string
    accentColor: string
}) {
    return (
        <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div
                className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-opacity-10"
                style={{ backgroundColor: `${accentColor}20` }}
            >
                {icon}
            </div>
            <p className="mt-1.5">{text}</p>
        </div>
    )
}

// Component for requirement cards
function RequirementCard({
    title,
    value,
    icon,
    description,
    accentColor,
}: {
    title: string
    value: number
    icon: React.ReactNode
    description: string
    accentColor: string
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                >
                    {icon}
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ color: accentColor }}>
                {value}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    )
}


function LoadingSkeleton() {
    return <div className="px-10">
        <Skeleton className="w-full h-[200px]" />
        <br />
        <Skeleton className="w-full h-[500px]" />
    </div>
}