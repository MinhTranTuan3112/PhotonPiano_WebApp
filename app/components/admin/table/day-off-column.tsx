import { ColumnDef, Row } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { EntranceTest } from "~/lib/types/entrance-test/entrance-test";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil, Calendar } from 'lucide-react'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from "~/lib/utils/constants";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { toast } from "sonner";
import { useNavigate } from "@remix-run/react";
import { DayOff } from "~/lib/types/day-off/day-off";

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
    //     accessorKey: "Mã đợt thi",
    //     header: () => <div>Mã đợt thi</div>,
    //     cell: ({ row }) => {
    //         return <div className="font-bold">{row.original.id}</div>
    //     }
    // },
    {
        accessorKey: "Tên kỳ nghỉ",
        header: "Tên kỳ nghỉ",
        cell: ({ row }) => {
            return <div>{row.original.name}</div>
        }
    },
    {
        accessorKey: "Bắt đầu",
        header: () => <div className="flex flex-row gap-1 items-center"><Calendar /> Bắt đầu</div>,
        cell: ({ row }) => {
            return <div>{row.original.startTime.split('T')[0]}</div>
        }
    },
    {
        accessorKey: 'Kết thúc',
        header: () => <div className="flex flex-row gap-1 items-center"><Calendar /> Kết thúc</div>,
        cell: ({ row }) => {
            return <div>{row.original.endTime.split('T')[0]}</div>
        }
    },
    {
        id: "Thao tác",
        cell: ({ row }) => {
            return (
                <ActionsDropdown row={row} />
            )
        }
    }
]

function ActionsDropdown({ row }: { row: Row<DayOff> }) {

    // const { dialog: confirmDialog, open: handleOpenDialog } = useConfirmationDialog({
    //     title: 'Xác nhận xóa đợt thi?',
    //     description: 'Dữ liệu đợt thi sau khi xóa sẽ không thể hồi phục lại.',
    //     onConfirm: () => {
    //         // handle delete
    //         toast.success('Xóa thành công!');
    //     },
    //     confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
    // });

    const navigate = useNavigate();

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
                <DropdownMenuItem className="cursor-pointer"><Pencil /> Sửa</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <Trash2 /> Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {/* {confirmDialog} */}
    </>
}