import { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';
import { EntranceTestStudentWithResults } from '~/lib/types/entrance-test/entrance-test-student';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { ArrowUpDown, Loader2, MoreHorizontal, Pencil, PencilLine, Trash2, User, X } from 'lucide-react';
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
import { Form, useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
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
import { action as deleteStudentsFromTestAction } from '~/routes/remove-students-from-test';
import { LevelBadge } from '../staffs/table/student-columns';
import { toast } from 'sonner';
import { formatScore } from '~/lib/utils/score';
import { fetchSystemConfigs } from '~/lib/services/system-config';
import { PRACTICE_PERCENTAGE, THEORY_PERCENTAGE } from '~/lib/utils/config-name';
import { SystemConfig } from '~/lib/types/config/system-config';
import { Control, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { fetchLevels } from '~/lib/services/level';
import { Badge } from '../ui/badge';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';

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
        accessorKey: 'Email',
        header: 'Email',
        cell: ({ row }) => {
            return <div>{row.original.student.email}</div>
        }
    },
    {
        accessorKey: 'Tên học viên',
        header: 'Tên học viên',
        cell: ({ row }) => {
            return <div>{row.original.student.fullName || row.original.student.userName}</div>
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
        accessorKey: 'Level',
        header: 'Level',
        cell: ({ row }) => {
            return row.original.level ? <LevelBadge level={row.original.level} /> : <div className="">
                Chưa có
            </div>
        }
    },
    {
        accessorKey: 'Hành động',
        header: 'Hành động',
        cell: ({ row, table }) => {
            return <ActionDropdown row={row} table={table} />
        }
    }
]

export default function ResultTable({ data }: Props) {
    return (
        <DataTable columns={resultTableColumns} data={data} />
    );
};

function ActionDropdown({ row, table }: {
    row: Row<EntranceTestStudentWithResults>,
    table: TanstackTable<EntranceTestStudentWithResults>
}) {
    const [isOpen, setIsOpen] = useState(false);

    const fetcher = useFetcher<typeof deleteStudentsFromTestAction>();

    const isSubmitting = fetcher.state === 'submitting';

    const navigate = useNavigate();

    const { open: handleDeleteConfirmDialog, dialog: confirmDeleteDialog } = useConfirmationDialog({
        title: `Xác nhận xóa học viên ${row.original.student.fullName || row.original.student.email} khỏi ca thi?`,
        description: 'Bạn có chắc chắn muốn xóa học viên này khỏi ca thi không?',
        confirmText: 'Xóa',
        confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('testId', row.original.entranceTestId);

            const selectedRows = table.getSelectedRowModel().rows;

            const studentIds = selectedRows.length > 0 ? selectedRows.map((row) => row.original.studentFirebaseId) : [row.original.studentFirebaseId];

            studentIds.forEach((studentId) => {
                formData.append('studentIds', studentId);
            })

            fetcher.submit(formData, {
                method: 'POST',
                action: '/remove-students-from-test',
            });
        }
    })

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Xóa học viên khỏi ca thi thành công!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data?.error) {
            toast.warning(fetcher.data?.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

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
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/staff/students/${row.original.studentFirebaseId}`)}>
                    <User /> Xem thông tin
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <Pencil /> Chỉnh sửa điểm số
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleDeleteConfirmDialog}
                    disabled={isSubmitting}>
                    <Trash2 /> Xóa khỏi ca thi
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <ResultDetailsDialog entranceTestStudent={row.original} isOpen={isOpen} setIsOpen={setIsOpen} />
        {confirmDeleteDialog}
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

    const { data: percentageData, isLoading: isFetchingScorePercentages } = useQuery({
        queryKey: ['entrance-test-score-percentage', idToken],
        queryFn: async () => {
            const response = await fetchSystemConfigs({
                idToken,
                names: [THEORY_PERCENTAGE, PRACTICE_PERCENTAGE]
            });

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    });

    const percentageConfigs = percentageData ? percentageData as SystemConfig[] : [];

    const theoryPercentage = parseInt(percentageConfigs.find(config => config.configName === THEORY_PERCENTAGE)?.configValue || '50') || 50;

    const practicePercentage = parseInt(percentageConfigs.find(config => config.configName === PRACTICE_PERCENTAGE)?.configValue || '50') || 50;

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
            instructorComment: entranceTestStudent.instructorComment || undefined,
            levelId: entranceTestStudent.levelId || undefined,
            theoraticalScore: entranceTestStudent.theoraticalScore,
            scores: results.length > 0 ? results.map(result => ({
                id: result.id,
                criteriaId: result.criteriaId,
                criteriaName: result.criteria.name,
                criteriaDescription: result.criteria.description || '',
                weight: result.weight,
                score: result.score
            })) : []
        },
        fetcher,
        submitConfig: {
            action: '/update-entrance-test-results',
            method: 'POST',
        },
        stringifyAllValues: false
    });

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận cập nhật kết quả ca thi',
        description: 'Bạn có chắc chắn muốn cập nhật kết quả ca thi này không?',
        onConfirm: () => {
            console.log({ errors });
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
                criteriaDescription: criteria.description || '',
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
            toast.warning(fetcher.data?.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);


    const practicalScore = getValues().scores.reduce((acc, result) => (result.score * result.weight / 100) + acc, 0);

    return <>
        <Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogContent className='min-w-[1000px]'>
                <DialogHeader>
                    <DialogTitle className='flex flex-row justify-between mr-4'>
                        <div className="">Chi tiết kết quả thi đầu vào piano</div>
                        <div className="">
                            <Badge variant={'outline'} className={`uppercase ${entranceTestStudent.isScoreAnnounced ? 'text-green-600' : 'text-gray-500'}`}>
                                {entranceTestStudent.isScoreAnnounced === true ? 'Đã công bố' : 'Chưa công bố'}
                            </Badge>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Thông tin chi tiết về kết quả thi đầu vào piano của học viên <strong>{entranceTestStudent.student.fullName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className='max-h-[500px] overflow-y-auto w-full'>
                    <Form method='POST' action='/update-entrance-test-results' className='flex flex-col gap-3 px-4 w-full' navigate={false}>
                        <div className="">
                            <div className="">
                                <Label htmlFor={role === Role.Instructor ? 'instructorComment' : undefined} className='font-bold'>Nhận xét:</Label>
                                {role === Role.Instructor ? <Textarea {...register('instructorComment')}
                                    id='instructorComment'
                                    placeholder='Nhập nhận xét của giảng viên...'
                                    readOnly={role !== Role.Instructor} /> : <p>{entranceTestStudent.instructorComment}</p>}
                            </div>
                            {errors.instructorComment && <div className="text-red-600">{errors.instructorComment.message}</div>}
                        </div>
                        <Table>
                            <TableCaption>
                                Chi tiết điểm số bài thi piano
                                {entranceTestStudent.updatedAt &&
                                    <div className='font-bold'>
                                        &#40;Cập nhật lần cuối: {formatRFC3339ToDisplayableDate(entranceTestStudent.updatedAt, false)}&#41;
                                    </div>}
                            </TableCaption>
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
                                        <TableCell className='flex flex-col gap-2'>
                                            <p className="">{result.criteriaName}</p>
                                            <p className="text-sm text-muted-foreground">{result.criteriaDescription}</p>
                                        </TableCell>
                                        <TableCell className='font-bold'>
                                            {role === Role.Instructor ? <Input
                                                defaultValue={result.score}
                                                type='number'
                                                step={'any'}
                                                onChange={(e) => {
                                                    const newScore = Number.parseFloat(e.target.value);
                                                    setValue(`scores.${index}.score`, newScore);
                                                }}
                                                readOnly={role !== Role.Instructor} /> :
                                                result.score ? formatScore(result.score) : '(Chưa có)'}

                                        </TableCell>
                                        <TableCell className=''>{result.weight}%</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className='font-bold'>Điểm thực hành:</TableCell>
                                    <TableCell className='font-bold'>{formatScore(practicalScore)}</TableCell>
                                    <TableCell>
                                        {isFetchingScorePercentages ? <Loader2 className='animate-spin' /> : `${practicePercentage}%`}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='font-bold'>Điểm lý thuyết:</TableCell>
                                    <TableCell className='font-bold'>
                                        {role === Role.Staff ? <>
                                            <Input {...register('theoraticalScore')}
                                                type='number'
                                                id='theoraticalScore'
                                                placeholder='Nhập điểm lý thuyết...'
                                                readOnly={role !== Role.Staff}
                                                step={'any'}
                                                className='' />
                                            {errors.theoraticalScore && <div className="text-red-600 text-sm">{errors.theoraticalScore.message}</div>}
                                        </> : <div>
                                            {entranceTestStudent.theoraticalScore ? formatScore(entranceTestStudent.theoraticalScore) : 'Chưa có'}
                                        </div>}
                                    </TableCell>
                                    <TableCell>{isFetchingScorePercentages ? <Loader2 className='animate-spin' /> : `${theoryPercentage}%`}</TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell className='font-bold text-red-600'>Điểm trung bình tổng:</TableCell>
                                    <TableCell colSpan={1} className='font-bold text-red-600'>{entranceTestStudent.bandScore ? formatScore(entranceTestStudent.bandScore) : 'Chưa có'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='font-bold'>Level được xếp:</TableCell>
                                    <TableCell colSpan={2}>
                                        <LevelSection initialLevel={entranceTestStudent.level} control={control}
                                            levelAdjustedAt={entranceTestStudent.levelAdjustedAt} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        {errors.scores && <div className="text-red-600">{errors.scores.message}</div>}
                        <DialogFooter>
                            <Button type="button" isLoading={isSubmitting}
                                disabled={isSubmitting} onClick={handleOpenModal}>
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

function LevelSection({
    initialLevel,
    levelAdjustedAt,
    control
}: {
    initialLevel?: Level;
    levelAdjustedAt?: string;
    control: Control<UpdateEntranceTestResultsFormData>;
}) {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['levels'],
        queryFn: async () => {
            const response = await fetchLevels();

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false,
    });

    const levels = data ? data as Level[] : [];

    const [isEdit, setIsEdit] = useState(false);

    return <div className="flex flex-row gap-4">

        <div className="w-full flex flex-col gap-3 items-center">
            {isEdit ? <Controller
                control={control}
                name='levelId'
                render={({ field: { value, onChange } }) => (
                    <Select value={value} onValueChange={onChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Chọn level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Level</SelectLabel>
                                {isLoading ? <Loader2 className='animate-spin' /> : isError ? <div className="text-red-600">Có lỗi xảy ra khi tải level</div> : levels.map((level, index) => (
                                    <SelectItem key={index} value={level.id}>
                                        <LevelBadge level={level} />
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                )}
            />
                : <LevelBadge level={initialLevel} />}

            {levelAdjustedAt &&
                <p className='font-bold'>
                    &#40;Đã cập nhật level vào {formatRFC3339ToDisplayableDate(levelAdjustedAt, false)}&#41;
                </p>
            }
        </div>

        {initialLevel && <Button type='button' size={'icon'} variant={'outline'} className=''
            onClick={() => setIsEdit(!isEdit)}>
            {!isEdit ? <PencilLine /> : <X className='text-red-600' />}
        </Button>}

    </div>
}