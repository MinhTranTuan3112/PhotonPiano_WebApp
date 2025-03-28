import { ActionFunctionArgs } from "@remix-run/node";
import { boolean } from "zod";
import { fetchAddStudentsToClass, fetchDeleteStudentClass } from "~/lib/services/class";
import { ErrorSimple } from "~/lib/types/error";
import { getErrorDetailsInfo } from "~/lib/utils/error";

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
        const studentIds = formData.getAll("studentFirebaseIds").toString().split(',');
        const classId = formData.get("classId")?.toString();
        const isAutoFill = formData.get("isAutoFill")?.toString() === "true";
        const token = formData.get("idToken")?.toString();

        console.log(isAutoFill)

        if (!token) {
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


        const response = await fetchAddStudentsToClass({
            classId: classId,
            studentFirebaseIds: studentIds,
            isAutoFill: isAutoFill,
            idToken: token
        });

        return {
            success: true
        }
    } catch (err) {
        var error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }

};