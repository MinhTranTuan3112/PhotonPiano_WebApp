import { zodResolver } from '@hookform/resolvers/zod';
import { data, LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData, useSearchParams } from '@remix-run/react';
import { Music2, SortDescIcon } from 'lucide-react';
import React, { Suspense } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { MultiSelect } from '~/components/ui/multi-select';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { sampleStudents } from '~/lib/types/account/account';
import { LEVEL, STUDENT_STATUS } from '~/lib/utils/constants';
import { getParsedParamsArray } from '~/lib/utils/url';

type Props = {}

async function getSampleEntranceTests() {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return sampleStudents;
}

export async function loader({ }: LoaderFunctionArgs) {

  const promise = getSampleEntranceTests();

  return {
    promise
  }
}
export const searchSchema = z.object({
  levels: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;
const resolver = zodResolver(searchSchema);

export default function StaffStudentsPage({ }: Props) {
  const { promise } = useLoaderData<typeof loader>()
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
    <div>
      <div className='px-8'>
        <h3 className="text-lg font-medium">Danh sách học viên</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách học viên và xếp lớp thông minh
        </p>
        <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
          <div className='flex gap-2'>
            <Controller
              name='levels'
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <MultiSelect options={LEVEL.map((level, index) => ({ label: `LEVEL ${index + 1} - ${level}`, value: index.toString() }))}
                  value={value}
                  defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('levels') })}
                  placeholder='Chọn level'
                  className=''
                  onValueChange={onChange} />
              )}
            />
            <Controller
              name='statuses'
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <MultiSelect options={STUDENT_STATUS.map((status, index) => ({ label: status, value: index.toString() }))}
                  value={value}
                  defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
                  placeholder='Trạng thái'
                  className=''
                  onValueChange={onChange} />
              )}
            />
          </div>
          <div>
            <Button>Xếp lớp tự động</Button>
          </div>
        </div>
        <Suspense fallback={<LoadingSkeleton />}>
          <Await resolve={promise}>
            {(data) => (
              <DataTable data={data} columns={studentColumns} />
            )}
          </Await>
        </Suspense>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}