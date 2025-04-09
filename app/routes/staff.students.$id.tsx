import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchAccountDetail, fetchTeachDetail } from '~/lib/services/account';
import { AccountDetail, TeacherDetail } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { useNavigate } from 'react-router-dom';
import { CircleArrowLeft, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import Image from '~/components/ui/image';
import { CLASS_STATUS, SHIFT_TIME } from '~/lib/utils/constants';
import { Class } from '~/lib/types/class/class';

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
    case 0:
      return "bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold";
    case 1:
      return "bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-semibold";
    case 2:
      return "bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white font-semibold";
    case 3:
      return "bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-semibold";
    default:
      return "bg-gradient-to-r from-zinc-700 via-neutral-800 to-black text-white font-semibold";
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
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <CircleArrowLeft className="w-5 h-5" /> Trở về
        </Button>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
          {({ student }) => (
            <div className="bg-white shadow-2xl rounded-2xl p-6 space-y-8">
              {/* Profile Info */}
              <div className="flex flex-col lg:flex-row items-center gap-6 border-b pb-6">
                <Image
                  src={student.avatarUrl || '/images/noavatar.png'}
                  alt={student.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                />
                <div className="flex-1 space-y-2 text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-gray-900">{student.fullName || student.userName}</h2>
                  <p className="text-gray-600">{student.email}</p>
                  <p className="text-gray-600">{student.phone}</p>
                  <p className="text-gray-500">
                    <span className="font-semibold">Level:</span> {student.level?.name.split('(')[0] || 'N/A'}
                  </p>
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-2 text-sm text-gray-500 mt-2">
                    <p><span className="font-semibold">Địa chỉ:</span> {student.address}</p>
                    <p><span className="font-semibold">Giới tính:</span> {student.gender}</p>
                    <p><span className="font-semibold">Ngày sinh:</span> {student.dateOfBirth}</p>
                  </div>
                  <p className="text-gray-500"><span className="font-semibold">Giới thiệu:</span> {student.shortDescription}</p>
                </div>
              </div>

              {/* Current Class */}
              <Section title="🎓 Lớp hiện tại">
                {student.currentClass ? (
                  <Card>
                    <CardHeader status={student.currentClass.status}>
                      {student.currentClass.name}
                    </CardHeader>
                    <CardContent>
                      <ClassDetails classObj={student.currentClass} />
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-gray-400 italic">Chưa có lớp học nào</p>
                )}
              </Section>

              {/* Past Classes */}
              <Section title="📚 Các lớp đã học">
                {student.studentClasses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {student.studentClasses.map(({ class: c }) => (
                      <Card key={c.id}>
                        <CardHeader status={c.status}>{c.name}</CardHeader>
                        <CardContent>
                          <ClassDetails classObj={c} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Chưa có lớp học nào.</p>
                )}
              </Section>

              {/* Free Time */}
              <Section title="⏰ Lịch rảnh">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 font-semibold">
                      <tr>
                        <th className="px-4 py-2 border">Ca học</th>
                        {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((day, i) => (
                          <th key={i} className="px-4 py-2 border">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(SHIFT_TIME).map((shiftKey) => {
                        const shift = parseInt(shiftKey);
                        return (
                          <tr key={shift} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border font-medium text-center">{SHIFT_TIME[shift]}</td>
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                              const hasSlot = student.freeSlots.some(slot => slot.dayOfWeek === dayIndex && slot.shift === shift);
                              return (
                                <td key={dayIndex} className="px-4 py-2 border text-center">
                                  {hasSlot ? (
                                    <span className="inline-block bg-green-500 text-white px-2 py-1 rounded-full text-xs">✔️</span>
                                  ) : (
                                    <span className="text-gray-300">–</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Surveys */}
              <Section title="📝 Khảo sát đã thực hiện">
                {student.learnerSurveys.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {student.learnerSurveys.map((survey, index) => (
                      <Card key={index} className="bg-gray-50">
                        <h4 className="text-lg font-bold text-primary">{survey.pianoSurvey.name}</h4>
                        <p className="text-sm text-gray-500"><span className="font-semibold">Ngày:</span> {new Date(survey.createdAt).toLocaleDateString()}</p>
                        <div className="mt-2">
                          {survey.learnerAnswers.map(answer => (
                            <div key={answer.surveyQuestion.id} className="mb-3">
                              <p className="font-medium">{answer.surveyQuestion.orderIndex}. {answer.surveyQuestion.questionContent}</p>
                              <div className="ml-4 text-gray-600">
                                {answer.answers.length > 0 ? (
                                  answer.answers.map((ans, i) => (
                                    <p key={i} className="text-sm">- {ans}</p>
                                  ))
                                ) : (
                                  <p className="italic text-gray-400 text-sm">Không có câu trả lời</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Chưa có khảo sát nào.</p>
                )}
              </Section>
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
// Components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-2xl font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl border shadow-lg bg-white ${className}`}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode; status: number }> = ({ children, status }) => (
  <div className={`${getClassCover(status)} p-4 rounded-t-xl text-center font-semibold py-2 text-white`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="pt-2 text-sm space-y-1 p-4">{children}</div>
);

const ClassDetails: React.FC<{ classObj: Class }> = ({ classObj }) => (
  <>
    <p><span className="font-semibold">Level:</span> {classObj.level?.name || "N/A"}</p>
    <p><span className="font-semibold">Ngày bắt đầu:</span> {classObj.startTime || "TBD"}</p>
    <p><span className="font-semibold">Thời khóa biểu:</span> {classObj.scheduleDescription || "N/A"}</p>
    <p><span className="font-semibold">Trạng thái:</span> {CLASS_STATUS[classObj.status]}</p>
  </>
);
