import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, Link, useAsyncValue, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { CirclePlus, Music } from "lucide-react";
import { Suspense, useState } from "react";
import { DraggableLevels } from "~/components/level/draggable-levels"
import { Button, buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import useLoadingDialog from "~/hooks/use-loading-dialog";
import { fetchLevels, fetchUpdateLevelOrder } from "~/lib/services/level";
import { Level, Role } from "~/lib/types/account/account"
import { ActionResult } from "~/lib/types/action-result";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { formEntryToString } from "~/lib/utils/form";

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

export async function action({ request }: ActionFunctionArgs) {
    try {
        const { idToken } = await requireAuth(request)
        if (request.method !== "POST") {
            return {
                success: false,
                error: 'Method not allowed.',
                status: 405
            };
        }
        const formData = await request.formData();
        const levelOrderJson = (formData.get("levelOrders"));



        if (!levelOrderJson) {
            return {
                success: false,
                error: 'Invalid data.',
                status: 400
            }
        }
        const levelOrders = JSON.parse(levelOrderJson.toString()) as {
            id: string
            nextLevelId?: string,
        }[];
        // console.log(levelOrders)

        await fetchUpdateLevelOrder({ idToken, levelOrders });

        return Response.json({
            success: true
        }, {
            status: 200
        })
    }
    catch (error) {
        const errorDetails = getErrorDetailsInfo(error);
        return Response.json({
            success: false,
            error: errorDetails.message,
            status: errorDetails.status
        }, {
            status: 400
        })
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


            <div className="my-3 flex justify-end">
                <Link to={'/admin/levels/create'} className={`${buttonVariants({ variant: 'theme' })} flex flex-row gap-1 items-center`}>
                    <CirclePlus /> Create new level
                </Link>
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

    const fetcher = useFetcher<ActionResult>();

    const [searchParams, setSearchParams] = useSearchParams();

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Save levels order?',
        confirmText: 'Save',
        onConfirm: () => {
            console.log('Saving levels: ', levels);
            compileLevel()
        },
    })

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setSearchParams([...searchParams])
        }
    })

    const compileLevel = () => {
        const levelOrders = levels.map((lvl, index) => ({
            id: lvl.id,
            nextLevelId: index < levels.length - 1 ? levels[index + 1].id : null
        }));

        fetcher.submit({
            levelOrders: JSON.stringify(levelOrders),
        }, {
            method: 'POST'
        })
    }

    return <>
        <DraggableLevels levels={levels}
            setLevels={setLevels} />

        <div className="my-5 flex justify-center">
            <Button type="button" onClick={handleOpenConfirmDialog} variant={'theme'}>
                Save
            </Button>
        </div>

        {confirmDialog}
        {loadingDialog}
    </>
}