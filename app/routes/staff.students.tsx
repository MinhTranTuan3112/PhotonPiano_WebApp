import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, isRouteErrorResponse, Link, useLoaderData, useLocation, useRouteError, useSearchParams } from '@remix-run/react';
import { Search, CalendarSync, RotateCcw } from 'lucide-react';
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
import { Account, Role, sampleStudents } from '~/lib/types/account/account';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { LEVEL, STUDENT_STATUS } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url';

type Props = {}

async function getSampleStudents() {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return sampleStudents;
}

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
      levels: getParsedParamsArray({ paramsValue: searchParams.get('levels') }).map(Number),
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

  const [searchParams, setSearchParams] = useSearchParams();

  return <Form method='GET' action='/staff/students'
    onSubmit={handleSubmit}
    className='grid grid-cols-2 gap-y-5 gap-x-5 w-full'>
    <Controller
      name='levels'
      control={control}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <MultiSelect
          options={levelOptions}
          value={value}
          defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('levels') })}
          placeholder='Chọn level'
          className='w-full'
          onValueChange={onChange} />
      )}
    />
    <Controller
      name='statuses'
      control={control}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <MultiSelect options={studentStatusOptions}
          value={value}
          defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
          placeholder='Trạng thái'
          className='w-full'
          onValueChange={onChange} />
      )}
    />

    <Input {...register('q')} placeholder='Tìm kiếm...'
      startContent={<Search className='size-5' />}
      className='col-span-full w-full'
      defaultValue={trimQuotes(searchParams.get('q') || '')} />

    <div className="">
      <Button type='submit' Icon={Search} iconPlacement='left'
        isLoading={isSubmitting}
        disabled={isSubmitting}>Tìm kiếm</Button>
    </div>
  </Form>
}

export default function StaffStudentsPage({ }: Props) {

  const { promise, query } = useLoaderData<typeof loader>();

  return (
    <div className='px-8'>
      <h3 className="text-lg font-medium">Danh sách học viên</h3>
      <p className="text-sm text-muted-foreground">
        Quản lý danh sách học viên và xếp lớp thông minh
      </p>
      <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
        <SearchForm />
        <div>
          <Button Icon={CalendarSync} type='button' iconPlacement='left'>Xếp lớp tự động</Button>
        </div>
      </div>
      <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
        <Await resolve={promise} >
          {({ accountsPromise }) => (
            <Await resolve={accountsPromise}>
              <GenericDataTable columns={studentColumns}
                emptyText='Không có học viên nào.'
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

  const error = useRouteError();

  const { pathname, search } = useLocation();

  return (
    <article className="px-8">
      <h3 className="text-lg font-medium">Danh sách học viên</h3>
      <p className="text-sm text-muted-foreground">
        Quản lý danh sách học viên và xếp lớp thông minh
      </p>
      <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
        <SearchForm />
        <div>
          <Button Icon={CalendarSync} type='button' iconPlacement='left'>Xếp lớp tự động</Button>
        </div>
      </div>
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
