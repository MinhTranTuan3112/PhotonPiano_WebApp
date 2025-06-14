import { ActionFunctionArgs } from "@remix-run/node";
import { fetchDeleteStudentClass } from "~/lib/services/class";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo } from "~/lib/utils/error";
import { formEntryToString } from "~/lib/utils/form";

export async function action({ request }: ActionFunctionArgs) {
    try {
        if (request.method !== "DELETE") {
            return {
                success: false,
                error: 'Method not allowed.',
                status: 405
            };
        }

        const { idToken } = await requireAuth(request)

        const formData = await request.formData();
        const studentId = formEntryToString(formData.get("studentId"));
        const classId = formEntryToString(formData.get("classId"));
        const isExpelled = formEntryToString(formData.get("isExpelled")) === "true";

        if (!idToken) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        if (!studentId || !classId) {
            return {
                success: false,
                error: 'Invalid data.',
                status: 400
            }
        }

        const response = await fetchDeleteStudentClass({
            classId,
            studentId,
            isExpelled,
            idToken: idToken
        });

        return {
            success: true
        }
    } catch (err){
        const error = getErrorDetailsInfo(err)
        return {
            success : false,
            error : error.message,
            status : error.status
        }
    }
    
  };