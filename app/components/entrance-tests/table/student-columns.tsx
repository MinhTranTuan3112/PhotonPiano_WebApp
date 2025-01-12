import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Pencil, Eye, Mail, Phone, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { EntranceTestStudentWithScore } from "~/lib/types/entrance-test/entrance-test-student";

export const studentColumns: ColumnDef<EntranceTestStudentWithScore>[] = [
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
    {
        accessorKey: "Tên",
        header: "Tên học viên",
        cell: ({ row }) => {
            return <div>{row.original.student.username}</div>
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
        header: "Hành động",
        cell: ({ row }) => {
            return (
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
                        <DropdownMenuItem className="cursor-pointer">
                            <Pencil /> Chỉnh sửa điểm số
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                            <Trash2 /> Xóa khỏi ca thi
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
]
