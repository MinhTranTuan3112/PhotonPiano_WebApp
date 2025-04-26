import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import {
    MoreHorizontal, Mail, Phone, User, BanIcon, Music2,
    Calendar
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Account, Level, StudentStatus } from "~/lib/types/account/account";
import { Badge } from "~/components/ui/badge";
import { LEVEL, STUDENT_STATUS } from "~/lib/utils/constants";
import { useState } from "react";
import ArrangeDialog, { ArrangeDialogProps } from "~/components/entrance-tests/arrange-dialog";
import { toast } from "sonner";
import { useRouteLoaderData } from "@remix-run/react";
import { loader } from "~/root";
import { toastWarning } from "~/lib/utils/toast-utils";

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
    return <Badge variant={'outline'} className={`uppercase`}
        style={{
            backgroundColor: `${level?.themeColor ?? '#CCCCCC'}33`, // 20% opacity
            color: level?.themeColor ?? "#CCCCCC"
        }}>
        {level ? level.name.split("(")[0] : 'Undetermined'}
    </Badge>
}

export function StatusBadge({ status }: {
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
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                variant={'theme'}
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
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
        accessorKey: 'Name',
        header: 'Name',
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
            return <StatusBadge status={row.original.studentStatus || 0} />
        }
    },
    {
        id: "Actions",
        accessorKey: "Actions",
        header: "Actions",
        cell: ({ row, table }) => {
            return <ActionsDropdown table={table} row={row} />
        }
    }
]


function ActionsDropdown({ table, row }: {
    table: Table<Account>
    row: Row<Account>
}) {

    const authData = useRouteLoaderData<typeof loader>("root");

    const [arrangeDialogProps, setArrangeDialogProps] = useState<Omit<ArrangeDialogProps, 'setIsOpen'>>({
        isOpen: false,
        students: [],
        idToken: authData?.idToken || ''
    });

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
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/staff/students/${row.original.accountFirebaseId}`}>
                    <User /> View information
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer"
                    onClick={() => {
                        const selectedRows = table.getSelectedRowModel().rows;

                        const students = selectedRows.length > 0 ? selectedRows.map((row) => row.original) : [row.original];

                        const invalidStudents = students.filter((student) => student.studentStatus !== StudentStatus.WaitingForEntranceTestArrangement);

                        if (invalidStudents.length > 0) {
                            toastWarning(`Learners ${invalidStudents.map((s) => {
                                return s.fullName || s.email
                            }).join(',')} are not valid to be arranged`, {
                                duration: 5000
                            })
                            return;
                        }

                        setArrangeDialogProps({ ...arrangeDialogProps, isOpen: true, students });
                    }}>
                    <Calendar /> Arrange entrance tests
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <BanIcon /> Disable
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <ArrangeDialog {...arrangeDialogProps} setIsOpen={(openState) => {
            setArrangeDialogProps({ ...arrangeDialogProps, isOpen: openState })
        }} />
    </>
}