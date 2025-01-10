import { LoaderFunctionArgs } from '@remix-run/node'
import { Await, useLoaderData, useNavigate } from '@remix-run/react'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { columns } from '~/components/entrance-tests/table/columns'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { Skeleton } from '~/components/ui/skeleton'
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test'
import { EntranceTestDetail } from '~/lib/types/entrance-test/entrance-test-detail'

type Props = {}

const getSampleEntranceTest = async (id: string): Promise<EntranceTestDetail> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        ...sampleEntranceTests[2],
        students: [],
        instructor: {
            status : 0,
            username: "HungDepTrai",
            address: "TN, ĐN",
            email: "thanhhung16082003@gmail.com",
            phone: "0987654321",
            avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
        },
    }
}

export async function loader({ params }: LoaderFunctionArgs) {

    const promise = getSampleEntranceTest(params.id!);

    return {
        promise
    }
}

export default function StaffEntranceTestsPage({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    const navigate = useNavigate();

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Chi tiết ca thi</h1>
            <p className='text-muted-foreground'>Thông tin chung</p>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {(entranceTest) => (
                        <div>

                        </div>
                    )}
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