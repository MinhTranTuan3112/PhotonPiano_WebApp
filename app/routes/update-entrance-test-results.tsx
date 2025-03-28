import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { getValidatedFormData } from "remix-hook-form";
import { fetchUpdateEntranceTestResults } from "~/lib/services/entrance-tests";
import { Role } from "~/lib/types/account/account";
import { UpdateEntranceTestResultsFormData, updateEntranceTestResultsSchema } from "~/lib/types/entrance-test/entrance-test-result";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff && role !== Role.Instructor) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<UpdateEntranceTestResultsFormData>(request, zodResolver(updateEntranceTestResultsSchema));

        console.log({ data });

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchUpdateEntranceTestResults({
            id: data.id,
            studentId: data.studentId,
            idToken,
            instructorComment: role === Role.Instructor ? data.instructorComment : undefined,
            theoraticalScore: role === Role.Staff ? data.theoraticalScore : undefined,
            updateScoreRequests: role === Role.Instructor ? data.scores.map(score => {
                return {
                    criteriaId: score.criteriaId,
                    score: score.score
                }
            }) : undefined
        });

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
            error: message,
            status
        }
    }
}