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
import { LEVEL, STUDENT_STATUS } from "~/lib/utils/constants";
import { useState } from "react";
import ArrangeDialog from "~/components/entrance-tests/arrange-dialog";
import Image from "~/components/ui/image";
import useLoadingDialog from "~/hooks/use-loading-dialog";
import { useFetcher, useSearchParams } from "@remix-run/react";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { ActionResult } from "~/lib/types/action-result";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-gray-800 font-semibold";
        default: return "text-black font-semibold";
    }
};

export function LevelBadge({ level }: {
    level?: Level
}) {
    return <Badge variant={'outline'} className={`uppercase`}>
        {level ? level.name : 'Unspecified'}
    </Badge>
}

export function StatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>
        {status === 0 ? "Active" : "Inactive"}
    </Badge>
}

export const teacherColumns: ColumnDef<Account>[] = [
    {
        accessorKey: 'Image',
        header: 'Image',
        cell: ({ row }) => {
            return <div><Image className="w-32 h-32" src={row.original.avatarUrl || "/images/noavatar.png"} /></div>
        }
    },
    {
        accessorKey: 'Name',
        header: 'Teacher Name',
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
        accessorKey: 'Level',
        header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
        cell: ({ row }) => {
            return <LevelBadge level={row.original.level} />
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
        accessorKey: "Actions",
        header: "Actions",
        cell: ({ row, table }) => {
            return <ActionsDropdown table={table} accountId={row.original.accountFirebaseId} status={row.original.status} />
        }
    }
]

function ActionsDropdown({ table, accountId, status }: {
    table: Table<Account>,
    accountId: string,
    status: number
}) {

    const fetcher = useFetcher<ActionResult>();
    const [searchParams, setSearchParams] = useSearchParams();

    const { loadingDialog: loadingToggleDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setSearchParams([...searchParams])
        }
    })

    const { open: handleOpenToggleDialog, dialog: confirmToggleDialog } = useConfirmationDialog({
        title: 'Confirm Toggle Account Status',
        description: 'Do you want to change this account status?',
        onConfirm: () => {
            handleToggle();
        }
    })
    const handleToggle = () => {
        fetcher.submit({
            action: "TOGGLE",
            firebaseUid: accountId,
        }, {
            action: "/endpoint/accounts",
            method: "POST"
        })
    }

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/staff/teachers/${accountId}`}>
                    <User /> View Info
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer"  onClick={handleOpenToggleDialog}>
                    {
                        status === 0 ? (
                            <div className="text-red-600  flex gap-2"> 
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
        {loadingToggleDialog}
        {confirmToggleDialog}
    </>
}
