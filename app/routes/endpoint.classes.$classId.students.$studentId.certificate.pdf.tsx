import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { convertHtmlToPdf } from "~/lib/convert-html-to-pdf"
import { fetchCertificate } from "~/lib/services/certificate"
import { requireAuth } from "~/lib/utils/auth"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { idToken } = await requireAuth(request)
    const classId = params.classId
    const studentId = params.studentId

    if (!classId) {
        throw new Response("Class ID is required", { status: 400 })
    }

    if (!studentId) {
        throw new Response("Student ID is required", { status: 400 })
    }

    try {
        const response = await fetchCertificate({
            classId,
            studentId,
            idToken,
        })

        let certificateHtml = response.data?.certificateHtml

        if (!certificateHtml) {
            const htmlUrl = new URL(`/endpoint/classes/${classId}/students/${studentId}/certificate/html`, request.url)
            const htmlResponse = await fetch(htmlUrl.toString(), {
                headers: {
                    Cookie: request.headers.get("Cookie") || "",
                },
            })

            if (!htmlResponse.ok) {
                throw new Response("Certificate HTML not found", { status: 404 })
            }

            certificateHtml = await htmlResponse.text()
        }

        const pdfBuffer = await convertHtmlToPdf(certificateHtml)
        const certificateData = response.data
        const courseName = certificateData?.className
            ? certificateData.className.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
            : "certificate"

        const studentName = certificateData?.studentName
            ? certificateData.studentName.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
            : "student"

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="certificate-${courseName}-${studentName}.pdf"`,
            },
        })
    } catch (error) {
        console.error("Error generating PDF certificate:", error)

        if (error instanceof Response) {
            throw error
        }
        return json(
            {
                error: "Failed to generate PDF certificate. Please try again later.",
            },
            { status: 500 },
        )
    }
}