import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, isRouteErrorResponse, Link, useLoaderData, useLocation, useRouteError } from "@remix-run/react";
import { RotateCcw } from "lucide-react";
import { Suspense } from "react";
import { getValidatedFormData } from "remix-hook-form";
import { z } from "zod";
import { columns } from "~/components/application/application-table";
import SearchForm from "~/components/application/search-form";
import { buttonVariants } from "~/components/ui/button";
import GenericDataTable from "~/components/ui/generic-data-table";
import { Skeleton } from "~/components/ui/skeleton";
import { fetchApplications, fetchUpdateApplicationStatus } from "~/lib/services/applications";
import { Role } from "~/lib/types/account/account";
import { Application, sampleApplications } from "~/lib/types/application/application"
import { PaginationMetaData } from "~/lib/types/pagination-meta-data";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { getParsedParamsArray, trimQuotes } from "~/lib/utils/url";

type Props = {}

async function getSampleApplications() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return sampleApplications;
}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            q: trimQuotes(searchParams.get('q') || ''),
            types: getParsedParamsArray({ paramsValue: searchParams.get('types') }).map(Number),
            statuses: getParsedParamsArray({ paramsValue: searchParams.get('statuses') }).map(Number),
            idToken
        };

        const promise = fetchApplications({ ...query }).then((response) => {

            const applicationsPromise: Promise<Application[]> = response.data;

            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                applicationsPromise,
                metadata,
                query
            };
        });

        return {
            promise,
            query,
            role
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

const schema = z.object({
    id: z.string().nonempty({ message: 'Id is required' }),
    note: z.string().optional(),
    status: z.number()
});

type ServerFormData = z.infer<typeof schema>;

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<ServerFormData>(request, zodResolver(schema));

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchUpdateApplicationStatus({ idToken, id: data.id, status: data.status, note: data.note });

        return Response.json({
            success: true
        }, {
            status: 200
        })

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        })
    }

}

export default function StaffApplicationsPage({ }: Props) {

    const { promise, query, role } = useLoaderData<typeof loader>();

    return (
        <article className="px-8">

            <h1 className="text-xl font-extrabold">List of academic applications</h1>
            <p className="text-muted-foreground">
                Manage the list of applications and procedures of learners
            </p>

            <SearchForm />

            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={promise}>
                    {(data) => (
                        <Await resolve={data?.applicationsPromise}>
                            <GenericDataTable
                                columns={role === Role.Staff ? columns : columns.filter((col) => col.id !== 'actions')}
                                metadata={data?.metadata!} />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article>
    );
};

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}

export function ErrorBoundary() {

    const error = useRouteError();

    const { pathname, search } = useLocation();

    return (
        <article className="px-8">
            <h1 className="text-xl font-extrabold">List of academic applications</h1>
            <p className="text-muted-foreground">
                Manage the list of applications and procedures of learners
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
                    <RotateCcw /> Retry
                </Link>
            </div>

        </article>
    );
}