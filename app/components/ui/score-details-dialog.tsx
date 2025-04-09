import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Check, Edit, Eye, Info, Save } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Progress } from "~/components/ui/progress"
import { Badge } from "~/components/ui/badge"
import type { ScoreDetailsDialogProps } from "~/lib/types/criteria/criteria"
import React from "react"
import { Input } from "./input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { batchUpdateStudentScores } from "~/lib/services/student-class"

export function ScoreDetailsDialog({
    studentName,
    gpa,
    criteriaScores,
    classData,
    isClassView = false,
    idToken,
    onScoresUpdated,
}: ScoreDetailsDialogProps) {
    const [editMode, setEditMode] = React.useState(false)
    const [editedScores, setEditedScores] = React.useState<Record<string, Record<string, number>>>({})
    const [isSaving, setIsSaving] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("table")

    // Function to handle score editing
    const handleScoreChange = (studentId: string, criteriaName: string, value: string) => {
        const numValue = Number.parseFloat(value)
        if (isNaN(numValue) || numValue < 0 || numValue > 10) return

        setEditedScores((prev) => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [criteriaName]: numValue,
            },
        }))
    }

    const saveScores = async () => {
        if (!classData) return

        setIsSaving(true)

        try {
            // Create an array to hold all score updates
            const scores: Array<{
                studentClassId: string
                criteriaId: string
                score: number
            }> = []

            // Log the edited scores for debugging
            console.log("Edited scores:", editedScores)
            console.log("Class data:", classData)

            // Check if studentClasses is available
            if (!classData.studentClasses) {
                // Create a fallback mapping using student IDs
                // This assumes each student has a corresponding class entry with the same ID
                const fallbackStudentClasses = classData.students.map((student) => ({
                    id: student.studentId, // Using studentId as the studentClassId
                    studentFirebaseId: student.studentId,
                }))

                console.log("Created fallback student classes:", fallbackStudentClasses)

                // Add the fallback to classData
                classData.studentClasses = fallbackStudentClasses
            }

            // Process all edited scores
            Object.entries(editedScores).forEach(([studentId, criteriaScores]) => {
                // Find the student
                const student = classData.students.find((s) => s.studentId === studentId)
                if (!student) {
                    console.log("Student not found:", studentId)
                    return
                }

                console.log("Processing student:", student.studentName, "ID:", studentId)

                // For each student, process their criteria scores
                Object.entries(criteriaScores).forEach(([criteriaName, score]) => {
                    // Find the criteria ID that matches this name
                    const criteria = student.criteriaScores.find((c) => c.criteriaName === criteriaName)
                    if (!criteria) {
                        console.log("Criteria not found:", criteriaName)
                        return
                    }

                    console.log("Found criteria:", criteria)

                    // Find the student class by matching studentId with studentFirebaseId
                    const studentClass = classData.studentClasses?.find((sc: any) => sc.studentFirebaseId === studentId)

                    if (!studentClass) {
                        console.log("Student class not found for student ID:", studentId)
                        console.log("Available student classes:", classData.studentClasses)

                        // If still not found, use the student ID directly
                        scores.push({
                            studentClassId: studentId, // Fallback to using studentId directly
                            criteriaId: criteria.criteriaId,
                            score: score,
                        })

                        console.log("Added fallback score using studentId directly")
                        return
                    }

                    console.log("Found student class:", studentClass)

                    // Add the score update to the array
                    scores.push({
                        studentClassId: studentClass.id, // Use the class-specific ID, not Firebase ID
                        criteriaId: criteria.criteriaId,
                        score: score,
                    })

                    // Log the score update for debugging
                    console.log("Score update added:", {
                        studentClassId: studentClass.id,
                        criteriaId: criteria.criteriaId,
                        score: score,
                        studentName: student.studentName,
                        criteriaName: criteria.criteriaName,
                    })
                })
            })

            console.log("Final scores array:", scores)

            // if (scores.length === 0) {
            //     toast({
            //         title: "No scores to update",
            //         description: "Please check the student class mapping or make changes to scores first.",
            //         variant: "destructive",
            //     })
            //     setIsSaving(false)
            //     return
            // }

            // Call the API to update scores
            await batchUpdateStudentScores({
                classId: classData.classId,
                scoresData: {
                    scores: scores,
                },
                idToken: idToken || "",
            })

            // toast({
            //     title: "Scores updated successfully",
            //     description: `Updated ${scores.length} score(s)`,
            //     variant: "default",
            // })

            // Reset edit mode after successful save
            setEditMode(false)

            // Update the local data with the new scores
            if (onScoresUpdated && classData.students) {
                const updatedStudents = classData.students.map((student) => {
                    const studentEdits = editedScores[student.studentId]
                    if (!studentEdits) return student

                    // Create a copy of the student with updated scores
                    const updatedStudent = { ...student }
                    updatedStudent.criteriaScores = student.criteriaScores.map((criteria) => {
                        const newScore = studentEdits[criteria.criteriaName]
                        if (newScore !== undefined) {
                            return { ...criteria, score: newScore }
                        }
                        return criteria
                    })

                    // Recalculate GPA based on weighted scores
                    const totalWeight = updatedStudent.criteriaScores.reduce((sum, c) => sum + c.weight, 0)
                    if (totalWeight > 0) {
                        const weightedSum = updatedStudent.criteriaScores.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0)
                        updatedStudent.gpa = weightedSum
                    }

                    return updatedStudent
                })

                onScoresUpdated(updatedStudents)
            }
        } catch (error) {
            console.error("Error saving scores:", error)
            // toast({
            //     title: "Error updating scores",
            //     description: "Please check the console for more details.",
            //     variant: "destructive",
            // })
        } finally {
            setIsSaving(false)
        }
    }


    // If it's a class view, we'll show all students and their scores
    if (isClassView && classData) {
        // Make sure classData.students exists and is an array before using flatMap
        const students = classData.students || []

        // Get all unique criteria names with proper null checks
        const allCriteriaNames = Array.from(
            new Set(students.flatMap((s) => (s.criteriaScores || []).map((criteria) => criteria.criteriaName))),
        )

        // Calculate class statistics with null checks to avoid division by zero
        const classStats = {
            averageGPA: students.length > 0 ? students.reduce((sum, student) => sum + student.gpa, 0) / students.length : 0,
            passRate: students.length > 0 ? (students.filter((s) => s.isPassed).length / students.length) * 100 : 0,
            highestGPA: students.length > 0 ? Math.max(...students.map((s) => s.gpa)) : 0,
            lowestGPA: students.length > 0 ? Math.min(...students.map((s) => s.gpa)) : 0,
        }

        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View More Details
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[1800px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-xl">Class Score Details - {classData.className}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={editMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setEditMode(!editMode)}
                                disabled={isSaving}
                            >
                                {editMode ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Exit Edit Mode
                                    </>
                                ) : (
                                    <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Scores
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="mt-4 space-y-6">
                        {/* Class Info Summary */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Level</span>
                                    <span className="font-medium ml-4">{classData.levelName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Score Published</span>
                                    <Badge variant={classData.isScorePublished ? "success" : "secondary"} className="ml-4">
                                        {classData.isScorePublished ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Students</span>
                                    <span className="font-medium ml-4">{classData.students.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Average GPA</span>
                                    <span
                                        className={`font-medium ml-4 px-2 py-0.5 rounded-md ${classStats.averageGPA >= 7
                                            ? "bg-green-100 text-green-800"
                                            : classStats.averageGPA >= 5
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {classStats.averageGPA.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Class Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{classStats.passRate.toFixed(1)}%</div>
                                    <Progress value={classStats.passRate} className="h-2 mt-2" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Highest GPA</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{classStats.highestGPA.toFixed(1)}</div>
                                    <Progress value={classStats.highestGPA * 10} className="h-2 mt-2" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Lowest GPA</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{classStats.lowestGPA.toFixed(1)}</div>
                                    <Progress value={classStats.lowestGPA * 10} className="h-2 mt-2" />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs for different views */}
                        <Tabs defaultValue="table" className="" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="table">Table View</TabsTrigger>
                                <TabsTrigger value="cards">Card View</TabsTrigger>
                            </TabsList>

                            <TabsContent value="table" className="mt-0">
                                {/* All Students Scores Table */}
                                <div>
                                    <h3 className="text-sm font-medium mb-3">Student Scores</h3>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="min-w-[150px]">Student</TableHead>
                                                    <TableHead className="text-center">GPA</TableHead>
                                                    <TableHead className="text-center">Status</TableHead>
                                                    {/* Criteria column headers */}
                                                    {allCriteriaNames.map((criteriaName) => (
                                                        <TableHead key={criteriaName} className="text-center min-w-[120px]">
                                                            {criteriaName}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map((student) => {
                                                    return (
                                                        <TableRow key={student.studentId}>
                                                            <TableCell className="font-medium">{student.studentName}</TableCell>
                                                            <TableCell className="text-center">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-md ${student.gpa >= 7
                                                                        ? "bg-green-100 text-green-800"
                                                                        : student.gpa >= 5
                                                                            ? "bg-amber-100 text-amber-800"
                                                                            : "bg-red-100 text-red-800"
                                                                        }`}
                                                                >
                                                                    {student.gpa.toFixed(1)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant={student.isPassed ? "success" : "secondary"}
                                                                    className={student.isPassed ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                                                                >
                                                                    {student.isPassed ? "Passed" : "In Progress"}
                                                                </Badge>
                                                            </TableCell>
                                                            {/* Display scores for each criteria */}
                                                            {allCriteriaNames.map((criteriaName) => {
                                                                const criteriaScore = student.criteriaScores?.find(
                                                                    (c) => c.criteriaName === criteriaName,
                                                                )
                                                                const score = criteriaScore?.score || 0
                                                                const editedScore = editedScores[student.studentId]?.[criteriaName]
                                                                const displayScore = editedScore !== undefined ? editedScore : score

                                                                return (
                                                                    <TableCell key={criteriaName} className="text-center">
                                                                        {editMode ? (
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                max="10"
                                                                                step="0.1"
                                                                                value={displayScore}
                                                                                onChange={(e) =>
                                                                                    handleScoreChange(student.studentId, criteriaName, e.target.value)
                                                                                }
                                                                                className="w-16 h-8 text-center mx-auto"
                                                                            />
                                                                        ) : criteriaScore ? (
                                                                            <span
                                                                                className={`px-2 py-0.5 rounded-md ${displayScore >= 7
                                                                                    ? "bg-green-100 text-green-800"
                                                                                    : displayScore >= 5
                                                                                        ? "bg-amber-100 text-amber-800"
                                                                                        : "bg-red-100 text-red-800"
                                                                                    }`}
                                                                            >
                                                                                {displayScore.toFixed(1)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">-</span>
                                                                        )}
                                                                    </TableCell>
                                                                )
                                                            })}
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="cards" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {students.map((student) => (
                                        <Card key={student.studentId}>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle>{student.studentName}</CardTitle>
                                                    <Badge
                                                        variant={student.isPassed ? "success" : "secondary"}
                                                        className={student.isPassed ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                                                    >
                                                        {student.isPassed ? "Passed" : "In Progress"}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    GPA:{" "}
                                                    <span
                                                        className={`font-medium ${student.gpa >= 7 ? "text-green-600" : student.gpa >= 5 ? "text-amber-600" : "text-red-600"
                                                            }`}
                                                    >
                                                        {student.gpa.toFixed(1)}
                                                    </span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Progress
                                                    value={student.gpa * 10}
                                                    className={`h-2 mb-4 ${student.gpa >= 7 ? "bg-green-100" : student.gpa >= 5 ? "bg-amber-100" : "bg-red-100"
                                                        }`}
                                                />
                                                <div className="space-y-2">
                                                    {(student.criteriaScores || []).map((criteria) => (
                                                        <div key={criteria.criteriaId} className="flex justify-between items-center text-sm">
                                                            <span>{criteria.criteriaName}</span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md ${criteria.score >= 7
                                                                    ? "bg-green-100 text-green-800"
                                                                    : criteria.score >= 5
                                                                        ? "bg-amber-100 text-amber-800"
                                                                        : "bg-red-100 text-red-800"
                                                                    }`}
                                                            >
                                                                {criteria.score.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {editMode && (
                        <DialogFooter className="mt-6">
                            <Button
                                variant="default"
                                onClick={saveScores}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin mr-2">⏳</div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        )
    }

    // Original individual student view
    // Sort criteria by weight (highest first)
    const sortedCriteria = criteriaScores ? [...criteriaScores].sort((a, b) => b.weight - a.weight) : []

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md">
                    <Info className="h-3.5 w-3.5" />
                    <span className="sr-only">View score details</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="">
                    <DialogTitle className="text-xl">Score Details - {studentName}</DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* GPA Summary */}
                    {gpa !== undefined && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Overall GPA</span>
                                <span
                                    className={`font-bold text-lg px-2 py-0.5 rounded-md ${gpa >= 7
                                        ? "bg-green-100 text-green-800"
                                        : gpa >= 5
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {gpa.toFixed(1)}
                                </span>
                            </div>
                            <Progress value={gpa * 10} className="h-2" />
                        </div>
                    )}

                    {/* Visual GPA Gauge - Only visible in non-print mode */}
                    {gpa !== undefined && (
                        <div className="">
                            <div className="flex justify-center">
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        {/* Background circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="283"
                                            strokeDashoffset="0"
                                        />
                                        {/* Foreground circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke={gpa >= 7 ? "#22c55e" : gpa >= 5 ? "#f59e0b" : "#ef4444"}
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="283"
                                            strokeDashoffset={`${283 - 283 * (gpa / 10)}`}
                                            transform="rotate(-90 50 50)"
                                        />
                                        {/* Text in the middle */}
                                        <text
                                            x="50"
                                            y="50"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="24"
                                            fontWeight="bold"
                                            fill="currentColor"
                                        >
                                            {gpa.toFixed(1)}
                                        </text>
                                        <text x="50" y="65" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="currentColor">
                                            GPA
                                        </text>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Criteria Scores Table */}
                    {sortedCriteria.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium mb-3">Score Breakdown</h3>
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableHead>Criteria</TableHead>
                                        <TableHead className="text-center">Weight</TableHead>
                                        <TableHead className="text-center">Score</TableHead>
                                        <TableHead className="text-right">Weighted Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCriteria.map((criteria) => {
                                        const weightedScore = (criteria.score * criteria.weight) / 100
                                        return (
                                            <TableRow key={criteria.criteriaId}>
                                                <TableCell className="font-medium">{criteria.criteriaName}</TableCell>
                                                <TableCell className="text-center">{criteria.weight}%</TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md ${criteria.score >= 7
                                                            ? "bg-green-100 text-green-800"
                                                            : criteria.score >= 5
                                                                ? "bg-amber-100 text-amber-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {criteria.score.toFixed(1)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{weightedScore.toFixed(2)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {gpa !== undefined && (
                                        <TableRow className="bg-gray-50 dark:bg-gray-800/20 font-medium">
                                            <TableCell colSpan={3} className="text-right">
                                                Total GPA
                                            </TableCell>
                                            <TableCell className="text-right">{gpa.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Visual representation of criteria scores */}
                    {sortedCriteria.length > 0 && (
                        <div className="">
                            <h3 className="text-sm font-medium mb-3">Visual Score Breakdown</h3>
                            <div className="space-y-4">
                                {sortedCriteria.map((criteria) => (
                                    <div key={criteria.criteriaId} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                {criteria.criteriaName} ({criteria.weight}%)
                                            </span>
                                            <span
                                                className={`${criteria.score >= 7
                                                    ? "text-green-600"
                                                    : criteria.score >= 5
                                                        ? "text-amber-600"
                                                        : "text-red-600"
                                                    }`}
                                            >
                                                {criteria.score.toFixed(1)}/10
                                            </span>
                                        </div>
                                        <Progress
                                            value={criteria.score * 10}
                                            className={`h-2 ${criteria.score >= 7 ? "bg-green-100" : criteria.score >= 5 ? "bg-amber-100" : "bg-red-100"
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
