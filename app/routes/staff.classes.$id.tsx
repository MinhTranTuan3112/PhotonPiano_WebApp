import { data, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react'
import { studentClassColumns } from '~/components/staffs/table/student-class-columns';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DataTable } from '~/components/ui/data-table';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { fetchClassDetail } from '~/lib/services/class';
import { ClassDetail } from '~/lib/types/class/class-detail';
import { requireAuth } from '~/lib/utils/auth';
import { CLASS_STATUS, LEVEL } from '~/lib/utils/constants';

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

const getLevelStyle = (level: number) => {
  switch (level) {
    case 0: return "text-[#92D808] bg-[#e2e8d5] font-semibold";
    case 1: return "text-[#FBDE00] bg-[#f5eba4] font-semibold";
    case 2: return "text-[#FBA000] bg-[#f5d193] font-semibold";
    case 3: return "text-[#fc4e03] bg-[#fcb292] font-semibold";
    case 4: return "text-[#ff0000] bg-[#faa7a7] font-semibold";
    default: return "text-black font-semibold";
  }
};

const getStatusStyle = (status: number) => {
  switch (status) {
    case 0: return "text-gray-500 bg-gray-200 font-semibold";
    case 1: return "text-green-500 bg-green-200 font-semibold";
    case 2: return "text-blue-400 bg-blue-200 font-semibold";
    case 3: return "text-red-400 bg-red-200 font-semibold";
    default: return "text-black font-semibold";
  }
};
function LevelBadge({ level }: {
  level: number
}) {
  return <div className={`${getLevelStyle(level)} uppercase w-5/6 text-center my-1 p-2 rounded-lg`}>LEVEL {level + 1} - {LEVEL[level]}</div>
}
function StatusBadge({ status }: {
  status: number
}) {
  return <div className={`${getStatusStyle(status)} uppercase w-5/6 text-center my-1 p-2 rounded-lg`}>{CLASS_STATUS[status]}</div>
}

function ClassGeneralInformation({ classInfo }: { classInfo: ClassDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chung</CardTitle>
        <CardDescription>
          Thông tin cơ bản của lớp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
          <div className="bg-gray-100 p-3 rounded-lg">
            <span className="font-medium text-gray-700">📌 Tên lớp:</span>
            <p className="text-gray-900">{classInfo.name}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <span className="font-medium text-gray-700">👨‍🏫 Giáo viên:</span>
            <p className="text-gray-900">
              {classInfo.instructor ? classInfo.instructor.fullName : "Chưa có"}
            </p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <span className="font-medium text-gray-700">🎯 Tổng số buổi học:</span>
            <p className="text-gray-900">{classInfo.slots.length} / {classInfo.requiredSlots}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <span className="font-medium text-gray-700">🧑‍🎓 Số học viên:</span>
            <p className="text-gray-900">{classInfo.studentNumber} / {classInfo.capacity}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <span className="font-medium text-gray-700">🔢 Cấp độ:</span>
            <div className='flex justify-center'>
              <LevelBadge level={classInfo.level} />
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <span className="font-medium text-gray-700">📊 Trạng thái:</span>
            <div className='flex justify-center'>
              <StatusBadge status={classInfo.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ClassStudentsList({ classInfo }: { classInfo: ClassDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách học viên</CardTitle>
        <CardDescription>
          Danh sách này hiển thị chủ yếu các thông tin liên lạc của học viên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable data={classInfo.studentClasses} columns={studentClassColumns}>
        </DataTable>
      </CardContent>
    </Card>

  )
}

export default function StaffClassDetailPage({ }: Props) {

  const { promise } = useLoaderData<typeof loader>()

  return (
    <div className='px-8'>
      <h3 className="text-lg font-medium">Thông tin chi tiết lớp</h3>
      <p className="text-sm text-muted-foreground">
        Quản lý thông tin về học sinh, thời khóa biểu và bảng điểm của lớp
      </p>
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
          {
            (data) => (
              <div className='w-full mt-8'>
                <Tabs defaultValue="general">
                  <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="general" >Thông tin chung</TabsTrigger>
                    <TabsTrigger value="students" >Danh sách học viên</TabsTrigger>
                    <TabsTrigger value="scores" >Bảng điểm học viên</TabsTrigger>
                    <TabsTrigger value="timeTable">Thời khóa biểu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="general">
                    <ClassGeneralInformation classInfo={data.classDetail} />
                  </TabsContent>
                  <TabsContent value="students">
                    <ClassStudentsList classInfo={data.classDetail} />
                  </TabsContent>
                  <TabsContent value="scores">
                    <Card>
                      <CardHeader>
                        <CardTitle>Bảng điểm</CardTitle>
                        <CardDescription>
                          Danh sách này hiển thị các cột điểm của từng học viên trong lớp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>

                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="timeTable">
                    <Card>
                      <CardHeader>
                        <CardTitle>Thời khóa biểu</CardTitle>
                        <CardDescription>
                          Quản lý lịch trình của lớp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>

                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
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