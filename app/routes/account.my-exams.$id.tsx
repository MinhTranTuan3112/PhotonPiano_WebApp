import { type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, useAsyncValue, useLoaderData, useNavigate } from "@remix-run/react"
import { CircleHelp, Music2, Award, User, Calendar, Clock, MapPin, Mail, Phone, Home, Piano } from "lucide-react"
import { Suspense, useState } from "react"
import { TestStatusBadge } from "~/components/entrance-tests/table/columns"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import Image from "~/components/ui/image"
import { Skeleton } from "~/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { fetchEntranceTestStudentDetails } from "~/lib/services/entrance-tests"
import { Role } from "~/lib/types/account/account"
import type { EntranceTestStudentDetail } from "~/lib/types/entrance-test/entrance-test-student-detail"
import { requireAuth } from "~/lib/utils/auth"
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from "~/lib/utils/constants"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { formatScore } from "~/lib/utils/score"

type Props = {}

const getStatusStyle = (status: number) => {
  switch (status) {
    case 0:
      return "bg-emerald-500 font-bold"
    case 1:
      return "bg-blue-600 font-bold"
    case 2:
      return "bg-gray-500 font-bold"
    case 3:
      return "bg-gray-500 font-bold"
    default:
      return "bg-black font-bold"
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { idToken, role, accountId } = await requireAuth(request)

    if (role !== Role.Student) {
      return redirect("/")
    }

    if (!params.id) {
      return redirect("/account/my-exams")
    }

    const id = params.id as string

    const promise = fetchEntranceTestStudentDetails({ id, studentId: accountId || "", idToken }).then((response) => {
      const entranceTestStudentPromise: Promise<EntranceTestStudentDetail> = response.data

      const headers = response.headers

      return {
        entranceTestStudentPromise,
        theoryPercentage: Number.parseInt(headers["x-theory-percentage"] || "50"),
        practicalPercentage: Number.parseInt(headers["x-practical-percentage"] || "50"),
      }
    })

    return {
      promise,
      id,
    }
  } catch (error) {
    console.error({ error })

    if (isRedirectError(error)) {
      throw error
    }

    const { message, status } = getErrorDetailsInfo(error)

    throw new Response(message, { status })
  }
}

export default function ExamDetail({ }: Props) {
  const [isOpenSwitchShiftDialog, setIsOpenSwitchShiftDialog] = useState(false)
  const { promise, id } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-8">
          <Piano className="h-8 w-8 text-black" />
          <span>Piano Test Details</span>
        </h1>

        <div className="relative">


          <Suspense fallback={<LoadingSkeleton />} key={id}>
            <Await resolve={promise}>
              {({ entranceTestStudentPromise, ...data }) => (
                <Await resolve={entranceTestStudentPromise}>
                  <EntranceTestStudentContent {...data} />
                </Await>
              )}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function EntranceTestStudentContent({
  theoryPercentage,
  practicalPercentage,
}: {
  theoryPercentage: number
  practicalPercentage: number
}) {
  const entranceTestStudentValue = useAsyncValue()
  const entranceTestStudent = entranceTestStudentValue as EntranceTestStudentDetail
  const practicalScore = entranceTestStudent.entranceTestResults.reduce(
    (acc, result) => (result.score * result.weight) / 100 + acc,
    0,
  )

  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* General Information Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 border-l-4 border-l-theme">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Music2 className="h-5 w-5 text-black" />
            General Information
          </h2>
          {/* <div
            className={`${getStatusStyle(entranceTestStudent.entranceTest.status)} rounded-full px-4 py-1.5 text-white text-sm`}
          >
            {ENTRANCE_TEST_STATUSES[entranceTestStudent.entranceTest.status]}
          </div> */}
          <TestStatusBadge status={entranceTestStudent.entranceTest.testStatus}/>
        </div>

        <div className="p-6 bg-white bg-opacity-80 backdrop-blur-sm relative">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-[url('/images/notes_flows.png')] bg-no-repeat bg-cover opacity-5 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Room</p>
                <p className="text-base font-semibold text-gray-900">{entranceTestStudent.entranceTest.roomName}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Shift</p>
                <p className="text-base font-semibold text-gray-900">
                  {entranceTestStudent.entranceTest.shift + 1} ({SHIFT_TIME[entranceTestStudent.entranceTest.shift]})
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-base font-semibold text-gray-900">{entranceTestStudent.entranceTest.date}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Award className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-base font-semibold text-gray-900">Entrance Test</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Information Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 border-l-4 border-l-theme">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <User className="h-5 w-5 text-black" />
            Teacher Information
          </h2>
        </div>

        <div className="p-6">
          {entranceTestStudent.entranceTest.instructor ? (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage
                  src={entranceTestStudent.entranceTest.instructor.avatarUrl ? entranceTestStudent.entranceTest.instructor.avatarUrl  : "/images/noavatar.png"}
                  alt={entranceTestStudent.entranceTest.instructor.fullName || entranceTestStudent.entranceTest.instructor.email}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {entranceTestStudent.entranceTest.instructor.fullName
                    ? entranceTestStudent.entranceTest.instructor.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                    : "PP"}
                </AvatarFallback>
              </Avatar>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base font-semibold text-gray-900">
                      {entranceTestStudent.entranceTest.instructor.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <div className="text-base font-semibold text-gray-900">
                      {entranceTestStudent.entranceTest.instructor.phone || <NoInformation/>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base font-semibold text-gray-900 italic">
                      {entranceTestStudent.entranceTest.instructor.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Home className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <div className="text-base font-semibold text-gray-900">
                      {entranceTestStudent.entranceTest.instructor.address || <NoInformation/>}
                    </div>
                  </div>
                </div>

                {/* <div className="md:col-span-2 mt-2">
                  <Button type="button" className="bg-black hover:bg-gray-800 text-white" onClick={() => navigate(`../teachers/${entranceTestStudent.entranceTest.instructorId}`)}>
                    View Teacher Profile
                  </Button>
                </div> */}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 italic">No teacher assigned yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 border-t-4 border-t-theme">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Award className="h-5 w-5 text-black" />
            Results
          </h2>
        </div>

        <div className="p-6">
          {entranceTestStudent.entranceTestResults.length > 0 ? (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 relative overflow-hidden">
              {/* Piano keys decorative element */}
              <div className="absolute top-0 left-0 right-0 h-3 flex">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${i % 7 === 2 || i % 7 === 6 ? "w-4 bg-white border border-gray-200" : "w-4 bg-black"}`}
                  />
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-3 flex">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${i % 7 === 2 || i % 7 === 6 ? "w-4 bg-white border border-gray-200" : "w-4 bg-black"}`}
                  />
                ))}
              </div>

              {/* Background image */}
              <div className="absolute inset-0 bg-[url('/images/notes_flows.png')] bg-no-repeat bg-cover opacity-5 z-0"></div>

              <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-xl shadow-lg p-8 relative z-10 mt-4 mb-4">
                <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">Piano Test Results</h3>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-black to-gray-800 text-white">
                        <th className="text-left py-3 px-4 font-medium rounded-tl-lg">Criteria</th>
                        <th className="text-center py-3 px-4 font-medium w-24">Score</th>
                        <th className="text-center py-3 px-4 font-medium rounded-tr-lg w-24">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entranceTestStudent.entranceTestResults.map((result, index) => (
                        <tr
                          key={result.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            }`}
                        >
                          <td className="py-3 px-4 flex flex-row gap-2 items-center">
                            <div className="text-gray-800 font-medium">{result.criteria.name}</div>
                            {result.criteria.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <CircleHelp className="cursor-pointer size-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-sm">
                                    <p>{result.criteria.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">{formatScore(result.score)}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">{result.weight}%</td>
                        </tr>
                      ))}

                      <tr className="bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 text-gray-800 font-medium">Practical score: ({theoryPercentage}%)</td>
                        <td colSpan={2} className="py-3 px-4 text-center font-bold text-gray-700">
                          {formatScore(practicalScore)}
                        </td>
                      </tr>

                      <tr className="bg-gray-100">
                        <td className="py-3 px-4 text-gray-800 font-medium flex flex-row gap-2 items-center">
                          Theoretical score
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CircleHelp className="cursor-pointer size-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-sm">
                                <p>
                                  Multi-staff Reading: Piano sheet music uses the Grand Staff, which includes:
                                  <br />
                                  Treble clef (right hand) usually for the melody.
                                  <br />
                                  Bass clef (left hand) usually for chords or bass notes.
                                  <br />
                                  Pianists must read and process two staves simultaneously, often with multiple voices
                                  in each.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          ({practicalPercentage}%)
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-center font-bold text-gray-700">
                          {entranceTestStudent.theoraticalScore
                            ? formatScore(entranceTestStudent.theoraticalScore)
                            : "(Not available)"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex flex-col items-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-semibold text-gray-700">Final band score:</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                      {entranceTestStudent.bandScore
                        ? formatScore(entranceTestStudent.bandScore || 0)
                        : "(Not available)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-semibold text-gray-700">Level:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {entranceTestStudent.level?.name || "(Not assigned)"}
                    </span>
                  </div>

                  <div className="w-full mt-6 p-4 border-t border-gray-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">Teacher's Comment:</span>
                      <p className="mt-2 italic text-gray-600">
                        {entranceTestStudent.instructorComment || "(No comments provided)"}
                      </p>
                    </div>
                  </div>

                  {entranceTestStudent.bandScore && (
                    <div className="mt-6 text-center p-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                      <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Congratulations on completing this test!</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Remember to check the system regularly to receive class placement results.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Piano className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 italic">Test results have not been published yet</p>
              <p className="text-sm text-gray-400 mt-2">Please check back later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              ))}
              <div className="md:col-span-2 mt-2">
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="p-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}


function NoInformation() {
  return <Badge variant={'outline'} className='text-muted-foreground italic'>
      No information
  </Badge>
}