import { zodResolver } from '@hookform/resolvers/zod';
import { Select } from '@radix-ui/react-select';
import { ActionFunctionArgs, data, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, Link, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { Bell, BellRing, CalendarDays, CheckIcon, Edit2Icon, Loader2, Music2, PlusCircle, Sheet, Speaker, Trash, TriangleAlert, XIcon } from 'lucide-react';
import React, { ReactNode, Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import AddSlotDialog from '~/components/staffs/classes/add-slot-dialog';
import AddStudentClassDialog from '~/components/staffs/classes/add-student-class-dialog';
import ArrangeScheduleClassDialog from '~/components/staffs/classes/arrange-schedule-class-dialog';
import { ClassScoreboard } from '~/components/staffs/classes/class-scoreboard';
import { studentClassColumns } from '~/components/staffs/table/student-class-columns';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DataTable } from '~/components/ui/data-table';
import GenericCombobox from '~/components/ui/generic-combobox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { fetchAccounts } from '~/lib/services/account';
import { fetchClassDetail, fetchClassScoreboard, fetchDeleteStudentClass } from '~/lib/services/class';
import { fetchLevels } from '~/lib/services/level';
import { fetchSystemConfigByName } from '~/lib/services/system-config';
import { Account, Level, Role, StudentStatus } from '~/lib/types/account/account';
import { ActionResult } from '~/lib/types/action-result';
import { ClassDetail, ClassScoreDetail } from '~/lib/types/class/class-detail';
import { SystemConfig } from '~/lib/types/config/system-config';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { ALLOW_SKIPPING_LEVEL } from '~/lib/utils/config-name';
import { CLASS_STATUS, LEVEL, SHIFT_TIME } from '~/lib/utils/constants';
import { formEntryToString } from '~/lib/utils/form';
import { getParsedParamsArray } from '~/lib/utils/url';

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

  const tab = (searchParams.get('tab') || 'general')
  const isOpenStudentClassDialog = searchParams.get('studentClassDialog') === "true"

  return {
    promise, idToken, tab, isOpenStudentClassDialog, scorePromise, levelPromise, configPromise, classId: params.id
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


function ClassGeneralInformation({ classInfo, idToken, levelPromise }: { classInfo: ClassDetail, idToken: string, levelPromise: Promise<Level[]> }) {
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
    submitConfig: { action: '/api/classes', method: 'POST', navigate: false },
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

  const handleDelete = () => {
    deleteFetcher.submit({
      action: "DELETE",
      id: classInfo.id,
      idToken: idToken
    }, {
      action: "/api/classes",
      method: "DELETE"
    })
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
    <Card>
      <CardHeader>
        <CardTitle>General Inforamtion</CardTitle>
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
                              const response = await fetchAccounts({ ...query, roles: [Role.Instructor] });

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
            !classInfo.isPublic && (
              <div className='flex flex-col justify-center'>
                <div className='font-bold text-xl text-center'>Dangerous Zone</div>
                <div className='flex gap-2 justify-center mt-4'>
                  <Button onClick={handleOpenDeleteModal} Icon={Trash} iconPlacement='left' variant={'destructive'}>DELETE CLASS</Button>
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
        action: "/api/delete-student-class",
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

  const handleDeleteConfirm = (studentId: string) => {
    setSelectedStudentId(studentId);
    handleOpenDeleteModal()
  }

  const columns = studentClassColumns({ handleDeleteConfirm: handleDeleteConfirm })

  const onOpenChange = (isOpen: boolean) => {
    setIsOpenAddStudentDialog(isOpen)
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      studentClassDialog: isOpen ? "true" : "false",
    })
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Learner List</CardTitle>
        <CardDescription>
          This list show basic contact information of learners
        </CardDescription>
      </CardHeader>
      <CardContent>
        {
          (minimum - classInfo.studentNumber > 0) && (
            <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center mb-4'>
              <TriangleAlert size={100} />
              <div>
                This class hadn't meet the minimum class size.<br></br>
                You need to add {minimum - classInfo.studentNumber} more learners
              </div>
            </div>
          )
        }
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
    submitConfig: { action: '/api/classes', method: 'POST', navigate: false },
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

  const handleDelete = () => {
    fetcher.submit({
      action: "DELETE_SCHEDULE",
      id: classInfo.id,
      idToken: idToken
    }, {
      action: "/api/classes",
      method: "DELETE"
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
        <CardDescription>
          Manage Class Schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        {
          classInfo.requiredSlots - classInfo.totalSlots > 0 && (
            <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center mb-4'>
              <TriangleAlert size={100} />
              <div>
                This class hasn't met the minimum total slots required<br></br>
                You need to add {classInfo.requiredSlots - classInfo.totalSlots} more slots
              </div>
            </div>
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
                <Button disabled={(classInfo.status !== 0 || classInfo.isPublic)} onClick={handleOpenDeleteModal} variant={'destructive'} Icon={Trash} iconPlacement='left'>Delete Schedule</Button>
              )
            }
          </div>
          <Button Icon={CalendarDays} iconPlacement='left' onClick={() => navigate(`/staff/scheduler?classId=${classInfo.id}&className=${classInfo.name}`)}>View as calendar</Button>
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
            <Button>Update</Button>
          </div>
        </Form>

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
              </div>
            ))
          }
        </div>
        <AddSlotDialog isOpen={isOpenAddSlotDialog} setIsOpen={setIsOpenAddSlotDialog} idToken={idToken} classId={classInfo.id} />
        <ArrangeScheduleClassDialog isOpen={isOpenArrangeDialog} setIsOpen={setIsOpenArrangeDialog} idToken={idToken}
          slotsPerWeek={slotsPerWeek} totalSlots={totalSlots} level={classInfo.level} classId={classInfo.id} />
        {confirmDeleteDialog}
        {loadingDialog}
        {confirmEditDialog}
        {loadingEditDialog}
      </CardContent>
    </Card>
  )
}


export default function StaffClassDetailPage({ }: Props) {

  const { promise, idToken, isOpenStudentClassDialog, tab, scorePromise, levelPromise, configPromise, classId } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams();

  const publishFetcher = useFetcher<ActionResult>();

  const { open: handleOpenPublishModal, dialog: confirmPublishDialog } = useConfirmationDialog({
    title: 'Confirm Publish The Class',
    description: 'Do you want to publish this class. After this, the class will no longer in draft state, all learners and teacher of this class will be annouced? This action can not go back!',
    onConfirm: () => {
      handlePublish();
    }
  })
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
      action: "/api/classes",
      method: "PATCH"
    })
  }
  return (
    <div className='px-8'>
      <h3 className="text-lg font-medium">Class Detail Information</h3>
      <p className="text-sm text-muted-foreground">
        Manage student information, class schedules and transcripts
      </p>
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
          {
            (data) => (
              <div className='w-full mt-8'>
                {
                  !data.classDetail.isPublic && (
                    <div className='flex place-content-between gap-2 bg-gray-100 rounded-lg p-2  items-center'>
                      <div className='flex gap-2 items-center'>
                        <TriangleAlert size={64} />
                        <div>
                          The class is not published yet. Once setup is complete, click the publish button so learners receive updates.
                        </div>
                      </div>
                      <Button onClick={handleOpenPublishModal}>PUBLISH CLASS</Button>
                    </div>
                  )
                }


                <Tabs defaultValue={tab}>
                  <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                    <TabsTrigger value="general" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "general",
                    })}>
                      General Information
                    </TabsTrigger>
                    <TabsTrigger value="students" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "students",
                    })}>
                      Learner List
                    </TabsTrigger>
                    <TabsTrigger value="scores" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "scores",
                    })}>
                      Learner Transript
                    </TabsTrigger>
                    <TabsTrigger value="timeTable" onClick={() => setSearchParams({
                      ...Object.fromEntries(searchParams.entries()),
                      tab: "timeTable",
                    })}>
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