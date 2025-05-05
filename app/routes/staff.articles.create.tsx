
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { useFetcher } from '@remix-run/react';
import { PenBox } from 'lucide-react';
import { useEffect } from 'react';
import { getValidatedFormData } from 'remix-hook-form';
import { toast } from 'sonner';
import ArticleForm, { ArticleFormData, articleSchema } from '~/components/news/article-form'
import { Separator } from '~/components/ui/separator'
import { fetchCreateArticle } from '~/lib/services/article';
import { Role } from '~/lib/types/account/account';
import { requireAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { toastWarning } from '~/lib/utils/toast-utils';

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
            toastWarning(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);


    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <PenBox className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Create new article</h3>
                    <p className="text-sm text-sky-600">Create new article for the website</p>
                </div>
            </div>
            <Separator className='w-full my-3' />

            <ArticleForm fetcher={fetcher} isSubmitting={isSubmitting} />

        </article>
    )
}