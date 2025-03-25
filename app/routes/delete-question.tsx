import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchDeleteQuestion } from "~/lib/services/survey-question";
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

        const id = formData.get('id') as string;

        if (!id) {
            throw new Error('Id không được để trống');
        }

        const response = await fetchDeleteQuestion({ idToken, id });

        return {
            success: response.status === 204
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            message,
            status
        }
    }
}