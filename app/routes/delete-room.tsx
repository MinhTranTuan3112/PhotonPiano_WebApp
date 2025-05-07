import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchDeleteRoom } from "~/lib/services/rooms";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const formData = await request.formData();

        const id = formData.get('id') as string;

        if (!id) {
            return Response.json({
                success: false,
                error: 'Id is required'
            }, {
                status: 400
            });
        }

        const response = await fetchDeleteRoom({ idToken, id });
    
        return Response.json({
            success: true
        }, {
            status: 200
        })

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });

    }
}