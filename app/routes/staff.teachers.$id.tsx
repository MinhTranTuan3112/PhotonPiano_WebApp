import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchTeachDetail as fetchTeacherDetail } from '~/lib/services/account';
import { Role, TeacherDetail } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import TeacherDetails from '~/components/learner/teacher-details/teacher-details';

export async function loader({ params, request }: LoaderFunctionArgs) {
    const { idToken, role } = await requireAuth(request);
    if (role !== Role.Staff) return redirect('/');
    if (!params.id) {
        return redirect('/staff/teachers');
    }

    const id = params.id as string;

    const promise = fetchTeacherDetail(id, idToken).then((response) => {
        const teacher = response.data as TeacherDetail;
        return { teacher };
    });

    return { promise, idToken, id };
}


export default function StaffTeacherDetailPage() {
    const { promise, id } = useLoaderData<typeof loader>();

    return (

        <Suspense fallback={<LoadingSkeleton />} key={id}>
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