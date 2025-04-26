import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useAsyncValue, useLoaderData } from '@remix-run/react';
import { CircleHelp, Music2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Button } from '~/components/ui/button';
import Image from '~/components/ui/image';
import { Skeleton } from '~/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { fetchEntranceTestStudentDetails } from '~/lib/services/entrance-tests';
import { Role } from '~/lib/types/account/account';
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test';
import { EntranceTestStudentDetail } from '~/lib/types/entrance-test/entrance-test-student-detail';
import { requireAuth } from '~/lib/utils/auth';
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { formatScore } from '~/lib/utils/score';

type Props = {}

// async function getSampleEntranceTest(id: string) {
//   await new Promise(resolve => setTimeout(resolve, 1000));
//   return smapleEntranceTest;
// }
async function getSampleEntranceTests() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return sampleEntranceTests;
}
// const smapleEntranceTest: EntranceTestStudentDetail = {
//   id: "abc",
//   studentFirebaseId: "a",
//   entranceTestId: "b",
//   student: {
//     address: "Thong Nhat, Dong Nai",
//     email: "nguynan001@gmail.com",
//     phone: "0987654321",
//     username: "Ng Ân",
//     status: 0,
//     avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wolfgang-amadeus-mozart_1.jpg/1200px-Wolfgang-amadeus-mozart_1.jpg"
//   },
//   entranceTest: {
//     ...sampleEntranceTests[0],
//     entranceTestStudents: [],
//     instructor: {
//       status: 0,
//       username: "HungDepTrai",
//       address: "TN, ĐN",
//       email: "thanhhung16082003@gmail.com",
//       phone: "0987654321",
//       avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
//     },
//   },
//   entranceTestResults: [
//     {
//       criteriaId: "a",
//       criteriaName: "Đúng nhịp",
//       entranceTestStudentId: "abc",
//       id: "a",
//       score: 7
//     },
//     {
//       criteriaId: "b",
//       criteriaName: "Độ chính xác",
//       entranceTestStudentId: "abc",
//       id: "b",
//       score: 8.5
//     },
//     {
//       criteriaId: "c",
//       criteriaName: "Âm sắc",
//       entranceTestStudentId: "abc",
//       id: "c",
//       score: 5.5
//     },
//     {
//       criteriaId: "d",
//       criteriaName: "Phong thái",
//       entranceTestStudentId: "abc",
//       id: "d",
//       score: 9
//     }
//   ],
//   bandScore: 7.5,
//   level: 4,
//   instructorComment: "Em thể hiện rất tốt tuy nhiên âm nhạc của em còn cứng quá! Em cần luyện tập thêm nhấn nhá các nốt và thả hồn mình vào bản nhạc!",
// }

const getStatusStyle = (status: number) => {
  switch (status) {
    case 0: return "bg-green-400 font-bold";
    case 1: return "bg-blue-500 font-bold";
    case 2: return "bg-gray-400 font-bold";
    case 3: return "bg-gray-400 font-bold";
    default: return "bg-black font-bold";
  }
};

export async function loader({ request, params }: LoaderFunctionArgs) {

  try {


    const { idToken, role, accountId } = await requireAuth(request);

    if (role !== Role.Student) {
      return redirect('/');
    }

    if (!params.id) {
      return redirect('/account/my-exams');
    }

    const id = params.id as string;

    const promise = fetchEntranceTestStudentDetails({ id, studentId: accountId || '', idToken }).then((response) => {
      const entranceTestStudentPromise: Promise<EntranceTestStudentDetail> = response.data;

      const headers = response.headers;

      return {
        entranceTestStudentPromise,
        theoryPercentage: parseInt(headers['x-theory-percentage'] || '50'),
        practicalPercentage: parseInt(headers['x-practical-percentage'] || '50'),
      }
    });

    return {
      promise,
      id
    }

  } catch (error) {

    console.error({ error });

    if (isRedirectError(error)) {
      throw error;
    }

    const { message, status } = getErrorDetailsInfo(error);

    throw new Response(message, { status });
  }
}

export default function ExamDetail({ }: Props) {

  const [isOpenSwitchShiftDialog, setIsOpenSwitchShiftDialog] = useState(false)

  const { promise, id } = useLoaderData<typeof loader>();

  return (
    <div className='px-10'>
      <div className='font-bold text-2xl'>Test details</div>
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
  )
}

function EntranceTestStudentContent({
  theoryPercentage,
  practicalPercentage
}: {
  theoryPercentage: number;
  practicalPercentage: number;
}) {

  const entranceTestStudentValue = useAsyncValue();

  const entranceTestStudent = entranceTestStudentValue as EntranceTestStudentDetail;

  const practicalScore = entranceTestStudent.entranceTestResults.reduce((acc, result) => (result.score * result.weight / 100) + acc, 0);

  return <div className='mt-8'>
    <div>
      <div className="flex place-content-between">
        <div className='flex gap-4 text-xl font-bold'>
          <Music2 />
          General information
        </div>
        <div className={`${getStatusStyle(entranceTestStudent.entranceTest.status)} rounded-xl px-8 py-2 text-white`}>{ENTRANCE_TEST_STATUSES[entranceTestStudent.entranceTest.status]}</div>
      </div>

      <div className='mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4'>
        <div className="flex flex-col">
          <div className="font-bold">Room</div>
          <div>{entranceTestStudent.entranceTest.roomName}</div>
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Shift</div>
          <div>{entranceTestStudent.entranceTest.shift + 1} ({SHIFT_TIME[entranceTestStudent.entranceTest.shift]})</div>
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Date</div>
          <div>{entranceTestStudent.entranceTest.date}</div>
        </div>

        {/* <div className="flex flex-col">
          <div className="font-bold">Số học viên tham dự</div>
          <div>{entranceTestStudent.entranceTest.registerStudents} / {entranceTestStudent.entranceTest.roomCapacity ?? 20}</div>
        </div> */}
        <div className="flex flex-col">
          <div className="font-bold">Type</div>
          <div>Entrance test</div>
        </div>
      </div>
      {/* {
      entranceTestStudent.entranceTest.status === 0 && (
        <div className='flex justify-center my-4'>
          <Button className='px-32 font-bold' onClick={() => setIsOpenSwitchShiftDialog(true)}>Đổi ca thi</Button>
          <ExamSwitchingDialog isOpen={isOpenSwitchShiftDialog} setIsOpen={setIsOpenSwitchShiftDialog} 
            entranceTestPromise={loaderData.entranceTestsPromise}/>
        </div>
      )
    } */}
    </div>
    <div className='mt-8'>
      <div className='flex gap-4 text-xl font-bold'>
        <Music2 />
        Teacher information
      </div>
      {
        entranceTestStudent.entranceTest.instructor ? (
          <div className='flex gap-8 mt-4 items-center'>
            <Image src={entranceTestStudent.entranceTest.instructor?.avatarUrl ?? '/images/noavatar.png'} className='w-48' />
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 flex-grow'>
              <div className="flex flex-col">
                <div className="font-bold">Name</div>
                <div>{entranceTestStudent.entranceTest.instructor.fullName}</div>
              </div>
              <div className="flex flex-col">
                <div className="font-bold">Phone</div>
                <div>{entranceTestStudent.entranceTest.instructor.phone}</div>
              </div>
              <div className="flex flex-col">
                <div className="font-bold">Email</div>
                <div>{entranceTestStudent.entranceTest.instructor.email}</div>
              </div>
              <div className="flex flex-col">
                <div className="font-bold">Address</div>
                <div>{entranceTestStudent.entranceTest.instructor.address}</div>
              </div>
              <div className="">
                <Button type='button'>View teacher profile</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className='italic text-center mt-4'>
            No teacher assigned yet<br />
          </div>
        )
      }

    </div>
    <div>
      <div className='flex gap-4 text-xl font-bold mt-8'>
        <Music2 />
        Results
      </div>
      {
        entranceTestStudent.entranceTestResults.length > 0 ? (
          <div className="bg-gray-100 py-10 px-6 md:px-12 lg:px-20 mt-4 rounded-xl relative">
            <div className="absolute inset-1 z-0 bg-cover bg-no-repeat opacity-5 bg-[url('/images/notes_flows.png')]">
            </div>
            <div className="max-w-4xl mx-auto bg-opacity-50 bg-white rounded-xl shadow-lg p-8 relative z-10">
              <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
                Piano test results
              </h1>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-black to-gray-700 text-white rounded-t-xl">
                    <th className="text-left py-3 px-4 font-medium rounded-tl-xl">Criteria</th>
                    <th className="text-center py-3 px-4 font-medium">Score</th>
                    <th className="text-center py-3 px-4 font-medium rounded-tr-xl">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {entranceTestStudent.entranceTestResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 flex flex-row gap-2 items-center">
                        <div className="text-gray-800 font-medium">{result.criteria.name}</div>
                        {result.criteria.description && <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CircleHelp className='cursor-pointer size-4 text-gray-400' />
                            </TooltipTrigger>
                            <TooltipContent side='right'>
                              <p className='max-w-prose'>{result.criteria.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>}

                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {formatScore(result.score)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {result.weight}%
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800 font-medium">Practical score: &#40;{theoryPercentage}%&#41;</td>
                    <td colSpan={2} className="py-3 px-4 text-center font-bold text-gray-700">{formatScore(practicalScore)}</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800 font-medium flex flex-row gap-2 items-center">Theoretical score <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleHelp className='cursor-pointer size-4 text-gray-400' />
                        </TooltipTrigger>
                        <TooltipContent side='right'>
                          <p className='max-w-prose'>
                            Multi-staff Reading: Piano sheet music uses the Grand Staff, which includes:
                            <br />
                            Treble clef &#40;right hand&#41; usually for the melody.
                            <br />
                            Bass clef &#40;left hand&#41; usually for chords or bass notes.
                            <br />
                            Pianists must read and process two staves simultaneously, often with multiple voices in each.

                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> &#40;{practicalPercentage}%&#41;</td>
                    <td colSpan={2} className="py-3 px-4 text-center font-bold text-gray-700">{entranceTestStudent.theoraticalScore ? formatScore(entranceTestStudent.theoraticalScore) : '(Chưa có)'}</td>
                  </tr>
                </tbody>
              </table>

              <div className='mt-4 flex flex-col items-center'>
                <div className='font-bold text-xl'>
                  <span>Final band score : </span>
                  <span className='text-2xl text-red-500'>{entranceTestStudent.bandScore ? formatScore(entranceTestStudent.bandScore || 0) : '(Chưa có)'}</span>
                </div>
                <div className='font-bold text-lg'>
                  <span>Level : </span>
                  <span className='text-blue-500'>{entranceTestStudent.level?.name}</span>
                </div>
                <div className='mt-4 flex justify-start w-full'>
                  <span className='font-bold  '>Comment :
                    <span className='font-normal italic'> {entranceTestStudent.instructorComment || "(None)"}</span>
                  </span>
                </div>
                <div className='italic mt-8 text-center text-sm'>
                  Congratulations on passing this test<br />
                  Remember to check the system regularly to receive class placement results!
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className='italic text-center mt-4'>
            Test results have not been published yet<br />
          </div>
        )
      }

    </div>
  </div>
}

function LoadingSkeleton() {
  return <div className="flex flex-col justify-center items-center  my-4 gap-6">
    <Skeleton className="h-[300px] w-full rounded-md" />
  </div>
}

// export function ErrorBoundary() {
//   return <div className="flex flex-col justify-center items-center my-24 p-8 bg-gray-200 text-black rounded-lg shadow-lg relative">
//     {/* Background Images */}
//     <img src="/images/notes_flows.png" alt="Musical Notes" className="absolute top-0 left-0 opacity-10 w-full" />
//     <img src="/images/grand_piano_1.png" alt="Grand Piano" className="absolute bottom-0 right-0 opacity-20 w-1/3" />

//     {/* Icon and Heading */}
//     <div className="flex flex-col items-center relative z-10">
//       <h1 className="text-xl font-extrabold">Chưa có kết quả</h1>
//       <h2 className="text-base font-bold mt-2">Bạn vui lòng chờ kết quả thi được công bố nhé</h2>
//     </div>
//   </div>
// }