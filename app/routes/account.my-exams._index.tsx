import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useAsyncValue, useLoaderData, useSearchParams } from '@remix-run/react';
import { BookOpenCheck, UserRoundPlus } from 'lucide-react';
import { Suspense } from 'react'
import { NavigateOptions, URLSearchParamsInit } from 'react-router-dom';
import { useEnrolLDialog } from '~/components/entrance-tests/enroll-dialog';
import SearchForm from '~/components/entrance-tests/search-form';
import { TestCard } from '~/components/learner/learner-details/entrance-tests-section';
import Paginator from '~/components/paginator';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useAuth } from '~/lib/contexts/auth-context';
import { fetchEntranceTests } from '~/lib/services/entrance-tests';
import { Role, StudentStatus } from '~/lib/types/account/account';
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

  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className='px-10'>
      <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
        <BookOpenCheck className="h-5 w-5 text-theme" />
        <h3 className='font-bold'>Entrance Tests</h3>
      </div>
      <div className='text-sm text-muted-foreground'>
        Make sure to keep track of the schedule for important entrance tests so you don't miss them!
      </div>
      <SearchForm searchParams={searchParams} role={Role.Student} />
      <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
        <Await resolve={promise}>
          {({ entranceTestsPromise, metadata }) => (
            <Await resolve={entranceTestsPromise}>
              <StudentEntranceTests page={query.page} totalPage={metadata.totalPages}
                searchParams={searchParams}
                setSearchParams={setSearchParams} />
            </Await>
          )}
        </Await>
      </Suspense>
    </div>
  )
}

function StudentEntranceTests({
  page, totalPage, searchParams, setSearchParams
}: {
  page: number;
  totalPage: number;
  searchParams: URLSearchParams;
  setSearchParams: (nextInit?: URLSearchParamsInit | ((prev: URLSearchParams) => URLSearchParamsInit), navigateOpts?: NavigateOptions) => void;
}) {
  const entranceTestsValue = useAsyncValue();

  const entranceTests = entranceTestsValue as EntranceTest[];

  return <div className="py-4">
    {entranceTests.length > 0 ? <>
      {entranceTests.map(entranceTest => <TestCard entranceTest={entranceTest} key={entranceTest.id} type='current'
        role={Role.Student} />)}

      <div className="my-4">
        <Paginator page={page} totalPage={totalPage} onPageChanged={(newPage) => {
          const newSearchParams = new URLSearchParams(searchParams);

          newSearchParams.set('page', newPage.toString());

          setSearchParams(newSearchParams);
        }} />
      </div>
    </> :
      <Card className="bg-neutral-50 border border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-10 text-neutral-500">
          <BookOpenCheck className="h-12 w-12 mb-2 opacity-20" />
          <p>No entrance tests yet.</p>
          <TestRegistrationSection />
        </CardContent>
      </Card>}
  </div>
}

function TestRegistrationSection({ }: {

}) {

  const { currentAccount } = useAuth();

  const isDisabled = currentAccount?.studentStatus !== StudentStatus.Unregistered;

  const { handleOpen, dialog: enrollDialog } = useEnrolLDialog({
    disabled: isDisabled
  });

  return <>
    <div className="flex justify-center my-4">
      <Button type='button' variant={'theme'} className='uppercase font-bold' disabled={isDisabled}
        onClick={handleOpen} Icon={UserRoundPlus} iconPlacement='left'>
        Register for entrance test
      </Button>
    </div>
    {enrollDialog}
  </>

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