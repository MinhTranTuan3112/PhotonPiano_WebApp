import { ColumnDef, Row } from "@tanstack/react-table";
import { Survey } from "~/lib/types/survey/survey";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useFetcher, useNavigate } from "@remix-run/react";
import { action } from "~/routes/staff.surveys._index";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { useEffect } from "react";
import { toast } from "sonner";

export const columns: ColumnDef<Survey>[] = [
    // {
    //     accessorKey: 'Mã khảo sát',
    //     header: 'Mã khảo sát',
    //     cell: ({ row }) => {
    //         return <div className="font-bold">{row.original.id}</div>
    //     }
    // },
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

    const navigate = useNavigate()


    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';


    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận xóa',
        description: 'Bạn có chắc chắn muốn xóa khảo sát này?',
        confirmText: 'Xóa',
        confirmButtonClassname: 'bg-red-600 text-white',
        onConfirm: () => {

            const formData = new FormData();

            formData.append('id', row.original.id);

            fetcher.submit(formData, {
                action: '/staff/surveys',
                method: 'POST'
            })
        }
    });

    useEffect(() => {


        if (fetcher.data?.success === true) {
            toast.success('Xóa khảo sát thành công');
            return;
        }

        if (fetcher.data?.success === false ) {
            toast.error('Xóa khảo sát thất bại: ' + fetcher.data.error);
            return;
        }

        return () => {

        }
        
    }, [fetcher.data]);



    return <>
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
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    navigate(`/staff/surveys/${row.original.id}`)
                }}>
                    <Eye />
                    Xem
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600" disabled={isSubmitting}
                    onClick={handleOpenConfirmDialog}>
                    <Trash2 />
                    Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
    </>
}