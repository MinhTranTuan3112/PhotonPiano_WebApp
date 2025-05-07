import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CircleX, Loader2, MoreHorizontal, Copy } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Transaction, TransactionType } from "~/lib/types/transaction/transaction"
import { formatPrice } from "~/lib/utils/price"
import { Banknote, CircleCheck } from 'lucide-react';
import VnPayLogo from '../../../lib/assets/images/vnpay.webp'
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime"
import { toast } from "sonner"

function PaymentMethodBadge({ method }: { method: number }) {

    let badge = <></>;

    switch (method) {
        case 0:
            badge = <Badge variant="outline" className="flex flex-row gap-1 items-center"><Banknote /> Cash</Badge>;
            break;

        case 1:
            badge = <Badge variant="outline" className="flex flex-row gap-1 items-center">
                <img src={VnPayLogo} alt="" className="size-5" />
                VNPAY
            </Badge>;
            break;
        default:
            break;
    }

    return badge;
}

export function PaymentStatusBadge({ status }: { status: number }) {
    let badge = <></>;

    switch (status) {
        case 0:
            badge = <Badge variant="outline" className="bg-blue-400 flex flex-row gap-1 items-center">
                <Loader2 />
                Waiting
            </Badge>;
            break;

        case 1:
            badge = <Badge variant="outline" className="bg-green-400 flex flex-row gap-1 items-center">
                <CircleCheck />
                Success
            </Badge>;
            break;
        case 2:
            badge = <Badge variant="outline" className="bg-red-400 flex flex-row gap-1 items-center">
                <CircleX />
                Failed
            </Badge>;
            break;
        case 3:
            badge = <Badge variant="outline" className="bg-red-400 flex flex-row gap-1 items-center">
                <CircleX />
                Cancelled
            </Badge>;
            break;

        default:
            break;
    }

    return badge;
}

export const columns: ColumnDef<Transaction>[] = [
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
        accessorKey: 'Transaction Code',
        header: 'Transaction Code',
        cell: ({ row }) => {
            return <div className="font-bold">{row.original.transactionCode}</div>
        }
    },
    {
        accessorKey: 'Type',
        header: 'Type',
        cell: ({ row }) => {
            const type = row.original.transactionType;

            return type === 0 ? "Entrance test fee" : "Tuition fee"
        }
    },
    {
        accessorKey: 'Payment Method',
        header: 'Payment Method',
        cell: ({ row }) => {
            const method = row.original.paymentMethod;

            return <PaymentMethodBadge method={method} />
        }
    },
    {
        accessorKey: 'Status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.paymentStatus;

            return <PaymentStatusBadge status={status} />
        }
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return <div className="">{row.original.createdByEmail}</div>
        }
    },
    {
        accessorKey: "Amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
            const amount = row.original.amount;
            return <div className={`text-right font-bold ${amount <= 0 ? 'text-red-500' : 'text-green-500'}`}>{amount >= 0 ? `+${formatPrice(amount)}` : formatPrice(amount)} đ</div>
        }
    },
    {
        accessorKey: 'Created Date',
        header: () => <div className="">Created Date</div>,
        cell: ({ row }) => {
            return <div className="">{formatRFC3339ToDisplayableDate(row.original.createdAt, false)}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {

            const transaction = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer"
                            onClick={() => {
                                navigator.clipboard.writeText(transaction.transactionCode || transaction.id);
                                toast.success('Copied transaction code to clipboard!');
                            }}
                        >
                            <Copy />  Copy transaction code
                        </DropdownMenuItem>
                        {/* <DropdownMenuSeparator />
                        <DropdownMenuItem>View customer</DropdownMenuItem>
                        <DropdownMenuItem>View payment details</DropdownMenuItem> */}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
]