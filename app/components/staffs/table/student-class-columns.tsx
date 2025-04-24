import { ColumnDef, Row, Table } from "@tanstack/react-table";
import {
    MoreHorizontal, Mail, Phone, User,
    Trash,
    Shuffle,
    Music2
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Level } from "~/lib/types/account/account";
import { Badge } from "~/components/ui/badge";
import {STUDENT_STATUS } from "~/lib/utils/constants";
import { StudentClassWithStudent } from "~/lib/types/class/student-class";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-gray-500 font-semibold";
        case 1: return "text-blue-800 font-semibold";
        case 2: return "text-orange-500 font-semibold";
        case 3: return "text-blue-400 font-semibold";
        case 4: return "text-green-400 font-semibold";
        case 5: return "text-red-400 font-semibold";
        case 6: return "text-gray-500 font-semibold";
        default: return "text-black font-semibold";
    }
};

const getLevelStyle = (level?: number) => {
    switch (level) {
        case 0: return "text-[#92D808] font-semibold";
        case 1: return "text-[#FBDE00] font-semibold";
        case 2: return "text-[#FBA000] font-semibold";
        case 3: return "text-[#fc4e03] font-semibold";
        case 4: return "text-[#ff0000] font-semibold";
        default: return "text-black font-semibold";
    }
};

export function LevelBadge({ level }: {
    level?: Level
}) {
    return <Badge variant={'outline'} className={`uppercase`}style={{
        backgroundColor: `${level?.themeColor ?? '#CCCCCC'}33`, // 20% opacity
        color: level?.themeColor ?? "#CCCCCC"
    }}>
        {level ? level.name.split('(')[0] : 'Undetermined'}
    </Badge>
}

function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{STUDENT_STATUS[status]}</Badge>
}

export function studentClassColumns({ handleDeleteConfirm }: {
    handleDeleteConfirm: (id : string) => void
}): ColumnDef<StudentClassWithStudent>[] {
    return [
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
        //     accessorKey: "Mã học viên",
        //     header: "Mã học viên",
        //     cell: ({ row }) => {
        //         return <div>{row.original.accountFirebaseId}</div>
        //     }
        // },
        {
            accessorKey: 'Name',
            header: 'Learner name',
            cell: ({ row }) => {
                return <div>{row.original.student.fullName || row.original.student.userName}</div>
            }
        },
        {
            accessorKey: 'Avatar',
            header: 'Profile Picture',
            cell: ({ row }) => {
                return <Avatar className="w-16 h-16" >
                    <AvatarImage src={row.original.student.avatarUrl} alt="avatar" />
                    <AvatarFallback>Avatar</AvatarFallback>
                </Avatar>
            }
        },
        {
            accessorKey: 'Email',
            header: () => <div className="flex flex-row gap-1 items-center"><Mail /> Email</div>,
            cell: ({ row }) => {
                return <div>{row.original.student.email}</div>
            }
        },
        {
            accessorKey: 'Phone',
            header: () => <div className="flex flex-row gap-1 items-center"><Phone /> Phone</div>,
            cell: ({ row }) => {
                return <div>{row.original.student.phone}</div>
            }
        },
        {
            accessorKey: 'Level',
            header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
            cell: ({ row }) => {
                return <LevelBadge level={row.original.student.level} />
            }
        },
        {
            accessorKey: 'Status',
            header: () => <div className="flex flex-row gap-1 items-center">Status</div>,
            cell: ({ row }) => {
                return <StatusBadge status={row.original.student.studentStatus || 0} />
            }
        },
        {
            accessorKey: "Action",
            header: "Action",
            cell: ({ row, table }) => {
                return <ActionsDropdown table={table} deleteAction={() => handleDeleteConfirm(row.original.studentFirebaseId)} row={row} />
            }
        }
    ]
}


function ActionsDropdown({ table, deleteAction, row }: {
    table: Table<StudentClassWithStudent>,
    row: Row<StudentClassWithStudent>,
    deleteAction : () => void
}) {

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Action</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/staff/students/${row.original.studentFirebaseId}`}>
                    <User /> View Profile
                </DropdownMenuItem>
                {/* <DropdownMenuItem className="cursor-pointer">
                    <Shuffle /> Chuyển lớp
                </DropdownMenuItem> */}
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={deleteAction}>
                    <Trash /> Delete From Class
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
}