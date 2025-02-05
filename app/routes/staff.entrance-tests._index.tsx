import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, isRouteErrorResponse, Link, useLoaderData, useLocation, useNavigate, useRouteError } from '@remix-run/react'
import { Plus, RotateCcw } from 'lucide-react'
import { Suspense } from 'react'
import SearchForm from '~/components/entrance-tests/search-form'
import { columns } from '~/components/entrance-tests/table/columns'
import { Button, buttonVariants } from '~/components/ui/button'
import GenericDataTable from '~/components/ui/generic-data-table'
import { Skeleton } from '~/components/ui/skeleton'
import { fetchEntranceTests } from '~/lib/services/entrance-tests'
import { Role } from '~/lib/types/account/account'
import { EntranceTest, sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { requireAuth } from '~/lib/utils/auth'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url'

type Props = {}

async function getSampleEntranceTests() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return sampleEntranceTests;
}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            keyword: trimQuotes(searchParams.get('q') || ''),
            shifts: getParsedParamsArray({ paramsValue: searchParams.get('shifts') }).map(Number),
            roomIds: getParsedParamsArray({ paramsValue: searchParams.get('roomIds') }).map(String),
            idToken
        };

        const promise = fetchEntranceTests({ ...query }).then((response) => {

            const entranceTestsPromise: Promise<EntranceTest[]> = response.data;

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                entranceTestsPromise,
                metadata,
                query: { ...query, idToken: undefined }
            }
        });

        return {
            promise,
            query: { ...query, idToken: undefined }
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

export default function StaffEntranceTestsPage({ }: Props) {

    const { promise, query } = useLoaderData<typeof loader>();

    const navigate = useNavigate();

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Quản lý đợt thi đầu vào</h1>
            <p className='text-muted-foreground'>Danh sách đợt thi đầu vào dành cho học viên trước khi vào học ở trung tâm.</p>
            <SearchForm />
            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={promise}>
                    {({ entranceTestsPromise }) => (
                        <Await resolve={entranceTestsPromise}>
                            <GenericDataTable columns={columns} extraHeaderContent={
                                <Button variant={'default'} Icon={Plus} iconPlacement='right'
                                    onClick={() => navigate('/staff/entrance-tests/create')}>Tạo</Button>
                            } />
                        </Await>
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

export function ErrorBoundary() {

    const error = useRouteError();

    const { pathname, search } = useLocation();

    return (
        <article className="px-10 pb-4">
            <h1 className="text-xl font-extrabold">Quản lý đợt thi đầu vào</h1>
            <p className='text-muted-foreground'>Danh sách đợt thi đầu vào dành cho học viên trước khi vào học ở trung tâm.</p>
            <SearchForm />
            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Có lỗi đã xảy ra.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                        flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Thử lại
                </Link>
            </div>
        </article>
    );
}