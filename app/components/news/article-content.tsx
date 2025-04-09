import { Article } from '~/lib/types/news/article'
import DOMPurify from "isomorphic-dompurify";
import { Separator } from '../ui/separator';

type Props = {
    article: Article;
}

export default function ArticleContent({ article }: Props) {

    return (
        <article className=''>

            <h1 className="text-3xl font-bold my-3">{article.title}</h1>

            <Separator className='w-full'/>

            <div className="content" dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content)
            }}></div>

        </article>
    );
};