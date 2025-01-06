import { LoaderFunctionArgs } from '@remix-run/node'
import { Await, useLoaderData, useNavigate } from '@remix-run/react'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { columns } from '~/components/entrance-tests/table/columns'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { Skeleton } from '~/components/ui/skeleton'
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test'

type Props = {}

async function getSampleEntranceTests() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return sampleEntranceTests;
}

export async function loader({ }: LoaderFunctionArgs) {

    const promise = getSampleEntranceTests();

    return {
        promise
    }
}

export default function StaffEntranceTestsPage({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    const navigate = useNavigate();

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Quản lý đợt thi đầu vào</h1>
            <p className='text-muted-foreground'>Danh sách đợt thi đầu vào dành cho học viên trước khi vào học ở trung tâm.</p>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {(entranceTests) => {
                        return <DataTable columns={columns} data={entranceTests} extraHeaderContent={
                            <Button variant={'default'} Icon={Plus} iconPlacement='right'
                                onClick={() => navigate('/staff/entrance-tests/create')}>Tạo</Button>
                        } />
                    }}
                </Await>
            </Suspense>
        </article>
    )
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}