import { ArticleDetails } from '~/lib/types/news/article'
import DOMPurify from "isomorphic-dompurify";
import { Separator } from '../ui/separator';
import PlaceholderImage from '../../lib/assets/images/placeholder.jpg'
import { CalendarIcon, Link, User } from 'lucide-react';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { PublishBadge } from './news-table';

type Props = {
    article: ArticleDetails;
    hasPublishStatusDisplay?: boolean;
}

export default function ArticleContent({ article, hasPublishStatusDisplay = false }: Props) {

    return (
        <section className="min-h-screen bg-background">

            {hasPublishStatusDisplay && (
                <div className="flex justify-end my-3 ">
                    <PublishBadge isPublished={article.isPublished} />
                </div>
            )}
            {/* Hero section */}
            <div className="w-full bg-muted py-12 md:py-16 lg:py-20">
                <div className="container px-4 md:px-6">
                    <div className="mx-auto max-w-3xl text-center">
                        {/* <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">{article.category}</p> */}
                        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{article.title}</h1>
                        {/* <p className="text-xl text-muted-foreground md:text-2xl">{article.subtitle}</p> */}
                    </div>
                </div>
            </div>

            {/* Article content */}
            <div className="container px-4 py-8 md:px-6 md:py-12">
                <div className="mx-auto max-w-4xl">
                    {/* Article meta */}
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                {!article.createdBy.avatarUrl ? <User className="h-5 w-5" />
                                    : <>
                                        <Avatar>
                                            <AvatarImage src={article.createdBy.avatarUrl} alt={article.createdBy.fullName || article.createdBy.email} />
                                            <AvatarFallback>{article.createdBy.fullName || article.createdBy.email}</AvatarFallback>
                                        </Avatar>
                                    </>}

                            </div>
                            <div>
                                <p className="text-sm font-medium">{article.createdBy.fullName || article.createdBy.email}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{formatRFC3339ToDisplayableDate(article.publishedAt || article.createdAt, false)}</span>
                            </div>
                            {/* <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{article.readingTime}</span>
                            </div> */}
                        </div>
                    </div>

                    {/* Featured image */}
                    <div className="mb-8 overflow-hidden rounded-lg">
                        <img
                            src={article.thumbnail || PlaceholderImage}
                            alt={article.title}
                            width={1200}
                            height={600}
                            className="w-full object-cover"
                        />
                    </div>

                    <Separator className="mb-8" />

                    {/* Article body */}
                    <article className="prose prose-lg dark:prose-invert mx-auto max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
                    </article>

                    <Separator className="my-8" />

                    {/* Article footer */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-semibold">Chia sẻ bài viết này</h3>
                        <div className="flex gap-4">
                            <Button className="inline-flex h-10 items-center justify-center rounded-full px-2"
                                type='button' size={'icon'} variant={'outline'}>
                                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" /></svg>
                            </Button>
                            <Button className="inline-flex h-10 items-center justify-center rounded-full px-2"
                                type='button' size={'icon'} variant={'outline'} onClick={async () => {
                                    await navigator.clipboard.writeText(window.location.href);
                                    toast.success('Đã sao chép liên kết bài viết vào clipboard!', {
                                        position: 'top-center',
                                        duration: 1250
                                    })
                                }}>
                                <Link className='text-black' />
                            </Button>
                            {/* <button className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium transition-colors hover:bg-muted/80">
                                Twitter
                            </button>
                            <button className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium transition-colors hover:bg-muted/80">
                                LinkedIn
                            </button> */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};