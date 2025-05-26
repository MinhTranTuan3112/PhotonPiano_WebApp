import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchAccountDetail } from '~/lib/services/account';
import { AccountDetail, Role } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { LearnerDetailsContent } from '~/components/learner/learner-details/learner-details-content';

export async function loader({ params, request }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Instructor) {
            return redirect('/');
        }

        if (!params.id) {
            return redirect('/');
        }

        const id = params.id as string;

        const promise = fetchAccountDetail(id, idToken).then((response) => {
            const student = response.data as AccountDetail;
            return { student };
        });

        return { promise, idToken, id };

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function TeacherStudentDetailPage() {

    const { promise, id } = useLoaderData<typeof loader>();

    return (
        <div className="container mx-auto px-4 pb-6 pt-2 animate-fade-in">
            <Suspense fallback={<LoadingSkeleton />} key={id}>
                <Await resolve={promise}>
                    {({ student }) => (
                        <LearnerDetailsContent student={student} />
                    )}
                </Await>
            </Suspense>
        </div>

    );
}

function LoadingSkeleton() {
    return (
        <div className="flex justify-center items-center my-4">
            <Skeleton className="w-full h-[500px] rounded-md" />
        </div>
    );
}
