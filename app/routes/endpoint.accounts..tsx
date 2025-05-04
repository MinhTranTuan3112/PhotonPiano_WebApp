import { ActionFunctionArgs } from "@remix-run/node"
import { fetchCreateStaff, fetchCreateTeacher } from "~/lib/services/account";
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
        const email = formEntryToString(formData.get("email"))
        const phone = formEntryToString(formData.get("phone"))
        const fullName = formEntryToString(formData.get("fullName"))
        const isTeacher = formEntryToString(formData.get("isTeacher")) === "true"
        const idToken = formEntryToString(formData.get("idToken"))

        // Validate inputs
        if (!idToken) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        if (!email || !phone || !fullName || (isTeacher == undefined)) {
            return {
                success: false,
                error: 'Invalid data.',
                status: 400
            }
        }
        if (isTeacher){
            await fetchCreateTeacher({idToken,fullName,email,phone})
        } else {
            await fetchCreateStaff({idToken,fullName,email,phone})
        }

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