import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchDeleteEntranceTest } from "~/lib/services/entrance-tests";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";


export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect("/");
        }

        const formData = await request.formData();

        const entranceTestId = formData.get("entranceTestId") as string;

        if (!entranceTestId) {
            return Response.json({
                success: false,
                error: "Entrance test ID is required",
            }, {
                status: 400
            });
        }

        const response = await fetchDeleteEntranceTest({ id: entranceTestId, idToken });

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