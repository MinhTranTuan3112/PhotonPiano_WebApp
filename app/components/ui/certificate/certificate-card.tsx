import { format } from "date-fns"
import { Award, Download, FileText } from "lucide-react"
import { Certificate } from "~/lib/types/certificate/certifcate"
import { Card, CardContent, CardFooter, CardHeader } from "../card"
import { Button } from "../button"


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
        if (gpa >= 3.5) return "text-green-500"
        if (gpa >= 2.5) return "text-yellow-500"
        return "text-red-500"
    }

    return (
        <Card className="overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold">{certificate.className}</h3>
                        <p className="text-muted-foreground">{certificate.levelName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGpaColor(certificate.gpa)} bg-opacity-10`}>
                        GPA: {certificate.gpa.toFixed(1)}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-grow">
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                            <span className="text-muted-foreground mr-1">Hoàn thành:</span>
                            {formatDate(certificate.completionDate)}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
                <Button className="w-full" onClick={onClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Xem chứng chỉ
                </Button>
                <Button
                    className="w-full"
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/endpoint/certificates/${certificate.studentClassId}/pdf`, "_blank")
                    }}
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Tải xuống PDF
                </Button>
            </CardFooter>
        </Card>
    )
}
