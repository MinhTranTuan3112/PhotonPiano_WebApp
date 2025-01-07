import { LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react'
import MyTestCard from '~/components/entrance-tests/my-test-card';
import { Skeleton } from '~/components/ui/skeleton';
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

async function getSampleEntranceTests() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [sampleEntranceTests[0],sampleEntranceTests[1]];
}


export async function loader({ request, params }: LoaderFunctionArgs) {

    try {

        const promise = getSampleEntranceTests()
        //const accountPromise = getSampleAccount()
        return { promise };

    } catch (error) {
        console.error({ error });
        if (isRedirectError(error)) {
            throw error;
        }
        const { message, status } = getErrorDetailsInfo(error);
        throw new Response(message, { status });
    }
}

export default function MyExams({}: Props) {
  const loaderData = useLoaderData<typeof loader>();
  
  return (
    <div className='px-10'>
      <div className='font-bold text-2xl'>Các bài thi của tôi</div>
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={loaderData.promise}>
          {(entranceTests) => (
            <div className='flex flex-col gap-6 mb-4 mt-8'>
              {
                entranceTests.map(entranceTest => (
                  <MyTestCard entranceTest={entranceTest} key={entranceTest.id}></MyTestCard>
                ))
              }
            </div>
          )}
        </Await> 
      </Suspense>
    </div>
  )
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