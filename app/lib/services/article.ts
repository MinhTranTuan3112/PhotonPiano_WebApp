import { CreateArticleRequest, UpdateArticleRequest } from "../types/news/article";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchArticles({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    keyword,
    isPublished,
    idToken
}: {
} & Partial<QueryPagedRequest & {
    keyword: string,
    isPublished: boolean,
    idToken: string
}>) {
    let url = `/articles?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (keyword) {
        url += `&q=${keyword}`;
    }

    if (isPublished) {
        url += `&published=${isPublished ? 'true' : 'false'}`;
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchArticleBySlug({
    slug
}: {
    slug: string
}) {

    const response = await axiosInstance.get(`/articles/${slug}`);

    return response;
}

export async function fetchCreateArticle({
    idToken,
    ...data
}: {
    idToken: string
} & CreateArticleRequest) {

    const response = await axiosInstance.post(`/articles`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateArticle({
    idToken,
    slug,
    ...data
}: {
    idToken: string
} & UpdateArticleRequest) {

    const response = await axiosInstance.put(`/articles/${slug}`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchDeleteArticle({
    idToken,
    slug
}: {
    idToken: string;
    slug: string;
}) {

    const response = await axiosInstance.delete(`/articles/${slug}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
    
}