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
import Image from "~/components/ui/image";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-gray-800 font-semibold";
        default: return "text-black font-semibold";
    }
};

// const getLevelStyle = (level?: Level) => {
//     switch (level) {
//         case 0: return "text-blue-500 font-semibold";
//         case 1: return "text-pink-500 font-semibold";
//         case 2: return "text-red-500 font-semibold";
//         case 3: return "text-green-500 font-semibold";
//         case 4: return "text-red-400 font-semibold";
//         default: return "text-black font-semibold";
//     }
// };

export function LevelBadge({ level }: {
    level?: Level
}) {
    return <Badge variant={'outline'} className={`uppercase`}>
        {level ? level.name : 'Chưa xác định'}
    </Badge>
}

export function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{status === 0 ? "Hoạt động" : "Không hoạt động"}</Badge>
}

export const teacherColumns: ColumnDef<Account>[] = [
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
        accessorKey: 'Ảnh',
        header: 'Ảnh',
        cell: ({ row }) => {
            return <div><Image className="w-32 h-32" src={row.original.avatarUrl || "/images/noavatar.png"}/></div>
        }
    },
    {
        accessorKey: 'Tên',
        header: 'Tên giảng viên',
        cell: ({ row }) => {
            return <div>{row.original.fullName || row.original.userName}</div>
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
            return <LevelBadge level={row.original.level} />
        }
    },
    {
        accessorKey: 'Trạng thái',
        header: () => <div className="flex flex-row gap-1 items-center">Trạng thái</div>,
        cell: ({ row }) => {
            return <StatusBadge status={row.original.status || 0} />
        }
    },
    {
        accessorKey: "Thao tác",
        header: "Hành động",
        cell: ({ row, table }) => {
            return <ActionsDropdown table={table} accountId={row.original.accountFirebaseId}/>
        }
    }
]


function ActionsDropdown({ table, accountId }: {
    table: Table<Account>,
    accountId : string
}) {

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
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/staff/teachers/${accountId}`}>
                    <User /> Xem thông tin
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <BanIcon /> Vô hiệu hóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
}