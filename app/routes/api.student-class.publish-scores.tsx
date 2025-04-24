import { type ActionFunctionArgs, json } from "@remix-run/node"
import { toast } from "sonner"
import { publishStudentClassScore } from "~/lib/services/class"
import type { ActionResult } from "~/lib/types/action-result"

export async function action({ request }: ActionFunctionArgs) {
    try {
        // Parse the form data
        const formData = await request.formData()
        const classId = formData.get("classId") as string
        const idToken = formData.get("idToken") as string

        // Validate inputs
        if (!classId || !idToken) {
            return json<ActionResult>(
                {
                    success: false,
                    error: "Missing required fields: classId or idToken",
                    status: 400,
                    data: null,
                },
                { status: 400 },
            )
        }

        // Call the service function to publish the scores
        const response = await publishStudentClassScore({ classId, idToken })

        // Return success response
        return json<ActionResult>({
            success: true,
            error: "",
            status: 200,
            data: response.data,
        })
    } catch (error) {
       toast("An error occurred while publishing scores. Please try again." )

        // Return error response
        return json<ActionResult>(
            {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
                status: 500,
                data: null,
            },
            {
                status: 500,
            },
        )
    }
}
