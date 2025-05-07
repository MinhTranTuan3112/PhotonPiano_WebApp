import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { useState } from "react"
import {
    Award,
    Calendar,
    Download,
    FileText,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    User,
    BookOpen,
    CheckCircle2,
} from "lucide-react"
import { fetchCertificate, fetchStudentCertificates } from "~/lib/services/certificate"
import { Role } from "~/lib/types/account/account"
import type { Certificate } from "~/lib/types/certificate/certifcate"
import { requireAuth } from "~/lib/utils/auth"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { cn } from "~/lib/utils"

export async function loader({ request }: LoaderFunctionArgs) {
    // Get the idToken from your auth system
    const { idToken, role } = await requireAuth(request)
    if (role !== Role.Student) {
        return redirect("/")
    }

    try {
        const response = await fetchStudentCertificates({ idToken })
        return json({
            certificates: response.data,
            error: null,
            idToken,
        })
    } catch (error) {
        console.error("Error fetching certificates:", error)
        return json({
            certificates: [],
            error: "Failed to load certificates. Please try again later.",
            idToken,
        })
    }
}

export default function CertificateListPage() {
    const { certificates, error, idToken } = useLoaderData<typeof loader>()
    const [searchTerm, setSearchTerm] = useState("")
    const [expandedCertificateId, setExpandedCertificateId] = useState<string | null>(null)
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Filter certificates based on search term
    const filteredCertificates = certificates.filter(
        (cert: Certificate) =>
            cert.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.levelName.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMMM yyyy")
        } catch (e) {
            return dateString
        }
    }

    const handleCertificateClick = async (certificate: Certificate) => {
        // Toggle expanded state
        if (expandedCertificateId === certificate.studentClassId) {
            setExpandedCertificateId(null)
            return
        }

        setExpandedCertificateId(certificate.studentClassId)
        setIsLoading(true)

        try {
            const response = await fetchCertificate({
                studentClassId: certificate.studentClassId,
                idToken,
            })
            setSelectedCertificate(response.data)
        } catch (error) {
            console.error("Error fetching certificate details:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getGpaColor = (gpa: number) => {
        if (gpa >= 9) return "bg-green-100 text-green-800 border-green-300"
        if (gpa >= 7) return "bg-blue-100 text-blue-800 border-blue-300"
        return "bg-amber-100 text-amber-800 border-amber-300"
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    View and download achievement certificates from completed courses at Photon Piano Academy.
                </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search certificates..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>

            {/* Error State */}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

            {/* Empty State */}
            {!error && filteredCertificates.length === 0 && (
                <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                    <Award className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No certificates yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Complete courses to receive achievement certificates from Photon Piano Academy.
                    </p>
                </div>
            )}

            {/* Certificates List */}
            {filteredCertificates.length > 0 && (
                <div className="space-y-6">
                    {filteredCertificates.map((certificate: Certificate) => (
                        <div
                            key={certificate.studentClassId}
                            className={cn(
                                "border rounded-lg overflow-hidden transition-all duration-300",
                                expandedCertificateId === certificate.studentClassId
                                    ? "border-primary/50 shadow-lg"
                                    : "hover:border-primary/30 hover:shadow-md",
                            )}
                        >
                            {/* Certificate Header - Always visible */}
                            <div
                                className={cn(
                                    "p-6 cursor-pointer",
                                    expandedCertificateId === certificate.studentClassId
                                        ? "bg-gradient-to-r from-primary/5 to-transparent"
                                        : "",
                                )}
                                onClick={() => handleCertificateClick(certificate)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                                            <Award className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">{certificate.className}</h3>
                                            <p className="text-muted-foreground">{certificate.levelName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(certificate.completionDate)}</span>
                                        </div>

                                        <Badge variant="outline" className={cn("px-3 py-1 font-medium", getGpaColor(certificate.gpa))}>
                                            GPA: {certificate.gpa.toFixed(1)}
                                        </Badge>

                                        {expandedCertificateId === certificate.studentClassId ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Certificate Details */}
                            {expandedCertificateId === certificate.studentClassId && (
                                <div className="border-t">
                                    {isLoading ? (
                                        <div className="p-6 text-center">
                                            <div className="animate-pulse flex flex-col items-center">
                                                <div className="h-8 w-8 bg-primary/20 rounded-full mb-4"></div>
                                                <div className="h-4 w-48 bg-primary/20 rounded mb-2"></div>
                                                <div className="h-4 w-32 bg-primary/20 rounded"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* Left Column - Certificate Preview */}
                                                <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                                                    <div className="relative p-6 bg-white">
                                                        {/* Gold Border Design */}
                                                        <div className="absolute inset-0 border-[12px] border-[#e6c460] rounded-lg">
                                                            <div className="absolute inset-0 border-[1px] border-[#e6c460]"></div>
                                                        </div>

                                                        {/* Corner Accent */}
                                                        <div className="absolute top-0 right-0 w-[100px] h-[100px]">
                                                            <div className="absolute top-0 right-0 w-full h-full bg-[#1e3a5f] rounded-bl-[150px]"></div>
                                                            <div className="absolute top-0 right-0 w-[95px] h-[95px] border-l-[2px] border-b-[2px] border-[#e6c460] rounded-bl-[150px]"></div>
                                                        </div>

                                                        {/* Certificate Content */}
                                                        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-8 pb-4">
                                                            <div className="text-center mb-4">
                                                                <h2 className="text-lg font-serif text-[#333]">Photon Piano Academy</h2>
                                                                <h1 className="text-2xl font-bold font-serif text-[#1e3a5f]">
                                                                    CERTIFICATE OF COMPLETION
                                                                </h1>
                                                                <p className="text-sm text-[#555]">This certifies that</p>
                                                            </div>

                                                            <div className="w-full max-w-md mb-4">
                                                                <h2 className="text-3xl font-bold font-serif text-center italic text-[#1e3a5f] border-b border-[#e6c460] pb-2 mb-3">
                                                                    {selectedCertificate?.studentName || certificate.studentName}
                                                                </h2>

                                                                <p className="text-center text-sm leading-relaxed mb-3">
                                                                    Has successfully completed the {certificate.className} course at Photon Piano Academy,
                                                                    demonstrating proficiency in piano performance at the{" "}
                                                                    <strong>{certificate.levelName}</strong> level.
                                                                </p>
                                                            </div>

                                                            {/* Footer with signature */}
                                                            <div className="flex justify-between w-full max-w-md mt-auto text-xs">
                                                                <div className="text-center">
                                                                    <div className="h-8 mb-1">
                                                                        {/* Seal icon */}
                                                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#e6c460] border-2 border-[#1e3a5f]">
                                                                            <span className="text-[#1e3a5f] text-[8px] font-bold">SEAL</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-600">{formatDate(certificate.completionDate)}</p>
                                                                </div>

                                                                <div className="text-center">
                                                                    <div className="h-8 mb-1 border-b border-gray-300">
                                                                        {/* Signature would go here */}
                                                                    </div>
                                                                    <p className="font-medium">{selectedCertificate?.instructorName || "Instructor"}</p>
                                                                    <p className="text-[10px] text-gray-600">Instructor</p>
                                                                </div>

                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center h-8 mb-1">
                                                                        <div className="text-xl font-bold text-[#1e3a5f]">{certificate.gpa.toFixed(1)}</div>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-600">GPA</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column - Certificate Details */}
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-semibold border-b pb-2">Certificate Details</h3>

                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-5 w-5 text-primary" />
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Student</p>
                                                                    <p className="font-medium">
                                                                        {selectedCertificate?.studentName || certificate.studentName}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <BookOpen className="h-5 w-5 text-primary" />
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Course</p>
                                                                    <p className="font-medium">{certificate.className}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-5 w-5 text-primary" />
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Completion Date</p>
                                                                    <p className="font-medium">{formatDate(certificate.completionDate)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedCertificate?.skillsEarned && selectedCertificate.skillsEarned.length > 0 && (
                                                        <div>
                                                            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Skills Earned</h3>
                                                            <ScrollArea className="h-[120px]">
                                                                <div className="space-y-2">
                                                                    {selectedCertificate.skillsEarned.map((skill, index) => (
                                                                        <div key={index} className="flex items-start gap-2">
                                                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                                                            <span className="text-sm">{skill}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-3">
                                                        <Button
                                                            className="w-full"
                                                            onClick={() => window.open(certificate.certificateUrl, "_blank")}
                                                            disabled={!certificate.certificateUrl}
                                                        >
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            View Certificate
                                                        </Button>
                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            onClick={() =>
                                                                window.open(`/endpoint/certificates/${certificate.studentClassId}/pdf`, "_blank")
                                                            }
                                                            disabled={!certificate.certificateUrl}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download PDF
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}