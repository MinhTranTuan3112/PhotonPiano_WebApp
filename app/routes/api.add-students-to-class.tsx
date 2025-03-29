import { ActionFunctionArgs } from "@remix-run/node";
import { boolean } from "zod";
import { fetchAddStudentsToClass, fetchDeleteStudentClass } from "~/lib/services/class";
import { ErrorSimple } from "~/lib/types/error";
import { getErrorDetailsInfo } from "~/lib/utils/error";
import { formEntryToString, formEntryToStrings } from "~/lib/utils/form";

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
        const studentIds = formEntryToStrings(formData.getAll("studentFirebaseIds").toString());
        const classId = formEntryToString(formData.get("classId"));
        const isAutoFill = formEntryToString(formData.get("isAutoFill")) === "true";
        const token = formEntryToString(formData.get("idToken"));

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