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
    console.log("Node ENV:", process.env.NODE_ENV);
    console.log("Puppeteer executable path:", process.env.PUPPETEER_EXECUTABLE_PATH || "default");
    const browser = await puppeteer.launch({
        headless: true, // Use the new headless mode
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage", // Overcome limited resource problems
            "--disable-gpu", // Often necessary in Linux environments
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials"
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    try {
        const page = await browser.newPage();

        // Add better error handling for page content loading
        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 30000, // 30 seconds timeout
        });

        // Set viewport size before generating PDF
        await page.setViewport({
            width: 1240,
            height: 1754, // Approximately A4 size at 96 DPI
            deviceScaleFactor: 1,
        });

        // Generate PDF with improved settings
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0.5cm",
                right: "0.5cm",
                bottom: "0.5cm",
                left: "0.5cm",
            },
            timeout: 60000, // 60 seconds timeout for PDF generation
        });

        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error("PDF generation error details:", error);
        throw error;
    } finally {
        await browser.close();
    }
}