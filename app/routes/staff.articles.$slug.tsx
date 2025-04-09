import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useFetcher, useLoaderData } from '@remix-run/react';
import { CircleX, PencilLine } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import ArticleContent from '~/components/news/article-content';
import ArticleForm, { ArticleFormData, articleSchema } from '~/components/news/article-form';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchArticleBySlug, fetchUpdateArticle } from '~/lib/services/article';
import { Role } from '~/lib/types/account/account';
import { ArticleDetails } from '~/lib/types/news/article';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {

        const { role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const slug = params.slug as string;

        if (!slug) {
            return redirect('/staff/articles');
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

export async function action({ request, params }: ActionFunctionArgs) {
    try {

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const slug = params.slug as string;

        if (!slug) {
            return redirect('/staff/articles');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<Partial<ArticleFormData>>(request, zodResolver(articleSchema.optional()));

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchUpdateArticle({ ...data, idToken, slug });

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
            error: message
        }, {
            status
        })
    }
}

export default function StaffArticleDetailsPage({ }: Props) {

    const { promise, slug } = useLoaderData<typeof loader>();

    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className='px-10'>

            <div className="flex justify-end">
                <Button type='button' size={'icon'} variant={'outline'} className='rounded-full'
                    onClick={() => setIsEditing(!isEditing)}>
                    {!isEditing ? <PencilLine /> : <CircleX />}
                </Button>
            </div>

            <Suspense fallback={<LoadingSkeleton />} key={slug}>
                <Await resolve={promise}>
                    {({ articlePromise }) => (
                        <Await resolve={articlePromise}>
                            {(article) => (
                                <ArticleDetailsContent article={article} isEditing={isEditing} />
                            )}
                        </Await>
                    )}
                </Await>
            </Suspense>

        </div>
    );
};

function ArticleDetailsContent({
    article,
    isEditing
}: {
    article: ArticleDetails;
    isEditing: boolean;
}) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Cập nhật bài viết thành công!');
            return;
        }
        
        if (fetcher.data?.success === false) {
            toast.error(fetcher.data.error);
            return;
        }

        return () => {
            
        }
    }, [fetcher.data]);


    return !isEditing ? <ArticleContent article={article} />
        : <ArticleForm {...article} fetcher={fetcher} isSubmitting={isSubmitting} isEdit={true} />
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}