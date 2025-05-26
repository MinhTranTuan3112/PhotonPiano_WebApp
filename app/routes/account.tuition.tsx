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
    AlertTriangle,
    BookOpen,
    Award,
} from "lucide-react"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import DateRangePicker from "~/components/ui/date-range-picker"
import { Separator } from "~/components/ui/separator"
import { PaymentStatusBadge } from "~/components/transactions/transaction-table/columns"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { Role } from "~/lib/types/account/account"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { toastWarning } from "~/lib/utils/toast-utils"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Student) {
            return redirect("/")
        }

        const url = new URL(request.url)
        const studentClassIds = url.searchParams.getAll("student-class-ids")
        const startTime = url.searchParams.get("start-date")
        const endTime = url.searchParams.get("end-date")
        const paymentStatuses = url.searchParams.getAll("payment-statuses").map(Number)

        const response = await fetchTuition({
            idToken,
            studentClassIds,
            startTime,
            endTime,
            paymentStatuses,
        })
        let tuition: Tuition[] = response.data

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
    const { tuition, role } = useLoaderData<typeof loader>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Tuition | null>(null)

    const fetcher = useFetcher<typeof action>()
    const totalDebt = calculateTotalDebt(tuition)
    const hasPendingPayments = tuition.some((t) => t.paymentStatus === PaymentStatus.Pending)

    const [filters, setFilters] = useState({
        studentClassIds: searchParams.getAll("student-class-ids"),
        dateRange: {
            from: searchParams.get("start-date") ? new Date(searchParams.get("start-date")!) : undefined,
            to: searchParams.get("end-date") ? new Date(searchParams.get("end-date")!) : undefined,
        } as DateRange,
        paymentStatuses: searchParams.getAll("payment-statuses").map(Number),
    })

    useEffect(() => {
        setFilters({
            studentClassIds: searchParams.getAll("student-class-ids"),
            dateRange: {
                from: searchParams.get("start-date") ? new Date(searchParams.get("start-date")!) : undefined,
                to: searchParams.get("end-date") ? new Date(searchParams.get("end-date")!) : undefined,
            } as DateRange,
            paymentStatuses: searchParams.getAll("payment-statuses").map(Number),
        })
    }, [searchParams])

    const handlePayNowClick = (fee: Tuition) => {
        setSelectedFee(fee)
        setIsModalOpen(true)
    }

    const handlePrintInvoice = () => {
        if (!selectedFee) return

        const printInvoiceWithIframe = () => {
            const printIframe = document.createElement("iframe")
            printIframe.style.position = "absolute"
            printIframe.style.width = "0px"
            printIframe.style.height = "0px"
            printIframe.style.border = "0"

            document.body.appendChild(printIframe)
            const iframeDocument = printIframe.contentDocument || printIframe.contentWindow?.document

            if (!iframeDocument) {
                console.error("Could not access iframe document")
                return
            }

            iframeDocument.open()
            iframeDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tuition Invoice - PhotonPiano</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: #1e293b;
                        line-height: 1.6;
                        padding: 40px 20px;
                        min-height: 100vh;
                    }
                    .invoice-wrapper {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                        overflow: hidden;
                        position: relative;
                    }
                    .invoice-wrapper::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 6px;
                        background: linear-gradient(90deg, #3b82f6, #1d4ed8, #2563eb);
                    }
                    .invoice-header {
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        padding: 40px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .brand {
                        display: flex;
                        flex-direction: column;
                    }
                    .brand-logo {
                        font-size: 32px;
                        font-weight: 800;
                        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        letter-spacing: -1px;
                    }
                    .brand-tagline {
                        font-size: 14px;
                        color: #64748b;
                        margin-top: 4px;
                        font-weight: 500;
                    }
                    .invoice-title {
                        text-align: right;
                    }
                    .invoice-title h1 {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1e293b;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        margin-bottom: 8px;
                    }
                    .invoice-number {
                        color: #64748b;
                        font-size: 16px;
                        font-weight: 600;
                        background: #f1f5f9;
                        padding: 8px 16px;
                        border-radius: 8px;
                        display: inline-block;
                    }
                    .invoice-body {
                        padding: 40px;
                    }
                    .invoice-section {
                        margin-bottom: 40px;
                    }
                    .section-title {
                        font-size: 20px;
                        font-weight: 700;
                        color: #1e293b;
                        text-transform: uppercase;
                        margin-bottom: 24px;
                        letter-spacing: 1px;
                        position: relative;
                        padding-bottom: 12px;
                    }
                    .section-title::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 60px;
                        height: 3px;
                        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                        border-radius: 2px;
                    }
                    .invoice-details {
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        border-radius: 16px;
                        padding: 32px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 16px 0;
                        border-bottom: 1px dashed #cbd5e1;
                        align-items: center;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        font-weight: 600;
                        color: #475569;
                        font-size: 15px;
                    }
                    .detail-value {
                        text-align: right;
                        font-weight: 700;
                        color: #1e293b;
                        font-size: 15px;
                    }
                    .payment-box {
                        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                        border-radius: 20px;
                        padding: 40px;
                        text-align: center;
                        margin: 40px 0;
                        color: white;
                        box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
                        position: relative;
                        overflow: hidden;
                    }
                    .payment-box::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                        animation: shimmer 3s ease-in-out infinite;
                    }
                    @keyframes shimmer {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(180deg); }
                    }
                    .payment-amount-label {
                        font-size: 16px;
                        opacity: 0.9;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        font-weight: 600;
                    }
                    .payment-amount {
                        font-size: 42px;
                        font-weight: 800;
                        margin-bottom: 20px;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .tax-fee {
                        font-size: 16px;
                        opacity: 0.9;
                        margin-bottom: 24px;
                        font-weight: 500;
                    }
                    .payment-status-badge {
                        display: inline-block;
                        padding: 12px 24px;
                        border-radius: 50px;
                        font-size: 14px;
                        font-weight: 700;
                        text-transform: uppercase;
                        background: rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        letter-spacing: 1px;
                    }
                    .warning-box {
                        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                        border-left: 6px solid #ef4444;
                        border-radius: 12px;
                        padding: 24px;
                        margin: 30px 0;
                        font-size: 15px;
                        color: #dc2626;
                        font-weight: 600;
                        box-shadow: 0 4px 6px rgba(239, 68, 68, 0.1);
                    }
                    .invoice-footer {
                        display: flex;
                        justify-content: space-between;
                        padding: 40px;
                        border-top: 2px solid #e2e8f0;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    }
                    .footer-left p {
                        color: #64748b;
                        font-size: 14px;
                        margin-bottom: 6px;
                        font-weight: 500;
                    }
                    .footer-right {
                        text-align: right;
                    }
                    .signature-area {
                        margin-top: 16px;
                        width: 220px;
                        text-align: center;
                        margin-left: auto;
                    }
                    .signature-line {
                        width: 100%;
                        height: 2px;
                        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                        margin: 50px 0 16px 0;
                        border-radius: 1px;
                    }
                    .signature-name {
                        font-size: 16px;
                        font-weight: 700;
                        color: #1e293b;
                    }
                    .signature-title {
                        font-size: 13px;
                        color: #64748b;
                        font-weight: 500;
                    }
                    .contact-info {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 14px;
                        color: #64748b;
                        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                        padding: 24px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                    }
                    .contact-info p {
                        margin-bottom: 4px;
                    }
                    .contact-info p:first-child {
                        font-weight: 700;
                        color: #1e293b;
                        font-size: 16px;
                    }
                    .invoice-date {
                        font-size: 15px;
                        color: #64748b;
                        margin-bottom: 8px;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-wrapper">
                    <div class="invoice-header">
                        <div class="brand">
                            <div class="brand-logo">PhotonPiano</div>
                            <div class="brand-tagline">Excellence in Music Education</div>
                        </div>
                        <div class="invoice-title">
                            <h1>Tuition Invoice</h1>
                            <div class="invoice-number">Invoice #${selectedFee.id || "INV-00001"}</div>
                        </div>
                    </div>

                    <div class="invoice-body">
                        <div class="invoice-section">
                            <div class="section-title">Student Information</div>
                            <div class="invoice-details">
                                <div class="detail-row">
                                    <div class="detail-label">Student Name</div>
                                    <div class="detail-value">${selectedFee.studentClass.studentFullName}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Class</div>
                                    <div class="detail-value">${selectedFee.studentClass.className}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Payment Deadline</div>
                                    <div class="detail-value">${formatDate(selectedFee.deadline)}</div>
                                </div>
                            </div>
                        </div>

                        <div class="payment-box">
                            <div class="payment-amount-label">AMOUNT DUE</div>
                            <div class="payment-amount">${selectedFee.amount.toLocaleString("en-US", { style: "currency", currency: "VND" })}</div>
                            <div class="tax-fee">Tax Fee: ${selectedFee.fee.toLocaleString("en-US", { style: "currency", currency: "VND" })}</div>
                            <div class="payment-status-badge">
                                ${PaymentStatusText[selectedFee.paymentStatus]}
                            </div>
                        </div>

                        ${selectedFee.paymentStatus === PaymentStatus.Pending
                    ? `<div class="warning-box">
                              Please make your payment by ${formatDate(selectedFee.deadline)} to avoid any interruption to your studies.
                          </div>`
                    : ""
                }
                    </div>

                    <div class="invoice-footer">
                        <div class="footer-left">
                            <div class="invoice-date">Issue Date: ${new Date().toLocaleDateString("en-US")}</div>
                            <p>Thank you for choosing PhotonPiano</p>
                            <p>For any inquiries, please contact us</p>
                        </div>

                        <div class="footer-right">
                            <div class="signature-area">
                                <div class="signature-line"></div>
                                <div class="signature-name">Administrator</div>
                                <div class="signature-title">Issued By</div>
                            </div>
                        </div>
                    </div>

                    <div class="contact-info">
                        <p>PhotonPiano Music Academy</p>
                        <p>123 Music Avenue, New York, NY 10001</p>
                        <p>contact@photonpiano.com | +1 (800) 123-4567</p>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `)
            iframeDocument.close()

            setTimeout(() => {
                try {
                    const contentWindow = printIframe.contentWindow
                    if (contentWindow) {
                        contentWindow.focus()
                        contentWindow.print()
                    }

                    setTimeout(() => {
                        try {
                            document.body.removeChild(printIframe)
                        } catch (e) {
                            console.error("Failed to remove iframe:", e)
                        }
                    }, 1000)
                } catch (e) {
                    console.error("Print error:", e)
                    try {
                        document.body.removeChild(printIframe)
                    } catch (e) {
                        console.error("Failed to remove iframe:", e)
                    }
                }
            }, 500)
        }

        printInvoiceWithIframe()
    }

    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        const newSearchParams = new URLSearchParams()

        filters.studentClassIds.forEach((id) => newSearchParams.append("student-class-ids", id))
        if (filters.dateRange.from)
            newSearchParams.append("start-date", filters.dateRange.from.toLocaleDateString("en-CA").split("T")[0])
        if (filters.dateRange.to)
            newSearchParams.append("end-date", filters.dateRange.to.toLocaleDateString("en-CA").split("T")[0])
        filters.paymentStatuses.forEach((status) => newSearchParams.append("payment-statuses", status.toString()))

        setSearchParams(newSearchParams)
        setIsFilterModalOpen(false)
    }

    const handlePaymentStatusChange = (status: number, checked: boolean) => {
        setFilters((prevFilters) => {
            const newStatuses = checked
                ? [...prevFilters.paymentStatuses, status]
                : prevFilters.paymentStatuses.filter((s) => s !== status)
            return { ...prevFilters, paymentStatuses: newStatuses }
        })
    }

    const handleDateRangeChange = (dateRange: DateRange | undefined) => {
        setFilters({
            ...filters,
            dateRange: dateRange || { from: undefined, to: undefined },
        })
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
                        </div>
                        <Button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-lg transition-all duration-300 px-6 py-3"
                        >
                            <Filter className="w-5 h-5 mr-2" />
                            Filter Results
                        </Button>
                    </div>

                    {/* Outstanding Balance Alert */}
                    {totalDebt > 0 && (
                        <Card className="bg-white border-2 border-red-200 shadow-xl mb-6 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 p-1">
                                    <div className="bg-white rounded-sm p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-red-100 p-3 rounded-full border-2 border-red-200">
                                                <AlertTriangle className="w-8 h-8 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-red-800 mb-1">Outstanding Balance</h3>
                                                <p className="text-red-600 mb-3 font-medium">
                                                    You have unpaid tuition fees that require immediate attention
                                                </p>
                                                <p className="text-3xl font-bold text-red-700">
                                                    {totalDebt.toLocaleString("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    })}
                                                </p>
                                            </div>
                                            {hasPendingPayments && (
                                                <div className="text-right">
                                                    <Badge className="bg-red-600 text-white border-0 px-4 py-2 text-sm font-bold shadow-lg">
                                                        ACTION REQUIRED
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

                {/* Tuition Cards */}
                <div className="space-y-6">
                    {tuition.length > 0 ? (
                        tuition.map((tuitionItem) => (
                            <Card
                                key={tuitionItem.id}
                                className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm"
                            >
                                <CardHeader className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white">
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
                                        <h3 className="text-2xl font-bold text-blue-900 mb-3">No tuition fees found</h3>
                                        <p className="text-blue-600 text-lg">You currently have no tuition fees to pay.</p>
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
                            <DateRangePicker
                                value={filters.dateRange}
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
                                                checked={filters.paymentStatuses.includes(Number(value))}
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

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-6"
                        >
                            Apply Filters
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {confirmDialog}
        </div>
    )
}
