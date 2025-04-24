import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchAddStudentsToEntranceTest } from "~/lib/services/entrance-tests";
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

        const studentIds = formData.getAll('studentIds') as string[];

        const entranceTestId = formData.get('entranceTestId') as string;

        const response = await fetchAddStudentsToEntranceTest({
            idToken,
            entranceTestId,
            studentIds
        });

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
        })
    }
}