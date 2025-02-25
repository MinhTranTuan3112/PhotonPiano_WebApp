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


export const studentSimpleColumns: ColumnDef<Account>[] = [
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
        accessorKey: 'Level',
        header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
        cell: ({ row }) => {
            return <LevelBadge level={row.original.level} />
        }
    }
]

