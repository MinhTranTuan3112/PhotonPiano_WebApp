import { columns, Transaction } from "~/components/transactions/transaction-table/columns";
import { DataTable } from "~/components/ui/data-table";

type Props = {}

const data: Transaction[] = [
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m1@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m2@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m3@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    },
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m4@example.com",
    }
];

export default function TransactionHistoryPage({ }: Props) {


    return (
        <article className="px-10 py-4">
            <DataTable columns={columns} data={data} />
        </article>
    )
}

