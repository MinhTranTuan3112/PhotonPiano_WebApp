import { LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, useAsyncValue, useLoaderData } from "@remix-run/react";
import { Music } from "lucide-react";
import { Suspense, useState } from "react";
import { DraggableLevels } from "~/components/level/draggable-levels"
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { fetchLevels } from "~/lib/services/level";
import { Level, Role } from "~/lib/types/account/account"
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const promise = fetchLevels().then((response) => {
            const levelsPromise: Promise<Level[]> = response.data;

            return {
                levelsPromise
            }
        });

        return {
            promise
        }

    } catch (error) {
        console.error(error);

        if (isRedirectError(error)) {
            throw error;
        }
        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function LevelsManagementPage({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    return (
        <article className="px-10">
            <div className="flex items-center gap-3 mb-4">
                <Music className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Manage Levels</h3>
                    <p className="text-sm text-sky-600">Each Level Presents A Node In The Learning Path</p>
                </div>
            </div>

            <div className="my-3 md:max-w-[50%]">
                <Suspense fallback={<Skeleton className="w-full h-full" />} key={'levels'}>
                    <Await resolve={promise}>
                        {({ levelsPromise }) => (
                            <Await resolve={levelsPromise}>
                                <LevelsContent />
                            </Await>
                        )}
                    </Await>
                </Suspense>
            </div>
        </article>
    )
}

function LevelsContent() {

    const initialLevels = useAsyncValue() as Level[];

    const [levels, setLevels] = useState(initialLevels);

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Save levels order?',
        confirmText: 'Save',
        onConfirm: () => {
            console.log('Saving levels: ', levels);
        },
    })

    return <>
        <DraggableLevels levels={levels}
            setLevels={setLevels} />

        <div className="my-5 flex justify-center">
            <Button type="button" onClick={handleOpenConfirmDialog}>
                Save
            </Button>
        </div>

        {confirmDialog}
    </>
}