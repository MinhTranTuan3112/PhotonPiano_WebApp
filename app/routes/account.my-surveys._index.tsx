import {LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Await, Form, isRouteErrorResponse, Link, useLoaderData, useLocation, useRouteError, useSearchParams } from "@remix-run/react";
import {  RotateCcw, Search } from "lucide-react";
import { Suspense } from "react";
import { columns } from "~/components/survey/survey-table";
import { Button, buttonVariants } from "~/components/ui/button";
import GenericDataTable from "~/components/ui/generic-data-table";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {  fetchSurveys } from "~/lib/services/survey";
import { Role } from "~/lib/types/account/account";
import { PaginationMetaData } from "~/lib/types/pagination-meta-data";
import { Survey } from "~/lib/types/survey/survey";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Student) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            keyword: searchParams.get('q') || undefined,
            idToken
        };

        const promise = fetchSurveys({ ...query }).then((response) => {
            const surveysPromise: Promise<Survey[]> = response.data;

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                surveysPromise,
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


function SearchForm() {

    const [searchParams, setSearchParams] = useSearchParams();

    return <Form method="GET" className="my-4 flex flex-row gap-3">
        <Input placeholder="Search surveys here..." name="q"
            defaultValue={searchParams.get('q') || undefined} />

        <Button type="submit" Icon={Search} iconPlacement="left">Search</Button>
    </Form>
}

export default function SurveyHistoryPage({ }: Props) {

    const { promise, query } = useLoaderData<typeof loader>();


    return (
        <article className="px-10">
            <h3 className="text-lg font-bold">Survey history</h3>
            <p className="text-sm text-muted-foreground">
                View the history of surveys you have taken.
            </p>

            <SearchForm />

            <Suspense key={JSON.stringify(query)} fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ surveysPromise, metadata }) => (
                        <Await resolve={surveysPromise}>
                            <GenericDataTable
                                columns={columns}
                                metadata={metadata}
                                emptyText="No surveys found."
                            />
                        </Await>
                    )}
                </Await>
            </Suspense>

        </article>
    );
}

export function ErrorBoundary() {

    const error = useRouteError();

    const { pathname, search } = useLocation();

    return (
        <article className="px-8">
            <h3 className="text-lg font-bold">Survey history</h3>
            <p className="text-sm text-muted-foreground">
                View the history of surveys you have taken.
            </p>

            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Error.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                        flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Retry
                </Link>
            </div>
        </article>
    );
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
