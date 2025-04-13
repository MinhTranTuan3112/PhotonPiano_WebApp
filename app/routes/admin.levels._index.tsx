import { LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, useAsyncValue, useLoaderData } from "@remix-run/react";
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
            <h1 className="text-xl font-extrabold">Quản lý level piano đào tạo</h1>
            <p className='text-muted-foreground'>Danh sách các mức level trình độ piano được đào tạo ở trung tâm</p>

            <div className="my-3 md:max-w-[30%]">
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
        title: 'Xác nhận luu thứ tự level',
        description: 'Bạn có chắc chắn muốn lưu thứ tự level này không?',
        confirmText: 'Lưu',
        onConfirm: () => {
            console.log('Saving levels: ', levels);
        },
    })

    return <>
        <DraggableLevels levels={levels}
            setLevels={setLevels} />

        <div className="my-5 flex justify-center">
            <Button type="button" onClick={handleOpenConfirmDialog}>
                Lưu
            </Button>
        </div>

        {confirmDialog}
    </>
}