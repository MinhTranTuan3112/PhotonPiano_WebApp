import { ActionFunctionArgs } from "@remix-run/node";
import { rollBackScorePublishing } from "~/lib/services/student-class";
import { getErrorDetailsInfo } from "~/lib/utils/error";
import { formEntryToString } from "~/lib/utils/form";

export async function action({ request }: ActionFunctionArgs) {
    try {
        if (request.method !== "POST") {
            return {
                success: false,
                error: 'Method not allowed.',
                status: 405
            };
        }
        const formData = await request.formData();
        const classId = formEntryToString(formData.get("classId"));
        const idToken = formEntryToString(formData.get("idToken"));

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
        const response = await rollBackScorePublishing({ classId, idToken });
        return Response.json({
            success: true
        }, {
            status: 200
        })
    }
    catch (error) {
        const errorDetails = getErrorDetailsInfo(error);
        return Response.json({
            success: false,
            error: errorDetails.message,
            status: errorDetails.status
        }, {
            status: 400
        })
    }
}