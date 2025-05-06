import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, isRouteErrorResponse, Link, useLoaderData, useLocation, useNavigate, useRouteError, useSearchParams } from '@remix-run/react'
import { CirclePlus, Music2, RotateCcw } from 'lucide-react'
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
            sortColumn: searchParams.get('column') || 'CreatedAt',
            orderByDesc: searchParams.get('desc') ? searchParams.get('desc') === 'true' : true,
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
                query
            }
        });

        return {
            promise,
            query
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

    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <Music2 className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Manage tests</h3>
                    <p className="text-sm text-sky-600">List of tests in the center.</p>
                </div>
            </div>
            <SearchForm searchParams={searchParams} role={Role.Staff}/>
            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={promise}>
                    {({ entranceTestsPromise, metadata }) => (
                        <Await resolve={entranceTestsPromise}>
                            <GenericDataTable columns={columns} extraHeaderContent={
                                <Button variant={'outline'} Icon={CirclePlus} iconPlacement='left'
                                    onClick={() => navigate('../entrance-tests/create')}>
                                    Create new test
                                </Button>
                            } metadata={metadata}
                                emptyText='No test found.' />
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
            <h1 className="text-xl font-extrabold">Manage tests</h1>
            <p className='text-muted-foreground'>List of tests in the center.</p>
            {/* <SearchForm /> */}
            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Có lỗi đã xảy ra.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                        flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Retry
                </Link>
            </div>
        </article>
    );
}