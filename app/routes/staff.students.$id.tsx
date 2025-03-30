import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchAccountDetail, fetchTeachDetail } from '~/lib/services/account';
import { AccountDetail, TeacherDetail } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { useNavigate } from 'react-router-dom';
import { CircleArrowLeft } from 'lucide-react';
import { Button } from '~/components/ui/button';
import Image from '~/components/ui/image';
import { CLASS_STATUS, SHIFT_TIME } from '~/lib/utils/constants';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { idToken, role } = await requireAuth(request);
  if (role !== 4) return redirect('/');
  if (!params.id) return redirect('/staff/students');

  const promise = fetchAccountDetail(params.id, idToken).then((response) => {
    const student = response.data as AccountDetail;
    return { student };
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


export default function StaffStudentDetailPage() {
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
          {({ student }) => (
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center gap-6 border-b pb-4">
                <Image
                  src={student.avatarUrl || '/images/noavatar.png'}
                  alt={student.fullName}
                  className="w-32 h-32"
                />
                <div className='w-full'>
                  <h2 className="text-2xl font-semibold">{student.fullName || student.userName}</h2>
                  <p className="text-gray-600">{student.email}</p>
                  <p className="text-gray-600">{student.phone}</p>
                  <p className="text-gray-500"><span className='font-bold'>Level:</span> {student.level?.name.split("(")[0] || 'N/A'}</p>
                  <div className='flex flex-col lg:flex-row lg:place-content-between w-full'>
                    <p className="text-gray-500"><span className='font-bold'>Địa chỉ:</span> {student.address}</p>
                    <p className="text-gray-500"><span className='font-bold'>Giới tính:</span> {student.gender}</p>
                    <p className="text-gray-500"><span className='font-bold'>Ngày sinh:</span> {student.dateOfBirth}</p>
                  </div>
                  <p className="text-gray-500"><span className='font-bold'>Giới thiệu:</span> {student.shortDescription}</p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold">Lớp hiện tại</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {student.currentClass ? (
                    <div className="border rounded-lg shadow-md">
                      <h4 className={`${getClassCover(student.currentClass.status)} text-center p-2 rounded-t-lg`}>{student.currentClass.name}</h4>
                      <div className=' p-4'>
                        <p className="text-gray-500"><span className='font-bold'>Level:</span> {student.currentClass.level?.name || 'N/A'}</p>
                        <p className="text-gray-500"><span className='font-bold'>Ngày bắt đầu: </span>{student.currentClass.startTime || 'TBD'}</p>
                        <p className="text-gray-500"><span className='font-bold'>Thời khóa biểu: </span>{student.currentClass.scheduleDescription || 'N/A'}</p>
                        <p className="text-gray-500"><span className='font-bold'>Trạng thái: </span>{CLASS_STATUS[student.currentClass.status]}</p>

                      </div>

                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có lớp học nào</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold">Các lớp đã học</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {student.studentClasses.length > 0 ? (
                    student.studentClasses.map((studentClass) => (
                      <div key={studentClass.class.id} className="border rounded-lg shadow-md">
                        <h4 className={`${getClassCover(studentClass.class.status)} text-center p-2 rounded-t-lg`}>{studentClass.class.name}</h4>
                        <div className=' p-4'>
                          <p className="text-gray-500"><span className='font-bold'>Level:</span> {studentClass.class.level?.name || 'N/A'}</p>
                          <p className="text-gray-500"><span className='font-bold'>Ngày bắt đầu: </span>{studentClass.class.startTime || 'TBD'}</p>
                          <p className="text-gray-500"><span className='font-bold'>Thời khóa biểu: </span>{studentClass.class.scheduleDescription || 'N/A'}</p>
                          <p className="text-gray-500"><span className='font-bold'>Trạng thái: </span>{CLASS_STATUS[studentClass.class.status]}</p>
                        </div>

                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Chưa có lớp học nào.</p>
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