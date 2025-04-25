import { ActionFunctionArgs } from "@remix-run/node"
import { publishStudentClassScore } from "~/lib/services/class"
import { getErrorDetailsInfo } from "~/lib/utils/error"
import { formEntryToString } from "~/lib/utils/form"

export async function action({ request }: ActionFunctionArgs) {
    try {
        if (request.method !== "POST") {
            return {
                success: false,
                error: 'Method not allowed.',
                status: 405
            };
        }

        const formData = await request.formData()
        const classId = formEntryToString(formData.get("classId"))
        const idToken = formEntryToString(formData.get("idToken"))

        // Validate inputs
        if (!idToken) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        if (!classId) {
            return {
                success: false,
                error: 'Invalid data.',
                status: 400
            }
        }

        const response = await publishStudentClassScore({ classId, idToken })

        // Return success response
        return {
            success: true
        }
    } catch (err) {
        const error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }
}