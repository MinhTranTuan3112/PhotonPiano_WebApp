import { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Clock, Eye, User, Music2, Calendar, Users2, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from "~/components/ui/badge";
import { CLASS_STATUS } from "~/lib/utils/constants";
import { ClassResponse } from "~/lib/types/class/class";
import { Level } from "~/lib/types/account/account";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { Link } from "@remix-run/react";
import NoInformation from "~/components/common/no-information";

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
export const classColums: ColumnDef<ClassResponse>[] = [
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
            return <div>
                <Link to={`/staff/classes/${row.original.id}`} className="w-full hover:underline font-bold">{row.original.name}</Link>
            </div>
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
        accessorKey: 'Duration',
        header: () => <div className="flex flex-row gap-1 items-center"><CalendarClock /> Duration</div>,
        cell: ({ row }) => {
            return <div className="">
                {row.original.startTime && row.original.endTime ?
                    `${formatRFC3339ToDisplayableDate(row.original.startTime, false, false)} - ${formatRFC3339ToDisplayableDate(row.original.endTime, false, false)}` :
                    <NoInformation />}
            </div>
        }
    },
    {
        accessorKey: 'Teacher',
        header: () => <div className="flex flex-row gap-1 items-center"><User /> Teacher</div>,
        cell: ({ row }) => {
            return <div>{row.original.instructor?.fullName || row.original.instructor?.email || "(Unassigned)"}</div>
        }
    },
    {
        accessorKey: 'Total learners',
        header: () => <div className="flex flex-row gap-1 items-center"><Users2 /> Total learners</div>,
        cell: ({ row }) => {
            return <div className="">{row.original.studentNumber} / {row.original.capacity}</div>
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
                row.original.isPublic ? (
                    <div className="text-green-400 flex justify-center">
                        <CheckCircle />
                    </div>
                ) :
                    <div className="text-red-400 flex justify-center">
                        <XCircle />
                    </div>
            )
        }
    },
    {
        id: "actions",
        header: 'Actions',
        cell: ({ row }) => {
            return (
                // <Button Icon={Eye} iconPlacement="left" onClick={() => window.location.href = `/staff/classes/${row.original.id}`}>
                //     Detail
                // </Button>
                <div className="flex justify-center">
                    <Link to={`/staff/classes/${row.original.id}`} className="w-full">
                        <Eye className="w-full" />
                    </Link>
                </div>
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
