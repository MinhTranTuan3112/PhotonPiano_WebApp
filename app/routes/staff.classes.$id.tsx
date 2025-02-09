import { data, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react'
import { Skeleton } from '~/components/ui/skeleton';
import { fetchClassDetail } from '~/lib/services/class';
import { ClassDetail } from '~/lib/types/class/class-detail';
import { requireAuth } from '~/lib/utils/auth';

type Props = {}
export async function loader({ params, request }: LoaderFunctionArgs) {

  const { idToken, role } = await requireAuth(request);

  if (role !== 4) {
    return redirect('/');
  }
  if (!params.id) {
    return redirect('/staff/classes')
  }

  const promise = fetchClassDetail(params.id).then((response) => {

    const classDetail: ClassDetail = response.data;

    return {
      classDetail,
    }
  });

  return {
    promise,
  }
}

export default function StaffClassDetailPage({ }: Props) {

  const { promise } = useLoaderData<typeof loader>()

  return (
    <div>
      StaffClasses
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
          {
            (data) => (
              <div>{data.classDetail.name}</div>
            )
          }
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