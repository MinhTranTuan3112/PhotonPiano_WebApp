import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useAsyncValue, useLoaderData, useSearchParams } from '@remix-run/react';
import { Suspense } from 'react'
import MyTestCard from '~/components/entrance-tests/my-test-card';
import Paginator from '~/components/paginator';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchEntranceTests } from '~/lib/services/entrance-tests';
import { Role } from '~/lib/types/account/account';
import { EntranceTest } from '~/lib/types/entrance-test/entrance-test';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url';

type Props = {}


export async function loader({ request }: LoaderFunctionArgs) {

  try {

    const { idToken, role } = await requireAuth(request);

    if (role !== Role.Student) {
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

export default function MyExams({ }: Props) {
  const { promise, query } = useLoaderData<typeof loader>();

  return (
    <div className='px-10'>
      <div className='font-bold text-2xl'>My tests</div>
      <div className=''>
        Make sure to keep track of the schedule for important entrance exams so you don't miss them!
      </div>
      <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
        <Await resolve={promise}>
          {({ entranceTestsPromise, metadata }) => (
            <Await resolve={entranceTestsPromise}>
              <StudentEntranceTests page={query.page} totalPage={metadata.totalPages} />
            </Await>
          )}
        </Await>
      </Suspense>
    </div>
  )
}

function StudentEntranceTests({
  page, totalPage
}: {
  page: number;
  totalPage: number;
}) {
  const entranceTestsValue = useAsyncValue();

  const entranceTests = entranceTestsValue as EntranceTest[];

  const [searchParams, setSearchParams] = useSearchParams();

  return <div className="py-4">
    {entranceTests.map(entranceTest => <MyTestCard entranceTest={entranceTest} key={entranceTest.id} />)}

    <div className="my-4">
      <Paginator page={page} totalPage={totalPage} onPageChanged={(newPage) => {
        const newSearchParams = new URLSearchParams(searchParams);

        newSearchParams.set('page', newPage.toString());

        setSearchParams(newSearchParams);
      }} />
    </div>
  </div>
}

function LoadingSkeleton() {
  return <div className="flex flex-col justify-center items-center  mb-4 mt-8 gap-6">
    <Skeleton className="h-[100px] w-full rounded-md" />
    <Skeleton className="h-[100px] w-full rounded-md" />
    <Skeleton className="h-[100px] w-full rounded-md" />
    <Skeleton className="h-[100px] w-full rounded-md" />
    <Skeleton className="h-[100px] w-full rounded-md" />
    <Skeleton className="h-[100px] w-full rounded-md" />
  </div>
}