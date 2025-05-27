import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { PlusCircle, Search, Shuffle, Users } from 'lucide-react';
import { Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import AddClassDialog from '~/components/staffs/classes/add-class-dialog';
import { classColums } from '~/components/staffs/table/class-columns';
import { LevelBadge } from '~/components/staffs/table/student-columns';
import { Button, buttonVariants } from '~/components/ui/button';
import GenericDataTable from '~/components/ui/generic-data-table';
import { MultiSelect } from '~/components/ui/multi-select';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchClasses } from '~/lib/services/class';
import { fetchLevels } from '~/lib/services/level';
import { Level } from '~/lib/types/account/account';
import { ClassResponse } from '~/lib/types/class/class';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { CLASS_STATUS } from '~/lib/utils/constants';
import { getParsedParamsArray } from '~/lib/utils/url';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {

  const { idToken, role } = await requireAuth(request);

  if (role !== 4) {
    return redirect('/');
  }

  const { searchParams } = new URL(request.url);

  const query = {
    page: Number.parseInt(searchParams.get('page') || '1'),
    pageSize: Number.parseInt(searchParams.get('size') || '10'),
    sortColumn: searchParams.get('column') || 'CreatedAt',
    orderByDesc: searchParams.get('desc') === 'true' ? false : true,
    levels: getParsedParamsArray({ paramsValue: searchParams.get('levels') }),
    statuses: getParsedParamsArray({ paramsValue: searchParams.get('statuses') }).map(Number),
    idToken: idToken
  };

  const promise = fetchClasses({ ...query }).then((response) => {

    const classes: ClassResponse[] = response.data;
    const headers = response.headers;

    const metadata: PaginationMetaData = {
      page: parseInt(headers['x-page'] || '1'),
      pageSize: parseInt(headers['x-page-size'] || '10'),
      totalPages: parseInt(headers['x-total-pages'] || '1'),
      totalCount: parseInt(headers['x-total-count'] || '0'),
    };

    return {
      classes,
      metadata,
      query: { ...query, idToken: undefined }
    }
  });

  const levelPromise = fetchLevels().then((res) => {
    return res.data as Level[]
  });

  return {
    promise,
    idToken,
    levelPromise,
    query: { ...query, idToken: undefined }
  }
}
export const searchSchema = z.object({
  levels: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;
const resolver = zodResolver(searchSchema);

function SearchForm({ levelPromise }: { levelPromise: Promise<Level[]> }) {
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

  return (
    <Form method='GET'
      onSubmit={handleSubmit}
      action='/staff/classes'
      className='my-1 flex flex-col'>
      <div className='flex gap-2 justify-center'>
        <div className="w-80">
          <Suspense fallback={<Skeleton className='w-full' />}>
            <Await resolve={levelPromise}>
              {(levels) => (
                <Controller
                  name='levels'
                  control={control}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <MultiSelect options={levels.map((level) => ({ label: <LevelBadge level={level} key={level.id} />, value: level.id }))}
                      value={value}
                      defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('levels') })}
                      placeholder='Select piano levels'
                      onValueChange={onChange} />
                  )}
                />
              )}
            </Await>
          </Suspense>
        </div>

        <Controller
          name='statuses'
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <MultiSelect options={CLASS_STATUS.map((status, index) => ({ label: status, value: index.toString() }))}
              value={value}
              defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
              placeholder='Status'
              className='w-64'
              onValueChange={onChange} />
          )}
        />
        <Button Icon={Search} iconPlacement='left' variant={'theme'}>Search</Button>
      </div>
    </Form>
  )
}

export default function StaffClassesPage({ }: Props) {
  const { promise, idToken, levelPromise, query } = useLoaderData<typeof loader>()
  const [isOpenAddClassDialog, setIsOpenAddClassDialog] = useState(false)

  return (
    <div>
      <div className='px-8'>
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-8 w-8 text-sky-600" />
          <div>
            <h3 className="text-2xl font-bold text-sky-800">Manage Classes</h3>
            <p className="text-sm text-sky-600">Manage Classes Information like Schedule, Learner List and Transcript</p>
          </div>
        </div>
        <div className='flex flex-col mt-8 gap-4'>
          <SearchForm levelPromise={levelPromise} />
          <div className='flex gap-4 justify-center mt-2'>
            <Button onClick={() => setIsOpenAddClassDialog(true)} variant={'outline'}><PlusCircle className='mr-4' /> Add new class</Button>
            <Link to={'/staff/auto-arrange-class'} className={`${buttonVariants({ variant: 'theme' })} flex flex-row gap-1 items-center`}>
              <Shuffle /> Auto arrange classes
            </Link>
          </div>
        </div>
        <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
          <Await resolve={promise}>
            {(data) => (
              <GenericDataTable
                columns={classColums}
                metadata={data.metadata}
                resolvedData={data.classes}
              />
            )}
          </Await>
        </Suspense>
        <AddClassDialog idToken={idToken} isOpen={isOpenAddClassDialog} setIsOpen={setIsOpenAddClassDialog} levelPromise={levelPromise} />
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}