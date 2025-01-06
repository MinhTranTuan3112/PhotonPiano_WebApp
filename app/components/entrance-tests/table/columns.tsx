import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { EntranceTest } from "~/lib/types/entrance-test/entrance-test";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from "~/lib/utils/constants";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-blue-500 font-semibold";
        case 2: return "text-gray-400 font-semibold";
        case 3: return "text-gray-400 font-semibold";
        default: return "text-black font-semibold";
    }
};

function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{ENTRANCE_TEST_STATUSES[status]}</Badge>
}

export const columns: ColumnDef<EntranceTest>[] = [
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
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: () => <div>Mã đợt thi</div>,
        cell: ({ row }) => {
            return <div className="font-bold">{row.getValue('id')}</div>
        }
    },
    {
        accessorKey: "name",
        header: "Tên đợt thi",
        cell: ({ row }) => {
            return <div>{row.getValue('name')}</div>
        }
    },
    {
        accessorKey: "date",
        header: () => <div className="flex flex-row gap-1 items-center"><CalendarClock /> Ngày thi</div>,
        cell: ({ row }) => {
            return <div>{row.getValue('date')}</div>
        }
    },
    {
        accessorKey: 'shift',
        header: () => <div className="flex flex-row gap-1 items-center"><Clock /> Ca thi</div>,
        cell: ({ row }) => {
            const shift = row.getValue('shift') as number;
            return <div>{SHIFT_TIME[shift - 1]}</div>
        }
    },
    {
        accessorKey: 'roomName',
        header: () => <div className="flex flex-row gap-1 items-center"><MapPin /> Phòng thi</div>,
        cell: ({ row }) => {
            return <div>{row.getValue('roomName')}</div>
        }
    },
    {
        accessorKey: "roomCapacity",
        header: "Sức chứa",
        cell: ({ row }) => {
            return <div>{row.getValue('roomCapacity')}</div>
        }
    },
    {
        accessorKey: "instructorName",
        header: "Người coi thi",
        cell: ({ row }) => {
            return <div>{row.getValue('instructorName')}</div>
        }
    },
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            return <StatusBadge status={row.getValue('status')} />
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {

            return (
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
            )
        }
    }
]