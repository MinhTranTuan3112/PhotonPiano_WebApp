import { Await, useFetcher, useRouteLoaderData } from "@remix-run/react";
import { BellRing, Loader2, Sheet, TriangleAlert } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { publishStudentClassScore } from "~/lib/services/class";
import { ClassDetail, ClassScoreDetail } from "~/lib/types/class/class-detail";
import { idTokenCookie } from "~/lib/utils/cookie";
import { loader } from "~/root";

export function ClassScoreboard({ classInfo, scorePromise }: { classInfo: ClassDetail, scorePromise: Promise<{ classScore: ClassScoreDetail }> }) {
  const [isPublishing, setIsPublishing] = useState(false)
  const fetcher = useFetcher()
  const authData = useRouteLoaderData<typeof loader>("root");

  const handlePublishScores = async () => {
    try {
      setIsPublishing(true)
      await publishStudentClassScore({
        classId: classInfo.id,
        idToken: authData.idToken,
      })

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Error publishing scores:", error)
    } finally {
      setIsPublishing(false)
    }
  }
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
          !classInfo.isPublic ? (
            <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center'>
              <TriangleAlert size={100} />
              <div>
                Bảng điểm của học viên sẽ được kích hoạt sau khi công bố lớp.
              </div>
            </div>
          ) : (
            <>
              <div className='flex flex-col lg:flex-row justify-start gap-4'>
                <Button
                  onClick={handlePublishScores}
                  disabled={isPublishing}
                  Icon={isPublishing ? Loader2 : BellRing}
                  iconPlacement="left"
                >
                  {isPublishing ? "Đang công bố..." : "Công bố điểm"}
                </Button>
                <Button Icon={Sheet} iconPlacement='left' variant={'outline'}  >Xuất ra Excel</Button>
              </div>
              <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={scorePromise}>
                  {(data) => {
                    const sortedCriteria = data.classScore.studentClasses[0]?.studentClassScores
                      .map((score) => score.criteria)
                      .sort((a, b) => a.name.localeCompare(b.name)) || [];

                    return (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-200 text-gray-700">
                              <th className="border border-gray-300 px-4 py-2">Học viên</th>
                              {sortedCriteria.map((criteria) => (
                                <th key={criteria.id} className="border border-gray-300 px-4 py-2">
                                  {criteria.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.classScore.studentClasses.map((studentClass) => (
                              <tr key={studentClass.student.accountFirebaseId} className="text-center">
                                <td className="border border-gray-300 px-4 py-2">
                                  {studentClass.student.fullName ?? studentClass.student.userName}
                                </td>
                                {sortedCriteria.map((criteria) => {
                                  const score = studentClass.studentClassScores.find(
                                    (s) => s.criteriaId === criteria.id
                                  );
                                  return (
                                    <td key={criteria.id} className="border border-gray-300 px-4 py-2">
                                      {score?.score ?? "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }}
                </Await>
              </Suspense>
            </>
          )
        }
      </CardContent>
    </Card>

  )
}

function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}