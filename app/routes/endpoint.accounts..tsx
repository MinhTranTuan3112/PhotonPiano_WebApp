import { ActionFunctionArgs } from "@remix-run/node"
import { fetchCreateStaff, fetchCreateTeacher, fetchRoleAdmin } from "~/lib/services/account";
import { fetchToggleAccountStatus } from "~/lib/services/auth";
import { publishStudentClassScore } from "~/lib/services/class"
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo } from "~/lib/utils/error"
import { formEntryToNumber, formEntryToString } from "~/lib/utils/form"

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
        const action = formEntryToString(formData.get("action"))

        if (action == "ADD") {
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
            if (isTeacher) {
                await fetchCreateTeacher({ idToken, fullName, email, phone })
            } else {
                await fetchCreateStaff({ idToken, fullName, email, phone })
            }

            // Return success response
            return {
                success: true
            }
        } else if (action === "GRANT") {
            const { idToken } = await requireAuth(request)

            const accountFirebaseId = formEntryToString(formData.get("accountFirebaseId"))
            const role = formEntryToNumber(formData.get("role"))

            if (!accountFirebaseId || !role) {
                return {
                    success: false,
                    error: 'Invalid data.',
                    status: 400
                }
            }

            await fetchRoleAdmin({ idToken, accountFirebaseId, role })
            // Return success response
            return {
                success: true
            }
        } else if (action === "TOGGLE") {
            const { idToken } = await requireAuth(request)

            const id = formEntryToString(formData.get("firebaseUid"))

            if (!id) {
                return {
                    success: false,
                    error: 'Invalid data.',
                    status: 400
                }
            }

            await fetchToggleAccountStatus({ idToken, firebaseUid : id })
            // Return success response
            return {
                success: true
            }
        } else {
            return {
                success: false,
                error: "INVALID ACTION",
                status: 400
            }
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