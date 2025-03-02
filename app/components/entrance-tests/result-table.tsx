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
import { useEffect, useState } from 'react';
import { loader } from '~/routes/staff.entrance-tests.$id';
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
import { fetchAllMinimalCriterias } from '~/lib/services/criteria';
import { MinimalCriteria } from '~/lib/types/criteria/criteria';
import { Level, Role } from '~/lib/types/account/account';
import { ScrollArea } from '../ui/scroll-area';
import { action } from '~/routes/update-entrance-test-results';
import { LevelBadge } from '../staffs/table/student-columns';
import { toast } from 'sonner';

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
                <DropdownMenuItem className="cursor-pointer">
                    <User /> Xem thông tin
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
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

    const { idToken, role } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { data, isLoading: isFetchingCriterias } = useQuery({
        queryKey: ['criterias', idToken],
        queryFn: async () => {
            const response = await fetchAllMinimalCriterias({
                idToken
            });

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    });

    const results = entranceTestStudent.entranceTestResults;

    const criterias: MinimalCriteria[] = data || [];

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
            id: entranceTestStudent.entranceTestId,
            studentId: entranceTestStudent.studentFirebaseId,
            entranceTestStudentId: entranceTestStudent.id,
            bandScore: entranceTestStudent.bandScore,
            instructorComment: entranceTestStudent.instructorComment || '(Chưa có)',
            theoraticalScore: entranceTestStudent.theoraticalScore,
            scores: results.length > 0 || isFetchingCriterias ? results.map(result => ({
                id: result.id,
                criteriaId: result.criteriaId,
                criteriaName: result.criteriaName,
                weight: result.weight,
                score: result.score
            })) : criterias.map(criteria => ({
                id: criteria.id,
                criteriaId: criteria.id,
                criteriaName: criteria.name,
                score: 0,
                weight: criteria.weight
            }))
        },
        fetcher,
        submitConfig: {
            action: '/update-entrance-test-results'
        },
        stringifyAllValues: false
    });

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận cập nhật kết quả ca thi',
        description: 'Bạn có chắc chắn muốn cập nhật kết quả ca thi này không?',
        onConfirm: () => {
            handleSubmit();
        }
    });

    // Update scores value when criterias are fetched successfully
    useEffect(() => {
        if (criterias.length > 0 && !isFetchingCriterias && results.length === 0) {
            setValue('scores', criterias.map(criteria => ({
                id: criteria.id,
                criteriaId: criteria.id,
                criteriaName: criteria.name,
                score: 0,
                weight: criteria.weight
            })));
        }
    }, [criterias, isFetchingCriterias, setValue]);

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Cập nhật kết quả ca thi thành công!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data?.error) {
            toast.error(fetcher.data?.error, {
                position: 'top-center',
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);


    const practicalScore = getValues().scores.reduce((acc, result) => result.score * result.weight + acc, 0);

    return <>
        <Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chi tiết kết quả thi đầu vào</DialogTitle>
                    <DialogDescription>
                        Thông tin chi tiết về kết quả thi đầu vào của học viên <strong>{entranceTestStudent.fullName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className='max-h-[500px] overflow-y-auto w-full'>
                    <Form method='POST' className='flex flex-col gap-3 px-4 w-full' onSubmit={handleOpenModal} navigate={false}>
                        <div className="">
                            <div className="">
                                <Label htmlFor={role === Role.Instructor ? 'instructorComment' : undefined} className='font-bold'>Nhận xét của giảng viên:</Label>
                                {role === Role.Instructor ? <Textarea {...register('instructorComment')}
                                    id='instructorComment'
                                    placeholder='Nhập nhận xét của giảng viên...'
                                    readOnly={role !== Role.Instructor} /> : <p>{entranceTestStudent.instructorComment}</p>}
                            </div>
                            {errors.instructorComment && <div className="text-red-600">{errors.instructorComment.message}</div>}
                        </div>
                        <div className="">
                            <div className="">
                                <Label htmlFor='theoraticalScore'>Điểm lý thuyết</Label>
                                <Input {...register('theoraticalScore')}
                                    type='number'
                                    id='theoraticalScore'
                                    placeholder='Nhập điểm lý thuyết...'
                                    readOnly={role !== Role.Staff}
                                    step={'any'} />
                            </div>
                            {errors.theoraticalScore && <div className="text-red-600">{errors.theoraticalScore.message}</div>}
                        </div>
                        <Table>
                            <TableCaption>Chi tiết điểm số.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tiêu chí đánh giá</TableHead>
                                    <TableHead>Điểm số</TableHead>
                                    <TableHead>Trọng số</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isFetchingCriterias ? <TableRow>
                                    <TableCell colSpan={2}>
                                        <Loader2 className='h-full w-full animate-spin' />
                                    </TableCell>
                                </TableRow> : getValues().scores.map((result, index) => (
                                    <TableRow key={result.id} className='w-full'>
                                        <TableCell>{result.criteriaName}</TableCell>
                                        <TableCell className='font-bold text-center'>
                                            {role === Role.Instructor ? <Input defaultValue={0} type='number'
                                                onChange={(e) => {
                                                    const newScore = Number.parseInt(e.target.value);
                                                    setValue(`scores.${index}.score`, newScore);
                                                }}
                                                readOnly={role !== Role.Instructor} /> : result.score}
                                        </TableCell>
                                        <TableCell className='text-center'>{result.weight * 100}%</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className='font-bold'>Điểm thực hành:</TableCell>
                                    <TableCell colSpan={2} className='font-bold text-center'>{practicalScore}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='font-bold text-red-600'>Điểm trung bình tổng:</TableCell>
                                    <TableCell colSpan={2} className='font-bold text-center text-red-600'>{entranceTestStudent.bandScore || 'Chưa có'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='font-bold'>Level được xếp:</TableCell>
                                    <TableCell colSpan={2}>
                                        <LevelBadge level={entranceTestStudent.level} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        {errors.scores && <div className="text-red-600">{errors.scores.message}</div>}
                        <DialogFooter>
                            <Button type="submit" isLoading={isSubmitting}
                                disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
        {confirmDialog}
    </>
}