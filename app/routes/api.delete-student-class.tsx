import { ActionFunctionArgs } from "@remix-run/node";
import { fetchDeleteStudentClass } from "~/lib/services/class";
import { getErrorDetailsInfo } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {
    try {
        if (request.method !== "DELETE") {
            return {
                success: false,
                error: 'Method not allowed.',
                status: 405
            };
        }

        const formData = await request.formData();
        const studentId = formData.get("studentId")?.toString();
        const classId = formData.get("classId")?.toString();
        const token = formData.get("idToken")?.toString();

        if (!token) {
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
            classId: classId,
            studentId: studentId,
            idToken: token
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