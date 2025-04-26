import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Download, X } from "lucide-react"
import { Skeleton } from "~/components/ui/skeleton"

type CertificateModalProps = {
    isOpen: boolean
    onClose: () => void
    certificateUrl: string
    studentName: string
}

export function CertificateModal({ isOpen, onClose, certificateUrl, studentName }: CertificateModalProps) {
    const [isLoading, setIsLoading] = useState(true)

    const handleDownload = () => {
        // Create a temporary link to download the certificate
        const link = document.createElement("a")
        link.href = certificateUrl
        link.download = `Certificate_${studentName.replace(/\s+/g, "_")}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl">Certificate for {studentName}</DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleDownload} title="Download Certificate">
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={onClose} title="Close">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative flex-1 overflow-auto min-h-[60vh] border rounded-md bg-muted/20">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Skeleton className="h-full w-full" />
                        </div>
                    )}

                    <img
                        src={certificateUrl}
                        className="w-full h-full"
                        onLoad={() => setIsLoading(false)}
                        title={`Certificate for ${studentName}`}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
