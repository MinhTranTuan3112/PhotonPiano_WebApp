import { LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchTeachers } from '~/lib/services/account';
import { TeacherDetail } from '~/lib/types/account/account';
import Image from '~/components/ui/image';
import { useSearchParams } from '@remix-run/react';
import PaginationBar from '~/components/ui/pagination-bar';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;

    const promise = fetchTeachers({ page, pageSize }).then((response) => {
        const headers = response.headers
        const metadata: PaginationMetaData = {
            page: parseInt(headers['x-page'] || '1'),
            pageSize: parseInt(headers['x-page-size'] || '10'),
            totalPages: parseInt(headers['x-total-pages'] || '1'),
            totalCount: parseInt(headers['x-total-count'] || '0'),
        };

        return { teachers: response.data as TeacherDetail[], totalPages: metadata.totalPages, currentPage: page };

    });

    return { promise };
}

export default function TeachersShowcasePage() {
    const { promise } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <div className="flex flex-col justify-center items-center p-8 bg-gray-200 text-black rounded-lg shadow-lg relative">
            <img src="/images/notes_flows.png" alt="Musical Notes" className="absolute top-0 left-0 opacity-5 w-full" />
            <img src="/images/grand_piano_1.png" alt="Grand Piano" className="absolute bottom-0 right-0 opacity-20 w-1/3" />
            <div className="text-center py-6">
                <h2 className="text-5xl font-extrabold mb-4 drop-shadow-lg">
                    🎶 Excellent Teaching Team 🎶
                </h2>
                <p className="text-xl italic drop-shadow">
                    Discover our dedicated, experienced, and passionate teachers! 🎼
                </p>
            </div>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ teachers, totalPages, currentPage }) => (
                        <div className="bg-white/50 shadow-2xl rounded-xl p-10 backdrop-blur-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {teachers.length > 0 ? (
                                    teachers.map((teacher, index) => (
                                        <div key={teacher.accountFirebaseId} className="border p-6 rounded-lg shadow-xl bg-gradient-to-b from-gray-50 to-gray-200 hover:scale-105 transform transition duration-300 relative overflow-hidden">
                                            <div className="flex flex-col items-center text-center relative z-10">
                                                <Image
                                                    src={teacher.avatarUrl || '/images/noavatar.png'}
                                                    alt={teacher.fullName}
                                                    className="w-40 h-40 rounded-full border-4 border-gray-300 shadow-md object-cover mb-4"
                                                />
                                                <h4 className="text-2xl font-bold text-gray-900">{teacher.fullName || teacher.userName}</h4>
                                                <p className="text-gray-700 text-lg font-medium">🎓 Level: {teacher.level?.name || 'Chưa cập nhật'}</p>
                                                <p className="text-gray-600">📧 {teacher.email}</p>
                                                <p className="text-gray-600">📞 {teacher.phone}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center text-lg">Currently no teachers is available.</p>
                                )}
                            </div>
                            <div className="mt-8">
                                <PaginationBar currentPage={currentPage} totalPages={totalPages} />
                            </div>
                        </div>
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
