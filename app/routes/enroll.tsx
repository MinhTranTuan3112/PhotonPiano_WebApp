import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchEnrollInEntranceTest } from "~/lib/services/entrance-tests";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {

    try {

        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        const authData = await requireAuth(request);

        if (authData.role !== Role.Student) {
            return redirect('/');
        }

        const response = await fetchEnrollInEntranceTest({
            idToken: authData.idToken,
            returnUrl: `${baseUrl}/payment-result/success`
        });

        const data = await response.data;

        const paymentUrl = data.url as string;

        return redirect(paymentUrl);

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message
        }, {
            status
        })

    }

}