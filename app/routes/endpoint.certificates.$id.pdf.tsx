import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { convertHtmlToPdf } from "~/lib/convert-html-to-pdf"
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

        let certificateHtml = response.data?.certificateHtml

        if (!certificateHtml) {
            const htmlUrl = new URL(`/endpoint/certificates/${certificateId}/html`, request.url)
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
        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="certificate-${certificateId}.pdf"`,
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
