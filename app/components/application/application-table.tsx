import { useEffect } from 'react'
import { ColumnDef, Row } from "@tanstack/react-table";
import { Application, ApplicationStatus } from "~/lib/types/application/application";
import { Badge } from "../ui/badge";
import { APPLICATION_STATUS, APPLICATION_TYPE } from "~/lib/utils/constants";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { CircleX, Clock, Download, Eye, FileCheck2, MoreHorizontal, Paperclip } from 'lucide-react'
import { Form, Link, useFetcher } from "@remix-run/react";
import { Button, buttonVariants } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";
import { action } from "~/routes/staff.applications";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { z } from 'zod';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller } from 'react-hook-form';
import RichTextEditor from '../text-editor';

const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
        case ApplicationStatus.Pending: return "text-gray-500 font-semibold";
        case ApplicationStatus.Approved: return "text-green-500 font-semibold";
        case ApplicationStatus.Rejected: return "text-red-500 font-semibold";
        case ApplicationStatus.Cancelled: return "text-red-400 font-semibold";
        default: return "text-black font-semibold";
    }
};

export const columns: ColumnDef<Application>[] = [
    {
        accessorKey: 'Mã đơn',
        header: 'Mã đơn',
        cell: ({ row }) => {
            return <div className="font-bold">{row.original.id}</div>
        }
    },
    {
        accessorKey: 'Loại đơn',
        header: 'Loại đơn',
        cell: ({ row }) => {
            return <div className="font-bold">
                {APPLICATION_TYPE[row.original.type]}
            </div>
        }
    },
    {
        accessorKey: 'Lý do',
        header: 'Lý do',
        cell: ({ row }) => {
            return <div>{row.original.reason}</div>
        }
    },
    {
        accessorKey: 'Ngày tạo',
        header: (header) => {
            return <div className="flex flex-row items-center">
                <Clock />
                Ngày tạo
            </div>
        },
        cell: ({ row }) => {
            return <div>{formatRFC3339ToDisplayableDate(row.original.createdAt)} bởi {row.original.createdByEmail}</div>
        }
    },
    {
        accessorKey: 'File đính kèm',
        header: () => {
            return <div className="flex flex-row items-center">
                <Paperclip />
                <div className="ml-2">File đính kèm</div>
            </div>
        },
        cell: ({ row }) => {
            return <div className="text-center">
                {row.original.fileUrl ? (
                    <Link className={` ${buttonVariants({ variant: "link" })}`} to={row.original.fileUrl}
                        target="_blank" rel="noopener noreferrer">
                        <Download />
                    </Link>
                ) : (
                    <div className="">&#40;Không có&#41;</div>
                )}
            </div>
        }
    },
    {
        accessorKey: 'Trạng thái',
        header: 'Trạng thái',
        cell: ({ row }) => {
            return <div>
                <Badge variant={'outline'} className={getStatusStyle(row.original.status)}>{APPLICATION_STATUS[row.original.status]}</Badge>
            </div>
        }
    },
    {
        id: 'Thao tác',
        accessorKey: 'Thao tác',
        header: 'Thao tác',
        cell: ({ row }) => {
            return <ActionDropdown row={row} />
        }
    }
]


function ActionDropdown({ row }: {
    row: Row<Application>
}) {

    const [dialogProps, setDialogProps] = useState<Omit<DialogProps, 'setIsOpen'>>({
        title: '',
        description: '',
        id: row.original.id,
        isOpen: false,
        status: row.original.status,
        note: row.original.staffConfirmNote
    });

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
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setDialogProps({
                        ...dialogProps,
                        isDetails: true,
                        status: ApplicationStatus.Rejected,
                        isOpen: true,
                        title: 'Chi tiết đơn',
                        description: `Chi tiết thông tin đơn ${row.original.id}`,
                    })
                }}>
                    <Eye />
                    Xem
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setDialogProps({
                        ...dialogProps,
                        isDetails: false,
                        status: ApplicationStatus.Approved,
                        isOpen: true,
                        title: 'Xác nhận duyệt đơn',
                        description: 'Duyệt đơn này?',
                    })
                }}>
                    <FileCheck2 />
                    Duyệt
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setDialogProps({
                        ...dialogProps,
                        isDetails: false,
                        status: ApplicationStatus.Rejected,
                        isOpen: true,
                        title: 'Xác nhận từ chối đơn',
                        description: 'Từ chối đơn này?',
                    })
                }}>
                    <CircleX />
                    Từ chối
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <ActionDialog {...dialogProps} setIsOpen={(isOpen) => {
            setDialogProps({ ...dialogProps, isOpen })
        }} />
    </>
}

const updateApplicationSchema = z.object({
    id: z.string(),
    status: z.number(),
    note: z.string().optional()
});

type ApplicationStatusFormData = z.infer<typeof updateApplicationSchema>;

type DialogProps = {
    isDetails?: boolean;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    title: string;
    description: string;
} & ApplicationStatusFormData;

function ActionDialog({
    isDetails = false,
    isOpen,
    setIsOpen,
    title,
    description,
    id,
    status: defaultStatus,
    note: defaultNote
}: DialogProps) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const {
        handleSubmit,
        formState: { errors },
        register,
        control,
        getValues: getFormValues,
        setValue: setFormValue,
        reset
    } = useRemixForm<ApplicationStatusFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(updateApplicationSchema),
        defaultValues: {
            status: defaultStatus,
            id
        },
        fetcher
    });

    const { status: currentStatus } = getFormValues(); 

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Thao tác thành công');
            setIsOpen(false);
            reset();
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.warning(fetcher.data.error);
            return;
        }


        return () => {

        }

    }, [fetcher.data]);

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {description}
                </DialogDescription>
            </DialogHeader>
            <Form method='POST' onSubmit={handleSubmit} action='/staff/applications' navigate={false}>
                <Controller
                    name='note'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <RichTextEditor value={value || defaultNote || ''} onChange={onChange} placeholder='Nhập ghi chú' />
                    )}
                />
                {errors.note && <div className="text-red-500">{errors.note.message}</div>}
                <DialogFooter className='my-2'>
                    {!isDetails ? <>
                        <Button type='button' variant="ghost" onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}>Hủy</Button>
                        <Button type="submit"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}>{defaultStatus === ApplicationStatus.Approved ? 'Duyệt' : 'Từ chối'}
                        </Button>
                    </> : <>
                        <Button type="button"
                            disabled={isSubmitting}
                            isLoading={isSubmitting && currentStatus === ApplicationStatus.Approved}
                            onClick={() => {
                                setFormValue('status', ApplicationStatus.Approved);
                                handleSubmit();
                            }}>
                            Duyệt
                        </Button>
                        <Button type="button"
                            disabled={isSubmitting}
                            isLoading={isSubmitting && currentStatus === ApplicationStatus.Rejected}
                            variant={'destructive'}
                            onClick={() => {
                                setFormValue('status', ApplicationStatus.Rejected);
                                handleSubmit();
                            }}>
                            Từ chối
                        </Button>
                    </>}
                </DialogFooter>
            </Form>
        </DialogContent>
    </Dialog>
}