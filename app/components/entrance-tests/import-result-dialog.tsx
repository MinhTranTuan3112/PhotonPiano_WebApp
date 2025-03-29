import { MinimalCriteria } from '~/lib/types/criteria/criteria';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { EntranceTestStudentWithResults } from '~/lib/types/entrance-test/entrance-test-student';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { FileUpload } from '../ui/file-upload';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

export type ImportResultDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    criterias: MinimalCriteria[];
    entranceTestStudents: EntranceTestStudentWithResults[];
}

export default function ImportResultDialog({
    isOpen,
    setIsOpen,
    entranceTestStudents: initialEntranceTestStudents,
    criterias
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

            // 🔹 Set all cells to be UNLOCKED by default
            sheet.columns = [{ width: 30 }, { width: 30 }, ...criterias.map(() => ({ width: 30 }))];

            // Add headers
            const headerRow = ['Người học', 'Lý thuyết'];
            criterias.forEach(criteria => headerRow.push(criteria.name));
            sheet.addRow(headerRow);

            // 🔹 Lock only the header row (Row 1)
            const header = sheet.getRow(1);
            header.eachCell(cell => {
                cell.protection = { locked: true }; // Lock headers only
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' } // Light gray background
                };
            });

            entranceTestStudents.forEach((student) => {
                const row = [student.fullName, student.theoraticalScore?.toString() || '0'];

                criterias.forEach(criteria => {
                    const result = student.entranceTestResults.find(r => r.criteriaId === criteria.id);
                    row.push(result?.score?.toString() || '0');
                });

                const addedRow = sheet.addRow(row);

                // 🔹 Unlock the theory score column (Column B) and criteria columns (Column C onwards)
                for (let colIndex = 2; colIndex < row.length + 1; colIndex++) {
                    const scoreCell = addedRow.getCell(colIndex);
                    scoreCell.protection = { locked: false }; // Ensure editable scores
                }
            });

            // 🔹 Protect the sheet while allowing unlocked cells to be edited
            await sheet.protect('mypassword', {
                selectLockedCells: false,
                selectUnlockedCells: true,
                formatCells: false,
                insertRows: false,
                deleteRows: false,
            });



            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();

            // Create Blob and trigger download
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
        if (!file) {
            return;
        }

        try {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async (e) => {
                if (!e.target?.result) {
                    return;
                }

                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(e.target.result as ArrayBuffer);
                const sheet = workbook.worksheets[0]; // Get the first sheet

                sheet.eachRow((row, rowIndex) => {
                    if (rowIndex === 1) {
                        return;
                    } // Skip headers

                    const fullName = row.getCell(1).text; // Column A
                    const theoraticalScore = parseFloat(row.getCell(2).text) || 0; // Column B
                    const entranceTestResultsFromFile = criterias.map((criteria, colIndex) => ({
                        criteriaId: criteria.id,
                        score: parseFloat(row.getCell(colIndex + 3).value?.toString() || '0') || 0, // Fix reading issue
                    }));


                    console.log({ fullName, theoraticalScore, entranceTestResultsFromFile });

                    const results = entranceTestResultsFromFile.map(result => {
                        return {
                            entranceTestStudentId: entranceTestStudents.find(s => s.fullName === fullName)?.id || '',
                            id: '',
                            criteriaId: result.criteriaId,
                            score: result.score,
                            criteriaName: criterias.find(c => c.id === result.criteriaId)?.name || '',
                            weight: criterias.find(c => c.id === result.criteriaId)?.weight || 0,
                        };
                    })

                    setEntranceTestStudents(prev =>
                        prev.map(student => {
                            if (student.fullName === fullName) {
                                return {
                                    ...student,
                                    theoraticalScore,
                                    entranceTestResults: student.entranceTestResults.length > 0 ? student.entranceTestResults.map(result => {
                                        const newResult = entranceTestResultsFromFile.find(r => r.criteriaId === result.criteriaId);
                                        return newResult ? { ...result, score: newResult.score } : result;
                                    }) : results
                                };
                            }
                            return student;
                        })
                    );

                });

            };

            setIsImported(true);
        } catch (error) {
            console.error("Error reading file:", error);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <ScrollArea className='px-2 h-[80vh]'>
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
                            isLoading={isDownloadingFile} disabled={isDownloadingFile}>Tải về template nhập điểm</Button>
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
                                    <TableHead>Lý thuyết</TableHead>
                                    {criterias.map(criteria => (
                                        <TableHead key={criteria.id}>{criteria.name}
                                            &#40;{criteria.weight} %&#41;
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entranceTestStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.fullName}</TableCell>
                                        <TableCell>{student.theoraticalScore}</TableCell>
                                        {student.entranceTestResults.map(result => (
                                            <TableCell key={result.criteriaId}>{result.score}</TableCell>
                                        ))}
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
                        <Button type="button" disabled={!file} onClick={handleFileUpload}>Nhập điểm</Button>
                        {isImported && (
                            <Button type='button'>
                                Lưu
                            </Button>
                        )}
                    </DialogFooter>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};