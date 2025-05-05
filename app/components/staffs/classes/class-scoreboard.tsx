import { Await, useFetcher, useRouteLoaderData } from "@remix-run/react"
import { BellRing, Download, Loader2, AlertTriangle, Edit, Eye, Filter, Undo } from "lucide-react"
import { Suspense, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import useLoadingDialog from "~/hooks/use-loading-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { Badge } from "~/components/ui/badge"
import type { ActionResult } from "~/lib/types/action-result"
import type { ClassDetail, ClassScoreDetail } from "~/lib/types/class/class-detail"
import type { loader } from "~/root"
import { cn } from "~/lib/utils"

// Function to determine criteria sort order based on name
function getCriteriaSortOrder(criteriaName: string): number {
  if (!criteriaName) return 1000 // Default for empty names

  // Define category priorities
  const categoryPriorities: Record<string, number> = {
    // Test categories
    test: 100,
    "stability test": 110,
    "coordination test": 120,

    // Assignment categories
    assignment: 200,
    "practice assignment": 210,

    // Workshop categories
    workshop: 300,
    "techniques workshop": 310,

    // Training categories
    training: 400,
    "stretch training": 410,

    // Performance categories
    performance: 500,
    "expression performance": 510,

    // Project categories
    project: 600,
    "duet project": 610,

    // Specific skills
    memorization: 700,

    // Vietnamese categories for backward compatibility
    "kiểm tra nhỏ": 800,
    "bài thi": 810,
    "thi cuối kỳ": 820,
    "điểm chuyên cần": 900,

    // Catch-all (lowest priority)
    others: 1000,
  }

  // Subcategories for more precise sorting
  const subcategoryPriorities: Record<string, number> = {
    // Technique types
    tone: 10,
    rhythmic: 20,
    articulation: 30,
    expression: 40,
    arpeggios: 50,
    hand: 60,
    pedal: 70,
    duet: 80,

    // Vietnamese subcategories for backward compatibility
    "âm sắc": 15,
    "độ chính xác": 25,
    "phong thái": 35,
    "nhịp điệu": 45,
  }

  // Find main category
  let baseOrder = 1000 // Default order
  const lowerCriteriaName = criteriaName.toLowerCase()

  for (const [category, value] of Object.entries(categoryPriorities)) {
    if (lowerCriteriaName.includes(category.toLowerCase())) {
      baseOrder = value
      break
    }
  }

  // Find subcategory modifier
  let subOrder = 0
  for (const [subcategory, value] of Object.entries(subcategoryPriorities)) {
    if (lowerCriteriaName.includes(subcategory.toLowerCase())) {
      subOrder = value
      break
    }
  }

  // Check for numeric identifiers (like "Test 1", "Assignment 2", etc.)
  const numberMatch = criteriaName.match(/\d+/)
  if (numberMatch) {
    const number = Number.parseInt(numberMatch[0], 10)
    // Add a small value for numeric ordering within the same category
    subOrder += number
  }

  // Combine for final sort order
  return baseOrder + subOrder
}

export function ClassScoreboard({
  classInfo,
  scorePromise,
}: {
  classInfo: ClassDetail
  scorePromise: Promise<{ classScore: ClassScoreDetail }>
}) {
  const publishFetcher = useFetcher<ActionResult>()
  const rollbackFetcher = useFetcher<ActionResult>()
  const authData = useRouteLoaderData<typeof loader>("root")

  const { loadingDialog: publishLoadingDialog } = useLoadingDialog({
    loadingMessage: "Publishing scores...",
    successMessage: "Scores published successfully!",
    fetcher: publishFetcher,
    action: () => {
      window.location.reload()
    },
  })

  const { loadingDialog: rollbackLoadingDialog } = useLoadingDialog({
    loadingMessage: "Rolling back publication...",
    successMessage: "Score publication rolled back successfully!",
    fetcher: rollbackFetcher,
    action: () => {
      window.location.reload()
    },
  })

  const handlePublishScores = async () => {
    try {
      publishFetcher.submit(
        { classId: classInfo.id, idToken: authData.idToken },
        { method: "POST", action: "/endpoint/student-class/publish-scores" },
      )
    } catch (error) {
      toast.error("Unable to publish scores. Please try again later.")
    }
  }

  const handleRollbackPublish = async () => {
    try {
      rollbackFetcher.submit(
        { classId: classInfo.id, idToken: authData.idToken },
        { method: "POST", action: "/endpoint/student-class/rollback-publish-scores" },
      )
    } catch (error) {
      toast.error("Unable to rollback publication. Please try again later.")
    }
  }

  const { open: openPublishConfirmDialog, dialog: PublishConfirmDialog } = useConfirmationDialog({
    title: "Confirm Score Publication",
    description:
      "Are you sure you want to publish scores for all students in this class? After publishing, students will be able to view their scores.",
    confirmText: publishFetcher.state === "submitting" ? "Processing..." : "Confirm Publication",
    onConfirm: handlePublishScores,
    confirmButtonClassname: cn(publishFetcher.state === "submitting" && "opacity-70 cursor-not-allowed"),
  })

  const { open: openRollbackConfirmDialog, dialog: RollbackConfirmDialog } = useConfirmationDialog({
    title: "Confirm Rollback Publication",
    description:
      "Are you sure you want to rollback the score publication? Students will no longer be able to view their scores.",
    confirmText: rollbackFetcher.state === "submitting" ? "Processing..." : "Confirm Rollback",
    onConfirm: handleRollbackPublish,
    confirmButtonClassname: cn(rollbackFetcher.state === "submitting" && "opacity-70 cursor-not-allowed"),
  })

  // Check if publish button should be shown/enabled
  const canPublishScores = classInfo.status === 2 && !classInfo.isScorePublished

  // Check if rollback button should be shown/enabled
  const canRollbackPublish = classInfo.isScorePublished

  // Get criteria and sort them according to the provided logic
  const getSortedCriteria = (studentClasses: ClassScoreDetail["studentClasses"]) => {
    const unsortedCriteria = studentClasses?.[0]?.studentClassScores.map((score) => ({ ...score.criteria })) || []

    const sortedCriteria = useMemo(() => {
      return [...unsortedCriteria].sort((a, b) => {
        const orderA = getCriteriaSortOrder(a.name)
        const orderB = getCriteriaSortOrder(b.name)
        return orderA - orderB
      })
    }, [unsortedCriteria])

    return sortedCriteria
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="bg-slate-50 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-800">Class Scoreboard</CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              Staff management panel for student assessment scores
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge
              variant={classInfo.isPublic ? "success" : "outline"}
              className={cn(
                "text-xs font-medium",
                classInfo.isPublic ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-amber-600",
              )}
            >
              {classInfo.isPublic ? "Published Class" : "Unpublished Class"}
            </Badge>
            {classInfo.isScorePublished && (
              <Badge variant="success" className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-medium">
                Scores Published
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!classInfo.isPublic ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-amber-700 font-medium">Class is not yet published</p>
              <p className="text-amber-600 text-sm mt-1">
                Student scoreboard will be activated after the class is published. Students won't be able to view their
                scores until then.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {canPublishScores && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={openPublishConfirmDialog}
                          disabled={publishFetcher.state === "submitting"}
                          className={cn(
                            "bg-blue-600 hover:bg-blue-700 transition-colors",
                            publishFetcher.state === "submitting" && "opacity-70 cursor-not-allowed",
                          )}
                        >
                          {publishFetcher.state === "submitting" ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <BellRing className="mr-2 h-4 w-4" />
                              Publish Scores
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Make scores visible to students</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {canRollbackPublish && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={openRollbackConfirmDialog}
                          disabled={rollbackFetcher.state === "submitting"}
                          variant="destructive"
                          className={cn(rollbackFetcher.state === "submitting" && "opacity-70 cursor-not-allowed")}
                        >
                          {rollbackFetcher.state === "submitting" ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Rolling back...
                            </>
                          ) : (
                            <>
                              <Undo className="mr-2 h-4 w-4" />
                              Rollback Publication
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hide scores from students</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="border-slate-300">
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download scoreboard as Excel spreadsheet</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={scorePromise}>
                  {(data) => {
                    const criteria = getSortedCriteria(data.classScore.studentClasses)

                    return (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700 w-[200px] sticky left-0 bg-slate-50">
                                Student
                              </TableHead>
                              {criteria.map((criteria) => (
                                <TableHead key={criteria.id} className="font-semibold text-slate-700 text-center">
                                  <div className="flex flex-col items-center">
                                    <span>{criteria.name}</span>
                                    <span className="text-xs text-slate-500 font-normal">
                                      Weight: {criteria.weight}
                                    </span>
                                  </div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.classScore.studentClasses.map((studentClass, index) => (
                              <TableRow
                                key={studentClass.student.accountFirebaseId}
                                className={cn(
                                  "hover:bg-slate-50 transition-colors",
                                  index % 2 === 0 && "bg-white",
                                  index % 2 === 1 && "bg-slate-50/50",
                                )}
                              >
                                <TableCell className="font-medium sticky left-0 bg-inherit">
                                  {studentClass.student.fullName ?? studentClass.student.userName}
                                </TableCell>
                                {criteria.map((criteria) => {
                                  const score = studentClass.studentClassScores.find(
                                    (s) => s.criteriaId === criteria.id,
                                  )

                                  // Determine score status for visual feedback
                                  let scoreStatus = "neutral"
                                  const scoreValue = score?.score ?? null

                                  if (scoreValue !== null) {
                                    if (scoreValue >= 85) scoreStatus = "excellent"
                                    else if (scoreValue >= 70) scoreStatus = "good"
                                    else if (scoreValue >= 60) scoreStatus = "average"
                                    else scoreStatus = "needs-improvement"
                                  }

                                  return (
                                    <TableCell key={criteria.id} className="text-center">
                                      <span
                                        className={cn(
                                          "px-3 py-1 rounded-full inline-block min-w-[40px]",
                                          scoreStatus === "excellent" && "bg-green-100 text-green-800",
                                          scoreStatus === "good" && "bg-emerald-100 text-emerald-800",
                                          scoreStatus === "average" && "bg-amber-100 text-amber-800",
                                          scoreStatus === "needs-improvement" && "bg-red-100 text-red-800",
                                          scoreStatus === "neutral" && "bg-slate-100 text-slate-500",
                                        )}
                                      >
                                        {score?.score ?? "-"}
                                      </span>
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  }}
                </Await>
              </Suspense>
            </div>
            {PublishConfirmDialog}
            {RollbackConfirmDialog}
            {publishLoadingDialog}
            {rollbackLoadingDialog}
          </>
        )}
      </CardContent>
      <CardFooter className="bg-slate-50 border-t px-5 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full text-sm text-slate-600 gap-2">
          <div>
            <span>
              <span className="font-medium">Status:</span> {classInfo.status === 2 ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <span>
              <span className="font-medium">Scores:</span> {classInfo.isScorePublished ? "Published" : "Unpublished"}
            </span>
            <span>
              <span className="font-medium">Last updated:</span> {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <div className="flex items-center space-x-4 px-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
