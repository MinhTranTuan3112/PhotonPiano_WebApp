import type React from "react"
import { useEffect } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { requireAuth } from "~/lib/utils/auth"
import { fetchPayTuition, fetchTuition } from "~/lib/services/tuition"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useState } from "react"
import { redirect, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react"
import { PaymentStatus, PaymentStatusText, type Tuition } from "~/lib/types/tuition/tuition"
import {
    Download,
    Filter,
    User,
    GraduationCap,
    CreditCard,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    BookOpen,
    Award,
    RefreshCw,
} from "lucide-react"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { PaymentStatusBadge } from "~/components/transactions/transaction-table/columns"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { Role } from "~/lib/types/account/account"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { toastWarning } from "~/lib/utils/toast-utils"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { TuitionDateRangePicker } from "~/components/date/date-range"

// Define proper types for date range
type DateRange = {
    from: Date | undefined
    to: Date | undefined
}

export function formatDate(dateString: string | undefined) {
    if (!dateString) return ""

    const datePart = dateString.split(" ")[0].split("T")[0]
    if (datePart && datePart.includes("-")) {
        // Convert from YYYY-MM-DD to DD-MM-YYYY
        const [year, month, day] = datePart.split("-")
        return `${day}-${month}-${year}`
    }
}

function calculateTotalDebt(tuition: Tuition[]): number {
    return tuition
        .filter((fee) => fee.paymentStatus !== PaymentStatus.Successed)
        .reduce((sum, fee) => sum + fee.amount + fee.fee, 0)
}

function filterTuitions(
    tuitions: Tuition[],
    filters: {
        studentClassIds: string[]
        dateRange: DateRange
        paymentStatuses: number[]
    },
): Tuition[] {
    return tuitions.filter((tuition) => {
        // Filter by student class IDs
        if (filters.studentClassIds.length > 0) {
            if (!filters.studentClassIds.includes(tuition.studentClass.id)) {
                return false
            }
        }

        // Filter by date range
        if (filters.dateRange.from || filters.dateRange.to) {
            const tuitionDate = new Date(tuition.deadline || Date.now())

            if (filters.dateRange.from && tuitionDate < filters.dateRange.from) {
                return false
            }

            if (filters.dateRange.to && tuitionDate > filters.dateRange.to) {
                return false
            }
        }

        // Filter by payment status
        if (filters.paymentStatuses.length > 0) {
            if (!filters.paymentStatuses.includes(tuition.paymentStatus)) {
                return false
            }
        }

        return true
    })
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Student) {
            return redirect("/")
        }

        // Fetch ALL tuitions without any filters
        const response = await fetchTuition({
            idToken,
            studentClassIds: [], // No filters
            startTime: null,
            endTime: null,
            paymentStatuses: [], // No filters
        })
        let tuition: Tuition[] = response.data

        console.log("Fetched all tuition data:", tuition.length, "items")
        console.log(
            "Payment statuses in data:",
            tuition.map((t) => ({ id: t.id, status: t.paymentStatus, statusText: PaymentStatusText[t.paymentStatus] })),
        )

        tuition = tuition.sort((a, b) => a.paymentStatus - b.paymentStatus)

        return { tuition, idToken, role }
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)
        throw new Response(message, { status })
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Student) {
            return redirect("/")
        }

        const url = new URL(request.url)
        const baseUrl = `${url.protocol}//${url.host}`
        const returnUrl = `${baseUrl}/account/tuition`
        const formData = await request.formData()
        const tuitionId = formData.get("tuitionId") as string

        const response = await fetchPayTuition(tuitionId, returnUrl, idToken)

        if (response.status === 200) {
            const data = await response.data
            const paymentUrl = data.url as string
            return redirect(paymentUrl)
        }

        return Response.json(
            {
                success: false,
                error: "Payment failed!",
            },
            {
                status: 400,
            },
        )
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)

        return Response.json(
            {
                success: false,
                error: message,
            },
            {
                status,
            },
        )
    }
}

function PaymentStatusIcon({ status }: { status: PaymentStatus }) {
    switch (status) {
        case PaymentStatus.Pending:
            return <Clock className="w-5 h-5 text-amber-600" />
        case PaymentStatus.Successed:
            return <CheckCircle2 className="w-5 h-5 text-green-600" />
        case PaymentStatus.Failed:
            return <XCircle className="w-5 h-5 text-red-600" />
        case PaymentStatus.Canceled:
            return <XCircle className="w-5 h-5 text-gray-600" />
        default:
            return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
}

export default function TuitionPage() {
    const { tuition: allTuition, role } = useLoaderData<typeof loader>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Tuition | null>(null)

    const fetcher = useFetcher<typeof action>()

    // Applied filters (these are the ones actually filtering the data)
    const [appliedFilters, setAppliedFilters] = useState({
        studentClassIds: searchParams.getAll("student-class-ids"),
        dateRange: {
            from: searchParams.get("start-date") ? new Date(searchParams.get("start-date")!) : undefined,
            to: searchParams.get("end-date") ? new Date(searchParams.get("end-date")!) : undefined,
        } as DateRange,
        paymentStatuses: searchParams.getAll("payment-statuses").map(Number),
    })

    // Draft filters (these are the ones being edited in the modal)
    const [draftFilters, setDraftFilters] = useState(appliedFilters)

    // Apply client-side filtering using appliedFilters
    const filteredTuition = filterTuitions(allTuition, appliedFilters)

    const totalDebt = calculateTotalDebt(filteredTuition)
    const hasPendingPayments = filteredTuition.some((t) => t.paymentStatus === PaymentStatus.Pending)

    console.log("All tuitions:", allTuition.length)
    console.log("Filtered tuitions:", filteredTuition.length)
    console.log("Applied filters:", appliedFilters)

    // Check if any filters are applied
    const hasActiveFilters =
        appliedFilters.paymentStatuses.length > 0 ||
        appliedFilters.dateRange.from ||
        appliedFilters.dateRange.to ||
        appliedFilters.studentClassIds.length > 0

    // Update draft filters when opening the modal
    useEffect(() => {
        if (isFilterModalOpen) {
            setDraftFilters(appliedFilters)
        }
    }, [isFilterModalOpen, appliedFilters])

    // Apply the draft filters when form is submitted
    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        // Apply the draft filters
        setAppliedFilters(draftFilters)

        // Update URL params for bookmarking/sharing
        const newSearchParams = new URLSearchParams()
        draftFilters.studentClassIds.forEach((id) => newSearchParams.append("student-class-ids", id))
        if (draftFilters.dateRange.from)
            newSearchParams.append("start-date", draftFilters.dateRange.from.toLocaleDateString("en-CA").split("T")[0])
        if (draftFilters.dateRange.to)
            newSearchParams.append("end-date", draftFilters.dateRange.to.toLocaleDateString("en-CA").split("T")[0])
        draftFilters.paymentStatuses.forEach((status) => newSearchParams.append("payment-statuses", status.toString()))

        setSearchParams(newSearchParams)
        setIsFilterModalOpen(false)
    }

    const handleClearFilters = () => {
        const emptyFilters = {
            studentClassIds: [],
            dateRange: { from: undefined, to: undefined },
            paymentStatuses: [],
        }

        setAppliedFilters(emptyFilters)
        setDraftFilters(emptyFilters)
        setSearchParams(new URLSearchParams())
        setIsFilterModalOpen(false)
    }

    const handlePaymentStatusChange = (status: number, checked: boolean) => {
        setDraftFilters((prevFilters) => {
            const newStatuses = checked
                ? [...prevFilters.paymentStatuses, status]
                : prevFilters.paymentStatuses.filter((s) => s !== status)
            return { ...prevFilters, paymentStatuses: newStatuses }
        })
    }

    const handleDateRangeChange = (dateRangeOrEvent: DateRange | undefined | React.FormEvent<HTMLDivElement>) => {
        if (!dateRangeOrEvent) {
            setDraftFilters((prev) => ({
                ...prev,
                dateRange: { from: undefined, to: undefined },
            }))
            return
        }

        // If it's a FormEvent, ignore it
        if ("preventDefault" in dateRangeOrEvent) {
            return
        }

        // Handle the DateRange
        setDraftFilters((prev) => ({
            ...prev,
            dateRange: dateRangeOrEvent,
        }))
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confirm Payment",
        description: "Are you sure you want to proceed with this payment?",
        confirmText: "Proceed",
        onConfirm: () => {
            const tuitionId = selectedFee?.id

            if (!tuitionId) {
                toastWarning("Please select the tuition fee to pay!", {
                    position: "top-center",
                    duration: 1250,
                })
                return
            }

            const formData = new FormData()
            formData.append("tuitionId", tuitionId || "")

            fetcher.submit(formData, {
                method: "POST",
                action: "/account/tuition",
            })
        },
    })

    const isSubmitting = fetcher.state === "submitting"

    useEffect(() => {
        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error, {
                position: "top-center",
                duration: 1250,
            })
            return
        }
    }, [fetcher.data])

    const handlePayNowClick = (tuitionItem: Tuition) => {
        setSelectedFee(tuitionItem)
        setIsModalOpen(true)
    }

    const handlePrintInvoice = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
                                My Tuition Fees
                            </h1>
                            <p className="text-lg text-blue-600 font-medium">View and manage your course payments</p>

                            {/* Filter Status Indicator */}
                            {hasActiveFilters && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border border-blue-200">
                                        <Filter className="w-3 h-3 mr-1" />
                                        Filters Applied
                                    </Badge>
                                    {appliedFilters.paymentStatuses.length > 0 && (
                                        <span className="text-blue-600">
                                            Status:{" "}
                                            {appliedFilters.paymentStatuses
                                                .map((s) => PaymentStatusText[s as keyof typeof PaymentStatusText])
                                                .join(", ")}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {hasActiveFilters && (
                                <Button
                                    onClick={handleClearFilters}
                                    variant="outline"
                                    className="border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-lg transition-all duration-300 px-6 py-3"
                                >
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    Clear Filters
                                </Button>
                            )}
                            <Button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-lg transition-all duration-300 px-6 py-3"
                            >
                                <Filter className="w-5 h-5 mr-2" />
                                Filter Results
                            </Button>
                        </div>
                    </div>

                    {/* Outstanding Balance Alert */}
                    {totalDebt > 0 && (
                        <Card className="bg-white border-2 border-amber-200 shadow-xl mb-6 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-1">
                                    <div className="bg-white rounded-sm p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-amber-100 p-3 rounded-full border-2 border-amber-200">
                                                <AlertCircle className="w-8 h-8 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-amber-800 mb-1">Payment Reminder</h3>
                                                <p className="text-amber-600 mb-3 font-medium">
                                                    You have pending tuition fees for your enrolled courses
                                                </p>
                                                <p className="text-3xl font-bold text-amber-700">
                                                    {totalDebt.toLocaleString("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    })}
                                                </p>
                                            </div>
                                            {hasPendingPayments && (
                                                <div className="text-right">
                                                    <Badge className="bg-amber-600 text-white border-0 px-4 py-2 text-sm font-bold shadow-lg">
                                                        PAYMENT DUE
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Results Summary */}
                <div className="mb-6">
                    <p className="text-blue-600 font-medium">
                        {hasActiveFilters ? (
                            <>
                                Showing {filteredTuition.length} of {allTuition.length} tuition fee{allTuition.length !== 1 ? "s" : ""}
                                {filteredTuition.length !== allTuition.length && (
                                    <span className="text-blue-500 ml-2">
                                        ({allTuition.length - filteredTuition.length} hidden by filters)
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                Showing all {allTuition.length} tuition fee{allTuition.length !== 1 ? "s" : ""}
                            </>
                        )}
                    </p>
                </div>

                {/* Tuition Cards */}
                <div className="space-y-6">
                    {filteredTuition.length > 0 ? (
                        filteredTuition.map((tuitionItem) => (
                            <Card
                                key={tuitionItem.id}
                                className={`overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 backdrop-blur-sm ${tuitionItem.paymentStatus === PaymentStatus.Successed
                                        ? "bg-green-50/90 border-l-4 border-l-green-500"
                                        : "bg-white/90 border-l-4 border-l-amber-500"
                                    }`}
                            >
                                <CardHeader
                                    className={`text-white ${tuitionItem.paymentStatus === PaymentStatus.Successed
                                            ? "bg-gradient-to-r from-green-500 via-green-600 to-emerald-600"
                                            : "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
                                        }`}
                                >
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-3xl font-bold mb-1">
                                                    {(tuitionItem.amount + tuitionItem.fee).toLocaleString("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    })}
                                                </CardTitle>
                                                <p className="text-blue-100 font-semibold text-lg">{tuitionItem.studentClass.className}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge
                                                variant={tuitionItem.isPassed ? "default" : "secondary"}
                                                className={`px-4 py-2 text-sm font-bold border-2 ${tuitionItem.isPassed
                                                        ? "bg-green-600 text-white border-green-700 shadow-lg"
                                                        : "bg-blue-600 text-white border-blue-700 shadow-lg"
                                                    }`}
                                            >
                                                {tuitionItem.isPassed ? "Course Completed" : "Currently Enrolled"}
                                            </Badge>
                                            <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                                                <PaymentStatusIcon status={tuitionItem.paymentStatus} />
                                                <span className="text-slate-800 font-bold text-sm">
                                                    {PaymentStatusText[tuitionItem.paymentStatus] || "Unknown"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                                <span className="text-amber-600 font-semibold text-sm">Payment Deadline</span>
                                            </div>
                                            <p className="text-amber-900 font-bold text-sm">
                                                {tuitionItem.deadline ? formatDate(tuitionItem.deadline) : "Not specified"}
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <User className="w-5 h-5 text-indigo-600" />
                                                <span className="text-indigo-600 font-semibold text-sm">Student</span>
                                            </div>
                                            <p className="text-indigo-900 font-bold text-sm">{tuitionItem.studentClass.studentFullName}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                                <span className="text-emerald-600 font-semibold text-sm">Tax Fee</span>
                                            </div>
                                            <p className="text-emerald-900 font-bold text-sm">
                                                {tuitionItem.fee.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-blue-100">
                                        <div className="space-y-2">
                                            <p className="text-slate-600 font-medium">Base Tuition Amount</p>
                                            <p className="text-2xl font-bold text-blue-700">
                                                {tuitionItem.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            {tuitionItem.studentClass.isPassed && tuitionItem.studentClass.certificateUrl && (
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    asChild
                                                    className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                                                >
                                                    <a href={tuitionItem.studentClass.certificateUrl} target="_blank" rel="noopener noreferrer">
                                                        <Award className="w-5 h-5 mr-2" />
                                                        Download Certificate
                                                    </a>
                                                </Button>
                                            )}

                                            {tuitionItem.paymentStatus !== PaymentStatus.Successed && !tuitionItem.isPassed && (
                                                <Button
                                                    onClick={() => handlePayNowClick(tuitionItem)}
                                                    disabled={role === 4}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                                                >
                                                    <CreditCard className="w-5 h-5 mr-2" />
                                                    Pay Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center py-16 bg-white/90 backdrop-blur-sm shadow-xl">
                            <CardContent>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full">
                                        <GraduationCap className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-blue-900 mb-3">
                                            {hasActiveFilters ? "No tuition fees match your filters" : "No tuition fees found"}
                                        </h3>
                                        <p className="text-blue-600 text-lg">
                                            {hasActiveFilters
                                                ? "Try adjusting your filter criteria to see more results."
                                                : "You currently have no tuition fees to pay."}
                                        </p>
                                        {hasActiveFilters && (
                                            <Button
                                                onClick={handleClearFilters}
                                                variant="outline"
                                                className="mt-4 border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Clear Filters
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Payment Confirmation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white text-slate-900 max-w-lg border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-blue-900">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            Payment Confirmation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-600 font-semibold">Tuition Amount:</span>
                                    <span className="font-bold text-blue-900">
                                        {selectedFee?.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-600 font-semibold">Tax Fee:</span>
                                    <span className="font-bold text-blue-900">
                                        {selectedFee?.fee.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </span>
                                </div>
                                <Separator className="bg-blue-200" />
                                <div className="flex justify-between items-center text-xl">
                                    <span className="font-bold text-blue-700">Total Amount:</span>
                                    <span className="font-bold text-blue-900">
                                        {selectedFee &&
                                            (selectedFee.amount + selectedFee.fee).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <p className="text-slate-600">
                                <span className="font-semibold text-slate-800">Class:</span> {selectedFee?.studentClass.className}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                type="button"
                                onClick={handlePrintInvoice}
                                variant="outline"
                                size="lg"
                                className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Print Invoice
                            </Button>

                            <Button
                                type="button"
                                onClick={handleOpenConfirmDialog}
                                disabled={isSubmitting}
                                size="lg"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Processing Payment...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Confirm Payment
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Filter Modal */}
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogContent className="bg-white text-slate-900 max-w-2xl border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-blue-900">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                                <Filter className="w-6 h-6 text-white" />
                            </div>
                            Filter Options
                        </DialogTitle>
                        <Separator className="bg-blue-200" />
                    </DialogHeader>
                    <form onSubmit={handleFilterSubmit} className="space-y-8 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                            <Label className="text-xl font-bold mb-4 block text-blue-900">Date Range</Label>
                            <TuitionDateRangePicker
                                value={draftFilters.dateRange}
                                onChange={handleDateRangeChange}
                                placeholder="Select date range"
                            />
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                            <Label className="text-xl font-bold mb-4 block text-blue-900">Payment Status</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(PaymentStatus)
                                    .filter(([key]) => isNaN(Number(key)))
                                    .map(([key, value], index) => (
                                        <div
                                            key={key}
                                            className="flex items-center space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-colors duration-200 border border-blue-100"
                                        >
                                            <Checkbox
                                                id={`status-${value}`}
                                                checked={draftFilters.paymentStatuses.includes(Number(value))}
                                                onCheckedChange={(checked) => handlePaymentStatusChange(Number(value), checked === true)}
                                                className="border-2 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                            <Label htmlFor={`status-${value}`} className="flex-1 cursor-pointer">
                                                <PaymentStatusBadge status={index} />
                                            </Label>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={handleClearFilters}
                                variant="outline"
                                size="lg"
                                className="flex-1 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Clear All
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {confirmDialog}
        </div>
    )
}
