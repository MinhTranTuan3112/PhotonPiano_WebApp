import { ColumnDef, Row } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { EntranceTest } from "~/lib/types/entrance-test/entrance-test";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil, Calendar, Loader2 } from 'lucide-react'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from "~/lib/utils/constants";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { toast } from "sonner";
import { FetcherWithComponents, Form, useFetcher, useNavigate } from "@remix-run/react";
import { DayOff, DayOffFormData, dayOffSchema } from "~/lib/types/day-off/day-off";
import { useRemixForm } from "remix-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import DateRangePicker from "~/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useEffect, useState } from "react";
import { action } from "~/routes/admin.day-offs";

export const dayOffColumns: ColumnDef<DayOff>[] = [
    // {
    //     id: "select",
    //     header: ({ table }) => (
    //         <Checkbox
    //             variant={'theme'}
    //             checked={
    //                 table.getIsAllPageRowsSelected() ||
    //                 (table.getIsSomePageRowsSelected() && "indeterminate")
    //             }
    //             onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //             aria-label="Chọn tất cả"
    //         />
    //     ),
    //     cell: ({ row }) => (
    //         <Checkbox
    //             variant={'theme'}
    //             checked={row.getIsSelected()}
    //             onCheckedChange={(value) => row.toggleSelected(!!value)}
    //             aria-label="Chọn dòng"
    //         />
    //     ),
    //     enableSorting: false,
    //     enableHiding: false,
    // },
    // {
    //     accessorKey: "Mã kỳ thi",
    //     header: () => <div>Mã kỳ thi</div>,
    //     cell: ({ row }) => {
    //         return <div className="font-bold">{row.original.id}</div>
    //     }
    // },
    {
        accessorKey: "Name",
        header: "Name",
        cell: ({ row }) => {
            return <div>{row.original.name}</div>
        }
    },
    {
        accessorKey: "Start Date",
        header: () => <div className="flex flex-row gap-1 items-center"><Calendar /> Start Date</div>,
        cell: ({ row }) => {
            return <div>{row.original.startTime.split('T')[0]}</div>
        }
    },
    {
        accessorKey: 'End Date',
        header: () => <div className="flex flex-row gap-1 items-center"><Calendar /> End Date</div>,
        cell: ({ row }) => {
            return <div>{row.original.endTime.split('T')[0]}</div>
        }
    },
    {
        id: "Action",
        cell: ({ row }) => {
            return (
                <ActionsDropdown row={row} />
            )
        }
    }
]

function ActionsDropdown({ row }: { row: Row<DayOff> }) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const [dialogProps, setDialogProps] = useState<DayOffDialogProps>({
        isOpen: false,
        setIsOpen: (isOpen) => setDialogProps((prev) => ({ ...prev, isOpen: isOpen })),
        isEdit: true,
        fetcher
    });

    const { dialog: confirmDialog, open: handleOpenDialog } = useConfirmationDialog({
        title: 'Confirm Delete',
        description: 'Are you sure want to delete this day-off?.',
        confirmText: 'Delete',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('dayOffAction', 'delete');
            formData.append('id', row.original.id);

            fetcher.submit(formData, {
                method: 'POST',
                action: `/admin/day-offs?action=delete&id=${row.original.id}` // Adjust the action URL as needed,
            });
        },
        confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success(fetcher.data?.dayOffAction === 'update' ? 'Update Successfully!' : 'Delete Successfully!');
            setDialogProps((prev) => ({ ...prev, isOpen: false }));
            return;
        }


        if (fetcher.data?.success === false) {
            toast.warning(fetcher.data.error, {
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
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setDialogProps({
                        ...dialogProps,
                        isOpen: true,
                        ...row.original
                    });
                }}>
                    <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer" disabled={isSubmitting}
                    onClick={handleOpenDialog}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DayOffDialog {...dialogProps} />
        {confirmDialog}
    </>
}

type DayOffDialogProps = {
    isEdit: boolean,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
} & DayOffFormProps;

export function DayOffDialog({ isEdit, isOpen, setIsOpen, ...props }: DayOffDialogProps) {

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="min-w-[700px]">
            <DialogHeader>
                <DialogTitle>{isEdit ? 'Update Day-Off' : 'Add new Day-Off'}</DialogTitle>
                <DialogDescription>
                    {isEdit ? 'Update the existing day-off' : 'Add a new day-off to the center'}
                </DialogDescription>
            </DialogHeader>
            <DayOffForm isEdit={isEdit} {...props} />
        </DialogContent>
    </Dialog>
}

type DayOffFormProps = {
    fetcher: FetcherWithComponents<any>,
    isEdit: boolean,
} & Partial<DayOff>

export function DayOffForm({
    fetcher, isEdit, ...defaultData
}: DayOffFormProps) {

    const isSubmitting = fetcher.state === 'submitting';

    const {
        handleSubmit,
        formState: { errors },
        setValue: setFormValue,
        getValues: getFormValues,
        control,
        register
    } = useRemixForm<DayOffFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(dayOffSchema),
        defaultValues: {
            ...defaultData,
            dayOffAction: isEdit ? 'update' : 'create',
            startTime: defaultData.startTime ? new Date(defaultData.startTime) : undefined,
            endTime: defaultData.endTime ? new Date(defaultData.endTime) : undefined,
        },
        fetcher
    });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: `Confirm ${isEdit ? 'update' : 'add'} day-off?`,
        description: `Are you sure want to ${isEdit ? 'update' : 'add'} this day-off?`,
        confirmText: isEdit ? 'Update' : 'Add',
        onConfirm: handleSubmit
    });

    return <>
        <Form method="POST" className="flex flex-col gap-5">

            <div className="flex flex-row gap-2">
                <Label htmlFor='name'>Day-Off Name</Label>
                <Input {...register('name')} name='name' id='name' placeholder='Enter a name...' />
            </div>
            {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}

            <div className="flex flex-row gap-2">
                <Label>From - To</Label>
                <DateRangePicker
                    value={{
                        from: getFormValues('startTime'),
                        to: getFormValues('endTime')
                    }}
                    onChange={(value) => {
                        const dateRange = value as DateRange;
                        if (!dateRange.from || !dateRange.to) {
                            return;
                        }
                        setFormValue('startTime', dateRange.from);
                        setFormValue('endTime', dateRange.to);
                    }}
                    className='w-full'
                    placeholder='Please specify a period for the day-off'
                />
            </div>
            {errors.startTime && <p className='text-sm text-red-500'>{errors.startTime.message}</p>}
            {errors.endTime && <p className='text-sm text-red-500'>{errors.endTime.message}</p>}

            <DialogFooter className="">
                <Button type="button" variant={'theme'} isLoading={isSubmitting} disabled={isSubmitting}
                    onClick={handleOpenConfirmDialog}>
                    {isEdit === true ? 'Update' : 'Add'}
                </Button>
            </DialogFooter>
        </Form>
        {confirmDialog}
    </>

}

