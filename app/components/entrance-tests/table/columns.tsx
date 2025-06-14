import { ColumnDef, Row } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { EntranceTest, EntranceTestStatus } from "~/lib/types/entrance-test/entrance-test";
import { MapPin, CalendarClock, Clock, MoreHorizontal, Trash2, Loader2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from "~/lib/utils/constants";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { toast } from "sonner";
import { Link, useFetcher, useNavigate, useRouteLoaderData } from "@remix-run/react";
import { loader } from "~/root";
import { Role } from "~/lib/types/account/account";
import { action } from "~/routes/delete-entrance-test";
import { useEffect } from "react";
import { toastWarning } from "~/lib/utils/toast-utils";

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 bg-green-500/20 font-semibold";
        case 1: return "text-blue-500 bg-blue-500/20 font-semibold";
        case 2: return "text-gray-500 bg-gray-500/20 font-semibold";
        case 3: return "text-gray-500 bg-green-500/20 font-semibold";
        default: return "text-black font-semibold";
    }
};

export function TestStatusBadge({ status }: {
    status: number
}) {
    return <Badge variant={'outline'} className={`${getStatusStyle(status)} uppercase`}>{ENTRANCE_TEST_STATUSES[status]}</Badge>
}

export const columns: ColumnDef<EntranceTest>[] = [
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
    //     accessorKey: "Mã đợt thi",
    //     header: () => <div>Mã đợt thi</div>,
    //     cell: ({ row }) => {
    //         return <div className="font-bold">{row.original.id}</div>
    //     }
    // },
    {
        accessorKey: "Test name",
        header: "Test name",
        cell: ({ row }) => {
            return <TestNameSection row={row}/>
        }
    },
    {
        accessorKey: "Date",
        header: () => <div className="flex flex-row gap-1 items-center"><CalendarClock /> Date</div>,
        cell: ({ row }) => {
            return <div>{row.original.date}</div>
        }
    },
    {
        accessorKey: 'Shift',
        header: () => <div className="flex flex-row gap-1 items-center"><Clock /> Shift</div>,
        cell: ({ row }) => {
            return <div>{SHIFT_TIME[row.original.shift]}</div>
        }
    },
    {
        accessorKey: 'Room',
        header: () => <div className="flex flex-row gap-1 items-center"><MapPin /> Room</div>,
        cell: ({ row }) => {
            return <div>{row.original.roomName}</div>
        }
    },
    {
        accessorKey: "Teacher",
        header: "Teacher",
        cell: ({ row }) => {
            return <div>{row.original.instructorName || '(None)'}</div>
        }
    },
    {
        accessorKey: 'Is score announced',
        header: 'Is score announced',
        cell: ({ row }) => {
            return <div className="flex justify-center">{row.original.isAnnouncedScore ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}</div>
        }
    },
    {
        accessorKey: "Status",
        header: "Status",
        cell: ({ row }) => {
            return <TestStatusBadge status={row.original.testStatus} />
        }
    },
    {
        id: "Actions",
        cell: ({ row }) => {
            return (
                <ActionsDropdown row={row} />
            )
        }
    }
]

function TestNameSection({ row }: { row: Row<EntranceTest> }) {
    const authData = useRouteLoaderData<typeof loader>("root");

    return <div className="font-bold">
        <Link to={`/${authData?.role === Role.Staff ? 'staff' : 'teacher'}/entrance-tests/${row.original.id}`} className="hover:underline">{row.original.name}</Link>
    </div>
}

function ActionsDropdown({ row }: { row: Row<EntranceTest> }) {

    const authData = useRouteLoaderData<typeof loader>("root");

    const navigate = useNavigate();

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === "submitting";

    const { dialog: confirmDialog, open: handleOpenDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Delete this test? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: () => {
            const formData = new FormData();
            formData.append("entranceTestId", row.original.id);
            fetcher.submit(formData, {
                method: "POST",
                action: "/delete-entrance-test",
            });
        },
        confirmButtonClassname: 'bg-red-600 hover:bg-red-700',
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success("Test deleted successfully!");
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error, {
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
                <DropdownMenuItem className="cursor-pointer"
                    onClick={() => navigate(authData?.role === Role.Staff ? `/staff/entrance-tests/${row.original.id}` : `/teacher/entrance-tests/${row.original.id}`)}>
                    <Eye /> View
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleOpenDialog}
                    disabled={isSubmitting || row.original.testStatus !== EntranceTestStatus.NotStarted}>
                    {!isSubmitting ? <Trash2 /> : <Loader2 className="animate-spin" />} Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
    </>
}