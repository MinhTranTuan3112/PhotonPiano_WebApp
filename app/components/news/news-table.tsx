import { ColumnDef, Row } from "@tanstack/react-table";
import { Article } from "~/lib/types/news/article";
import { Checkbox } from "../ui/checkbox";
import { Clock, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useFetcher, useNavigate } from "@remix-run/react";
import DOMPurify from "isomorphic-dompurify";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { action } from "~/routes/staff.articles._index";
import { useEffect } from "react";
import { toast } from "sonner";


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
            return <div className="font-bold flex flex-col gap-1">
                {row.original.title}
            </div>
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
        accessorKey: 'Ngày xuất bản',
        header: (header) => {
            return <div className="flex flex-row items-center">
                <Clock />
                Ngày xuất bản
            </div>
        },
        cell: ({ row }) => {
            return <div>{row.original.publishedAt ? formatRFC3339ToDisplayableDate(row.original.publishedAt, false) : '(Chưa có)'}</div>
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

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xóa bài viết',
        description: 'Bạn có chắc chắn muốn xóa bài viết này không?',
        confirmText: 'Xóa',
        confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('slug', row.original.slug);

            fetcher.submit(formData, {
                method: 'POST',
                action: '/staff/articles'
            });
        }
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Xóa bài viết thành công!');
            return;
        }

        if (fetcher.data?.success === false) {
            toast.warning(fetcher.data.error);
            return;
        }


        return () => {

        }

    }, [fetcher.data]);


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

                    {row.original.isPublished ? 'Hủy xuất bản' : 'Xuất bản'}
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer text-red-700" onClick={handleOpenConfirmDialog}
                    disabled={isSubmitting}>
                    <Trash2 />
                    Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
    </>
}