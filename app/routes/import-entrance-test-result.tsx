import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { getValidatedFormData } from "remix-hook-form";
import { z } from "zod";
import { fetchUpdateStudentsEntranceTestResults } from "~/lib/services/entrance-tests";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

const importResultSchema = z.object({
    entranceTestId: z.string(),
    updateRequests: z.array(z.object({
        studentId: z.string(),
        theoraticalScore: z.number().min(0, { message: 'Theory score must be >= 0' }).max(10, { message: 'Theory score must be <= 10' }),
        instructorComment: z.string().optional(),
        scores: z.array(z.object({
            criteriaId: z.string(),
            score: z.number().min(0, { message: 'Score must be >= 0' }).max(10, { message: 'Score must be <= 10' })
        }))
    }))
});

export type ImportResultsFormData = z.infer<typeof importResultSchema>;

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff && role !== Role.Instructor) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<ImportResultsFormData>(request, zodResolver(importResultSchema));

        console.log({ data });

        data?.updateRequests.forEach((updateRequest) => {
            console.log({ updateRequest });

            console.log(updateRequest.scores);

        })

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchUpdateStudentsEntranceTestResults({ idToken, ...data });

        return Response.json({
            success: response.status === 204
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
        })
    }
}