import { json, LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { format } from "date-fns"
import { ArrowLeft, Award, Book, Calendar, Download, FileText, GraduationCap, Link, User } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { fetchCertificate } from "~/lib/services/certificate"
import { requireAuth } from "~/lib/utils/auth"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the idToken from your auth system
    const { idToken } = await requireAuth(request)
    const certificateId = params.id

    if (!certificateId) {
        throw new Response("Certificate ID is required", { status: 400 })
    }

    try {
        const response = await fetchCertificate({
            studentClassId: certificateId,
            idToken: idToken,
        })

        return json({ certificate: response.data, error: null })
    } catch (error) {
        console.error("Error fetching certificate:", error)
        return json({
            certificate: null,
            error: "Failed to load certificate. Please try again later.",
        })
    }
}

export default function CertificateDetailPage() {
    const { certificate, error } = useLoaderData<typeof loader>()

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMMM d, yyyy")
        } catch (e) {
            return dateString
        }
    }

    const getGpaColor = (gpa: number) => {
        if (gpa >= 3.5) return "text-green-500"
        if (gpa >= 2.5) return "text-yellow-500"
        return "text-red-500"
    }

    if (error) {
        return (
            <div className="container mx-auto py-4 px-4">
                <Link to="/account/certificates">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </Link>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
            </div>
        )
    }

    if (!certificate) {
        return (
            <div className="container mx-auto py-4 px-4">
                <Link to="/account/certificates">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </Link>
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium">Không tìm thấy chứng chỉ</h3>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-4 px-4">
            <Link to="/account/certificates">
                <Button variant="ghost" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>
            </Link>

            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold tracking-tight mb-6">Chi tiết chứng chỉ</h1>

                <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold">{certificate.className}</h2>
                                <p className="text-muted-foreground">{certificate.levelName}</p>
                            </div>
                            <div
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getGpaColor(certificate.gpa)} bg-opacity-10`}
                            >
                                GPA: {certificate.gpa.toFixed(1)}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <User className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Học viên</p>
                                        <p className="font-medium">{certificate.studentName || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <GraduationCap className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Giảng viên</p>
                                        <p className="font-medium">{certificate.instructorName || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày hoàn thành</p>
                                        <p className="font-medium">{formatDate(certificate.completionDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Mã chứng chỉ</p>
                                        <p className="font-medium">{certificate.studentClassId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {certificate.skillsEarned && certificate.skillsEarned.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium mb-2 flex items-center">
                                    <Book className="mr-2 h-5 w-5" />
                                    Kỹ năng đạt được
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {certificate.skillsEarned.map((skill: any, index: any) => (
                                        <Badge key={index} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="aspect-[1.414/1] bg-muted rounded-lg flex items-center justify-center">
                            {certificate.certificateUrl ? (
                                <img
                                    src={certificate.certificateUrl || "/placeholder.svg"}
                                    alt="Certificate Preview"
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Xem trước chứng chỉ</h3>
                                    <p className="text-muted-foreground">Nhấn nút bên dưới để xem và tải xuống chứng chỉ của bạn</p>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" onClick={() => window.open(certificate.certificateUrl, "_blank")}>
                            <Download className="mr-2 h-4 w-4" />
                            Xem và tải xuống chứng chỉ
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
