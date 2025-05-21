import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Form, useFetcher } from '@remix-run/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRemixForm } from 'remix-hook-form'
import { EntranceTestArrangementFormData, entranceTestArrangementSchema } from '~/lib/utils/schemas'
import { Controller } from 'react-hook-form'
import { CalendarSync } from 'lucide-react'
import DateRangePicker from '../ui/date-range-picker'
import { Button } from '../ui/button'
import { MultiSelect } from '../ui/multi-select'
import { SHIFT_TIME } from '~/lib/utils/constants'
import { action } from '~/routes/arrange-entrance-test'
import { Account } from '~/lib/types/account/account'
import { DataTable } from '../ui/data-table'
import { studentColumns } from '../staffs/table/student-columns'
import { Separator } from '../ui/separator'
import { CreateEntranceTestForm } from '~/routes/staff.entrance-tests.create'
import { ScrollArea } from '../ui/scroll-area'
import { toastWarning } from '~/lib/utils/toast-utils'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'

export type ArrangeDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    students: Account[];
    idToken: string;
}

export const resolver = zodResolver(entranceTestArrangementSchema);

export default function ArrangeDialog({ isOpen, setIsOpen, students, idToken }: ArrangeDialogProps) {

    const studentIds = students.map(s => s.accountFirebaseId);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className='min-w-[1000px]'>
                <DialogHeader>
                    <DialogTitle>Arrange entrance tests</DialogTitle>
                    <DialogDescription>
                        Arrange entrance tests for learners who have registered for entrance tests
                        and are waiting to be arranged based on 2 modes: manual and automatic.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="auto">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="auto">Auto</TabsTrigger>
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auto">
                        <AutoArrangementForm studentIds={studentIds} />
                    </TabsContent>
                    <TabsContent value="manual">
                        <ScrollArea className='h-56 px-4'>
                            <CreateEntranceTestForm studentIds={studentIds}
                                hasWidthConstraint={false}
                                idToken={idToken} />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <div className="my-3">
                    <h1 className="text-base font-bold">Learners to be arranged</h1>
                    <Separator className='w-full my-2' />
                    <DataTable
                        columns={studentColumns.filter(col => col.id !== 'Actions' && col.id !== 'select')}
                        data={students}
                    />
                </div>

            </DialogContent>
        </Dialog>
    )
}

function AutoArrangementForm({
    studentIds: initialStudentIds
}: {
    studentIds: string[];
}) {

    const fetcher = useFetcher<typeof action>();

    const {
        handleSubmit,
        formState: { errors },
        register,
        control,
        getValues
    } = useRemixForm<EntranceTestArrangementFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            studentIds: initialStudentIds
        },
        fetcher,
        submitConfig: {
            action: '/arrange-entrance-test',
            method: "POST"
        }
    });

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Confirm arrange entrance tests?',
        confirmText: 'Arrange',
        onConfirm: () => {
            console.log({ errors });
            handleSubmit();
        }
    })

    return <>
        <Form className='flex flex-col gap-5 my-2' action='/arrange-entrance-test' method='POST'>
            <input type="hidden" {...register('studentIds')} />
            {errors.studentIds && <p className='text-red-500 text-sm'>{errors.studentIds.message}</p>}
            <Controller
                name='date'
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <DateRangePicker
                        value={value}
                        onChange={onChange}
                        className='w-full'
                        placeholder='Select test date'
                    />
                )}
            />
            {errors.date && <p className='text-red-500 text-sm'>{errors.date.message}</p>}
            <Controller
                name='shiftOptions'
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <MultiSelect
                        options={SHIFT_TIME.map((shift, index) => {
                            return { label: `Shift ${index + 1}: ${shift}`, value: index.toString() }
                        })}
                        value={value}
                        onValueChange={onChange}
                        placeholder='Select shifts (optional)'
                    />
                )}
            />
            {errors.shiftOptions && <p className='text-red-500 text-sm'>{errors.shiftOptions.message}</p>}
            <Button type='button' Icon={CalendarSync}
                iconPlacement='left'
                variant={'theme'}
                isLoading={isSubmitting}
                disabled={isSubmitting} onClick={handleOpenConfirmDialog}>
                {isSubmitting ? 'Arranging...' : 'Arrange'}
            </Button>
        </Form>
        {confirmDialog}
    </>
}