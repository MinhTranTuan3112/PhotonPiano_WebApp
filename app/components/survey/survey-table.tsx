import { ColumnDef, Row } from "@tanstack/react-table";
import { Survey } from "~/lib/types/survey/survey";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useFetcher, useNavigate, useRouteLoaderData } from "@remix-run/react";
import { action } from "~/routes/staff.surveys._index";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { useEffect } from "react";
import { toast } from "sonner";
import { toastWarning } from "~/lib/utils/toast-utils";
import { loader } from "~/root";
import { Role } from "~/lib/types/account/account";

export const columns: ColumnDef<Survey>[] = [
    // {
    //     accessorKey: 'Mã khảo sát',
    //     header: 'Mã khảo sát',
    //     cell: ({ row }) => {
    //         return <div className="font-bold">{row.original.id}</div>
    //     }
    // },
    {
        accessorKey: 'Name',
        header: 'Name',
        cell: ({ row }) => {
            return <div className="">{row.original.name}</div>
        }
    },
    {
        accessorKey: 'Description',
        header: 'Description',
        cell: ({ row }) => {
            return <div className="">{row.original.description}</div>
        }
    },
    {
        accessorKey: 'Created Date',
        header: 'Created Date',
        cell: ({ row }) => {
            return <div className="">{formatRFC3339ToDisplayableDate(row.original.createdAt, false)}</div>
        }
    },
    {
        accessorKey: 'Is entrance survey',
        header: 'Is entrance survey',
        cell: ({ row }) => {
            return <div className="">{row.original.isEntranceSurvey ? 'Có' : 'Không'}</div>
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
]

function ActionDropdown({ row }: {
    row: Row<Survey>
}) {

    const authData = useRouteLoaderData<typeof loader>("root");

    const role = authData?.role ? authData.role as number : 0;

    const navigate = useNavigate()

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Delete this survey?',
        confirmText: 'Delete',
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
            toast.success('Delete success!');
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning('Delete failed!', {
                description: fetcher.data.error,
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
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    navigate(role === Role.Staff ? `/staff/surveys/${row.original.id}` : `/account/my-surveys/${row.original.id}`)
                }}>
                    <Eye />
                    View
                </DropdownMenuItem>
                {role === Role.Staff && <DropdownMenuItem className="cursor-pointer text-red-600" disabled={isSubmitting}
                    onClick={handleOpenConfirmDialog}>
                    <Trash2 />
                    Delete
                </DropdownMenuItem>}

            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
    </>
}