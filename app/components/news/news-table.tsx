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
        {isPublished ? 'Published' : 'Draft'}
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
        accessorKey: "Title",
        header: "Title",
        cell: ({ row }) => {
            return <div className="font-bold flex flex-col gap-1">
                {row.original.title}
            </div>
        }
    },
    {
        accessorKey: "Content",
        header: "Content",
        cell: ({ row }) => {
            return <div className="line-clamp-1" dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(row.original.content.slice(0, 100))
            }}>

            </div>
        }
    },
    {
        accessorKey: 'Created Date',
        header: (header) => {
            return <div className="flex flex-row items-center">
                <Clock />
                Created Date
            </div>
        },
        cell: ({ row }) => {
            return <div>{formatRFC3339ToDisplayableDate(row.original.createdAt, false)}</div>
        }
    },
    {
        accessorKey: 'Publish date',
        header: (header) => {
            return <div className="flex flex-row items-center">
                <Clock />
                Publish date
            </div>
        },
        cell: ({ row }) => {
            return <div>{row.original.publishedAt ? formatRFC3339ToDisplayableDate(row.original.publishedAt, false) : '(None)'}</div>
        }
    },
    {
        accessorKey: 'Status',
        header: () => <div className="flex flex-row gap-1 items-center">Status</div>,
        cell: ({ row }) => {
            return <div>
                <PublishBadge isPublished={row.original.isPublished} />
            </div>
        }
    },
    {
        id: 'Actions',
        accessorKey: 'Actions',
        header: 'Actions',
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
        title: 'Confirm action',
        description: 'Delete this article?',
        confirmText: 'Delete',
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
            toast.success('Delete success!');
            return;
        }

        if (fetcher.data?.success === false) {
            toast.warning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }


        return () => {

        }

    }, [fetcher.data]);


    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" type="button">
                    <span className="sr-only">Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    navigate(`/staff/articles/${row.original.slug}`);
                }}>
                    <Eye />
                    View
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer" onClick={() => {

                }}>

                    {row.original.isPublished ? 'Unpublish' : 'Publish'}
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer text-red-700" onClick={handleOpenConfirmDialog}
                    disabled={isSubmitting}>
                    <Trash2 />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
    </>
}