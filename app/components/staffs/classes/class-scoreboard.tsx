import { Await, useFetcher, useRouteLoaderData } from "@remix-run/react";
import { BellRing, Loader2, Sheet, TriangleAlert } from 'lucide-react';
import React, { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import useLoadingDialog from "~/hooks/use-loading-dialog";
import { publishStudentClassScore } from "~/lib/services/class";
import { ActionResult } from "~/lib/types/action-result";
import { ClassDetail, ClassScoreDetail } from "~/lib/types/class/class-detail";
import { idTokenCookie } from "~/lib/utils/cookie";
import { loader } from "~/root";

export function ClassScoreboard({ classInfo, scorePromise }: { classInfo: ClassDetail, scorePromise: Promise<{ classScore: ClassScoreDetail }> }) {
  const [isPublishing, setIsPublishing] = useState(false)
  const publishFetcher = useFetcher<ActionResult>()
  const authData = useRouteLoaderData<typeof loader>("root")

  const { loadingDialog } = useLoadingDialog({
    loadingMessage: "Publishing scores...",
    successMessage: "Scores published successfully!",
    fetcher: publishFetcher,
    action: () => {
      window.location.reload()
    },
  })

  const handlePublishScores = async () => {
    try {
      // Use the fetcher to submit the form
      publishFetcher.submit(
        { classId: classInfo.id, idToken: authData.idToken },
        { method: "POST", action: "/endpoint/student-class/publish-scores" },
      )
    } catch (error) {
      toast.error("Unable to publish scores. Please try again later.")
    }
  }

  const { open: openConfirmDialog, dialog: ConfirmDialog } = useConfirmationDialog({
    title: "Confirm Score Publication",
    description:
      "Are you sure you want to publish scores for all students in this class? After publishing, students will be able to view their scores.",
    confirmText: publishFetcher.state === "submitting" ? "Processing..." : "Confirm Publication",
    onConfirm: handlePublishScores,
    confirmButtonClassname:
      publishFetcher.state === "submitting"
        ? buttonVariants({ variant: "default", className: "opacity-70 cursor-not-allowed" })
        : buttonVariants({ variant: "default" }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoreboard</CardTitle>
        <CardDescription>This list displays the score columns for each student in the class</CardDescription>
      </CardHeader>
      <CardContent>
        {!classInfo.isPublic ? (
          <div className="bg-gray-100 rounded-lg p-2 flex gap-2 items-center">
            <TriangleAlert size={100} />
            <div>Student scoreboard will be activated after the class is published.</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row justify-start gap-4">
              <Button
                onClick={openConfirmDialog}
                disabled={publishFetcher.state === "submitting"}
                Icon={BellRing}
                iconPlacement="left"
                className={publishFetcher.state === "submitting" ? "opacity-70 cursor-not-allowed" : ""}
              >
                Publish Scores
              </Button>
              <Button Icon={Sheet} iconPlacement="left" variant={"outline"}>
                Export to Excel
              </Button>
            </div>
            <Suspense fallback={<LoadingSkeleton />}>
              <Await resolve={scorePromise}>
                {(data) => {
                  const sortedCriteria =
                    data.classScore.studentClasses[0]?.studentClassScores
                      .map((score) => ({ ...score.criteria }))
                      .sort((a, b) => a.weight - b.weight) || [];

                  return (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-200 text-gray-700">
                            <th className="border border-gray-300 px-4 py-2">Student</th>
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
                                const score = studentClass.studentClassScores.find((s) => s.criteriaId === criteria.id)
                                return (
                                  <td key={criteria.id} className="border border-gray-300 px-4 py-2">
                                    {score?.score ?? "-"}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }}
              </Await>
            </Suspense>
            {ConfirmDialog}
            {loadingDialog}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex justify-center items-center my-4">
      <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
  )
}