import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, isRouteErrorResponse, Link, useLoaderData, useLocation, useNavigate, useRouteError, useSearchParams } from '@remix-run/react';
import { useQuery } from '@tanstack/react-query';
import { Search, CalendarSync, RotateCcw, Loader2, PlusCircle, Users } from 'lucide-react';
import { Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import LevelForm from '~/components/level/level-form';
import AddAccountDialog from '~/components/admin/accounts/add-account-dialog';
import { staffColumns } from '~/components/admin/accounts/staff-columns';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { teacherColumns } from '~/components/admin/accounts/teacher-columns';
import { Button, buttonVariants } from '~/components/ui/button';
import GenericDataTable from '~/components/ui/generic-data-table';
import { Input } from '~/components/ui/input';
import { MultiSelect } from '~/components/ui/multi-select';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { fetchAccounts } from '~/lib/services/account';
import { fetchLevels } from '~/lib/services/level';
import { Account, Level, Role } from '~/lib/types/account/account';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { LEVEL, STUDENT_STATUS } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url';
import { adminColumns } from '~/components/admin/accounts/admin-columns';
import { role } from '~/lib/test-data';

type Props = {}



export async function loader({ request }: LoaderFunctionArgs) {

  try {

    const { idToken, role } = await requireAuth(request);

    if (role !== 3) {
      return redirect('/');
    }

    const { searchParams } = new URL(request.url);
    const roles = [Number.parseInt(searchParams.get('roles') || '2')]
    const query = {
      page: Number.parseInt(searchParams.get('page') || '1'),
      pageSize: Number.parseInt(searchParams.get('size') || '10'),
      sortColumn: searchParams.get('column') || 'Id',
      orderByDesc: searchParams.get('desc') === 'true' ? true : false,
      roles,
      levels: getParsedParamsArray({ paramsValue: searchParams.get('levels') }).map(String),
      accountStatus: getParsedParamsArray({ paramsValue: searchParams.get('status') }).map(Number),
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
      idToken,
      query: { ...query, idToken: undefined },
      roles
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
  action : z.string(),
  q: z.string().optional()
});

type SearchFormData = z.infer<typeof searchSchema>;
const resolver = zodResolver(searchSchema);


const statusOptions = [
  {
    label: "Active",
    value: "0"
  },
  {
    label: "Inactive",
    value: "1"
  },
]

function SearchForm({ setIsOpen, role }: { setIsOpen: (isOpen: boolean) => void, role: Role }) {

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    control
  } = useRemixForm<SearchFormData>({
    mode: "onSubmit",
    resolver,
    defaultValues : {
      action : "ADD"
    }
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
    {
      role === Role.Instructor && (
        isLoadingLevels ? <Skeleton className='w-full' /> : <Controller
          name='levels'
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <MultiSelect
              options={levelOptions}
              value={value}
              defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('levels') })}
              placeholder='Pick a Level'
              className='w-full'
              onValueChange={onChange} />
          )}
        />
      )
    }


    <Controller
      name='statuses'
      control={control}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <MultiSelect options={statusOptions}
          value={value}
          defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
          placeholder='Status'
          className='w-full'
          onValueChange={onChange} />
      )}
    />

    <Input {...register('q')} placeholder='Search here...'
      startContent={<Search className='size-5' />}
      className='col-span-full w-full'
      defaultValue={trimQuotes(searchParams.get('q') || '')} />

    <div className="flex gap-2">
      <Button type='submit' Icon={Search} iconPlacement='left'
        variant={'theme'}
        isLoading={isSubmitting}
        disabled={isSubmitting}>Search</Button>
      {
        role !== Role.Administrator && (
          <Button type='button' Icon={PlusCircle} iconPlacement='left'
            onClick={() => setIsOpen(true)}
            variant={'outline'}
            isLoading={isSubmitting}
            disabled={isSubmitting}>Add New Account</Button>
        )
      }

    </div>
  </Form>
}

export default function AdminManageAccountPage({ }: Props) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams();
  const { promise, query, idToken, roles } = useLoaderData<typeof loader>();
  const [isOpenAddDialog, setIsOpenAddDialog] = useState(false)
  const [viewingRole, setViewingRole] = useState(roles[0])

  const handleTabChange = (role: Role) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("roles"); // Remove existing roles
    newParams.append("roles", role.toString());
    newParams.set("page", "1");
    //setIsTeacher(tab === "teachers")
    setViewingRole(role)
    setSearchParams(newParams);
  };

  return (
    <div className='px-8'>
      <div className="flex items-center gap-3 mb-4">
        <Users className="h-8 w-8 text-sky-600" />
        <div>
          <h3 className="text-2xl font-bold text-sky-800">Manage Accounts</h3>
          <p className="text-sm text-sky-600">Manage Internal Accounts Including Teachers, Staffs And Administrators</p>
        </div>
      </div>
      
      <Tabs defaultValue={viewingRole.toString()}>
        <TabsList className="w-full flex mt-4">
          <TabsTrigger value="2" className='w-full' onClick={() => handleTabChange(Role.Instructor)}>Teachers</TabsTrigger>
          <TabsTrigger value="4" className='w-full' onClick={() => handleTabChange(Role.Staff)}>Staffs</TabsTrigger>
          <TabsTrigger value="3" className='w-full' onClick={() => handleTabChange(Role.Administrator)}>Admins</TabsTrigger>
        </TabsList>
        <div className='flex flex-col lg:flex-row lg:place-content-between mt-4 gap-4'>
          <SearchForm setIsOpen={setIsOpenAddDialog} role={viewingRole} />
        </div>
        <TabsContent value="2">
          <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
            <Await resolve={promise} >
              {({ accountsPromise, metadata }) => (
                <Await resolve={accountsPromise}>
                  <GenericDataTable
                    columns={teacherColumns}
                    emptyText='No accounts.'
                    metadata={metadata}
                  />
                </Await>
              )}
            </Await>
          </Suspense>
        </TabsContent>
        <TabsContent value='4'>
          <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
            <Await resolve={promise} >
              {({ accountsPromise, metadata }) => (
                <Await resolve={accountsPromise}>
                  <GenericDataTable
                    columns={staffColumns}
                    emptyText='No accounts.'
                    metadata={metadata}
                  />
                </Await>
              )}
            </Await>
          </Suspense>
        </TabsContent>
        <TabsContent value='3'>
          <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
            <Await resolve={promise} >
              {({ accountsPromise, metadata }) => (
                <Await resolve={accountsPromise}>
                  <GenericDataTable
                    columns={adminColumns}
                    emptyText='No accounts.'
                    metadata={metadata}
                  />
                </Await>
              )}
            </Await>
          </Suspense>
        </TabsContent>
      </Tabs>
      <AddAccountDialog idToken={idToken} isOpen={isOpenAddDialog} setIsOpen={setIsOpenAddDialog}
        isTeacher={viewingRole === Role.Instructor} />
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
  const [isOpenAddDialog, setIsOpenAddDialog] = useState(false)
  const { pathname, search } = useLocation();

  return (
    <article className="px-8">
      <h3 className="text-lg font-medium">Accounts List</h3>
      <p className="text-sm text-muted-foreground">
        Manage Center Accounts Information
      </p>
      <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
        <SearchForm setIsOpen={setIsOpenAddDialog} role={Role.Instructor} />
      </div>
      <div className="flex flex-col gap-5 justify-center items-center">
        <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
          'An Error Occured.'} </h1>
        <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                          flex flex-row gap-1`}
          to={pathname ? `${pathname}${search}` : '/'}
          replace={true}
          reloadDocument={false}>
          <RotateCcw /> Try Again
        </Link>
      </div>
    </article>
  );
}
