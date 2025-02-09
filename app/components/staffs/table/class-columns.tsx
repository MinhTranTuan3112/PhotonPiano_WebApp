import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil, Eye, Mail, Phone, User, BanIcon, Medal, Music2, Calendar, Users2, UsersRound } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CLASS_STATUS, STUDENT_STATUS } from "~/lib/utils/constants";
import { Class } from "~/lib/types/class/class";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-gray-500 font-semibold";
        case 1: return "text-green-500 font-semibold";
        case 2: return "text-blue-400 font-semibold";
        case 3: return "text-red-400 font-semibold";
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
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{CLASS_STATUS[status]}</Badge>
}
export const classColums: ColumnDef<Class>[] = [
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
    {
        accessorKey: "Tên",
        header: "Tên",
        cell: ({ row }) => {
            return <div>{row.original.name}</div>
        }
    },
    {
        accessorKey: 'Level',
        header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
        cell: ({ row }) => {
            return row.original.level >= 0 && <LevelBadge level={row.original.level}/>
        }
    },
    {
        accessorKey: 'Số buổi học',
        header: () => <div className="flex flex-row gap-1 items-center"><Calendar /> Số buổi học</div>,
        cell: ({ row }) => {
            return <div>{row.original.totalSlots} / {row.original.requiredSlots}</div>
        }
    },
    {
        accessorKey: 'Giảng viên',
        header: () => <div className="flex flex-row gap-1 items-center"><User /> Giảng viên</div>,
        cell: ({ row }) => {
            return <div>{row.original.instructor?.userName ?? "(Chưa có GV)"}</div>
        }
    },
    {
        accessorKey: 'Sĩ số',
        header: () => <div className="flex flex-row gap-1 items-center"><Users2 /> Sĩ số</div>,
        cell: ({ row }) => {
            return <div>{row.original.studentNumber} / {row.original.capacity}</div>
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/staff/classes/${row.original.id}`}>
                            <UsersRound /> Xem thông tin lớp
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
