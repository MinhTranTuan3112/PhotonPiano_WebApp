import { zodResolver } from '@hookform/resolvers/zod';
import { data, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, useLoaderData, useSearchParams } from '@remix-run/react';
import { Music2, PlusCircle, Search, Shuffle, SortDescIcon } from 'lucide-react';
import React, { Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import AddClassDialog from '~/components/staffs/classes/add-class-dialog';
import { classColums } from '~/components/staffs/table/class-columns';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import GenericDataTable from '~/components/ui/generic-data-table';
import { MultiSelect } from '~/components/ui/multi-select';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchClasses } from '~/lib/services/class';
import { Class, sampleClasses } from '~/lib/types/class/class';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { CLASS_STATUS, LEVEL } from '~/lib/utils/constants';
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
    sortColumn: searchParams.get('column') || 'Level',
    orderByDesc: searchParams.get('desc') === 'true' ? true : false,
    levels: getParsedParamsArray({ paramsValue: searchParams.get('levels') }).map(Number),
    statuses: getParsedParamsArray({ paramsValue: searchParams.get('statuses') }).map(Number),
  };

  const promise = fetchClasses({ ...query }).then((response) => {

    const classes: Class[] = response.data;

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

  return {
    promise,
    idToken,
    query: { ...query, idToken: undefined }
  }
}
export const searchSchema = z.object({
  levels: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;
const resolver = zodResolver(searchSchema);

function SearchForm({ }) {
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
      <div className='flex flex-wrap gap-2 justify-center'>
        <Controller
          name='levels'
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <MultiSelect options={LEVEL.map((level, index) => ({ label: `LEVEL ${index + 1} - ${level}`, value: index.toString() }))}
              value={value}
              defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('levels') })}
              placeholder='Chọn level'
              className='w-64'
              onValueChange={onChange} />
          )}
        />
        <Controller
          name='statuses'
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <MultiSelect options={CLASS_STATUS.map((status, index) => ({ label: status, value: index.toString() }))}
              value={value}
              defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
              placeholder='Trạng thái'
              className='w-64'
              onValueChange={onChange} />
          )}
        />
        <Button Icon={Search} iconPlacement='left'>Tìm kiếm</Button>

      </div>
    </Form>
  )
}

export default function StaffClassesPage({ }: Props) {
  const { promise, idToken } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpenAddClassDialog, setIsOpenAddClassDialog] = useState(false)

  return (
    <div>
      <div className='px-8'>
        <h3 className="text-lg font-medium">Danh sách lớp</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách lớp
        </p>
        <div className='flex flex-col mt-8 gap-4'>
          <SearchForm />
          <div className='flex gap-4 justify-center mt-2'>
            <Button onClick={() => setIsOpenAddClassDialog(true)} variant={'outline'}><PlusCircle className='mr-4' /> Thêm lớp mới</Button>
            <Button Icon={Shuffle} iconPlacement='left'>Xếp lớp tự động</Button>
          </div>
        </div>
        <Suspense fallback={<LoadingSkeleton />}>
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
        <AddClassDialog idToken={idToken} isOpen={isOpenAddClassDialog} setIsOpen={setIsOpenAddClassDialog} />
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}