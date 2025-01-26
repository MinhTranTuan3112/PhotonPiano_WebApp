import { data, LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Music2, PlusCircle, SortDescIcon } from 'lucide-react';
import React, { Suspense } from 'react'
import { classColums } from '~/components/staffs/table/class-columns';
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { sampleClasses } from '~/lib/types/class/class';
import { CLASS_STATUS, LEVEL } from '~/lib/utils/constants';

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

export default function StaffClassesPage({ }: Props) {
  const { promise } = useLoaderData<typeof loader>()

  return (
    <div>
      <div className='px-8'>
        <h3 className="text-lg font-medium">Danh sách lớp</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách lớp
        </p>
        <div className='flex flex-col lg:flex-row lg:place-content-between mt-8 gap-4'>
          <div className='flex gap-2'>
            <Select>
              <SelectTrigger className='w-32 lg:w-64'>
                <SelectValue placeholder="Chọn level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {
                    LEVEL.map((item,index) => (
                      <SelectItem key={index} value={index.toString()}>LEVEL {index + 1} - {item}</SelectItem>
                    ))
                  }
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className='w-32 lg:w-64'>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {
                    CLASS_STATUS.map((item,index) => (
                      <SelectItem key={index} value={index.toString()}>{item}</SelectItem>
                    ))
                  }
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className='flex gap-4'>
            <Button variant={'outline'}><PlusCircle className='mr-4'/> Thêm lớp mới</Button>
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