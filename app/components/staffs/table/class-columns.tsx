import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil, Eye, Mail, Phone, User, BanIcon, Medal, Music2, Calendar, Users2, UsersRound, Check, CheckCircle } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CLASS_STATUS, STUDENT_STATUS } from "~/lib/utils/constants";
import { Class } from "~/lib/types/class/class";
import { Level } from "~/lib/types/account/account";

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
        case 0: return "text-[#92D808] font-semibold";
        case 1: return "text-[#FBDE00] font-semibold";
        case 2: return "text-[#FBA000] font-semibold";
        case 3: return "text-[#fc4e03] font-semibold";
        case 4: return "text-[#ff0000] font-semibold";
        default: return "text-black font-semibold";
    }
};
function LevelBadge({ level }: {
    level: Level
}) {
    return <Badge variant={'outline'} className={`uppercase`}
        style={{
            backgroundColor: `${level.themeColor}33`, // 20% opacity
            color: level.themeColor
        }}>{level.name.split('(')[0]}</Badge>
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
        accessorKey: "Class Name",
        header: "Class Name",
        cell: ({ row }) => {
            return <div>{row.original.name}</div>
        }
    },
    {
        accessorKey: 'Level',
        header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
        cell: ({ row }) => {
            return row.original.level && <LevelBadge level={row.original.level} />
        }
    },
    {
        accessorKey: 'Total Lessons',
        header: () => <div className="flex flex-row gap-1 items-center"><Calendar /> Total Lessons</div>,
        cell: ({ row }) => {
            return <div className={(row.original.totalSlots > row.original.requiredSlots) ? "text-red-500" : ""}>
                {row.original.totalSlots} / {row.original.requiredSlots}
            </div>
        }
    },
    {
        accessorKey: 'Instructor',
        header: () => <div className="flex flex-row gap-1 items-center"><User /> Instructor</div>,
        cell: ({ row }) => {
            return <div>{row.original.instructor?.userName ?? "(Unassigned)"}</div>
        }
    },
    {
        accessorKey: 'Student Number',
        header: () => <div className="flex flex-row gap-1 items-center"><Users2 /> Student Number</div>,
        cell: ({ row }) => {
            return <div>{row.original.studentNumber} / {row.original.capacity}</div>
        }
    },
    {
        accessorKey: 'Status',
        header: () => <div className="flex flex-row gap-1 items-center">Status</div>,
        cell: ({ row }) => {
            return <StatusBadge status={row.original.status} />
        }
    },
    {
        accessorKey: 'Public',
        header: () => <div className="flex flex-row gap-1 items-center">Public</div>,
        cell: ({ row }) => {
            return (
                row.original.isPublic && (
                    <div className="text-green-400 flex justify-center">
                        <CheckCircle />
                    </div>
                )
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <Button Icon={Eye} iconPlacement="left" onClick={() => window.location.href = `/staff/classes/${row.original.id}`}>
                    Detail
                </Button>
                // <DropdownMenu>
                //     <DropdownMenuTrigger asChild>
                //         <Button variant="ghost" className="h-8 w-8 p-0">
                //             <span className="sr-only">Actions</span>
                //             <MoreHorizontal className="h-4 w-4" />
                //         </Button>
                //     </DropdownMenuTrigger>
                //     <DropdownMenuContent align="end">
                //         <DropdownMenuLabel>Actions</DropdownMenuLabel>
                //         <DropdownMenuSeparator />
                //         <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/staff/classes/${row.original.id}`}>
                //             <UsersRound /> Xem thông tin lớp
                //         </DropdownMenuItem>
                //         <DropdownMenuItem className="text-red-600 cursor-pointer">
                //             <BanIcon /> Vô hiệu hóa
                //         </DropdownMenuItem>
                //     </DropdownMenuContent>
                // </DropdownMenu>
            )
        }
    }
]
