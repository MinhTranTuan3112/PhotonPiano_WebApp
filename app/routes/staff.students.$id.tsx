import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchAccountDetail } from '~/lib/services/account';
import { AccountDetail, Role } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Clock, Piano } from 'lucide-react';
import { SHIFT_TIME } from '~/lib/utils/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { LearnerSurveyWithAnswersDetail } from '~/lib/types/survey/survey';
import StudiedClassesSection, { ClassCard } from '~/components/learner/learner-details/studied-classes-section';
import StudentHeader from '~/components/learner/learner-details/student-header';
import EntranceTestsSection from '~/components/learner/learner-details/entrance-tests-section';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function loader({ params, request }: LoaderFunctionArgs) {
  try {

    const { idToken, role } = await requireAuth(request);
    if (role !== Role.Staff) {
      return redirect('/');
    }

    if (!params.id) {
      return redirect('/staff/students');
    }

    const id = params.id as string;

    const promise = fetchAccountDetail(id, idToken).then((response) => {
      const student = response.data as AccountDetail;
      return { student };
    });

    return { promise, idToken, id };
  } catch (error) {
    console.error({ error });

    if (isRedirectError(error)) {
      throw error;
    }

    const { message, status } = getErrorDetailsInfo(error);

    throw new Response(message, { status });
  }
}


export default function StaffStudentDetailPage() {
  const { promise, id } = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto px-4 pb-6 pt-2 animate-fade-in">
      <Suspense fallback={<LoadingSkeleton />} key={id}>
        <Await resolve={promise}>
          {({ student }) => (
            <div className="bg-white shadow-2xl rounded-2xl p-6 space-y-8">
              <div className="">
                <h1 className="text-2xl font-bold">Learner details</h1>
                <div className="text-sm text-muted-foreground">View learner details information including basic personal information, classes, free times and surveys</div>
              </div>

              <StudentHeader student={student} />

              <EntranceTestsSection student={student} />

              {student.currentClass && (
                <div className='space-y-4'>
                  <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
                    <Piano className="h-5 w-5 text-theme" />
                    <h3 className='font-bold'>Current Class</h3>
                  </div>
                  <ClassCard classObj={student.currentClass} type='current' />
                </div>
              )}

              <StudiedClassesSection student={student} type='past' />

              <FreeTimesSection student={student} />

              <SurveysSection learnerSurveys={student.learnerSurveys} />
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

function FreeTimesSection({ student }: {
  student: AccountDetail;
}) {

  return <div className="space-y-4">
    <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
      <Clock className="h-5 w-5 text-theme" />
      <h3 className='font-bold'>Free Times</h3>
    </div>

    <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
      <table className="min-w-full bg-white text-sm">
        <thead>
          <tr className="bg-neutral-900 text-white">
            <th className="px-4 py-3 border-r border-neutral-700 text-left">Shift</th>
            {daysOfWeek.map((day, i) => (
              <th key={i} className="px-4 py-3 text-center border-r border-neutral-700 last:border-r-0">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.keys(SHIFT_TIME).map((shiftKey) => {
            const shift = parseInt(shiftKey);
            const isEvenRow = shift % 2 === 0;

            return (
              <tr
                key={shift}
                className={isEvenRow ? "bg-neutral-50" : "bg-white"}
              >
                <td className="px-4 py-3 border-r border-neutral-200 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-theme"></span>
                    {SHIFT_TIME[shift]}
                  </div>
                </td>

                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const hasSlot = student.freeSlots.some(
                    slot => slot.dayOfWeek === dayIndex && slot.shift === shift
                  );

                  return (
                    <td
                      key={dayIndex}
                      className="px-4 py-3 border-r border-neutral-200 last:border-r-0 text-center"
                    >
                      {hasSlot ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-theme text-white shadow-sm">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-400">
                          –
                        </span>
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

    <div className="flex justify-end">
      <div className="flex items-center gap-4 text-sm text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-theme"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-neutral-200"></span>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  </div>
}


function SurveysSection({
  learnerSurveys
}: {
  learnerSurveys: LearnerSurveyWithAnswersDetail[];
}) {

  const navigate = useNavigate();

  return <div className="space-y-4">
    <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
      <ClipboardCheck className="h-5 w-5 text-theme" />
      <h3 className='font-bold'>Completed Surveys</h3>
    </div>

    {learnerSurveys.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {learnerSurveys.map(({ pianoSurvey: survey, createdAt }, index) => (
          <Card
            key={index}
            className="overflow-hidden border-t-4 border-t-theme hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/staff/surveys/${survey.id}`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{survey.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {survey.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <CalendarDays className="mr-2 h-4 w-4 text-theme" />
                <span>Completed on: </span>
                <span className="ml-1 font-medium text-neutral-700">
                  {formatRFC3339ToDisplayableDate(createdAt, false)}
                </span>

              </div>

              {/* Piano key decorative element */}
              <div className="mt-4 flex h-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${i % 2 === 0 ? 'bg-black w-3' : 'bg-white border-r border-neutral-200 w-2'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <Card className="bg-neutral-50 border border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6 text-neutral-500">
          <ClipboardCheck className="h-12 w-12 mb-2 opacity-20" />
          <p>No surveys completed yet</p>
        </CardContent>
      </Card>
    )}
  </div>
}