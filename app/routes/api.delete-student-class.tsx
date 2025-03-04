import { ActionFunctionArgs } from "@remix-run/node";
import { fetchDeleteStudentClass } from "~/lib/services/class";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "DELETE") {
        return {
            success: false,
            error: 'Method not allowed.',
            status : 405
        };
    }
  
    const formData = await request.formData();
    const studentId = formData.get("studentId")?.toString();
    const classId = formData.get("classId")?.toString();
    const token = formData.get("idToken")?.toString();
  
    if (!token){
        return {
            success: false,
            error: 'Unauthorized.',
            status : 401
        }
    }

    if (!studentId || !classId) {
        return {
            success: false,
            error: 'Invalid data.',
            status : 400
        }
    }
  
    const response = await fetchDeleteStudentClass({
        classId : classId,
        studentId : studentId,
        idToken : token
    });

    return {
        success: response.status === 204
    }
    
  };