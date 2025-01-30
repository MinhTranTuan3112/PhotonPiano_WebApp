import { zodResolver } from '@hookform/resolvers/zod';
import { data, LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData, useSearchParams } from '@remix-run/react';
import { Music2, PlusCircle, SortDescIcon } from 'lucide-react';
import React, { Suspense } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { classColums } from '~/components/staffs/table/class-columns';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { MultiSelect } from '~/components/ui/multi-select';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { sampleClasses } from '~/lib/types/class/class';
import { CLASS_STATUS, LEVEL } from '~/lib/utils/constants';
import { getParsedParamsArray } from '~/lib/utils/url';

type Props = {}

async function getSampleClasses() {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return sampleClasses;
}


export async function loader({ }: LoaderFunctionArgs) {

  const promise = getSampleClasses();

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

export default function StaffClassesPage({ }: Props) {
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
        <h3 className="text-lg font-medium">Danh sách lớp</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách lớp
        </p>
        <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
          <div className='flex flex-col lg:flex-row gap-2'>
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
                <MultiSelect options={CLASS_STATUS.map((status, index) => ({ label: status, value: index.toString() }))}
                  value={value}
                  defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
                  placeholder='Trạng thái'
                  className=''
                  onValueChange={onChange} />
              )}
            />

          </div>
          <div className='flex gap-4'>
            <Button variant={'outline'}><PlusCircle className='mr-4' /> Thêm lớp mới</Button>
            <Button>Xếp lớp tự động</Button>
          </div>
        </div>
        <Suspense fallback={<LoadingSkeleton />}>
          <Await resolve={promise}>
            {(data) => (
              <DataTable data={data} columns={classColums} />
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