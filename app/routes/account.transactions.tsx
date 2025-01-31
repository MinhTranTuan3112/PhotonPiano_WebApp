import { LoaderFunctionArgs } from "@remix-run/node";
import { Await, isRouteErrorResponse, Link, useLoaderData, useLocation, useRouteError } from "@remix-run/react";
import { RotateCcw} from "lucide-react";
import { Suspense } from "react";
import { columns } from "~/components/transactions/transaction-table/columns";
import SearchForm from "~/components/transactions/transaction-table/search-form";
import { buttonVariants } from "~/components/ui/button";
import GenericDataTable from "~/components/ui/generic-data-table";
import { Skeleton } from "~/components/ui/skeleton";
import { fetchTransactions } from "~/lib/services/transaction";
import { PaginationMetaData } from "~/lib/types/pagination-meta-data";
import { sampleTransactions, Transaction } from "~/lib/types/transaction/transaction";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { getParsedParamsArray, trimQuotes } from "~/lib/utils/url";

type Props = {}

async function getSampleTransactions() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return sampleTransactions;
}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken } = await requireAuth(request);

        const { searchParams } = new URL(request.url);

        const stringStatusesArray = getParsedParamsArray({ paramsValue: searchParams.get('statuses') });

        const stringMethodsArray = getParsedParamsArray({ paramsValue: searchParams.get('methods') });

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            statuses: stringStatusesArray.map(Number),
            methods: stringMethodsArray.map(Number),
            code: searchParams.get('transactionCode')?.slice(1, -1),
            startDate: trimQuotes(searchParams.get('startDate') || '') || undefined,
            endDate: trimQuotes(searchParams.get('endDate') || '') || undefined,
            idToken
        };

        const promise = fetchTransactions({ ...query }).then((response) => {

            const transactionsPromise: Promise<Transaction[]> = response.data;

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                transactionsPromise,
                metadata,
                query: { ...query, idToken: undefined }
            }

        });

        return {
            promise,
            query: { ...query, idToken: undefined }
        }

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }

}

export default function TransactionHistoryPage({ }: Props) {

    const loaderData = useLoaderData<typeof loader>();

    return (
        <article className="px-10 pb-4">
            <h1 className="text-2xl font-bold">Lịch sử giao dịch</h1>
            <p className="text-muted-foreground text-sm">Lịch sử các giao dịch ở Photon Piano liên quan đến vấn đề đào tạo như phí thi đầu vào,
                học phí,...
            </p>
            <SearchForm />
            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(loaderData.query)}>
                <Await resolve={loaderData.promise}>
                    {({ transactionsPromise }) => (
                        <Await resolve={transactionsPromise}>
                            <GenericDataTable columns={columns}
                                emptyText="Không có giao dịch nào." />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article>
    )
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}


export function ErrorBoundary() {

    const error = useRouteError();

    const { pathname, search } = useLocation();

    return (
        <article className="px-10 pb-4">
            <h1 className="text-2xl font-bold">Lịch sử giao dịch</h1>
            <p className="text-muted-foreground text-sm">Lịch sử các giao dịch ở Photon Piano liên quan đến vấn đề đào tạo như phí thi đầu vào,
                học phí,...
            </p>
            <SearchForm />
            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Có lỗi đã xảy ra.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                        flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Thử lại
                </Link>
            </div>
        </article>
    );
}

// function DescriptionEditor() {

//     const [description, setDescription] = useState('');

//     console.log({ description });

//     return <>

//         <RichTextEditor placeholder="Nhập mô tả..." value={description} onChange={setDescription} />

//         <textarea name="description" defaultValue={description} hidden />
//     </>
// }

