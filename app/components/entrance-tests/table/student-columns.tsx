import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { MoreHorizontal, Trash2, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { EntranceTestStudentWithResults } from "~/lib/types/entrance-test/entrance-test-student";

export const studentColumns: ColumnDef<EntranceTestStudentWithResults>[] = [
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
    {
        accessorKey: "Name",
        header: "Learner",
        cell: ({ row }) => {
            return <div>{row.original.student.fullName || row.original.student.email}</div>
        }
    },
    // {
    //     accessorKey: 'Email',
    //     header: () => <div className="flex flex-row gap-1 items-center"><Mail /> Email</div>,
    //     cell: ({ row }) => {
    //         return <div>{row.original.email}</div>
    //     }
    // },
    // {
    //     accessorKey: 'SĐT',
    //     header: () => <div className="flex flex-row gap-1 items-center"><Phone /> SĐT</div>,
    //     cell: ({ row }) => {
    //         return <div>{row.original.phone}</div>
    //     }
    // },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            return (
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/`}>
                            <User /> View information
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem className="cursor-pointer">
                            <Pencil /> Chỉnh sửa điểm số
                        </DropdownMenuItem> */}
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                            <Trash2 /> Remove from test
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
]
