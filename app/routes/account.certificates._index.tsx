import { json, LoaderFunctionArgs, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react";
import { ca } from "date-fns/locale";
import { Award } from "lucide-react";
import React from "react";
import CertificateCard from "~/components/ui/certificate/certificate-card";
import { CertificateModal } from "~/components/ui/certificate/certificate-modal";
import { fetchCertificate, fetchStudentCertificates } from "~/lib/services/certificate";
import { Role } from "~/lib/types/account/account";
import { Certificate } from "~/lib/types/certificate/certifcate";
import { requireAuth } from "~/lib/utils/auth";

export async function loader({ request }: LoaderFunctionArgs) {
    // Get the idToken from your auth system
    const { idToken, role } = await requireAuth(request);
    if (role !== Role.Student) {
        return redirect('/');
    }

    try {
        const response = await fetchStudentCertificates({ idToken });
        return json({
            certificates: response.data,
            error: null,
            idToken, // Include the idToken in the response
        })
    }
    catch (error) {
        console.error("Error fetching certificates:", error)
        return json({
            certificates: [],
            error: "Failed to load certificates. Please try again later.",
            idToken, // Include the idToken even in error case
        })
    }
}

export default function CertificateListPage() {
    const { certificates, error, idToken } = useLoaderData<typeof loader>()
    const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [certificateDetails, setCertificateDetails] = React.useState<Certificate | null>(null)

    // Function to handle certificate click
    const handleCertificateClick = async (certificate: Certificate) => {
        setSelectedCertificate(certificate)
        setIsLoading(true)
        setIsModalOpen(true)

        try {
            // We can use the existing certificate data for the initial modal display
            // setCertificateDetails(certificate)

            // Then fetch the full details if needed
            // This is optional - only needed if the certificate card data doesn't have all the details
            // const response = await fetchCertificate({
            //   studentClassId: certificate.studentClassId,
            //   idToken: /* You would need to get this from your auth context */
            // })
            // setCertificateDetails(response.data)\
            const response = await fetchCertificate({
                studentClassId: certificate.studentClassId,
                idToken: idToken /* You would need to get this from your auth context */
            });
            setCertificateDetails(response.data);
        } catch (error) {
            console.error("Error fetching certificate details:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCertificateDetails(null)
    }

    return (
        <div className="container mx-auto py-4 px-4">
            <div className="flex flex-col items-start gap-4 mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Chứng chỉ của tôi</h1>
                <p className="text-muted-foreground">
                    Xem và tải xuống các chứng chỉ thành tích từ các khóa học đã hoàn thành.
                </p>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
            ) : certificates.length === 0 ? (
                <div className="text-center py-12">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Chưa có chứng chỉ nào</h3>
                    <p className="text-muted-foreground mt-2">Hoàn thành các khóa học để nhận chứng chỉ.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((certificate: Certificate) => (
                        <CertificateCard
                            key={certificate.studentClassId}
                            certificate={certificate}
                            onClick={() => handleCertificateClick(certificate)}
                        />
                    ))}
                </div>
            )}

            {/* Certificate Modal */}
            <CertificateModal
                certificate={certificateDetails || selectedCertificate}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    )
}