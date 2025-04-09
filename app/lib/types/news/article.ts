import { Account } from "../account/account";

export type Article = {
    id: string;
    title: string;
    content: string;
    slug: string;
    thumbnail?: string;
    isPublished: boolean;
    createdById: string;
    createdAt: string;
    updatedAt?: string;
    publishedAt?: string;
};

export type ArticleDetails = {
    createdBy: Account;
    updatedBy?: Account;
} & Article;

export type CreateArticleRequest = Pick<Article, 'title' | 'content' | 'thumbnail' | 'isPublished'>;

export type UpdateArticleRequest = Partial<CreateArticleRequest> & {
    slug: string
};