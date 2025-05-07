import { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { ROOM_STATUS } from "~/lib/utils/constants";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Room } from "~/lib/types/room/room";
import { useRoomDialog } from "../room/room-dialog";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { useFetcher } from "@remix-run/react";
import { action } from "~/routes/delete-room";
import { useEffect } from "react";
import { toastWarning } from "~/lib/utils/toast-utils";
import { toast } from "sonner";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-gray-400 font-semibold";
        default: return "text-black font-semibold";
    }
};

function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{ROOM_STATUS[status]}</Badge>
}
export const roomColumns: ColumnDef<Room>[] = [
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
    //     accessorKey: "Mã đợt thi",
    //     header: () => <div>Mã đợt thi</div>,
    //     cell: ({ row }) => {
    //         return <div className="font-bold">{row.original.id}</div>
    //     }
    // },
    {
        accessorKey: "Room Name",
        header: "Room Name",
        cell: ({ row }) => {
            return <div>{row.original.name}</div>
        }
    },
    {
        accessorKey: "Capacity",
        header: () => <div className="flex flex-row gap-1 items-center">Capacity</div>,
        cell: ({ row }) => {
            return <div>{row.original.capacity}</div>
        }
    },
    {
        accessorKey: 'Status',
        header: () => <div className="flex flex-row gap-1 items-center">Status</div>,
        cell: ({ row }) => {
            return <div><StatusBadge status={row.original.status} /></div>
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

function ActionsDropdown({ row }: { row: Row<Room> }) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { dialog: confirmDialog, open: handleOpenDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Delete this room',
        onConfirm: () => {
            fetcher.submit({
                id: row.original.id,
            }, {
                method: 'POST',
                action: '/delete-room'
            })
        },
        confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
        confirmText: 'Delete',
    });

    const { open: handleOpenRoomDialog, roomDialog } = useRoomDialog({
        isEdit: true,
        ...row.original,
    });


    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Delete room successfully!');
            return;
        }

        if (fetcher.data?.success === false) {
            if (fetcher.data.error) {
                toastWarning(fetcher.data.error, {
                    duration: 5000
                });
            }
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
                <DropdownMenuItem className="cursor-pointer" onClick={handleOpenRoomDialog}><Pencil /> Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleOpenDialog}
                    disabled={isSubmitting}>
                    <Trash2 /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
        {roomDialog}
    </>
}