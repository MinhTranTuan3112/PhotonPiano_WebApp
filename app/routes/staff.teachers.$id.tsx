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

export async function loader({ params, request }: LoaderFunctionArgs) {
    const { idToken, role } = await requireAuth(request);
    if (role !== 4) return redirect('/');
    if (!params.id) return redirect('/staff/teachers');

    const promise = fetchTeachDetail(params.id, idToken).then((response) => {
        const teacher = response.data as TeacherDetail;
        return { teacher };
    });

    return { promise, idToken };
}

const getClassCover = (status: number) => {
    switch (status) {
        case 0: return "bg-gray-500 text-white font-semibold";
        case 1: return "bg-green-500 text-white font-semibold";
        case 2: return "bg-blue-800 text-white font-semibold";
        case 3: return "bg-red-500 text-white font-semibold";
        default: return "bg-black text-white font-semibold";
    }
};
const getEntranceTestCover = (dateString: string) => {
    const date = new Date(dateString)
    if (date > new Date()) {
        return "bg-green-500 text-white font-semibold";
    } else {
        return "bg-gray-500 text-white font-semibold";
    }
};


export default function StaffTeacherDetailPage() {
    const { promise } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    return (
        <div className="container mx-auto px-4 py-6">
            <Button
                variant={'outline'}
                onClick={() => navigate(-1)}
            >
                <CircleArrowLeft className='mr-4' /> Trở về
            </Button>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ teacher }) => (
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <div className="flex items-center gap-6 border-b pb-4">
                                <Image
                                    src={teacher.avatarUrl || '/images/noavatar.png'}
                                    alt={teacher.fullName}
                                    className="w-32 h-32"
                                />
                                <div>
                                    <h2 className="text-2xl font-semibold">{teacher.fullName || teacher.userName}</h2>
                                    <p className="text-gray-600">{teacher.email}</p>
                                    <p className="text-gray-600">{teacher.phone}</p>
                                    <p className="text-gray-500"><span className='font-bold'>Level:</span> {teacher.level?.name.split("(")[0] || 'N/A'}</p>
                                    <div className='flex flex-col lg:flex-row lg:place-content-between w-full'>
                                        <p className="text-gray-500"><span className='font-bold'>Địa chỉ:</span> {teacher.address}</p>
                                        <p className="text-gray-500"><span className='font-bold'>Giới tính:</span> {teacher.gender}</p>
                                        <p className="text-gray-500"><span className='font-bold'>Ngày sinh:</span> {teacher.dateOfBirth}</p>
                                    </div>
                                    <p className="text-gray-500"><span className='font-bold'>Giới thiệu:</span> {teacher.shortDescription}</p>                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xl font-semibold">Các lớp phụ trách</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                    {teacher.instructorClasses.length > 0 ? (
                                        teacher.instructorClasses.map((classItem) => (
                                            <div key={classItem.id} className="border rounded-lg shadow-md">
                                                <h4 className={`${getClassCover(classItem.status)} text-center p-2 rounded-t-lg`}>{classItem.name}</h4>
                                                <div className=' p-4'>
                                                    <p className="text-gray-500"><span className='font-bold'>Level:</span> {classItem.level?.name || 'N/A'}</p>
                                                    <p className="text-gray-500"><span className='font-bold'>Ngày bắt đầu: </span>{classItem.startTime || 'TBD'}</p>
                                                    <p className="text-gray-500"><span className='font-bold'>Thời khóa biểu: </span>{classItem.scheduleDescription || 'N/A'}</p>
                                                    <p className="text-gray-500"><span className='font-bold'>Trạng thái: </span>{CLASS_STATUS[classItem.status]}</p>
                                                </div>

                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">Chưa được giao lớp nào.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xl font-semibold">Các ca thi đầu vào phụ trách</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                    {teacher.instructorEntranceTests.length > 0 ? (
                                        teacher.instructorEntranceTests.map((test) => (
                                            <div key={test.id} className="border rounded-lg shadow-md">
                                                <h4 className={`${getEntranceTestCover(test.date)} text-center p-2 rounded-t-lg`}>{test.name}</h4>
                                                <div className='p-4'>
                                                    <p className="text-gray-500">Phòng: {test.roomName || 'N/A'}</p>
                                                    <p className="text-gray-500">Ngày: {test.date}</p>
                                                    <p className="text-gray-500">Ca: {test.shift + 1} ({SHIFT_TIME[test.shift]})</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">Chưa phụ trách ca thi đầu vào nào</p>
                                    )}
                                </div>
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