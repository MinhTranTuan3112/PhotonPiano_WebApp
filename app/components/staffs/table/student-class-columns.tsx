import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import {
    MoreHorizontal, Mail, Phone, User, BanIcon, Music2,
    Calendar
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Account, Level } from "~/lib/types/account/account";
import { Badge } from "~/components/ui/badge";
import { LEVEL, STUDENT_STATUS } from "~/lib/utils/constants";
import { useState } from "react";
import ArrangeDialog from "~/components/entrance-tests/arrange-dialog";
import { StudentClassWithStudent } from "~/lib/types/class/student-class";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

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

function LevelBadge({ level }: {
    level?: number
}) {
    return <Badge variant={'outline'} className={`${getLevelStyle(level)} uppercase`}>
        {level !== null ? `LEVEL ${(level || 0) + 1} - ${Level[level || 0]}` : 'Chưa xếp'}
    </Badge>
}

function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{STUDENT_STATUS[status]}</Badge>
}

export const studentClassColumns: ColumnDef<StudentClassWithStudent>[] = [
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
        accessorKey: 'Tên',
        header: 'Tên học viên',
        cell: ({ row }) => {
            return <div>{row.original.student.fullName || row.original.student.userName}</div>
        }
    },
    {
        accessorKey: 'Ảnh',
        header: 'Tên học viên',
        cell: ({ row }) => {
            return <Avatar  className="w-16 h-16" >
            <AvatarImage src={row.original.student.avatarUrl} alt="avatar"/>
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
        accessorKey: 'SĐT',
        header: () => <div className="flex flex-row gap-1 items-center"><Phone /> SĐT</div>,
        cell: ({ row }) => {
            return <div>{row.original.student.phone}</div>
        }
    },
    // {
    //     accessorKey: 'Level',
    //     header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
    //     cell: ({ row }) => {
    //         return <LevelBadge level={row.original.level} />
    //     }
    // },
    {
        accessorKey: 'Trạng thái',
        header: () => <div className="flex flex-row gap-1 items-center">Trạng thái</div>,
        cell: ({ row }) => {
            return <StatusBadge status={row.original.student.studentStatus || 0} />
        }
    },
    {
        accessorKey: "Thao tác",
        header: "Hành động",
        cell: ({ row, table }) => {
            return <ActionsDropdown table={table} />
        }
    }
]


function ActionsDropdown({ table }: {
    table: Table<StudentClassWithStudent>
}) {

    const [arrangeDialogProps, setArrangeDialogProps] = useState<{
        isOpen: boolean,
        studentIds: string[]
    }>({
        isOpen: false,
        studentIds: []
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
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/`}>
                    <User /> Xem thông tin
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <BanIcon /> Vô hiệu hóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <ArrangeDialog isOpen={arrangeDialogProps.isOpen} setIsOpen={(openState) => {
            setArrangeDialogProps({ ...arrangeDialogProps, isOpen: openState })
        }} studentIds={arrangeDialogProps.studentIds} />
    </>
}