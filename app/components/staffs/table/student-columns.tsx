import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil, Eye, Mail, Phone, User, BanIcon, Medal, Music2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Account } from "~/lib/types/account/account";
import { Badge } from "~/components/ui/badge";
import { STUDENT_STATUS } from "~/lib/utils/constants";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-gray-500 font-semibold";
        case 1: return "text-orange-500 font-semibold";
        case 2: return "text-blue-400 font-semibold";
        case 3: return "text-green-400 font-semibold";
        case 4: return "text-red-400 font-semibold";
        case 5: return "text-gray-500 font-semibold";
        default: return "text-black font-semibold";
    }
};

const getLevelStyle = (level: number) => {
    switch (level) {
        case 0: return "text-blue-500 font-semibold";
        case 1: return "text-pink-500 font-semibold";
        case 2: return "text-red-500 font-semibold";
        case 3: return "text-black font-semibold";
        case 4: return "text-gray-400 font-semibold";
        default: return "text-black font-semibold";
    }
};
function LevelBadge({ level }: {
    level: number
}) {
    return <Badge variant={'outline'} className={`${getLevelStyle(level)} uppercase`}>LEVEL {level + 1}</Badge>
}
function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{STUDENT_STATUS[status]}</Badge>
}
export const studentColumns: ColumnDef<Account>[] = [
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
        accessorKey: "Tên",
        header: "Tên học viên",
        cell: ({ row }) => {
            return <div>{row.original.username}</div>
        }
    },
    {
        accessorKey: 'Email',
        header: () => <div className="flex flex-row gap-1 items-center"><Mail /> Email</div>,
        cell: ({ row }) => {
            return <div>{row.original.email}</div>
        }
    },
    {
        accessorKey: 'SĐT',
        header: () => <div className="flex flex-row gap-1 items-center"><Phone /> SĐT</div>,
        cell: ({ row }) => {
            return <div>{row.original.phone}</div>
        }
    },
    {
        accessorKey: 'Level',
        header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
        cell: ({ row }) => {
            return row.original.level && <LevelBadge level={row.original.level}/>
        }
    },
    {
        accessorKey: 'Trạng thái',
        header: () => <div className="flex flex-row gap-1 items-center">Trạng thái</div>,
        cell: ({ row }) => {
            return <StatusBadge status={row.original.status}/>
        }
    },
    {
        id: "actions",
        header: "Hành động",
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/`}>
                            <User /> Xem thông tin
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                            <BanIcon /> Vô hiệu hóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
]
