import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { getValidatedFormData } from "remix-hook-form";
import LevelForm, { LevelFormData, levelSchema } from "~/components/level/level-form";
import { fetchCreateLevel } from "~/lib/services/level";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { toastWarning } from "~/lib/utils/toast-utils";

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        return {
            idToken
        }

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }
        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<LevelFormData>(request, zodResolver(levelSchema));

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchCreateLevel({
            ...data,
            nextLevelId: data.nextLevelId || '',
            idToken
        });

        return redirect('/admin/levels');

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

export default function CreateLevelPage({ }: Props) {

    const { idToken } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === false) {
            toastWarning('Failed to create level', {
                description: fetcher.data?.error,
                duration: 5000
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);


    return (
        <article className="px-10">

            <h3 className="text-xl font-bold">Create new level</h3>
            <p className="text-sm text-muted-foreground">
                Create a new piano level for the center. You can add all the details of the level here.
            </p>

            <div className="my-3">
                <LevelForm isEditing={false} fetcher={fetcher} isSubmitting={isSubmitting}
                    idToken={idToken} />
            </div>

        </article>
    )
}