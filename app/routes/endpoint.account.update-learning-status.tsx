import { type ActionFunctionArgs, json } from "@remix-run/node"
import { requireAuth } from "~/lib/utils/auth"
import { Role } from "~/lib/types/account/account"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { formEntryToString } from "~/lib/utils/form"
import { fetchUpdateLearningStatus } from "~/lib/services/class"

export async function action({ request }: ActionFunctionArgs) {
    try {
        if (request.method !== "POST") {
            return json(
                {
                    success: false,
                    error: "Method not allowed.",
                    status: 405,
                },
                { status: 405 },
            )
        }

        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Student) {
            return json(
                {
                    success: false,
                    error: "Unauthorized.",
                    status: 401,
                },
                { status: 401 },
            )
        }

        const formData = await request.formData()
        const continueLearning = formEntryToString(formData.get("continueLearning")) === "true"

        const response = await fetchUpdateLearningStatus({
            idToken,
            continueLearning,
        })

        return json({
            success: response.status === 200 || response.status === 204,
            message: "Learning status updated successfully",
        })
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)

        return json(
            {
                success: false,
                error: message,
                status,
            },
            { status: status || 500 },
        )
    }
}
