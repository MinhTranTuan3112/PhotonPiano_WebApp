import { LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Music2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import ExamSwitchingDialog from '~/components/entrance-tests/exam-switching-dialog';
import { Button } from '~/components/ui/button';
import Image from '~/components/ui/image';
import { Skeleton } from '~/components/ui/skeleton';
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test';
import { EntranceTestStudentDetail } from '~/lib/types/entrance-test/entrance-test-student-detail';
import { ENTRANCE_TEST_STATUSES, LEVEL, SHIFT_TIME } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

async function getSampleEntranceTest(id: string) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return smapleEntranceTest;
}
async function getSampleEntranceTests() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return sampleEntranceTests;
}
const smapleEntranceTest: EntranceTestStudentDetail = {
  id : "abc",
  studentFirebaseId : "a",
  entranceTestId : "b",
  student: {
    address: "Thong Nhat, Dong Nai",
    email: "nguynan001@gmail.com",
    phone: "0987654321",
    username: "Ng Ân",
    status: 0,
    avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wolfgang-amadeus-mozart_1.jpg/1200px-Wolfgang-amadeus-mozart_1.jpg"
  },
  entranceTest: {
    ...sampleEntranceTests[0],
    entranceTestStudents: [],
    instructor: {
      status: 0,
      username: "HungDepTrai",
      address: "TN, ĐN",
      email: "thanhhung16082003@gmail.com",
      phone: "0987654321",
      avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
    },
  },
  entranceTestResults: [
    {
      criteriaId: "a",
      criteriaName: "Đúng nhịp",
      entranceTestStudentId: "abc",
      id: "a",
      score: 7
    },
    {
      criteriaId: "b",
      criteriaName: "Độ chính xác",
      entranceTestStudentId: "abc",
      id: "b",
      score: 8.5
    },
    {
      criteriaId: "c",
      criteriaName: "Âm sắc",
      entranceTestStudentId: "abc",
      id: "c",
      score: 5.5
    },
    {
      criteriaId: "d",
      criteriaName: "Phong thái",
      entranceTestStudentId: "abc",
      id: "d",
      score: 9
    }
  ],
  bandScore: 7.5,
  rank: 4,
  instructorComment: "Em thể hiện rất tốt tuy nhiên âm nhạc của em còn cứng quá! Em cần luyện tập thêm nhấn nhá các nốt và thả hồn mình vào bản nhạc!",
}

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
    const promise = getSampleEntranceTest(params.id!)
    const entranceTestsPromise = getSampleEntranceTests()
    return { promise , entranceTestsPromise }
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

  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className='px-10'>
      <div className='font-bold text-2xl'>Chi tiết bài thi</div>
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={loaderData.promise}>
          {(entranceTestStudent) => (
            <div className='mt-8'>
              <div>
                <div className="flex place-content-between">
                  <div className='flex gap-4 text-xl font-bold'>
                    <Music2 />
                    Thông tin chung
                  </div>
                  <div className={`${getStatusStyle(entranceTestStudent.entranceTest.status)} rounded-xl px-8 py-2 text-white`}>{ENTRANCE_TEST_STATUSES[entranceTestStudent.entranceTest.status]}</div>
                </div>

                <div className='mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4'>
                  <div className="flex flex-col">
                    <div className="font-bold">Địa điểm</div>
                    <div>{entranceTestStudent.entranceTest.roomName}</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold">Ca thi</div>
                    <div>{entranceTestStudent.entranceTest.shift} ({SHIFT_TIME[entranceTestStudent.entranceTest.shift - 1]})</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold">Ngày thi</div>
                    <div>{entranceTestStudent.entranceTest.date}</div>
                  </div>

                  <div className="flex flex-col">
                    <div className="font-bold">Số học viên tham dự</div>
                    <div>{entranceTestStudent.entranceTest.registerStudents} / {entranceTestStudent.entranceTest.roomCapacity ?? 20}</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold">Loại</div>
                    <div>Thi xếp lớp đầu vào</div>
                  </div>
                </div>
                {
                  entranceTestStudent.entranceTest.status === 0 && (
                    <div className='flex justify-center my-4'>
                      <Button className='px-32 font-bold' onClick={() => setIsOpenSwitchShiftDialog(true)}>Đổi ca thi</Button>
                      <ExamSwitchingDialog isOpen={isOpenSwitchShiftDialog} setIsOpen={setIsOpenSwitchShiftDialog} 
                        entranceTestPromise={loaderData.entranceTestsPromise}/>
                    </div>
                  )
                }
              </div>
              <div className='mt-8'>
                <div className='flex gap-4 text-xl font-bold'>
                  <Music2 />
                  Thông tin giảng viên chấm
                </div>
                {
                  entranceTestStudent.entranceTest.instructor ? (
                    <div className='flex gap-8 mt-4 items-center'>
                      <Image src={entranceTestStudent.entranceTest.instructor?.avatarUrl ?? '/images/noavatar.png'} className='w-48' />
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 flex-grow'>
                        <div className="flex flex-col">
                          <div className="font-bold">Tên</div>
                          <div>{entranceTestStudent.entranceTest.instructor.username}</div>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-bold">SĐT</div>
                          <div>{entranceTestStudent.entranceTest.instructor.phone}</div>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-bold">Email</div>
                          <div>{entranceTestStudent.entranceTest.instructor.email}</div>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-bold">Địa chỉ</div>
                          <div>{entranceTestStudent.entranceTest.instructor.address}</div>
                        </div>
                        <div className="">
                          <Button>Xem hồ sơ của giảng viên</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='italic text-center mt-4'>Chưa có giảng viên được phân công ca thi này</div>
                  )
                }

              </div>
              <div>
                <div className='flex gap-4 text-xl font-bold mt-8'>
                  <Music2 />
                  Kết quả
                </div>
                {
                  entranceTestStudent.entranceTestResults.length > 0 ? (
                    <div className="bg-gray-100 py-10 px-6 md:px-12 lg:px-20 mt-4 rounded-xl relative">
                      <div className="absolute inset-1 z-0 bg-cover bg-no-repeat opacity-5 bg-[url('/images/notes_flows.png')]">
                      </div>
                      <div className="max-w-4xl mx-auto bg-opacity-50 bg-white rounded-xl shadow-lg p-8 relative z-10">
                        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
                          Kết quả bài thi
                        </h1>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-black to-gray-700 text-white rounded-t-xl">
                              <th className="text-left py-3 px-4 font-medium rounded-tl-xl">Tiêu chí</th>
                              <th className="text-center py-3 px-4 font-medium rounded-tr-xl">Điểm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entranceTestStudent.entranceTestResults.map((result) => (
                              <tr
                                key={result.id}
                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 text-gray-800 font-medium">{result.criteriaName}</td>
                                <td className="py-3 px-4 text-center font-bold text-gray-700">
                                  {result.score}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className='mt-4 flex flex-col items-center'>
                          <div className='font-bold text-xl'>
                            <span>Điểm tổng kết : </span>
                            <span className='text-2xl text-red-500'>{entranceTestStudent.bandScore}</span>
                          </div>
                          <div className='font-bold text-lg'>
                            <span>Xếp hạng trình độ : </span>
                            <span className='text-blue-500'>{entranceTestStudent.rank} ({LEVEL[(entranceTestStudent.rank ?? 1) - 1]})</span>
                          </div>
                          <div className='mt-4 flex justify-start w-full'>
                            <span className='font-bold  '>Nhận xét của giảng viên chấm :
                              <span className='font-normal italic'> {entranceTestStudent.instructorComment ?? "Không có nhận xét"}</span>
                            </span>
                          </div>
                          <div className='italic mt-8 text-center text-sm'>
                            Chúc mừng bạn đã thành công vượt qua bài thi này<br />
                            Hãy nhớ truy cập hệ thống thường xuyên để nhận kết quả xếp lớp nhé!</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='italic text-center mt-4'>Kết quả bài thi này chưa được công bố</div>
                  )
                }

              </div>


            </div>
          )}
        </Await>
      </Suspense>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="flex flex-col justify-center items-center  my-4 gap-6">
    <Skeleton className="h-[300px] w-full rounded-md" />
  </div>
}