import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import {
    MoreHorizontal, Mail, Phone, User, BanIcon, Music2,
    Calendar,
    CheckCircle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Account, Level } from "~/lib/types/account/account";
import { Badge } from "~/components/ui/badge";
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

export function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{status === 0 ? "Active" : "Inactive"}</Badge>
}

export const staffColumns: ColumnDef<Account>[] = [
    {
        accessorKey: 'Avatar',
        header: 'Ảnh',
        cell: ({ row }) => {
            return <div><Image className="w-32 h-32" src={row.original.avatarUrl || "/images/noavatar.png"}/></div>
        }
    },
    {
        accessorKey: 'Name',
        header: 'Staff Name',
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
        accessorKey: 'Phone',
        header: () => <div className="flex flex-row gap-1 items-center"><Phone /> Phone</div>,
        cell: ({ row }) => {
            return <div>{row.original.phone}</div>
        }
    },
    {
        accessorKey: 'Status',
        header: () => <div className="flex flex-row gap-1 items-center">Status</div>,
        cell: ({ row }) => {
            return <StatusBadge status={row.original.status || 0} />
        }
    },
    {
        accessorKey: "Action",
        header: "Action",
        cell: ({ row, table }) => {
            return <ActionsDropdown table={table} accountId={row.original.accountFirebaseId} status={row.original.status}/>
        }
    }
]


function ActionsDropdown({ table, accountId, status }: {
    table: Table<Account>,
    accountId : string
    status: number
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
                <DropdownMenuItem className="cursor-pointer">
                    {
                        status === 0 ? (
                            <div className="text-red-600 flex gap-2">
                                <BanIcon /> Disable
                            </div>
                        ) : (
                            <div className="text-green-600  flex gap-2">
                                <CheckCircle /> Enable
                            </div>
                        )
                    }
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
}