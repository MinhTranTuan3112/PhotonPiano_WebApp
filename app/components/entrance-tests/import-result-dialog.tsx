import { MinimalCriteria } from '~/lib/types/criteria/criteria';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EntranceTestStudentWithResults } from '~/lib/types/entrance-test/entrance-test-student';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { FileUpload } from '../ui/file-upload';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { useFetcher } from '@remix-run/react';
import { action } from '~/routes/import-entrance-test-result';
import { toast } from 'sonner';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Role } from '~/lib/types/account/account';


export type ImportResultDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    criterias: MinimalCriteria[];
    entranceTestStudents: EntranceTestStudentWithResults[];
    role: Role;
}

export default function ImportResultDialog({
    isOpen,
    setIsOpen,
    entranceTestStudents: initialEntranceTestStudents,
    criterias,
    role
}: ImportResultDialogProps) {

    const [isDownloadingFile, setIsDownloadingFile] = useState(false);
    const [entranceTestStudents, setEntranceTestStudents] = useState(initialEntranceTestStudents);
    const [file, setFile] = useState<File | undefined>();

    const [isImported, setIsImported] = useState(false);

    const [importedResults, setImportedResults] = useState<Pick<EntranceTestStudentWithResults, 'id' | 'fullName' | 'entranceTestResults'>[]>([]);

    const handleDownload = async () => {
        setIsDownloadingFile(true);

        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Kết quả thi');

            const includeTheory = role === Role.Staff;
            const includeComment = role === Role.Instructor;

            // Set column widths
            const baseColumns = [
                { header: 'Người học', key: 'fullName', width: 30 },
                ...(includeTheory ? [{ header: 'Lý thuyết', key: 'theory', width: 20 }] : []),
                ...criterias.map((c, i) => ({
                    header: c.name,
                    key: `criteria_${i}`,
                    width: 20
                })),
                ...(includeComment ? [{ header: 'Nhận xét', key: 'comment', width: 40 }] : []),
            ];
            sheet.columns = baseColumns;

            // Add header styles
            const header = sheet.getRow(1);
            header.eachCell(cell => {
                cell.protection = { locked: true };
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                };
            });

            entranceTestStudents.forEach(student => {
                const row: (string | number)[] = [student.fullName || ''];

                if (includeTheory) {
                    row.push(student.theoraticalScore || 0);
                }

                criterias.forEach(c => {
                    const score = student.entranceTestResults.find(r => r.criteriaId === c.id)?.score || 0;
                    row.push(score);
                });

                if (includeComment) row.push(student.instructorComment || '');

                const addedRow = sheet.addRow(row);

                // Unlock editable cells
                const startCol = includeTheory ? 2 : 2;
                const endCol = addedRow.cellCount;
                for (let i = startCol; i <= endCol; i++) {
                    addedRow.getCell(i).protection = { locked: false };
                }
            });

            await sheet.protect('mypassword', {
                selectLockedCells: false,
                selectUnlockedCells: true,
                formatCells: false,
                insertRows: false,
                deleteRows: false,
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            FileSaver.saveAs(blob, 'template.xlsx');
        } catch (error) {
            console.error('Error generating Excel file:', error);
        } finally {
            setIsDownloadingFile(false);
        }
    };


    const handleFileUpload = async () => {
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async (e) => {
                if (!e.target?.result) return;

                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(e.target.result as ArrayBuffer);
                const sheet = workbook.worksheets[0];

                const includeTheory = role === Role.Staff;
                const includeComment = role === Role.Instructor;

                sheet.eachRow((row, rowIndex) => {
                    if (rowIndex === 1) return; // skip header

                    let colIndex = 1;

                    const fullName = row.getCell(colIndex++).text;
                    const theoraticalScore = includeTheory ? parseFloat(row.getCell(colIndex++).text) || 0 : undefined;

                    const entranceTestResultsFromFile = criterias.map(() => {
                        return {
                            score: parseFloat(row.getCell(colIndex++).text) || 0
                        };
                    });

                    const instructorComment = includeComment ? row.getCell(colIndex)?.text || '' : undefined;

                    console.log({ instructorComment });


                    const studentId = entranceTestStudents.find(s => s.fullName === fullName)?.id || '';

                    const results = criterias.map((criteria, index) => ({
                        entranceTestStudentId: studentId,
                        id: '',
                        criteriaId: criteria.id,
                        score: entranceTestResultsFromFile[index].score,
                        criteriaName: criteria.name,
                        weight: criteria.weight,
                    }));

                    setEntranceTestStudents(prev =>
                        prev.map(student => {
                            if (student.fullName === fullName) {
                                return {
                                    ...student,
                                    theoraticalScore: includeTheory ? theoraticalScore : student.theoraticalScore,
                                    instructorComment: includeComment ? instructorComment : student.instructorComment,
                                    entranceTestResults: results
                                };
                            }
                            return student;
                        })
                    );

                    setIsImported(true);
                });
            };
        } catch (error) {
            console.error("Error reading file:", error);
        }
    };



    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Đã nhập điểm thành công!');
            setIsOpen(false);
            setIsImported(false);
            setFile(undefined);
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.warning(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);



    const handleSubmit = () => {

        // const updateRequest = {
        //     entranceTestId: entranceTestStudents[0].entranceTestId,
        //     updateRequests: entranceTestStudents.map(student => ({
        //         studentId: student.id,
        //         theoraticalScore: student.theoraticalScore,
        //         scores: student.entranceTestResults.map(result => ({
        //             criteriaId: result.criteriaId,
        //             score: result.score
        //         }))
        //     }))
        // };
        console.log({ entranceTestStudents });

        const formData = new FormData();

        formData.append("entranceTestId", entranceTestStudents[0].entranceTestId);

        // Serialize the nested array into a JSON string
        formData.append("updateRequests", JSON.stringify(
            entranceTestStudents.map(student => ({
                studentId: student.studentFirebaseId,
                theoraticalScore: student.theoraticalScore,
                instructorComment: student.instructorComment || "", // Ensure it's included even if empty
                scores: student.entranceTestResults.map(result => ({
                    criteriaId: result.criteriaId,
                    score: result.score
                }))
            }))
        ));


        fetcher.submit(formData, {
            action: '/import-entrance-test-result',
            method: 'POST'
        });
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận nhập điểm',
        description: 'Bạn có chắc chắn muốn nhập điểm cho học viên?',
        onConfirm: handleSubmit,
        confirmText: 'Lưu',
    });

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className='min-w-[1000px]'>
                    <ScrollArea className='px-2 h-[80vh] '>
                        <DialogHeader>
                            <DialogTitle>Nhập điểm qua file Excel</DialogTitle>
                            <DialogDescription>
                                Tải về file mẫu và nhập điểm của học viên vào file Excel.
                                Sau đó, chọn file Excel đã nhập và nhấn nút "Lưu thay đổi" để cập nhật điểm.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 my-4">
                            <h1 className='font-bold'>Nhập điểm qua file Excel</h1>
                            <Button type='button' Icon={Download} iconPlacement='left' onClick={handleDownload}
                                isLoading={isDownloadingFile} disabled={isDownloadingFile || isSubmitting}>Tải về template nhập điểm</Button>
                            <p>Nhập file</p>
                            <FileUpload onChange={(files) => {
                                setFile(files[0]);
                            }} />
                        </div>
                        {isImported && (
                            <Table>
                                <TableCaption>Điểm xem trước sau khi nhập từ file.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Học viên</TableHead>
                                        {role === Role.Staff && <TableHead>Lý thuyết</TableHead>}
                                        {criterias.map(criteria => (
                                            <TableHead key={criteria.id}>{criteria.name}
                                                &#40;{criteria.weight}%&#41;
                                            </TableHead>
                                        ))}
                                        <TableHead>Nhận xét</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entranceTestStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.fullName}</TableCell>
                                            {role === Role.Staff && <TableCell>{student.theoraticalScore}</TableCell>}
                                            {student.entranceTestResults.map(result => (
                                                <TableCell key={result.criteriaId}>{result.score}</TableCell>
                                            ))}
                                            <TableCell>{student.instructorComment || 'Không có'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                {/* <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3}>Total</TableCell>
                                        <TableCell className="text-right">$2,500.00</TableCell>
                                    </TableRow>
                                </TableFooter> */}
                            </Table>
                        )}
                        <DialogFooter className='flex flex-row justify-center items-center'>
                            <Button type="button" disabled={!file || isSubmitting} onClick={handleFileUpload}>Nhập điểm</Button>

                            <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                                onClick={handleOpenConfirmDialog}>
                                Lưu
                            </Button>

                        </DialogFooter>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    );
};