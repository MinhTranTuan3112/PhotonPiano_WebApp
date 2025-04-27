import { ActionFunctionArgs } from "@remix-run/node";
import { toggleNotificationStatus } from "~/lib/services/notification";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        const formData = await request.formData();

        const id = formData.get('id') as string;

        if (!id) {
            return {
                success: false,
                error: "Invalid request"
            }
        }   

        const response = await toggleNotificationStatus({ id, idToken });

        return {
            success: response.status === 204,
        }

    } catch (error) {

        console.log({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
            status
        }

    }
}
// Thêm loader để tránh Remix gọi /notification.data (tránh turbo stream)
export async function loader() {
    return Response.json({});
}