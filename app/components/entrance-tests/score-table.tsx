import { useState } from 'react'
import { EntranceTestStudentDetails } from '~/lib/types/entrance-test/entrance-test-student';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from '@remix-run/react';

type Props = {
    data: EntranceTestStudentDetails[],
    className?: string
}

export default function ScoreTable({ data, className }: Props) {
    
    const criteria = data[0]?.entranceTestResults?.map(result => ({
        id: result.criteriaId,
        name: result.criteriaName,
    }));

    const [editableStudent, setEditableStudent] = useState<EntranceTestStudentDetails | null>(null)
    const navigate = useNavigate()

    console.log({ data });
    
    return (
        <div className={`overflow-x-auto ${className}`}>
            <Table className=" bg-white border border-gray-200 rounded-lg min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700 rounded-tl-lg">
                            Tên học viên
                        </TableHead>
                        {criteria?.map(criterion => (
                            <TableHead
                                key={criterion.id}
                                className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700 text-center"
                            >
                                {criterion.name}
                            </TableHead>

                        ))}
                        <TableHead className='px-4 py-2 border-b border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700 text-center'>
                            Điểm tổng
                        </TableHead>
                        <TableHead className='px-4 py-2 border-b border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700 text-center'>
                            Hành động
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.map(entranceTestStudent => (
                        <TableRow key={entranceTestStudent.id}>
                            <TableCell className="px-4 py-2 border-b border-gray-200 text-sm text-gray-600">
                                {entranceTestStudent.fullName}
                            </TableCell>
                            {criteria?.map(criterion => {
                                const result = entranceTestStudent.entranceTestResults.find(
                                    r => r.criteriaId === criterion.id
                                );
                                return (
                                    <TableCell
                                        key={criterion.id + entranceTestStudent.studentFirebaseId}
                                        className="px-4 py-2 border-b border-gray-200 text-sm text-gray-600"
                                    >
                                        {
                                            editableStudent === entranceTestStudent ? (
                                                <div className='flex justify-center'>
                                                    <input className='flex text-center h-10 w-16 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm' defaultValue={result?.score} type='number'></input>
                                                </div>
                                            ) : (
                                                <div className='text-center'>
                                                    {result?.score || '-'}
                                                </div>
                                            )
                                        }
                                    </TableCell>
                                );
                            })}
                            <TableCell className='font-bold text-center'>
                                {entranceTestStudent.bandScore || '-'}
                            </TableCell>
                            <TableCell>
                                <div className='flex justify-center gap-2'>
                                    {
                                        editableStudent !== entranceTestStudent ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Actions</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/${entranceTestStudent.studentFirebaseId}`)}>
                                                        <User /> Xem thông tin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => setEditableStudent(entranceTestStudent)}>
                                                        <Pencil /> Chỉnh sửa điểm số
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 cursor-pointer">
                                                        <Trash2 /> Xóa khỏi ca thi
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                        ) : (
                                            <>
                                                <Button>Lưu</Button>
                                                <Button variant={'ghost'} className='text-red-500' onClick={() => setEditableStudent(null)}>Hủy</Button>
                                            </>
                                        )
                                    }
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}