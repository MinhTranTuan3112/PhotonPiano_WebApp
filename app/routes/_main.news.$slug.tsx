import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useAsyncValue, useLoaderData } from '@remix-run/react';
import { Home, Newspaper, Slash } from 'lucide-react';
import React, { Suspense } from 'react'
import ArticleContent from '~/components/news/article-content';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '~/components/ui/breadcrumb';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchArticleBySlug } from '~/lib/services/article';
import { ArticleDetails } from '~/lib/types/news/article';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {

        const slug = params.slug as string;

        if (!slug) {
            return redirect('/news');
        }

        const promise = fetchArticleBySlug({ slug }).then((response) => {
            const articlePromise: Promise<ArticleDetails> = response.data;

            return {
                articlePromise
            };
        });

        return {
            promise,
            slug
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

export default function NewDetailsPage({ }: Props) {

    const { promise, slug } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <Suspense fallback={<LoadingSkeleton />} key={slug}>
                <Await resolve={promise}>
                    {({ articlePromise }) => (
                        <Await resolve={articlePromise}>
                            <ArticleDetailsContent />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article>
    )
}

function ArticleDetailsContent() {
    const article = useAsyncValue() as ArticleDetails;

    return <>
        <Breadcrumb className='my-5'>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <Home className='size-4' />
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <Slash />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                    <Newspaper className='size-4'/>
                    <BreadcrumbLink href="/news">News</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <Slash />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                    <BreadcrumbPage className='font-bold'>{article.title}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <ArticleContent article={article} hasPublishStatusDisplay={false} />
    </>
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}