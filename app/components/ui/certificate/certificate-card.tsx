import { format } from "date-fns"
import { Calendar, Award, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../card"
import { Button } from "../button"
import { Badge } from "../badge"
import { Certificate } from "~/lib/types/certificate/certifcate"

type CertificateCardProps = {
    certificate: Certificate
    onClick: () => void
}

export default function CertificateCard({ certificate, onClick }: CertificateCardProps) {
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMMM d, yyyy")
        } catch (e) {
            return dateString
        }
    }

    const getGpaColor = (gpa: number) => {
        if (gpa >= 3.5) return "bg-green-100 text-green-800 border-green-200"
        if (gpa >= 2.5) return "bg-yellow-100 text-yellow-800 border-yellow-200"
        return "bg-red-100 text-red-800 border-red-200"
    }

    const getGpaLabel = (gpa: number) => {
        if (gpa >= 3.5) return "Xuất sắc"
        if (gpa >= 2.5) return "Khá"
        return "Đạt yêu cầu"
    }

    return (
        <Card
            className="overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group relative border-2 border-muted-foreground/10 hover:border-primary/30"
            onClick={onClick}
        >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-4 left-4 right-4 bottom-4 border-4 border-current"></div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full"></div>

            {/* Certificate seal */}
            <div className="absolute top-4 right-4 w-16 h-16 flex items-center justify-center">
                <div
                    className={`absolute inset-0 rounded-full ${certificate.gpa >= 3.5 ? "bg-green-100" : certificate.gpa >= 2.5 ? "bg-yellow-100" : "bg-red-100"
                        } opacity-20 scale-0 group-hover:scale-100 transition-transform duration-300`}
                ></div>
                <Award
                    className={`w-8 h-8 ${certificate.gpa >= 3.5 ? "text-green-600" : certificate.gpa >= 2.5 ? "text-yellow-600" : "text-red-600"
                        }`}
                />
            </div>

            <CardHeader className="pb-2 pt-6">
                <div className="space-y-1.5">
                    <Badge className={`mb-2 ${getGpaColor(certificate.gpa)}`}>
                        {getGpaLabel(certificate.gpa)} • GPA: {certificate.gpa.toFixed(1)}
                    </Badge>
                    <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
                        {certificate.className}
                    </CardTitle>
                    <CardDescription className="text-base">{certificate.levelName}</CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-3 py-2">
                    <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        <span>Hoàn thành ngày {formatDate(certificate.completionDate)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        <span>Mã chứng chỉ #{certificate.studentClassId.substring(0, 8)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-2 pb-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors border-primary/30"
                >
                    Xem chi tiết
                </Button>
            </CardFooter>
        </Card>
    )
}
