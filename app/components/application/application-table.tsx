import { useEffect } from 'react'
import { ColumnDef, Row } from "@tanstack/react-table";
import { Application, ApplicationStatus } from "~/lib/types/application/application";
import { Badge } from "../ui/badge";
import { APPLICATION_STATUS, APPLICATION_TYPE } from "~/lib/utils/constants";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { CircleX, Clock, FileCheck2, MoreHorizontal, Paperclip } from 'lucide-react'
import { Link, useFetcher } from "@remix-run/react";
import { Button, buttonVariants } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { useState } from "react";
import { action } from "~/routes/staff.applications";
import { toast } from 'sonner';

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
            return <div>{formatRFC3339ToDisplayableDate(row.original.createdAt)}</div>
        }
    },
    {
        accessorKey: 'Tạo bởi',
        header: 'Tạo bởi',
        cell: ({ row }) => {
            return <div>{row.original.createdByEmail}</div>
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
            return <div className="">
                {row.original.fileUrl ? (
                    <Link className={buttonVariants({ variant: "linkHover1" })} to={row.original.fileUrl}>
                        Xem
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
        id: 'actions',
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

    const fetcher = useFetcher<typeof action>();

    const [status, setStatus] = useState<ApplicationStatus>(ApplicationStatus.Approved);

    const { open: handleOpen, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận thao tác',
        description: `${status === ApplicationStatus.Approved ? 'Duyệt' : 'Từ chối'} đơn này?`,
        confirmText: status === ApplicationStatus.Approved ? 'Duyệt' : 'Từ chối',
        onConfirm: () => {
            fetcher.submit({ id: row.original.id, status }, {
                action: '/staff/applications',
                method: 'POST',
            });
        },
    });

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Thao tác thành công');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.error(fetcher.data.error);
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
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setStatus(ApplicationStatus.Approved);
                    handleOpen();
                }} disabled={isSubmitting}>
                    <FileCheck2 />
                    {isSubmitting && status === ApplicationStatus.Approved ? 'Đang duyệt...' : 'Duyệt'}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setStatus(ApplicationStatus.Rejected);
                    handleOpen();
                }} disabled={isSubmitting}>
                    <CircleX />
                    {isSubmitting && status === ApplicationStatus.Rejected ? 'Đang từ chối...' : 'Từ chối'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
    </>

}