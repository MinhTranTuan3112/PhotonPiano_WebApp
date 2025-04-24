import { format } from "date-fns"
import { Award, Book, Calendar, Download, FileText, GraduationCap, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../dialog"
import { Badge } from "../badge"
import { Button } from "../button"
import { Certificate } from "~/lib/types/certificate/certifcate"

interface CertificateModalProps {
    certificate: Certificate | null
    isOpen: boolean
    onClose: () => void
}

export default function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
    if (!certificate) return null

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>{certificate.className}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGpaColor(certificate.gpa)} bg-opacity-10`}>
                            GPA: {certificate.gpa.toFixed(1)}
                        </span>
                    </DialogTitle>
                    <p className="text-muted-foreground">{certificate.levelName}</p>
                </DialogHeader>

                <div className="space-y-4 mt-2">
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
                            {/* <div className="flex items-center">
                                <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Mã chứng chỉ</p>
                                    <p className="font-medium">{certificate.studentClassId}</p>
                                </div>
                            </div> */}
                        </div>
                    </div>

                    {certificate.skillsEarned && certificate.skillsEarned.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium mb-2 flex items-center">
                                <Book className="mr-2 h-5 w-5" />
                                Kỹ năng đạt được
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {certificate.skillsEarned.map((skill: string, index: number) => (
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

                    <Button
                        className="w-full"
                        onClick={() => window.open(certificate.certificateUrl, "_blank")}
                        disabled={!certificate.certificateUrl}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Xem và tải xuống chứng chỉ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
