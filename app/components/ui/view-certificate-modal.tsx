import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Download, FileText, X } from "lucide-react"
import { Skeleton } from "~/components/ui/skeleton"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Certificate } from "~/lib/types/certificate/certifcate"

type CertificateModalProps = {
    isOpen: boolean
    onClose: () => void
    certificate: Certificate | null
}

export function CertificateModal({ isOpen, onClose, certificate }: CertificateModalProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"html" | "image">("html")
    const [htmlContent, setHtmlContent] = useState<string>("")

    useEffect(() => {
        if (certificate?.certificateHtml) {
            setHtmlContent(certificate.certificateHtml)
            setIsLoading(false)
        } else if (certificate) {
            setIsLoading(true)
        }
    }, [certificate])

    if (!certificate) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-xl">Certificate</DialogTitle>
                        <Button variant="outline" size="icon" onClick={onClose} title="Close">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="py-8 text-center text-muted-foreground">No certificate available</div>
                </DialogContent>
            </Dialog>
        )
    }

    const handleDownload = () => {
        // Create a temporary link to download the certificate
        const link = document.createElement("a")
        link.href = certificate.certificateUrl
        link.download = `Certificate_${certificate.studentName.replace(/\s+/g, "_")}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl">Certificate for {certificate.studentName}</DialogTitle>
                    <div className="flex items-center gap-2">
                        {certificate.certificateHtml && (
                            <Button
                                variant={viewMode === "html" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("html")}
                                className="text-xs"
                            >
                                HTML
                            </Button>
                        )}
                        <Button
                            variant={viewMode === "image" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("image")}
                            className="text-xs"
                        >
                            Image
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleDownload} title="Download Certificate">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {viewMode === "image" ? (
                    <div className="relative flex-1 overflow-auto min-h-[60vh] border rounded-md bg-muted/20">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        )}

                        <img
                            src={certificate.certificateUrl || "/placeholder.svg"}
                            className="w-full h-full object-contain"
                            onLoad={() => setIsLoading(false)}
                            title={`Certificate for ${certificate.studentName}`}
                            alt={`Certificate for ${certificate.studentName}`}
                        />
                    </div>
                ) : (
                    <ScrollArea className="flex-1 overflow-auto min-h-[60vh] border rounded-md bg-white">
                        {certificate.certificateHtml ? (
                            <div className="certificate-html-container" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">HTML version not available</div>
                        )}
                    </ScrollArea>
                )}

                <div className="flex justify-center mt-4 gap-2">
                    <Button
                        onClick={() => window.open(certificate.certificateUrl, "_blank")}
                        disabled={!certificate.certificateUrl}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        View Full Certificate
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.open(`/api/certificates/${certificate.studentClassId}/pdf`, "_blank")}
                        disabled={!certificate.certificateUrl}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
