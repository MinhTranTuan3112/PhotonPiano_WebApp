import type React from "react"
import { useEffect } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { requireAuth } from "~/lib/utils/auth"
import { fetchPayTuition, fetchTuition } from "~/lib/services/tuition"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useState } from "react"
import { Form, redirect, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react"
import { PaymentStatus, PaymentStatusText, type Tuition } from "~/lib/types/tuition/tuition"
import { Download, Filter } from "lucide-react"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import DateRangePicker from "~/components/ui/date-range-picker"
import { Separator } from "~/components/ui/separator"
import { PaymentStatusBadge } from "~/components/transactions/transaction-table/columns"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { Role } from "~/lib/types/account/account"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { toast } from "sonner"

export function formatDate(dateString: string | undefined) {
    if (!dateString) return "";

    const datePart = dateString.split(' ')[0].split('T')[0];
    if (datePart && datePart.includes('-')) {
        // Convert from YYYY-MM-DD to DD-MM-YYYY
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year}`;
    }

}

function calculateTotalDebt(tuition: Tuition[]): number {
    return tuition
        .filter(fee => fee.paymentStatus !== PaymentStatus.Successed)
        .reduce((sum, fee) => sum + fee.amount, 0);
}


export const loader = async ({ request }: LoaderFunctionArgs) => {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Student) {
            return redirect('/');
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

        if (!paymentStatuses.length) { // Chỉ áp dụng khi không có filter cụ thể
            tuition = tuition.filter(fee => fee.paymentStatus !== PaymentStatus.Successed)
        }

        return { tuition, idToken, role };

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Student) {
            return redirect('/');
        }

        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        const returnUrl = `${baseUrl}/account/tuition`;

        const formData = await request.formData();

        const tuitionId = formData.get("tuitionId") as string;

        const response = await fetchPayTuition(tuitionId, returnUrl, idToken);

        if (response.status === 200) {
            const data = await response.data;

            const paymentUrl = data.url as string;

            return redirect(paymentUrl);
        }

        return Response.json({
            success: false,
            error: 'Thanh toán thất bại!',
        }, {
            status: 400
        });

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        });
    }
}

export default function TuitionPage() {
    const { tuition, idToken, role } = useLoaderData<typeof loader>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Tuition | null>(null)

    const fetcher = useFetcher<typeof action>();

    const totalDebt = calculateTotalDebt(tuition);

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

    // const handlePaymentSubmit = async (event: React.FormEvent) => {
    //     event.preventDefault()
    //     if (selectedFee) {
    //         try {
    //             const response = await fetchPayTuition(selectedFee.id, window.location.href, idToken)
    //             console.log("Payment response url: ", response.data.url)
    //             window.location.href = response.data.url
    //         } catch (error) {
    //             console.error("Payment failed", error)
    //         }
    //     }
    //     setIsModalOpen(false)
    // }

    const handlePrintInvoice = () => {
        if (!selectedFee) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;


        printWindow.document.write(`
        <html>
            <head>
                <title>Giấy báo học phí</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .invoice-container {
                        max-width: 600px;
                        margin: 40px auto;
                        padding: 20px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .invoice-header {
                        font-size: 24px;
                        font-weight: bold;
                        text-transform: uppercase;
                        margin-bottom: 20px;
                    }
                    .invoice-subtitle {
                        font-size: 18px;
                        margin-bottom: 10px;
                        color: #555;
                    }
                    .invoice-details {
                        text-align: left;
                        font-size: 16px;
                        margin-top: 20px;
                    }
                    .invoice-details p {
                        margin: 8px 0;
                    }
                    .divider {
                        height: 1px;
                        background-color: #ddd;
                        margin: 20px 0;
                    }
                    .signature {
                        text-align: right;
                        margin-top: 40px;
                        font-size: 16px;
                        font-style: italic;
                    }
                    .footer-note {
                        margin-top: 20px;
                        font-size: 14px;
                        color: #888;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="invoice-header">PhotonPiano</div>
                    <div class="invoice-subtitle">Giấy báo học phí</div>
                    
                    <div class="divider"></div>

                    <div class="invoice-details">
                        <p><strong>Học viên:</strong> ${selectedFee.studentClass.studentFullName}</p>
                        <p><strong>Lớp:</strong> ${selectedFee.studentClass.className}</p>
                        <p><strong>Thời gian:</strong> ${formatDate(selectedFee.startDate)} đến ${formatDate(selectedFee.endDate)} (dự kiến)</p>
                        <p><strong>Số tiền:</strong> ${selectedFee.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</p>
                        <p><strong>Trạng thái thanh toán:</strong> ${PaymentStatusText[selectedFee.paymentStatus]}</p>
                         <p><strong>Hạn chót đóng học phí:</strong> ${selectedFee.deadline}</p>
                    </div>

                    <div class="divider"></div>

                    <div class="signature">Người lập hóa đơn</div>

                    <div class="footer-note">Vui lòng thanh toán trước ngày hết hạn để tránh gián đoạn học tập.</div>
                </div>
                <script>
                    window.print();
                </script>
            </body>
        </html>
    `);

        printWindow.document.close();
    };


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

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Xác nhận",
        description: "Bạn có chắc chắn muốn thanh toán học phí không?",
        confirmText: 'Thanh toán',
        onConfirm: () => {
            const tuitionId = selectedFee?.id;

            if (!tuitionId) {
                toast.error("Vui lòng chọn học phí cần thanh toán!", {
                    position: 'top-center',
                    duration: 1250
                });
                return;
            }

            const formData = new FormData();

            formData.append("tuitionId", tuitionId || "");

            fetcher.submit(formData, {
                method: "POST",
                action: "/account/tuition",
            })
        },
    });

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === false) {
            toast.error(fetcher.data.error, {
                position: 'top-center',
                duration: 1250
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data])


    return (
        <div className="p-4 bg-white text-black">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    {/* <Button
                        onClick={() => navigate("/")}
                        className="bg-transparent text-black hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Trở lại
                    </Button> */}
                    <Button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                        <Filter className="mr-2 h-4 w-4" /> Bộ lọc
                    </Button>
                </div>
                <h1 className="text-3xl uppercase font-bold mb-8 text-center">Bảng học phí</h1>

                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Tổng nợ:</span>
                        <span className="text-lg font-bold text-red-600">
                            {totalDebt.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND"
                            })}
                        </span>
                    </div>
                </div>

                {tuition.length > 0 ? (
                    tuition.map((fee) => (
                        <div key={fee.id} className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
                            {/* ... (giữ nguyên phần hiển thị chi tiết từng fee) */}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-600">
                        Không có khoản học phí nào cần thanh toán.
                    </div>
                )}

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
                        <div className="text-sm text-red-600 mb-2">
                            Hạn chót: {fee.deadline ? formatDate(fee.deadline) : "Không xác định"}
                        </div>
                        <div className="text-sm font-medium mb-2">Lớp: {fee.studentClass.className}</div>
                        <div className="text-sm text-gray-600 mb-2">Học viên: {fee.studentClass.studentFullName}</div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">
                                Trạng thái thanh toán:
                                <span
                                    className={`ml-1 font-bold ${fee.paymentStatus === PaymentStatus.Successed ? "text-green-600" : "text-gray-600"
                                        }`}
                                >
                                    {PaymentStatusText[fee.paymentStatus] || "Không xác định"}
                                </span>
                            </span>
                            {fee.paymentStatus !== PaymentStatus.Successed && !fee.isPassed && (
                                <Button
                                    onClick={() => handlePayNowClick(fee)}
                                    disabled={role === 4}
                                    className={`${role === 4
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
                                    Tải chứng chỉ
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>


            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-2xl ">Xác nhận thanh toán</DialogTitle>
                    </DialogHeader>
                    <Form method="POST" className="mt-4">
                        <p className="mb-2">
                            Số tiền: {selectedFee?.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </p>
                        <p className="mb-2 text-sm text-gray-600">
                            Thời gian: {formatDate(selectedFee?.startDate)} đến {formatDate(selectedFee?.endDate)}
                        </p>
                        <p className="mb-4 text-sm font-medium">Lớp: {selectedFee?.studentClass.className}</p>

                        <Button
                            type="button"
                            onClick={handlePrintInvoice}
                            className="w-full bg-gray-200 text-black hover:bg-gray-300 transition-colors py-2 px-4 rounded mt-2"
                        >
                            In giấy báo học phí
                        </Button>

                        <Button
                            type="button"
                            className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 px-4 rounded"
                            onClick={handleOpenConfirmDialog}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
                        </Button>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex flex-row gap-1 items-center"><Filter /> Bộ lọc</DialogTitle>
                        <Separator className="w-full" />
                    </DialogHeader>
                    <form onSubmit={handleFilterSubmit} className="mt-4 space-y-4 flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            <Label className="font-bold my-3 text-base">Ngày từ - đến</Label>
                            <DateRangePicker
                                value={filters.dateRange}
                                onChange={(dateRange) => setFilters({ ...filters, dateRange: dateRange || {} })}
                                placeholder="Chọn khoảng thời gian"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="font-bold my-3 text-base">Trạng thái</Label>
                            <div className="flex flex-col gap-3">
                                {Object.entries(PaymentStatus)
                                    .filter(([key]) => isNaN(Number(key)))
                                    .map(([key, value], index) => (
                                        <div key={key} className="flex items-center">
                                            <Checkbox
                                                id={`status-${value}`}
                                                checked={filters.paymentStatuses.includes(Number(value))}
                                                onCheckedChange={(checked) => handlePaymentStatusChange(Number(value), checked === true)}
                                            />
                                            <Label htmlFor={`status-${value}`} className="ml-2">
                                                <PaymentStatusBadge status={index} />
                                            </Label>
                                        </div>
                                    ))}
                            </div>

                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 px-4 rounded"
                        >
                            Tìm kiếm
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </div>
    )
}

