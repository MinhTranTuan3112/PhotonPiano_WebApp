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

        // if (!paymentStatuses.length) { // Chỉ áp dụng khi không có filter cụ thể
        //     tuition = tuition.filter(fee => fee.paymentStatus !== PaymentStatus.Successed)
        // }
        
        tuition = tuition.sort( (a, b) =>  a.paymentStatus - b.paymentStatus  )

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
    const { tuition, role } = useLoaderData<typeof loader>()
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

        // Create a new approach using an iframe
        const printInvoiceWithIframe = () => {
            // Create a new iframe element
            const printIframe = document.createElement('iframe');

            // Set it to be invisible 
            printIframe.style.position = 'absolute';
            printIframe.style.width = '0px';
            printIframe.style.height = '0px';
            printIframe.style.border = '0';

            // Add it to the page
            document.body.appendChild(printIframe);

            // Get the iframe's document
            const iframeDocument = printIframe.contentDocument || printIframe.contentWindow.document;

            // Open the document and write the invoice content
            iframeDocument.open();
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
                        font-family: Arial, sans-serif;
                        background-color: white;
                        color: #333;
                        line-height: 1.6;
                        padding: 20px;
                    }
                    .invoice-wrapper {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                    }
                    .invoice-top-bar {
                        height: 12px;
                        background: #4776E6;
                        margin-bottom: 20px;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #eee;
                    }
                    .brand {
                        display: flex;
                        flex-direction: column;
                    }
                    .brand-logo {
                        font-size: 26px;
                        font-weight: 700;
                        color: #4776E6;
                    }
                    .brand-tagline {
                        font-size: 13px;
                        color: #777;
                        margin-top: 2px;
                    }
                    .invoice-title {
                        text-align: right;
                    }
                    .invoice-title h1 {
                        font-size: 22px;
                        font-weight: 600;
                        color: #333;
                        text-transform: uppercase;
                    }
                    .invoice-title .invoice-number {
                        color: #777;
                        font-size: 14px;
                        margin-top: 4px;
                    }
                    .invoice-body {
                        padding: 20px 0;
                    }
                    .invoice-section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #555;
                        text-transform: uppercase;
                        margin-bottom: 15px;
                    }
                    .invoice-details {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 25px;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px dashed #e0e0e0;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        font-weight: 500;
                        color: #666;
                    }
                    .detail-value {
                        text-align: right;
                        font-weight: 600;
                        color: #333;
                    }
                    .payment-box {
                        background: #f0f7ff;
                        border-radius: 8px;
                        padding: 25px;
                        text-align: center;
                        margin: 30px 0;
                        border-left: 4px solid #4776E6;
                    }
                    .payment-amount-label {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 8px;
                    }
                    .payment-amount {
                        font-size: 28px;
                        font-weight: 700;
                        color: #4776E6;
                        margin-bottom: 15px;
                    }
                    .tax-fee {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 15px;
                    }
                    .payment-status-badge {
                        display: inline-block;
                        padding: 6px 14px;
                        border-radius: 50px;
                        font-size: 13px;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .status-pending {
                        background: #fff8e1;
                        color: #f59f00;
                    }
                    .status-success {
                        background: #e6f7ee;
                        color: #2b8a3e;
                    }
                    .status-failed {
                        background: #fff5f5;
                        color: #e03131;
                    }
                    .status-canceled {
                        background: #f1f3f5;
                        color: #495057;
                    }
                    .warning-box {
                        background: #fff5f5;
                        border-left: 4px solid #e03131;
                        border-radius: 8px;
                        padding: 15px 20px;
                        margin: 20px 0;
                        font-size: 14px;
                        color: #e03131;
                        font-weight: 500;
                    }
                    .invoice-footer {
                        display: flex;
                        justify-content: space-between;
                        padding: 20px 0;
                        border-top: 1px solid #eee;
                    }
                    .footer-left p {
                        color: #777;
                        font-size: 13px;
                        margin-bottom: 5px;
                    }
                    .footer-right {
                        text-align: right;
                    }
                    .signature-area {
                        margin-top: 10px;
                        width: 200px;
                        text-align: center;
                        margin-left: auto;
                    }
                    .signature-line {
                        width: 100%;
                        height: 1px;
                        background: #ccc;
                        margin: 40px 0 10px 0;
                    }
                    .signature-name {
                        font-size: 14px;
                        font-weight: 600;
                    }
                    .signature-title {
                        font-size: 12px;
                        color: #777;
                    }
                    .contact-info {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 13px;
                        color: #777;
                    }
                    .invoice-date {
                        font-size: 14px;
                        color: #777;
                        margin-bottom: 5px;
                    }
                    .barcode-container {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .barcode {
                        width: 150px;
                        height: 60px;
                        background: #f1f1f1;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        color: #aaa;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-wrapper">
                    <div class="invoice-top-bar"></div>
                    
                    <div class="invoice-header">
                        <div class="brand">
                            <div class="brand-logo">PhotonPiano</div>
                            <div class="brand-tagline">Excellence in Music Education</div>
                        </div>
                        <div class="invoice-title">
                            <h1>Tuition Invoice</h1>
                            <div class="invoice-number">Invoice #${selectedFee.id || 'INV-00001'}</div>
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
                                    <div class="detail-label">Period</div>
                                    <div class="detail-value">${formatDate(selectedFee.startDate)} to ${formatDate(selectedFee.endDate)}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Payment Deadline</div>
                                    <div class="detail-value">${formatDate(selectedFee.deadline)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="payment-box">
                            <div class="payment-amount-label">AMOUNT DUE</div>
                            <div class="payment-amount">${selectedFee.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</div>
                            <div class="tax-fee">Tax Fee: ${selectedFee.fee.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</div>
                            <div class="payment-status-badge status-${PaymentStatus[selectedFee.paymentStatus].toLowerCase()}">
                                ${PaymentStatusText[selectedFee.paymentStatus]}
                            </div>
                        </div>
                        
                        ${selectedFee.paymentStatus === PaymentStatus.Pending ?
                `<div class="warning-box">
                              Please make your payment by ${formatDate(selectedFee.deadline)} to avoid any interruption to your studies.
                          </div>` : ''}
                        
                        <div class="barcode-container">
                            <div class="barcode">Payment Reference Code</div>
                        </div>
                    </div>
                    
                    <div class="invoice-footer">
                        <div class="footer-left">
                            <div class="invoice-date">Issue Date: ${new Date().toLocaleDateString("vi-VN")}</div>
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
        `);
            iframeDocument.close();

            // Wait a moment for the content to load
            setTimeout(() => {
                try {
                    // Try to print
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();

                    // Remove the iframe after printing (or after a delay if printing fails)
                    setTimeout(() => {
                        try {
                            document.body.removeChild(printIframe);
                        } catch (e) {
                            console.error("Failed to remove iframe:", e);
                        }
                    }, 1000);
                } catch (e) {
                    console.error("Print error:", e);
                    // If print fails, still try to clean up
                    try {
                        document.body.removeChild(printIframe);
                    } catch (e) {
                        console.error("Failed to remove iframe:", e);
                    }
                }
            }, 500);
        };

        printInvoiceWithIframe();
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
                toast.warning("Vui lòng chọn học phí cần thanh toán!", {
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
            toast.warning(fetcher.data.error, {
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
                    <Button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                </div>
                <h1 className="text-3xl uppercase font-bold mb-8 text-center">Tuition Table</h1>

                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Debt:</span>
                        <span className="text-lg font-bold text-red-600">
            {totalDebt.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
            })}
          </span>
                    </div>
                </div>

                {tuition.length > 0 ? (
                    tuition.map((tuition) => (
                        <div key={tuition.id} className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">
                {(tuition.amount + tuition.fee).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                })}
              </span>
                                <Badge variant={tuition.isPassed ? "destructive" : "secondary"}>
                                    Class Status: {tuition.isPassed ? "Passed" : "In Progress"}
                                </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                {formatDate(tuition.startDate)} to {formatDate(tuition.endDate)}
                            </div>
                            <div className="text-sm text-red-600 mb-2">
                                Deadline: {tuition.deadline ? formatDate(tuition.deadline) : "Not specified"}
                            </div>
                            <div className="text-sm font-medium mb-2">Class: {tuition.studentClass.className}</div>
                            <div className="text-sm text-gray-600 mb-2">Learner: {tuition.studentClass.studentFullName}</div>
                            <div className="text-sm text-gray-600 mb-2">Tax Fee: {tuition.fee.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</div>
                            <div className="text-sm text-gray-600 mb-2">Tuition: {tuition.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</div>
                            <div className="flex justify-between items-center">
              <span className="text-sm">
                Payment Status:
                <span
                    className={`ml-1 font-bold ${tuition.paymentStatus === PaymentStatus.Successed ? "text-green-600" : "text-gray-600"}`}
                >
                  {PaymentStatusText[tuition.paymentStatus] || "Unknown"}
                </span>
              </span>
                                {tuition.paymentStatus !== PaymentStatus.Successed && !tuition.isPassed && (
                                    <Button
                                        onClick={() => handlePayNowClick(tuition)}
                                        disabled={role === 4}
                                        className={`${role === 4 ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"} text-white transition-colors`}
                                    >
                                        Pay Now
                                    </Button>
                                )}
                            </div>
                            {tuition.studentClass.isPassed && tuition.studentClass.certificateUrl && (
                                <div className="mt-2">
                                    <a
                                        href={tuition.studentClass.certificateUrl}
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
                    ))
                ) : (
                    <div className="text-center text-gray-600">
                        No tuition fees to be paid.
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Confirm</DialogTitle>
                    </DialogHeader>
                    <Form method="POST" className="mt-4">
                        <p className="mb-2">
                            Amount: {selectedFee?.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </p>
                        <p className="mb-2 text-sm text-gray-600">
                            Time: {formatDate(selectedFee?.startDate)} to {formatDate(selectedFee?.endDate)}
                        </p>
                        <p className="mb-4 text-sm font-medium">Class: {selectedFee?.studentClass.className}</p>
                        <p className="mb-4 text-sm font-medium">Fee: {selectedFee?.fee}</p>
                        <Button
                            type="button"
                            onClick={handlePrintInvoice}
                            className="w-full bg-gray-200 text-black hover:bg-gray-300 transition-colors py-2 px-4 rounded mt-2"
                        >
                            Print Invoice
                        </Button>

                        <Button
                            type="button"
                            className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 px-4 rounded"
                            onClick={handleOpenConfirmDialog}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Processing" : "Confirm Payment"}
                        </Button>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex flex-row gap-1 items-center">
                            <Filter /> Filter
                        </DialogTitle>
                        <Separator className="w-full" />
                    </DialogHeader>
                    <form onSubmit={handleFilterSubmit} className="mt-4 space-y-4 flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            <Label className="font-bold my-3 text-base">Date Range</Label>
                            <DateRangePicker
                                value={filters.dateRange}
                                onChange={(dateRange) => setFilters({ ...filters, dateRange: dateRange || {} })}
                                placeholder="Select a date range"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="font-bold my-3 text-base">Status</Label>
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
                            Search
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {confirmDialog}
        </div>
    );

}