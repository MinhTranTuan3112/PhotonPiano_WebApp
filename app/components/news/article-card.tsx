import { Article } from '~/lib/types/news/article'
import DOMPurify from "isomorphic-dompurify";
import { Role } from '~/lib/types/account/account';
import PlaceholderImage from '../../lib/assets/images/placeholder.jpg'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Calendar, ChevronsRight } from 'lucide-react';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import { useNavigate } from '@remix-run/react';
import { PublishBadge } from './news-table';

type Props = {
    role: Role;
} & Article;

export default function ArticleCard({ thumbnail, content, title, slug, isPublished, createdAt, role }: Props) {

    const navigate = useNavigate();

    return (
        <Card className={`transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer relative`}
            onClick={() => navigate(`/staff/articles/${slug}`)}>
            <CardHeader>
                <img src={thumbnail || PlaceholderImage} alt={title} className="w-full h-48 object-cover rounded-t-lg mb-4 transition-transform duration-300 transform hover:scale-105" />
                <CardTitle className="cursor-pointer hover:text-blue-600 transition-colors duration-300">{title}</CardTitle>
                <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {formatRFC3339ToDisplayableDate(createdAt, false)}
                    </span>
                    {role === Role.Staff && (
                        <PublishBadge isPublished={isPublished} />
                    )}
                    {/* <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {item.readTime}
                    </span> */}
                </div>
            </CardContent>
            <ChevronsRight className='absolute bottom-3 right-3 size-10 animate-bounce' />
            {/* <CardFooter className="flex justify-between items-center">
                <div className="flex space-x-4">
                
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-blue-100 transition-colors duration-300">
                <Bookmark className="mr-2 h-4 w-4" />
                Lưu
                </Button>
            </CardFooter> */}
        </Card>
    )
}