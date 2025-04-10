import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Calendar, ChevronRight, Clock, Search, Bookmark, ThumbsUp, MessageCircle } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import styles from '../components/home/animation.module.css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import placeholderImg from '../lib/assets/images/placeholder.jpg'
import { LoaderFunctionArgs } from "@remix-run/node"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { fetchArticles } from "~/lib/services/article"
import { Article } from "~/lib/types/news/article"
import { Await, Form, useAsyncValue, useLoaderData, useNavigate } from "@remix-run/react"
import { Skeleton } from "~/components/ui/skeleton"
import ArticleCard from "~/components/news/article-card"
import DOMPurify from "isomorphic-dompurify";
import { PaginationMetaData } from "~/lib/types/pagination-meta-data"

// const categories = [
//     { id: "all", label: "Tất cả" },
//     { id: "entrance-exams", label: "Thi đầu vào" },
//     { id: "tips", label: "Mẹo chơi Piano" },

// ]

// const newsItems = [
//     {
//         id: 1,
//         title: "Lịch thi đầu vào xếp lớp mới nhất 2025",
//         excerpt: "Trung tâm Photon Piano cung cấp lịch thi xếp lớp mới nhất...",
//         category: "entrance-exams",
//         date: "15/12/2023",
//         readTime: "5 phút đọc",
//         likes: 120,
//         comments: 45,
//     },
//     {
//         id: 2,
//         title: "10 kỹ năng cần thiết cho lái xe an toàn trên đường cao tốc",
//         excerpt: "Lái xe trên đường cao tốc đòi hỏi sự tập trung và kỹ năng đặc biệt. Dưới đây là 10 kỹ năng quan trọng...",
//         category: "tips",
//         date: "10/12/2023",
//         readTime: "8 phút đọc",
//         likes: 89,
//         comments: 23,
//     },
//     {
//         id: 3,
//         title: "Hướng dẫn bảo dưỡng xe ô tô định kỳ cho người mới",
//         excerpt: "Bảo dưỡng xe đúng cách không chỉ giúp xe của bạn hoạt động tốt hơn mà còn kéo dài tuổi thọ của xe...",
//         category: "tips",
//         date: "05/12/2023",
//         readTime: "6 phút đọc",
//         likes: 56,
//         comments: 12,
//     },
//     {
//         id: 4,
//         title: "Chiến dịch an toàn đường bộ mới được triển khai trên toàn quốc",
//         excerpt: "Chính phủ vừa phát động chiến dịch an toàn đường bộ mới nhằm giảm thiểu tai nạn giao thông...",
//         category: "tips",
//         date: "01/12/2023",
//         readTime: "4 phút đọc",
//         likes: 78,
//         comments: 34,
//     },
//     {
//         id: 5,
//         title: "Cập nhật luật giao thông: Tăng mức phạt đối với hành vi lái xe sau khi uống rượu bia",
//         excerpt: "Quốc hội vừa thông qua đề xuất tăng mức phạt đối với hành vi lái xe sau khi sử dụng rượu bia...",
//         category: "entrance-exams",
//         date: "28/11/2023",
//         readTime: "7 phút đọc",
//         likes: 145,
//         comments: 67,
//     },
//     {
//         id: 6,
//         title: "5 bài tập giúp cải thiện kỹ năng lái xe trong điều kiện thời tiết xấu",
//         excerpt: "Lái xe trong điều kiện thời tiết xấu như mưa lớn hoặc sương mù đòi hỏi kỹ năng đặc biệt. Dưới đây là 5 bài tập giúp bạn cải thiện...",
//         category: "tips",
//         date: "25/11/2023",
//         readTime: "6 phút đọc",
//         likes: 92,
//         comments: 18,
//     },
// ]

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const { searchParams } = new URL(request.url);

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'Id',
            orderByDesc: searchParams.get('desc') === 'true' ? true : false,
            keyword: searchParams.get('q') || undefined,
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

export default function NewsPage() {

    const { promise, query } = useLoaderData<typeof loader>();

    const [isLoaded, setIsLoaded] = useState(false);
    // const [activeCategory, setActiveCategory] = useState("all");

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">

            <main className="container mx-auto px-4 py-8 mt-20">
                <div className="container mx-auto px-4 py-8">
                    <h1 className={`text-4xl font-bold mb-8 ${styles.animateFadeIn}`}>Tin Tức Trung Tâm Photon Piano</h1>

                    {/* Hero Section */}


                    <Suspense fallback={<LoadingSkeleton />} key={JSON.stringify(query)}>
                        <Await resolve={promise}>
                            {({ articlesPromise, metadata }) => (
                                <Await resolve={articlesPromise}>
                                    <ArticlesContent metadata={metadata} />
                                </Await>
                            )}
                        </Await>
                    </Suspense>

                    {/* News Categories and Articles */}
                    {/* <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveCategory}>
                        <TabsList className={styles.animateFadeIn} style={{ animationDelay: '0.4s' }}>
                            {categories.map((category) => (
                                <TabsTrigger
                                    key={category.id}
                                    value={category.id}
                                    className="transition-all duration-300 hover:bg-blue-100"
                                >
                                    {category.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {categories.map((category) => (
                            <TabsContent key={category.id} value={category.id}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {newsItems
                                        .filter(item => category.id === "all" || item.category === category.id)
                                        .map((item, index) => (
                                            <div key={item.id} className={`${isLoaded ? styles.animateSlideIn : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>

                                            </div>
                                            // <Card key={item.id} className={`transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${isLoaded ? styles.animateSlideIn : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                                            //     <CardHeader>
                                            //         <img src={`${placeholderImg}`}  alt={item.title} className="w-full h-48 object-cover rounded-t-lg mb-4 transition-transform duration-300 transform hover:scale-105" />
                                            //         <CardTitle className="cursor-pointer hover:text-blue-600 transition-colors duration-300">{item.title}</CardTitle>
                                            //         <CardDescription>{item.excerpt}</CardDescription>
                                            //     </CardHeader>
                                            //     <CardContent>
                                            //         <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            //             <span className="flex items-center">
                                            //                 <Calendar className="mr-1 h-4 w-4" />
                                            //                 {item.date}
                                            //             </span>
                                            //             <span className="flex items-center">
                                            //                 <Clock className="mr-1 h-4 w-4" />
                                            //                 {item.readTime}
                                            //             </span>
                                            //         </div>
                                            //     </CardContent>
                                            //     <CardFooter className="flex justify-between items-center">
                                            //         <div className="flex space-x-4">
                                            //             <span className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                                            //                 <ThumbsUp className="mr-1 h-4 w-4" />
                                            //                 {item.likes}
                                            //             </span>
                                            //             <span className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                                            //                 <MessageCircle className="mr-1 h-4 w-4" />
                                            //                 {item.comments}
                                            //             </span>
                                            //         </div>
                                            //         <Button variant="ghost" size="sm" className="hover:bg-blue-100 transition-colors duration-300">
                                            //             <Bookmark className="mr-2 h-4 w-4" />
                                            //             Lưu
                                            //         </Button>
                                            //     </CardFooter>
                                            // </Card>
                                        ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs> */}

                    {/* Newsletter Signup */}
                    <Card className={`mt-12 ${styles.animateFadeIn}`} style={{ animationDelay: '0.6s' }}>
                        <CardHeader>
                            <CardTitle>Đăng Ký Nhận Tin</CardTitle>
                            <CardDescription>Nhận những tin tức mới nhất về trung tâm Photon Piano</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="flex space-x-2">
                                <Input type="email" placeholder="Email của bạn" className="flex-grow transition-all duration-300 focus:ring-2 focus:ring-blue-400" />
                                <Button type="submit" className="transition-colors duration-300 hover:bg-blue-700">Đăng Ký</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function ArticlesContent({
    metadata
}: {
    metadata: PaginationMetaData;
}) {
    const articles = useAsyncValue() as Article[];

    const topArticle = articles[0];

    const navigate = useNavigate();

    return <>
        <div className={`relative rounded-lg overflow-hidden mb-12 group ${styles.animateFadeIn}`}>
            <img src={`${topArticle.thumbnail || placeholderImg}`} alt="Hero image" className="w-full h-[400px] object-cover transition-transform duration-300 transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <h2 className="text-3xl font-bold mb-2">{topArticle.title}</h2>
                <p className="mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-1"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(topArticle.content.slice(0, 100))
                    }}>
                </p>
                <Button type="button" variant="secondary" className="group-hover:bg-white group-hover:text-black transition-colors duration-300"
                    onClick={() => navigate(`/news/${topArticle.slug}`)}>
                    Đọc ngay <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
            </div>
        </div>

        {/* Search Bar */}
        <div className={`mb-8 ${styles.animateFadeIn}`} style={{ animationDelay: '0.2s' }}>
            <Form method="GET" className="relative" preventScrollReset={true}>
                <Input type="search" name="q" placeholder="Tìm kiếm tin tức..." className="pl-10 pr-4 py-2 w-full transition-all duration-300 focus:ring-2 focus:ring-blue-400" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </Form>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
                <ArticleCard {...article} hasPublishBadge={false} key={article.id} hasAuth={false} />
            ))}
        </div>


    </>
};

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}