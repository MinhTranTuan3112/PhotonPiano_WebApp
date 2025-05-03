import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import puppeteer from "puppeteer"
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

        if (!response.data || !response.data.certificateHtml) {
            const htmlUrl = new URL(`/endpoint/certificates/${certificateId}/html`, request.url)
            const htmlResponse = await fetch(htmlUrl.toString(), {
                headers: {
                    Cookie: request.headers.get("Cookie") || "",
                },
            })

            if (!htmlResponse.ok) {
                throw new Response("Certificate HTML not found", { status: 404 })
            }

            const certificateHtml = await htmlResponse.text()

            const pdfBuffer = await convertHtmlToPdf(certificateHtml)

            return new Response(pdfBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="certificate-${certificateId}.pdf"`,
                },
            })
        }

        const pdfBuffer = await convertHtmlToPdf(response.data.certificateHtml)
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

async function convertHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
        const page = await browser.newPage()
        await page.setContent(html, {
            waitUntil: "networkidle0",
        })

        // Set page size to A4 for certificates
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0.5cm",
                right: "0.5cm",
                bottom: "0.5cm",
                left: "0.5cm",
            },
        })

        return Buffer.from(pdfBuffer)
    } finally {
        await browser.close()
    }
}
