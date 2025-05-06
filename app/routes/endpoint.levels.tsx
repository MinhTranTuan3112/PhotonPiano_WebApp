import { ActionFunctionArgs } from "@remix-run/node";
import { fetchDeleteLevel } from "~/lib/services/level";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { formEntryToString } from "~/lib/utils/form";

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const {idToken} = await requireAuth(request)

        const formData = await request.formData();

        const fallBackLevelId = formEntryToString(formData.get("fallBackLevelId"))
        const id = formEntryToString(formData.get("id"))

        if (!fallBackLevelId || !id) {
            return { success: false, error: "Invalid data", status : 400 };
        }
        console.log(fallBackLevelId)
        console.log(id)

        await fetchDeleteLevel({ idToken, fallBackLevelId, id })

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