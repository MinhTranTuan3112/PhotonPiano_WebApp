import type React from "react"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { Await, useLoaderData } from "@remix-run/react"
import { AlertCircle, ArrowDownUp, Badge, Clock, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { fetchTransactionsWithStatistics } from "~/lib/services/transaction"
import type { PaginationMetaData } from "~/lib/types/pagination-meta-data"
import type { Transaction } from "~/lib/types/transaction/transaction"
import { requireAuth } from "~/lib/utils/auth"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { getParsedParamsArray, trimQuotes } from "~/lib/utils/url"
import SearchForm from "~/components/transactions/transaction-table/search-form"
import { Suspense } from "react"
import GenericDataTable from "~/components/ui/generic-data-table"
import { Skeleton } from "~/components/ui/skeleton"
import { columns } from "~/components/transactions/transaction-table/columns"

type Props = {}

type TransactionResponse = {
    transactions: {
        items: Transaction[]
        limit: number
        page: number
        totalCount: number
        totalPages: number
    }
    statistics: {
        totalTransactions: number
        pendingTransactions: number
        completedTransactions: number
        failedTransactions: number
        canceledTransactions: number
    }
}

type LoaderData = {
    promise: Promise<{
        transactionsPromise: Promise<TransactionResponse>
        metadata: PaginationMetaData
        query: any
    }>
    query: any
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { idToken } = await requireAuth(request)
        const { searchParams } = new URL(request.url)
        const stringStatusesArray = getParsedParamsArray({ paramsValue: searchParams.get("statuses") })
        const stringMethodsArray = getParsedParamsArray({ paramsValue: searchParams.get("methods") })
        const query = {
            page: Number.parseInt(searchParams.get("page") || "1"),
            pageSize: Number.parseInt(searchParams.get("size") || "10"),
            sortColumn: searchParams.get("column") || "Id",
            orderByDesc: searchParams.get("desc") === "true" ? true : false,
            statuses: stringStatusesArray.map(Number),
            methods: stringMethodsArray.map(Number),
            code: searchParams.get("transactionCode")?.slice(1, -1),
            startDate: trimQuotes(searchParams.get('startDate') || '') || undefined,
            endDate: trimQuotes(searchParams.get('endDate') || '') || undefined,
            idToken,
        }
        const promise = fetchTransactionsWithStatistics({ ...query }).then((response) => {
            const transactionsPromise: Promise<TransactionResponse> = response.data
            const headers = response.headers

            const metadata: PaginationMetaData = {
                page: Number.parseInt(headers["x-page"] || "1"),
                pageSize: Number.parseInt(headers["x-page-size"] || "10"),
                totalPages: Number.parseInt(headers["x-total-pages"] || "1"),
                totalCount: Number.parseInt(headers["x-total-count"] || "0"),
            }

            return {
                transactionsPromise,
                metadata,
                query: { ...query, idToken: undefined },
            }
        })

        return {
            promise,
            query: { ...query, idToken: undefined },
        }
    } catch (error) {
        console.error(error)
        if (isRedirectError(error)) {
            throw error
        }
        const { message, status } = getErrorDetailsInfo(error)
        throw new Response(message, { status })
    }
}

export default function TransactionHistoryPage({ }: Props) {
    const loaderData = useLoaderData<typeof loader>() as LoaderData

    return (
        <div className="px-4 md:px-6 space-y-6 max-w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-theme">Transaction History</h1>
                <p className="text-muted-foreground text-sm">
                    View and manage transactions at Photon Piano center related to training fees, entrance exams, tuition, and
                    more.
                </p>
            </div>

            <Suspense fallback={<StatsCardsSkeleton />}>
                <Await resolve={loaderData.promise} key={JSON.stringify(loaderData.query)}>
                    {({ transactionsPromise }) => (
                        <Await resolve={transactionsPromise}>
                            {(data: TransactionResponse) => {
                                const statistics = data.statistics || {
                                    totalTransactions: 0,
                                    pendingTransactions: 0,
                                    completedTransactions: 0,
                                    failedTransactions: 0,
                                    canceledTransactions: 0,
                                }

                                return (
                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                                        <StatsCard
                                            title="Total Transactions"
                                            value={statistics.totalTransactions.toString()}
                                            description="All time"
                                            icon={<Wallet className="h-5 w-5 text-primary" />}
                                            className="bg-primary/5 border-primary/10"
                                        />
                                        <StatsCard
                                            title="Pending"
                                            value={statistics.pendingTransactions.toString()}
                                            description="Awaiting processing"
                                            icon={<Clock className="h-5 w-5 text-amber-500" />}
                                            className="bg-amber-50 border-amber-100"
                                        />
                                        <StatsCard
                                            title="Completed"
                                            value={statistics.completedTransactions.toString()}
                                            description="Successfully processed"
                                            icon={<Badge className="h-5 w-5 text-emerald-500" />}
                                            className="bg-emerald-50 border-emerald-100"
                                        />
                                        <StatsCard
                                            title="Failed"
                                            value={(statistics.failedTransactions + statistics.canceledTransactions).toString()}
                                            description="Processing errors"
                                            icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
                                            className="bg-rose-50 border-rose-100"
                                        />
                                    </div>
                                )
                            }}
                        </Await>
                    )}
                </Await>
            </Suspense>

            <Card className="border-border/40">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ArrowDownUp className="h-4 w-4" />
                        Transaction Records
                    </CardTitle>
                    <CardDescription>Search, filter, and manage transaction records</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <SearchForm />
                        <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(loaderData.query)}>
                            <Await resolve={loaderData.promise}>
                                {({ transactionsPromise, metadata }) => (
                                    <Await resolve={transactionsPromise}>
                                        {(data: TransactionResponse) => {
                                            return (
                                                <GenericDataTable
                                                    columns={columns}
                                                    resolvedData={data.transactions.items.map(t => {
                                                        return {
                                                            ...t,
                                                            amount: t.amount * (-1)
                                                        }
                                                    })}
                                                    emptyText="No transactions found."
                                                    metadata={{
                                                        ...metadata,
                                                        totalCount: data.transactions.totalCount,
                                                        totalPages: data.transactions.totalPages,
                                                    }}
                                                />
                                            )
                                        }}
                                    </Await>
                                )}
                            </Await>
                        </Suspense>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StatsCard({
    title,
    value,
    description,
    icon,
    className = "",
}: {
    title: string
    value: string
    description: string
    icon: React.ReactNode
    className?: string
}) {
    return (
        <Card className={`overflow-hidden ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">{title}</span>
                        <span className="text-xl font-bold">{value}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                    <div className="rounded-full bg-background p-2 shadow-sm">{icon}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-2.5 w-24" />
                            </div>
                            <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-md" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-20" />
            </div>
        </div>
    )
}
