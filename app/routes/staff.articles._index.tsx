import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, isRouteErrorResponse, Link, useAsyncValue, useLoaderData, useLocation, useNavigate, useRouteError } from '@remix-run/react';
import { PencilLine, PenSquare, RotateCcw, Search } from 'lucide-react';
import { Suspense, useState } from 'react'
import ArticleCard from '~/components/news/article-card';
import { columns } from '~/components/news/news-table';
import ViewToggle, { ViewType } from '~/components/table/view-toggler';
import { Button, buttonVariants } from '~/components/ui/button';
import GenericDataTable from '~/components/ui/generic-data-table';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchArticles, fetchDeleteArticle } from '~/lib/services/article';
import { Role } from '~/lib/types/account/account';
import { Article } from '~/lib/types/news/article';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Staff) {
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

        const promise = fetchArticles({ ...query }).then((response) => {
            const articlesPromise: Promise<Article[]> = response.data;

            const headers = response.headers;

            const metadata = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '10'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                articlesPromise,
                metadata,
                query
            };
        });

        return {
            promise,
            query
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


export async function action({ request }: ActionFunctionArgs) {
    try {

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const formData = await request.formData();

        const slug = formData.get('slug') as string;

        if (!slug) {
            throw new Error('Slug is required');
        }

        const response = await fetchDeleteArticle({ slug, idToken });

        return Response.json({
            success: true
        }, {
            status: 200
        });

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message
        }, {
            status
        });
    }
}

export default function NewsManagementPage({ }: Props) {

    const { promise, query } = useLoaderData<typeof loader>();

    const navigate = useNavigate();

    const [currentView, setCurrentView] = useState<ViewType>("table")

    return (
        <article className='px-10'>

            <div className="flex items-center gap-3 mb-4">
                <PenSquare className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Manage News</h3>
                    <p className="text-sm text-sky-600">Manage news and articles on the website</p>
                </div>
            </div>
            <SearchForm />

            <div className="flex flex-row justify-between w-full my-5">
                <ViewToggle defaultView={currentView} onViewChange={setCurrentView} />
                <Button type='button' variant={'outline'} Icon={PencilLine}
                    iconPlacement='left' onClick={() => navigate('/staff/articles/create')}>
                    Create new article
                </Button>
            </div>

            <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={promise}>
                    {({ articlesPromise, metadata }) => (
                        <Await resolve={articlesPromise}>
                            {currentView === 'table' ? <GenericDataTable
                                columns={columns}
                                metadata={metadata}
                                emptyText='No articles found.'
                            /> : <ArticleCardsList />}

                        </Await>
                    )}
                </Await>
            </Suspense>

        </article>
    );
};

function ArticleCardsList() {

    const articles = useAsyncValue() as Article[];

    return <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
        {articles.map((article) => (
            <ArticleCard {...article} hasPublishBadge={true} key={article.id} hasAuth={true} />
        ))}
    </div>
}

function SearchForm() {

    return <Form method='GET' className='flex flex-row gap-2 items-center my-3'>
        <Input name='q' placeholder='Search here...' type='text' />
        <Button type='submit' Icon={Search} iconPlacement='left'>
            Search
        </Button>
    </Form>
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
        <article className="px-8">
            <h3 className="text-lg font-bold">Manage news</h3>
            <p className="text-sm text-muted-foreground">
                Manage news and articles on the website
            </p>
            <SearchForm />

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