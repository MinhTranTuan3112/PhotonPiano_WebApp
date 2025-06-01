import { zodResolver } from '@hookform/resolvers/zod';
import { Select } from '@radix-ui/react-select';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, Link, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { AlertTriangle, CalendarDays, CheckIcon, ClockArrowDown, Edit2Icon, Info, Loader2, LoaderIcon, MergeIcon, Music2, PlusCircle, Speaker, Trash, TriangleAlert, XIcon } from 'lucide-react';
import { ReactNode, Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import SlotStatusAnnotation from '~/components/common/slot-status-annotation';
import AddSlotDialog from '~/components/staffs/classes/add-slot-dialog';
import AddStudentClassDialog from '~/components/staffs/classes/add-student-class-dialog';
import ArrangeScheduleClassDialog from '~/components/staffs/classes/arrange-schedule-class-dialog';
import { ClassScoreboard } from '~/components/staffs/classes/class-scoreboard';
import DelayClassDialog from '~/components/staffs/classes/delay-class-dialog';
import MergeClassDialog from '~/components/staffs/classes/merge-class-dialog';
import { studentClassColumns } from '~/components/staffs/table/student-class-columns';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { DataTable } from '~/components/ui/data-table';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Input } from '~/components/ui/input';
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { fetchAccounts, fetchAvailableTeachersForClass } from '~/lib/services/account';
import { fetchClassDetail, fetchClassScoreboard, fetchMergableClasses } from '~/lib/services/class';
import { fetchLevels } from '~/lib/services/level';
import { fetchSystemConfigByName, fetchSystemConfigServerTime } from '~/lib/services/system-config';
import { Account, Level, Role, StudentStatus } from '~/lib/types/account/account';
import { ActionResult } from '~/lib/types/action-result';
import { Class, ClassStatus } from '~/lib/types/class/class';
import { ClassDetail, ClassScoreDetail } from '~/lib/types/class/class-detail';
import { SystemConfig } from '~/lib/types/config/system-config';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { ALLOW_SKIPPING_LEVEL } from '~/lib/utils/config-name';
import { CLASS_STATUS, SHIFT_TIME } from '~/lib/utils/constants';

type Props = {}
export async function loader({ params, request }: LoaderFunctionArgs) {

  const { idToken, role } = await requireAuth(request);

  if (role !== Role.Staff) {
    return redirect('/');
  }
  if (!params.id) {
    return redirect('/staff/classes')
  }
  const { searchParams } = new URL(request.url);

  const scorePromise = fetchClassScoreboard(params.id, idToken).then((response) => {
    const classScore: ClassScoreDetail = response.data
    return { classScore }
  })

  const levelPromise = fetchLevels().then((res) => {
    return res.data as Level[]
  });

  const promise = fetchClassDetail(params.id, idToken).then((response) => {

    const classDetail: ClassDetail = response.data;
    const includeOtherLevel = searchParams.get('include-other') === 'true'
    const query = {
      page: Number.parseInt(searchParams.get('page-students') || '1'),
      pageSize: Number.parseInt(searchParams.get('size-students') || '10'),
      sortColumn: searchParams.get('column') || 'Id',
      orderByDesc: searchParams.get('desc') === 'true' ? true : false,
      studentStatuses: [StudentStatus.WaitingForClass],
      q: searchParams.get('q') || '',
      levels: includeOtherLevel ? [] : [classDetail.levelId],
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
    })
    return {
      classDetail, studentPromise
    }
  })

  const configPromise = fetchSystemConfigByName({ name: ALLOW_SKIPPING_LEVEL, idToken }).then((response) => {
    const config = response.data as SystemConfig
    return {
      config,
    }
  });

  // const mergeClassesPromise = fetchMergableClasses({ classId: params.id, idToken }).then((res) => {
  //   return res.data as Class[]
  // });

  const serverTimeRes = await fetchSystemConfigServerTime({ idToken });
  const currentServerDateTime = serverTimeRes.data


  const tab = (searchParams.get('tab') || 'general')
  const isOpenStudentClassDialog = searchParams.get('studentClassDialog') === "true"

  return {
    promise, idToken, tab, isOpenStudentClassDialog, scorePromise, levelPromise, configPromise,
    classId: params.id, currentServerDateTime
  }
}
export const getSlotCover = (status: number) => {
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
    case 1: return "text-[#FBDE00] bg-[#faf5d2] font-semibold";
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
  level: Level
}) {
  return <div className='relative bg-white  w-full my-1 rounded-lg '>
    <div
      className="uppercase text-center p-2 rounded-lg font-semibold"
      style={{
        backgroundColor: `${level.themeColor}33`, // 20% opacity
        color: level.themeColor
      }}
    >
      {level.name}
    </div>
  </div>
}
function StatusBadge({ status }: {
  status: number
}) {
  return <div className={`${getStatusStyle(status)} uppercase w-5/6 text-center my-1 p-2 rounded-lg`}>{CLASS_STATUS[status]}</div>
}


function ClassGeneralInformation({ classInfo, idToken, levelPromise }:
  { classInfo: ClassDetail, idToken: string, levelPromise: Promise<Level[]> }) {
  const updateClassSchema = z.object({
    level: z.string().optional(),
    instructorId: z.string().optional(),
    name: z.string().optional(),
    id: z.string(),
    idToken: z.string(),
    action: z.string()
  });

  type UpdateSlotSchema = z.infer<typeof updateClassSchema>;
  const resolver = zodResolver(updateClassSchema)

  const navigate = useNavigate()
  const [isEdit, setIsEdit] = useState(false)
  const [isOpenMerge, setIsOpenMerge] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams();

  const updateFetcher = useFetcher<ActionResult>();
  const deleteFetcher = useFetcher<ActionResult>();

  const {
    handleSubmit,
    formState: { errors },
    control
  } = useRemixForm<UpdateSlotSchema>({
    mode: "onSubmit",
    resolver,
    submitConfig: { action: '/endpoint/classes', method: 'POST', navigate: false },
    fetcher: updateFetcher,
    defaultValues: {
      action: "EDIT",
      id: classInfo.id,
      idToken: idToken
    }
  });

  const { open: handleOpenEditModal, dialog: confirmEditDialog } = useConfirmationDialog({
    title: 'Confirm Updating',
    description: 'Do you want to update this class? This action can not be rollbacked!',
    onConfirm: () => {
      handleSubmit();
    }
  })

  const { open: handleOpenDeleteModal, dialog: confirmDeleteDialog } = useConfirmationDialog({
    title: 'Confirm Deleting',
    description: 'Do you want to delete this class? This action can not be rollbacked!',
    onConfirm: () => {
      handleDelete();
    }
  })

  const { loadingDialog: loadingEditDialog } = useLoadingDialog({
    fetcher: updateFetcher,
    action: () => {
      setSearchParams([...searchParams])
      setIsEdit(false)
    }
  })
  const { loadingDialog: loadingDeleteDialog } = useLoadingDialog({
    fetcher: deleteFetcher,
    action: () => {
      navigate(`/staff/classes`)
    }
  })

  const handleDelete = async () => {
    await fetch("/endpoint/classes", {
      method: "DELETE",
      body: new URLSearchParams({
        action: "DELETE",
        id: classInfo.id,
        idToken: idToken
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    navigate(`/staff/classes`)
  }

  function DetailCard({ title, content, index }: { title: string, content: ReactNode, index: number }) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg border-neutral-200 shadow-md hover:shadow-lg transition-all duration-300 p-6"
        style={{ transitionDelay: `${index * 100}ms` }}>
        <span className="text-xl font-bold">{title}:</span>
        {content}
      </div>
    )
  }

  return (
    <Card className='border-t-4 border-t-theme'>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>
          Basic information of the class
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleOpenEditModal}>
          <div className='flex justify-end gap-2 mb-8'>
            <input type='submit' className='hidden' />
            {
              isEdit ? (
                <>
                  <Button className='bg-green-500 hover:bg-green-300' type="submit"><CheckIcon className='mr-4' /> Save Changes</Button>
                  <Button className='bg-red-400 hover:bg-red-200' type="button" onClick={() => setIsEdit(false)}><XIcon className='mr-4' /> Discard</Button>
                </>
              ) : (
                <Button variant={'theme'} onClick={() => setIsEdit(true)} type="button"><Edit2Icon className='mr-4' /> Edit Class</Button>
              )
            }
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
            <DetailCard title='Class Name' index={0} content={
              <>
                {
                  isEdit ? (
                    <div >
                      <Controller
                        control={control}
                        name='name'
                        defaultValue={classInfo.name}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                          <Input placeholder='Tên lớp' value={value} onChange={onChange} ref={ref} onBlur={onBlur} />
                        )}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{classInfo.name}</p>
                  )
                }
              </>
            } />
            <DetailCard title='Teacher' index={1} content={
              <p className="text-gray-900">
                {
                  isEdit ? (
                    <div>
                      <Controller
                        control={control}
                        name='instructorId'
                        defaultValue={classInfo.instructor?.accountFirebaseId}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                          <GenericCombobox<Account>
                            className=''
                            idToken={idToken}
                            queryKey='teachers'
                            fetcher={async (query) => {
                              const response = await fetchAvailableTeachersForClass({ ...query, classId: classInfo.id });

                              const headers = response.headers;

                              const metadata: PaginationMetaData = {
                                page: parseInt(headers['x-page'] || '1'),
                                pageSize: parseInt(headers['x-page-size'] || '10'),
                                totalPages: parseInt(headers['x-total-pages'] || '1'),
                                totalCount: parseInt(headers['x-total-count'] || '0'),
                              };
                              const data = response.data as Account[]
                              return {
                                data: data,
                                metadata
                              };
                            }}
                            mapItem={(item) => ({
                              label: item?.fullName || item?.userName,
                              value: item?.accountFirebaseId
                            })}
                            prechosenItem={classInfo.instructor}
                            placeholder='Pick a Teacher'
                            emptyText='No teacher available.'
                            errorText='Error loading teacher list.'
                            value={value}
                            onChange={onChange}
                            maxItemsDisplay={10}
                          />
                        )}
                      />

                    </div>
                  ) : (
                    classInfo.instructor ? (
                      <Link className="font-bold underline text-blue-400" to={`/staff/teachers/${classInfo.instructorId}`}>{(classInfo.instructor.fullName || classInfo.instructor.userName)}</Link>
                    ) : (
                      <p className="text-gray-900">Unassigned</p>
                    )
                  )
                }

              </p>
            } />
            <DetailCard title='Total Lessons' index={2} content={
              <p className="text-gray-900">{classInfo.slots.length} / {classInfo.requiredSlots}</p>
            } />
            <DetailCard title='Student Number' index={3} content={
              <p className="text-gray-900">{classInfo.studentNumber} / {classInfo.capacity}</p>
            } />
            <DetailCard title='Level' index={4} content={
              <>
                {
                  isEdit ? (
                    <div >
                      <Controller
                        control={control}
                        name='level'
                        defaultValue={classInfo.levelId}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                          <Select value={value} onValueChange={onChange} >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Pick a level" />
                            </SelectTrigger>
                            <SelectGroup>
                              <SelectContent>
                                <Suspense fallback={<Loader2 className='animate-spin' />}>
                                  <Await resolve={levelPromise}>
                                    {(levels) =>
                                      levels.map(l => (
                                        <SelectItem value={l.id} key={l.id}>{l.name.split('(')[0]}</SelectItem>
                                      ))}
                                  </Await>
                                </Suspense>
                              </SelectContent>
                            </SelectGroup>
                          </Select>
                        )}
                      />

                    </div>
                  ) : (
                    <div className='flex justify-center'>
                      <LevelBadge level={classInfo.level} />
                    </div>
                  )
                }
              </>
            } />
            <DetailCard title='Status' index={5} content={
              <div className='flex justify-center'>
                <StatusBadge status={classInfo.status} />
              </div>
            } />
          </div>
        </Form>
        <div className='mt-12'>
          {
            classInfo.status !== 2 && (
              <div className='flex flex-col justify-center'>
                <div className='font-bold text-xl text-center'>Dangerous Zone</div>
                <div className='flex gap-2 justify-center mt-4'>
                  {
                    classInfo.studentClasses.length === 0 && (
                      <Button onClick={handleOpenDeleteModal} Icon={Trash} iconPlacement='left' variant={'destructive'} type='button'>DELETE CLASS</Button>
                    )
                  }
                  {classInfo.status !== ClassStatus.Finished && (
                    <>
                      <Button onClick={() => setIsOpenMerge(true)} Icon={MergeIcon} iconPlacement='left' variant={'theme'} type='button'>MERGE CLASS</Button>
                      <MergeClassDialog idToken={idToken} isOpen={isOpenMerge} setIsOpen={setIsOpenMerge}
                        scheduleDescription={classInfo.scheduleDescription} classId={classInfo.id} />
                    </>
                  )}
                </div>
              </div>
            )
          }

        </div>
        {confirmDeleteDialog}
        {confirmEditDialog}
        {loadingDeleteDialog}
        {loadingEditDialog}
      </CardContent>
    </Card>
  )
}


function ClassStudentsList({ classInfo, studentPromise, isOpenStudentClassDialog, minimum, idToken, configPromise }: {
  classInfo: ClassDetail,
  studentPromise: Promise<{ students: Account[], metadata: PaginationMetaData }>,
  isOpenStudentClassDialog: boolean,
  minimum: number,
  configPromise: Promise<{ config: SystemConfig }>
  idToken: string
}) {
  const [isOpenAddStudentDialog, setIsOpenAddStudentDialog] = useState(isOpenStudentClassDialog)
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const fetcher = useFetcher<ActionResult>()

  const { loadingDialog } = useLoadingDialog({
    fetcher,
    action: () => {
      setSearchParams([...searchParams])
    }
  })

  const handleDelete = () => {
    fetcher.submit(
      { studentId: selectedStudentId, classId: classInfo.id, idToken },
      {
        method: "DELETE",
        action: "/endpoint/delete-student-class",
      }
    );
  }

  const handleDropOut = () => {
    fetcher.submit(
      { studentId: selectedStudentId, classId: classInfo.id, idToken, isExpelled : true },
      {
        method: "DELETE",
        action: "/endpoint/delete-student-class",
      }
    );
  }

  const { open: handleOpenDeleteModal, dialog: confirmDeleteDialog } = useConfirmationDialog({
    title: 'Delete Learner',
    description: 'Do you want to remove this learner out of class?',
    onConfirm: () => {
      handleDelete();
    }
  })

  const { open: handleOpenDropoutModal, dialog: confirmDropoutDialog } = useConfirmationDialog({
    title: 'Delete Learner',
    description: 'Do you want to dropout this learner? The learner will be deleted from the class and can not be enrolled back again!',
    onConfirm: () => {
      handleDropOut();
    }
  })

  const handleDeleteConfirm = (studentId: string) => {
    setSelectedStudentId(studentId);
    handleOpenDeleteModal()
  }

  const handleDropOutConfirm = (studentId: string) => {
    setSelectedStudentId(studentId);
    handleOpenDropoutModal()
  }

  const columns = studentClassColumns({ handleDeleteConfirm, handleDropOutConfirm })

  const onOpenChange = (isOpen: boolean) => {
    setIsOpenAddStudentDialog(isOpen)
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      studentClassDialog: isOpen ? "true" : "false",
    })
  }


  return (
    <Card className='border-t-4 border-t-theme'>
      <CardHeader>
        <CardTitle>Learner List</CardTitle>
        <CardDescription>
          This list show basic contact information of learners
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* {
          (minimum - classInfo.studentNumber > 0) && (
            <Alert variant="warning" className='my-5 w-full'>
              <AlertTriangle className="h-10 w-10 pr-5" />
              <AlertTitle>
                This class hadn't meet the minimum class size.
              </AlertTitle>
              <AlertDescription>
                You need to add {minimum - classInfo.studentNumber} more learners.
              </AlertDescription>
            </Alert>
          )
        } */}
        <div className='flex flex-col lg:flex-row gap-2'>
          <Button variant={'outline'} disabled={(classInfo.capacity <= classInfo.studentClasses.length)} onClick={() => onOpenChange(true)}>
            <PlusCircle className='mr-4' /> Add new learner
          </Button>
        </div>
        <DataTable data={classInfo.studentClasses} columns={columns}>
        </DataTable>
        {
          (classInfo.capacity > classInfo.studentClasses.length) && (
            <Suspense fallback={<Loader2 className='animate-spin' />}>
              <Await resolve={configPromise}>
                {(data) => (
                  <AddStudentClassDialog isOpen={isOpenAddStudentDialog} setIsOpen={onOpenChange} studentPromise={studentPromise}
                    classInfo={classInfo} idToken={idToken} allowSkipLevel={data.config.configValue === "true"} />
                )}
              </Await>
            </Suspense>
          )
        }
        {confirmDeleteDialog}
        {confirmDropoutDialog}
        {loadingDialog}
      </CardContent>
    </Card>
  )
}

function ClassScheduleList({ classInfo, idToken, slotsPerWeek, totalSlots }: { classInfo: ClassDetail, idToken: string, slotsPerWeek: number, totalSlots: number }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpenAddSlotDialog, setIsOpenAddSlotDialog] = useState(false)
  const [isOpenArrangeDialog, setIsOpenArrangeDialog] = useState(false)
  const [isOpenDelayDialog, setIsOpenDelayDialog] = useState(false)

  classInfo.slots.sort((a, b) => {
    // Compare dates first
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) {
      return dateComparison; // Sorts by date in ascending order
    }
    // If dates are equal, compare shift numbers
    return a.shift - b.shift; // Sorts shift in ascending order
  });

  const updateDescriptionSchema = z.object({
    description: z.string().optional(),
    id: z.string(),
    idToken: z.string(),
    action: z.string()
  });

  type UpdateDescriptionSchema = z.infer<typeof updateDescriptionSchema>;
  const resolver = zodResolver(updateDescriptionSchema)

  const fetcher = useFetcher<ActionResult>();
  const updateFetcher = useFetcher<ActionResult>();

  const {
    handleSubmit,
    formState: { errors },
    control,
    register
  } = useRemixForm<UpdateDescriptionSchema>({
    mode: "onSubmit",
    resolver,
    submitConfig: { action: '/endpoint/classes', method: 'POST', navigate: false },
    fetcher: updateFetcher,
    defaultValues: {
      action: "EDIT",
      id: classInfo.id,
      idToken: idToken
    }
  });

  const { open: handleOpenDeleteModal, dialog: confirmDeleteDialog } = useConfirmationDialog({
    title: 'Delete Class Schedule',
    description: 'Do you want to remove this class schedule entirely? This action can not rollback!',
    onConfirm: () => {
      handleDelete();
    }
  })
  const { open: handleOpenEditModal, dialog: confirmEditDialog } = useConfirmationDialog({
    title: 'Confirm Updating Schedule Description',
    description: 'Do you want to update this class schedule description?',
    onConfirm: () => {
      handleSubmit();
    }
  })

  const { loadingDialog } = useLoadingDialog({
    fetcher,
    action: () => {
      setSearchParams([...searchParams])
    }
  })

  const { loadingDialog: loadingEditDialog } = useLoadingDialog({
    fetcher: updateFetcher,
    action: () => {
      setSearchParams([...searchParams])
    }
  })

  const handleDelete = async () => {
    fetcher.submit({
      action: "DELETE_SCHEDULE",
      id: classInfo.id,
      idToken: idToken
    }, {
      action: "/endpoint/classes",
      method: "DELETE"
    })

  }

  return (
    <Card className='border-t-4 border-t-theme'>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
        <CardDescription>
          Manage Class Schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        {
          classInfo.requiredSlots - classInfo.totalSlots > 0 && (
            <Alert variant="warning" className='my-5'>
              <AlertTriangle className="h-10 w-10 pr-4" />
              <AlertTitle>This class hasn't met the minimum total slots required. </AlertTitle>
              <AlertDescription>
                You need to add {classInfo.requiredSlots - classInfo.totalSlots} more slots
              </AlertDescription>
            </Alert>
          )
        }

        <div className='flex place-content-between gap-2'>
          <div className='flex flex-col lg:flex-row justify-end gap-2'>
            <Button variant={'outline'} disabled={(classInfo.requiredSlots <= classInfo.slots.length)} onClick={() => setIsOpenAddSlotDialog(true)}>
              <PlusCircle className='mr-4' /> Add new slot
            </Button>
            <Button disabled={(classInfo.slots.length > 0)} onClick={() => setIsOpenArrangeDialog(true)} variant={'outline'} Icon={CalendarDays} iconPlacement='left'>Auto-Schedule</Button>
            {
              classInfo.slots.length > 0 && (
                <>
                  <Button disabled={(classInfo.status !== 0)} onClick={() => setIsOpenDelayDialog(true)} className='bg-yellow-500 hover:bg-yellow-300' Icon={ClockArrowDown} iconPlacement='left'>Delay Schedule</Button>
                  <Button disabled={(classInfo.status !== 0 || classInfo.isPublic)} onClick={handleOpenDeleteModal} variant={'destructive'} Icon={Trash} iconPlacement='left'>Delete Schedule</Button>
                </>
              )
            }
          </div>
          <Button Icon={CalendarDays} type='button' variant={'theme'} iconPlacement='left' onClick={() => navigate(`/staff/scheduler?classId=${classInfo.id}&className=${classInfo.name}`)}>View as calendar</Button>
        </div>

        <div className='text-center text-xl mt-4'>
          Total Slots :
          <span className='ml-2 font-bold'>{classInfo.slots.length} / {classInfo.requiredSlots}</span>
        </div>
        <Form onSubmit={handleOpenEditModal}>
          <div className='my-4 flex gap-2'>
            <Input {...register("description")} placeholder="Enter schedule description..."
              className='flex-grow'
              defaultValue={classInfo.scheduleDescription} />
            <Button type='submit' variant={'theme'}>Update</Button>
          </div>
        </Form>

        {classInfo.slots.length > 0 ? <>
          <SlotStatusAnnotation />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-4 gap-x-4 gap-y-8 cursor-pointer'>
            {
              classInfo.slots.map((s, index) => (
                <div className='hover:scale-105 transition-all flex flex-col' onClick={() => navigate(`/staff/classes/slot/${s.id}`)} key={index}>
                  <div className={`py-2 rounded-t-lg font-bold ${getSlotCover(s.status)}`}>
                    <div className='flex gap-2 justify-center'>
                      <Music2 /> Slot {index + 1}
                    </div>
                  </div>
                  <div className='px-2 py-4 rounded-b-lg shadow-md'>
                    <div className='flex flex-col gap-2'>
                      <div><span className='font-bold'>Shift : </span><span className='ml-2'>{s.shift + 1} ({SHIFT_TIME[s.shift]})</span></div>
                      <div><span className='font-bold'>Date : </span><span className='ml-2'>{s.date}</span></div>
                    </div>
                  </div>
                </div>))
            }
          </div>
        </> : <p className='text-center'>No slots.</p>}




        <AddSlotDialog isOpen={isOpenAddSlotDialog} setIsOpen={setIsOpenAddSlotDialog} idToken={idToken} classId={classInfo.id} />
        <ArrangeScheduleClassDialog isOpen={isOpenArrangeDialog} setIsOpen={setIsOpenArrangeDialog} idToken={idToken}
          slotsPerWeek={slotsPerWeek} totalSlots={totalSlots} level={classInfo.level} classId={classInfo.id} />
        <DelayClassDialog isOpen={isOpenDelayDialog} setIsOpen={setIsOpenDelayDialog} classId={classInfo.id} />
        {confirmDeleteDialog}
        {loadingDialog}
        {confirmEditDialog}
        {loadingEditDialog}
      </CardContent>
    </Card>
  )
}


export default function StaffClassDetailPage({ }: Props) {

  const { promise, idToken, isOpenStudentClassDialog, tab, scorePromise, levelPromise, configPromise, classId, currentServerDateTime }
    = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpenMerging, setIsOpenMerging] = useState(false);
  const [isOpenDelaying, setIsOpenDelaying] = useState(false);

  const publishFetcher = useFetcher<ActionResult>();

  const { loadingDialog } = useLoadingDialog({
    fetcher: publishFetcher,
    action: () => {
      setSearchParams([...searchParams])
    }
  })

  const handlePublish = () => {
    publishFetcher.submit({
      action: "PUBLISH",
      id: classId,
      idToken: idToken
    }, {
      action: "/endpoint/classes",
      method: "PATCH"
    })
  }

  const { open: handleOpenPublishModal, dialog: confirmPublishDialog } = useConfirmationDialog({
    title: 'Confirm Publish The Class',
    description: 'Do you want to publish this class. After this, the class will no longer in draft state, all learners and teacher of this class will be annouced? This action can not go back!',
    onConfirm: handlePublish,
    confirmText: 'Publish',
    confirmButtonClassname: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
  });

  const isStudentNumberWarning = (classDetail: ClassDetail, time: string): boolean => {
    const daysBefore = 3;
    const classStartDay = new Date(classDetail.startTime ?? "9999-01-01")
    const now = new Date(time)
    now.setDate(now.getDate() + daysBefore)
    return classDetail.studentClasses.length < classDetail.minimumStudents && now >= classStartDay;
  }

  return (
    <div className='px-8'>
      <div className="flex items-center gap-3 mb-4">
        <Music2 className="h-8 w-8 text-sky-600" />
        <div>
          <h3 className="text-2xl font-bold text-sky-800">Class Detail Information</h3>
          <p className="text-sm text-sky-600">Manage student information, class schedules and transcripts</p>
        </div>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
          {
            (data) => (
              <div className='w-full mt-8'>
                {
                  !data.classDetail.isPublic && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-10 w-10 pr-4" />
                      <div className="flex flex-row justify-between items-center">
                        <div className="">
                          <AlertTitle>The class is not published yet. </AlertTitle>
                          <AlertDescription>
                            Once setup is complete, click the publish button so learners receive updates.
                          </AlertDescription>
                        </div>
                        <Button type='button' onClick={handleOpenPublishModal} className='uppercase' variant={'warning'}>
                          Publish Class
                        </Button>
                      </div>
                    </Alert>
                  )
                }
                {
                  isStudentNumberWarning(data.classDetail, currentServerDateTime) &&
                  (
                    <Alert variant="warning" className='mt-4'>
                      <AlertTriangle className="h-10 w-10 pr-4" />
                      <div className="flex flex-row justify-between items-center">
                        <div className="">
                          <AlertTitle>Minimum Students Requirement Has Not Met!. </AlertTitle>
                          <AlertDescription>
                            Insufficient number of students classes might not be started. You should either merge this class to another class or delay the start date by week(s).<br></br>
                            Please complete the action before the class official start date.
                          </AlertDescription>
                        </div>
                        <div className='flex flex-col lg:flex-row gap-2'>

                          <Button type='button' onClick={() => setIsOpenMerging(true)} className='uppercase' variant={'warning'}>
                            Merge Class
                          </Button>
                          <MergeClassDialog isOpen={isOpenMerging} setIsOpen={setIsOpenMerging} classId={classId}
                            scheduleDescription={data.classDetail.scheduleDescription} idToken={idToken} />
                          <Button type='button' onClick={() => setIsOpenDelaying(true)} className='uppercase' variant={'warning'}>
                            Delay Class
                          </Button>
                          <DelayClassDialog isOpen={isOpenDelaying} setIsOpen={setIsOpenDelaying} classId={classId} />
                        </div>

                      </div>
                    </Alert>
                  )
                }
                <Tabs defaultValue={tab}>
                  <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-4 p-0 h-auto bg-background gap-1">
                    <TabsTrigger value="general" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "general",
                    })} className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>
                      General Information
                    </TabsTrigger>
                    <TabsTrigger value="students" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "students",
                    })} className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>
                      Learner List
                    </TabsTrigger>
                    <TabsTrigger value="scores" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "scores",
                    })} className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>
                      Learner Transript
                    </TabsTrigger>
                    <TabsTrigger value="timeTable" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "timeTable",
                    })} className='py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground'>
                      Class Schedule
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="general">
                    <ClassGeneralInformation classInfo={data.classDetail} idToken={idToken} levelPromise={levelPromise} />
                  </TabsContent>
                  <TabsContent value="students">
                    <ClassStudentsList classInfo={data.classDetail} studentPromise={data.studentPromise}
                      isOpenStudentClassDialog={isOpenStudentClassDialog} minimum={data.classDetail.minimumStudents}
                      idToken={idToken} configPromise={configPromise} />
                  </TabsContent>
                  <TabsContent value="scores">
                    <ClassScoreboard classInfo={data.classDetail} scorePromise={scorePromise} />
                  </TabsContent>
                  <TabsContent value="timeTable">
                    <ClassScheduleList classInfo={data.classDetail} idToken={idToken} slotsPerWeek={data.classDetail.slotsPerWeek} totalSlots={data.classDetail.requiredSlots} />
                  </TabsContent>
                </Tabs>
              </div>
            )
          }
        </Await>

      </Suspense>
      {loadingDialog}
      {confirmPublishDialog}
    </div >
  )
}


function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}

