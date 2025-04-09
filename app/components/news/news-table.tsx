import { ColumnDef, Row } from "@tanstack/react-table";
import { Article } from "~/lib/types/news/article";
import { Checkbox } from "../ui/checkbox";
import { Clock, Eye, MoreHorizontal } from "lucide-react";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useNavigate } from "@remix-run/react";
import DOMPurify from "isomorphic-dompurify";


export function PublishBadge({
    isPublished
}: {
    isPublished: boolean;
}) {
    return <Badge variant={'outline'} className={isPublished ? 'text-green-600' : 'text-gray-500'}>
        {isPublished ? 'Đã xuất bản' : 'Nháp'}
    </Badge>
}

export const columns: ColumnDef<Article>[] = [
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
        accessorKey: "Tiêu đề",
        header: "Tiêu đề",
        cell: ({ row }) => {
            return <div className="font-bold">{row.original.title}</div>
        }
    },
    {
        accessorKey: "Nội dung",
        header: "Nội dung",
        cell: ({ row }) => {
            return <div className="line-clamp-1" dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(row.original.content.slice(0, 100))
            }}>

            </div>
        }
    },
    {
        accessorKey: 'Ngày tạo',
        header: (header) => {
            return <div className="flex flex-row items-center">
                <Clock />
                Ngày tạo
            </div>
        },
        cell: ({ row }) => {
            return <div>{formatRFC3339ToDisplayableDate(row.original.createdAt, false)}</div>
        }
    },
    {
        accessorKey: 'Trạng thái',
        header: () => <div className="flex flex-row gap-1 items-center">Trạng thái</div>,
        cell: ({ row }) => {
            return <div>
                <PublishBadge isPublished={row.original.isPublished} />
            </div>
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
];

function ActionDropdown({ row }: {
    row: Row<Article>
}) {

    const navigate = useNavigate();

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" type="button">
                    <span className="sr-only">Thao tác</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    navigate(`/staff/articles/${row.original.slug}`);
                }}>
                    <Eye />
                    Xem
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer" onClick={() => {

                }}>

                    Xuất bản
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
}