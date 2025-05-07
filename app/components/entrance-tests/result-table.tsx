import { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';
import { EntranceTestStudentWithResults } from '~/lib/types/entrance-test/entrance-test-student';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { ArrowUpDown, CircleHelp, Loader2, MoreHorizontal, Pencil, PencilLine, Piano, Trash2, User, X } from 'lucide-react';
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
import { Form, useFetcher, useLoaderData, useNavigate, useRouteLoaderData } from '@remix-run/react';
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
import { toastWarning } from '~/lib/utils/toast-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                variant={'theme'}
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
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
        accessorKey: 'Learner',
        header: 'Learner',
        cell: ({ row }) => {
            return <div>{row.original.student.fullName || row.original.student.userName}</div>
        }
    },
    {
        id: 'bandScore',
        accessorKey: 'Band score',
        header: ({ column }) => {
            return <Button
                variant="ghost"
                type='button'
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}

            >
                Band score
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
        accessorKey: 'Comment',
        header: 'Comment',
        cell: ({ row }) => {
            return <div className='text-justify'>{row.original.instructorComment || '(None)'}</div>
        }
    },
    {
        accessorKey: 'Level',
        header: 'Level',
        cell: ({ row }) => {
            return row.original.level ? <LevelBadge level={row.original.level} /> : <div className="">
                None
            </div>
        }
    },
    {
        accessorKey: 'Actions',
        header: 'Actions',
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
        title: `Confirm removing learner ${row.original.student.fullName || row.original.student.email} out of the test?`,
        description: 'Are you sure you want to remove this learner out of the test? This action cannot be undone.',
        confirmText: 'Remove',
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
            toast.success('Removed successfully!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data?.error) {
            toastWarning(fetcher.data?.error, {
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
                    <span className="sr-only">Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/staff/students/${row.original.studentFirebaseId}`)}>
                    <User /> View info
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <Pencil /> Edit results
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleDeleteConfirmDialog}
                    disabled={isSubmitting}>
                    <Trash2 /> Remove from test
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
        title: 'Confirm action',
        description: 'Update results?',
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
            toast.success('Updated successfully!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data?.error) {
            toastWarning(fetcher.data?.error, {
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
                        <div className="flex flex-row gap-2 items-center"> <Piano className='size-5' /> Piano entrance test details results</div>
                        <div className="">
                            <Badge variant={'outline'} className={`uppercase ${entranceTestStudent.isScoreAnnounced ? 'text-green-600' : 'text-gray-500'}`}>
                                {entranceTestStudent.isScoreAnnounced === true ? 'Published' : 'Not Published'}
                            </Badge>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Piano entrance test details results of learner <strong>{entranceTestStudent.student.fullName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className='max-h-[500px] overflow-y-auto w-full'>
                    <Form method='POST' action='/update-entrance-test-results' className='flex flex-col gap-3 px-4 w-full' navigate={false}>
                        <div className="">
                            <div className="">
                                <Label htmlFor={role === Role.Instructor ? 'instructorComment' : undefined} className='font-bold'>Comment:</Label>
                                {role === Role.Instructor ? <Textarea {...register('instructorComment')}
                                    id='instructorComment'
                                    placeholder='Enter comment...'
                                    readOnly={role !== Role.Instructor} /> : <p>{entranceTestStudent.instructorComment}</p>}
                            </div>
                            {errors.instructorComment && <div className="text-red-600">{errors.instructorComment.message}</div>}
                        </div>
                        <Table>
                            <TableCaption>
                                Score details
                                {entranceTestStudent.updatedAt &&
                                    <div className='font-bold'>
                                        &#40;Last update: {formatRFC3339ToDisplayableDate(entranceTestStudent.updatedAt, false)}&#41;
                                    </div>}
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Criteria</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Weight</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isFetchingCriterias ? <TableRow>
                                    <TableCell colSpan={2}>
                                        <Loader2 className='h-full w-full animate-spin' />
                                    </TableCell>
                                </TableRow> : getValues().scores.map((result, index) => (
                                    <TableRow key={result.id} className='w-full'>
                                        <TableCell className='flex flex-row gap-2 items-center'>
                                            <p className="">{result.criteriaName}</p>
                                            {result.criteriaDescription && <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <CircleHelp className='cursor-pointer size-4 text-gray-400' />
                                                    </TooltipTrigger>
                                                    <TooltipContent side='right'>
                                                        <p className='max-w-prose'>{result.criteriaDescription}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>}

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
                                                result.score ? formatScore(result.score) : '(None)'}

                                        </TableCell>
                                        <TableCell className=''>{result.weight}%</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className='font-bold'>Practical score:</TableCell>
                                    <TableCell className='font-bold'>{formatScore(practicalScore)}</TableCell>
                                    <TableCell>
                                        {isFetchingScorePercentages ? <Loader2 className='animate-spin' /> : `${practicePercentage}%`}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='flex flex-row gap-2 items-center'>
                                        <span className="font-bold">Theoretical score</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <CircleHelp className='cursor-pointer size-4 text-gray-400' />
                                                </TooltipTrigger>
                                                <TooltipContent side='right'>
                                                    <p className='max-w-prose'>
                                                        Multi-staff Reading: Piano sheet music uses the Grand Staff, which includes:
                                                        <br />
                                                        Treble clef &#40;right hand&#41; usually for the melody.
                                                        <br />
                                                        Bass clef &#40;left hand&#41; usually for chords or bass notes.
                                                        <br />
                                                        Pianists must read and process two staves simultaneously, often with multiple voices in each.

                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className='font-bold'>
                                        {role === Role.Staff ? <>
                                            <Input {...register('theoraticalScore')}
                                                type='number'
                                                id='theoraticalScore'
                                                placeholder='Enter theoretical score...'
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
                                    <TableCell className='font-bold text-red-600'>Final band score:</TableCell>
                                    <TableCell colSpan={1} className='font-bold text-red-600'>{entranceTestStudent.bandScore ? formatScore(entranceTestStudent.bandScore) : '(None)'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='font-bold'>Level to be arranged:</TableCell>
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
                                {isSubmitting ? 'Saving...' : 'Save'}
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

    const authData = useRouteLoaderData<{
        role: number;
        currentAccountFirebaseId: string;
        idToken: string;
    } | null>("root");

    const role = authData?.role ? authData.role as number : Role.Staff;

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
            {isEdit && role === Role.Staff ? <Controller
                control={control}
                name='levelId'
                render={({ field: { value, onChange } }) => (
                    <Select value={value} onValueChange={onChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Level</SelectLabel>
                                {isLoading ? <Loader2 className='animate-spin' /> : isError ? <div className="text-red-600">Error loading level</div> : levels.map((level, index) => (
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
                    &#40;Level updated at {formatRFC3339ToDisplayableDate(levelAdjustedAt, false)}&#41;
                </p>
            }
        </div>

        {initialLevel && role === Role.Staff && <Button type='button' size={'icon'} variant={'outline'} className=''
            onClick={() => setIsEdit(!isEdit)}>
            {!isEdit ? <PencilLine /> : <X className='text-red-600' />}
        </Button>}

    </div>
}