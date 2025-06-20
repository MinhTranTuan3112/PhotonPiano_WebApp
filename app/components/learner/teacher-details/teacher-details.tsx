import { Gender, TeacherDetail } from '~/lib/types/account/account';
import { CalendarDays, Clock, MapPin, Phone, Mail, User, BookOpen, Users, CircleArrowLeft } from "lucide-react"
import { EntranceTestStatus } from '~/lib/types/entrance-test/entrance-test';
import { Button } from '~/components/ui/button';
import { Link, useNavigate } from '@remix-run/react';
import { CLASS_STATUS, SHIFT_TIME } from '~/lib/utils/constants';
import NoInformation from '~/components/common/no-information';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import { Badge } from '~/components/ui/badge';
import { TestStatusBadge } from '~/components/entrance-tests/table/columns';
import { ClassStatusBadge } from '~/components/staffs/table/class-columns';
import { LevelBadge } from '~/components/staffs/table/student-columns';

type Props = {
  teacher: TeacherDetail
}


export default function TeacherDetails({ teacher }: Props) {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-b from-sky-50 to-white min-h-screen p-6">
      <div className='px-6 py-4'>
        <Button
          variant={'theme'}
          onClick={() => navigate(-1)}
          type='button'
        >
          <CircleArrowLeft className='mr-4' /> Back
        </Button>
      </div>

      {/* Header Section */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-sky-300 to-sky-500 h-32 w-full"></div>
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="relative -mt-16">
                <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-sky-100 shadow-lg">
                  {teacher.avatarUrl ? (
                    <img
                      src={teacher.avatarUrl || "/placeholder.svg"}
                      alt={teacher.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sky-500">
                      <User size={48} />
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1 pt-4 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{teacher.fullName}</h1>
                    <p className="text-sky-600 font-medium">{teacher.level?.name || "Teacher"}</p>
                    {teacher.shortDescription && <p className="text-gray-600 mt-2">{teacher.shortDescription}</p>}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Badge variant={'outline'} className={`uppercase ${teacher.status === 0 ? 'text-green-500' : "text-red-500"}`}>
                      {teacher.status === 0 ? 'Active' : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-2 text-sky-500" size={20} />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="mr-3 text-sky-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-700 italic">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="mr-3 text-sky-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <div className="text-gray-700">{teacher.phone || <NoInformation />}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-3 text-sky-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <div className="text-gray-700">{teacher.address || <NoInformation />}</div>
                  </div>
                </div>
                {teacher.dateOfBirth && (
                  <div className="flex items-start">
                    <CalendarDays className="mr-3 text-sky-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <div className="text-gray-700">{teacher.dateOfBirth ? formatRFC3339ToDisplayableDate(teacher.dateOfBirth, false, false) : <NoInformation />}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start">
                  <User className="mr-3 text-sky-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <Badge variant={'outline'} className={`${teacher.gender === Gender.Male ? 'text-blue-500' : 'text-pink-500'}`}>
                      {teacher.gender === Gender.Male ? 'Male' : 'Female'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Entrance Tests */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="mr-2 text-sky-500" size={20} />
                Entrance Tests ({teacher.instructorEntranceTests.length})
              </h2>

              {teacher.instructorEntranceTests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-sky-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Test Name
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Room
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teacher.instructorEntranceTests.map((test) => (
                        <tr key={test.id} className="hover:bg-sky-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link className="text-sm font-bold text-gray-900 hover:underline" to={`/staff/entrance-tests/${test.id}`}>
                              {test.name}
                            </Link>
                            {/* <div className="text-xs text-gray-500">{test.registerStudents} learners</div> */}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatRFC3339ToDisplayableDate(test.date, false, false)}</div>
                            <div className="text-xs text-gray-500">{SHIFT_TIME[test.shift]}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{test.roomName || "Not assigned"}</div>
                            {test.roomCapacity && (
                              <div className="text-xs text-gray-500">Capacity: {test.roomCapacity}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <TestStatusBadge status={test.testStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No entrance tests assigned.</p>
              )}
            </div>

            {/* Classes */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="mr-2 text-sky-500" size={20} />
                Classes ({teacher.instructorClasses.length})
              </h2>

              {teacher.instructorClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacher.instructorClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-theme hover:shadow-sm"
                      onClick={() => navigate(`/staff/classes/${cls.id}`)}>
                      <div className="flex justify-between items-start">
                        <div className='flex flex-col gap-1'>
                          <Link className="font-bold text-gray-900 hover:underline" to={`/staff/classes/${cls.id}`}>{cls.name}</Link>
                          <LevelBadge level={cls.level} />
                        </div>
                        <ClassStatusBadge status={cls.status} />
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center text-sm">
                          <Users className="mr-2 text-sky-500" size={16} />
                          <span className="text-gray-600">
                            {cls.studentNumber} / {cls.capacity} learners
                          </span>
                        </div>

                        {cls.scheduleDescription && (
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 text-sky-500" size={16} />
                            <span className="text-gray-600">{cls.scheduleDescription}</span>
                          </div>
                        )}

                        {cls.startTime && (
                          <div className="flex items-center text-sm">
                            <CalendarDays className="mr-2 text-sky-500" size={16} />
                            <span className="text-gray-600">
                              {formatRFC3339ToDisplayableDate(cls.startTime, false, false)}
                              {cls.endTime ? ` - ${formatRFC3339ToDisplayableDate(cls.endTime, false, false)}` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No classes assigned.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get status color
function getStatusColor(status: EntranceTestStatus | undefined): string {
  switch (status) {
    case EntranceTestStatus.NotStarted:
      return "bg-blue-100 text-blue-800"
    case EntranceTestStatus.OnGoing:
      return "bg-green-100 text-green-800"
    case EntranceTestStatus.Ended:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}


// Helper function to get status color
function geClassStatusColor(status: number | undefined): string {
  switch (status) {
    case 0:
      return "bg-blue-100 text-blue-800"
    case 1:
      return "bg-green-100 text-green-800"
    case 2:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
