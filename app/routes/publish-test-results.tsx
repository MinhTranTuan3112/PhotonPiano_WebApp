import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchUpdateEntranceTest } from "~/lib/services/entrance-tests";
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
            throw new Error('ID is required');
        }

        const isAnnouncedScore = formData.get('isAnnouncedScore') as string;

        if (!isAnnouncedScore) {
            throw new Error('isAnnouncedScore is required');
        }

        const response = await fetchUpdateEntranceTest({
            idToken,
            id,
            isAnnouncedScore: isAnnouncedScore === 'true'
        });

        return Response.json({
            success: response.status === 200,
        }, {
            status: 200
        })

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