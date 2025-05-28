import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '~/lib/services/article';
import { Article } from '~/lib/types/news/article';
import { Skeleton } from '../ui/skeleton';
import { EmptyNewsContent } from '~/routes/_main.news._index';
import { Link } from '@remix-run/react';

export function NewsSection() {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
            const response = await fetchArticles({
                pageSize: 3
            });

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false,
    });

    const articles = data ? data as Article[] : [];

    return isLoading ? <LoadingSkeleton /> : isError ? <div>Error loading articles</div> :

        articles.length > 0 ? <section className='py-24 overflow-hidden bg-gray-100'>
            <div className="max-w-6xl mx-auto px-4">
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                    {articles.map((article, index) => (
                        <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
                            <img
                                src={article.thumbnail || "/placeholder.svg"}
                                alt={article.title}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                {/* <div className="text-sm text-indigo-600 mb-2">{event.category}</div> */}
                                <Link className="font-semibold text-lg mb-2 line-clamp-2 hover:underline" to={`/news/${article.slug}`}>{article.title}</Link>

                                <Link
                                    to={`/news/${article.slug}`}
                                    className="inline-flex items-center text-indigo-600 hover:text-teal-500 transition-colors duration-300"
                                >
                                    Read more
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section> : <EmptyNewsContent />

}

function LoadingSkeleton() {
    return <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col space-y-3 ">
            <Skeleton className="h-[200px]  rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
        <div className="flex flex-col space-y-3 ">
            <Skeleton className="h-[200px]  rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
        <div className="flex flex-col space-y-3 ">
            <Skeleton className="h-[200px]  rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    </div>
}