import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { fetchCertificate } from "~/lib/services/certificate"
import { requireAuth } from "~/lib/utils/auth"

export async function loader({ request, params }: LoaderFunctionArgs) {
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
            throw new Response("Certificate HTML not found", { status: 404 })
        }
        return new Response(response.data.certificateHtml, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
            },
        })
    } catch (error) {
        console.error("Error fetching certificate HTML:", error)

        if (error instanceof Response) {
            throw error
        }

        // Otherwise, return a generic error
        throw new Response("Failed to load certificate HTML", { status: 500 })
    }
}
