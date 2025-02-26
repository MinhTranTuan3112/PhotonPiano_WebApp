import { data, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { CalendarDays, Music2, PlusCircle, TriangleAlert } from 'lucide-react';
import React, { Suspense, useState } from 'react'
import AddSlotDialog from '~/components/staffs/classes/add-slot-dialog';
import AddStudentClassDialog from '~/components/staffs/classes/add-student-class-dialog';
import ArrangeScheduleClassDialog from '~/components/staffs/classes/arrange-schedule-class-dialog';
import { studentClassColumns } from '~/components/staffs/table/student-class-columns';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DataTable } from '~/components/ui/data-table';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { fetchAccounts } from '~/lib/services/account';
import { fetchClassDetail } from '~/lib/services/class';
import { fetchSlotById } from '~/lib/services/scheduler';
import { Account, Level, StudentStatus } from '~/lib/types/account/account';
import { ClassDetail } from '~/lib/types/class/class-detail';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { SlotDetail } from '~/lib/types/Scheduler/slot';
import { requireAuth } from '~/lib/utils/auth';
import { CLASS_STATUS, LEVEL, SHIFT_TIME } from '~/lib/utils/constants';

type Props = {}
export async function loader({ params, request }: LoaderFunctionArgs) {

  const { idToken, role } = await requireAuth(request);

  if (role !== 4) {
    return redirect('/');
  }
  if (!params.id) {
    return redirect('/staff/classes')
  }
  const { searchParams } = new URL(request.url);

  const query = {
    page: Number.parseInt(searchParams.get('page-students') || '1'),
    pageSize: Number.parseInt(searchParams.get('size-students') || '10'),
    sortColumn: searchParams.get('column') || 'Id',
    orderByDesc: searchParams.get('desc') === 'true' ? true : false,
    studentStatuses: [StudentStatus.WaitingForClass],
    idToken
  };
  const studentPromise = fetchAccounts(query).then((response) => {
    const students: Account[] = response.data;
    const headers = response.headers
    const metadata: PaginationMetaData = {
      page: parseInt(headers['x-page'] || '1'),
      pageSize: parseInt(headers['x-page-size'] || '10'),
      totalPages: parseInt(headers['x-total-pages'] || '1'),
      totalCount: parseInt(headers['x-total-count'] || '0'),
    };
    return {
      students, metadata
    }
  });
  const promise = fetchClassDetail(params.id).then((response) => {

    const classDetail: ClassDetail = response.data;
    const slotsPerWeek = parseInt(response.headers['x-slots-per-week'] || '2')
    const totalSlots = parseInt(response.headers['x-total-slots'] || '30')

    return {
      classDetail, slotsPerWeek, totalSlots
    }
  });

  const tab = (searchParams.get('tab') || 'general')
  const isOpenStudentClassDialog = searchParams.get('studentClassDialog') === "true"

  return {
    promise, idToken, tab, isOpenStudentClassDialog, studentPromise
  }
}
const getSlotCover = (status: number) => {
  switch (status) {
    case 0: return "bg-gray-500 text-white font-semibold";
    case 1: return "bg-yellow-500 text-white font-semibold";
    case 2: return "bg-green-500 text-white font-semibold";
    case 3: return "bg-red-500 text-white font-semibold";
    default: return "bg-black text-white font-semibold";
  }
};
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

function ClassStudentsList({ classInfo, studentPromise, isOpenStudentClassDialog }: {
  classInfo: ClassDetail,
  studentPromise: Promise<{ students: Account[], metadata: PaginationMetaData }>,
  isOpenStudentClassDialog: boolean
}) {
  const [isOpenAddStudentDialog, setIsOpenAddStudentDialog] = useState(isOpenStudentClassDialog)
  const [searchParams, setSearchParams] = useSearchParams();

  const onOpenChange = (isOpen : boolean) => {
    setIsOpenAddStudentDialog(isOpen)
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      studentClassDialog: isOpen ? "true" : "false",
    })
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách học viên</CardTitle>
        <CardDescription>
          Danh sách này hiển thị chủ yếu các thông tin liên lạc của học viên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col lg:flex-row gap-2'>
          <Button variant={'outline'} disabled={(classInfo.capacity <= classInfo.studentClasses.length)} onClick={() => onOpenChange(true)}>
            <PlusCircle className='mr-4' /> Thêm học viên mới
          </Button>
        </div>
        <DataTable data={classInfo.studentClasses} columns={studentClassColumns}>
        </DataTable>
        {
          (classInfo.capacity > classInfo.studentClasses.length) && (
            <AddStudentClassDialog isOpen={isOpenAddStudentDialog} setIsOpen={onOpenChange} studentPromise={studentPromise} />
          )
        }
      </CardContent>
    </Card>
  )
}

function ClassScheduleList({ classInfo, idToken, slotsPerWeek, totalSlots }: { classInfo: ClassDetail, idToken: string, slotsPerWeek: number, totalSlots: number }) {
  const navigate = useNavigate()
  const [isOpenAddSlotDialog, setIsOpenAddSlotDialog] = useState(false)
  const [isOpenArrangeDialog, setIsOpenArrangeDialog] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thời khóa biểu</CardTitle>
        <CardDescription>
          Quản lý lịch trình của lớp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex place-content-between gap-2'>
          <div className='flex flex-col lg:flex-row justify-end gap-2'>
            <Button variant={'outline'} disabled={!(classInfo.requiredSlots <= classInfo.slots.length)} onClick={() => setIsOpenAddSlotDialog(true)}>
              <PlusCircle className='mr-4' /> Thêm buổi học mới
            </Button>
            <Button disabled={!(classInfo.slots.length > 0)} onClick={() => setIsOpenArrangeDialog(true)} variant={'outline'} Icon={CalendarDays} iconPlacement='left'>Xếp lịch tự động</Button>
          </div>
          <Button Icon={CalendarDays} iconPlacement='left'>Xem dạng lịch</Button>
        </div>

        <div className='text-center text-xl mt-4'>
          Tổng số buổi học :
          <span className='ml-2 font-bold'>{classInfo.slots.length} / {classInfo.requiredSlots}</span>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-4 gap-x-4 gap-y-8 cursor-pointer'>
          {
            classInfo.slots.map((s, index) => (
              <div className='hover:scale-105 transition-all flex flex-col' onClick={() => navigate(`/staff/classes/slot/${s.id}`)} key={index}>
                <div className={`py-2 rounded-t-lg font-bold ${getSlotCover(s.status)}`}>
                  <div className='flex gap-2 justify-center'>
                    <Music2 /> Buổi {index + 1}
                  </div>
                </div>
                <div className='px-2 py-4 rounded-b-lg shadow-md'>
                  <div className='flex flex-col gap-2'>
                    <div><span className='font-bold'>Ca : </span><span className='ml-2'>{s.shift} ({SHIFT_TIME[s.shift]})</span></div>
                    <div><span className='font-bold'>Ngày : </span><span className='ml-2'>{s.date}</span></div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        <AddSlotDialog isOpen={isOpenAddSlotDialog} setIsOpen={setIsOpenAddSlotDialog} idToken={idToken} />
        <ArrangeScheduleClassDialog isOpen={isOpenArrangeDialog} setIsOpen={setIsOpenArrangeDialog} idToken={idToken}
          slotsPerWeek={slotsPerWeek} totalSlots={totalSlots} level={classInfo.level} />
      </CardContent>
    </Card>
  )
}

function ClassScoreboard({ classInfo }: { classInfo: ClassDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bảng điểm</CardTitle>
        <CardDescription>
          Danh sách này hiển thị các cột điểm của từng học viên trong lớp
        </CardDescription>
      </CardHeader>
      <CardContent>
        {
          classInfo.isPublic && (
            <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center'>
              <TriangleAlert size={100} />
              <div>
                Bảng điểm của học viên sẽ được kích hoạt sau khi công bố lớp.
              </div>
            </div>
          )
        }

      </CardContent>
    </Card>

  )
}

export default function StaffClassDetailPage({ }: Props) {

  const { promise, idToken, isOpenStudentClassDialog, tab, studentPromise } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams();

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
                <Tabs defaultValue={tab}>
                  <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="general" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "general",
                    })}>
                      Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger value="students" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "students",
                    })}>
                      Danh sách học viên
                    </TabsTrigger>
                    <TabsTrigger value="scores" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "scores",
                    })}>
                      Bảng điểm học viên
                    </TabsTrigger>
                    <TabsTrigger value="timeTable" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "timeTable",
                    })}>
                      Thời khóa biểu
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="general">
                    <ClassGeneralInformation classInfo={data.classDetail} />
                  </TabsContent>
                  <TabsContent value="students">
                    <ClassStudentsList classInfo={data.classDetail} studentPromise={studentPromise} isOpenStudentClassDialog={isOpenStudentClassDialog} />
                  </TabsContent>
                  <TabsContent value="scores">
                    <ClassScoreboard classInfo={data.classDetail} />
                  </TabsContent>
                  <TabsContent value="timeTable">
                    <ClassScheduleList classInfo={data.classDetail} idToken={idToken} slotsPerWeek={data.slotsPerWeek} totalSlots={data.totalSlots} />
                  </TabsContent>
                </Tabs>
              </div>
            )
          }
        </Await>

      </Suspense>

    </div >
  )
}


function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}