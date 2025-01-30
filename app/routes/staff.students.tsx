import { data, LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Music2, SortDescIcon } from 'lucide-react';
import React, { Suspense } from 'react'
import { studentColumns } from '~/components/staffs/table/student-columns';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { sampleStudents } from '~/lib/types/account/account';
import { LEVEL, STUDENT_STATUS } from '~/lib/utils/constants';

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

export default function StaffStudentsPage({ }: Props) {
  const { promise } = useLoaderData<typeof loader>()

  return (
    <div>
      <div className='px-8'>
        <h3 className="text-lg font-medium">Danh sách học viên</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách học viên và xếp lớp thông minh
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
                    STUDENT_STATUS.map((item,index) => (
                      <SelectItem key={index} value={index.toString()}>{item}</SelectItem>
                    ))
                  }
                </SelectGroup>
              </SelectContent>
            </Select>
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