import { ColumnDef, Row } from '@tanstack/react-table';
import { EntranceTestStudentWithResults } from '~/lib/types/entrance-test/entrance-test-student';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { ArrowUpDown, Loader2, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { DataTable } from '../ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';
import { UpdateEntranceTestResultsFormData, updateEntranceTestResultsSchema } from '~/lib/types/entrance-test/entrance-test-result';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useState } from 'react';
import { action, loader } from '~/routes/staff.entrance-tests.$id';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui/table';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { useQuery } from '@tanstack/react-query';
import { fetchAllMinimalCriterias, fetchCriterias } from '~/lib/services/criteria';
import { Criteria, MinimalCriterias } from '~/lib/types/criteria/criteria';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';


type Props = {
    data: EntranceTestStudentWithResults[];
}

const resultTableColumns: ColumnDef<EntranceTestStudentWithResults>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                variant={'theme'}
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Chọn tất cả"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                variant={'theme'}
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Chọn dòng"
            />
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'Mã học viên',
        header: 'Mã học viên',
        cell: ({ row }) => {
            return <div>{row.original.studentFirebaseId}</div>
        }
    },
    {
        accessorKey: 'Tên học viên',
        header: 'Tên học viên',
        cell: ({ row }) => {
            return <div>{row.original.fullName}</div>
        }
    },
    {
        id: 'bandScore',
        accessorKey: 'Điểm tổng',
        header: ({ column }) => {
            return <Button
                variant="ghost"
                type='button'
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}

            >
                Điểm tổng
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        },
        enableSorting: true,
        enableHiding: false,
        cell: ({ row }) => {
            return <div className='text-center font-bold'>{row.original.bandScore}</div>
        }
    },
    {
        accessorKey: 'Nhận xét',
        header: 'Nhận xét',
        cell: ({ row }) => {
            return <div className='text-justify'>{row.original.instructorComment || '(Không có)'}</div>
        }
    },
    {
        accessorKey: 'Hành động',
        header: 'Hành động',
        cell: ({ row }) => {
            return <ActionDropdown row={row} />
        }
    }
]

export default function ResultTable({ data }: Props) {
    return (
        <DataTable columns={resultTableColumns} data={data} />
    );
};

function ActionDropdown({ row }: {
    row: Row<EntranceTestStudentWithResults>
}) {
    const [isOpen, setIsOpen] = useState(false);

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Thao tác</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <User /> Xem thông tin
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                    <Pencil /> Chỉnh sửa điểm số
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <Trash2 /> Xóa khỏi ca thi
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <ResultDetailsDialog entranceTestStudent={row.original} isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
}


function ResultDetailsDialog({ entranceTestStudent, isOpen, setIsOpen }: {
    entranceTestStudent: EntranceTestStudentWithResults;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}) {

    const { idToken } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { data, isLoading: isFetchingCriterias } = useQuery({
        queryKey: ['criterias'],
        queryFn: async () => {
            const response = await fetchAllMinimalCriterias({
                idToken
            });

            return await response.data;
        },
        refetchOnWindowFocus: false
    });

    const criterias: MinimalCriterias[] = data || [];

    const results = entranceTestStudent.entranceTestResults;

    const { handleSubmit,
        formState: { errors },
        control,
        register,
        getValues,
        setValue
    } = useRemixForm<UpdateEntranceTestResultsFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(updateEntranceTestResultsSchema),
        defaultValues: {
            target: 'result',
            entranceTestStudentId: entranceTestStudent.id,
            bandScore: entranceTestStudent.bandScore,
            instructorComment: entranceTestStudent.instructorComment,
            scores: results.length > 0 ? results.map(result => ({
                id: result.id,
                criteriaId: result.criteriaId,
                criteriaName: result.criteriaName,
                score: result.score
            })) : criterias.map(criteria => ({
                id: '',
                criteriaId: criteria.id,
                criteriaName: criteria.name,
                score: 0
            }))
        },
        fetcher
    });

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận cập nhật kết quả ca thi',
        description: 'Bạn có chắc chắn muốn cập nhật kết quả ca thi này không?',
        onConfirm: () => {
            handleSubmit();
        }
    });

    return <>
        <Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chi tiết kết quả thi đầu vào</DialogTitle>
                    <DialogDescription>
                        Thông tin chi tiết về kết quả thi đầu vào của học viên {entranceTestStudent.fullName}
                        dựa trên nhiều tiêu chí khác nhau.
                    </DialogDescription>
                </DialogHeader>
                <Form method='POST' className='flex flex-col gap-3' onSubmit={handleOpenModal}>

                    <div className="">
                        <div className="">
                            <Label htmlFor='instructorComment'>Nhận xét của giảng viên</Label>
                            <Textarea {...register('instructorComment')}
                                id='instructorComment'
                                placeholder='Nhập nhận xét của giảng viên...' />
                        </div>
                        {errors.instructorComment && <div className="text-red-600">{errors.instructorComment.message}</div>}
                    </div>

                    <div className="">
                        <div className="">
                            <Label htmlFor='bandScore'>Điểm tổng</Label>
                            <Input {...register('bandScore')}
                                type='number'
                                id='bandScore'
                                placeholder='Nhập điểm tổng...' />
                        </div>
                        {errors.bandScore && <div className="text-red-600">{errors.bandScore.message}</div>}
                    </div>

                    <ScrollArea className='h-[200px]'>
                        <Table>
                            <TableCaption>Chi tiết điểm số.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tiêu chí đánh giá</TableHead>
                                    <TableHead>Điểm số</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isFetchingCriterias ? <TableRow>
                                    <TableCell colSpan={2}>
                                        <Loader2 className='h-full w-full animate-spin' />
                                    </TableCell>
                                </TableRow> : getValues().scores.length > 0 ? getValues().scores.map((result) => (
                                    <TableRow key={result.id} className='w-full'>
                                        <TableCell>{result.criteriaName}</TableCell>
                                        <TableCell className='font-bold'>{result.score}</TableCell>
                                    </TableRow>
                                )) : criterias.map((criteria, index) => (
                                    <TableRow key={index} className='w-full'>
                                        <TableCell>{criteria.name}</TableCell>
                                        <TableCell className='font-bold'>0</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow >
                                    <TableCell colSpan={2} className='font-bold'>Điểm trung bình: {entranceTestStudent.bandScore}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    {errors.scores && <div className="text-red-600">{errors.scores.message}</div>}

                    <DialogFooter>
                        <Button type="submit" isLoading={isSubmitting}
                            disabled={isSubmitting}>
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    </DialogFooter>

                </Form>
            </DialogContent>
        </Dialog>
        {confirmDialog}
    </>
}