import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, isRouteErrorResponse, Link, useLoaderData, useLocation, useRouteError } from "@remix-run/react";
import { isAxiosError } from "axios";
import { RotateCcw, Send } from "lucide-react";
import { Suspense, useState } from "react";
import { getValidatedFormData } from "remix-hook-form";
import { columns } from "~/components/application/application-table";
import SearchForm from "~/components/application/search-form";
import SendApplicationDialog from "~/components/application/send-application-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import GenericDataTable from "~/components/ui/generic-data-table";
import { Skeleton } from "~/components/ui/skeleton";
import { fetchApplications, fetchSendApplication, fetchSendRefundApplication } from "~/lib/services/applications";
import { Role } from "~/lib/types/account/account";
import { Application, ApplicationType, sampleApplications, SendApplicationFormData, sendApplicationSchema } from "~/lib/types/application/application"
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

        if (role !== Role.Student) {
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

        if (isAxiosError(error) && error.response?.status === 401) {
            return {
                success: false,
                error: 'Email hoặc mật khẩu không đúng',
            }
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }

}

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Student) {
            return redirect('/');
        }

        // const { errors, data, receivedValues: defaultValues } =
        //     await getValidatedFormData<SendApplicationFormData>(request, zodResolver(sendApplicationSchema));

        // if (errors) {
        //     return { success: false, errors, defaultValues };
        // }

        // const formData = new FormData();

        // formData.append('type', data.type.toString());
        // formData.append('reason', data.reason);

        // if (data.file) {
        //     formData.append('file', data.file);
        // }

        const formData = await request.formData();

        // const id = formData.get('id') as string;
        // const status = formData.get('status') as string;

        console.log({ formData });

        const type = Number.parseInt(formData.get('type') as string);

        const response = type === ApplicationType.RefundTuition
            ? await fetchSendRefundApplication({ idToken, formData }) :
            await fetchSendApplication({ idToken, formData });

        return {
            success: response.status === 201,
        }


    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
            status
        }
    }
}

function TableHeaderContent() {

    const [isOpen, setIsOpen] = useState(false);

    return <>
        <Button type="button" variant={'default'}
            Icon={Send} iconPlacement="left" onClick={() => setIsOpen(!isOpen)}>
            Gửi đơn mới
        </Button>
        <SendApplicationDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
}

export default function AccountApplicationsPage({ }: Props) {

    const { promise, query, role } = useLoaderData<typeof loader>();

    return (
        <article className="px-8">

            <h1 className="text-xl font-extrabold">Danh sách đơn từ</h1>
            <p className="text-muted-foreground">
                Quản lý lịch sử đơn từ, thủ tục đã gửi
            </p>

            <SearchForm />

            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={promise}>
                    {(data) => (
                        <Await resolve={data?.applicationsPromise}>
                            <GenericDataTable
                                columns={role === Role.Staff ? columns : columns.filter((col) => col.id !== 'actions')}
                                metadata={data?.metadata!}
                                extraHeaderContent={<TableHeaderContent />}
                            />
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
            <h1 className="text-xl font-extrabold">Danh sách đơn từ</h1>
            <p className="text-muted-foreground">
                Quản lý lịch sử đơn từ, thủ tục đã gửi
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