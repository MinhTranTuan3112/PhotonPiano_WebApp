
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import ArticleForm, { ArticleFormData, articleSchema } from '~/components/news/article-form'
import { Separator } from '~/components/ui/separator'
import { fetchCreateArticle } from '~/lib/services/article';
import { Role } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

export async function action({ request }: LoaderFunctionArgs) {
    try {

        const { role, idToken } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<ArticleFormData>(request, zodResolver(articleSchema));

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchCreateArticle({ ...data, idToken });

        if (response.status === 201) {
            return redirect('/staff/articles');
        }

        throw new Error('Không thể tạo bài viết mới!');

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

export default function CreateArticlePage({ }: Props) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === false) {
            toast.error(fetcher.data.error);
            return;
        }

        return () => {
            
        }

    }, [fetcher.data]);


    return (
        <article className='px-10'>
            <h3 className="text-lg font-bold">Tạo bài viết mới</h3>
            <p className="text-sm text-muted-foreground">
                Tạo bài viết mới cho trang web
            </p>

            <Separator className='w-full my-3' />

            <ArticleForm fetcher={fetcher} isSubmitting={isSubmitting} />

        </article>
    )
}