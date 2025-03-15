import type React from "react"
import { useEffect } from "react"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { requireAuth } from "~/lib/utils/auth"
import { fetchPayTuition, fetchTuition } from "~/lib/services/tuition"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useState } from "react"
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react"
import { PaymentStatus, PaymentStatusText, type Tuition } from "~/lib/types/tuition/tuition"
import { ArrowLeft, Download, Filter } from "lucide-react"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import DateRangePicker from "~/components/ui/date-range-picker"

export function formatDate(dateString: string | undefined) {
    if (!dateString) return "";
    
    const datePart = dateString.split(' ')[0].split('T')[0];
    if (datePart && datePart.includes('-')) {
        // Convert from YYYY-MM-DD to DD-MM-YYYY
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year}`;
    }
    
}



export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { idToken, role } = await requireAuth(request)
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
    const tuition: Tuition[] = response.data
    return { tuition, idToken, role }
}

export default function TuitionPage() {
    const { tuition, idToken, role } = useLoaderData<typeof loader>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Tuition | null>(null)
    const navigate = useNavigate()

    const [filters, setFilters] = useState({
        studentClassIds: searchParams.getAll("student-class-ids"),
        dateRange: {
            from: searchParams.get("start-date") ? new Date(searchParams.get("start-date")!) : undefined,
            to: searchParams.get("end-date") ? new Date(searchParams.get("end-date")!) : undefined,
        },
        paymentStatuses: searchParams.getAll("payment-statuses").map(Number),
    })

    useEffect(() => {
        setFilters({
            studentClassIds: searchParams.getAll("student-class-ids"),
            dateRange: {
                from: searchParams.get("start-date") ? new Date(searchParams.get("start-date")!) : undefined,
                to: searchParams.get("end-date") ? new Date(searchParams.get("end-date")!) : undefined,
            },
            paymentStatuses: searchParams.getAll("payment-statuses").map(Number),
        })
    }, [searchParams])

    const handlePayNowClick = (fee: Tuition) => {
        setSelectedFee(fee)
        setIsModalOpen(true)
    }

    const handlePaymentSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (selectedFee) {
            try {
                const response = await fetchPayTuition(selectedFee.id, window.location.href, idToken)
                console.log("Payment response url: ", response.data.url)
                window.location.href = response.data.url
            } catch (error) {
                console.error("Payment failed", error)
            }
        }
        setIsModalOpen(false)
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

    return (
        <div className="p-6 bg-white text-black">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Button
                        onClick={() => navigate("/")}
                        className="bg-transparent text-black hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                        <Filter className="mr-2 h-4 w-4" /> Bộ lọc
                    </Button>
                </div>
                <h1 className="text-3xl font-serif font-bold mb-8 text-center">Bảng học phí</h1>
                {tuition.map((fee) => (
                    <div key={fee.id} className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">
                {fee.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
              </span>
                            <Badge variant={fee.isPassed ? "destructive" : "secondary"}>
                                Trạng thái lớp học: {fee.isPassed ? "Đã qua" : "Chưa xong"}
                            </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                            {formatDate(fee.startDate)} đến {formatDate(fee.endDate)}
                        </div>
                        <div className="text-sm font-medium mb-2">Lớp: {fee.studentClass.className}</div>
                        <div className="text-sm text-gray-600 mb-2">Học viên: {fee.studentClass.studentFullName}</div>
                        <div className="flex justify-between items-center">
              <span className="text-sm">
                Trạng thái thanh toán:
                <span
                    className={`ml-1 font-bold ${
                        fee.paymentStatus === PaymentStatus.Successed ? "text-green-600" : "text-gray-600"
                    }`}
                >
                  {PaymentStatusText[fee.paymentStatus] || "Không xác định"}
                </span>
              </span>
                            {fee.paymentStatus !== PaymentStatus.Successed && !fee.isPassed && (
                                <Button
                                    onClick={() => handlePayNowClick(fee)}
                                    disabled={role === 4}
                                    className={`${
                                        role === 4
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-black hover:bg-gray-800"
                                    } text-white transition-colors`}
                                >
                                    Trả ngay
                                </Button>
                            )}
                        </div>
                        {fee.studentClass.isPassed && fee.studentClass.certificateUrl && (
                            <div className="mt-2">
                                <a
                                    href={fee.studentClass.certificateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Xác nhận thanh toán</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="mt-4">
                        <p className="mb-2">
                            Số tiền: {selectedFee?.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </p>
                        <p className="mb-2 text-sm text-gray-600">
                            Thời gian: {formatDate(selectedFee?.startDate)} đến {formatDate(selectedFee?.endDate)}
                        </p>
                        <p className="mb-4 text-sm font-medium">Lớp: {selectedFee?.studentClass.className}</p>
                        
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 px-4 rounded"
                        >
                            Tiến hành thanh toán
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Bộ lọc</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFilterSubmit} className="mt-4 space-y-4">
                        <div>
                            <Label>Ngày từ - đến</Label>
                            <DateRangePicker
                                value={filters.dateRange}
                                onChange={(dateRange) => setFilters({ ...filters, dateRange: dateRange || {} })}
                                placeholder="Chọn khoảng thời gian"
                            />
                        </div>
                        <div>
                            <Label>Trạng thái</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(PaymentStatus)
                                    .filter(([key]) => isNaN(Number(key)))
                                    .map(([key, value]) => (
                                        <div key={key} className="flex items-center">
                                            <Checkbox
                                                id={`status-${value}`}
                                                checked={filters.paymentStatuses.includes(Number(value))}
                                                onCheckedChange={(checked) => handlePaymentStatusChange(Number(value), checked === true)}
                                            />
                                            <Label htmlFor={`status-${value}`} className="ml-2">
                                                {key}
                                            </Label>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 px-4 rounded"
                        >
                            Xác nhận
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

