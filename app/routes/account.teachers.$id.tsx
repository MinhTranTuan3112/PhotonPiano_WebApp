import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchTeachDetail } from '~/lib/services/account';
import { TeacherDetail } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { useNavigate } from 'react-router-dom';
import { CircleArrowLeft } from 'lucide-react';
import { Button } from '~/components/ui/button';
import Image from '~/components/ui/image';
import { CLASS_STATUS, SHIFT_TIME } from '~/lib/utils/constants';
import TeacherDetails from '~/components/learner/teacher-details/teacher-details';

export async function loader({ params, request }: LoaderFunctionArgs) {
    const { idToken, role } = await requireAuth(request);
    if (role !== 1) return redirect('/');
    if (!params.id) return redirect('/sign-in');

    const promise = fetchTeachDetail(params.id, idToken).then((response) => {
        const teacher = response.data as TeacherDetail;
        return { teacher };
    });

    return { promise, idToken };
}


export default function AccountTeacherDetailPage() {
    const { promise } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    return (

        <Suspense fallback={<LoadingSkeleton />}>
            <Await resolve={promise}>
                {({ teacher }) => (
                    <TeacherDetails teacher={teacher} />
                )}
            </Await>
        </Suspense>
    );
}

function LoadingSkeleton() {
    return (
        <div className="flex justify-center items-center my-4">
            <Skeleton className="w-full h-[500px] rounded-md" />
        </div>
    );
}