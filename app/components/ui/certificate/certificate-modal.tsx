import { CheckCircle2, Download, FileText, Award, Calendar, User, BookOpen, GraduationCap } from "lucide-react"
import type { Certificate } from "~/lib/types/certificate/certifcate"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../dialog"
import { Button } from "../button"
import { ScrollArea } from "../scroll-area"
import { Badge } from "../badge"
import { cn } from "~/lib/utils"

type CertificateModalProps = {
    certificate: Certificate | null
    isOpen: boolean
    onClose: () => void
}

export function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
    if (!certificate) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thông tin chứng chỉ</DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center text-muted-foreground">Không có chứng chỉ</div>
                    <DialogFooter>
                        <Button onClick={onClose}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    // Format date to display in a more readable format
    const formattedDate = new Date(certificate.completionDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Chứng chỉ hoàn thành</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[500px] w-full rounded-md">
                    <div className="p-6 border-4 border-double rounded-lg bg-card">
                        {/* Certificate Header */}
                        <div className="flex flex-col items-center mb-6 relative">
                            <div className="absolute -top-6 -left-6 -right-6 -bottom-6 border-2 border-primary/20 rounded-lg pointer-events-none" />
                            <Award className="h-16 w-16 text-primary mb-2" />
                            <h1 className="text-3xl font-bold text-center mb-1">{certificate.studentName}</h1>
                            <p className="text-muted-foreground text-center">Đã hoàn thành xuất sắc</p>
                        </div>

                        {/* Course Information */}
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-semibold mb-2">{certificate.className}</h2>
                            <p className="text-lg text-muted-foreground">{certificate.levelName}</p>
                        </div>

                        {/* Certificate Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Học viên</p>
                                        <p className="font-medium">{certificate.studentName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Giảng viên</p>
                                        <p className="font-medium">{certificate.instructorName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày hoàn thành</p>
                                        <p className="font-medium">{formattedDate}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cấp độ</p>
                                        <p className="font-medium">{certificate.levelName}</p>
                                    </div>
                                </div>

                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">Điểm trung bình</span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-bold text-lg px-3 py-1",
                                                certificate.gpa >= 9
                                                    ? "bg-green-100 text-green-800 border-green-300"
                                                    : certificate.gpa >= 7
                                                        ? "bg-blue-100 text-blue-800 border-blue-300"
                                                        : "bg-amber-100 text-amber-800 border-amber-300",
                                            )}
                                        >
                                            {certificate.gpa.toFixed(1)}
                                        </Badge>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2.5">
                                        <div
                                            className="bg-primary h-2.5 rounded-full"
                                            style={{ width: `${(certificate.gpa / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Kỹ năng đạt được</h3>
                            <div className="flex flex-wrap gap-2">
                                {certificate.skillsEarned.map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Certificate ID */}
                        <div className="text-center text-sm text-muted-foreground border-t pt-4">
                            <p>Mã chứng chỉ: {certificate.studentClassId}</p>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        className="w-full"
                        onClick={() => window.open(certificate.certificateUrl, "_blank")}
                        disabled={!certificate.certificateUrl}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Xem chứng chỉ HTML
                    </Button>
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => window.open(`/endpoint/certificates/${certificate.studentClassId}/pdf`, "_blank")}
                        disabled={!certificate.certificateUrl}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Tải xuống PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
