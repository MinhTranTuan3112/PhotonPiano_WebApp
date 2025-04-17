import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchDeleteStudentFromTest, fetchDeleteStudentsFromTest } from "~/lib/services/entrance-tests";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const formData = await request.formData();

        const testId = formData.get('testId') as string;
        const studentIds = formData.getAll('studentIds') as string[];

        if (!testId) {
            return Response.json({
                success: false,
                error: 'Test ID is required'
            })
        }

        if (!studentIds || studentIds.length === 0) {
            return Response.json({
                success: false,
                error: 'Student ID is required'
            })
        }

        const response = await fetchDeleteStudentsFromTest({ entranceTestId: testId, studentIds, idToken });

        return Response.json({
            success: true
        }, {
            status: 200
        });

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        });
    }
}