import { ColumnDef, Row } from "@tanstack/react-table";
import { Survey } from "~/lib/types/survey/survey";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import { useNavigate } from "@remix-run/react";

export const columns: ColumnDef<Survey>[] = [
    {
        accessorKey: 'Mã khảo sát',
        header: 'Mã khảo sát',
        cell: ({ row }) => {
            return <div className="font-bold">{row.original.id}</div>
        }
    },
    {
        accessorKey: 'Tên khảo sát',
        header: 'Tên khảo sát',
        cell: ({ row }) => {
            return <div className="">{row.original.name}</div>
        }
    },
    {
        accessorKey: 'Mô tả',
        header: 'Mô tả',
        cell: ({ row }) => {
            return <div className="">{row.original.description}</div>
        }
    },
    {
        accessorKey: 'Ngày tạo',
        header: 'Ngày tạo',
        cell: ({ row }) => {
            return <div className="">{formatRFC3339ToDisplayableDate(row.original.createdAt, false)}</div>
        }
    },
    {
        accessorKey: 'Là khảo sát đầu vào',
        header: 'Là khảo sát đầu vào',
        cell: ({ row }) => {
            return <div className="">{row.original.isEntranceSurvey ? 'Có' : 'Không'}</div>
        }
    },
    {
        id: 'Thao tác',
        accessorKey: 'Thao tác',
        header: 'Thao tác',
        cell: ({ row }) => {
            return <ActionDropdown row={row} />
        }
    }
]

function ActionDropdown({ row }: {
    row: Row<Survey>
}) {

    const navigate = useNavigate();


    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Thao tác</span>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => {
                navigate(`/staff/surveys/${row.original.id}`)
            }}>
                <Eye />
                Xem
            </DropdownMenuItem>

        </DropdownMenuContent>
    </DropdownMenu>
}