import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { getValidatedFormData } from "remix-hook-form";
import { z } from "zod";
import { resolver } from "~/components/entrance-tests/arrange-dialog";
import { fetchAutoArrangeEntranceTests } from "~/lib/services/entrance-tests";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { EntranceTestArrangementFormData } from "~/lib/utils/schemas";

const serverEntranceTestArrangementSchema = z.object({
    date: z.object({
        from: z.string({ message: 'Ngày thi không được để trống.' }),
        to: z.string({ message: 'Ngày thi không được để trống.' }),
    }, {
        message: 'Vui lòng chọn đợt thi.',
    }),
    shiftOptions: z.array(z.string()).optional(),
    studentIds: z.array(z.string()).min(1, { message: 'Vui lòng chọn ít nhất một học viên.' }),
});

type FormData = z.infer<typeof serverEntranceTestArrangementSchema>;

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<FormData>(request, zodResolver(serverEntranceTestArrangementSchema));

        if (errors) {
            console.log({ data });
            return { success: false, errors, defaultValues };
        }

        const { date, shiftOptions, studentIds } = data;

        const arrangeRequest = {
            startDate: date.from,
            endDate: date.to,
            shiftOptions: shiftOptions?.map(Number) || [],
            studentIds,
            idToken
        }
        
        const response = await fetchAutoArrangeEntranceTests({ ...arrangeRequest });

        return {
            success: response.status === 201
        }


    } catch (error) {

        console.error({ error });

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