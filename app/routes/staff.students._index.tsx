import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, isRouteErrorResponse, Link, useLoaderData, useLocation, useNavigate, useRouteError, useSearchParams } from '@remix-run/react';
import { useQuery } from '@tanstack/react-query';
import { Search, CalendarSync, RotateCcw, Loader2, GraduationCap } from 'lucide-react';
import { Suspense } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Button, buttonVariants } from '~/components/ui/button';
import GenericDataTable from '~/components/ui/generic-data-table';
import { Input } from '~/components/ui/input';
import { MultiSelect } from '~/components/ui/multi-select';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchAccounts } from '~/lib/services/account';
import { fetchLevels } from '~/lib/services/level';
import { Account, Level, Role } from '~/lib/types/account/account';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { LEVEL, STUDENT_STATUS } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {

  try {

    const { idToken, role } = await requireAuth(request);

    if (role !== 4) {
      return redirect('/');
    }

    const { searchParams } = new URL(request.url);

    const query = {
      page: Number.parseInt(searchParams.get('page') || '1'),
      pageSize: Number.parseInt(searchParams.get('size') || '10'),
      sortColumn: searchParams.get('column') || 'Id',
      orderByDesc: searchParams.get('desc') === 'true' ? true : false,
      roles: [Role.Student],
      levels: getParsedParamsArray({ paramsValue: searchParams.get('levels') }).map(String),
      studentStatuses: getParsedParamsArray({ paramsValue: searchParams.get('statuses') }).map(Number),
      q: trimQuotes(searchParams.get('q') || ''),
      idToken
    };

    const promise = fetchAccounts({ ...query }).then((response) => {

      const accountsPromise: Promise<Account[]> = response.data;

      const headers = response.headers;

      const metadata: PaginationMetaData = {
        page: parseInt(headers['x-page'] || '1'),
        pageSize: parseInt(headers['x-page-size'] || '10'),
        totalPages: parseInt(headers['x-total-pages'] || '1'),
        totalCount: parseInt(headers['x-total-count'] || '0'),
      };

      return {
        accountsPromise,
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


export const searchSchema = z.object({
  levels: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  q: z.string().optional()
});

type SearchFormData = z.infer<typeof searchSchema>;
const resolver = zodResolver(searchSchema);

const levelOptions = LEVEL.map((level, index) => {
  return {
    label: `Level ${index + 1}`,
    value: index.toString(),
    icon: undefined
  }
});

const studentStatusOptions = STUDENT_STATUS.map((status, index) => {
  return {
    label: status,
    value: index.toString(),
    icon: undefined
  }
})
function SearchForm() {

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    control
  } = useRemixForm<SearchFormData>({
    mode: "onSubmit",
    resolver
  });

  const { data, isLoading: isLoadingLevels } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const response = await fetchLevels();

      return await response.data;
    },
    enabled: true,
    refetchOnWindowFocus: false,
  });

  const levels = data ? data as Level[] : [];

  const levelOptions = levels.map((level, index) => {
    return {
      label: level.name,
      value: level.id.toString(),
      icon: undefined
    }
  })

  const [searchParams, setSearchParams] = useSearchParams();

  return <Form method='GET' action='/staff/students'
    onSubmit={handleSubmit}
    className='grid grid-cols-2 gap-y-5 gap-x-5 w-full'>
    {isLoadingLevels ? <Skeleton className='w-full' /> : <Controller
      name='levels'
      control={control}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <MultiSelect
          options={levelOptions}
          value={value}
          defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('levels') })}
          placeholder='Select levels'
          className='w-full'
          onValueChange={onChange} />
      )}
    />}

    <Controller
      name='statuses'
      control={control}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <MultiSelect options={studentStatusOptions}
          value={value}
          defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
          placeholder='Statuses'
          className='w-full'
          onValueChange={onChange} />
      )}
    />

    <Input {...register('q')} placeholder='Search here...'
      startContent={<Search className='size-5' />}
      className='col-span-full w-full'
      defaultValue={trimQuotes(searchParams.get('q') || '')} />

    <div className="">
      <Button type='submit' Icon={Search} iconPlacement='left'
        isLoading={isSubmitting}
        disabled={isSubmitting}>Search</Button>
    </div>
  </Form>
}

export default function StaffStudentsPage({ }: Props) {
  const navigate = useNavigate()
  const { promise, query } = useLoaderData<typeof loader>();

  return (
    <div className='px-8'>
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap className="h-8 w-8 text-sky-600" />
        <div>
          <h3 className="text-2xl font-bold text-sky-800">Learners list</h3>
          <p className="text-sm text-sky-600">Manage the list of learners and smart class arrangement</p>
        </div>
      </div>
      <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
        <SearchForm />
        <div>
          <Button Icon={CalendarSync} type='button' iconPlacement='left' onClick={() => navigate("/staff/auto-arrange-class")}>Auto arrange classes</Button>
        </div>
      </div>
      <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
        <Await resolve={promise} >
          {({ accountsPromise, metadata }) => (
            <Await resolve={accountsPromise}>
              <GenericDataTable
                columns={studentColumns}
                emptyText='No learners found.'
                metadata={metadata}
              />
            </Await>
          )}
        </Await>
      </Suspense>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}

export function ErrorBoundary() {
  const navigate = useNavigate()
  const error = useRouteError();

  const { pathname, search } = useLocation();

  return (
    <article className="px-8">
      <h3 className="text-lg font-medium">Learners list</h3>
      <p className="text-sm text-muted-foreground">
        Manage the list of learners and smart class arrangement
      </p>
      <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
        <SearchForm />
        <div>
          <Button Icon={CalendarSync} type='button' iconPlacement='left' onClick={() => navigate("/staff/auto-arrange-class")}>Auto arrange classes</Button>
        </div>
      </div>
      <div className="flex flex-col gap-5 justify-center items-center">
        <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
          'Errors happened.'} </h1>
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
