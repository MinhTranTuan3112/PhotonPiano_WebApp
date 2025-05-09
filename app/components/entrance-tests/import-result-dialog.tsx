import { CriteriaFor, type MinimalCriteria } from "~/lib/types/criteria/criteria"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { AlertCircle, AlertCircleIcon, ArrowRight, Check, Download, FileSpreadsheet, InfoIcon, Upload, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { EntranceTestStudentWithResults } from "~/lib/types/entrance-test/entrance-test-student"
import ExcelJS from "exceljs"
import FileSaver from "file-saver"
import { FileUpload } from "../ui/file-upload"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { ScrollArea } from "../ui/scroll-area"
import { useFetcher } from "@remix-run/react"
import type { action } from "~/routes/import-entrance-test-result"
import { toast } from "sonner"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { Role } from "~/lib/types/account/account"
import { toastWarning } from "~/lib/utils/toast-utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Progress } from "../ui/progress"

export type ImportResultDialogProps = {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    criterias: MinimalCriteria[]
    entranceTestStudents: EntranceTestStudentWithResults[]
    role: Role
}

type ImportStep = "download" | "upload" | "preview" | "complete"

export default function ImportResultDialog({
    isOpen,
    setIsOpen,
    entranceTestStudents: initialEntranceTestStudents,
    criterias,
    role,
}: ImportResultDialogProps) {
    const [currentStep, setCurrentStep] = useState<ImportStep>("download")
    const [isDownloadingFile, setIsDownloadingFile] = useState(false)
    const [entranceTestStudents, setEntranceTestStudents] = useState(initialEntranceTestStudents)
    const [file, setFile] = useState<File | undefined>()
    const [isImported, setIsImported] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<string>("all")

    const handleDownload = async () => {
        setIsDownloadingFile(true)

        try {
            const workbook = new ExcelJS.Workbook()
            const sheet = workbook.addWorksheet("Kết quả thi")

            const includeTheory = role === Role.Staff
            const includeComment = role === Role.Instructor

            // Set column widths
            const baseColumns = [
                { header: "Learner", key: "fullName", width: 30 },
                ...(includeTheory ? [{ header: "Theory score", key: "theory", width: 20 }] : []),
                ...criterias.map((c, i) => ({
                    header: c.name,
                    key: `criteria_${i}`,
                    width: 20,
                })),
                ...(includeComment ? [{ header: "Comment", key: "comment", width: 40 }] : []),
            ]
            sheet.columns = baseColumns

            // Add header styles
            const header = sheet.getRow(1)
            header.eachCell((cell) => {
                cell.protection = { locked: true }
                cell.font = { bold: true }
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFD3D3D3" },
                }
            })

            entranceTestStudents.forEach((student) => {
                const row: (string | number)[] = [student.fullName || ""]

                if (includeTheory) {
                    row.push(student.theoraticalScore || 0)
                }

                criterias.forEach((c) => {
                    const score = student.entranceTestResults.find((r) => r.criteriaId === c.id)?.score || 0
                    row.push(score)
                })

                if (includeComment) row.push(student.instructorComment || "")

                const addedRow = sheet.addRow(row)

                // Unlock editable cells
                const startCol = includeTheory ? 2 : 2
                const endCol = addedRow.cellCount
                for (let i = startCol; i <= endCol; i++) {
                    addedRow.getCell(i).protection = { locked: false }
                }
            })

            await sheet.protect("mypassword", {
                selectLockedCells: false,
                selectUnlockedCells: true,
                formatCells: false,
                insertRows: false,
                deleteRows: false,
            })

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })

            FileSaver.saveAs(blob, "template.xlsx")
            setCurrentStep("upload")
        } catch (error) {
            console.error("Error generating Excel file:", error)
            toastWarning("Failed to generate template file")
        } finally {
            setIsDownloadingFile(false)
        }
    }

    const handleFileUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setValidationErrors([])

        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = async (e) => {
            if (!e.target?.result) {
                setIsUploading(false)
                return
            }

            try {
                const workbook = new ExcelJS.Workbook()
                await workbook.xlsx.load(e.target.result as ArrayBuffer)
                const sheet = workbook.worksheets[0]

                const includeTheory = role === Role.Staff
                const includeComment = role === Role.Instructor

                const hasErrors = false
                const errors: string[] = []
                const updatedStudents = [...entranceTestStudents]

                sheet.eachRow((row, rowIndex) => {
                    if (rowIndex === 1) return // skip header

                    let colIndex = 1

                    const fullName = row.getCell(colIndex++).text
                    const studentIndex = updatedStudents.findIndex((s) => s.fullName === fullName)

                    if (studentIndex === -1) {
                        errors.push(`Student "${fullName}" not found in the system`)
                        return
                    }

                    // Validate theory score if included
                    let theoraticalScore: number | undefined
                    if (includeTheory) {
                        const theoryCell = row.getCell(colIndex++)
                        const theoryValue = theoryCell.text
                        theoraticalScore = Number(theoryValue)

                        if (isNaN(theoraticalScore)) {
                            errors.push(`Invalid theory score for ${fullName}: "${theoryValue}" is not a number`)
                            return
                        }

                        if (theoraticalScore < 0 || theoraticalScore > 10) {
                            errors.push(`Invalid theory score for ${fullName}: ${theoraticalScore} must be between 0 and 10`)
                            return
                        }
                    }

                    // Validate criteria scores
                    const entranceTestResultsFromFile: { criteriaId: string; score: number }[] = []

                    for (let i = 0; i < criterias.length; i++) {
                        const criteria = criterias[i]
                        const scoreCell = row.getCell(colIndex++)
                        const cellValue = scoreCell.text
                        const parsedScore = Number(cellValue)

                        // Validate if it's a number and within range
                        if (isNaN(parsedScore)) {
                            errors.push(`Invalid score for ${fullName} in ${criteria.name}: "${cellValue}" is not a number`)
                            return
                        }

                        if (parsedScore < 0 || parsedScore > 10) {
                            errors.push(`Invalid score for ${fullName} in ${criteria.name}: ${parsedScore} must be between 0 and 10`)
                            return
                        }

                        entranceTestResultsFromFile.push({
                            criteriaId: criteria.id,
                            score: parsedScore,
                        })
                    }

                    const instructorComment = includeComment ? row.getCell(colIndex)?.text || "" : undefined

                    // Update the student in our array
                    if (studentIndex !== -1) {
                        const results = criterias.map((criteria) => {
                            const resultData = entranceTestResultsFromFile.find((r) => r.criteriaId === criteria.id)
                            return {
                                entranceTestStudentId: updatedStudents[studentIndex].id,
                                id: "",
                                criteriaId: criteria.id,
                                score: resultData?.score || 0,
                                criteriaName: criteria.name,
                                weight: criteria.weight,
                                criteria: {
                                    ...criteria,
                                    for: CriteriaFor.EntranceTest,
                                },
                            }
                        })

                        updatedStudents[studentIndex] = {
                            ...updatedStudents[studentIndex],
                            theoraticalScore: includeTheory ? theoraticalScore : updatedStudents[studentIndex].theoraticalScore,
                            instructorComment: includeComment ? instructorComment : updatedStudents[studentIndex].instructorComment,
                            entranceTestResults: results,
                        }
                    }
                })

                if (errors.length > 0) {
                    setValidationErrors(errors)
                    setIsUploading(false)
                    return
                }

                setEntranceTestStudents(updatedStudents)
                setIsImported(true)
                setCurrentStep("preview")
                setIsUploading(false)
            } catch (error) {
                console.error("Error reading file:", error)
                toastWarning(error instanceof Error ? error.message : "Error reading file")
                setFile(undefined)
                setIsUploading(false)
            }
        }

        reader.onerror = () => {
            toastWarning("Error reading file")
            setFile(undefined)
            setIsUploading(false)
        }
    }

    const fetcher = useFetcher<typeof action>()
    const isSubmitting = fetcher.state === "submitting"

    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success("Import success!")
            setCurrentStep("complete")
            setTimeout(() => {
                setIsOpen(false)
                setIsImported(false)
                setFile(undefined)
                setCurrentStep("download")
            }, 2000)
            return
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error)
            return
        }
    }, [fetcher.data, setIsOpen])

    const handleSubmit = () => {
        const formData = new FormData()
        formData.append("entranceTestId", entranceTestStudents[0].entranceTestId)

        // Serialize the nested array into a JSON string
        formData.append(
            "updateRequests",
            JSON.stringify(
                entranceTestStudents.map((student) => ({
                    studentId: student.studentFirebaseId,
                    theoraticalScore: student.theoraticalScore,
                    instructorComment: student.instructorComment || "",
                    scores: student.entranceTestResults.map((result) => ({
                        criteriaId: result.criteriaId,
                        score: result.score,
                    })),
                })),
            ),
        )

        fetcher.submit(formData, {
            action: "/import-entrance-test-result",
            method: "POST",
        })
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confirm import",
        description: "Are you sure you want to import these scores? This action cannot be undone.",
        onConfirm: handleSubmit,
        confirmText: "Import",
    })

    // Filter students based on active tab
    const filteredStudents = entranceTestStudents.filter((student) => {
        if (activeTab === "all") return true

        const avgScore =
            student.entranceTestResults.reduce((sum, result) => sum + result.score, 0) / student.entranceTestResults.length

        if (activeTab === "passing" && avgScore >= 5) return true
        if (activeTab === "failing" && avgScore < 5) return true

        return false
    })

    // Calculate statistics
    const totalStudents = entranceTestStudents.length
    const passingStudents = entranceTestStudents.filter((student) => {
        const avgScore =
            student.entranceTestResults.reduce((sum, result) => sum + result.score, 0) / student.entranceTestResults.length
        return avgScore >= 5
    }).length
    const failingStudents = totalStudents - passingStudents

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!isSubmitting) {
                        setIsOpen(open)
                        if (!open) {
                            // Reset state when dialog is closed
                            setCurrentStep("download")
                            setFile(undefined)
                            setIsImported(false)
                            setValidationErrors([])
                        }
                    }
                }}
            >
                <DialogContent className="max-w-4xl p-0">
                    <DialogHeader className="pl-4 pt-4">
                        <DialogTitle className="flex flex-row gap-1 items-center"><FileSpreadsheet className="text-theme size-5" />Import entrance test results using Excel file</DialogTitle>
                        <DialogDescription>Follow the steps below to complete the import process.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Progress indicator */}
                    <div className="border-b">
                        <div className="p-6">
                            <div className="flex justify-between mb-2">
                                <div className="flex space-x-2 items-center">
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "download"
                                            ? "bg-theme text-primary-foreground"
                                            : currentStep === "upload" || currentStep === "preview" || currentStep === "complete"
                                                ? "bg-green-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep === "download" ? "1" : <Check className="h-4 w-4" />}
                                    </span>
                                    <span className="font-medium">Download Template</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                                <div className="flex space-x-2 items-center">
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "upload"
                                            ? "bg-theme text-primary-foreground"
                                            : currentStep === "preview" || currentStep === "complete"
                                                ? "bg-green-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep === "upload" ? (
                                            "2"
                                        ) : currentStep === "preview" || currentStep === "complete" ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            "2"
                                        )}
                                    </span>
                                    <span className="font-medium">Upload File</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                                <div className="flex space-x-2 items-center">
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "preview"
                                            ? "bg-theme text-primary-foreground"
                                            : currentStep === "complete"
                                                ? "bg-green-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep === "preview" ? "3" : currentStep === "complete" ? <Check className="h-4 w-4" /> : "3"}
                                    </span>
                                    <span className="font-medium">Review & Import</span>
                                </div>
                            </div>
                            <Progress value={currentStep === "download" ? 33 : currentStep === "upload" ? 66 : 100} className="h-2" />
                        </div>
                    </div>

                    <ScrollArea className="px-6 py-4 h-[60vh]">
                        {currentStep === "download" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">Download Template</h2>
                                    <p className="text-muted-foreground">
                                        Download the Excel template file, fill in the scores for each student, and upload it back to import
                                        the results.
                                    </p>
                                </div>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Template Information</CardTitle>
                                        <CardDescription>The template contains the following information:</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Student names (read-only)</li>
                                            {role === Role.Staff && <li>Theory score column (editable)</li>}
                                            <li>
                                                {criterias.length} criteria columns (editable):
                                                <span className="ml-1 text-muted-foreground">{criterias.map((c) => c.name).join(", ")}</span>
                                            </li>
                                            {role === Role.Instructor && <li>Comment column (editable)</li>}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" onClick={handleDownload} disabled={isDownloadingFile}
                                            variant={'theme'}>
                                            {isDownloadingFile ? (
                                                <>Generating Template...</>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Excel Template
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <div className="flex justify-center mt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setCurrentStep("upload")}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        Already have the template? Skip to upload
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>

                                <Alert variant={'warning'}>
                                    <AlertCircleIcon className="h-4 w-4" />
                                    <AlertTitle>Important</AlertTitle>
                                    <AlertDescription>
                                        All scores must be numbers between 0 and 10. Non-numeric values or scores outside this range will be
                                        rejected.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {currentStep === "upload" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">Upload Completed Template</h2>
                                    <p className="text-muted-foreground">
                                        Upload the Excel file with the completed scores. The system will validate the data before importing.
                                    </p>
                                </div>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Upload File</CardTitle>
                                        <CardDescription>Select the Excel file you've filled with student scores</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                                            <FileUpload
                                                onChange={(files) => {
                                                    setFile(files[0])
                                                    setValidationErrors([])
                                                }}
                                            />
                                            {file && (
                                                <div className="mt-4 flex items-center justify-center text-sm">
                                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                                                    <span>{file.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 ml-2"
                                                        onClick={() => setFile(undefined)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" onClick={handleFileUpload} disabled={!file || isUploading}
                                            variant={'theme'}>
                                            {isUploading ? (
                                                <>Validating Data...</>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Upload and Validate
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>

                                {validationErrors.length > 0 && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Validation Errors</AlertTitle>
                                        <AlertDescription>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                {validationErrors.slice(0, 5).map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                                {validationErrors.length > 5 && <li>And {validationErrors.length - 5} more errors...</li>}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        {currentStep === "preview" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">Review Imported Data</h2>
                                    <p className="text-muted-foreground">
                                        Review the imported scores before finalizing the import. You can go back to make changes if needed.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-2">
                                        <Badge variant="outline" className="px-3 py-1">
                                            Total: {totalStudents} learners
                                        </Badge>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                                            Passing: {passingStudents} learners
                                        </Badge>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
                                            Failing: {failingStudents} learners
                                        </Badge>
                                    </div>

                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="all">All</TabsTrigger>
                                            <TabsTrigger value="passing">Passing</TabsTrigger>
                                            <TabsTrigger value="failing">Failing</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[200px]">Learner</TableHead>
                                                {role === Role.Staff && <TableHead>Theory</TableHead>}
                                                {criterias.map((criteria) => (
                                                    <TableHead key={criteria.id}>
                                                        {criteria.name}
                                                        <span className="text-xs text-muted-foreground ml-1">({criteria.weight}%)</span>
                                                    </TableHead>
                                                ))}
                                                <TableHead>Average</TableHead>
                                                {role === Role.Instructor && <TableHead>Comment</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStudents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={
                                                            criterias.length + (role === Role.Staff ? 3 : 2) + (role === Role.Instructor ? 1 : 0)
                                                        }
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No learners found in this category
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredStudents.map((student) => {
                                                    const avgScore =
                                                        student.entranceTestResults.reduce((sum, result) => sum + result.score, 0) /
                                                        student.entranceTestResults.length
                                                    const isPassing = avgScore >= 5

                                                    return (
                                                        <TableRow key={student.id}>
                                                            <TableCell className="font-medium">{student.fullName}</TableCell>
                                                            {role === Role.Staff && <TableCell>{student.theoraticalScore}</TableCell>}
                                                            {student.entranceTestResults.map((result) => (
                                                                <TableCell key={result.criteriaId}>
                                                                    <span
                                                                        className={`${result.score < 5 ? "text-red-600" : result.score >= 8 ? "text-green-600" : ""
                                                                            }`}
                                                                    >
                                                                        {result.score}
                                                                    </span>
                                                                </TableCell>
                                                            ))}
                                                            <TableCell>
                                                                <Badge variant={isPassing ? "default" : "destructive"} className="font-medium">
                                                                    {avgScore.toFixed(2)}
                                                                </Badge>
                                                            </TableCell>
                                                            {role === Role.Instructor && (
                                                                <TableCell className="max-w-[200px] truncate" title={student.instructorComment || ""}>
                                                                    {student.instructorComment || "(None)"}
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {currentStep === "complete" && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="rounded-full bg-green-100 p-3 mb-4">
                                    <Check className="h-8 w-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Import Successful!</h2>
                                <p className="text-muted-foreground text-center max-w-md">
                                    All scores have been successfully imported. The dialog will close automatically.
                                </p>
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter className="flex justify-between p-6 border-t">
                        {currentStep !== "complete" && (
                            <>
                                {currentStep !== "download" ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(currentStep === "preview" ? "upload" : "download")}
                                        disabled={isSubmitting}
                                    >
                                        Back
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        Cancel
                                    </Button>
                                )}

                                {currentStep === "download" && (
                                    <Button onClick={handleDownload} disabled={isDownloadingFile} variant={'theme'}
                                        Icon={Download} iconPlacement="left">
                                        {isDownloadingFile ? "Downloading..." : "Download Template"}
                                    </Button>
                                )}

                                {currentStep === "upload" && (
                                    <Button onClick={handleFileUpload} disabled={!file || isUploading} variant={'theme'}>
                                        {isUploading ? "Validating..." : "Upload and Continue"}
                                    </Button>
                                )}

                                {currentStep === "preview" && (
                                    <Button onClick={handleOpenConfirmDialog} disabled={isSubmitting} variant={'theme'}>
                                        {isSubmitting ? "Importing..." : "Import Scores"}
                                    </Button>
                                )}
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    )
}
