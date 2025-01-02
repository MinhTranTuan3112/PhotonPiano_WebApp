import { ActionFunctionArgs } from "@remix-run/node";
import { fetchSendForgotPasswordEmail } from "~/lib/services/auth";
import { getErrorDetailsInfo } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {

    try {

        const formData = await request.formData();

        const action = formData.get('authAction') as string;

        switch (action.toLowerCase()) {
            case 'send_forgotpassword_email':
                // Handle forgot password
                const email = formData.get('email') as string;
                if (!email) {
                    return {
                        success: false,
                        error: 'Email không được để trống',
                    }
                }

                const response = await fetchSendForgotPasswordEmail(email);

                return {
                    success: response.status === 200
                }

            default:
                return {
                    success: false,
                    error: 'Invalid action',
                }
        }


    } catch (error) {

        console.error({ error });

        const { message } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message
        }
    }

}